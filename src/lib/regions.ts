/** 座標ボックス */
export interface Bounds {
  minLat: number; maxLat: number;
  minLng: number; maxLng: number;
}

/** 最小の選択単位（区・地域） */
export interface District {
  id: string;
  name: string;
  center: [number, number];
  bounds: Bounds;
}

/** 市区町村 */
export interface City {
  id: string;
  name: string;
  prefectureId: string;
  center: [number, number];
  bounds: Bounds;
  districts: District[];
}

/** 都道府県 */
export interface Prefecture {
  id: string;
  name: string;
  cities: City[];
}

/** ホーム画面・DBに保存する地域選択 */
export interface AreaSelection {
  prefectureId: string;
  cityId: string;
  districtId: string | null; // null = 市全域
}

// ── ヘルパー ────────────────────────────────────────────────────

/** 中心点からバウンズを生成（dlat/dlng 省略時はデフォルト） */
function box(center: [number, number], dlat = 0.018, dlng = 0.020): Bounds {
  return {
    minLat: center[0] - dlat, maxLat: center[0] + dlat,
    minLng: center[1] - dlng, maxLng: center[1] + dlng,
  };
}

// ── 京都市 11区 ──────────────────────────────────────────────────
const KYOTO_CITY_DISTRICTS: District[] = [
  { id: "kita",        name: "北区",   center: [35.072, 135.742], bounds: { minLat: 35.055, maxLat: 35.115, minLng: 135.700, maxLng: 135.785 } },
  { id: "kamigyo",     name: "上京区", center: [35.040, 135.747], bounds: { minLat: 35.022, maxLat: 35.058, minLng: 135.722, maxLng: 135.778 } },
  { id: "sakyo",       name: "左京区", center: [35.052, 135.793], bounds: { minLat: 35.008, maxLat: 35.120, minLng: 135.752, maxLng: 135.855 } },
  { id: "nakagyo",     name: "中京区", center: [35.011, 135.757], bounds: { minLat: 34.994, maxLat: 35.026, minLng: 135.725, maxLng: 135.780 } },
  { id: "higashiyama", name: "東山区", center: [34.996, 135.783], bounds: { minLat: 34.972, maxLat: 35.022, minLng: 135.765, maxLng: 135.810 } },
  { id: "yamashina",   name: "山科区", center: [34.984, 135.836], bounds: { minLat: 34.952, maxLat: 35.018, minLng: 135.793, maxLng: 135.890 } },
  { id: "shimogyo",    name: "下京区", center: [34.988, 135.753], bounds: { minLat: 34.968, maxLat: 35.000, minLng: 135.722, maxLng: 135.772 } },
  { id: "minami",      name: "南区",   center: [34.957, 135.737], bounds: { minLat: 34.928, maxLat: 34.972, minLng: 135.704, maxLng: 135.765 } },
  { id: "ukyo",        name: "右京区", center: [35.014, 135.704], bounds: { minLat: 34.958, maxLat: 35.085, minLng: 135.640, maxLng: 135.752 } },
  { id: "nishikyo",    name: "西京区", center: [34.968, 135.680], bounds: { minLat: 34.918, maxLat: 35.018, minLng: 135.632, maxLng: 135.723 } },
  { id: "fushimi",     name: "伏見区", center: [34.934, 135.762], bounds: { minLat: 34.892, maxLat: 34.974, minLng: 135.718, maxLng: 135.828 } },
];

