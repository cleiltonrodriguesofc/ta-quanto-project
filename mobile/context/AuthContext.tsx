import React, { createContext, useState, useEffect, useContext } from 'react';
import { authUseCases, AuthSession } from '@/src/application';

type AuthContextType = {
  session: AuthSession | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica se há sessão ativa nos tokens do AsyncStorage
    authUseCases.getSession().then((s) => {
      setSession(s);
      console.log(`[Auth] Session: ${s?.email || s?.userId || 'Nenhuma sessão'}`);
    }).catch(() => {
      setSession(null);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const s = await authUseCases.signInWithEmail(email, password);
    setSession(s);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const s = await authUseCases.signUpWithEmail(email, password);
    setSession(s);
  };

  const signInWithGoogle = async () => {
    await authUseCases.signInWithGoogle();
  };

  const signOut = async () => {
    await authUseCases.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
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
