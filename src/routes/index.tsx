import { useState, useCallback, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SpotMap } from "@/components/SpotMap";
import { BottomSheet } from "@/components/BottomSheet";
import { SearchPanel, searchSpots } from "@/components/SearchPanel";
import type { SearchQuery } from "@/components/SearchPanel";
import { SearchIcon, NavigationIcon } from "@/components/Icons";
import { formatArea, getAreaCenter, spotInAreaSelections, type AreaSelection } from "@/lib/regions";
import { toast } from "sonner";
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

function calcWalkingMinutes(from: [number, number], to: [number, number]): number {
  const R = 6371000;
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLat = ((to[0] - from[0]) * Math.PI) / 180;
  const dLon = ((to[1] - from[1]) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.max(1, Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) / 80));
}

function relativeDate(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`;
  return `${Math.floor(days / 365)}年前`;
}

function HomePage() {
  const { spotId: initialSpotId } = Route.useSearch();
  const { user } = useAuth();

  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.0116, 135.7681]);
  const [locating, setLocating] = useState(false);

  // お気に入り
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favLoading, setFavLoading] = useState(false);

  // 地域フィルター
  const userMainArea: AreaSelection | null = user?.user_metadata?.main_area ?? null;
  const userSubAreas: AreaSelection[] = user?.user_metadata?.sub_areas ?? [];
  const [activeAreas, setActiveAreas] = useState<AreaSelection[] | null>(null);

  const areaKey = (a: AreaSelection) =>
    `${a.prefectureId}|${a.cityId}|${a.districtId ?? ""}`;

  useEffect(() => {
    if (userMainArea) {
      setActiveAreas([userMainArea]);
      const center = getAreaCenter(userMainArea);
      if (center) setMapCenter(center);
    } else {
      setActiveAreas(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userMainArea ? areaKey(userMainArea) : null]);

  const toggleArea = (area: AreaSelection) => {
    const key = areaKey(area);
    setActiveAreas((prev) => {
      if (prev === null) return [area];
      const exists = prev.some((a) => areaKey(a) === key);
      if (exists) {
        const next = prev.filter((a) => areaKey(a) !== key);
        return next.length === 0 ? null : next;
      }
      return [...prev, area];
    });
  };

  // 検索パネル
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    restDuration: 60,
    tags: [],
    restCues: [],
  });
  const hasSearch =
    searchQuery.restDuration < 60 ||
    searchQuery.tags.length > 0 ||
    searchQuery.restCues.length > 0;

  const fetchUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("このブラウザは位置情報に対応していません");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setMapCenter(loc);
        setLocating(false);
        toast.success("現在地を取得しました");
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("位置情報の許可が必要です");
        } else {
          toast.error("現在地を取得できませんでした");
        }
      }
    );
  };

  useEffect(() => { fetchUserLocation(); }, []);

  useEffect(() => {
    supabase.from("spots").select("*").then(({ data }) => {
      if (data) {
        const seeds = [10, 15, 28, 37, 42, 56, 61, 73, 84, 91];
        setSpots(data.map((spot, i) => ({
          ...spot,
          photo_url: spot.photo_url ?? `https://picsum.photos/seed/${seeds[i % seeds.length]}/400/300`,
        })));
      }
    });
  }, []);

  useEffect(() => {
    if (!user) { setFavoriteIds(new Set()); return; }
    supabase.from("favorites").select("spot_id").eq("user_id", user.id).then(({ data }) => {
      if (data) setFavoriteIds(new Set(data.map((r) => r.spot_id)));
    });
  }, [user]);

  useEffect(() => {
    if (!initialSpotId || spots.length === 0) return;
    const target = spots.find((s) => s.id === initialSpotId);
    if (target) { setSelectedSpot(target); setMapCenter([target.latitude, target.longitude]); }
  }, [initialSpotId, spots]);

  const handleSpotSelect = useCallback((spot: Spot) => setSelectedSpot(spot), []);

  const toggleFavorite = async (spotId: string) => {
    if (!user) { toast.error("お気に入りにはログインが必要です"); return; }
    if (favLoading) return;
    setFavLoading(true);
    const isFav = favoriteIds.has(spotId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("spot_id", spotId);
      setFavoriteIds((prev) => { const s = new Set(prev); s.delete(spotId); return s; });
      toast.success("お気に入りから削除しました");
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, spot_id: spotId });
      setFavoriteIds((prev) => new Set([...prev, spotId]));
      toast.success("お気に入りに追加しました");
    }
    setFavLoading(false);
  };

  const searchFiltered = searchSpots(spots, searchQuery);
  const filteredSpots = activeAreas
    ? searchFiltered.filter((s) => spotInAreaSelections(s.latitude, s.longitude, activeAreas))
    : searchFiltered;

  // ユーザーの地域リスト（メイン + サブ、重複除去）
  const userAreas: AreaSelection[] = userMainArea
    ? [userMainArea, ...userSubAreas.filter((a) => areaKey(a) !== areaKey(userMainArea))]
    : [];

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Map（全画面） */}
      <SpotMap
        spots={filteredSpots}
        onSpotSelect={handleSpotSelect}
        selectedSpotId={selectedSpot?.id}
        center={mapCenter}
        userLocation={userLocation}
        interactive={true}
      />

      {/* 上部フローティングUI */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="max-w-lg mx-auto px-3 pt-3 flex items-start gap-2">

          {/* 地域チップ列（flex-1で検索ボタンを右端に固定） */}
          <div className="flex-1 flex gap-1.5 flex-wrap pointer-events-auto">
            {userAreas.length > 0 && (
              <>
                {/* 全域チップ */}
                <button
                  onClick={() => setActiveAreas(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm transition-colors ${
                    activeAreas === null
                      ? "bg-foreground text-background"
                      : "bg-white/85 text-muted-foreground"
                  }`}
                >
                  全域
                </button>
                {/* メイン地域 */}
                {userMainArea && (
                  <button
                    onClick={() => toggleArea(userMainArea)}
                    className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm transition-colors ${
                      activeAreas?.some((a) => areaKey(a) === areaKey(userMainArea))
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/85 text-muted-foreground"
                    }`}
                  >
                    {formatArea(userMainArea)}
                  </button>
                )}
                {/* サブ地域 */}
                {userSubAreas
                  .filter((a) => areaKey(a) !== areaKey(userMainArea!))
                  .map((area) => {
                    const key = areaKey(area);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleArea(area)}
                        className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm transition-colors ${
                          activeAreas?.some((a) => areaKey(a) === key)
                            ? "bg-secondary text-secondary-foreground border border-primary/30"
                            : "bg-white/85 text-muted-foreground"
                        }`}
                      >
                        {formatArea(area)}
                      </button>
                    );
                  })}
              </>
            )}
          </div>

          {/* 現在地ボタン */}
          <button
            onClick={fetchUserLocation}
            disabled={locating}
            className="pointer-events-auto w-11 h-11 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm bg-white/90 text-foreground shrink-0 disabled:opacity-50 transition-colors"
            aria-label="現在地"
            title="現在地を表示"
          >
            <NavigationIcon size={20} strokeWidth={2} className={locating ? "animate-pulse" : ""} />
          </button>

          {/* 検索ボタン */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={`pointer-events-auto w-11 h-11 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-colors shrink-0 ${
              searchOpen || hasSearch
                ? "bg-primary text-primary-foreground"
                : "bg-white/90 text-foreground"
            }`}
            aria-label="検索"
          >
            <SearchIcon size={20} strokeWidth={2} />
          </button>
        </div>

        {/* 検索パネル */}
        {searchOpen && (
          <div className="pointer-events-auto max-w-lg mx-auto">
            <SearchPanel
              query={searchQuery}
              onChange={setSearchQuery}
              onClose={() => setSearchOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <BottomSheet isOpen={!!selectedSpot} onClose={() => setSelectedSpot(null)}>
        {selectedSpot && (() => {
          const walkMins = userLocation
            ? calcWalkingMinutes(userLocation, [selectedSpot.latitude, selectedSpot.longitude])
            : selectedSpot.walking_minutes;
          const isFav = favoriteIds.has(selectedSpot.id);
          return (
            <div>
              {selectedSpot.photo_url && (
                <img
                  src={selectedSpot.photo_url}
                  alt={selectedSpot.title}
                  className="w-full h-40 object-cover rounded-xl mb-3"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground flex-1">{selectedSpot.title}</h2>
                <button
                  onClick={() => toggleFavorite(selectedSpot.id)}
                  disabled={favLoading}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary shrink-0 active:scale-90 transition-transform text-foreground"
                  aria-label={isFav ? "お気に入りから削除" : "お気に入りに追加"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                {walkMins != null && (
                  <span>🚶 徒歩{walkMins}分{userLocation ? "（現在地から）" : ""}</span>
                )}
                {selectedSpot.rest_duration_minutes && (
                  <span>⏱ {selectedSpot.rest_duration_minutes}分休憩</span>
                )}
                {selectedSpot.created_at && (
                  <span>🕐 {relativeDate(selectedSpot.created_at)}</span>
                )}
              </div>
              {selectedSpot.description && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{selectedSpot.description}</p>
              )}
              {selectedSpot.tags && selectedSpot.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedSpot.tags.map((tag) => (
                    <span key={tag} className="tag-chip">{tag}</span>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.latitude},${selectedSpot.longitude}&travelmode=walking`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                >
                  経路を見る
                </a>
              </div>
            </div>
          );
        })()}
      </BottomSheet>
    </div>
  );
}
