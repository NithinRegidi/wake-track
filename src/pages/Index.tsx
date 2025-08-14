import { useEffect, useMemo, useState } from "react";
import AuthGate, { clearLocalUser } from "@/components/auth/AuthGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivitySlot, Category } from "@/components/tracker/ActivitySlot";
import SummaryChart from "@/components/tracker/SummaryChart";
import { WeeklyView } from "@/components/tracker/WeeklyView";
import { MonthlyView } from "@/components/tracker/MonthlyView";
import { ProductivityDashboard } from "@/components/tracker/ProductivityDashboard";
import { Input } from "@/components/ui/input";
import { LogOut, Calendar, BarChart3, TrendingUp } from "lucide-react";

// Types
interface ActivityItem { text: string; category: Category }
type DayActivities = Record<string, ActivityItem>;

// Helpers
const HOURS_RANGE = Array.from({ length: 24 }, (_, i) => (i + 5) % 24); // 5:00 -> 4:00 next day
const toHourKey = (h: number) => `${String(h).padStart(2, "0")}:00`;
const formatLabel = (hour: number) => {
  const next = (hour + 1) % 24;
  const fmt = (h: number) => {
    const ampm = h < 12 ? "AM" : "PM";
    const disp = h % 12 === 0 ? 12 : h % 12;
    return `${disp}:00 ${ampm}`;
  };
  return `${fmt(hour)} - ${fmt(next)}`;
};

const todayISO = () => new Date().toISOString().split("T")[0];
const storageKey = (userId: string, date: string) => `wt:${userId}:${date}`;

function loadDay(userId: string, date: string): DayActivities {
  try {
    const raw = localStorage.getItem(storageKey(userId, date));
    if (raw) return JSON.parse(raw);
  } catch {}
  // default empty day
  const empty: DayActivities = {};
  HOURS_RANGE.forEach((h) => (empty[toHourKey(h)] = { text: "", category: "neutral" }));
  return empty;
}

function saveDay(userId: string, date: string, data: DayActivities) {
  localStorage.setItem(storageKey(userId, date), JSON.stringify(data));
}

function computeCounts(data: DayActivities) {
  let productive = 0, unproductive = 0;
  Object.values(data).forEach((a) => {
    if (a.category === "productive") productive++;
    if (a.category === "unproductive") unproductive++;
  });
  const neutral = 24 - productive - unproductive;
  return { productive, unproductive, neutral };
}

function generateInsights(date: string, data: DayActivities) {
  const { productive, unproductive, neutral } = computeCounts(data);
  const topProd = Object.entries(data)
    .filter(([, a]) => a.category === "productive")
    .slice(0, 5)
    .map(([h, a]) => `${h} • ${a.text || "(no details)"}`);
  const topUn = Object.entries(data)
    .filter(([, a]) => a.category === "unproductive")
    .slice(0, 3)
    .map(([h, a]) => `${h} • ${a.text || "(no details)"}`);

  return [
    `Daily summary for ${date}:`,
    `• Productive: ${productive}h | Unproductive: ${unproductive}h | Uncategorized: ${neutral}h`,
    topProd.length ? `• Highlights: ${topProd.join("; ")}` : undefined,
    topUn.length ? `• Opportunities: ${topUn.join("; ")}` : undefined,
    productive >= 8
      ? "Great focus today—consider a short break routine to sustain momentum."
      : "Try batching similar tasks and reserving a distraction-free block for deep work.",
  ]
    .filter(Boolean)
    .join("\n");
}

const Index = () => {
  return (
    <main>
      <section className="py-10">
        <div className="container">
          <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Daily Time Tracker
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Log your activities and visualize your productivity.
            </p>
          </header>
          <AuthGate>
            {(userId) => <Tracker userId={userId} />}
          </AuthGate>
        </div>
      </section>
    </main>
  );
};

