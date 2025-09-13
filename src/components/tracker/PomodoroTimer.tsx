import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { usePomodoro } from "@/hooks/usePomodoro";
import { Play, Pause, RotateCcw, SkipForward, Settings, Timer, Coffee, Zap } from "lucide-react";

interface PomodoroTimerProps {
  userId: string;
}

const sessionTypeLabels = {
  work: "Work Session",
  shortBreak: "Short Break",
  longBreak: "Long Break"
};

const sessionTypeIcons = {
  work: Zap,
  shortBreak: Coffee,
  longBreak: Coffee
};

const sessionTypeColors = {
  work: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  shortBreak: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  longBreak: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
};

export function PomodoroTimer({ userId }: PomodoroTimerProps) {
  const {
    session,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession,
    updateSettings,
    resetPomodoro,
    formatTime,
    getProgress
  } = usePomodoro(userId);

  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  const SessionIcon = sessionTypeIcons[session.type];
  const progress = getProgress();

  const handleSaveSettings = () => {
    updateSettings(tempSettings);
    setShowSettings(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Pomodoro Timer
          </div>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pomodoro Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Work Duration (minutes)</label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={tempSettings.workDuration}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      workDuration: parseInt(e.target.value) || 25
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Short Break (minutes)</label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={tempSettings.shortBreak}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      shortBreak: parseInt(e.target.value) || 5
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Long Break (minutes)</label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={tempSettings.longBreak}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      longBreak: parseInt(e.target.value) || 15
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Long Break After (sessions)</label>
                  <Select
                    value={tempSettings.longBreakInterval.toString()}
                    onValueChange={(value) => setTempSettings(prev => ({
                      ...prev,
                      longBreakInterval: parseInt(value)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 sessions</SelectItem>
                      <SelectItem value="3">3 sessions</SelectItem>
                      <SelectItem value="4">4 sessions</SelectItem>
                      <SelectItem value="6">6 sessions</SelectItem>
                      <SelectItem value="8">8 sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSettings}>
                    Save Settings
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Type and Status */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <SessionIcon className="h-6 w-6" />
            <Badge className={sessionTypeColors[session.type]}>
              {sessionTypeLabels[session.type]}
            </Badge>
          </div>
          
          {/* Timer Display */}
          <div className="space-y-2">
            <div className="text-6xl font-mono font-bold">
              {formatTime(session.remaining)}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Session Counter */}
          <div className="text-sm text-muted-foreground">
            Completed Sessions: {session.completedSessions}
          </div>
        </div>

        <Separator />

        {/* Controls */}
        <div className="flex justify-center gap-2">
          {!session.isActive ? (
            <Button onClick={startTimer} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button onClick={pauseTimer} variant="outline" className="flex items-center gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          
          <Button onClick={resetTimer} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <Button onClick={skipSession} variant="outline" className="flex items-center gap-2">
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={resetPomodoro}
            className="text-xs"
          >
            Reset All
          </Button>
        </div>

        {/* Session Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Work: {settings.workDuration}min • Short Break: {settings.shortBreak}min</p>
          <p>• Long Break: {settings.longBreak}min (every {settings.longBreakInterval} sessions)</p>
        </div>
      </CardContent>
    </Card>
  );
}