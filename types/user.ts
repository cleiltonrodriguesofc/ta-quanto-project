export interface UserProfile {
  id: string;
  displayName: string;
  avatarId: string; // We'll use preset IDs like 'avatar1', 'avatar2', etc.
  joinedDate: string;
  stats: {
    pricesShared: number;
    totalSavings: number;
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
