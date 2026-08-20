import { IUserRepository } from '@/src/domain/repositories';
import { User } from '@/src/domain/entities';

export class GetUserProfileUseCase {
  constructor(
    private remoteUserRepo: IUserRepository,
    private localUserRepo: IUserRepository,
  ) {}

  async execute(userId: string): Promise<User | null> {
    // 1. Try remote first if userId is provided
    if (userId) {
      try {
        const remoteUser = await this.remoteUserRepo.getById(userId);
        if (remoteUser) {
          await this.localUserRepo.save(remoteUser);
          return remoteUser;
        }
      } catch (error) {
        console.warn('[GetUserProfileUseCase] Remote fetch error, trying local:', error);
      }
    }

    // 2. Fallback to local storage
    return this.localUserRepo.getById(userId);
  }
}
