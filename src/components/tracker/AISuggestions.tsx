import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, Target, Sparkles, RefreshCw } from "lucide-react";
import { ProductivityInsight, generateAIRecommendations, ActivityData } from "@/lib/ai-suggestions";
import { useState, useMemo } from "react";

interface AISuggestionsProps {
  userId: string;
  className?: string;
}

export const AISuggestions = ({ userId, className }: AISuggestionsProps) => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Load recent activity data for analysis
  const recentActivityData = useMemo(() => {
    const data: { [date: string]: ActivityData } = {};
    const today = new Date();
    
    // Get last 7 days of data
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayKey = `activities_${userId}_${dateStr}`;
      const dayData = localStorage.getItem(dayKey);
      
      if (dayData) {
        try {
          data[dateStr] = JSON.parse(dayData);
        } catch (e) {
          console.error('Error parsing day data:', e);
        }
      }
    }
    
    return data;
  }, [userId, refreshKey]);

  // Get user goals
  const userGoals = useMemo(() => {
    const goalsKey = `goals_${userId}`;
    const goalsData = localStorage.getItem(goalsKey);
    
    if (goalsData) {
      try {
        return JSON.parse(goalsData);
      } catch (e) {
        console.error('Error parsing goals data:', e);
      }
    }
    return undefined;
  }, [userId, refreshKey]);

  // Generate AI insights
  const insights = useMemo(() => {
    return generateAIRecommendations(recentActivityData, userGoals);
  }, [recentActivityData, userGoals, refreshKey]);

  const getInsightIcon = (type: ProductivityInsight['type']) => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="h-4 w-4" />;
      case 'pattern':
        return <TrendingUp className="h-4 w-4" />;
      case 'improvement':
        return <Target className="h-4 w-4" />;
      case 'strength':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: ProductivityInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-brand text-white';
      case 'low':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand" />
          AI Productivity Insights
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start tracking activities to get AI-powered insights!</p>
          </div>
        ) : (
          <>
            {insights.map((insight, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:shadow-soft transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm text-card-foreground">
                        {insight.title}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getPriorityColor(insight.priority)}`}
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                💡 Insights update automatically based on your activity patterns
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AISuggestions;