// ── 大阪市 24区 ──────────────────────────────────────────────────
const OSAKA_CITY_DISTRICTS: District[] = [
  { id: "kita",        name: "北区",     center: [34.702, 135.497], bounds: box([34.702, 135.497], 0.014, 0.018) },
  { id: "miyakojima",  name: "都島区",   center: [34.710, 135.530], bounds: box([34.710, 135.530]) },
  { id: "fukushima",   name: "福島区",   center: [34.691, 135.473], bounds: box([34.691, 135.473], 0.012, 0.015) },
  { id: "konohana",    name: "此花区",   center: [34.681, 135.447], bounds: box([34.681, 135.447], 0.016, 0.022) },
  { id: "chuo",        name: "中央区",   center: [34.679, 135.516], bounds: box([34.679, 135.516], 0.013, 0.018) },
  { id: "nishi",       name: "西区",     center: [34.676, 135.490], bounds: box([34.676, 135.490], 0.012, 0.015) },
  { id: "minato",      name: "港区",     center: [34.666, 135.460], bounds: box([34.666, 135.460]) },
  { id: "taisho",      name: "大正区",   center: [34.661, 135.476], bounds: box([34.661, 135.476]) },
  { id: "tennoji",     name: "天王寺区", center: [34.648, 135.516], bounds: box([34.648, 135.516], 0.012, 0.013) },
  { id: "naniwa",      name: "浪速区",   center: [34.660, 135.499], bounds: box([34.660, 135.499], 0.010, 0.012) },
  { id: "nishiyodogawa", name: "西淀川区", center: [34.716, 135.452], bounds: box([34.716, 135.452], 0.018, 0.022) },
  { id: "yodogawa",    name: "淀川区",   center: [34.729, 135.490], bounds: box([34.729, 135.490], 0.016, 0.020) },
  { id: "higashiyodogawa", name: "東淀川区", center: [34.739, 135.527], bounds: box([34.739, 135.527], 0.016, 0.020) },
  { id: "higashinari", name: "東成区",   center: [34.669, 135.543], bounds: box([34.669, 135.543], 0.012, 0.014) },
  { id: "ikuno",       name: "生野区",   center: [34.653, 135.539], bounds: box([34.653, 135.539], 0.014, 0.016) },
  { id: "asahi",       name: "旭区",     center: [34.712, 135.548], bounds: box([34.712, 135.548], 0.013, 0.015) },
  { id: "joto",        name: "城東区",   center: [34.706, 135.555], bounds: box([34.706, 135.555], 0.014, 0.016) },
  { id: "tsurumi",     name: "鶴見区",   center: [34.682, 135.566], bounds: box([34.682, 135.566], 0.014, 0.017) },
  { id: "abeno",       name: "阿倍野区", center: [34.638, 135.515], bounds: box([34.638, 135.515], 0.012, 0.014) },
  { id: "suminoe",     name: "住之江区", center: [34.614, 135.481], bounds: box([34.614, 135.481], 0.018, 0.020) },
  { id: "sumiyoshi",   name: "住吉区",   center: [34.617, 135.506], bounds: box([34.617, 135.506], 0.015, 0.016) },
  { id: "higashisumiyoshi", name: "東住吉区", center: [34.627, 135.533], bounds: box([34.627, 135.533], 0.015, 0.017) },
  { id: "hirano",      name: "平野区",   center: [34.634, 135.551], bounds: box([34.634, 135.551], 0.018, 0.020) },
  { id: "nishinari",   name: "西成区",   center: [34.645, 135.493], bounds: box([34.645, 135.493], 0.013, 0.015) },
];

// ── 神戸市 9区 ──────────────────────────────────────────────────
const KOBE_CITY_DISTRICTS: District[] = [
  { id: "higashinada", name: "東灘区", center: [34.722, 135.276], bounds: box([34.722, 135.276], 0.018, 0.025) },
  { id: "nada",        name: "灘区",   center: [34.714, 135.224], bounds: box([34.714, 135.224], 0.015, 0.022) },
  { id: "hyogo",       name: "兵庫区", center: [34.680, 135.163], bounds: box([34.680, 135.163], 0.013, 0.016) },
  { id: "nagata",      name: "長田区", center: [34.667, 135.147], bounds: box([34.667, 135.147], 0.012, 0.015) },
  { id: "suma",        name: "須磨区", center: [34.649, 135.115], bounds: box([34.649, 135.115], 0.018, 0.025) },
  { id: "tarumi",      name: "垂水区", center: [34.625, 135.060], bounds: box([34.625, 135.060], 0.018, 0.025) },
  { id: "nishi-kobe",  name: "西区",   center: [34.662, 134.989], bounds: box([34.662, 134.989], 0.030, 0.040) },
  { id: "chuo-kobe",   name: "中央区", center: [34.694, 135.193], bounds: box([34.694, 135.193], 0.016, 0.025) },
  { id: "kita-kobe",   name: "北区",   center: [34.773, 135.139], bounds: box([34.773, 135.139], 0.040, 0.050) },
];

