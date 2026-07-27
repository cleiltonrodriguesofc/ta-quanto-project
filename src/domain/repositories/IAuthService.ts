export interface AuthSession {
  userId: string;
  email: string;
  accessToken: string;
}

export interface IAuthService {
  /** Sign in with email and password. Throws on failure. */
  signInWithEmail(email: string, password: string): Promise<AuthSession>;

  /** Register with email and password. Throws on failure. */
  signUpWithEmail(email: string, password: string): Promise<AuthSession>;

  /** OAuth sign-in via Google */
  signInWithGoogle(): Promise<AuthSession>;

  /** Sign out the current user */
  signOut(): Promise<void>;

  /** Returns the current active session or null */
  getSession(): Promise<AuthSession | null>;
}
