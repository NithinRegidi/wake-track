import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBreakReminders } from "@/hooks/useBreakReminders";
import { Bell, BellOff, Droplets, Activity, Eye, Users } from "lucide-react";

interface BreakRemindersProps {
  userId: string;
}

const reminderIcons = {
  hydration: Droplets,
  movement: Activity,
  eyes: Eye,
  posture: Users
};

const reminderColors = {
  hydration: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  movement: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  eyes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  posture: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
};

export function BreakReminders({ userId }: BreakRemindersProps) {
  const {
    reminders,
    isActive,
    updateReminder,
    toggleReminder,
    resetReminder,
    toggleActive,
    requestNotificationPermission,
    getTimeUntilNextReminder
  } = useBreakReminders(userId);

  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  const handleToggleActive = async () => {
    if (!isActive && !hasRequestedPermission) {
      const granted = await requestNotificationPermission();
      setHasRequestedPermission(true);
      if (!granted) {
        // Still allow activation even without notifications
      }
    }
    toggleActive();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isActive ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            Break Reminders
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {isActive ? "Active" : "Inactive"}
            </span>
            <Switch checked={isActive} onCheckedChange={handleToggleActive} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reminders.map((reminder) => {
          const Icon = reminderIcons[reminder.type];
          const timeUntil = getTimeUntilNextReminder(reminder);
          
          return (
            <div key={reminder.id} className="space-y-3 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <Badge className={reminderColors[reminder.type]}>
                    {reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)}
                  </Badge>
                </div>
                <Switch
                  checked={reminder.enabled}
                  onCheckedChange={() => toggleReminder(reminder.id)}
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                {reminder.message}
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div>Interval: {reminder.interval} minutes</div>
                  {reminder.enabled && timeUntil && (
                    <div className="text-muted-foreground">
                      Next reminder: {timeUntil}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    min="5"
                    max="480"
                    value={reminder.interval}
                    onChange={(e) => updateReminder(reminder.id, {
                      interval: parseInt(e.target.value) || reminder.interval
                    })}
                    className="w-16 h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resetReminder(reminder.id)}
                    className="h-8 px-2 text-xs"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        <Separator />

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Reminders help maintain healthy work habits</p>
          <p>• Adjust intervals based on your preferences</p>
          <p>• Browser notifications require permission</p>
          {!isActive && (
            <p className="text-amber-600 dark:text-amber-400">
              ⚠️ Reminders are currently disabled
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}