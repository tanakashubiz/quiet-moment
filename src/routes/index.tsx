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
  validateSearch: (search: Record<string, unknown>) => ({
    spotId: typeof search.spotId === "string" ? search.spotId : undefined,
  }),
  component: HomePage,
  head: () => ({
    meta: [
      { title: "目の前 — 京都の静かな休息スポット" },
      { name: "description", content: "忙しい日常から5分だけ離れる。京都中心部の静かな休息スポットを見つけて、今この瞬間に戻る。" },
    ],
  }),
});

function HomePage() {
  const { spotId: initialSpotId } = Route.useSearch();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.0116, 135.7681]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
        },
        () => { /* 拒否された場合はデフォルト位置のまま */ }
      );
    }
  }, []);

  useEffect(() => {
    const fetchSpots = async () => {
      const { data } = await supabase.from("spots").select("*");
      if (data) {
        // 写真がないスポットに仮の自然写真を注入（開発用）
        const placeholderSeeds = [10, 15, 28, 37, 42, 56, 61, 73, 84, 91];
        const spotsWithPhotos = data.map((spot, i) => ({
          ...spot,
          photo_url: spot.photo_url ?? `https://picsum.photos/seed/${placeholderSeeds[i % placeholderSeeds.length]}/400/300`,
        }));
        setSpots(spotsWithPhotos);
      }
      setLoading(false);
    };
    fetchSpots();
  }, []);

  // 保存ページなどから spotId が渡された場合、spots 読み込み後に自動選択
  useEffect(() => {
    if (!initialSpotId || spots.length === 0) return;
    const target = spots.find((s) => s.id === initialSpotId);
    if (target) {
      setSelectedSpot(target);
      setMapCenter([target.latitude, target.longitude]);
    }
  }, [initialSpotId, spots]);

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
          center={mapCenter}
          userLocation={userLocation}
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
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.latitude},${selectedSpot.longitude}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                経路を見る
              </a>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Spacer for bottom nav */}
      <div className="h-14" />
    </div>
  );
}
