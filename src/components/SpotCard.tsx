import { Link } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";

type Spot = Database["public"]["Tables"]["spots"]["Row"];

interface SpotCardProps {
  spot: Spot;
  compact?: boolean;
}

export function SpotCard({ spot, compact = false }: SpotCardProps) {
  return (
    <Link
      to="/spot/$spotId"
      params={{ spotId: spot.id }}
      className="block"
    >
      <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 transition-shadow hover:shadow-md">
        {spot.photo_url && (
          <div className={compact ? "h-32" : "h-40"}>
            <img
              src={spot.photo_url}
              alt={spot.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-3.5">
          <h3 className="font-medium text-sm text-foreground leading-snug">{spot.title}</h3>
          {!compact && spot.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {spot.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {spot.walking_minutes && (
              <span className="text-xs text-muted-foreground">
                🚶 {spot.walking_minutes}分
              </span>
            )}
            {spot.rest_duration_minutes && (
              <span className="text-xs text-muted-foreground">
                ⏱ {spot.rest_duration_minutes}分休憩
              </span>
            )}
          </div>
          {spot.tags && spot.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {spot.tags.slice(0, compact ? 2 : 4).map((tag) => (
                <span key={tag} className="tag-chip">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
