import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { DayActivities } from "@/pages/Index";

interface ExportData {
  activities: Record<string, DayActivities>;
  gamification: any;
  version: string;
  exportDate: string;
}

export function useDataManagement(userId: string) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const exportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const activities: Record<string, DayActivities> = {};
      const keys = Object.keys(localStorage);
      
      // Export activity data
      keys.forEach(key => {
        if (key.startsWith(`wt:${userId}:`)) {
          const date = key.replace(`wt:${userId}:`, '');
          const data = localStorage.getItem(key);
          if (data) {
            activities[date] = JSON.parse(data);
          }
        }
      });

      // Export gamification data
      const gamificationData = localStorage.getItem(`gamification_${userId}`);
      const gamification = gamificationData ? JSON.parse(gamificationData) : null;

      const exportData: ExportData = {
        activities,
        gamification,
        version: "1.0",
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productivity-tracker-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Data Exported",
        description: "Your productivity data has been exported successfully!",
      });
    } catch (error) {
      toast({
        title: "❌ Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [userId, toast]);

  const importData = useCallback(async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const importData: ExportData = JSON.parse(text);

      if (!importData.activities || !importData.version) {
        throw new Error("Invalid file format");
      }

      // Import activities
      Object.entries(importData.activities).forEach(([date, dayData]) => {
        localStorage.setItem(`wt:${userId}:${date}`, JSON.stringify(dayData));
      });

      // Import gamification data
      if (importData.gamification) {
        localStorage.setItem(`gamification_${userId}`, JSON.stringify(importData.gamification));
      }

      toast({
        title: "✅ Data Imported",
        description: `Successfully imported data from ${importData.exportDate ? new Date(importData.exportDate).toLocaleDateString() : 'backup'}`,
      });

      // Refresh page to reload data
      window.location.reload();
    } catch (error) {
      toast({
        title: "❌ Import Failed",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  }, [userId, toast]);

  const clearAllData = useCallback(() => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`wt:${userId}:`) || key === `gamification_${userId}`) {
        localStorage.removeItem(key);
      }
    });

    toast({
      title: "🗑️ Data Cleared",
      description: "All your productivity data has been cleared.",
    });

    window.location.reload();
  }, [userId, toast]);

  return {
    exportData,
    importData,
    clearAllData,
    isExporting,
    isImporting
  };
}