const Tracker = ({ userId }: { userId: string }) => {
  const [date, setDate] = useState<string>(todayISO());
  const [data, setData] = useState<DayActivities>(() => loadDay(userId, todayISO()));
  const [insights, setInsights] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("daily");
  const counts = useMemo(() => computeCounts(data), [data]);

  // Calculate week start (Monday) for weekly view
  const getWeekStart = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  // Get current month for monthly view
  const getCurrentMonth = (dateStr: string) => {
    return dateStr.substring(0, 7); // YYYY-MM
  };

  useEffect(() => {
    setData(loadDay(userId, date));
    setInsights("");
  }, [userId, date]);

  useEffect(() => {
    saveDay(userId, date, data);
  }, [userId, date, data]);

  const onTextChange = (hourKey: string, value: string) => {
    setData((prev) => ({ ...prev, [hourKey]: { ...prev[hourKey], text: value } }));
  };
  const onCategoryChange = (hourKey: string, category: Category) => {
    setData((prev) => ({ ...prev, [hourKey]: { ...prev[hourKey], category } }));
  };

  const exportJson = () => {
    const payload = JSON.stringify({ date, data }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waketrack_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground">
        <p>All data is saved automatically in your browser.</p>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="truncate max-w-[220px]">User ID: {userId}</span>
          <Button variant="outline" size="sm" onClick={() => { clearLocalUser(); location.reload(); }}>
            <LogOut className="mr-1" /> Sign out
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-12 items-center justify-center rounded-lg bg-muted/50 p-1 text-muted-foreground w-full max-w-md mx-auto">
          <TabsTrigger 
            value="daily" 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/60 flex-1"
          >
            <Calendar className="h-4 w-4" />
            Daily
          </TabsTrigger>
          <TabsTrigger 
            value="weekly" 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/60 flex-1"
          >
            <BarChart3 className="h-4 w-4" />
            Weekly
          </TabsTrigger>
          <TabsTrigger 
            value="monthly" 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/60 flex-1"
          >
            <TrendingUp className="h-4 w-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger 
            value="dashboard" 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/60 flex-1"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6 mt-6">
          <Card className="shadow-elevated">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Today's Log</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="date-picker" className="text-sm text-muted-foreground">Date</label>
                <Input id="date-picker" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {HOURS_RANGE.map((h) => {
                const key = toHourKey(h);
                const item = data[key] ?? { text: "", category: "neutral" as Category };
                return (
                  <ActivitySlot
                    key={key}
                    label={formatLabel(h)}
                    hourKey={key}
                    text={item.text}
                    category={item.category}
                    onTextChange={onTextChange}
                    onCategoryChange={onCategoryChange}
                  />
                );
              })}
            </CardContent>
          </Card>

          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="text-center">Productivity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <SummaryChart productive={counts.productive} unproductive={counts.unproductive} neutral={counts.neutral} />
                <div className="text-center md:text-left space-y-4">
                  <div className="rounded-lg p-4 bg-success/15">
                    <p className="text-lg font-medium">Productive Hours</p>
                    <p className="text-3xl font-bold">{counts.productive}</p>
                  </div>
                  <div className="rounded-lg p-4 bg-destructive/10">
                    <p className="text-lg font-medium">Unproductive Hours</p>
                    <p className="text-3xl font-bold">{counts.unproductive}</p>
                  </div>
                  <div className="rounded-lg p-4 bg-muted/50">
                    <p className="text-lg font-medium">Uncategorized Hours</p>
                    <p className="text-3xl font-bold">{counts.neutral}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setInsights(generateInsights(date, data))}>Get Daily Insights</Button>
                    <Button variant="secondary" onClick={exportJson}>Export JSON</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="text-center">Daily Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-accent/50 rounded-md p-4 whitespace-pre-wrap min-h-[96px]">
                {insights || "Insights will appear here after you click the button."}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <WeeklyView userId={userId} startDate={getWeekStart(date)} />
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <MonthlyView userId={userId} month={getCurrentMonth(date)} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <ProductivityDashboard userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
