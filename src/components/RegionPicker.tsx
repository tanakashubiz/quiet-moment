import { useState } from "react";
import { PREFECTURES, type AreaSelection, type City } from "@/lib/regions";

interface RegionPickerProps {
  value?: AreaSelection | null;
  onChange: (area: AreaSelection) => void;
  allowAllCity?: boolean; // 「市全域」を選べるか（サブ地域向け）
}

type Step = "pref" | "city" | "district";

export function RegionPicker({ value, onChange, allowAllCity = false }: RegionPickerProps) {
  const [step, setStep] = useState<Step>("pref");
  const [selPrefId, setSelPrefId] = useState<string | null>(value?.prefectureId ?? null);
  const [selCityId, setSelCityId] = useState<string | null>(value?.cityId ?? null);

  const pref = PREFECTURES.find(p => p.id === selPrefId);
  const city = pref?.cities.find(c => c.id === selCityId);

  const selectPref = (id: string) => {
    setSelPrefId(id);
    setSelCityId(null);
    setStep("city");
  };

  const selectCity = (c: City) => {
    setSelCityId(c.id);
    if (c.districts.length === 0) {
      // 区がない市はそのまま確定
      onChange({ prefectureId: selPrefId!, cityId: c.id, districtId: null });
    } else {
      setStep("district");
    }
  };

  const selectDistrict = (districtId: string | null) => {
    onChange({ prefectureId: selPrefId!, cityId: selCityId!, districtId });
  };

  const back = () => {
    if (step === "district") { setStep("city"); }
    else if (step === "city") { setStep("pref"); setSelPrefId(null); }
  };

  // ── パンくず ──────────────────────────────────────────────
  const Breadcrumb = () => (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
      <button onClick={() => { setStep("pref"); setSelPrefId(null); setSelCityId(null); }}
        className={step === "pref" ? "text-foreground font-medium" : "hover:text-foreground"}>
        都道府県
      </button>
      {selPrefId && (
        <>
          <span>›</span>
          <button onClick={() => { setStep("city"); setSelCityId(null); }}
            className={step === "city" ? "text-foreground font-medium" : "hover:text-foreground"}>
            {pref?.name}
          </button>
        </>
      )}
      {selCityId && (
        <>
          <span>›</span>
          <span className={step === "district" ? "text-foreground font-medium" : ""}>{city?.name}</span>
        </>
      )}
    </div>
  );

  // ── Step 1: 都道府県 ─────────────────────────────────────
  if (step === "pref") {
    return (
      <div>
        <Breadcrumb />
        <div className="grid grid-cols-2 gap-2">
          {PREFECTURES.map(p => (
            <button
              key={p.id}
              onClick={() => selectPref(p.id)}
              className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                selPrefId === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {p.name}{p.id === "kyoto" || p.id === "osaka" ? "府" : "県"}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: 市区町村 ─────────────────────────────────────
  if (step === "city") {
    return (
      <div>
        <Breadcrumb />
        <div className="grid grid-cols-2 gap-2">
          {pref!.cities.map(c => (
            <button
              key={c.id}
              onClick={() => selectCity(c)}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                selCityId === c.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 3: 地区 ────────────────────────────────────────
  return (
    <div>
      <Breadcrumb />
      <div className="grid grid-cols-3 gap-1.5">
        {allowAllCity && (
          <button
            onClick={() => selectDistrict(null)}
            className="col-span-3 py-2.5 rounded-xl text-sm font-medium border border-primary/40 bg-secondary text-secondary-foreground transition-colors"
          >
            {city?.name}全域
          </button>
        )}
        {city!.districts.map(d => (
          <button
            key={d.id}
            onClick={() => selectDistrict(d.id)}
            className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
              value?.districtId === d.id && value?.cityId === city?.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border"
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
}
