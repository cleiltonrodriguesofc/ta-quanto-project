import { formatTimeAgo } from '../date';

describe('Date Utils', () => {
  beforeEach(() => {
    // Mock current time to ensure consistent tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatTimeAgo', () => {
    it('should return "Just now" for recent timestamps', () => {
      const recentDate = new Date('2024-01-01T11:59:30.000Z'); // 30 seconds ago
      
      const result = formatTimeAgo(recentDate);
      
      expect(result).toBe('Just now');
    });

    it('should return minutes for timestamps within an hour', () => {
      const minutesAgo = new Date('2024-01-01T11:45:00.000Z'); // 15 minutes ago
      
      const result = formatTimeAgo(minutesAgo);
      
      expect(result).toBe('15 minutes ago');
    });

    it('should return singular minute for 1 minute ago', () => {
      const oneMinuteAgo = new Date('2024-01-01T11:59:00.000Z'); // 1 minute ago
      
      const result = formatTimeAgo(oneMinuteAgo);
      
      expect(result).toBe('1 minute ago');
    });

    it('should return hours for timestamps within a day', () => {
      const hoursAgo = new Date('2024-01-01T09:00:00.000Z'); // 3 hours ago
      
      const result = formatTimeAgo(hoursAgo);
      
      expect(result).toBe('3 hours ago');
    });

    it('should return singular hour for 1 hour ago', () => {
      const oneHourAgo = new Date('2024-01-01T11:00:00.000Z'); // 1 hour ago
      
      const result = formatTimeAgo(oneHourAgo);
      
      expect(result).toBe('1 hour ago');
    });

    it('should return days for timestamps within a week', () => {
      const daysAgo = new Date('2023-12-29T12:00:00.000Z'); // 3 days ago
      
      const result = formatTimeAgo(daysAgo);
      
      expect(result).toBe('3 days ago');
    });

    it('should return singular day for 1 day ago', () => {
      const oneDayAgo = new Date('2023-12-31T12:00:00.000Z'); // 1 day ago
      
      const result = formatTimeAgo(oneDayAgo);
      
      expect(result).toBe('1 day ago');
    });

    it('should return weeks for older timestamps', () => {
      const weeksAgo = new Date('2023-12-18T12:00:00.000Z'); // 2 weeks ago
      
      const result = formatTimeAgo(weeksAgo);
      
      expect(result).toBe('2 weeks ago');
    });

    it('should return singular week for 1 week ago', () => {
      const oneWeekAgo = new Date('2023-12-25T12:00:00.000Z'); // 1 week ago
      
      const result = formatTimeAgo(oneWeekAgo);
      
      expect(result).toBe('1 week ago');
    });
  });
});