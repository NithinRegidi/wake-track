import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Zap, X, Clock } from "lucide-react";
import { Category } from "@/components/tracker/ActivitySlot";
import { useToast } from "@/hooks/use-toast";

interface QuickActionsProps {
  userId: string;
  currentDate: string;
  onActivityAdded?: () => void;
}

const quickActivityPresets = [
  { text: "Morning Exercise", category: "productive" as Category },
  { text: "Team Meeting", category: "productive" as Category },
  { text: "Coffee Break", category: "neutral" as Category },
  { text: "Lunch", category: "neutral" as Category },
  { text: "Email Check", category: "productive" as Category },
  { text: "Social Media", category: "unproductive" as Category },
  { text: "Planning Session", category: "productive" as Category },
  { text: "Learning/Reading", category: "productive" as Category },
];

export function QuickActions({ userId, currentDate, onActivityAdded }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickActivity, setQuickActivity] = useState("");
  const [quickCategory, setQuickCategory] = useState<Category>("productive");
  const [selectedHour, setSelectedHour] = useState("");
  const { toast } = useToast();

  // Set default hour to current hour
  useEffect(() => {
    const currentHour = new Date().getHours();
    setSelectedHour(`${currentHour.toString().padStart(2, '0')}:00`);
  }, []);

  const generateHourOptions = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      hours.push(`${hour}:00`);
    }
    return hours;
  };

  const addQuickActivity = (activityText: string, category: Category) => {
    if (!selectedHour) {
      toast({
        title: "❌ Hour Required",
        description: "Please select an hour for the activity.",
        variant: "destructive"
      });
      return;
    }

    const dayKey = `wt:${userId}:${currentDate}`;
    const existingData = JSON.parse(localStorage.getItem(dayKey) || '{}');
    
    existingData[selectedHour] = {
      text: activityText,
      category: category
    };

    localStorage.setItem(dayKey, JSON.stringify(existingData));

    toast({
      title: "✅ Activity Added",
      description: `"${activityText}" added to ${selectedHour.split(':')[0]}:00.`,
    });

    onActivityAdded?.();
    setShowQuickAdd(false);
    setQuickActivity("");
  };

  const handleCustomActivity = () => {
    if (!quickActivity.trim()) return;
    addQuickActivity(quickActivity, quickCategory);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full shadow-lg"
          size="lg"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
        </Button>
      </div>

      {/* Quick Actions Menu */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40">
          <Card className="w-80 shadow-xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Quick Actions</span>
              </div>

              {/* Hour Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Slot</label>
                <Select value={selectedHour} onValueChange={setSelectedHour}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hour" />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {generateHourOptions().map((hour) => {
                      const hourNum = parseInt(hour.split(':')[0]);
                      const ampm = hourNum < 12 ? 'AM' : 'PM';
                      const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
                      return (
                        <SelectItem key={hour} value={hour}>
                          {hour} ({displayHour}:00 {ampm})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Add Custom Activity */}
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowQuickAdd(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Activity
              </Button>

              {/* Preset Activities */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-2">Quick Presets</div>
                {quickActivityPresets.slice(0, 6).map((preset, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => addQuickActivity(preset.text, preset.category)}
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      preset.category === 'productive' ? 'bg-green-500' :
                      preset.category === 'neutral' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    {preset.text}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom Activity Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Quick Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter activity..."
              value={quickActivity}
              onChange={(e) => setQuickActivity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomActivity()}
            />
            <Select value={quickCategory} onValueChange={(value) => setQuickCategory(value as Category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="productive">Productive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="unproductive">Unproductive</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowQuickAdd(false)}>
                Cancel
              </Button>
              <Button onClick={handleCustomActivity} disabled={!quickActivity.trim()}>
                Add Activity
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}