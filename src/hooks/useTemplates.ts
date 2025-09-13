import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@/components/tracker/ActivitySlot";

export interface ActivityTemplate {
  id: string;
  name: string;
  activities: {
    hour: string;
    text: string;
    category: Category;
  }[];
  createdAt: string;
}

export function useTemplates(userId: string) {
  const [templates, setTemplates] = useState<ActivityTemplate[]>(() => {
    const stored = localStorage.getItem(`templates_${userId}`);
    return stored ? JSON.parse(stored) : [];
  });
  const { toast } = useToast();

  const saveTemplate = useCallback((name: string, dayData: Record<string, any>) => {
    const activities = Object.entries(dayData)
      .filter(([_, activity]) => activity.text?.trim())
      .map(([hour, activity]) => ({
        hour,
        text: activity.text,
        category: activity.category
      }));

    if (activities.length === 0) {
      toast({
        title: "❌ Cannot Save Template",
        description: "No activities found to save as template.",
        variant: "destructive"
      });
      return;
    }

    const newTemplate: ActivityTemplate = {
      id: Date.now().toString(),
      name,
      activities,
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem(`templates_${userId}`, JSON.stringify(updatedTemplates));

    toast({
      title: "✅ Template Saved",
      description: `"${name}" template saved with ${activities.length} activities.`,
    });
  }, [templates, userId, toast]);

  const applyTemplate = useCallback((templateId: string, targetDate: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const dayData: Record<string, any> = {};
    template.activities.forEach(activity => {
      dayData[activity.hour] = {
        text: activity.text,
        category: activity.category
      };
    });

    localStorage.setItem(`wt:${userId}:${targetDate}`, JSON.stringify(dayData));

    toast({
      title: "✅ Template Applied",
      description: `"${template.name}" applied to ${new Date(targetDate).toLocaleDateString()}.`,
    });

    window.location.reload();
  }, [templates, userId, toast]);

  const deleteTemplate = useCallback((templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem(`templates_${userId}`, JSON.stringify(updatedTemplates));

    toast({
      title: "🗑️ Template Deleted",
      description: "Template removed successfully.",
    });
  }, [templates, userId, toast]);

  return {
    templates,
    saveTemplate,
    applyTemplate,
    deleteTemplate
  };
}