import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const ALL_TAGS = [
  "川沿い", "緑が多い", "静か", "ベンチあり", "人が少ない",
  "一人向き", "5分休憩向き", "10分休憩向き",
];

const REST_CUES = [
  "空を10秒見る",
  "水の音を聞く",
  "深呼吸を3回する",
  "スマホを30秒伏せる",
];

export const Route = createFileRoute("/add-spot")({
  component: AddSpotPage,
  head: () => ({
    meta: [
      { title: "スポットを投稿 — 目の前" },
      { name: "description", content: "あなたの静かな休息スポットを共有する" },
    ],
  }),
});

function AddSpotPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [restCue, setRestCue] = useState(REST_CUES[0]);
  const [restDuration, setRestDuration] = useState(5);
  const [walkingMinutes, setWalkingMinutes] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Default to central Kyoto
  const [lat, setLat] = useState(35.0116);
  const [lng, setLng] = useState(135.7681);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-20">
        <p className="text-muted-foreground text-sm mb-4">スポットを投稿するにはログインが必要です</p>
        <button
          onClick={() => navigate({ to: "/login" })}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
        >
          ログイン
        </button>
      </div>
    );
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);

    let photo_url: string | null = null;

    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("spot-photos").upload(path, photoFile);
      if (!error) {
        const { data } = supabase.storage.from("spot-photos").getPublicUrl(path);
        photo_url = data.publicUrl;
      }
    }

    const { error } = await supabase.from("spots").insert({
      title: title.trim(),
      description: description.trim() || null,
      latitude: lat,
      longitude: lng,
      walking_minutes: walkingMinutes,
      tags: selectedTags,
      rest_duration_minutes: restDuration,
      rest_cue: restCue,
      photo_url,
      user_id: user.id,
    });

    setSubmitting(false);
    if (!error) {
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-foreground">スポットを投稿</h1>
        <p className="text-xs text-muted-foreground mt-1">あなたの静かな休息場所を共有しましょう</p>
      </div>

      <div className="px-5 space-y-5">
        {/* Title */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">場所の名前</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：鴨川・丸太町ベンチ"
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus-calm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="どんな場所ですか？どんな体験ができますか？"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus-calm resize-none"
          />
        </div>

        {/* Photo */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">写真</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            className="text-sm text-muted-foreground"
          />
        </div>

        {/* Walking time */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            徒歩時間（分）: {walkingMinutes}分
          </label>
          <input
            type="range"
            min="1"
            max="15"
            value={walkingMinutes}
            onChange={(e) => setWalkingMinutes(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Rest duration */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            おすすめ休憩時間
          </label>
          <div className="flex gap-2">
            {[5, 10].map((d) => (
              <button
                key={d}
                onClick={() => setRestDuration(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  restDuration === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {d}分
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">タグ</label>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Rest cue */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">休息のヒント</label>
          <div className="flex flex-wrap gap-2">
            {REST_CUES.map((cue) => (
              <button
                key={cue}
                onClick={() => setRestCue(cue)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  restCue === cue
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {cue}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">位置情報</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              placeholder="緯度"
              className="flex-1 px-3 py-2 rounded-xl border border-input bg-card text-xs focus-calm"
            />
            <input
              type="number"
              step="0.0001"
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              placeholder="経度"
              className="flex-1 px-3 py-2 rounded-xl border border-input bg-card text-xs focus-calm"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">※ 京都中心部のデフォルト値が入っています</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || submitting}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {submitting ? "投稿中..." : "投稿する"}
        </button>
      </div>
    </div>
  );
}