// ── 都道府県データ ───────────────────────────────────────────────
export const PREFECTURES: Prefecture[] = [
  {
    id: "kyoto",
    name: "京都府",
    cities: [
      {
        id: "kyoto-city", name: "京都市", prefectureId: "kyoto",
        center: [35.012, 135.757],
        bounds: { minLat: 34.892, maxLat: 35.120, minLng: 135.632, maxLng: 135.890 },
        districts: KYOTO_CITY_DISTRICTS,
      },
      {
        id: "uji", name: "宇治市", prefectureId: "kyoto",
        center: [34.884, 135.800],
        bounds: box([34.884, 135.800], 0.025, 0.030),
        districts: [],
      },
      {
        id: "kameoka", name: "亀岡市", prefectureId: "kyoto",
        center: [35.009, 135.573],
        bounds: box([35.009, 135.573], 0.035, 0.040),
        districts: [],
      },
      {
        id: "nagaokakyo", name: "長岡京市", prefectureId: "kyoto",
        center: [34.924, 135.694],
        bounds: box([34.924, 135.694], 0.018, 0.020),
        districts: [],
      },
      {
        id: "muko", name: "向日市", prefectureId: "kyoto",
        center: [34.945, 135.699],
        bounds: box([34.945, 135.699], 0.012, 0.012),
        districts: [],
      },
      {
        id: "joyo", name: "城陽市", prefectureId: "kyoto",
        center: [34.847, 135.774],
        bounds: box([34.847, 135.774], 0.022, 0.025),
        districts: [],
      },
    ],
  },
  {
    id: "osaka",
    name: "大阪府",
    cities: [
      {
        id: "osaka-city", name: "大阪市", prefectureId: "osaka",
        center: [34.686, 135.520],
        bounds: { minLat: 34.597, maxLat: 34.755, minLng: 135.425, maxLng: 135.590 },
        districts: OSAKA_CITY_DISTRICTS,
      },
      {
        id: "sakai", name: "堺市", prefectureId: "osaka",
        center: [34.573, 135.483],
        bounds: box([34.573, 135.483], 0.040, 0.045),
        districts: [
          { id: "sakai-ku",   name: "堺区",   center: [34.580, 135.475], bounds: box([34.580, 135.475]) },
          { id: "naka-ku",    name: "中区",   center: [34.558, 135.515], bounds: box([34.558, 135.515]) },
          { id: "higashi-ku", name: "東区",   center: [34.555, 135.547], bounds: box([34.555, 135.547]) },
          { id: "nishi-ku",   name: "西区",   center: [34.560, 135.450], bounds: box([34.560, 135.450]) },
          { id: "minami-ku",  name: "南区",   center: [34.527, 135.503], bounds: box([34.527, 135.503], 0.022, 0.025) },
          { id: "kita-ku",    name: "北区",   center: [34.600, 135.493], bounds: box([34.600, 135.493]) },
          { id: "mihara-ku",  name: "美原区", center: [34.535, 135.555], bounds: box([34.535, 135.555]) },
        ],
      },
      {
        id: "toyonaka", name: "豊中市", prefectureId: "osaka",
        center: [34.782, 135.469],
        bounds: box([34.782, 135.469], 0.025, 0.028),
        districts: [],
      },
      {
        id: "suita", name: "吹田市", prefectureId: "osaka",
        center: [34.758, 135.516],
        bounds: box([34.758, 135.516], 0.022, 0.025),
        districts: [],
      },
      {
        id: "takatsuki", name: "高槻市", prefectureId: "osaka",
        center: [34.850, 135.617],
        bounds: box([34.850, 135.617], 0.035, 0.040),
        districts: [],
      },
      {
        id: "hirakata", name: "枚方市", prefectureId: "osaka",
        center: [34.815, 135.653],
        bounds: box([34.815, 135.653], 0.030, 0.035),
        districts: [],
      },
      {
        id: "higashiosaka", name: "東大阪市", prefectureId: "osaka",
        center: [34.679, 135.601],
        bounds: box([34.679, 135.601], 0.030, 0.035),
        districts: [],
      },
    ],
  },
  {
    id: "hyogo",
    name: "兵庫県",
    cities: [
      {
        id: "kobe", name: "神戸市", prefectureId: "hyogo",
        center: [34.690, 135.196],
        bounds: { minLat: 34.587, maxLat: 34.820, minLng: 134.940, maxLng: 135.305 },
        districts: KOBE_CITY_DISTRICTS,
      },
      {
        id: "himeji", name: "姫路市", prefectureId: "hyogo",
        center: [34.816, 134.686],
        bounds: box([34.816, 134.686], 0.060, 0.080),
        districts: [],
      },
      {
        id: "nishinomiya", name: "西宮市", prefectureId: "hyogo",
        center: [34.738, 135.343],
        bounds: box([34.738, 135.343], 0.030, 0.040),
        districts: [],
      },
      {
        id: "amagasaki", name: "尼崎市", prefectureId: "hyogo",
        center: [34.724, 135.411],
        bounds: box([34.724, 135.411], 0.020, 0.022),
        districts: [],
      },
      {
        id: "akashi", name: "明石市", prefectureId: "hyogo",
        center: [34.645, 134.998],
        bounds: box([34.645, 134.998], 0.025, 0.030),
        districts: [],
      },
    ],
  },
  {
    id: "shiga",
    name: "滋賀県",
    cities: [
      {
        id: "otsu", name: "大津市", prefectureId: "shiga",
        center: [35.004, 135.869],
        bounds: box([35.004, 135.869], 0.055, 0.065),
        districts: [],
      },
      {
        id: "kusatsu", name: "草津市", prefectureId: "shiga",
        center: [35.017, 135.960],
        bounds: box([35.017, 135.960], 0.022, 0.025),
        districts: [],
      },
      {
        id: "moriyama", name: "守山市", prefectureId: "shiga",
        center: [35.064, 135.999],
        bounds: box([35.064, 135.999], 0.020, 0.022),
        districts: [],
      },
      {
        id: "ritto", name: "栗東市", prefectureId: "shiga",
        center: [35.013, 135.998],
        bounds: box([35.013, 135.998], 0.016, 0.018),
        districts: [],
      },
      {
        id: "yasu", name: "野洲市", prefectureId: "shiga",
        center: [35.073, 136.030],
        bounds: box([35.073, 136.030], 0.020, 0.022),
        districts: [],
      },
      {
        id: "konan", name: "湖南市", prefectureId: "shiga",
        center: [34.985, 136.067],
        bounds: box([34.985, 136.067], 0.022, 0.025),
        districts: [],
      },
      {
        id: "koka", name: "甲賀市", prefectureId: "shiga",
        center: [34.961, 136.167],
        bounds: box([34.961, 136.167], 0.065, 0.065),
        districts: [],
      },
      {
        id: "omihachiman", name: "近江八幡市", prefectureId: "shiga",
        center: [35.128, 136.097],
        bounds: box([35.128, 136.097], 0.032, 0.038),
        districts: [],
      },
      {
        id: "higashiomi", name: "東近江市", prefectureId: "shiga",
        center: [35.115, 136.185],
        bounds: box([35.115, 136.185], 0.065, 0.060),
        districts: [],
      },
      {
        id: "takashima", name: "高島市", prefectureId: "shiga",
        center: [35.347, 136.039],
        bounds: box([35.347, 136.039], 0.095, 0.085),
        districts: [],
      },
      {
        id: "hikone", name: "彦根市", prefectureId: "shiga",
        center: [35.275, 136.250],
        bounds: box([35.275, 136.250], 0.028, 0.028),
        districts: [],
      },
      {
        id: "nagahama", name: "長浜市", prefectureId: "shiga",
        center: [35.381, 136.269],
        bounds: box([35.381, 136.269], 0.085, 0.075),
        districts: [],
      },
      {
        id: "maibara", name: "米原市", prefectureId: "shiga",
        center: [35.322, 136.290],
        bounds: box([35.322, 136.290], 0.065, 0.058),
        districts: [],
      },
    ],
  },
];

