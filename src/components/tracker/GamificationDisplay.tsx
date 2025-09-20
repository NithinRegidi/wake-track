import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, Zap, Award } from 'lucide-react';

export const GamificationDisplay = ({ userId }: { userId: string }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Gamification & Rewards
          </CardTitle>
          <CardDescription>
            Track your progress and unlock achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Gamification features coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};