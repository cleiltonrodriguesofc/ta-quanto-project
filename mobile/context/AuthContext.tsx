import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { authUseCases } from '@/src/application';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      console.log(`[Auth] Session User: ${session?.user?.email || 'No user'}`);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await authUseCases.signOut();
  };

  const signInWithEmail = async (email: string, password: string) => {
    await authUseCases.signInWithEmail(email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await authUseCases.signUpWithEmail(email, password);
  };

  const signInWithGoogle = async () => {
    await authUseCases.signInWithGoogle();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        signOut,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
