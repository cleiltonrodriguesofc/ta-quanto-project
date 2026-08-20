export interface UserStats {
  pricesShared: number;
  totalSavings: number;
  streakDays: number;
  rank: number;
}

export interface UserSettings {
  notifications: boolean;
  darkMode: boolean;
}

export const AVATAR_PRESETS = [
  'avatar1',
  'avatar2',
  'avatar3',
  'avatar4',
  'avatar5',
  'avatar6',
] as const;

export type AvatarPreset = typeof AVATAR_PRESETS[number];

export interface User {
  id: string;
  displayName: string;
  /** Either an AvatarPreset string, a remote URL, or a local file URI */
  avatarId: string;
  joinedDate: string;
  stats: UserStats;
  level: number;
  points: number;
  settings: UserSettings;
  badges?: string[];
}

export type NewUser = Omit<User, 'id' | 'stats' | 'level' | 'points'>;
