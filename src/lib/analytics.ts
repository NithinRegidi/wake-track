import { Category } from "@/components/tracker/ActivitySlot";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subWeeks, subMonths, parseISO } from "date-fns";

export interface DayData {
  date: string;
  productive: number;
  unproductive: number;
  neutral: number;
  total: number;
  activities: { time: string; text: string; category: Category }[];
}

export interface ProductivityPattern {
  hour: number;
  averageProductivity: number;
  totalSessions: number;
  category: 'peak' | 'good' | 'average' | 'low';
}

export interface TrendData {
  period: string;
  productive: number;
  unproductive: number;
  neutral: number;
  productivity_score: number;
  total_logged: number;
}

export interface InsightData {
  type: 'positive' | 'warning' | 'neutral';
  title: string;
  description: string;
  metric?: string;
  change?: number;
}

// Load user data for a specific date range
export function loadUserDataRange(userId: string, startDate: string, endDate: string): DayData[] {
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate)
  });

  return days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const storageKey = `wt:${userId}:${dateStr}`;
    
    try {
      const rawData = localStorage.getItem(storageKey);
      if (!rawData) return createEmptyDayData(dateStr);
      
      const data = JSON.parse(rawData);
      const activities = Object.entries(data).map(([time, activity]: [string, any]) => ({
        time,
        text: activity.text || '',
        category: activity.category || 'neutral'
      }));

      const counts = activities.reduce((acc, activity) => {
        if (activity.text.trim()) {
          acc[activity.category]++;
          acc.total++;
        }
        return acc;
      }, { productive: 0, unproductive: 0, neutral: 0, total: 0 });

      return {
        date: dateStr,
        ...counts,
        activities: activities.filter(a => a.text.trim())
      };
    } catch {
      return createEmptyDayData(dateStr);
    }
  });
}

function createEmptyDayData(date: string): DayData {
  return {
    date,
    productive: 0,
    unproductive: 0,
    neutral: 0,
    total: 0,
    activities: []
  };
}

// Analyze productivity patterns by hour
export function analyzeProductivityPatterns(data: DayData[]): ProductivityPattern[] {
  const hourlyData = new Map<number, { productive: number; total: number; sessions: number }>();

  // Initialize hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyData.set(hour, { productive: 0, total: 0, sessions: 0 });
  }

  // Process data
  data.forEach(day => {
    day.activities.forEach(activity => {
      const hour = parseInt(activity.time.split(':')[0]);
      const hourData = hourlyData.get(hour)!;
      
      hourData.total++;
      hourData.sessions++;
      if (activity.category === 'productive') {
        hourData.productive++;
      }
    });
  });

  // Calculate patterns
  const patterns: ProductivityPattern[] = [];
  const productivityScores: number[] = [];

  hourlyData.forEach((data, hour) => {
    const averageProductivity = data.total > 0 ? (data.productive / data.total) * 100 : 0;
    productivityScores.push(averageProductivity);
    
    patterns.push({
      hour,
      averageProductivity,
      totalSessions: data.sessions,
      category: 'average' // Will be categorized below
    });
  });

  // Categorize hours based on productivity distribution
  const sortedScores = [...productivityScores].sort((a, b) => b - a);
  const peak = sortedScores[Math.floor(sortedScores.length * 0.1)] || 80;
  const good = sortedScores[Math.floor(sortedScores.length * 0.3)] || 60;
  const average = sortedScores[Math.floor(sortedScores.length * 0.7)] || 40;

  return patterns.map(pattern => ({
    ...pattern,
    category: 
      pattern.averageProductivity >= peak ? 'peak' as const :
      pattern.averageProductivity >= good ? 'good' as const :
      pattern.averageProductivity >= average ? 'average' as const :
      'low' as const
  }));
}

// Generate trend data for weekly/monthly views
export function generateTrendData(data: DayData[], period: 'week' | 'month'): TrendData[] {
  if (period === 'week') {
    return generateWeeklyTrends(data);
  } else {
    return generateMonthlyTrends(data);
  }
}

