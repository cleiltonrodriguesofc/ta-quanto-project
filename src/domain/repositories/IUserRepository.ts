import { User } from '../entities';

export interface IUserRepository {
  /** Fetch a user profile by their ID */
  getById(id: string): Promise<User | null>;

  /** Persist a user profile (create or update) */
  save(user: User): Promise<void>;

  /**
   * Upload an avatar image and return the remote public URL.
   * Receives a local file URI (e.g. file://...).
   */
  uploadAvatar(userId: string, localUri: string): Promise<string>;
}
