import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string;
  inactivityReminder: boolean;
  inactivityThreshold: number; // minutes
  weeklyCheckIn: boolean;
  weeklyCheckInDay: number; // 0 = Sunday
  weeklyCheckInTime: string;
  goalReminder: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyReminder: true,
  dailyReminderTime: '09:00',
  inactivityReminder: true,
  inactivityThreshold: 120, // 2 hours
  weeklyCheckIn: true,
  weeklyCheckInDay: 1, // Monday
  weeklyCheckInTime: '18:00',
  goalReminder: true,
};

export function useNotifications() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notification-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('notification-settings', JSON.stringify(updated));
  };

  // Request notification permission
  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return false;
  };

  // Check current permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Send notification
  const sendNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (!settings.enabled || permission !== 'granted') return;

    if ('Notification' in window) {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }

    // Also show toast as fallback
    toast({
      title,
      description: body,
    });
  };

  // Track user activity
  const recordActivity = () => {
    setLastActivity(new Date());
  };

  // Inactivity checker
  useEffect(() => {
    if (!settings.enabled || !settings.inactivityReminder) return;

    const interval = setInterval(() => {
      if (lastActivity) {
        const now = new Date();
        const timeSinceActivity = now.getTime() - lastActivity.getTime();
        const thresholdMs = settings.inactivityThreshold * 60 * 1000;

        if (timeSinceActivity > thresholdMs) {
          sendNotification(
            'Time for a check-in! 📝',
            'You haven\'t logged any activities recently. How are you spending your time?'
          );
          setLastActivity(null); // Reset to avoid repeated notifications
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [settings, lastActivity, permission]);

  // Daily reminder scheduler
  useEffect(() => {
    if (!settings.enabled || !settings.dailyReminder) return;

    const scheduleDaily = () => {
      const now = new Date();
      const [hours, minutes] = settings.dailyReminderTime.split(':').map(Number);
      const scheduledTime = new Date(now);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const msUntilReminder = scheduledTime.getTime() - now.getTime();

      return setTimeout(() => {
        sendNotification(
          'Good morning! 🌅',
          'Ready to track your productive day? Start logging your activities now!'
        );
        scheduleDaily(); // Schedule next day
      }, msUntilReminder);
    };

    const timeout = scheduleDaily();
    return () => clearTimeout(timeout);
  }, [settings.dailyReminder, settings.dailyReminderTime, permission]);

  // Weekly check-in scheduler
  useEffect(() => {
    if (!settings.enabled || !settings.weeklyCheckIn) return;

    const scheduleWeekly = () => {
      const now = new Date();
      const [hours, minutes] = settings.weeklyCheckInTime.split(':').map(Number);
      
      // Find next occurrence of the specified day
      const daysUntilTarget = (settings.weeklyCheckInDay - now.getDay() + 7) % 7;
      const scheduledTime = new Date(now);
      scheduledTime.setDate(now.getDate() + daysUntilTarget);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // If it's today but time has passed, schedule for next week
      if (daysUntilTarget === 0 && scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 7);
      }

      const msUntilReminder = scheduledTime.getTime() - now.getTime();

      return setTimeout(() => {
        sendNotification(
          'Weekly Progress Check! 📊',
          'How did your week go? Review your productivity patterns and set goals for next week.'
        );
        scheduleWeekly(); // Schedule next week
      }, msUntilReminder);
    };

    const timeout = scheduleWeekly();
    return () => clearTimeout(timeout);
  }, [settings.weeklyCheckIn, settings.weeklyCheckInDay, settings.weeklyCheckInTime, permission]);

  // Smart suggestions based on patterns
  const sendSmartSuggestion = (suggestion: string) => {
    if (!settings.enabled) return;
    
    sendNotification(
      'Smart Suggestion 🤖',
      suggestion
    );
  };

  // Goal reminder
  const sendGoalReminder = (goalText: string) => {
    if (!settings.enabled || !settings.goalReminder) return;
    
    sendNotification(
      'Goal Reminder 🎯',
      `Don't forget: ${goalText}`
    );
  };

  return {
    settings,
    updateSettings,
    permission,
    requestPermission,
    sendNotification,
    recordActivity,
    sendSmartSuggestion,
    sendGoalReminder,
  };
}