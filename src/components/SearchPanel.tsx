import { DurationSlider } from "@/components/DurationSlider";
import { TAG_GROUPS } from "@/lib/tags";

const REST_CUES = [
  "空を10秒見る",
  "水の音を聞く",
  "深呼吸を3回する",
  "スマホを30秒伏せる",
];

export interface SearchQuery {
  restDuration: number;       // 1–60（60＝制限なし）
  tags: string[];
  restCues: string[];
}

interface SearchPanelProps {
  query: SearchQuery;
  onChange: (q: SearchQuery) => void;
  onClose: () => void;
}

export function SearchPanel({ query, onChange, onClose }: SearchPanelProps) {
  const toggleTag = (tag: string) => {
    const tags = query.tags.includes(tag)
      ? query.tags.filter((t) => t !== tag)
      : [...query.tags, tag];
    onChange({ ...query, tags });
  };

  const toggleCue = (cue: string) => {
    const restCues = query.restCues.includes(cue)
      ? query.restCues.filter((c) => c !== cue)
      : [...query.restCues, cue];
    onChange({ ...query, restCues });
  };

  const hasFilters =
    query.restDuration < 60 ||
    query.tags.length > 0 ||
    query.restCues.length > 0;

  const reset = () =>
    onChange({ restDuration: 60, tags: [], restCues: [] });

  return (
    <div className="bg-background border-b border-border px-4 pt-2 pb-4 space-y-4">
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">検索・絞り込み</span>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={reset}
              className="text-[11px] text-muted-foreground underline"
            >
              リセット
            </button>
          )}
          <button
            onClick={onClose}
            className="text-muted-foreground text-base leading-none"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
      </div>

      {/* おすすめ休憩時間 */}
      <DurationSlider
        value={query.restDuration}
        onChange={(v) => onChange({ ...query, restDuration: v })}
        maxIsUnlimited
      />

      {/* タグ */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">🏷 タグ</p>
        <div className="space-y-2">
          {TAG_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] text-muted-foreground mb-1">{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      query.tags.includes(tag)
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

    </div>
  );
}

// スポットを SearchQuery で絞り込む
export function searchSpots<T extends {
  rest_duration_minutes: number | null;
  tags: string[] | null;
  rest_cue: string | null;
}>(spots: T[], query: SearchQuery): T[] {
  return spots.filter((spot) => {
    // 休憩時間
    if (query.restDuration < 60) {
      if ((spot.rest_duration_minutes ?? 99) > query.restDuration) return false;
    }
    // タグ（選んだタグを全て持つ）
    if (query.tags.length > 0) {
      if (!query.tags.every((t) => spot.tags?.includes(t))) return false;
    }
    // 休憩のヒント
    if (query.restCues.length > 0) {
      if (!query.restCues.includes(spot.rest_cue ?? "")) return false;
    }
    return true;
  });
}
