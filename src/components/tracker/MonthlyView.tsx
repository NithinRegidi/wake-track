import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";

interface MonthlyViewProps {
  userId: string;
  month: string; // YYYY-MM format
}

export const MonthlyView = ({ userId, month }: MonthlyViewProps) => {
  const monthData = useMemo(() => {
    const data = [];
    const [year, monthNum] = month.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${monthNum}-${String(day).padStart(2, '0')}`;
      
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
            day: day,
            date: dateStr,
            productive,
            unproductive,
            neutral,
            total: productive + unproductive + neutral
          });
        } else {
          data.push({
            day: day,
            date: dateStr,
            productive: 0,
            unproductive: 0,
            neutral: 24,
            total: 24
          });
        }
      } catch {
        data.push({
          day: day,
          date: dateStr,
          productive: 0,
          unproductive: 0,
          neutral: 24,
          total: 24
        });
      }
    }
    
    return data;
  }, [userId, month]);

  const monthStats = useMemo(() => {
    const totals = monthData.reduce(
      (acc, day) => ({
        productive: acc.productive + day.productive,
        unproductive: acc.unproductive + day.unproductive,
        neutral: acc.neutral + day.neutral
      }),
      { productive: 0, unproductive: 0, neutral: 0 }
    );

    const daysWithData = monthData.filter(day => day.productive > 0 || day.unproductive > 0).length;
    const avgDaily = daysWithData > 0 ? {
      productive: Math.round(totals.productive / daysWithData * 10) / 10,
      unproductive: Math.round(totals.unproductive / daysWithData * 10) / 10,
      neutral: Math.round(totals.neutral / daysWithData * 10) / 10
    } : { productive: 0, unproductive: 0, neutral: 24 };

    const bestDay = monthData.reduce((best, day) => 
      day.productive > best.productive ? day : best, monthData[0] || { day: 1, productive: 0 }
    );

    const streak = monthData.reduce((acc, day) => {
      if (day.productive >= 6) {
        acc.current++;
        acc.longest = Math.max(acc.longest, acc.current);
      } else {
        acc.current = 0;
      }
      return acc;
    }, { current: 0, longest: 0 });

    return { totals, avgDaily, bestDay, daysWithData, streak: streak.longest };
  }, [monthData]);

  const weeklyAverages = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < monthData.length; i += 7) {
      const weekData = monthData.slice(i, i + 7);
      const weekTotal = weekData.reduce(
        (acc, day) => ({
          productive: acc.productive + day.productive,
          unproductive: acc.unproductive + day.unproductive
        }),
        { productive: 0, unproductive: 0 }
      );
      
      weeks.push({
        week: `Week ${Math.floor(i / 7) + 1}`,
        productive: Math.round(weekTotal.productive / weekData.length * 10) / 10,
        unproductive: Math.round(weekTotal.unproductive / weekData.length * 10) / 10
      });
    }
    return weeks;
  }, [monthData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Productive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{monthStats.totals.productive}h</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthStats.avgDaily.productive}h</p>
            <p className="text-xs text-muted-foreground">Active days: {monthStats.daysWithData}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Best Day</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{monthStats.bestDay.productive}h</p>
            <p className="text-xs text-muted-foreground">Day {monthStats.bestDay.day}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Best Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{monthStats.streak}</p>
            <p className="text-xs text-muted-foreground">Days with 6+ productive hours</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Productivity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <LineChart data={monthData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="productive" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  name="Productive Hours"
                />
                <Line 
                  type="monotone" 
                  dataKey="unproductive" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  name="Unproductive Hours"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Averages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer>
              <BarChart data={weeklyAverages}>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="productive" fill="hsl(var(--success))" name="Productive Avg" />
                <Bar dataKey="unproductive" fill="hsl(var(--destructive))" name="Unproductive Avg" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};