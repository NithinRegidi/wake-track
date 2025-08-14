import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, Legend, BarChart, Bar } from "recharts";
import { Calendar, TrendingUp, Target, Award } from "lucide-react";

interface ProductivityDashboardProps {
  userId: string;
}

export const ProductivityDashboard = ({ userId }: ProductivityDashboardProps) => {
  const [timeRange, setTimeRange] = useState<string>("30"); // days
  const [filter, setFilter] = useState<string>("all");

  const analyticsData = useMemo(() => {
    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const dailyData = [];
    const activityBreakdown = new Map<string, { productive: number; unproductive: number; count: number }>();
    let totalProductive = 0, totalUnproductive = 0, totalNeutral = 0;
    let bestDay = { date: '', productive: 0 };
    let worstDay = { date: '', productive: 24 };
    let activeStreak = 0, currentStreak = 0, longestStreak = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      
      try {
        const storageKey = `wt:${userId}:${dateStr}`;
        const raw = localStorage.getItem(storageKey);
        
        if (raw) {
          const dayActivities = JSON.parse(raw);
          let dayProductive = 0, dayUnproductive = 0;
          
          Object.entries(dayActivities).forEach(([hour, activity]: [string, any]) => {
            if (activity.category === "productive") {
              dayProductive++;
              if (activity.text.trim()) {
                const key = activity.text.toLowerCase().trim();
                const current = activityBreakdown.get(key) || { productive: 0, unproductive: 0, count: 0 };
                activityBreakdown.set(key, { ...current, productive: current.productive + 1, count: current.count + 1 });
              }
            }
            if (activity.category === "unproductive") {
              dayUnproductive++;
              if (activity.text.trim()) {
                const key = activity.text.toLowerCase().trim();
                const current = activityBreakdown.get(key) || { productive: 0, unproductive: 0, count: 0 };
                activityBreakdown.set(key, { ...current, unproductive: current.unproductive + 1, count: current.count + 1 });
              }
            }
          });
          
          const dayNeutral = 24 - dayProductive - dayUnproductive;
          
          totalProductive += dayProductive;
          totalUnproductive += dayUnproductive;
          totalNeutral += dayNeutral;
          
          // Track streaks
          if (dayProductive >= 6) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
          
          // Track best/worst days
          if (dayProductive > bestDay.productive) {
            bestDay = { date: dateStr, productive: dayProductive };
          }
          if (dayProductive < worstDay.productive) {
            worstDay = { date: dateStr, productive: dayProductive };
          }
          
          dailyData.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: dateStr,
            productive: dayProductive,
            unproductive: dayUnproductive,
            neutral: dayNeutral,
            productivity: Math.round((dayProductive / (dayProductive + dayUnproductive + dayNeutral)) * 100)
          });
          
          activeStreak++;
        } else {
          dailyData.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: dateStr,
            productive: 0,
            unproductive: 0,
            neutral: 24,
            productivity: 0
          });
          currentStreak = 0;
        }
      } catch {
        dailyData.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: dateStr,
          productive: 0,
          unproductive: 0,
          neutral: 24,
          productivity: 0
        });
        currentStreak = 0;
      }
    }

    // Get top activities
    const topActivities = Array.from(activityBreakdown.entries())
      .map(([name, data]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        ...data,
        ratio: data.productive / (data.productive + data.unproductive || 1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const averages = {
      productive: Math.round(totalProductive / days * 10) / 10,
      unproductive: Math.round(totalUnproductive / days * 10) / 10,
      neutral: Math.round(totalNeutral / days * 10) / 10
    };

    return { 
      dailyData, 
      topActivities, 
      totals: { totalProductive, totalUnproductive, totalNeutral },
      averages,
      bestDay,
      worstDay,
      activeStreak,
      longestStreak
    };
  }, [userId, timeRange]);

  const pieData = [
    { name: "Productive", value: analyticsData.totals.totalProductive, color: "hsl(var(--success))" },
    { name: "Unproductive", value: analyticsData.totals.totalUnproductive, color: "hsl(var(--destructive))" },
    { name: "Uncategorized", value: analyticsData.totals.totalNeutral, color: "hsl(var(--muted-foreground))" }
  ];

  const filteredDailyData = analyticsData.dailyData.filter(day => {
    if (filter === "productive") return day.productive >= 6;
    if (filter === "poor") return day.productive < 3;
    return true;
  });

  const generateRecommendations = () => {
    const { averages, topActivities, longestStreak } = analyticsData;
    const recommendations = [];

    if (averages.productive < 6) {
      recommendations.push("🎯 Aim for 6+ productive hours daily - you're currently averaging " + averages.productive + "h");
    }

    if (averages.unproductive > 4) {
      recommendations.push("⚠️ Try to reduce unproductive time - currently " + averages.unproductive + "h daily average");
    }

    const bestActivity = topActivities.find(a => a.ratio > 0.8);
    if (bestActivity) {
      recommendations.push("✨ Great job with '" + bestActivity.name + "' - keep prioritizing this activity");
    }

    if (longestStreak > 0) {
      recommendations.push("🔥 Your best streak was " + longestStreak + " days - try to beat it!");
    } else {
      recommendations.push("💪 Start building a streak of 6+ productive hours per day");
    }

    const improvementArea = topActivities.find(a => a.ratio < 0.3 && a.count > 3);
    if (improvementArea) {
      recommendations.push("🔧 Consider optimizing '" + improvementArea.name + "' - it's often unproductive");
    }

    return recommendations;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 2 weeks</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All days</SelectItem>
              <SelectItem value="productive">Good days (6+h)</SelectItem>
              <SelectItem value="poor">Poor days (&lt;3h)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">{analyticsData.averages.productive}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Best Day</p>
                <p className="text-2xl font-bold text-success">{analyticsData.bestDay.productive}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Productive</p>
                <p className="text-2xl font-bold">{analyticsData.totals.totalProductive}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Best Streak</p>
                <p className="text-2xl font-bold">{analyticsData.longestStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Productivity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer>
                <LineChart data={filteredDailyData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="productive" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Top Activities Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={analyticsData.topActivities}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="productive" stackId="a" fill="hsl(var(--success))" name="Productive Hours" />
                <Bar dataKey="unproductive" stackId="a" fill="hsl(var(--destructive))" name="Unproductive Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {generateRecommendations().map((rec, index) => (
              <div key={index} className="p-3 bg-accent/50 rounded-lg">
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};