import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export type Role = 'Admin' | 'Analyst' | 'Viewer' | string;

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  viewRole: Role;
  setViewRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [viewRole, setViewRole] = useState<Role>('Viewer');
  const [loading, setLoading] = useState(true);

  const formatRole = (role: string) => {
    if (!role) return 'Viewer';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetchApi('/me');
      const userData = response.data;
      const formattedRole = formatRole(userData.role);
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: formattedRole,
        avatar: userData.name ? userData.name.charAt(0).toUpperCase() : userData.email.charAt(0).toUpperCase()
      });
      setViewRole(formattedRole);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    const userData = response.data.user;
    const formattedRole = formatRole(userData.role);
    setUser({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: formattedRole,
      avatar: userData.name ? userData.name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()
    });
    setViewRole(formattedRole);
  };

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (err) {
      // ignore
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, viewRole, setViewRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
