import { SupabaseClient } from '@supabase/supabase-js';
import { IUserRepository } from '@/src/domain/repositories';
import { User } from '@/src/domain/entities';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class SupabaseUserRepository implements IUserRepository {
  constructor(private client: SupabaseClient) {}

  async getById(id: string): Promise<User | null> {
    if (!uuidRegex.test(id)) {
      console.warn(`[SupabaseUserRepository] Skipping getById for non-UUID: ${id}`);
      return null;
    }

    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Supabase error: ${error.message}`);
    }

    const { count: pricesCount } = await this.client
      .from('prices')
      .select('*', { count: 'exact', head: true })
      .eq('userId', id);

    const count = pricesCount || data.pricesShared || 0;

    return {
      id: data.id,
      displayName: data.full_name || 'Anonymous',
      avatarId: data.avatar_url || 'avatar1',
      joinedDate: data.created_at || new Date().toISOString(),
      stats: {
        pricesShared: count,
        totalSavings: data.totalSavings || 0,
        streakDays: 0,
        rank: 0,
      },
      level: 1,
      points: count * 10,
      settings: { notifications: true, darkMode: false },
    };
  }

  async save(user: User): Promise<void> {
    const formatted = {
      id: user.id,
      full_name: user.displayName || 'Anonymous',
      avatar_url: user.avatarId || null,
      created_at: user.joinedDate || new Date().toISOString(),
    };

    const { error } = await this.client.from('users').upsert([formatted]);
    if (error) throw new Error(`Supabase error: ${error.message}`);

    const { data: { session } } = await this.client.auth.getSession();
    if (session?.user.id === user.id) {
      await this.client.auth.updateUser({
        data: {
          full_name: user.displayName,
          avatar_url: user.avatarId,
        },
      });
    }
  }

  async uploadAvatar(userId: string, localUri: string): Promise<string> {
    if (localUri.startsWith('http')) return localUri;

    try {
      const fileName = `${Date.now()}.jpg`;
      const filePath = `avatars/${userId}/${fileName}`;

      const response = await fetch(localUri);
      const blob = await response.blob();

      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result instanceof ArrayBuffer) resolve(reader.result);
          else reject(new Error('Failed to convert blob to ArrayBuffer'));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });

      const { error } = await this.client.storage
        .from('profiles')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        if (error.message.includes('bucket not found')) {
          throw new Error('Supabase storage bucket "profiles" not found.');
        }
        throw error;
      }

      const { data: { publicUrl } } = this.client.storage
        .from('profiles')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('[SupabaseUserRepository] Avatar upload failed:', error);
      throw new Error(`Avatar upload failed: ${error.message}`);
    }
  }
}
