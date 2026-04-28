import type { BackendHourlyPoint } from "@/types/travel-backend";

export type TimeSlot = "morning" | "afternoon" | "evening";

export interface SlotWeatherSummary {
  slot: TimeSlot;
  label: string;
  emoji: string;
  hourRange: [number, number];
  avgTemp: number | null;
  totalRain: number | null;
  avgRainProb: number | null;
  maxWind: number | null;
  avgHumidity: number | null;
  score: number;
  recommendation: string;
}

export const TIME_SLOTS: {
  slot: TimeSlot;
  label: string;
  emoji: string;
  hourRange: [number, number];
}[] = [
  { slot: "morning", label: "Sáng", emoji: "🌅", hourRange: [6, 11] },
  { slot: "afternoon", label: "Chiều", emoji: "☀️", hourRange: [11, 17] },
  { slot: "evening", label: "Tối", emoji: "🌙", hourRange: [17, 22] },
];

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function sum(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0);
}

function max(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.max(...nums);
}

export function computeSlotWeather(
  hourly: BackendHourlyPoint[],
  slot: TimeSlot
): SlotWeatherSummary {
  const meta = TIME_SLOTS.find((s) => s.slot === slot)!;
  const [lo, hi] = meta.hourRange;
  const points = hourly.filter((h) => h.hour >= lo && h.hour < hi);

  const temps = points.map((p) => p.temperature_c).filter((v) => v != null);
  const rains = points.map((p) => p.rain_mm).filter((v) => v != null);
  const probs = points.map((p) => p.rain_probability).filter((v) => v != null);
  const winds = points
    .map((p) => p.wind_speed_m_s)
    .filter((v) => v != null)
    .map((v) => v * 3.6);
  const hums = points.map((p) => p.humidity_percent).filter((v) => v != null);

  const avgTemp = avg(temps);
  const totalRain = sum(rains);
  const avgRainProb = avg(probs);
  const maxWind = max(winds);
  const avgHumidity = avg(hums);

  const score = computeSlotScore(avgTemp, totalRain, avgRainProb, maxWind, avgHumidity);
  const recommendation = getSlotRecommendation(score, avgTemp, totalRain, avgRainProb, slot);

  return {
    slot,
    label: meta.label,
    emoji: meta.emoji,
    hourRange: meta.hourRange,
    avgTemp,
    totalRain,
    avgRainProb,
    maxWind,
    avgHumidity,
    score,
    recommendation,
  };
}

function computeSlotScore(
  avgTemp: number | null,
  totalRain: number | null,
  avgRainProb: number | null,
  maxWind: number | null,
  avgHumidity: number | null
): number {
  let score = 62;

  if (totalRain != null) {
    if (totalRain <= 0.05) score += 22;
    else if (totalRain < 1.5) score += 10;
    else if (totalRain < 5) score -= 8;
    else score -= 28;
  }

  if (avgRainProb != null) {
    if (avgRainProb < 25) score += 6;
    else if (avgRainProb > 55) score -= 12;
  }

  if (avgTemp != null) {
    if (avgTemp >= 22 && avgTemp <= 32) score += 6;
    else if (avgTemp > 34) score -= 8;
    else if (avgTemp < 18) score -= 5;
  }

  if (maxWind != null) {
    if (maxWind > 50) score -= 10;
    else if (maxWind > 35) score -= 4;
  }

  if (avgHumidity != null && avgHumidity > 88) {
    score -= 4;
  }

  return Math.max(0, Math.min(100, score));
}

function getSlotRecommendation(
  score: number,
  _avgTemp: number | null,
  _totalRain: number | null,
  _avgRainProb: number | null,
  slot: TimeSlot
): string {
  if (score >= 85) {
    if (slot === "morning") return "Buổi sáng lý tưởng — thời tiết đẹp";
    if (slot === "afternoon") return "Chiều nay trời đẹp — tuyệt vời để khám phá";
    return "Tối nay thời tiết rất tốt";
  }
  if (score >= 70) return "Thời tiết khá ổn — vẫn nên ra ngoài";
  if (score >= 50) return "Thời tiết trung bình — mang theo ô dù";
  return "Thời tiết không thuận lợi — nên ở trong nhà";
}

export function computeAllSlots(
  hourly: BackendHourlyPoint[]
): Record<TimeSlot, SlotWeatherSummary> {
  return {
    morning: computeSlotWeather(hourly, "morning"),
    afternoon: computeSlotWeather(hourly, "afternoon"),
    evening: computeSlotWeather(hourly, "evening"),
  };
}

export function spotSlotScore(
  slotWeatherScore: number,
  distanceKm: number,
  dMin: number,
  dMax: number
): number {
  const span = dMax - dMin || 1;
  const distNorm = 100 * (1 - (distanceKm - dMin) / span);
  return 0.5 * slotWeatherScore + 0.5 * distNorm;
}

export function scoreLabel(score: number): {
  text: string;
  colorClass: string;
} {
  if (score >= 80) return { text: "Rất tốt", colorClass: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 65) return { text: "Tốt", colorClass: "text-sky-600 dark:text-sky-400" };
  if (score >= 50) return { text: "Tạm", colorClass: "text-amber-600 dark:text-amber-400" };
  return { text: "Không tốt", colorClass: "text-red-500 dark:text-red-400" };
}

export function scoreBgClass(score: number): string {
  if (score >= 80) return "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/25";
  if (score >= 65) return "bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/25";
  if (score >= 50) return "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25";
  return "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/25";
}
