import { Category } from "@/components/tracker/ActivitySlot";

// Activity patterns for auto-categorization
const PRODUCTIVE_KEYWORDS = [
  'work', 'coding', 'programming', 'meeting', 'study', 'learning', 'reading', 'writing',
  'exercise', 'workout', 'gym', 'planning', 'project', 'research', 'analysis', 'design',
  'development', 'training', 'course', 'practice', 'skill', 'productive', 'focus',
  'meditation', 'mindfulness', 'goal', 'organize', 'clean', 'prepare', 'review'
];

const UNPRODUCTIVE_KEYWORDS = [
  'social media', 'instagram', 'tiktok', 'facebook', 'twitter', 'youtube', 'netflix',
  'tv', 'gaming', 'procrastinate', 'procrastination', 'scrolling', 'browse', 'waste',
  'distraction', 'gossip', 'argue', 'complain', 'worry', 'overthink', 'binge',
  'phone', 'mobile', 'distracted', 'aimless', 'mindless', 'lazy', 'idle'
];

const NEUTRAL_KEYWORDS = [
  'eat', 'lunch', 'dinner', 'breakfast', 'meal', 'commute', 'travel', 'sleep',
  'rest', 'break', 'walk', 'shower', 'personal', 'chores', 'shopping', 'errands',
  'family', 'friends', 'social', 'relax', 'leisure', 'hobby', 'maintenance'
];

export function categorizeActivity(activityText: string): Category {
  const text = activityText.toLowerCase().trim();
  
  if (!text) return "neutral";

  // Check for productive keywords
  const productiveScore = PRODUCTIVE_KEYWORDS.reduce((score, keyword) => {
    return text.includes(keyword) ? score + 1 : score;
  }, 0);

  // Check for unproductive keywords  
  const unproductiveScore = UNPRODUCTIVE_KEYWORDS.reduce((score, keyword) => {
    return text.includes(keyword) ? score + 1 : score;
  }, 0);

  // Check for neutral keywords
  const neutralScore = NEUTRAL_KEYWORDS.reduce((score, keyword) => {
    return text.includes(keyword) ? score + 1 : score;
  }, 0);

  // Return category with highest score
  if (productiveScore > unproductiveScore && productiveScore > neutralScore) {
    return "productive";
  } else if (unproductiveScore > productiveScore && unproductiveScore > neutralScore) {
    return "unproductive";
  } else {
    return "neutral";
  }
}

export interface ActivityData {
  [hour: string]: {
    text: string;
    category: Category;
  };
}

