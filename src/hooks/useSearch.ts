import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

interface SearchFilters {
  searchTerm: string;
  category: 'all' | 'productive' | 'unproductive' | 'neutral';
  dateFrom?: Date;
  dateTo?: Date;
  timeFrom?: string;
  timeTo?: string;
}

interface ActivityEntry {
  date: string;
  hour: string;
  text: string;
  category: 'productive' | 'unproductive' | 'neutral';
}

export const useSearch = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    category: 'all',
  });

  const [allActivities, setAllActivities] = useState<ActivityEntry[]>([]);

  // Load all activities from localStorage
  useEffect(() => {
    const activities: ActivityEntry[] = [];
    const keys = Object.keys(localStorage).filter(key => key.startsWith('wt:'));
    
    keys.forEach(key => {
      const parts = key.split(':');
      if (parts.length >= 3) {
        const date = parts[2];
        try {
          const dayData = JSON.parse(localStorage.getItem(key) || '{}');
          Object.entries(dayData).forEach(([hour, data]: [string, any]) => {
            if (data && typeof data === 'object' && data.text && data.text.trim()) {
              activities.push({
                date,
                hour,
                text: data.text,
                category: data.category || 'neutral',
              });
            }
          });
        } catch (error) {
          console.error('Error parsing stored data:', error);
        }
      }
    });

    activities.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return parseInt(b.hour) - parseInt(a.hour);
    });

    setAllActivities(activities);
  }, []);

  const filteredActivities = useMemo(() => {
    return allActivities.filter(activity => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        if (!activity.text.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== 'all' && activity.category !== filters.category) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        try {
          const activityDate = parseISO(activity.date);
          
          if (filters.dateFrom && isBefore(activityDate, startOfDay(filters.dateFrom))) {
            return false;
          }
          
          if (filters.dateTo && isAfter(activityDate, endOfDay(filters.dateTo))) {
            return false;
          }
        } catch (error) {
          console.error('Error parsing date:', error);
          return false;
        }
      }

      // Time range filter
      if (filters.timeFrom || filters.timeTo) {
        const activityHour = parseInt(activity.hour);
        
        if (filters.timeFrom) {
          const [fromHour] = filters.timeFrom.split(':').map(Number);
          if (activityHour < fromHour) return false;
        }
        
        if (filters.timeTo) {
          const [toHour] = filters.timeTo.split(':').map(Number);
          if (activityHour > toHour) return false;
        }
      }

      return true;
    });
  }, [allActivities, filters]);

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      category: 'all',
    });
  };

  // Statistics for filtered results
  const stats = useMemo(() => {
    const total = filteredActivities.length;
    const productive = filteredActivities.filter(a => a.category === 'productive').length;
    const unproductive = filteredActivities.filter(a => a.category === 'unproductive').length;
    const neutral = filteredActivities.filter(a => a.category === 'neutral').length;

    return {
      total,
      productive,
      unproductive,
      neutral,
      productivityRate: total > 0 ? Math.round((productive / total) * 100) : 0,
    };
  }, [filteredActivities]);

  // Most common activities
  const commonActivities = useMemo(() => {
    const activityCounts: Record<string, number> = {};
    
    filteredActivities.forEach(activity => {
      const text = activity.text.toLowerCase().trim();
      activityCounts[text] = (activityCounts[text] || 0) + 1;
    });

    return Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([text, count]) => ({ text, count }));
  }, [filteredActivities]);

  return {
    filters,
    filteredActivities,
    updateFilters,
    clearFilters,
    stats,
    commonActivities,
    totalActivities: allActivities.length,
  };
};