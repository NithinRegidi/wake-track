import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface TimeEntry {
  id: string;
  date: string;
  hour: string;
  plannedActivity: string;
  actualActivity: string;
  plannedDuration: number; // minutes
  actualStartTime: number; // timestamp
  actualEndTime?: number; // timestamp
  isActive: boolean;
  category: 'productive' | 'neutral' | 'unproductive';
}

interface TimeTrackingData {
  [date: string]: {
    [hour: string]: TimeEntry;
  };
}

export function useTimeTracking(userId: string) {
  const [trackingData, setTrackingData] = useState<TimeTrackingData>(() => {
    const saved = localStorage.getItem(`time_tracking_${userId}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const { toast } = useToast();

  // Save tracking data to localStorage
  useEffect(() => {
    localStorage.setItem(`time_tracking_${userId}`, JSON.stringify(trackingData));
  }, [trackingData, userId]);

  // Auto-save active entry every 30 seconds
  useEffect(() => {
    if (!activeEntry) return;

    const interval = setInterval(() => {
      updateActiveEntry();
    }, 30000);

    return () => clearInterval(interval);
  }, [activeEntry]);

  const createTimeEntry = useCallback((
    date: string,
    hour: string,
    plannedActivity: string,
    category: 'productive' | 'neutral' | 'unproductive',
    plannedDuration: number = 60
  ) => {
    const entry: TimeEntry = {
      id: `${date}-${hour}-${Date.now()}`,
      date,
      hour,
      plannedActivity,
      actualActivity: '',
      plannedDuration,
      actualStartTime: 0,
      isActive: false,
      category
    };

    setTrackingData(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [hour]: entry
      }
    }));

    return entry;
  }, []);

  const startTracking = useCallback((entry: TimeEntry, actualActivity?: string) => {
    // Stop any currently active entry
    if (activeEntry) {
      stopTracking();
    }

    const now = Date.now();
    const updatedEntry = {
      ...entry,
      actualActivity: actualActivity || entry.plannedActivity,
      actualStartTime: now,
      actualEndTime: undefined,
      isActive: true
    };

    setActiveEntry(updatedEntry);
    setTrackingData(prev => ({
      ...prev,
      [entry.date]: {
        ...prev[entry.date],
        [entry.hour]: updatedEntry
      }
    }));

    toast({
      title: "⏱️ Time Tracking Started",
      description: `Now tracking: ${updatedEntry.actualActivity}`,
    });
  }, [activeEntry, toast]);

  const stopTracking = useCallback(() => {
    if (!activeEntry) return;

    const now = Date.now();
    const updatedEntry = {
      ...activeEntry,
      actualEndTime: now,
      isActive: false
    };

    const actualDuration = Math.round((now - activeEntry.actualStartTime) / (1000 * 60));

    setTrackingData(prev => ({
      ...prev,
      [activeEntry.date]: {
        ...prev[activeEntry.date],
        [activeEntry.hour]: updatedEntry
      }
    }));

    setActiveEntry(null);

    toast({
      title: "⏹️ Time Tracking Stopped",
      description: `Tracked ${actualDuration} minutes on: ${updatedEntry.actualActivity}`,
    });
  }, [activeEntry, toast]);

  const updateActiveEntry = useCallback(() => {
    if (!activeEntry) return;

    setTrackingData(prev => ({
      ...prev,
      [activeEntry.date]: {
        ...prev[activeEntry.date],
        [activeEntry.hour]: activeEntry
      }
    }));
  }, [activeEntry]);

  const getActualDuration = useCallback((entry: TimeEntry) => {
    if (!entry.actualStartTime) return 0;
    
    const endTime = entry.actualEndTime || Date.now();
    return Math.round((endTime - entry.actualStartTime) / (1000 * 60));
  }, []);

  const getVariance = useCallback((entry: TimeEntry) => {
    const actualDuration = getActualDuration(entry);
    return actualDuration - entry.plannedDuration;
  }, [getActualDuration]);

  const getDayStats = useCallback((date: string) => {
    const dayData = trackingData[date];
    if (!dayData) return null;

    const entries = Object.values(dayData);
    const totalPlanned = entries.reduce((sum, entry) => sum + entry.plannedDuration, 0);
    const totalActual = entries.reduce((sum, entry) => sum + getActualDuration(entry), 0);
    const completedTasks = entries.filter(entry => entry.actualEndTime).length;
    const activeTasks = entries.filter(entry => entry.isActive).length;

    return {
      totalPlanned,
      totalActual,
      variance: totalActual - totalPlanned,
      completedTasks,
      activeTasks,
      totalTasks: entries.length,
      efficiency: totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0
    };
  }, [trackingData, getActualDuration]);

  const getWeekStats = useCallback((startDate: string) => {
    const stats = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStats = getDayStats(dateStr);
      
      if (dayStats) {
        stats.push({ date: dateStr, ...dayStats });
      }
    }

    return stats;
  }, [getDayStats]);

  const updateEntry = useCallback((date: string, hour: string, updates: Partial<TimeEntry>) => {
    setTrackingData(prev => {
      const entry = prev[date]?.[hour];
      if (!entry) return prev;

      const updatedEntry = { ...entry, ...updates };
      
      if (activeEntry && activeEntry.id === entry.id) {
        setActiveEntry(updatedEntry);
      }

      return {
        ...prev,
        [date]: {
          ...prev[date],
          [hour]: updatedEntry
        }
      };
    });
  }, [activeEntry]);

  const deleteEntry = useCallback((date: string, hour: string) => {
    setTrackingData(prev => {
      const newDateData = { ...prev[date] };
      delete newDateData[hour];
      
      return {
        ...prev,
        [date]: newDateData
      };
    });

    if (activeEntry && activeEntry.date === date && activeEntry.hour === hour) {
      setActiveEntry(null);
    }
  }, [activeEntry]);

  return {
    trackingData,
    activeEntry,
    createTimeEntry,
    startTracking,
    stopTracking,
    updateEntry,
    deleteEntry,
    getActualDuration,
    getVariance,
    getDayStats,
    getWeekStats
  };
}