// ── ルックアップ ─────────────────────────────────────────────────

export function getPrefecture(id: string): Prefecture | undefined {
  return PREFECTURES.find(p => p.id === id);
}

export function getCity(prefId: string, cityId: string): City | undefined {
  return getPrefecture(prefId)?.cities.find(c => c.id === cityId);
}

export function getDistrict(prefId: string, cityId: string, distId: string): District | undefined {
  return getCity(prefId, cityId)?.districts.find(d => d.id === distId);
}

export function formatArea(area: AreaSelection): string {
  const pref = getPrefecture(area.prefectureId);
  const city = getCity(area.prefectureId, area.cityId);
  if (!city) return "";
  if (area.districtId === null) return `${city.name}全域`;
  const dist = city.districts.find(d => d.id === area.districtId);
  return dist ? `${city.name} ${dist.name}` : city.name;
}

export function getAreaCenter(area: AreaSelection): [number, number] {
  const city = getCity(area.prefectureId, area.cityId);
  if (!city) return [35.0116, 135.7681];
  if (area.districtId) {
    const dist = city.districts.find(d => d.id === area.districtId);
    if (dist) return dist.center;
  }
  return city.center;
}

/** スポットが指定エリアに含まれるか */
function spotInArea(lat: number, lng: number, area: AreaSelection): boolean {
  const city = getCity(area.prefectureId, area.cityId);
  if (!city) return false;
  if (area.districtId === null || city.districts.length === 0) {
    const b = city.bounds;
    return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
  }
  const dist = city.districts.find(d => d.id === area.districtId);
  if (!dist) return false;
  const b = dist.bounds;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

export function spotInAreaSelections(lat: number, lng: number, areas: AreaSelection[]): boolean {
  return areas.some(a => spotInArea(lat, lng, a));
}

// 後方互換（旧string形式のlegacy REGIONS）
export const REGIONS = KYOTO_CITY_DISTRICTS; // legacy alias
export function getRegion(id: string) { return KYOTO_CITY_DISTRICTS.find(d => d.id === id); }
export function spotInRegions(lat: number, lng: number, ids: string[]): boolean {
  return ids.some(id => {
    const r = getRegion(id);
    if (!r) return false;
    const b = r.bounds;
    return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
  });
}
