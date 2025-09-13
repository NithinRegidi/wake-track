import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTemplates } from "@/hooks/useTemplates";
import { BookTemplate, Plus, Play, Trash2, Calendar } from "lucide-react";
import { DayActivities } from "@/pages/Index";

interface TemplateManagerProps {
  userId: string;
  currentDate: string;
  dayActivities: DayActivities;
}

const categoryColors = {
  productive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  neutral: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  unproductive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

export function TemplateManager({ userId, currentDate, dayActivities }: TemplateManagerProps) {
  const { templates, saveTemplate, applyTemplate, deleteTemplate } = useTemplates(userId);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [targetDate, setTargetDate] = useState(currentDate);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    saveTemplate(templateName, dayActivities);
    setTemplateName("");
    setShowSaveDialog(false);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate || !targetDate) return;
    applyTemplate(selectedTemplate, targetDate);
    setShowApplyDialog(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookTemplate className="h-5 w-5" />
          Activity Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Save Current Day
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Activity Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Template name (e.g., 'Morning Routine', 'Work Day')"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                    Save Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" disabled={templates.length === 0}>
                <Play className="h-4 w-4" />
                Apply Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply Activity Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.activities.length} activities)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Date</label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApplyTemplate} disabled={!selectedTemplate || !targetDate}>
                    Apply Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookTemplate className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No templates saved yet</p>
            <p className="text-xs">Save your current day as a template to reuse later</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{template.name}</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setShowApplyDialog(true);
                      }}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {template.activities.length} activities • Created {new Date(template.createdAt).toLocaleDateString()}
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.activities.slice(0, 3).map((activity, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {activity.hour.split(':')[0]}:00 - {activity.text.slice(0, 20)}...
                    </Badge>
                  ))}
                  {template.activities.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.activities.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}