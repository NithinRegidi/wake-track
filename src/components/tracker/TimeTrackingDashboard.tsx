import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { Clock, Play, Square, TrendingUp, Calendar, Target } from "lucide-react";

interface TimeTrackingDashboardProps {
  userId: string;
  currentDate: string;
}

export function TimeTrackingDashboard({ userId, currentDate }: TimeTrackingDashboardProps) {
  const {
    trackingData,
    activeEntry,
    startTracking,
    stopTracking,
    createTimeEntry,
    getDayStats,
    getWeekStats,
    getActualDuration,
    getVariance
  } = useTimeTracking(userId);

  const [quickActivity, setQuickActivity] = useState("");
  const [plannedDuration, setPlannedDuration] = useState(60);

  const dayStats = useMemo(() => getDayStats(currentDate), [getDayStats, currentDate]);
  
  const getWeekStart = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
  };

  const weekStats = useMemo(() => 
    getWeekStats(getWeekStart(currentDate)), 
    [getWeekStats, currentDate]
  );

  const currentHour = new Date().getHours().toString().padStart(2, '0') + ':00';
  const todaysEntries = trackingData[currentDate] || {};

  const handleQuickTrack = () => {
    if (!quickActivity.trim()) return;

    const entry = createTimeEntry(
      currentDate, 
      currentHour, 
      quickActivity, 
      'productive', 
      plannedDuration
    );
    
    startTracking(entry, quickActivity);
    setQuickActivity("");
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90 && efficiency <= 110) return "text-green-600";
    if (efficiency >= 80 && efficiency <= 120) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Active Timer */}
      {activeEntry && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 animate-pulse" />
                Currently Tracking
              </div>
              <Button onClick={stopTracking} variant="destructive" size="sm">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{activeEntry.actualActivity}</div>
              <div className="text-sm text-muted-foreground">
                Started at {new Date(activeEntry.actualStartTime).toLocaleTimeString()}
              </div>
              <div className="text-lg font-mono">
                {formatDuration(getActualDuration(activeEntry))} / {formatDuration(activeEntry.plannedDuration)}
              </div>
              <Progress 
                value={(getActualDuration(activeEntry) / activeEntry.plannedDuration) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Track */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Quick Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="What are you working on?"
              value={quickActivity}
              onChange={(e) => setQuickActivity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickTrack()}
              className="flex-1"
            />
            <Input
              type="number"
              min="5"
              max="480"
              value={plannedDuration}
              onChange={(e) => setPlannedDuration(parseInt(e.target.value) || 60)}
              className="w-20"
              placeholder="60"
            />
            <Button 
              onClick={handleQuickTrack} 
              disabled={!quickActivity.trim() || !!activeEntry}
            >
              Start
            </Button>
          </div>
          {activeEntry && (
            <div className="text-xs text-muted-foreground">
              Stop current tracking to start a new session
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatDuration(dayStats.totalPlanned)}</div>
                    <div className="text-xs text-muted-foreground">Planned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatDuration(dayStats.totalActual)}</div>
                    <div className="text-xs text-muted-foreground">Actual</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getEfficiencyColor(dayStats.efficiency)}`}>
                      {dayStats.efficiency.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{dayStats.completedTasks}/{dayStats.totalTasks}</div>
                    <div className="text-xs text-muted-foreground">Tasks</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No time tracking data for today</p>
                  <p className="text-xs">Start tracking to see your stats</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Entries */}
          {Object.keys(todaysEntries).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Today's Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(todaysEntries).map(([hour, entry]) => {
                    const variance = getVariance(entry);
                    const actualDuration = getActualDuration(entry);
                    
                    return (
                      <div key={hour} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium">{entry.actualActivity || entry.plannedActivity}</div>
                          <div className="text-xs text-muted-foreground">{hour}</div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm">
                            {formatDuration(actualDuration)} / {formatDuration(entry.plannedDuration)}
                          </div>
                          {variance !== 0 && (
                            <Badge variant={variance > 0 ? "destructive" : "default"} className="text-xs">
                              {variance > 0 ? '+' : ''}{formatDuration(Math.abs(variance))}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weekStats.length > 0 ? (
                <div className="space-y-3">
                  {weekStats.map((stat) => (
                    <div key={stat.date} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">
                          {new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stat.completedTasks} tasks completed
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {formatDuration(stat.totalActual)} / {formatDuration(stat.totalPlanned)}
                        </div>
                        <div className={`text-xs ${getEfficiencyColor(stat.efficiency)}`}>
                          {stat.efficiency.toFixed(0)}% efficiency
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No weekly data available</p>
                  <p className="text-xs">Track time daily to build your weekly overview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}