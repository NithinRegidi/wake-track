import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface DayData {
  date: string;
  productive: number;
  unproductive: number;
  neutral: number;
}

interface WeeklyViewProps {
  userId: string;
  startDate: string; // ISO date string for week start
}

export const WeeklyView = ({ userId, startDate }: WeeklyViewProps) => {
  const weekData = useMemo(() => {
    const data: DayData[] = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = currentDate.toISOString().split("T")[0];
      
      try {
        const storageKey = `wt:${userId}:${dateStr}`;
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const dayActivities = JSON.parse(raw);
          let productive = 0, unproductive = 0;
          Object.values(dayActivities).forEach((activity: any) => {
            if (activity.category === "productive") productive++;
            if (activity.category === "unproductive") unproductive++;
          });
          const neutral = 24 - productive - unproductive;
          
          data.push({
            date: currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            productive,
            unproductive,
            neutral
          });
        } else {
          data.push({
            date: currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            productive: 0,
            unproductive: 0,
            neutral: 24
          });
        }
      } catch {
        data.push({
          date: currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          productive: 0,
          unproductive: 0,
          neutral: 24
        });
      }
    }
    
    return data;
  }, [userId, startDate]);

  const weekStats = useMemo(() => {
    const totals = weekData.reduce(
      (acc, day) => ({
        productive: acc.productive + day.productive,
        unproductive: acc.unproductive + day.unproductive,
        neutral: acc.neutral + day.neutral
      }),
      { productive: 0, unproductive: 0, neutral: 0 }
    );

    const avgDaily = {
      productive: Math.round(totals.productive / 7 * 10) / 10,
      unproductive: Math.round(totals.unproductive / 7 * 10) / 10,
      neutral: Math.round(totals.neutral / 7 * 10) / 10
    };

    const bestDay = weekData.reduce((best, day) => 
      day.productive > best.productive ? day : best, weekData[0] || { date: 'N/A', productive: 0 }
    );

    return { totals, avgDaily, bestDay };
  }, [weekData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={weekData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="productive" stackId="a" fill="hsl(var(--success))" name="Productive" />
                <Bar dataKey="unproductive" stackId="a" fill="hsl(var(--destructive))" name="Unproductive" />
                <Bar dataKey="neutral" stackId="a" fill="hsl(var(--muted-foreground))" name="Uncategorized" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-success">Productive:</span>
              <span className="font-bold">{weekStats.totals.productive}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-destructive">Unproductive:</span>
              <span className="font-bold">{weekStats.totals.unproductive}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uncategorized:</span>
              <span className="font-bold">{weekStats.totals.neutral}h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Average</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-success">Productive:</span>
              <span className="font-bold">{weekStats.avgDaily.productive}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-destructive">Unproductive:</span>
              <span className="font-bold">{weekStats.avgDaily.unproductive}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uncategorized:</span>
              <span className="font-bold">{weekStats.avgDaily.neutral}h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{weekStats.bestDay.productive}h</p>
              <p className="text-sm text-muted-foreground">{weekStats.bestDay.date}</p>
              <p className="text-xs text-muted-foreground mt-1">Most productive</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};