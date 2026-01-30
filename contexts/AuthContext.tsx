import { authService } from "@/services/auth.service";
import { User } from "@/types";
import { apiClient } from "@/utils/api";
import { getRoleNameByRoleId } from "@/utils/roleHelper";
import { storage } from "@/utils/storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and token on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedUser, token] = await Promise.all([
        storage.getUser(),
        storage.getToken(),
      ]);

      if (storedUser && token) {
        setUser(storedUser);
        apiClient.setToken(token);
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login(email, password);
      console.log(response)
      if (response.success && response.data) {
        // Backend currently returns:
        // {
        //   success,
        //   statusCode,
        //   message,
        //   data: {
        //     user: { ... },
        //     backendToken: {
        //       accessToken,
        //       refreshToken,
        //       expiresIn
        //     }
        //   }
        // }
        const raw = response.data as any;
        const data = raw?.data ?? raw;

        // Backend tokens are in backendToken property
        const accessToken = data?.backendToken?.accessToken || data?.accessToken;
        const userData = data?.user || (data?.accessToken ? data : null);

        if (!userData || !accessToken) {
          console.error("Missing user or accessToken in response", {
            data,
            rawResponse: response.data,
          });
          return false;
        }

        // Normalize user data: ensure roleId and role are properly set
        const roleId = userData.roleId || 1;
        const roleName = getRoleNameByRoleId(roleId);

        const normalizedUser: User = {
          ...userData,
          id: userData.id?.toString() || "unknown",
          roleId: roleId,
          role: roleName as any,
          name: userData.name || userData.fullName || userData.email || "",
          email: userData.email || "",
          phone: userData.phone || "",
        };

        // Save to state
        setUser(normalizedUser);

        // Save to storage - only save what exists
        const savePromises = [
          storage.saveUser(normalizedUser),
          storage.saveToken(accessToken),
        ];

        await Promise.all(savePromises);

        // Set token for API client
        apiClient.setToken(accessToken);

        return true;
      }

      console.error("Login failed:", response.error);
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call logout service
      await authService.logout();

      // Clear state
      setUser(null);

      // Clear storage
      await storage.clearAll();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const register = async (userData: Partial<User> & { password?: string }): Promise<boolean> => {
    try {
      const response = await authService.signup({
        email: userData.email || "",
        password: userData.password || "",
        fullName: userData.name || "",
        phone: userData.phone || "",
        address: (userData as any).address || "",
        latitude: (userData as any).latitude,
        longitude: (userData as any).longitude,
      });

      if (response.success) {
        // Registration successful. According to user requirement, 
        // we don't log in automatically anymore.
        return true;
      }

      console.error("Registration failed:", response.error);
      return false;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
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
