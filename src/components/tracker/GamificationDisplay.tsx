import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Flame, Target, Award, Calendar, TrendingUp } from "lucide-react";
import { 
  GamificationData, 
  loadGamificationData, 
  saveGamificationData, 
  updateBadges, 
  updateWeeklyChallenge,
  calculateLevel,
  calculateStreak
} from "@/lib/gamification";

interface GamificationDisplayProps {
  userId: string;
}

export function GamificationDisplay({ userId }: GamificationDisplayProps) {
  const [data, setData] = useState<GamificationData>(() => loadGamificationData(userId));

  useEffect(() => {
    // Update gamification data when component mounts or userId changes
    const refreshData = () => {
      const currentData = loadGamificationData(userId);
      const streak = calculateStreak(userId);
      const { level, pointsToNext } = calculateLevel(currentData.totalPoints);
      
      const updatedBadges = updateBadges(userId, currentData);
      const updatedChallenge = currentData.weeklyChallenge 
        ? updateWeeklyChallenge(userId, currentData.weeklyChallenge)
        : null;

      const newData: GamificationData = {
        ...currentData,
        currentStreak: streak.current,
        longestStreak: Math.max(streak.longest, currentData.longestStreak),
        badges: updatedBadges,
        weeklyChallenge: updatedChallenge,
        level,
        pointsToNextLevel: pointsToNext
      };

      setData(newData);
      saveGamificationData(userId, newData);
    };

    refreshData();
    
    // Refresh data every minute to keep it current
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  const earnedBadges = data.badges.filter(badge => badge.earned);
  const unearnedBadges = data.badges.filter(badge => !badge.earned);

  return (
    <div className="space-y-6">
      {/* Level & Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-elevated">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Star className="h-4 w-4 ml-auto text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.level}</div>
            <p className="text-xs text-muted-foreground">
              {data.pointsToNextLevel} points to next level
            </p>
            <Progress value={(100 - (data.pointsToNextLevel / (data.level * 100)) * 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 ml-auto text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime points earned</p>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 ml-auto text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Best: {data.longestStreak} days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="challenges" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-4">
          {data.weeklyChallenge && (
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand" />
                  Weekly Challenge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{data.weeklyChallenge.name}</h3>
                    <Badge variant={data.weeklyChallenge.completed ? "default" : "secondary"}>
                      {data.weeklyChallenge.completed ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {data.weeklyChallenge.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{data.weeklyChallenge.progress} / {data.weeklyChallenge.target}</span>
                    </div>
                    <Progress 
                      value={(data.weeklyChallenge.progress / data.weeklyChallenge.target) * 100} 
                      className="h-3"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-sm">Reward</span>
                    <Badge variant="outline">{data.weeklyChallenge.points} points</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          {earnedBadges.length > 0 && (
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Earned Badges ({earnedBadges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {earnedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center p-4 rounded-lg bg-success/10 border border-success/20 hover:bg-success/15 transition-colors"
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <h3 className="font-semibold text-sm text-center">{badge.name}</h3>
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        {badge.description}
                      </p>
                      {badge.earnedAt && (
                        <p className="text-xs text-success mt-2">
                          Earned {new Date(badge.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {unearnedBadges.length > 0 && (
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Available Badges ({unearnedBadges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {unearnedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-colors opacity-75"
                    >
                      <div className="text-3xl mb-2 grayscale">{badge.icon}</div>
                      <h3 className="font-semibold text-sm text-center">{badge.name}</h3>
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        {badge.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Achievement Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Badges Earned</span>
                  <span className="font-semibold">{earnedBadges.length} / {data.badges.length}</span>
                </div>
                <Progress value={(earnedBadges.length / data.badges.length) * 100} />
                
                <div className="flex justify-between">
                  <span>Current Level</span>
                  <span className="font-semibold">Level {data.level}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Longest Streak</span>
                  <span className="font-semibold">{data.longestStreak} days</span>
                </div>

                {data.weeklyChallenge && (
                  <div className="flex justify-between">
                    <span>Weekly Challenge</span>
                    <Badge variant={data.weeklyChallenge.completed ? "default" : "secondary"}>
                      {data.weeklyChallenge.completed ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>How to Earn Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Productive Hour</span>
                  <Badge variant="outline">10 pts</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Early Bird (5-8 AM)</span>
                  <Badge variant="outline">15 pts</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Night Owl (9-11 PM)</span>
                  <Badge variant="outline">12 pts</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Logging Activity</span>
                  <Badge variant="outline">2 pts</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Weekly Challenge</span>
                  <Badge variant="outline">80-150 pts</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
