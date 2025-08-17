import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  TrendingUp, TrendingDown, Clock, Target, BarChart3, Activity, Award, AlertTriangle, Info, Zap
} from "lucide-react";
import {
  loadUserDataRange,
  analyzeProductivityPatterns,
  generateTrendData,
  generateAdvancedInsights,
  type DayData,
  type ProductivityPattern,
  type TrendData,
  type InsightData
} from "@/lib/analytics";
import { format, subDays, subWeeks, subMonths } from "date-fns";

interface AdvancedAnalyticsProps {
  userId: string;
}

export function AdvancedAnalytics({ userId }: AdvancedAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [currentData, setCurrentData] = useState<DayData[]>([]);
  const [previousData, setPreviousData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate date ranges
  const dateRanges = useMemo(() => {
    const today = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

    switch (timeRange) {
      case 'week':
        currentEnd = today;
        currentStart = subDays(today, 7);
        previousEnd = subDays(today, 7);
        previousStart = subDays(today, 14);
        break;
      case 'month':
        currentEnd = today;
        currentStart = subDays(today, 30);
        previousEnd = subDays(today, 30);
        previousStart = subDays(today, 60);
        break;
      case 'quarter':
        currentEnd = today;
        currentStart = subDays(today, 90);
        previousEnd = subDays(today, 90);
        previousStart = subDays(today, 180);
        break;
    }

    return {
      current: {
        start: format(currentStart, 'yyyy-MM-dd'),
        end: format(currentEnd, 'yyyy-MM-dd')
      },
      previous: {
        start: format(previousStart, 'yyyy-MM-dd'),
        end: format(previousEnd, 'yyyy-MM-dd')
      }
    };
  }, [timeRange]);

  // Load data
  useEffect(() => {
    setIsLoading(true);
    
    const current = loadUserDataRange(userId, dateRanges.current.start, dateRanges.current.end);
    const previous = loadUserDataRange(userId, dateRanges.previous.start, dateRanges.previous.end);
    
    setCurrentData(current);
    setPreviousData(previous);
    setIsLoading(false);
  }, [userId, dateRanges]);

  // Analytics calculations
  const analytics = useMemo(() => {
    if (currentData.length === 0) return null;

    const patterns = analyzeProductivityPatterns(currentData);
    const trends = generateTrendData(currentData, timeRange === 'week' ? 'week' : 'month');
    const insights = generateAdvancedInsights(currentData, previousData, patterns);

    // Summary statistics
    const totalActivities = currentData.reduce((sum, day) => sum + day.total, 0);
    const totalProductive = currentData.reduce((sum, day) => sum + day.productive, 0);
    const totalUnproductive = currentData.reduce((sum, day) => sum + day.unproductive, 0);
    const productivityScore = totalActivities > 0 ? (totalProductive / totalActivities) * 100 : 0;

    // Previous period comparison
    const prevTotalActivities = previousData.reduce((sum, day) => sum + day.total, 0);
    const prevTotalProductive = previousData.reduce((sum, day) => sum + day.productive, 0);
    const prevProductivityScore = prevTotalActivities > 0 ? (prevTotalProductive / prevTotalActivities) * 100 : 0;
    const productivityChange = productivityScore - prevProductivityScore;

    return {
      patterns,
      trends,
      insights,
      summary: {
        totalActivities,
        totalProductive,
        totalUnproductive,
        productivityScore,
        productivityChange,
        activeDays: currentData.filter(day => day.total > 0).length
      }
    };
  }, [currentData, previousData, timeRange]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">Start tracking your activities to see advanced analytics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Deep insights into your productivity patterns</p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productivity Score</p>
                <p className="text-2xl font-bold">{analytics.summary.productivityScore.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  {analytics.summary.productivityChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : analytics.summary.productivityChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  ) : null}
                  <span className={`text-sm ${
                    analytics.summary.productivityChange > 0 ? 'text-success' : 
                    analytics.summary.productivityChange < 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {analytics.summary.productivityChange > 0 ? '+' : ''}{analytics.summary.productivityChange.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">{analytics.summary.totalActivities}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(analytics.summary.totalActivities / analytics.summary.activeDays || 0).toFixed(1)} per day
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Days</p>
                <p className="text-2xl font-bold">{analytics.summary.activeDays}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {((analytics.summary.activeDays / currentData.length) * 100).toFixed(0)}% of period
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Peak Hours</p>
                <p className="text-2xl font-bold">
                  {analytics.patterns.filter(p => p.category === 'peak').length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">identified</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.type === 'positive' ? 'bg-success/10 border-success/20' :
                  insight.type === 'warning' ? 'bg-warning/10 border-warning/20' :
                  'bg-muted/50 border-muted'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {insight.type === 'positive' ? (
                      <TrendingUp className="h-5 w-5 text-success mt-0.5" />
                    ) : insight.type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    ) : (
                      <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-semibold">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                  {insight.metric && (
                    <Badge variant={insight.type === 'positive' ? 'default' : 'secondary'}>
                      {insight.metric}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {analytics.insights.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Keep tracking to generate personalized insights!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="patterns">Peak Hours</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productivity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{label}</p>
                            <p className="text-success">Productive: {payload[0]?.value}</p>
                            <p className="text-destructive">Unproductive: {payload[1]?.value}</p>
                            <p className="text-muted-foreground">Neutral: {payload[2]?.value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="productive" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="unproductive" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="neutral" stackId="1" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Productivity Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.patterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => {
                      const ampm = hour < 12 ? 'AM' : 'PM';
                      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                      return `${displayHour}${ampm}`;
                    }}
                  />
                  <YAxis label={{ value: 'Productivity %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const hour = parseInt(label);
                        const ampm = hour < 12 ? 'AM' : 'PM';
                        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{displayHour}:00 {ampm}</p>
                            <p>Productivity: {(payload[0]?.value as number)?.toFixed(1)}%</p>
                            <p>Sessions: {analytics.patterns[hour]?.totalSessions || 0}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="averageProductivity" 
                    fill="hsl(var(--primary))"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Productive', value: analytics.summary.totalProductive, fill: 'hsl(var(--success))' },
                        { name: 'Unproductive', value: analytics.summary.totalUnproductive, fill: 'hsl(var(--destructive))' },
                        { name: 'Neutral', value: analytics.summary.totalActivities - analytics.summary.totalProductive - analytics.summary.totalUnproductive, fill: 'hsl(var(--muted-foreground))' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hour Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Peak', value: analytics.patterns.filter(p => p.category === 'peak').length, fill: 'hsl(var(--success))' },
                        { name: 'Good', value: analytics.patterns.filter(p => p.category === 'good').length, fill: 'hsl(var(--primary))' },
                        { name: 'Average', value: analytics.patterns.filter(p => p.category === 'average').length, fill: 'hsl(var(--warning))' },
                        { name: 'Low', value: analytics.patterns.filter(p => p.category === 'low').length, fill: 'hsl(var(--destructive))' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value}h)`}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Period Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  {
                    period: 'Previous',
                    productive: previousData.reduce((sum, day) => sum + day.productive, 0),
                    unproductive: previousData.reduce((sum, day) => sum + day.unproductive, 0),
                    neutral: previousData.reduce((sum, day) => sum + day.neutral, 0)
                  },
                  {
                    period: 'Current',
                    productive: analytics.summary.totalProductive,
                    unproductive: analytics.summary.totalUnproductive,
                    neutral: analytics.summary.totalActivities - analytics.summary.totalProductive - analytics.summary.totalUnproductive
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="productive" stackId="a" fill="hsl(var(--success))" name="Productive" />
                  <Bar dataKey="unproductive" stackId="a" fill="hsl(var(--destructive))" name="Unproductive" />
                  <Bar dataKey="neutral" stackId="a" fill="hsl(var(--muted-foreground))" name="Neutral" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}