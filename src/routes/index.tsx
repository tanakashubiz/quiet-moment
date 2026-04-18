import { useState, useCallback, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SpotMap } from "@/components/SpotMap";
import { BottomSheet } from "@/components/BottomSheet";
import { SearchPanel, searchSpots } from "@/components/SearchPanel";
import type { SearchQuery } from "@/components/SearchPanel";
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

/** ハバーサイン距離から徒歩分数を計算（80m/分） */
function calcWalkingMinutes(from: [number, number], to: [number, number]): number {
  const R = 6371000;
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLat = ((to[0] - from[0]) * Math.PI) / 180;
  const dLon = ((to[1] - from[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1, Math.round(dist / 80));
}

/** created_at を「○日前」形式に */
function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
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
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.0116, 135.7681]);
  const [locating, setLocating] = useState(false);

  // お気に入り
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favLoading, setFavLoading] = useState(false);

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
          toast.error("位置情報の許可が必要です。ブラウザの設定から許可してください。");
        } else {
          toast.error("現在地を取得できませんでした");
        }
      }
    );
  };

  useEffect(() => {
    fetchUserLocation();
  }, []);

  useEffect(() => {
    const fetchSpots = async () => {
      const { data } = await supabase.from("spots").select("*");
      if (data) {
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

  // ユーザーが変わったらお気に入りを再取得
  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    supabase
      .from("favorites")
      .select("spot_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setFavoriteIds(new Set(data.map((r) => r.spot_id)));
      });
  }, [user]);

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

  const toggleFavorite = async (spotId: string) => {
    if (!user) {
      toast.error("お気に入りにはログインが必要です");
      return;
    }
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

  const filteredSpots = searchSpots(spots, searchQuery);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="shrink-0 z-20 bg-background shadow-sm">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-wide">目の前</h1>
            <p className="text-[10px] text-muted-foreground">5分だけ、今ここに戻る</p>
          </div>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              searchOpen || hasSearch
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
            title="検索"
            aria-label="検索パネルを開く"
          >
            🔍
          </button>
        </div>

        {searchOpen && (
          <SearchPanel
            query={searchQuery}
            onChange={setSearchQuery}
            onClose={() => setSearchOpen(false)}
          />
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <SpotMap
          spots={filteredSpots}
          onSpotSelect={handleSpotSelect}
          selectedSpotId={selectedSpot?.id}
          center={mapCenter}
          userLocation={userLocation}
        />
        <button
          onClick={fetchUserLocation}
          disabled={locating}
          className="absolute bottom-4 right-4 z-[1000] w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          title="現在地を表示"
        >
          {locating ? "⏳" : "📍"}
        </button>
      </div>

      {/* Bottom sheet for selected spot */}
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

              {/* タイトル + お気に入りボタン */}
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground flex-1">{selectedSpot.title}</h2>
                <button
                  onClick={() => toggleFavorite(selectedSpot.id)}
                  disabled={favLoading}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-xl shrink-0 active:scale-90 transition-transform"
                  aria-label={isFav ? "お気に入りから削除" : "お気に入りに追加"}
                >
                  {isFav ? "♥" : "♡"}
                </button>
              </div>

              {/* 徒歩時間 / 休憩時間 / 投稿日 */}
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

      {/* Spacer for bottom nav */}
      <div className="h-14" />
    </div>
  );
}
