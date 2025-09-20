import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  category: 'productivity' | 'consistency' | 'milestone' | 'special';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  unlockedAt: Date;
  type: 'daily' | 'weekly' | 'milestone';
}

export interface GamificationData {
  totalPoints: number;
  level: number;
  pointsToNextLevel: number;
  streak: number;
  badges: Badge[];
  achievements: Achievement[];
  weeklyGoal: number;
  weeklyProgress: number;
}

const POINTS_PER_LEVEL = 100;

const DEFAULT_BADGES: Badge[] = [
  { id: 'first_day', name: 'Getting Started', description: 'Complete your first day of tracking', icon: '🌟', category: 'milestone' },
  { id: 'week_warrior', name: 'Week Warrior', description: 'Track activities for 7 consecutive days', icon: '⚡', category: 'consistency' },
  { id: 'productivity_master', name: 'Productivity Master', description: 'Have 80% productive hours in a day', icon: '🏆', category: 'productivity' },
  { id: 'early_bird', name: 'Early Bird', description: 'Start productive work before 8 AM', icon: '🌅', category: 'special' },
  { id: 'night_owl', name: 'Night Owl', description: 'Stay productive after 10 PM', icon: '🦉', category: 'special' },
  { id: 'focus_champion', name: 'Focus Champion', description: 'Complete 5 Pomodoro sessions in a day', icon: '🎯', category: 'productivity' },
];

export const useGamification = (userId: string) => {
  const { toast } = useToast();
  const STORAGE_KEY = `gamification_data_${userId}`;
  
  const [gamificationData, setGamificationData] = useState<GamificationData>({
    totalPoints: 0,
    level: 1,
    pointsToNextLevel: POINTS_PER_LEVEL,
    streak: 0,
    badges: DEFAULT_BADGES,
    achievements: [],
    weeklyGoal: 35, // 5 hours per day * 7 days
    weeklyProgress: 0,
  });

  // Load gamification data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setGamificationData(prev => ({
          ...prev,
          ...data,
          badges: DEFAULT_BADGES.map(badge => ({
            ...badge,
            unlockedAt: data.badges?.find((b: Badge) => b.id === badge.id)?.unlockedAt
          }))
        }));
      } catch (error) {
        console.error('Error loading gamification data:', error);
      }
    }
  }, [STORAGE_KEY]);

  // Save to localStorage whenever data changes
  const saveData = useCallback((data: GamificationData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setGamificationData(data);
  }, [STORAGE_KEY]);

  const addPoints = useCallback((points: number, reason: string) => {
    setGamificationData(prev => {
      const newTotalPoints = prev.totalPoints + points;
      const newLevel = Math.floor(newTotalPoints / POINTS_PER_LEVEL) + 1;
      const pointsToNextLevel = (newLevel * POINTS_PER_LEVEL) - newTotalPoints;
      
      // Check for level up
      if (newLevel > prev.level) {
        toast({
          title: "Level Up! 🎉",
          description: `You've reached level ${newLevel}!`,
          duration: 5000,
        });
      }

      const newData = {
        ...prev,
        totalPoints: newTotalPoints,
        level: newLevel,
        pointsToNextLevel,
      };

      saveData(newData);
      return newData;
    });

    // Show points earned notification
    if (points > 0) {
      toast({
        title: `+${points} points`,
        description: reason,
        duration: 3000,
      });
    }
  }, [toast, saveData]);

  const unlockBadge = useCallback((badgeId: string) => {
    setGamificationData(prev => {
      const badge = prev.badges.find(b => b.id === badgeId);
      if (!badge || badge.unlockedAt) return prev;

      const newData = {
        ...prev,
        badges: prev.badges.map(b =>
          b.id === badgeId ? { ...b, unlockedAt: new Date() } : b
        ),
      };

      toast({
        title: "Badge Unlocked! 🏆",
        description: `${badge.name}: ${badge.description}`,
        duration: 5000,
      });

      saveData(newData);
      return newData;
    });
  }, [toast, saveData]);

  const addAchievement = useCallback((title: string, description: string, points: number, type: Achievement['type']) => {
    const achievement: Achievement = {
      id: Date.now().toString(),
      title,
      description,
      points,
      unlockedAt: new Date(),
      type,
    };

    setGamificationData(prev => {
      const newData = {
        ...prev,
        achievements: [achievement, ...prev.achievements],
      };
      saveData(newData);
      return newData;
    });

    addPoints(points, `Achievement: ${title}`);
  }, [addPoints, saveData]);

  const updateStreak = useCallback((consecutive: boolean) => {
    setGamificationData(prev => {
      const newStreak = consecutive ? prev.streak + 1 : 0;
      const newData = { ...prev, streak: newStreak };
      
      // Check for streak badges
      if (newStreak === 7) {
        unlockBadge('week_warrior');
      }
      
      saveData(newData);
      return newData;
    });
  }, [unlockBadge, saveData]);

  const checkProductivityBadges = useCallback((dailyData: any) => {
    if (!dailyData) return;

    const totalHours = Object.keys(dailyData).length;
    const productiveHours = Object.values(dailyData).filter((category: any) => category === 'productive').length;
    
    // Productivity Master badge (80% productive)
    if (totalHours > 0 && (productiveHours / totalHours) >= 0.8) {
      unlockBadge('productivity_master');
      addPoints(50, 'High productivity day!');
    }

    // Early bird check (productive before 8 AM)
    const earlyHours = ['06', '07'];
    const hasEarlyProductivity = earlyHours.some(hour => dailyData[hour] === 'productive');
    if (hasEarlyProductivity) {
      unlockBadge('early_bird');
    }

    // Night owl check (productive after 10 PM)
    const lateHours = ['22', '23'];
    const hasLateProductivity = lateHours.some(hour => dailyData[hour] === 'productive');
    if (hasLateProductivity) {
      unlockBadge('night_owl');
    }
  }, [unlockBadge, addPoints]);

  return {
    data: gamificationData,
    gamificationData,
    addPoints,
    unlockBadge,
    addAchievement,
    updateStreak,
    checkProductivityBadges,
    awardPoints: addPoints,
    updateGamificationData: () => {
      // This can be used to trigger badge checks
      const today = new Date().toISOString().split('T')[0];
      const todayData = localStorage.getItem(`wt:${userId}:${today}`);
      if (todayData) {
        try {
          const parsed = JSON.parse(todayData);
          checkProductivityBadges(parsed);
        } catch (error) {
          console.error('Error parsing daily data for gamification:', error);
        }
      }
    },
  };
};