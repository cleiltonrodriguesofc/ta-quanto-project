import { IUserRepository } from '@/src/domain/repositories';

export class UploadAvatarUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string, imageUri: string): Promise<string> {
    return this.userRepo.uploadAvatar(userId, imageUri);
  }
}
