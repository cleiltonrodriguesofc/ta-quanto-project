import { IAuthService, AuthSession } from '@/src/domain/repositories';

export class AuthUseCases {
  constructor(private authService: IAuthService) {}

  async signInWithEmail(email: string, password: string): Promise<AuthSession> {
    return this.authService.signInWithEmail(email, password);
  }

  async signUpWithEmail(email: string, password: string): Promise<AuthSession> {
    return this.authService.signUpWithEmail(email, password);
  }

  async signInWithGoogle(): Promise<AuthSession> {
    return this.authService.signInWithGoogle();
  }

  async signOut(): Promise<void> {
    return this.authService.signOut();
  }

  async getSession(): Promise<AuthSession | null> {
    return this.authService.getSession();
  }
}
