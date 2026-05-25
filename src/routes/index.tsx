import { useState, useCallback, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SpotMap } from "@/components/SpotMap";
import { SearchPanel, searchSpots } from "@/components/SearchPanel";
import type { SearchQuery } from "@/components/SearchPanel";
import { SearchIcon, NavigationIcon, HeartIcon } from "@/components/Icons";
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

function readLocalVisitedSpotIds(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const value = window.localStorage.getItem(`visited_spots:${userId}`);
    const ids = value ? JSON.parse(value) : [];
    return Array.isArray(ids)
      ? new Set(ids.filter((id): id is string => typeof id === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

function writeLocalVisitedSpotIds(userId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`visited_spots:${userId}`, JSON.stringify([...ids]));
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
  const [visitedSpotIds, setVisitedSpotIds] = useState<Set<string>>(new Set());
  const [visitLoading, setVisitLoading] = useState(false);

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
    if (!user) {
      setVisitedSpotIds(new Set());
      return;
    }
    supabase.from("visited_spots").select("spot_id").eq("user_id", user.id).then(({ data, error }) => {
      if (data) {
        const ids = new Set(data.map((r) => r.spot_id));
        setVisitedSpotIds(ids);
        writeLocalVisitedSpotIds(user.id, ids);
      } else if (error) {
        setVisitedSpotIds(readLocalVisitedSpotIds(user.id));
      }
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

  const toggleVisited = async (spotId: string) => {
    if (!user) { toast.error("行った記録にはログインが必要です"); return; }
    if (visitLoading) return;
    setVisitLoading(true);

    const wasVisited = visitedSpotIds.has(spotId);
    const next = new Set(visitedSpotIds);
    if (wasVisited) next.delete(spotId);
    else next.add(spotId);
    setVisitedSpotIds(next);
    writeLocalVisitedSpotIds(user.id, next);

    const { error } = wasVisited
      ? await supabase.from("visited_spots").delete().eq("user_id", user.id).eq("spot_id", spotId)
      : await supabase.from("visited_spots").insert({ user_id: user.id, spot_id: spotId });

    if (error) {
      toast.success(wasVisited ? "この端末で行ったを取り消しました" : "この端末に行ったを保存しました");
    } else {
      toast.success(wasVisited ? "行ったを取り消しました" : "行ったに追加しました");
    }
    setVisitLoading(false);
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
    <div className="h-screen relative overflow-hidden">
      {/* Map（全画面） */}
      <SpotMap
        spots={filteredSpots}
        onSpotSelect={handleSpotSelect}
        selectedSpotId={selectedSpot?.id}
        visitedSpotIds={visitedSpotIds}
        currentUserId={user?.id}
        center={mapCenter}
        userLocation={userLocation}
      />

      {/* 上部フローティングUI */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="max-w-lg mx-auto px-3 pt-12 flex items-start gap-2">

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
            className="pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm bg-white/85 text-foreground shrink-0 disabled:opacity-50 transition-colors"
            aria-label="現在地"
            title="現在地を表示"
          >
            <NavigationIcon size={16} strokeWidth={2} className={locating ? "animate-pulse" : ""} />
          </button>

          {/* 検索ボタン */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={`pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-colors shrink-0 ${
              searchOpen || hasSearch
                ? "bg-primary text-primary-foreground"
                : "bg-white/85 text-foreground"
            }`}
            aria-label="検索"
          >
            <SearchIcon size={16} strokeWidth={2} />
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

      {/* Photo viewer */}
      {selectedSpot &&
        (() => {
          const isFav = favoriteIds.has(selectedSpot.id);
          const isOwnSpot = !!user && selectedSpot.user_id === user.id;
          const isVisited = visitedSpotIds.has(selectedSpot.id);
          const photoUrl = selectedSpot.photo_url ?? "";
          return (
            <div
              className="fixed inset-0 z-[10000] bg-background/75 backdrop-blur-xl"
              onClick={() => setSelectedSpot(null)}
            >
              <div className="absolute inset-0 bg-black/15" />
              <button
                type="button"
                onClick={() => setSelectedSpot(null)}
                className="absolute top-10 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur-sm"
                aria-label="閉じる"
              >
                ×
              </button>
              <div className="absolute inset-0 flex items-center justify-center px-3 py-20">
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt="休息スポットの写真"
                    className="max-h-full max-w-full object-contain shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                  />
                )}
              </div>
              <div
                className="absolute bottom-6 right-4 z-10 flex items-center justify-end gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                {!isOwnSpot && (
                  <button
                    type="button"
                    onClick={() => toggleVisited(selectedSpot.id)}
                    disabled={visitLoading}
                    className={`h-11 rounded-full px-4 text-sm font-medium shadow-sm backdrop-blur-sm transition-colors disabled:opacity-50 ${
                      isVisited
                        ? "bg-[oklch(0.63_0.075_155)] text-primary-foreground"
                        : "bg-[oklch(0.82_0.045_155)] text-foreground"
                    }`}
                  >
                    行ったことある
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleFavorite(selectedSpot.id)}
                  disabled={favLoading}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-50"
                  aria-label={isFav ? "お気に入りから削除" : "お気に入りに追加"}
                >
                  <HeartIcon size={19} strokeWidth={2} filled={isFav} />
                </button>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
