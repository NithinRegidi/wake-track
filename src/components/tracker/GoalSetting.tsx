import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, Calendar, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface Goal {
  id: string;
  title: string;
  type: 'daily' | 'weekly';
  target: number;
  metric: 'productive_hours' | 'total_activities' | 'streak_days';
  createdAt: string;
  isActive: boolean;
}

interface GoalSettingProps {
  userId: string;
  onGoalCreated: () => void;
}

export const GoalSetting = ({ userId, onGoalCreated }: GoalSettingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<'daily' | 'weekly'>('daily');
  const [target, setTarget] = useState("");
  const [metric, setMetric] = useState<'productive_hours' | 'total_activities' | 'streak_days'>('productive_hours');

  const handleSaveGoal = () => {
    if (!title || !target) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title,
      type,
      target: parseFloat(target),
      metric,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // Save to localStorage
    const goalsKey = `goals_${userId}`;
    const existingGoals = JSON.parse(localStorage.getItem(goalsKey) || '[]');
    existingGoals.push(goal);
    localStorage.setItem(goalsKey, JSON.stringify(existingGoals));

    toast({ title: "Success", description: "Goal created successfully!" });
    
    // Reset form
    setTitle("");
    setTarget("");
    setIsOpen(false);
    onGoalCreated();
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'productive_hours': return 'Productive Hours';
      case 'total_activities': return 'Total Activities';
      case 'streak_days': return 'Streak Days';
      default: return metric;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Set New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create New Goal
          </DialogTitle>
          <DialogDescription>
            Set a productivity goal to track your progress and stay motivated.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              placeholder="e.g., Focus 6 hours daily"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="type">Goal Type</Label>
            <Select value={type} onValueChange={(value: 'daily' | 'weekly') => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Goal
                  </div>
                </SelectItem>
                <SelectItem value="weekly">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Weekly Goal
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="metric">Metric to Track</Label>
            <Select value={metric} onValueChange={(value: any) => setMetric(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="productive_hours">Productive Hours</SelectItem>
                <SelectItem value="total_activities">Total Activities</SelectItem>
                <SelectItem value="streak_days">Streak Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="target">Target Value</Label>
            <Input
              id="target"
              type="number"
              placeholder="e.g., 6"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Target {getMetricLabel(metric).toLowerCase()} per {type === 'daily' ? 'day' : 'week'}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveGoal}>
            Create Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};