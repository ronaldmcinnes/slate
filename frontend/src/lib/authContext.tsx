// Auth context for managing user authentication state
import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";
import type { User } from "@shared/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have a token
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = () => {
    // Redirect to Google OAuth
    window.location.href = api.getGoogleLoginUrl();
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      // Redirect to home
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
