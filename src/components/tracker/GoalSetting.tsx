import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trash2, Target, Calendar, Clock, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, isAfter, differenceInDays } from 'date-fns';

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number;
  current: number;
  unit: 'hours' | 'activities' | 'percentage';
  deadline?: Date;
  createdAt: Date;
  completed: boolean;
}

export const GoalSetting = ({ userId, onGoalCreated }: { userId: string; onGoalCreated?: () => void }) => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'daily' as Goal['type'],
    target: 8,
    unit: 'hours' as Goal['unit'],
    deadline: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  const STORAGE_KEY = `goals_${userId}`;

  // Load goals from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGoals(parsed.map((goal: any) => ({
          ...goal,
          createdAt: new Date(goal.createdAt),
          deadline: goal.deadline ? new Date(goal.deadline) : undefined,
        })));
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    }
  }, [STORAGE_KEY]);

  // Save goals to localStorage
  const saveGoals = (updatedGoals: Goal[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
    onGoalCreated?.();
  };

  // Add new goal
  const handleAddGoal = () => {
    if (!newGoal.title.trim() || !newGoal.target) {
      toast({
        title: "Invalid Goal",
        description: "Please provide a title and target value.",
        variant: "destructive",
      });
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type,
      target: newGoal.target,
      current: 0,
      unit: newGoal.unit,
      deadline: newGoal.deadline ? new Date(newGoal.deadline) : undefined,
      createdAt: new Date(),
      completed: false,
    };

    const updatedGoals = [...goals, goal];
    saveGoals(updatedGoals);

    setNewGoal({
      title: '',
      description: '',
      type: 'daily',
      target: 8,
      unit: 'hours',
      deadline: '',
    });
    setIsAdding(false);

    toast({
      title: "Goal Added",
      description: `"${goal.title}" has been added to your goals.`,
    });
  };

  return (
    <Button onClick={() => setIsAdding(true)} variant="outline">
      Add Goal
    </Button>
  );
};