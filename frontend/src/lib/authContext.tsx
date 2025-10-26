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

  // Apply system theme immediately on app load to prevent white flash
  useEffect(() => {
    const systemTheme = getSystemTheme();
    applyTheme(systemTheme);
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      // Apply user's theme preference, resolving "system" to actual system preference
      const userTheme = (userData.settings?.theme as Theme) || "system";
      const resolvedTheme = resolveTheme(userTheme);
      applyTheme(resolvedTheme);
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

  // Watch for system theme changes and update if user has "system" preference
  useEffect(() => {
    if (!user) return;

    const userTheme = (user.settings?.theme as Theme) || "system";
    if (userTheme !== "system") return;

    const cleanup = watchSystemTheme((systemTheme) => {
      applyTheme(systemTheme);
    });

    return cleanup;
  }, [user]);

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
