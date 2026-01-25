export interface UserProfile {
  id: string;
  displayName: string;
  avatarId: string; // We'll use preset IDs like 'avatar1', 'avatar2', etc.
  joinedDate: string;
  level?: number;
  points?: number; // Total points (Pontos)
  badges?: string[]; // Array of badge IDs
  settings?: {
    notifications: boolean;
    darkMode: boolean;
  };
  stats: {
    pricesShared: number;
    totalSavings: number;
    streakDays?: number;
    rank?: number;
  };
}

export const AVATAR_PRESETS = [
  'avatar1', // Default blue
  'avatar2', // Green
  'avatar3', // Purple
  'avatar4', // Orange
  'avatar5', // Pink
  'avatar6', // Gray
];
