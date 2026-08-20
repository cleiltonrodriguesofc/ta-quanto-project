
import { UserProfile } from '@/types/user';

export const calculateLevel = (points: number): number => {
    // Simple formula: Level 1 (0-99), Level 2 (100-199), etc.
    // Or every 10 points = 1 level to make it faster initially.
    // User suggestion: "Level 3 - 45 Pontos" implies levels might be smaller steps.
    // Let's do: Level = floor(points / 50) + 1.
    return Math.floor(points / 50) + 1;
};

export const calculateNextLevelProgress = (points: number) => {
    const level = calculateLevel(points);
    const currentLevelThreshold = (level - 1) * 50;
    const progress = points - currentLevelThreshold;

    return {
        level,
        progress,
        totalNeeded: 50,
        percent: progress / 50
    };
};

export const getBadges = (profile: UserProfile): string[] => {
    const badges: string[] = [];
    if (profile.stats.pricesShared > 0) badges.push('first_share');
    if (profile.stats.pricesShared >= 10) badges.push('contributor');
    if (profile.stats.pricesShared >= 50) badges.push('expert');
    if (profile.stats.totalSavings > 100) badges.push('saver');
    return badges;
};
