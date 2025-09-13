import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useBulkOperations } from "@/hooks/useBulkOperations";
import { Copy, Trash2, Calendar, CalendarDays } from "lucide-react";

interface BulkOperationsProps {
  userId: string;
  currentDate: string;
}

export function BulkOperations({ userId, currentDate }: BulkOperationsProps) {
  const { copyDay, clearDay, duplicateWeek } = useBulkOperations(userId);
  const [sourceDate, setSourceDate] = useState(currentDate);
  const [targetDate, setTargetDate] = useState(currentDate);
  const [sourceWeekStart, setSourceWeekStart] = useState("");
  const [targetWeekStart, setTargetWeekStart] = useState("");
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showWeekDialog, setShowWeekDialog] = useState(false);

  const handleCopyDay = () => {
    copyDay(sourceDate, targetDate);
    setShowCopyDialog(false);
  };

  const handleDuplicateWeek = () => {
    duplicateWeek(sourceWeekStart, targetWeekStart);
    setShowWeekDialog(false);
  };

  const getWeekStart = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          Bulk Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Copy Day
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Copy Activities Between Days</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Copy from</label>
                  <Input
                    type="date"
                    value={sourceDate}
                    onChange={(e) => setSourceDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Copy to</label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCopyDay}>
                    Copy Activities
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showWeekDialog} onOpenChange={setShowWeekDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Copy Week
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Duplicate Entire Week</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source week start (Monday)</label>
                  <Input
                    type="date"
                    value={sourceWeekStart}
                    onChange={(e) => setSourceWeekStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target week start (Monday)</label>
                  <Input
                    type="date"
                    value={targetWeekStart}
                    onChange={(e) => setTargetWeekStart(e.target.value)}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  This will copy all 7 days from the source week to the target week
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowWeekDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleDuplicateWeek}>
                    Duplicate Week
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Clear Day
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Current Day</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all activities for {new Date(currentDate).toLocaleDateString()}. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => clearDay(currentDate)}>
                  Clear Day
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Copy Day:</strong> Copy all activities from one day to another</p>
          <p>• <strong>Copy Week:</strong> Duplicate an entire week's schedule</p>
          <p>• <strong>Clear Day:</strong> Remove all activities from the current day</p>
        </div>
      </CardContent>
    </Card>
  );
}