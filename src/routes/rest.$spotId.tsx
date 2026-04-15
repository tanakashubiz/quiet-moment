import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { RestModeScreen } from "@/components/RestModeScreen";

export const Route = createFileRoute("/rest/$spotId")({
  component: RestPage,
  head: () => ({
    meta: [
      { title: "休息モード — 目の前" },
      { name: "description", content: "今この瞬間に集中する休息の時間" },
    ],
  }),
});

function RestPage() {
  const { spotId } = Route.useParams();
  const navigate = useNavigate();
  const [spot, setSpot] = useState<{ title: string; rest_cue: string | null } | null>(null);

  useEffect(() => {
    const fetchSpot = async () => {
      const { data } = await supabase
        .from("spots")
        .select("title, rest_cue")
        .eq("id", spotId)
        .single();
      if (data) setSpot(data);
    };
    fetchSpot();
  }, [spotId]);

  if (!spot) {
    return (
      <div className="min-h-screen rest-mode-bg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <RestModeScreen
      cue={spot.rest_cue || "深呼吸を3回する"}
      spotTitle={spot.title}
      onClose={() => navigate({ to: "/spot/$spotId", params: { spotId } })}
    />
  );
}
