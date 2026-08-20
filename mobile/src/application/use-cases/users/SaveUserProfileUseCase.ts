import { IUserRepository } from '@/src/domain/repositories';
import { User } from '@/src/domain/entities';

export class SaveUserProfileUseCase {
  constructor(
    private localUserRepo: IUserRepository,
    private remoteUserRepo: IUserRepository,
  ) {}

  async execute(user: User): Promise<void> {
    // 1. Save locally for instant UI update
    await this.localUserRepo.save(user);

    // 2. Sync to remote
    try {
      await this.remoteUserRepo.save(user);
    } catch (error) {
      console.warn('[SaveUserProfileUseCase] Saved locally only. Remote sync error:', error);
    }
  }
}
