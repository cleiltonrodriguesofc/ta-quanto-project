import { SupabaseClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { IAuthService, AuthSession } from '@/src/domain/repositories';

export class SupabaseAuthService implements IAuthService {
  constructor(private client: SupabaseClient) {}

  async signInWithEmail(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session || !data.user) throw new Error('No session returned');

    return {
      userId: data.user.id,
      email: data.user.email || email,
      accessToken: data.session.access_token,
    };
  }

  async signUpWithEmail(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) throw error;

    // Supabase returns user without session if email confirmation is required
    const userId = data.user?.id || '';
    const accessToken = data.session?.access_token || '';

    return {
      userId,
      email,
      accessToken,
    };
  }

  async signInWithGoogle(): Promise<AuthSession> {
    WebBrowser.maybeCompleteAuthSession();

    const redirectUrl = 'taquanto://google-auth';
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
      },
    });

    if (error) throw error;
    if (data?.url) {
      await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    }

    const session = await this.getSession();
    if (!session) throw new Error('Google OAuth flow did not produce a session');
    return session;
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getSession(): Promise<AuthSession | null> {
    const { data: { session } } = await this.client.auth.getSession();
    if (!session || !session.user) return null;

    return {
      userId: session.user.id,
      email: session.user.email || '',
      accessToken: session.access_token,
    };
  }
}
