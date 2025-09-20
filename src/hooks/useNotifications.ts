import { useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface NotificationSettings {
  breakReminders: boolean;
  breakInterval: number; // minutes
  productivityInsights: boolean;
  goalDeadlines: boolean;
  weeklyReports: boolean;
  smartSuggestions: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  breakReminders: true,
  breakInterval: 60,
  productivityInsights: true,
  goalDeadlines: true,
  weeklyReports: true,
  smartSuggestions: true,
};

export const useNotifications = () => {
  const { toast } = useToast();

  // Load settings from localStorage
  const getSettings = useCallback((): NotificationSettings => {
    const saved = localStorage.getItem('notification_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Error parsing notification settings:', error);
      }
    }
    return DEFAULT_SETTINGS;
  }, []);

  const saveSettings = useCallback((settings: NotificationSettings) => {
    localStorage.setItem('notification_settings', JSON.stringify(settings));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const current = getSettings();
    const updated = { ...current, ...newSettings };
    saveSettings(updated);
    
    toast({
      title: "Settings Updated",
      description: "Notification preferences have been saved.",
      duration: 3000,
    });
  }, [getSettings, saveSettings, toast]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Send browser notification
  const sendBrowserNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  }, []);

  // Send toast notification
  const sendToastNotification = useCallback((title: string, description: string, variant?: 'default' | 'destructive') => {
    toast({
      title,
      description,
      variant: variant || 'default',
      duration: 5000,
    });
  }, [toast]);

  // Send break reminder
  const sendBreakReminder = useCallback(() => {
    const settings = getSettings();
    if (!settings.breakReminders) return;

    sendToastNotification(
      "Time for a Break! 🧘‍♀️",
      "You've been working for a while. Take a short break to recharge."
    );

    sendBrowserNotification(
      "Break Time!",
      "Take a few minutes to rest and recharge."
    );
  }, [getSettings, sendToastNotification, sendBrowserNotification]);

  // Send productivity insight
  const sendProductivityInsight = useCallback((insight: string) => {
    const settings = getSettings();
    if (!settings.productivityInsights) return;

    sendToastNotification(
      "Productivity Insight 💡",
      insight
    );
  }, [getSettings, sendToastNotification]);

  // Send goal deadline reminder
  const sendGoalReminder = useCallback((goalName: string, deadline: Date) => {
    const settings = getSettings();
    if (!settings.goalDeadlines) return;

    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    sendToastNotification(
      "Goal Deadline Approaching ⏰",
      `"${goalName}" is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
    );

    sendBrowserNotification(
      "Goal Deadline",
      `"${goalName}" is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
    );
  }, [getSettings, sendToastNotification, sendBrowserNotification]);

  // Send smart suggestion
  const sendSmartSuggestion = useCallback((suggestion: string) => {
    const settings = getSettings();
    if (!settings.smartSuggestions) return;

    sendToastNotification(
      "Smart Suggestion ✨",
      suggestion
    );
  }, [getSettings, sendToastNotification]);

  // Send weekly report notification
  const sendWeeklyReport = useCallback((stats: { productive: number; total: number; streak: number }) => {
    const settings = getSettings();
    if (!settings.weeklyReports) return;

    const productivityRate = stats.total > 0 ? Math.round((stats.productive / stats.total) * 100) : 0;
    
    sendToastNotification(
      "Weekly Report 📊",
      `This week: ${productivityRate}% productivity rate, ${stats.streak} day streak!`
    );

    sendBrowserNotification(
      "Weekly Report",
      `Productivity: ${productivityRate}%, Streak: ${stats.streak} days`
    );
  }, [getSettings, sendToastNotification, sendBrowserNotification]);

  // Track activity for various notifications
  const recordActivity = useCallback(() => {
    // This can be used to track user activity and trigger appropriate notifications
    const now = new Date();
    const activityKey = `last_activity_${now.toISOString().split('T')[0]}`;
    localStorage.setItem(activityKey, now.toISOString());
  }, []);

  return {
    getSettings,
    updateSettings,
    requestPermission,
    sendBreakReminder,
    sendProductivityInsight,
    sendGoalReminder,
    sendSmartSuggestion,
    sendWeeklyReport,
    recordActivity,
  };
};