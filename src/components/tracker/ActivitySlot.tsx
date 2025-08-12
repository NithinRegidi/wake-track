import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThumbsUp, Ban } from "lucide-react";

export type Category = "productive" | "unproductive" | "neutral";

interface ActivitySlotProps {
  label: string;
  hourKey: string;
  text: string;
  category: Category;
  onTextChange: (hourKey: string, value: string) => void;
  onCategoryChange: (hourKey: string, category: Category) => void;
}

export const ActivitySlot = ({ label, hourKey, text, category, onTextChange, onCategoryChange }: ActivitySlotProps) => {
  const isProd = category === "productive";
  const isUnprod = category === "unproductive";

  return (
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
  );
};

export default ActivitySlot;
