import { useState, useEffect, useCallback } from "react";
import { 
  GamificationData, 
  loadGamificationData, 
  saveGamificationData, 
  calculatePoints,
  calculateLevel,
  updateBadges,
  updateWeeklyChallenge,
  calculateStreak,
  generateWeeklyChallenge
} from "@/lib/gamification";
import { Category } from "@/components/tracker/ActivitySlot";
import { useToast } from "@/hooks/use-toast";

export function useGamification(userId: string) {
  const [data, setData] = useState<GamificationData>(() => loadGamificationData(userId));
  const { toast } = useToast();

  const updateGamificationData = useCallback(() => {
    const currentData = loadGamificationData(userId);
    const streak = calculateStreak(userId);
    const { level, pointsToNext } = calculateLevel(currentData.totalPoints);
    
    const updatedBadges = updateBadges(userId, currentData);
    const updatedChallenge = currentData.weeklyChallenge 
      ? updateWeeklyChallenge(userId, currentData.weeklyChallenge)
      : generateWeeklyChallenge();

    // Check for newly earned badges
    const newBadges = updatedBadges.filter(badge => 
      badge.earned && !currentData.badges.find(b => b.id === badge.id && b.earned)
    );

    // Check if weekly challenge was just completed
    const challengeJustCompleted = updatedChallenge.completed && 
      currentData.weeklyChallenge && !currentData.weeklyChallenge.completed;

    const newData: GamificationData = {
      ...currentData,
      currentStreak: streak.current,
      longestStreak: Math.max(streak.longest, currentData.longestStreak),
      badges: updatedBadges,
      weeklyChallenge: updatedChallenge,
      level,
      pointsToNextLevel: pointsToNext
    };

    // Add bonus points for completed challenge
    if (challengeJustCompleted) {
      newData.totalPoints += updatedChallenge.points;
      const { level: newLevel, pointsToNext: newPointsToNext } = calculateLevel(newData.totalPoints);
      newData.level = newLevel;
      newData.pointsToNextLevel = newPointsToNext;

      // Mark challenge as completed and save count
      const challengesKey = `challenges_completed_${userId}`;
      const completed = parseInt(localStorage.getItem(challengesKey) || '0') + 1;
      localStorage.setItem(challengesKey, completed.toString());

      toast({
        title: "🎉 Challenge Completed!",
        description: `You earned ${updatedChallenge.points} points for completing "${updatedChallenge.name}"!`,
      });

      // Generate new challenge for next week
      newData.weeklyChallenge = generateWeeklyChallenge();
    }

    // Show badge notifications
    newBadges.forEach(badge => {
      toast({
        title: `🏆 Badge Earned!`,
        description: `You've unlocked "${badge.name}" - ${badge.description}`,
      });
    });

    // Check for level up
    if (newData.level > currentData.level) {
      toast({
        title: "🌟 Level Up!",
        description: `Congratulations! You've reached Level ${newData.level}!`,
      });
    }

    setData(newData);
    saveGamificationData(userId, newData);
  }, [userId, toast]);

  const awardPoints = useCallback((category: Category, hour: string) => {
    const points = calculatePoints(category, hour);
    if (points > 0) {
      const currentData = loadGamificationData(userId);
      const newTotalPoints = currentData.totalPoints + points;
      const { level, pointsToNext } = calculateLevel(newTotalPoints);
      
      const updatedData = {
        ...currentData,
        totalPoints: newTotalPoints,
        level,
        pointsToNextLevel: pointsToNext
      };
      
      saveGamificationData(userId, updatedData);
      setData(updatedData);

      // Show level up notification
      if (level > currentData.level) {
        toast({
          title: "🌟 Level Up!",
          description: `Congratulations! You've reached Level ${level}!`,
        });
      }
    }
  }, [userId, toast]);

  useEffect(() => {
    updateGamificationData();
  }, [updateGamificationData]);

  return {
    data,
    awardPoints,
    updateGamificationData
  };
}