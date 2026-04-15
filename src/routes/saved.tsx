import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SpotCard } from "@/components/SpotCard";
import type { Database } from "@/integrations/supabase/types";

type Spot = Database["public"]["Tables"]["spots"]["Row"];

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({
    meta: [
      { title: "保存したスポット — 目の前" },
      { name: "description", content: "お気に入りの休息スポット一覧" },
    ],
  }),
});

function SavedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchFavorites = async () => {
      const { data } = await supabase
        .from("favorites")
        .select("spot_id, spots(*)")
        .eq("user_id", user.id);

      if (data) {
        const savedSpots = data
          .map((f: any) => f.spots)
          .filter(Boolean) as Spot[];
        setSpots(savedSpots);
      }
      setLoading(false);
    };
    fetchFavorites();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-20">
        <p className="text-lg font-medium text-foreground mb-2">保存したスポット</p>
        <p className="text-sm text-muted-foreground mb-6">ログインしてお気に入りのスポットを保存しましょう</p>
        <button
          onClick={() => navigate({ to: "/login" })}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
        >
          ログイン
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-foreground">保存したスポット</h1>
        <p className="text-xs text-muted-foreground mt-1">お気に入りの休息場所</p>
      </div>

      {loading ? (
        <div className="px-5">
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        </div>
      ) : spots.length === 0 ? (
        <div className="px-5 text-center py-12">
          <p className="text-muted-foreground text-sm">まだスポットを保存していません</p>
          <Link to="/" className="text-primary text-sm mt-3 inline-block">地図を見る</Link>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {spots.map((spot) => (
            <div key={spot.id} className="relative">
              <SpotCard spot={spot} />
              <button
                onClick={() => navigate({ to: "/", search: { spotId: spot.id } })}
                className="absolute bottom-3.5 right-3.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
              >
                地図で見る
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
