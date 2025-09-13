import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreak: number; // minutes
  longBreak: number; // minutes
  longBreakInterval: number; // after how many work sessions
}

interface PomodoroSession {
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  remaining: number;
  isActive: boolean;
  completedSessions: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4
};

export function usePomodoro(userId: string) {
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    const saved = localStorage.getItem(`pomodoro_settings_${userId}`);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [session, setSession] = useState<PomodoroSession>(() => {
    const saved = localStorage.getItem(`pomodoro_session_${userId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, isActive: false }; // Reset active state on reload
    }
    return {
      type: 'work',
      duration: DEFAULT_SETTINGS.workDuration * 60,
      remaining: DEFAULT_SETTINGS.workDuration * 60,
      isActive: false,
      completedSessions: 0
    };
  });

  const { toast } = useToast();

  // Save session to localStorage
  useEffect(() => {
    localStorage.setItem(`pomodoro_session_${userId}`, JSON.stringify(session));
  }, [session, userId]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(`pomodoro_settings_${userId}`, JSON.stringify(settings));
  }, [settings, userId]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (session.isActive && session.remaining > 0) {
      interval = setInterval(() => {
        setSession(prev => ({
          ...prev,
          remaining: prev.remaining - 1
        }));
      }, 1000);
    } else if (session.isActive && session.remaining === 0) {
      // Session completed
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [session.isActive, session.remaining]);

  const handleSessionComplete = useCallback(() => {
    const { type, completedSessions } = session;
    
    if (type === 'work') {
      const newCompletedSessions = completedSessions + 1;
      const isLongBreakTime = newCompletedSessions % settings.longBreakInterval === 0;
      const nextType = isLongBreakTime ? 'longBreak' : 'shortBreak';
      const nextDuration = isLongBreakTime ? settings.longBreak : settings.shortBreak;

      setSession(prev => ({
        type: nextType,
        duration: nextDuration * 60,
        remaining: nextDuration * 60,
        isActive: false,
        completedSessions: newCompletedSessions
      }));

      toast({
        title: "🍅 Work Session Complete!",
        description: `Great job! Time for a ${isLongBreakTime ? 'long' : 'short'} break.`,
      });

      // Play notification sound if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
          body: `Work session complete! Time for a ${isLongBreakTime ? 'long' : 'short'} break.`,
          icon: '/favicon.ico'
        });
      }
    } else {
      // Break finished, start new work session
      setSession(prev => ({
        type: 'work',
        duration: settings.workDuration * 60,
        remaining: settings.workDuration * 60,
        isActive: false,
        completedSessions: prev.completedSessions
      }));

      toast({
        title: "⏰ Break Complete!",
        description: "Ready to start your next work session?",
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
          body: 'Break time is over! Ready for another work session?',
          icon: '/favicon.ico'
        });
      }
    }
  }, [session, settings, toast]);

  const startTimer = useCallback(() => {
    setSession(prev => ({ ...prev, isActive: true }));
  }, []);

  const pauseTimer = useCallback(() => {
    setSession(prev => ({ ...prev, isActive: false }));
  }, []);

  const resetTimer = useCallback(() => {
    setSession(prev => ({
      ...prev,
      remaining: prev.duration,
      isActive: false
    }));
  }, []);

  const skipSession = useCallback(() => {
    handleSessionComplete();
  }, [handleSessionComplete]);

  const updateSettings = useCallback((newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    // Reset current session with new duration
    setSession(prev => {
      const newDuration = prev.type === 'work' ? newSettings.workDuration * 60 :
                         prev.type === 'shortBreak' ? newSettings.shortBreak * 60 :
                         newSettings.longBreak * 60;
      return {
        ...prev,
        duration: newDuration,
        remaining: newDuration,
        isActive: false
      };
    });
  }, []);

  const resetPomodoro = useCallback(() => {
    setSession({
      type: 'work',
      duration: settings.workDuration * 60,
      remaining: settings.workDuration * 60,
      isActive: false,
      completedSessions: 0
    });
  }, [settings]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getProgress = useCallback(() => {
    return ((session.duration - session.remaining) / session.duration) * 100;
  }, [session]);

  return {
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
  };
}