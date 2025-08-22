import { useState, useMemo, useCallback } from "react";
import { Category } from "@/components/tracker/ActivitySlot";

interface SearchResult {
  date: string;
  hour: string;
  activity: string;
  category: Category;
  formattedDate: string;
  formattedTime: string;
}

export function useSearch(userId: string) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && categoryFilter === "all" && !dateRange.start) {
      return [];
    }

    const results: SearchResult[] = [];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(`wt:${userId}:`)) {
        const date = key.replace(`wt:${userId}:`, '');
        
        // Date range filter
        if (dateRange.start && date < dateRange.start) return;
        if (dateRange.end && date > dateRange.end) return;

        try {
          const dayData = JSON.parse(localStorage.getItem(key) || '{}');
          
          Object.entries(dayData).forEach(([hour, activity]: [string, any]) => {
            const activityText = activity.text?.toLowerCase() || '';
            const matchesSearch = !searchQuery.trim() || 
              activityText.includes(searchQuery.toLowerCase());
            
            const matchesCategory = categoryFilter === "all" || 
              activity.category === categoryFilter;

            if (matchesSearch && matchesCategory && activityText.trim()) {
              const hourNum = parseInt(hour.split(':')[0]);
              const ampm = hourNum < 12 ? 'AM' : 'PM';
              const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
              
              results.push({
                date,
                hour,
                activity: activity.text,
                category: activity.category,
                formattedDate: new Date(date + 'T00:00:00').toLocaleDateString(),
                formattedTime: `${displayHour}:00 ${ampm}`
              });
            }
          });
        } catch (error) {
          // Skip invalid data
        }
      }
    });

    // Sort by date and time (most recent first)
    return results.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.hour.localeCompare(a.hour);
    });
  }, [userId, searchQuery, categoryFilter, dateRange]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setCategoryFilter("all");
    setDateRange({ start: "", end: "" });
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    dateRange,
    setDateRange,
    searchResults,
    clearSearch
  };
}