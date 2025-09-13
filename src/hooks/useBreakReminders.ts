import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface BreakReminder {
  id: string;
  type: 'hydration' | 'movement' | 'eyes' | 'posture';
  message: string;
  interval: number; // minutes
  lastShown: number; // timestamp
  enabled: boolean;
}

const DEFAULT_REMINDERS: BreakReminder[] = [
  {
    id: 'hydration',
    type: 'hydration',
    message: '💧 Time to hydrate! Drink some water.',
    interval: 60, // every hour
    lastShown: 0,
    enabled: true
  },
  {
    id: 'movement',
    type: 'movement',
    message: '🚶 Take a movement break! Stand up and stretch.',
    interval: 45, // every 45 minutes
    lastShown: 0,
    enabled: true
  },
  {
    id: 'eyes',
    type: 'eyes',
    message: '👀 Rest your eyes! Look at something 20 feet away for 20 seconds.',
    interval: 20, // every 20 minutes
    lastShown: 0,
    enabled: true
  },
  {
    id: 'posture',
    type: 'posture',
    message: '🪑 Check your posture! Sit up straight and adjust your position.',
    interval: 30, // every 30 minutes
    lastShown: 0,
    enabled: true
  }
];

export function useBreakReminders(userId: string) {
  const [reminders, setReminders] = useState<BreakReminder[]>(() => {
    const saved = localStorage.getItem(`break_reminders_${userId}`);
    return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
  });

  const [isActive, setIsActive] = useState(() => {
    const saved = localStorage.getItem(`break_reminders_active_${userId}`);
    return saved ? JSON.parse(saved) : false;
  });

  const { toast } = useToast();

  // Save reminders to localStorage
  useEffect(() => {
    localStorage.setItem(`break_reminders_${userId}`, JSON.stringify(reminders));
  }, [reminders, userId]);

  // Save active state to localStorage
  useEffect(() => {
    localStorage.setItem(`break_reminders_active_${userId}`, JSON.stringify(isActive));
  }, [isActive, userId]);

  // Check for due reminders
  useEffect(() => {
    if (!isActive) return;

    const checkReminders = () => {
      const now = Date.now();
      
      reminders.forEach(reminder => {
        if (!reminder.enabled) return;
        
        const timeSinceLastShown = now - reminder.lastShown;
        const intervalMs = reminder.interval * 60 * 1000;
        
        if (timeSinceLastShown >= intervalMs) {
          showReminder(reminder);
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isActive, reminders]);

  const showReminder = useCallback((reminder: BreakReminder) => {
    toast({
      title: "🔔 Break Reminder",
      description: reminder.message,
      duration: 8000, // Show for 8 seconds
    });

    // Update last shown timestamp
    setReminders(prev => prev.map(r => 
      r.id === reminder.id 
        ? { ...r, lastShown: Date.now() }
        : r
    ));

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Break Reminder', {
        body: reminder.message,
        icon: '/favicon.ico'
      });
    }
  }, [toast]);

  const updateReminder = useCallback((id: string, updates: Partial<BreakReminder>) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ));
  }, []);

  const toggleReminder = useCallback((id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  }, []);

  const resetReminder = useCallback((id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, lastShown: Date.now() } : r
    ));
  }, []);

  const toggleActive = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  const getNextReminderTime = useCallback((reminder: BreakReminder) => {
    if (!reminder.enabled) return null;
    
    const nextTime = reminder.lastShown + (reminder.interval * 60 * 1000);
    return new Date(nextTime);
  }, []);

  const getTimeUntilNextReminder = useCallback((reminder: BreakReminder) => {
    const nextTime = getNextReminderTime(reminder);
    if (!nextTime) return null;
    
    const now = Date.now();
    const diff = nextTime.getTime() - now;
    
    if (diff <= 0) return "Due now";
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }, [getNextReminderTime]);

  return {
    reminders,
    isActive,
    updateReminder,
    toggleReminder,
    resetReminder,
    toggleActive,
    requestNotificationPermission,
    getNextReminderTime,
    getTimeUntilNextReminder
  };
}