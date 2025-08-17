import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useNotifications, NotificationSettings as Settings } from "@/hooks/useNotifications";
import { Bell, BellOff, Smartphone, Clock, Calendar, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function NotificationSettings() {
  const { settings, updateSettings, permission, requestPermission } = useNotifications();

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (!granted) {
      alert('Notifications are blocked. Please enable them in your browser settings to receive reminders.');
    }
  };

  const weekDays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {permission === 'granted' ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Browser Notifications</p>
                <p className="text-sm text-muted-foreground">
                  {permission === 'granted' && 'Enabled and ready'}
                  {permission === 'denied' && 'Blocked - enable in browser settings'}
                  {permission === 'default' && 'Click to enable notifications'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={permission === 'granted' ? 'default' : 'destructive'}>
                {permission === 'granted' ? 'Enabled' : 'Disabled'}
              </Badge>
              {permission !== 'granted' && (
                <Button onClick={handlePermissionRequest} size="sm">
                  Enable
                </Button>
              )}
            </div>
          </div>

          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive smart reminders and check-ins
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Daily Reminder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <Label className="font-medium">Daily Check-in Reminder</Label>
                  </div>
                  <Switch
                    checked={settings.dailyReminder}
                    onCheckedChange={(dailyReminder) => updateSettings({ dailyReminder })}
                  />
                </div>
                {settings.dailyReminder && (
                  <div className="ml-6">
                    <Label htmlFor="daily-time" className="text-sm text-muted-foreground">
                      Reminder time
                    </Label>
                    <Input
                      id="daily-time"
                      type="time"
                      value={settings.dailyReminderTime}
                      onChange={(e) => updateSettings({ dailyReminderTime: e.target.value })}
                      className="w-32 mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Inactivity Reminder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <Label className="font-medium">Inactivity Reminders</Label>
                  </div>
                  <Switch
                    checked={settings.inactivityReminder}
                    onCheckedChange={(inactivityReminder) => updateSettings({ inactivityReminder })}
                  />
                </div>
                {settings.inactivityReminder && (
                  <div className="ml-6">
                    <Label htmlFor="inactivity-threshold" className="text-sm text-muted-foreground">
                      Remind after (minutes)
                    </Label>
                    <Input
                      id="inactivity-threshold"
                      type="number"
                      min="30"
                      max="480"
                      step="30"
                      value={settings.inactivityThreshold}
                      onChange={(e) => updateSettings({ inactivityThreshold: parseInt(e.target.value) || 120 })}
                      className="w-24 mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Weekly Check-in */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <Label className="font-medium">Weekly Progress Check</Label>
                  </div>
                  <Switch
                    checked={settings.weeklyCheckIn}
                    onCheckedChange={(weeklyCheckIn) => updateSettings({ weeklyCheckIn })}
                  />
                </div>
                {settings.weeklyCheckIn && (
                  <div className="ml-6 space-y-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">Day of week</Label>
                      <Select
                        value={settings.weeklyCheckInDay.toString()}
                        onValueChange={(value) => updateSettings({ weeklyCheckInDay: parseInt(value) })}
                      >
                        <SelectTrigger className="w-40 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {weekDays.map((day, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="weekly-time" className="text-sm text-muted-foreground">
                        Time
                      </Label>
                      <Input
                        id="weekly-time"
                        type="time"
                        value={settings.weeklyCheckInTime}
                        onChange={(e) => updateSettings({ weeklyCheckInTime: e.target.value })}
                        className="w-32 mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Goal Reminders */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <div>
                    <Label className="font-medium">Goal Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about your active goals
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.goalReminder}
                  onCheckedChange={(goalReminder) => updateSettings({ goalReminder })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}