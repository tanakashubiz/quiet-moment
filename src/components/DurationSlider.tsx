import { Slider } from "@/components/ui/slider";

// 1〜5分は1分刻み、以降は10/15/20/30/45/60分
export const DURATION_STEPS = [3, 5, 10, 15, 20, 30, 45, 60];

export function stepToMinutes(index: number): number {
  return DURATION_STEPS[Math.min(index, DURATION_STEPS.length - 1)];
}

export function minutesToStep(minutes: number): number {
  // 最も近いステップのインデックスを返す
  let closest = 0;
  let diff = Infinity;
  DURATION_STEPS.forEach((val, i) => {
    if (Math.abs(val - minutes) < diff) {
      diff = Math.abs(val - minutes);
      closest = i;
    }
  });
  return closest;
}

export function formatDuration(minutes: number, maxIsUnlimited = false): string {
  if (maxIsUnlimited && minutes >= 60) return "制限なし";
  if (minutes >= 60) return "1時間";
  return `${minutes}分`;
}

interface DurationSliderProps {
  value: number;              // 実際の分数
  onChange: (minutes: number) => void;
  maxIsUnlimited?: boolean;   // 最大値を「制限なし」と表示するか
}

export function DurationSlider({ value, onChange, maxIsUnlimited = false }: DurationSliderProps) {
  const stepIndex = minutesToStep(value);

  const handleChange = ([idx]: number[]) => {
    onChange(stepToMinutes(idx));
  };

  const label = maxIsUnlimited && value >= 60
    ? "制限なし"
    : `${value}分${maxIsUnlimited ? "以内" : ""}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">⏱ おすすめ休憩時間</span>
        <span className="text-xs font-semibold text-foreground">{label}</span>
      </div>
      <Slider
        min={0}
        max={DURATION_STEPS.length - 1}
        step={1}
        value={[stepIndex]}
        onValueChange={handleChange}
        className="w-full"
      />
      {/* 全ステップのラベルを等間隔で表示 */}
      <div className="flex justify-between mt-1">
        {DURATION_STEPS.map((min) => (
          <span key={min} className="text-[9px] text-muted-foreground leading-none">
            {min >= 60 ? "1h" : `${min}`}
          </span>
        ))}
      </div>
    </div>
  );
}
