import type { BackendHourlyPoint } from "@/types/travel-backend";
import { getSpotByApiDistrict, resolveCoordsFromApiDistrict, displayNameForApiDistrict } from "@/lib/api-district-map";
import { CATEGORY_META, type SpotCategory } from "@/lib/da-nang-spots";
import { distanceKm } from "@/lib/itinerary-scoring";

/* ─── Types ──────────────────────────────────────────────────── */

export interface ItineraryStop {
  districtKey: string;
  displayName: string;
  emoji: string;
  category: SpotCategory | null;
  categoryLabel: string;
  lat: number;
  lng: number;
  /** Start hour within the day, e.g. 6.5 = 06:30 */
  startHour: number;
  /** End hour */
  endHour: number;
  /** Duration in hours */
  durationH: number;
  /** Travel time from previous stop in minutes */
  travelMinFromPrev: number;
  /** Distance from user / origin in km */
  distanceKm: number;
  /** Weather at the estimated visit hour */
  weather: {
    tempC: number | null;
    rainMm: number | null;
    rainProb: number | null;
    windKph: number | null;
    humidity: number | null;
    description: string;
    score: number; // 0-100
  };
}

export interface ItineraryOption {
  id: string;
  title: string;
  themeEmoji: string;
  /** Categories that this option favours */
  themeTags: string[];
  stops: ItineraryStop[];
  /** Average weather score across stops */
  avgScore: number;
  /** Total distance travelled km */
  totalDistanceKm: number;
  /** End hour of last stop */
  endsAt: number;
}

/* ─── Config ─────────────────────────────────────────────────── */

/** How long to spend at each category (hours) */
const DURATION_BY_CAT: Record<SpotCategory, number> = {
  beach: 2,
  nature: 2,
  bridge: 1,
  culture: 1.5,
  temple: 1.5,
  entertainment: 1.5,
  market: 1,
  landmark: 0.75,
};

const START_HOUR = 6.5; // 06:30
const END_HOUR = 23;    // 23:00 — bao gồm đêm khuya
const AVG_SPEED_KPH = 25; // average city speed for travel time calc
const MAX_STOPS = 7;

/** Các category phù hợp tham quan đêm khuya (sau 19h) */
const NIGHTLIFE_CATS = new Set<SpotCategory>(["bridge", "entertainment", "market", "landmark"]);

/** Spot IDs đặc biệt đẹp/vui ban đêm — bonus thêm khi xếp buổi tối */
const NIGHTLIFE_SPOT_IDS = new Set([
  "dragon_bridge",    // Cầu Rồng phun lửa
  "han_bridge",       // Cầu Sông Hàn quay đêm
  "love_bridge",      // Cầu Tình Yêu
  "carp_dragon",      // Tượng Cá Chép Hóa Rồng
  "bach_dang_walk",   // Phố đi bộ Bạch Đằng
  "bach_dang_flower", // Đường hoa Bạch Đằng
  "han_marina",       // Bến du thuyền sông Hàn
  "helio_night",      // Chợ đêm Helio
  "son_tra_night",    // Chợ đêm Sơn Trà
  "helio_center",     // Helio Center
  "apec_park",        // Công viên APEC
  "asia_park",        // Công viên Châu Á
  "sun_wheel",        // Sun Wheel
  "nvt_bridge",       // Cầu Nguyễn Văn Trỗi
  "downtown",         // Da Nang Downtown
]);

/* Option themes */
interface OptionTheme {
  id: string;
  title: string;
  emoji: string;
  tags: string[];
  /** Category priority order */
  priorityCats: SpotCategory[];
}

