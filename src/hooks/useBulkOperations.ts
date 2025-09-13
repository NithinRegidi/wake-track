import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { DayActivities } from "@/pages/Index";

export function useBulkOperations(userId: string) {
  const { toast } = useToast();

  const copyDay = useCallback((sourceDate: string, targetDate: string) => {
    const sourceData = localStorage.getItem(`wt:${userId}:${sourceDate}`);
    
    if (!sourceData) {
      toast({
        title: "❌ Copy Failed",
        description: "No activities found for the selected date.",
        variant: "destructive"
      });
      return;
    }

    const parsedData = JSON.parse(sourceData);
    const activityCount = Object.keys(parsedData).filter(key => parsedData[key].text?.trim()).length;

    if (activityCount === 0) {
      toast({
        title: "❌ Copy Failed",
        description: "No activities found for the selected date.",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem(`wt:${userId}:${targetDate}`, sourceData);

    toast({
      title: "✅ Day Copied",
      description: `Copied ${activityCount} activities from ${new Date(sourceDate).toLocaleDateString()} to ${new Date(targetDate).toLocaleDateString()}.`,
    });

    window.location.reload();
  }, [userId, toast]);

  const clearDay = useCallback((date: string) => {
    localStorage.removeItem(`wt:${userId}:${date}`);

    toast({
      title: "🗑️ Day Cleared",
      description: `All activities for ${new Date(date).toLocaleDateString()} have been cleared.`,
    });

    window.location.reload();
  }, [userId, toast]);

  const duplicateWeek = useCallback((startDate: string, targetStartDate: string) => {
    let copiedDays = 0;
    
    for (let i = 0; i < 7; i++) {
      const sourceDate = new Date(startDate);
      sourceDate.setDate(sourceDate.getDate() + i);
      const sourceKey = sourceDate.toISOString().split('T')[0];
      
      const targetDate = new Date(targetStartDate);
      targetDate.setDate(targetDate.getDate() + i);
      const targetKey = targetDate.toISOString().split('T')[0];
      
      const sourceData = localStorage.getItem(`wt:${userId}:${sourceKey}`);
      if (sourceData) {
        localStorage.setItem(`wt:${userId}:${targetKey}`, sourceData);
        copiedDays++;
      }
    }

    toast({
      title: "✅ Week Duplicated",
      description: `Copied ${copiedDays} days to the target week.`,
    });

    window.location.reload();
  }, [userId, toast]);

  return {
    copyDay,
    clearDay,
    duplicateWeek
  };
}