import { Category } from "@/components/tracker/ActivitySlot";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  requirement: number;
  category: "streak" | "productivity" | "milestone" | "weekly";
}

export interface WeeklyChallenge {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  points: number;
  startDate: string;
  endDate: string;
  type: "productive_hours" | "streak_days" | "early_hours" | "consistency";
  completed: boolean;
}

export interface GamificationData {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  weeklyChallenge: WeeklyChallenge | null;
  level: number;
  pointsToNextLevel: number;
}

const BADGES: Omit<Badge, "earned" | "earnedAt">[] = [
  {
    id: "first_steps",
    name: "First Steps",
    description: "Complete your first productive hour",
    icon: "🌱",
    requirement: 1,
    category: "milestone"
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Log productive hours before 8 AM for 3 days",
    icon: "🐦",
    requirement: 3,
    category: "milestone"
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day productivity streak",
    icon: "🔥",
    requirement: 7,
    category: "streak"
  },
  {
    id: "streak_30",
    name: "Month Master",
    description: "Maintain a 30-day productivity streak",
    icon: "💎",
    requirement: 30,
    category: "streak"
  },
  {
    id: "productive_50",
    name: "Productivity Pro",
    description: "Log 50 productive hours total",
    icon: "⚡",
    requirement: 50,
    category: "productivity"
  },
  {
    id: "productive_100",
    name: "Productivity Champion",
    description: "Log 100 productive hours total",
    icon: "🏆",
    requirement: 100,
    category: "productivity"
  },
  {
    id: "weekly_warrior",
    name: "Weekly Warrior",
    description: "Complete 3 weekly challenges",
    icon: "⚔️",
    requirement: 3,
    category: "weekly"
  },
  {
    id: "consistency_king",
    name: "Consistency King",
    description: "Log activities for 14 consecutive days",
    icon: "👑",
    requirement: 14,
    category: "milestone"
  }
];

const WEEKLY_CHALLENGES: Omit<WeeklyChallenge, "progress" | "startDate" | "endDate" | "completed">[] = [
  {
    id: "productive_30",
    name: "Productivity Sprint",
    description: "Log 30 productive hours this week",
    target: 30,
    points: 150,
    type: "productive_hours"
  },
  {
    id: "streak_7",
    name: "Streak Builder",
    description: "Maintain productivity for 7 days straight",
    target: 7,
    points: 100,
    type: "streak_days"
  },
  {
    id: "early_5",
    name: "Early Riser",
    description: "Log 5 productive hours before 8 AM this week",
    target: 5,
    points: 80,
    type: "early_hours"
  },
  {
    id: "consistency_7",
    name: "Daily Tracker",
    description: "Log activities every day this week",
    target: 7,
    points: 120,
    type: "consistency"
  }
];

export function calculateLevel(totalPoints: number): { level: number; pointsToNext: number } {
  const level = Math.floor(totalPoints / 100) + 1;
  const pointsToNext = (level * 100) - totalPoints;
  return { level, pointsToNext };
}

export function calculatePoints(category: Category, hour: string): number {
  if (category === "productive") {
    const hourNum = parseInt(hour.split(":")[0]);
    // Bonus points for early morning (5-8 AM) and late evening (9-11 PM) productivity
    if (hourNum >= 5 && hourNum < 8) return 15; // Early bird bonus
    if (hourNum >= 21 && hourNum < 24) return 12; // Night owl bonus
    return 10; // Regular productive hour
  }
  if (category === "neutral") return 2; // Small reward for logging
  return 0; // No points for unproductive hours
}