const THEMES: OptionTheme[] = [
  {
    id: "beach-culture",
    title: "Biển & Văn hóa",
    emoji: "🏖️",
    tags: ["Biển", "Văn hóa", "Cầu"],
    priorityCats: ["beach", "culture", "bridge", "landmark", "market"],
  },
  {
    id: "nature-explore",
    title: "Thiên nhiên & Khám phá",
    emoji: "🌿",
    tags: ["Thiên nhiên", "Chùa", "Giải trí"],
    priorityCats: ["nature", "temple", "entertainment", "landmark", "bridge"],
  },
  {
    id: "nearby-easy",
    title: "Gần & Tiện lợi",
    emoji: "📍",
    tags: ["Gần nhất", "Đa dạng"],
    priorityCats: ["market", "bridge", "entertainment", "culture", "beach", "landmark", "temple", "nature"],
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */

function hourLabel(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export { hourLabel };

/** Get weather at a specific hour from hourly data */
function weatherAtHour(
  hourly: BackendHourlyPoint[],
  hour: number
): ItineraryStop["weather"] {
  const roundedHour = Math.round(hour);
  const point = hourly.find((h) => h.hour === roundedHour)
    ?? hourly.find((h) => h.hour === roundedHour - 1)
    ?? hourly.find((h) => h.hour === roundedHour + 1);

  if (!point) {
    return { tempC: null, rainMm: null, rainProb: null, windKph: null, humidity: null, description: "Không có dữ liệu", score: 55 };
  }

  let score = 70;
  const rainMm = point.rain_mm ?? 0;
  const rainProb = point.rain_probability ?? 0;
  const tempC = point.temperature_c;
  const windKph = (point.wind_speed_m_s ?? 0) * 3.6;

  if (rainMm <= 0.1) score += 15;
  else if (rainMm < 2) score += 5;
  else if (rainMm < 5) score -= 10;
  else score -= 25;

  if (rainProb < 20) score += 5;
  else if (rainProb > 60) score -= 10;

  if (tempC >= 22 && tempC <= 32) score += 5;
  else if (tempC > 35) score -= 8;

  if (windKph > 50) score -= 10;
  else if (windKph > 35) score -= 4;

  score = Math.max(0, Math.min(100, score));

  return {
    tempC,
    rainMm,
    rainProb,
    windKph,
    humidity: point.humidity_percent ?? null,
    description: point.description ?? "",
    score,
  };
}

/** Score a district for an option: combines weather-at-hour + distance + category-priority + nightlife */
function candidateScore(
  distKm: number,
  weatherScore: number,
  catPriorityIndex: number, // lower = better
  isNearbyTheme: boolean,
  dMin: number,
  dMax: number,
  nightlifeBonus: number, // 0–25 bonus for nightlife-friendly spots when hour >= 19
): number {
  const span = dMax - dMin || 1;
  const distNorm = 100 * (1 - (distKm - dMin) / span);
  const catBonus = Math.max(0, 20 - catPriorityIndex * 5); // up to 20 bonus for top categories

  if (isNearbyTheme) {
    return 0.25 * weatherScore + 0.4 * distNorm + 0.15 * catBonus + 0.2 * nightlifeBonus;
  }
  return 0.35 * weatherScore + 0.2 * distNorm + 0.25 * catBonus + 0.2 * nightlifeBonus;
}

/* ─── Main generator ─────────────────────────────────────────── */

export function generateItineraryOptions(
  districtKeys: string[],
  hourlyByDistrict: Record<string, BackendHourlyPoint[]>,
  origin: { lat: number; lng: number },
  overallWeatherScores: Record<string, number>
): ItineraryOption[] {
  if (!districtKeys.length) return [];

  // Pre-compute coords + metadata
  const metaMap = new Map(
    districtKeys.map((key) => {
      const spot = getSpotByApiDistrict(key);
      const coords = resolveCoordsFromApiDistrict(key);
      return [key, {
        coords,
        displayName: displayNameForApiDistrict(key),
        emoji: spot?.emoji ?? "📍",
        category: (spot?.category as SpotCategory) ?? null,
        dKm: distanceKm(origin, coords),
      }];
    })
  );

  const allDists = [...metaMap.values()].map((m) => m.dKm);
  const dMin = Math.min(...allDists);
  const dMax = Math.max(...allDists);

  return THEMES.map((theme) => {
    const usedKeys = new Set<string>();
    const stops: ItineraryStop[] = [];
    let currentHour = START_HOUR;
    let currentPos = origin;

    for (let i = 0; i < MAX_STOPS && currentHour < END_HOUR - 0.5; i++) {
      // Score all candidates
      const isNightTime = currentHour >= 19;
      const candidates = districtKeys
        .filter((k) => !usedKeys.has(k))
        .map((k) => {
          const meta = metaMap.get(k)!;
          const hourly = hourlyByDistrict[k] ?? [];
          const wAtHour = weatherAtHour(hourly, currentHour);
          const catIdx = meta.category
            ? theme.priorityCats.indexOf(meta.category)
            : theme.priorityCats.length;
          const effCatIdx = catIdx === -1 ? theme.priorityCats.length : catIdx;

          // distance from current position
          const dFromCurrent = distanceKm(currentPos, meta.coords);
          const travelMin = (dFromCurrent / AVG_SPEED_KPH) * 60;

          // Nightlife bonus: spots that shine at night get extra score after 19h
          let nightlifeBonus = 0;
          if (isNightTime) {
            const spot = getSpotByApiDistrict(k);
            if (spot && NIGHTLIFE_SPOT_IDS.has(spot.id)) nightlifeBonus = 100; // strong preference
            else if (meta.category && NIGHTLIFE_CATS.has(meta.category)) nightlifeBonus = 60;
          }

          const score = candidateScore(
            meta.dKm,
            wAtHour.score,
            effCatIdx,
            theme.id === "nearby-easy",
            dMin,
            dMax,
            nightlifeBonus,
          );

          return { key: k, meta, wAtHour, dFromCurrent, travelMin, score };
        })
        .sort((a, b) => b.score - a.score);

      if (!candidates.length) break;

      const pick = candidates[0];
      const travelMin = stops.length === 0 ? 0 : Math.max(5, Math.round(pick.travelMin));
      const travelH = travelMin / 60;
      const startH = currentHour + travelH;

      if (startH >= END_HOUR - 0.5) break;

      const duration = pick.meta.category
        ? DURATION_BY_CAT[pick.meta.category]
        : 1;
      const endH = Math.min(startH + duration, END_HOUR);

      stops.push({
        districtKey: pick.key,
        displayName: pick.meta.displayName,
        emoji: pick.meta.emoji,
        category: pick.meta.category,
        categoryLabel: pick.meta.category
          ? CATEGORY_META[pick.meta.category].label
          : "Điểm đến",
        lat: pick.meta.coords.lat,
        lng: pick.meta.coords.lng,
        startHour: startH,
        endHour: endH,
        durationH: endH - startH,
        travelMinFromPrev: travelMin,
        distanceKm: pick.meta.dKm,
        weather: pick.wAtHour,
      });

      usedKeys.add(pick.key);
      currentPos = pick.meta.coords;
      currentHour = endH;
    }

    const scores = stops.map((s) => s.weather.score);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Total distance = sum of distances between consecutive stops
    let totalDist = 0;
    for (let i = 1; i < stops.length; i++) {
      totalDist += distanceKm(
        { lat: stops[i - 1].lat, lng: stops[i - 1].lng },
        { lat: stops[i].lat, lng: stops[i].lng }
      );
    }

    return {
      id: theme.id,
      title: theme.title,
      themeEmoji: theme.emoji,
      themeTags: theme.tags,
      stops,
      avgScore,
      totalDistanceKm: totalDist,
      endsAt: stops.length ? stops[stops.length - 1].endHour : START_HOUR,
    };
  });
}
