import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      // Check for existing session in localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // First try Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData.user) {
        // Get additional user info from users table
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, name, role')
          .eq('email', email)
          .single();

        const userInfo: User = userData || {
          id: authData.user.id,
          email: authData.user.email || email,
          name: authData.user.email?.split('@')[0] || 'User',
          role: 'sales_rep',
        };

        setUser(userInfo);
        localStorage.setItem('user', JSON.stringify(userInfo));
        return;
      }

      // Fallback: Check users table directly (for existing users)
      const { data: users, error: dbError } = await supabase
        .from('users')
        .select('id, email, name, role, password_hash, is_active')
        .eq('email', email)
        .single();

      if (dbError || !users) {
        throw new Error('Invalid credentials');
      }

      if (!users.is_active) {
        throw new Error('Account is disabled');
      }

      // For demo: simple password check (in production, use proper auth)
      // The password 'admin123' has hash starting with $2b$10$
      if (password === 'admin123' && users.email === 'admin@vyomaa.com') {
        const userInfo: User = {
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        };
        setUser(userInfo);
        localStorage.setItem('user', JSON.stringify(userInfo));
        return;
      }

      throw new Error('Invalid credentials');
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
