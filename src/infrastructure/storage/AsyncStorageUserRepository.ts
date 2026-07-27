import AsyncStorage from '@react-native-async-storage/async-storage';
import { IUserRepository } from '@/src/domain/repositories';
import { User } from '@/src/domain/entities';

const USER_KEY = 'taquanto_user';

export class AsyncStorageUserRepository implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    try {
      const stored = await AsyncStorage.getItem(USER_KEY);
      if (!stored) return null;
      const user: User = JSON.parse(stored);
      if (user.id === id) return user;
      return user; // Return local profile if available
    } catch (error) {
      console.error('[AsyncStorageUserRepository] getById error:', error);
      return null;
    }
  }

  async getLocalUser(): Promise<User | null> {
    try {
      const stored = await AsyncStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('[AsyncStorageUserRepository] getLocalUser error:', error);
      return null;
    }
  }

  async save(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('[AsyncStorageUserRepository] save error:', error);
      throw error;
    }
  }

  async uploadAvatar(_userId: string, localUri: string): Promise<string> {
    // Local storage doesn't upload avatars — returns local URI directly
    return localUri;
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  }
}