function generateWeeklyTrends(data: DayData[]): TrendData[] {
  const weeklyData = new Map<string, DayData[]>();
  
  data.forEach(day => {
    const weekStart = format(startOfWeek(parseISO(day.date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (!weeklyData.has(weekStart)) {
      weeklyData.set(weekStart, []);
    }
    weeklyData.get(weekStart)!.push(day);
  });

  return Array.from(weeklyData.entries()).map(([weekStart, weekData]) => {
    const totals = weekData.reduce((acc, day) => ({
      productive: acc.productive + day.productive,
      unproductive: acc.unproductive + day.unproductive,
      neutral: acc.neutral + day.neutral,
      total: acc.total + day.total
    }), { productive: 0, unproductive: 0, neutral: 0, total: 0 });

    const productivity_score = totals.total > 0 ? (totals.productive / totals.total) * 100 : 0;

    return {
      period: `Week of ${format(parseISO(weekStart), 'MMM d')}`,
      ...totals,
      productivity_score,
      total_logged: totals.total
    };
  });
}

function generateMonthlyTrends(data: DayData[]): TrendData[] {
  const monthlyData = new Map<string, DayData[]>();
  
  data.forEach(day => {
    const monthStart = format(startOfMonth(parseISO(day.date)), 'yyyy-MM-dd');
    if (!monthlyData.has(monthStart)) {
      monthlyData.set(monthStart, []);
    }
    monthlyData.get(monthStart)!.push(day);
  });

  return Array.from(monthlyData.entries()).map(([monthStart, monthData]) => {
    const totals = monthData.reduce((acc, day) => ({
      productive: acc.productive + day.productive,
      unproductive: acc.unproductive + day.unproductive,
      neutral: acc.neutral + day.neutral,
      total: acc.total + day.total
    }), { productive: 0, unproductive: 0, neutral: 0, total: 0 });

    const productivity_score = totals.total > 0 ? (totals.productive / totals.total) * 100 : 0;

    return {
      period: format(parseISO(monthStart), 'MMM yyyy'),
      ...totals,
      productivity_score,
      total_logged: totals.total
    };
  });
}

// Generate advanced insights
export function generateAdvancedInsights(
  currentData: DayData[],
  previousData: DayData[],
  patterns: ProductivityPattern[]
): InsightData[] {
  const insights: InsightData[] = [];

  // Current vs Previous Productivity
  const currentProductivity = calculateAverageProductivity(currentData);
  const previousProductivity = calculateAverageProductivity(previousData);
  const productivityChange = currentProductivity - previousProductivity;

  if (Math.abs(productivityChange) > 5) {
    insights.push({
      type: productivityChange > 0 ? 'positive' : 'warning',
      title: productivityChange > 0 ? 'Productivity Improved!' : 'Productivity Declined',
      description: `Your productivity ${productivityChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(productivityChange).toFixed(1)}% compared to the previous period.`,
      metric: `${productivityChange > 0 ? '+' : ''}${productivityChange.toFixed(1)}%`,
      change: productivityChange
    });
  }

  // Peak Hours Analysis
  const peakHours = patterns.filter(p => p.category === 'peak' && p.totalSessions > 0);
  if (peakHours.length > 0) {
    const bestHour = peakHours.reduce((best, current) => 
      current.averageProductivity > best.averageProductivity ? current : best
    );
    
    insights.push({
      type: 'positive',
      title: 'Peak Productivity Hours',
      description: `You're most productive around ${formatHour(bestHour.hour)} with ${bestHour.averageProductivity.toFixed(1)}% productivity rate.`,
      metric: `${formatHour(bestHour.hour)}`
    });
  }

  // Low Productivity Warning
  const lowHours = patterns.filter(p => p.category === 'low' && p.totalSessions > 2);
  if (lowHours.length > 0) {
    const worstHour = lowHours.reduce((worst, current) => 
      current.averageProductivity < worst.averageProductivity ? current : worst
    );
    
    insights.push({
      type: 'warning',
      title: 'Improvement Opportunity',
      description: `Consider optimizing your schedule around ${formatHour(worstHour.hour)} when productivity tends to be lower.`,
      metric: `${formatHour(worstHour.hour)}`
    });
  }

  // Consistency Analysis
  const productivityVariance = calculateProductivityVariance(currentData);
  if (productivityVariance < 15) {
    insights.push({
      type: 'positive',
      title: 'Consistent Performance',
      description: 'Your productivity levels are consistently stable across different days.',
      metric: 'Stable'
    });
  } else if (productivityVariance > 30) {
    insights.push({
      type: 'warning',
      title: 'Inconsistent Patterns',
      description: 'Your productivity varies significantly. Consider establishing more regular routines.',
      metric: 'Variable'
    });
  }

  // Activity Volume Insights
  const totalActivities = currentData.reduce((sum, day) => sum + day.total, 0);
  const avgPerDay = totalActivities / currentData.length;
  
  if (avgPerDay < 6) {
    insights.push({
      type: 'neutral',
      title: 'Low Activity Logging',
      description: 'Consider logging more activities throughout the day for better insights.',
      metric: `${avgPerDay.toFixed(1)}/day`
    });
  } else if (avgPerDay > 18) {
    insights.push({
      type: 'positive',
      title: 'Comprehensive Tracking',
      description: 'Great job maintaining detailed activity logs!',
      metric: `${avgPerDay.toFixed(1)}/day`
    });
  }

  return insights;
}

function calculateAverageProductivity(data: DayData[]): number {
  const totalActivities = data.reduce((sum, day) => sum + day.total, 0);
  const totalProductive = data.reduce((sum, day) => sum + day.productive, 0);
  
  return totalActivities > 0 ? (totalProductive / totalActivities) * 100 : 0;
}

function calculateProductivityVariance(data: DayData[]): number {
  const productivityRates = data
    .filter(day => day.total > 0)
    .map(day => (day.productive / day.total) * 100);
  
  if (productivityRates.length < 2) return 0;
  
  const mean = productivityRates.reduce((sum, rate) => sum + rate, 0) / productivityRates.length;
  const variance = productivityRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / productivityRates.length;
  
  return Math.sqrt(variance);
}

function formatHour(hour: number): string {
  const ampm = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${ampm}`;
}