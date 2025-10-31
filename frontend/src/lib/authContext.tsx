// Auth context for managing user authentication state
import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";
import type { User } from "@shared/types";
import {
  getSystemTheme,
  resolveTheme,
  applyTheme,
  watchSystemTheme,
  type Theme,
} from "./themeUtils";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateCanvasState: (updates: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Apply light theme immediately on app load to prevent white flash
  useEffect(() => {
    applyTheme("light");
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      // Apply user's theme preference
      const userTheme = (userData.settings?.theme as Theme) || "light";
      applyTheme(userTheme);
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

  const updateCanvasState = async (updates: any) => {
    try {
      await api.updateCanvasState(updates);
      // Update local user state optimistically
      if (user) {
        setUser({
          ...user,
          canvasState: {
            ...user.canvasState,
            ...updates,
            expandedPanels: {
              ...user.canvasState?.expandedPanels,
              ...updates.expandedPanels,
            },
            columnWidths: {
              ...(user.canvasState?.columnWidths || {}),
              ...(updates.columnWidths || {}),
            },
            canvasViewport: {
              ...user.canvasState?.canvasViewport,
              ...updates.canvasViewport,
            },
          },
        });
      }
    } catch (error) {
      console.error("Failed to update canvas state:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser, updateCanvasState }}
    >
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
