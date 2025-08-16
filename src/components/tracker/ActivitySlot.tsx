import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThumbsUp, Ban, Sparkles } from "lucide-react";
import { categorizeActivity } from "@/lib/ai-suggestions";
import { useEffect, useState } from "react";

export type Category = "productive" | "unproductive" | "neutral";

interface ActivitySlotProps {
  label: string;
  hourKey: string;
  text: string;
  category: Category;
  onTextChange: (hourKey: string, value: string) => void;
  onCategoryChange: (hourKey: string, category: Category) => void;
  enableAIAssist?: boolean;
}

export const ActivitySlot = ({ 
  label, 
  hourKey, 
  text, 
  category, 
  onTextChange, 
  onCategoryChange, 
  enableAIAssist = true 
}: ActivitySlotProps) => {
  const isProd = category === "productive";
  const isUnprod = category === "unproductive";
  const [suggestedCategory, setSuggestedCategory] = useState<Category | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Auto-categorize on text change
  useEffect(() => {
    if (enableAIAssist && text.trim() && text.length > 3) {
      const suggested = categorizeActivity(text);
      if (suggested !== category) {
        setSuggestedCategory(suggested);
        setShowSuggestion(true);
        
        // Auto-hide suggestion after 10 seconds
        const timer = setTimeout(() => {
          setShowSuggestion(false);
        }, 10000);
        
        return () => clearTimeout(timer);
      } else {
        setShowSuggestion(false);
      }
    } else {
      setShowSuggestion(false);
    }
  }, [text, category, enableAIAssist]);

  const handleAcceptSuggestion = () => {
    if (suggestedCategory) {
      onCategoryChange(hourKey, suggestedCategory);
      setShowSuggestion(false);
    }
  };

  const handleDismissSuggestion = () => {
    setShowSuggestion(false);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-accent/40 transition-colors shadow-soft">
        <div className="sm:col-span-3">
          <p className="font-semibold">{label}</p>
        </div>
        <div className="sm:col-span-6">
          <Input
            data-hour={hourKey}
            value={text}
            onChange={(e) => onTextChange(hourKey, e.target.value)}
            placeholder="What did you do?"
          />
        </div>
        <div className="sm:col-span-3 flex justify-center sm:justify-end gap-2">
          <Button
            type="button"
            aria-pressed={isProd}
            onClick={() => onCategoryChange(hourKey, isProd ? "neutral" : "productive")}
            className={isProd ? "bg-success text-success-foreground" : ""}
            variant={isProd ? "default" : "secondary"}
            title="Mark as productive"
          >
            <ThumbsUp className="mr-1" />
            <span className="sr-only">Productive</span>
          </Button>
          <Button
            type="button"
            aria-pressed={isUnprod}
            onClick={() => onCategoryChange(hourKey, isUnprod ? "neutral" : "unproductive")}
            className={isUnprod ? "bg-destructive text-destructive-foreground" : ""}
            variant={isUnprod ? "default" : "secondary"}
            title="Mark as unproductive"
          >
            <Ban className="mr-1" />
            <span className="sr-only">Unproductive</span>
          </Button>
        </div>
      </div>
      
      {/* AI Suggestion */}
      {showSuggestion && suggestedCategory && enableAIAssist && (
        <div className="ml-0 sm:ml-[25%] bg-brand/10 border border-brand/20 rounded-lg p-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-brand" />
              <span className="text-muted-foreground">
                AI suggests: <span className="font-medium text-foreground capitalize">{suggestedCategory}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAcceptSuggestion}
                className="h-7 px-2 text-xs border-brand/30 hover:bg-brand/10"
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismissSuggestion}
                className="h-7 px-2 text-xs hover:bg-muted"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitySlot;
