import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { apiClient } from './apiClient';

export class ApiUserRepository implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    try {
      // O FastAPI usa /me que infere o ID do token JWT
      const response = await apiClient.get<User>('/api/v1/users/me');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar perfil', error);
      return null;
    }
  }

  async save(user: User): Promise<void> {
    try {
      await apiClient.put('/api/v1/users/me', {
        name: user.displayName,
        avatar_url: (user as any).avatar_url || user.avatarId,
      });
    } catch (error) {
      console.error('Erro ao salvar perfil', error);
      throw error;
    }
  }

  async uploadAvatar(userId: string, localUri: string): Promise<string> {
    // Para simplificar: na API real, faríamos um POST FormData com multipart/form-data
    // enviando a foto. Para o frontend transicional, retornamos mock ou url anterior
    console.warn('uploadAvatar precisa de endpoint no backend para upload s3/local');
    return localUri;
  }
}
