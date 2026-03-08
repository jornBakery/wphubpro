import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, teams, ID } from '../../services/appwrite';
import { User } from '../../types';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const resolveAdminStatus = async (currentUser: User): Promise<boolean> => {
      let adminStatus = currentUser.labels?.includes('admin') || false;
      if (!adminStatus) {
        try {
          const userTeams = await teams.list();
          adminStatus = userTeams.teams.some(t => t.$id === 'admin' || t.name.toLowerCase() === 'admin');
        } catch {
          adminStatus = false;
        }
      }
      return adminStatus;
    };

    const hydrateUser = async () => {
      const currentUser = await account.get();
      const adminStatus = await resolveAdminStatus(currentUser);
      if (!mounted) return;
      setUser({ ...currentUser, isAdmin: adminStatus });
      setIsAdmin(adminStatus);
    };

    const checkSession = async () => {
      try {
        await hydrateUser();
      } catch (err: any) {
        if (!mounted) return;
        // Only log if it's not a 401 (which just means no session)
        if (err?.code !== 401) {
          console.error('Session check failed:', err);
        }
        setUser(null);
        setIsAdmin(false);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      await account.createEmailPasswordSession(email, pass);
      const currentUser = await account.get();
      let adminStatus = currentUser.labels?.includes('admin') || false;
      if (!adminStatus) {
        try {
          const userTeams = await teams.list();
          adminStatus = userTeams.teams.some(t => t.$id === 'admin' || t.name.toLowerCase() === 'admin');
        } catch {
          adminStatus = false;
        }
      }
      setUser({ ...currentUser, isAdmin: adminStatus });
      setIsAdmin(adminStatus);

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    const userId = ID.unique();
    await account.create(userId, email, pass, name);
    await account.createEmailPasswordSession(email, pass);

    const currentUser = await account.get();

    // New users are not admins by default
    const adminStatus = currentUser.labels?.includes('admin') || false;

    setUser({ ...currentUser, isAdmin: adminStatus });
    setIsAdmin(adminStatus);
  };

  const logout = async () => {
    await account.deleteSession('current');
    setUser(null);
    setIsAdmin(false);
  };

  const refreshUser = async () => {
    const currentUser = await account.get();
    let adminStatus = currentUser.labels?.includes('admin') || false;
    if (!adminStatus) {
      try {
        const userTeams = await teams.list();
        adminStatus = userTeams.teams.some(t => t.$id === 'admin' || t.name.toLowerCase() === 'admin');
      } catch {
        adminStatus = false;
      }
    }
    setUser({ ...currentUser, isAdmin: adminStatus });
    setIsAdmin(adminStatus);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, register, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
