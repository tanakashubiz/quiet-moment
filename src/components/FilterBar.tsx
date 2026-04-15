import { useState } from "react";

const FILTERS = [
  { id: "5min", label: "5分以内" },
  { id: "10min", label: "10分以内" },
  { id: "quiet", label: "静か" },
  { id: "green", label: "緑" },
  { id: "river", label: "川沿い" },
  { id: "bench", label: "ベンチあり" },
  { id: "solo", label: "一人向き" },
] as const;

interface FilterBarProps {
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
}

export function FilterBar({ activeFilters, onFiltersChange }: FilterBarProps) {
  const toggleFilter = (id: string) => {
    if (activeFilters.includes(id)) {
      onFiltersChange(activeFilters.filter((f) => f !== id));
    } else {
      onFiltersChange([...activeFilters, id]);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-hide">
      {FILTERS.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        return (
          <button
            key={filter.id}
            onClick={() => toggleFilter(filter.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-calm ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

// Helper to filter spots based on active filters
export function filterSpots(
  spots: Array<{
    walking_minutes: number | null;
    tags: string[] | null;
  }>,
  activeFilters: string[]
) {
  if (activeFilters.length === 0) return spots;

  return spots.filter((spot) => {
    return activeFilters.every((filter) => {
      switch (filter) {
        case "5min":
          return (spot.walking_minutes ?? 99) <= 5;
        case "10min":
          return (spot.walking_minutes ?? 99) <= 10;
        case "quiet":
          return spot.tags?.includes("静か");
        case "green":
          return spot.tags?.includes("緑が多い");
        case "river":
          return spot.tags?.includes("川沿い");
        case "bench":
          return spot.tags?.includes("ベンチあり");
        case "solo":
          return spot.tags?.includes("一人向き");
        default:
          return true;
      }
    });
  });
}
