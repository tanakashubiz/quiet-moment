import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { LocationPicker } from "@/components/LocationPicker";
import { DurationSlider } from "@/components/DurationSlider";
import { TAG_GROUPS } from "@/lib/tags";

const DEFAULT_REST_CUE = "空を10秒見る";

// タグと休憩ヒントからAIで説明文を生成
async function generateDescription(
  tags: string[],
  restCue: string,
  duration: number
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    // APIキーがない場合はテンプレートで生成
    return buildTemplateDescription(tags, restCue, duration);
  }

  const prompt = `あなたは京都の静かな休息スポットを紹介するアプリのライターです。
以下の情報をもとに、スポットの説明文を日本語で2〜3文（60〜100文字）で自然に書いてください。

タグ: ${tags.join("、") || "なし"}
おすすめ休憩時間: ${duration}分
休憩のヒント: ${restCue}

説明文のみ出力してください。`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text?.trim() ?? buildTemplateDescription(tags, restCue, duration);
  } catch {
    return buildTemplateDescription(tags, restCue, duration);
  }
}

function buildTemplateDescription(tags: string[], restCue: string, duration: number): string {
  const parts: string[] = [];
  if (tags.includes("川沿い") || tags.includes("水辺")) parts.push("水の流れを感じられる");
  if (tags.includes("緑が多い") || tags.includes("自然豊か")) parts.push("豊かな緑に包まれた");
  if (tags.includes("静か") || tags.includes("音が静か")) parts.push("静かで落ち着いた");
  if (tags.includes("開放的")) parts.push("開放感あふれる");
  if (tags.includes("景色が良い")) parts.push("眺めの良い");
  if (tags.includes("穴場")) parts.push("地元に愛される穴場の");
  const atmosphere = parts.length > 0 ? parts.join("、") + "場所です。" : "静かに過ごせる場所です。";
  const hint = `${duration}分の小休憩に。${restCue}してみてください。`;
  return atmosphere + hint;
}

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
  const [generatedDesc, setGeneratedDesc] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const restCue = DEFAULT_REST_CUE;
  const [restDuration, setRestDuration] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [lat, setLat] = useState(35.0116);
  const [lng, setLng] = useState(135.7681);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [
            Number(pos.coords.latitude.toFixed(6)),
            Number(pos.coords.longitude.toFixed(6)),
          ];
          setUserLocation(loc);
          setLat(loc[0]);
          setLng(loc[1]);
        },
        () => {}
      );
    }
  }, []);

  // タグ・ヒント・時間が変わったら説明を自動生成
  useEffect(() => {
    if (selectedTags.length === 0) {
      setGeneratedDesc("");
      return;
    }
    const timer = setTimeout(async () => {
      setGenerating(true);
      const desc = await generateDescription(selectedTags, restCue, restDuration);
      setGeneratedDesc(desc);
      setGenerating(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedTags, restCue, restDuration]);

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocError("この端末では位置情報が使えません");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
      },
      () => {
        setLocError("位置情報の取得に失敗しました");
        setLocating(false);
      }
    );
  };

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
      description: generatedDesc || null,
      latitude: lat,
      longitude: lng,
      tags: selectedTags,
      rest_duration_minutes: restDuration,
      rest_cue: restCue,
      photo_url,
      user_id: user.id,
    });

    setSubmitting(false);
    if (!error) navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-foreground">スポットを投稿</h1>
        <p className="text-xs text-muted-foreground mt-1">あなたの静かな休息場所を共有しましょう</p>
      </div>

      <div className="px-5 space-y-6">
        {/* 場所の名前 */}
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

        {/* 写真 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">写真</label>
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden mb-2" style={{ height: 180 }}>
              <img src={photoPreview} alt="プレビュー" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handlePhotoChange(null)}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <label className="flex-1 flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border border-dashed border-input bg-card cursor-pointer text-muted-foreground text-xs font-medium">
                <span className="text-2xl">🖼️</span>
                アルバムから選ぶ
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)} />
              </label>
              <label className="flex-1 flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border border-dashed border-input bg-card cursor-pointer text-muted-foreground text-xs font-medium">
                <span className="text-2xl">📷</span>
                写真を撮る
                <input type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)} />
              </label>
            </div>
          )}
        </div>

        {/* おすすめ休憩時間 */}
        <div className="bg-card rounded-xl px-4 py-3 border border-input">
          <DurationSlider value={restDuration} onChange={setRestDuration} />
        </div>

        {/* タグ */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">タグ</label>
          <div className="space-y-3">
            {TAG_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] text-muted-foreground mb-1.5">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag) => (
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
            ))}
          </div>
        </div>

        {/* 自動生成された説明（編集可能） */}
        {(generatedDesc || generating) && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                ✨ 説明文
              </label>
              {generating && (
                <span className="text-[10px] text-muted-foreground animate-pulse">生成中...</span>
              )}
            </div>
            <textarea
              value={generatedDesc}
              onChange={(e) => setGeneratedDesc(e.target.value)}
              rows={3}
              disabled={generating}
              placeholder="タグを選ぶと自動で生成されます"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus-calm resize-none disabled:opacity-50"
            />
          </div>
        )}

        {/* 場所をピンで指定 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">場所をピンで指定</label>
          <LocationPicker
            lat={lat}
            lng={lng}
            onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }}
            userLocation={userLocation}
          />
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={locating}
            className="w-full py-2 rounded-xl border border-primary text-primary text-sm font-medium mt-2 disabled:opacity-50 transition-opacity"
          >
            {locating ? "取得中..." : "現在地にピンを移動"}
          </button>
          {locError && <p className="text-xs text-destructive mt-1">{locError}</p>}
          <p className="text-[10px] text-muted-foreground mt-1">地図をタップするか、ピンをドラッグして場所を指定してください</p>
        </div>

        {/* 投稿ボタン */}
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