export interface ProductivityInsight {
  type: 'tip' | 'pattern' | 'improvement' | 'strength';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export function generateAIRecommendations(
  recentDays: { [date: string]: ActivityData },
  goals?: { daily?: number; weekly?: number }
): ProductivityInsight[] {
  const insights: ProductivityInsight[] = [];
  
  // Analyze activity patterns
  const allActivities: Array<{ text: string; category: Category; hour: string; date: string }> = [];
  
  Object.entries(recentDays).forEach(([date, dayData]) => {
    Object.entries(dayData).forEach(([hour, activity]) => {
      if (activity.text.trim()) {
        allActivities.push({ ...activity, hour, date });
      }
    });
  });

  if (allActivities.length === 0) {
    return [{
      type: 'tip',
      title: 'Start Tracking Your Activities',
      description: 'Begin by logging your daily activities to receive personalized AI insights and productivity recommendations.',
      priority: 'high'
    }];
  }

  // Calculate productivity statistics
  const productiveCount = allActivities.filter(a => a.category === 'productive').length;
  const unproductiveCount = allActivities.filter(a => a.category === 'unproductive').length;
  const neutralCount = allActivities.filter(a => a.category === 'neutral').length;
  const totalCount = allActivities.length;

  const productivityRatio = productiveCount / totalCount;

  // Generate insights based on patterns
  
  // 1. Overall productivity assessment
  if (productivityRatio > 0.6) {
    insights.push({
      type: 'strength',
      title: 'Excellent Productivity Level!',
      description: `You're maintaining ${(productivityRatio * 100).toFixed(0)}% productive activities. Keep up the great work!`,
      priority: 'low'
    });
  } else if (productivityRatio < 0.3) {
    insights.push({
      type: 'improvement',
      title: 'Boost Your Productivity',
      description: `Your current productivity rate is ${(productivityRatio * 100).toFixed(0)}%. Try scheduling more focused work blocks.`,
      priority: 'high'
    });
  }

  // 2. Unproductive activity patterns
  if (unproductiveCount > productiveCount) {
    insights.push({
      type: 'improvement',
      title: 'Reduce Distracting Activities',
      description: 'You have more unproductive than productive activities. Consider using app blockers or setting specific times for leisure.',
      priority: 'high'
    });
  }

  // 3. Time-based patterns
  const morningActivities = allActivities.filter(a => {
    const hour = parseInt(a.hour);
    return hour >= 6 && hour <= 11;
  });
  
  const afternoonActivities = allActivities.filter(a => {
    const hour = parseInt(a.hour);
    return hour >= 12 && hour <= 17;
  });

  const morningProductivity = morningActivities.filter(a => a.category === 'productive').length / Math.max(morningActivities.length, 1);
  const afternoonProductivity = afternoonActivities.filter(a => a.category === 'productive').length / Math.max(afternoonActivities.length, 1);

  if (morningProductivity > afternoonProductivity + 0.2) {
    insights.push({
      type: 'pattern',
      title: 'You\'re a Morning Person!',
      description: 'Your productivity peaks in the morning. Schedule your most important tasks between 6-11 AM.',
      priority: 'medium'
    });
  } else if (afternoonProductivity > morningProductivity + 0.2) {
    insights.push({
      type: 'pattern',
      title: 'Afternoon Productivity Peak',
      description: 'You work best in the afternoon. Consider blocking afternoon time for your most challenging tasks.',
      priority: 'medium'
    });
  }

  // 4. Goal-based recommendations
  if (goals?.daily) {
    const avgDaily = productiveCount / Object.keys(recentDays).length;
    if (avgDaily < goals.daily) {
      const gap = goals.daily - avgDaily;
      insights.push({
        type: 'improvement',
        title: 'Daily Goal Gap',
        description: `You need ${gap.toFixed(1)} more productive hours daily to reach your goal. Try time-blocking techniques.`,
        priority: 'high'
      });
    }
  }

  // 5. Activity diversity
  const uniqueActivities = new Set(allActivities.map(a => a.text.toLowerCase().trim()));
  if (uniqueActivities.size < 5) {
    insights.push({
      type: 'tip',
      title: 'Diversify Your Activities',
      description: 'Consider adding variety to your routine. Different types of productive activities can prevent burnout.',
      priority: 'medium'
    });
  }

  // 6. Consistency patterns
  const daysWithData = Object.keys(recentDays).length;
  if (daysWithData >= 3) {
    const dailyProductiveCounts = Object.values(recentDays).map(day => 
      Object.values(day).filter(activity => activity.category === 'productive').length
    );
    
    const variance = dailyProductiveCounts.reduce((sum, count) => {
      const avg = dailyProductiveCounts.reduce((a, b) => a + b, 0) / dailyProductiveCounts.length;
      return sum + Math.pow(count - avg, 2);
    }, 0) / dailyProductiveCounts.length;

    if (variance > 4) {
      insights.push({
        type: 'tip',
        title: 'Build Consistency',
        description: 'Your productivity varies significantly day-to-day. Try establishing a routine for more consistent results.',
        priority: 'medium'
      });
    }
  }

  // Sort by priority and limit to top 5
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return insights
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    .slice(0, 5);
}

export function suggestOptimalSchedule(activityHistory: ActivityData[]): string[] {
  // Analyze when user is most productive
  const hourlyProductivity: { [hour: string]: number } = {};
  
  activityHistory.forEach(day => {
    Object.entries(day).forEach(([hour, activity]) => {
      if (activity.category === 'productive') {
        hourlyProductivity[hour] = (hourlyProductivity[hour] || 0) + 1;
      }
    });
  });

  // Find top productive hours
  const topHours = Object.entries(hourlyProductivity)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4)
    .map(([hour]) => hour);

  const suggestions = [
    'Block your most productive hours for deep work',
    'Schedule breaks between high-intensity activities',
    'Reserve low-energy times for administrative tasks',
    'Use the 2-hour rule: maximum focus time before breaks'
  ];

  if (topHours.length > 0) {
    const formattedHours = topHours.map(h => `${h}:00`).join(', ');
    suggestions.unshift(`Your peak hours are: ${formattedHours}`);
  }

  return suggestions;
}