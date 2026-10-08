import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { mustChangePassword } from '../shared/default-login';
import { ApiError, phoneLogin } from './api';
import { supabase } from './supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  // Email or 10-digit mobile number, as on the website. Resolves to whether the
  // member must set their own email and password first (default password).
  signIn: (identifier: string, password: string) => Promise<{ mustChange: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export type LoginErrorCode = 'shared_phone' | 'invalid_phone_login' | 'unknown';

export class LoginError extends Error {
  constructor(public code: LoginErrorCode, message: string) {
    super(message);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async (identifier: string, password: string) => {
    const id = identifier.trim();
    let user: User | null = null;

    if (id.includes('@')) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: id, password });
      if (error) throw new LoginError('unknown', error.message);
      user = data.user;
    } else {
      let tokens: { access_token: string; refresh_token: string };
      try {
        tokens = await phoneLogin(id, password);
      } catch (err) {
        const shared = err instanceof ApiError && err.code === 'shared_phone';
        throw new LoginError(shared ? 'shared_phone' : 'invalid_phone_login', err instanceof Error ? err.message : 'Login failed');
      }
      const { data, error } = await supabase.auth.setSession(tokens);
      if (error) throw new LoginError('unknown', error.message);
      user = data.user;
    }

    return { mustChange: mustChangePassword(user) };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
