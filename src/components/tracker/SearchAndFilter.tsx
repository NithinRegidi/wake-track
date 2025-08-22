import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSearch } from "@/hooks/useSearch";
import { Search, Calendar, Filter, X } from "lucide-react";
import { Category } from "@/components/tracker/ActivitySlot";

interface SearchAndFilterProps {
  userId: string;
}

const categoryColors: Record<Category, string> = {
  productive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  neutral: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  unproductive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const categoryLabels: Record<Category, string> = {
  productive: "Productive",
  neutral: "Neutral",
  unproductive: "Unproductive"
};

export function SearchAndFilter({ userId }: SearchAndFilterProps) {
  const {
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    dateRange,
    setDateRange,
    searchResults,
    clearSearch
  } = useSearch(userId);

  const hasFilters = searchQuery || categoryFilter !== "all" || dateRange.start || dateRange.end;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search & Filter Activities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Activities</label>
            <Input
              placeholder="Search your activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as Category | "all")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="productive">Productive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="unproductive">Unproductive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </span>
            <Button variant="ghost" size="sm" onClick={clearSearch} className="flex items-center gap-1">
              <X className="h-3 w-3" />
              Clear filters
            </Button>
          </div>
        )}

        <Separator />

        {/* Search Results */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {searchResults.length === 0 && hasFilters && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activities found matching your criteria</p>
            </div>
          )}

          {searchResults.length === 0 && !hasFilters && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Use the search and filters above to find specific activities</p>
            </div>
          )}

          {searchResults.map((result, index) => (
            <div
              key={`${result.date}-${result.hour}-${index}`}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={categoryColors[result.category]}>
                    {categoryLabels[result.category]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {result.formattedDate} at {result.formattedTime}
                  </span>
                </div>
                <p className="text-sm truncate">{result.activity}</p>
              </div>
            </div>
          ))}
        </div>

        {searchResults.length > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            Showing {searchResults.length} activities
          </div>
        )}
      </CardContent>
    </Card>
  );
}