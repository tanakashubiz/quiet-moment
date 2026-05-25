import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Database } from "@/integrations/supabase/types";

type Spot = Database["public"]["Tables"]["spots"]["Row"];

export const Route = createFileRoute("/spot/$spotId")({
  component: SpotDetailPage,
  head: () => ({
    meta: [
      { title: "スポット詳細 — 目の前" },
      { name: "description", content: "京都の静かな休息スポットの詳細情報" },
    ],
  }),
});

function SpotDetailPage() {
  const { spotId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpot = async () => {
      const { data } = await supabase.from("spots").select("*").eq("id", spotId).single();
      if (data) setSpot(data);
      setLoading(false);
    };
    fetchSpot();
  }, [spotId]);

  useEffect(() => {
    if (!user || !spotId) return;
    const checkFavorite = async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("spot_id", spotId)
        .maybeSingle();
      setIsFavorite(!!data);
    };
    checkFavorite();
  }, [user, spotId]);

  const toggleFavorite = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("spot_id", spotId);
      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, spot_id: spotId });
      setIsFavorite(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-muted-foreground">スポットが見つかりません</p>
        <Link to="/" className="mt-4 text-primary text-sm">地図に戻る</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Photo */}
      {spot.photo_url && (
        <div className="relative h-56">
          <img src={spot.photo_url} alt="休息スポットの写真" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          <button
            onClick={() => navigate({ to: "/" })}
            className="absolute top-10 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-sm text-foreground text-sm"
          >
            ←
          </button>
          <button
            onClick={toggleFavorite}
            className="absolute top-10 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-sm text-lg"
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>
      )}

      <div className="px-5 pt-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {spot.rest_duration_minutes && <span>⏱ {spot.rest_duration_minutes}分休憩</span>}
        </div>

        {/* Tags */}
        {spot.tags && spot.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {spot.tags.map((tag) => (
              <span key={tag} className="tag-chip">{tag}</span>
            ))}
          </div>
        )}

        {/* Description */}
        {spot.description && (
          <p className="text-sm text-foreground/80 mt-4 leading-relaxed">
            {spot.description}
          </p>
        )}

        {/* Rest cue */}
        {spot.rest_cue && (
          <div className="mt-6 p-4 rounded-xl bg-accent/50 border border-accent">
            <p className="text-xs text-muted-foreground mb-1">休息のヒント</p>
            <p className="text-sm font-medium text-accent-foreground">{spot.rest_cue}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={toggleFavorite}
            className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium"
          >
            {isFavorite ? "保存済み ♥" : "保存する ♡"}
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}&travelmode=walking`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            経路を見る
          </a>
        </div>
      </div>
    </div>
  );
}
