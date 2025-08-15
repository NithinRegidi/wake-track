import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Trophy, AlertCircle, Trash2 } from "lucide-react";
import { Goal } from "./GoalSetting";
import { toast } from "@/hooks/use-toast";

interface GoalProgressProps {
  userId: string;
  goals: Goal[];
  onGoalsChange: () => void;
}

export const GoalProgress = ({ userId, goals, onGoalsChange }: GoalProgressProps) => {
  const progressData = useMemo(() => {
    return goals.map(goal => {
      const currentProgress = calculateGoalProgress(goal, userId);
      const progressPercentage = Math.min((currentProgress / goal.target) * 100, 100);
      
      return {
        ...goal,
        currentProgress,
        progressPercentage,
        isCompleted: currentProgress >= goal.target,
      };
    });
  }, [goals, userId]);

  const deleteGoal = (goalId: string) => {
    const goalsKey = `goals_${userId}`;
    const updatedGoals = goals.filter(g => g.id !== goalId);
    localStorage.setItem(goalsKey, JSON.stringify(updatedGoals));
    toast({ title: "Goal deleted successfully" });
    onGoalsChange();
  };

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No goals set yet. Create your first goal to start tracking progress!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {progressData.map((goal) => (
        <Card key={goal.id} className={goal.isCompleted ? "border-success bg-success/5" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {goal.isCompleted ? (
                    <Trophy className="h-5 w-5 text-success" />
                  ) : (
                    <Target className="h-5 w-5" />
                  )}
                  {goal.title}
                </CardTitle>
                <CardDescription>
                  {goal.type === 'daily' ? 'Daily' : 'Weekly'} • {getMetricLabel(goal.metric)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={goal.isCompleted ? "default" : "secondary"}>
                  {goal.currentProgress}/{goal.target}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteGoal(goal.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{goal.progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={goal.progressPercentage} 
                className="h-2"
              />
            </div>
            
            {goal.isCompleted && (
              <div className="flex items-center gap-2 text-success text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Goal Completed! 🎉
              </div>
            )}
            
            {!goal.isCompleted && goal.progressPercentage > 0 && (
              <p className="text-sm text-muted-foreground">
                {(goal.target - goal.currentProgress).toFixed(1)} more {getMetricLabel(goal.metric).toLowerCase()} to reach your goal
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const calculateGoalProgress = (goal: Goal, userId: string): number => {
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  
  if (goal.type === 'daily') {
    // Calculate today's progress
    const dayKey = `activities_${userId}_${todayISO}`;
    const dayData = JSON.parse(localStorage.getItem(dayKey) || '{}');
    
    switch (goal.metric) {
      case 'productive_hours':
        return Object.values(dayData).filter((activity: any) => 
          activity?.category === 'productive'
        ).length;
      case 'total_activities':
        return Object.values(dayData).filter((activity: any) => 
          activity?.text && activity.text.trim()
        ).length;
      case 'streak_days':
        return calculateCurrentStreak(userId, todayISO);
      default:
        return 0;
    }
  } else {
    // Calculate this week's progress
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    let weekProgress = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateISO = date.toISOString().split('T')[0];
      const dayKey = `activities_${userId}_${dateISO}`;
      const dayData = JSON.parse(localStorage.getItem(dayKey) || '{}');
      
      switch (goal.metric) {
        case 'productive_hours':
          weekProgress += Object.values(dayData).filter((activity: any) => 
            activity?.category === 'productive'
          ).length;
          break;
        case 'total_activities':
          weekProgress += Object.values(dayData).filter((activity: any) => 
            activity?.text && activity.text.trim()
          ).length;
          break;
      }
    }
    
    if (goal.metric === 'streak_days') {
      return calculateCurrentStreak(userId, todayISO);
    }
    
    return weekProgress;
  }
};

const calculateCurrentStreak = (userId: string, currentDate: string): number => {
  let streak = 0;
  const date = new Date(currentDate);
  
  while (true) {
    const dateISO = date.toISOString().split('T')[0];
    const dayKey = `activities_${userId}_${dateISO}`;
    const dayData = JSON.parse(localStorage.getItem(dayKey) || '{}');
    
    const hasProductiveActivity = Object.values(dayData).some((activity: any) => 
      activity?.category === 'productive'
    );
    
    if (hasProductiveActivity) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
    
    // Prevent infinite loop
    if (streak > 365) break;
  }
  
  return streak;
};

const getMetricLabel = (metric: string) => {
  switch (metric) {
    case 'productive_hours': return 'Productive Hours';
    case 'total_activities': return 'Total Activities';
    case 'streak_days': return 'Streak Days';
    default: return metric;
  }
};