export function calculateStreak(userId: string): { current: number; longest: number } {
  const today = new Date();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Check last 90 days
  for (let i = 0; i < 90; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];
    
    const dayData = localStorage.getItem(`wt:${userId}:${dateStr}`);
    if (dayData) {
      const activities = JSON.parse(dayData);
      const hasProductiveHours = Object.values(activities).some(
        (activity: any) => activity.category === "productive"
      );
      
      if (hasProductiveHours) {
        if (i === 0 || tempStreak > 0) {
          tempStreak++;
          if (i === 0 || currentStreak === 0) currentStreak = tempStreak;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (i === 0) currentStreak = 0;
        tempStreak = 0;
      }
    } else {
      if (i === 0) currentStreak = 0;
      tempStreak = 0;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

export function updateBadges(userId: string, currentData: GamificationData): Badge[] {
  const badges = [...currentData.badges];
  const streak = calculateStreak(userId);
  const totalProductiveHours = getTotalProductiveHours(userId);
  const earlyBirdDays = getEarlyBirdDays(userId);
  const consistentDays = getConsistentDays(userId);
  const completedChallenges = getCompletedChallengesCount(userId);

  BADGES.forEach(badgeTemplate => {
    const existingBadge = badges.find(b => b.id === badgeTemplate.id);
    if (existingBadge?.earned) return;

    let shouldEarn = false;
    switch (badgeTemplate.category) {
      case "streak":
        shouldEarn = streak.current >= badgeTemplate.requirement;
        break;
      case "productivity":
        shouldEarn = totalProductiveHours >= badgeTemplate.requirement;
        break;
      case "milestone":
        if (badgeTemplate.id === "first_steps") {
          shouldEarn = totalProductiveHours >= 1;
        } else if (badgeTemplate.id === "early_bird") {
          shouldEarn = earlyBirdDays >= badgeTemplate.requirement;
        } else if (badgeTemplate.id === "consistency_king") {
          shouldEarn = consistentDays >= badgeTemplate.requirement;
        }
        break;
      case "weekly":
        shouldEarn = completedChallenges >= badgeTemplate.requirement;
        break;
    }

    if (shouldEarn) {
      const badgeIndex = badges.findIndex(b => b.id === badgeTemplate.id);
      const earnedBadge: Badge = {
        ...badgeTemplate,
        earned: true,
        earnedAt: new Date().toISOString()
      };
      
      if (badgeIndex >= 0) {
        badges[badgeIndex] = earnedBadge;
      } else {
        badges.push(earnedBadge);
      }
    } else if (!existingBadge) {
      badges.push({ ...badgeTemplate, earned: false });
    }
  });

  return badges;
}

export function generateWeeklyChallenge(): WeeklyChallenge {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

  const challengeTemplate = WEEKLY_CHALLENGES[Math.floor(Math.random() * WEEKLY_CHALLENGES.length)];
  
  return {
    ...challengeTemplate,
    progress: 0,
    startDate: startOfWeek.toISOString().split("T")[0],
    endDate: endOfWeek.toISOString().split("T")[0],
    completed: false
  };
}

export function updateWeeklyChallenge(userId: string, challenge: WeeklyChallenge): WeeklyChallenge {
  if (challenge.completed) return challenge;

  let progress = 0;
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);

  switch (challenge.type) {
    case "productive_hours":
      progress = getProductiveHoursInRange(userId, challenge.startDate, challenge.endDate);
      break;
    case "streak_days":
      const streak = calculateStreak(userId);
      progress = Math.min(streak.current, challenge.target);
      break;
    case "early_hours":
      progress = getEarlyHoursInRange(userId, challenge.startDate, challenge.endDate);
      break;
    case "consistency":
      progress = getConsistentDaysInRange(userId, challenge.startDate, challenge.endDate);
      break;
  }

  const completed = progress >= challenge.target;
  
  return {
    ...challenge,
    progress,
    completed
  };
}

function getTotalProductiveHours(userId: string): number {
  let total = 0;
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.startsWith(`wt:${userId}:`)) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        Object.values(data).forEach((activity: any) => {
          if (activity.category === "productive") total++;
        });
      } catch {}
    }
  });
  
  return total;
}

function getEarlyBirdDays(userId: string): number {
  let days = 0;
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.startsWith(`wt:${userId}:`)) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        const hasEarlyProductivity = Object.entries(data).some(([hour, activity]: [string, any]) => {
          const hourNum = parseInt(hour.split(":")[0]);
          return hourNum >= 5 && hourNum < 8 && activity.category === "productive";
        });
        if (hasEarlyProductivity) days++;
      } catch {}
    }
  });
  
  return days;
}

function getConsistentDays(userId: string): number {
  const today = new Date();
  let consecutiveDays = 0;
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];
    
    const dayData = localStorage.getItem(`wt:${userId}:${dateStr}`);
    if (dayData) {
      const activities = JSON.parse(dayData);
      const hasAnyActivity = Object.values(activities).some(
        (activity: any) => activity.text.trim() !== ""
      );
      if (hasAnyActivity) {
        consecutiveDays++;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  
  return consecutiveDays;
}

function getCompletedChallengesCount(userId: string): number {
  const challengesKey = `challenges_completed_${userId}`;
  return parseInt(localStorage.getItem(challengesKey) || '0');
}

function getProductiveHoursInRange(userId: string, startDate: string, endDate: string): number {
  let total = 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayData = localStorage.getItem(`wt:${userId}:${dateStr}`);
    
    if (dayData) {
      try {
        const data = JSON.parse(dayData);
        Object.values(data).forEach((activity: any) => {
          if (activity.category === "productive") total++;
        });
      } catch {}
    }
  }
  
  return total;
}

function getEarlyHoursInRange(userId: string, startDate: string, endDate: string): number {
  let total = 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayData = localStorage.getItem(`wt:${userId}:${dateStr}`);
    
    if (dayData) {
      try {
        const data = JSON.parse(dayData);
        Object.entries(data).forEach(([hour, activity]: [string, any]) => {
          const hourNum = parseInt(hour.split(":")[0]);
          if (hourNum >= 5 && hourNum < 8 && activity.category === "productive") {
            total++;
          }
        });
      } catch {}
    }
  }
  
  return total;
}

function getConsistentDaysInRange(userId: string, startDate: string, endDate: string): number {
  let total = 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayData = localStorage.getItem(`wt:${userId}:${dateStr}`);
    
    if (dayData) {
      try {
        const data = JSON.parse(dayData);
        const hasAnyActivity = Object.values(data).some(
          (activity: any) => activity.text.trim() !== ""
        );
        if (hasAnyActivity) total++;
      } catch {}
    }
  }
  
  return total;
}

export function saveGamificationData(userId: string, data: GamificationData): void {
  localStorage.setItem(`gamification_${userId}`, JSON.stringify(data));
}

export function loadGamificationData(userId: string): GamificationData {
  try {
    const saved = localStorage.getItem(`gamification_${userId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  
  // Default data
  return {
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    badges: BADGES.map(badge => ({ ...badge, earned: false })),
    weeklyChallenge: generateWeeklyChallenge(),
    level: 1,
    pointsToNextLevel: 100
  };
}