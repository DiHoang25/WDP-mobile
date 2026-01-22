import { User } from "@/types";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock accounts for testing
const MOCK_ACCOUNTS: User[] = [
  // Citizens
  {
    id: "citizen1",
    email: "citizen@test.com",
    name: "Nguyễn Văn A",
    phone: "0901234567",
    role: "citizen",
    roleId: 1,
    address: "123 Lê Lợi, Quận 1",
    district: "Quận 1",
    points: 1250,
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "citizen2",
    email: "citizen2@test.com",
    name: "Trần Thị B",
    phone: "0902345678",
    role: "citizen",
    roleId: 1,
    address: "456 Nguyễn Huệ, Quận 1",
    district: "Quận 1",
    points: 890,
    avatar: "https://i.pravatar.cc/150?img=5",
  },

  // Shipper
  {
    id: "shipper1",
    email: "shipper@test.com",
    name: "Phạm Văn D",
    phone: "0904567890",
    role: "shipper",
    roleId: 3,
    vehicleType: "Xe tải nhỏ",
    vehicleNumber: "59A-12345",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // TODO: Replace with real API call
    // const response = await fetch('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    // const data = await response.json();
    // if (data.success) { setUser(data.user); return true; }

    // Mock login - Backend will return user with role automatically
    const foundUser = MOCK_ACCOUNTS.find(
      (acc) => acc.email === email, // Backend validates password and returns user with role
    );

    if (foundUser && password === "123456") {
      // Mock password check
      setUser(foundUser);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    // Mock register - just create a new user
    const role = userData.role || "citizen";
    const roleId = userData.roleId || (role === "citizen" ? 1 : role === "enterprise" ? 2 : 3);
    
    const newUser: User = {
      id: `${role}_${Date.now()}`,
      email: userData.email || "",
      name: userData.name || "",
      phone: userData.phone || "",
      role,
      roleId,
      ...userData,
    };

    setUser(newUser);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
