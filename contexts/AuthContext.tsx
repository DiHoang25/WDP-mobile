import { authService } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";
import { User } from "@/types";
import { apiClient } from "@/utils/api";
import { getRoleNameByRoleId } from "@/utils/roleHelper";
import { storage } from "@/utils/storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setPoints, fetchPoints } from "@/store/slices/userSlice";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (userData: Partial<User> & { password?: string }) => Promise<{ success: boolean; error?: string }>;
  updateUser: (user: User) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshPoints: () => Promise<void>;
  pendingPayment: { referenceCode: string; amount: number } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPayment, setPendingPayment] = useState<{ referenceCode: string; amount: number } | null>(null);
  const dispatch = useDispatch();

  // Load user and token on app start
  useEffect(() => {
    loadStoredAuth();
    // Register unauthorized callback for auto-logout
    apiClient.registerOnUnauthorized(logout);
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedUser, token] = await Promise.all([
        storage.getUser(),
        storage.getToken(),
      ]);

      if (storedUser && token) {
        setUser(storedUser);
        if (storedUser.points !== undefined) {
          dispatch(setPoints(storedUser.points));
        }
        apiClient.setToken(token);

        // If enterprise, check for pending subscription
        if (storedUser.roleId === 2) {
          checkSubscriptionStatus();
        }
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const { businessService } = await import("@/services/business.service");
      const response = await businessService.getSubscription();
      if (response.success && response.data) {
        const sub = response.data;
        // Logic: If status is PENDING and has a payment reference
        if (sub.status === "PENDING" && sub.payment?.referenceCode) {
          setPendingPayment({
            referenceCode: sub.payment.referenceCode,
            amount: sub.payment.amount
          });
        } else {
          setPendingPayment(null);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  // Centralized user data normalization
  const normalizeUser = (serverData: any, existingUser?: User | null): User => {
    const data = serverData?.data ?? serverData;
    const userData = data?.user || (data?.accessToken ? data : data);

    const roleId = userData.roleId || existingUser?.roleId || 1;
    const roleName = getRoleNameByRoleId(roleId);

    const normalized: User = {
      ...existingUser,
      ...userData,
      id: (userData.id || existingUser?.id || "unknown").toString(),
      roleId: roleId,
      role: roleName as any,
      name: userData.name || userData.fullName || existingUser?.name || userData.email || "",
      email: userData.email || existingUser?.email || "",
      phone: userData.phone || existingUser?.phone || "",
      address: userData.address || (userData as any).location || existingUser?.address || "",
    };

    return normalized;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.login(email, password);
      if (response.success && response.data) {
        const raw = response.data as any;
        const data = raw?.data ?? raw;

        // Backend tokens are in backendToken property
        const accessToken = data?.backendToken?.accessToken || data?.accessToken;

        if (!accessToken) {
          console.error("Missing accessToken in response", data);
          return { success: false, error: "Lỗi hệ thống: Không tìm thấy token" };
        }

        const normalizedUser = normalizeUser(response.data);

        // Save to state
        setUser(normalizedUser);
        if (normalizedUser.points !== undefined) {
          dispatch(setPoints(normalizedUser.points));
        }

        // Save to storage
        const savePromises = [
          storage.saveUser(normalizedUser),
          storage.saveToken(accessToken),
        ];

        await Promise.all(savePromises);
        apiClient.setToken(accessToken);

        // Check subscription for enterprise
        if (normalizedUser.roleId === 2) {
          await checkSubscriptionStatus();
        }

        return { success: true };
      }

      console.error("Login failed:", response.error);
      return { success: false, error: response.error };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "Lỗi kết nối server" };
    }
  };

  const logout = async () => {
    try {
      // Call logout service (may fail if token expired - that's OK)
      await authService.logout().catch(() => { });
    } catch (error) {
      console.error("Logout API error:", error);
    }

    // Always clear state and storage regardless of API result
    setUser(null);
    apiClient.setToken(null);
    try {
      await storage.clearAll();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  };

  const register = async (userData: Partial<User> & { password?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const signupData: any = {
        email: userData.email || "",
        password: userData.password || "",
        fullName: userData.name || "",
        phone: userData.phone || "",
      };

      if ((userData as any).address) signupData.address = (userData as any).address;
      if ((userData as any).latitude) signupData.latitude = (userData as any).latitude;
      if ((userData as any).longitude) signupData.longitude = (userData as any).longitude;

      const response = await authService.signup(signupData);

      if (response.success) {
        // Registration successful. According to user requirement, 
        // we don't log in automatically anymore.
        return { success: true };
      }

      console.error("Registration failed:", response.error);
      return { success: false, error: response.error };
    } catch (error: any) {
      console.error("Registration error:", error);
      return { success: false, error: error.message || "Lỗi kết nối server" };
    }
  };

  const updateUser = async (updatedUser: User) => {
    const normalized = normalizeUser(updatedUser, user);
    setUser(normalized);
    await storage.saveUser(normalized);
  };

  const refreshProfile = async () => {
    try {
      const response = await profileService.getProfile();
      if (response.success && response.data) {
        const normalizedUser = normalizeUser(response.data, user);
        setUser(normalizedUser);
        if (normalizedUser.points !== undefined) {
          dispatch(setPoints(normalizedUser.points));
        }
        await storage.saveUser(normalizedUser);
      }
    } catch (error) {
      console.error("Refresh profile error:", error);
    }
  };

  const refreshPoints = async () => {
    try {
      dispatch(fetchPoints() as any);
    } catch (error) {
      console.error("Refresh points error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        updateUser,
        refreshProfile,
        refreshPoints,
        pendingPayment,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
