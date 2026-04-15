import { useState, useCallback, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SpotMap } from "@/components/SpotMap";
import { SpotCard } from "@/components/SpotCard";
import { BottomSheet } from "@/components/BottomSheet";
import { FilterBar, filterSpots } from "@/components/FilterBar";
import type { Database } from "@/integrations/supabase/types";

type Spot = Database["public"]["Tables"]["spots"]["Row"];

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "目の前 — 京都の静かな休息スポット" },
      { name: "description", content: "忙しい日常から5分だけ離れる。京都中心部の静かな休息スポットを見つけて、今この瞬間に戻る。" },
    ],
  }),
});

function HomePage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpots = async () => {
      const { data } = await supabase.from("spots").select("*");
      if (data) setSpots(data);
      setLoading(false);
    };
    fetchSpots();
  }, []);

  const handleSpotSelect = useCallback((spot: Spot) => {
    setSelectedSpot(spot);
  }, []);

  const filteredSpots = filterSpots(spots, activeFilters) as Spot[];

  return (
    <div className="h-screen flex flex-col relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe-top">
        <div className="px-4 pt-3 pb-1">
          <h1 className="text-lg font-semibold text-foreground tracking-wide">目の前</h1>
          <p className="text-[10px] text-muted-foreground">5分だけ、今ここに戻る</p>
        </div>
        <FilterBar activeFilters={activeFilters} onFiltersChange={setActiveFilters} />
      </div>

      {/* Map */}
      <div className="flex-1">
        <SpotMap
          spots={filteredSpots}
          onSpotSelect={handleSpotSelect}
          selectedSpotId={selectedSpot?.id}
        />
      </div>

      {/* Bottom sheet for selected spot */}
      <BottomSheet
        isOpen={!!selectedSpot}
        onClose={() => setSelectedSpot(null)}
      >
        {selectedSpot && (
          <div>
            {selectedSpot.photo_url && (
              <img
                src={selectedSpot.photo_url}
                alt={selectedSpot.title}
                className="w-full h-40 object-cover rounded-xl mb-3"
              />
            )}
            <h2 className="text-base font-semibold text-foreground">{selectedSpot.title}</h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              {selectedSpot.walking_minutes && <span>🚶 徒歩{selectedSpot.walking_minutes}分</span>}
              {selectedSpot.rest_duration_minutes && <span>⏱ {selectedSpot.rest_duration_minutes}分休憩</span>}
            </div>
            {selectedSpot.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {selectedSpot.description}
              </p>
            )}
            {selectedSpot.tags && selectedSpot.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedSpot.tags.map((tag) => (
                  <span key={tag} className="tag-chip">{tag}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Link
                to="/spot/$spotId"
                params={{ spotId: selectedSpot.id }}
                className="flex-1 text-center py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium"
              >
                くわしく見る
              </Link>
              <Link
                to="/rest/$spotId"
                params={{ spotId: selectedSpot.id }}
                className="flex-1 text-center py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                この場所で休む
              </Link>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Spacer for bottom nav */}
      <div className="h-14" />
    </div>
  );
}
