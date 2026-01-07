"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export type UserRole = 'superuser' | 'club_owner' | 'event_manager' | 'staff';

export const ROLE_LABELS: Record<UserRole, string> = {
  superuser: 'Superuser',
  club_owner: 'Club Owner',
  event_manager: 'Event Manager',
  staff: 'Staff'
};

export interface User {
  id: string;
  username: string;
  role: UserRole;
  rafflerName?: string;
  assignedEntities: string[];
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasAccessToEntity: (entityId: string) => boolean;
  canCreateClubs: () => boolean;
  canEditClubInfo: () => boolean;
  canManageUsers: () => boolean;
  updateRafflerName: (rafflerName: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      fetchCurrentUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (res.ok) {
        const json = await res.json();
        setUser(json.data);
      } else {
        // Token invalid, clear it
        localStorage.removeItem("auth_token");
        setToken(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("auth_token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      const json = await res.json();
      
      if (json.success && json.data) {
        setToken(json.data.token);
        localStorage.setItem("auth_token", json.data.token);
        await fetchCurrentUser(json.data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
  };

  const hasAccessToEntity = (entityId: string): boolean => {
    if (!user) return false;
    if (user.role === 'superuser') return true;
    return user.assignedEntities.includes(entityId);
  };

  const canCreateClubs = (): boolean => {
    return user?.role === 'superuser';
  };

  const canEditClubInfo = (): boolean => {
    if (!user) return false;
    return user.role === 'superuser' || user.role === 'club_owner' || user.role === 'event_manager';
  };

  const canManageUsers = (): boolean => {
    if (!user) return false;
    return user.role !== 'staff';
  };

  const updateRafflerName = async (rafflerName: string): Promise<boolean> => {
    if (!user || !token) return false;
    
    try {
      const res = await fetch(`${API_BASE}/auth/users/${user.id}/raffler-name`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ rafflerName }),
      });
      
      if (res.ok) {
        setUser({ ...user, rafflerName });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update raffler name:", error);
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      login, 
      logout, 
      hasAccessToEntity,
      canCreateClubs,
      canEditClubInfo,
      canManageUsers,
      updateRafflerName,
      refreshUser
    }}>
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

// Helper to get auth headers
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}
