import type {
  BackendDailySummary,
  BackendDistrict,
  BackendWeatherSummaryRow,
} from "@/types/travel-backend";

/** Haversine km */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

/** Lấy tên khu vực từ object API (linh hoạt nhiều key) */
export function extractDistrictLabel(row: Record<string, unknown>): string {
  const keys = [
    "district",
    "district_name",
    "name",
    "location",
    "area",
    "ward",
    "region",
    "ten",
    "quan",
  ];
  for (const k of keys) {
    const v = str(row[k]);
    if (v) return v;
  }
  return "Khu vực";
}

/** Trích mưa / nhiệt / mã thời tiết từ 1 dòng summary */
export function extractWeatherSignals(row: Record<string, unknown>): {
  rainMm: number | null;
  tempC: number | null;
  wmo: number | null;
  humidity: number | null;
} {
  const rainKeys = [
    "precipitation",
    "precipitation_sum",
    "rain",
    "rain_mm",
    "precip",
    "total_precipitation",
  ];
  const tempKeys = [
    "temperature",
    "temperature_2m",
    "temp",
    "temp_max",
    "tmax",
    "mean_temp",
  ];
  const wmoKeys = ["weather_code", "wmo", "condition_code", "code"];
  const humKeys = ["humidity", "relative_humidity", "rh"];

  let rainMm: number | null = null;
  for (const k of rainKeys) {
    const n = num(row[k]);
    if (n != null) {
      rainMm = n;
      break;
    }
  }

  let tempC: number | null = null;
  for (const k of tempKeys) {
    const n = num(row[k]);
    if (n != null) {
      tempC = n;
      break;
    }
  }

  let wmo: number | null = null;
  for (const k of wmoKeys) {
    const n = num(row[k]);
    if (n != null) {
      wmo = Math.round(n);
      break;
    }
  }

  let humidity: number | null = null;
  for (const k of humKeys) {
    const n = num(row[k]);
    if (n != null) {
      humidity = n;
      break;
    }
  }

  return { rainMm, tempC, wmo, humidity };
}

/**
 * Điểm thời tiết 0–100 (cao = thuận lợi đi chơi ngoài trời).
 */
export function weatherOutdoorScore(signals: {
  rainMm: number | null;
  tempC: number | null;
  wmo: number | null;
}): { score: number; summary: string } {
  let score = 70;
  const parts: string[] = [];

  if (signals.rainMm != null) {
    if (signals.rainMm <= 0.1) {
      score += 20;
      parts.push("không mưa hoặc rất ít mưa");
    } else if (signals.rainMm < 2) {
      score += 8;
      parts.push("mưa nhẹ");
    } else if (signals.rainMm < 10) {
      score -= 15;
      parts.push("có mưa vừa");
    } else {
      score -= 35;
      parts.push("mưa khá nhiều");
    }
  }

  if (signals.tempC != null) {
    if (signals.tempC >= 22 && signals.tempC <= 34) {
      score += 5;
      parts.push(`nhiệt độ ${signals.tempC.toFixed(0)}°C khá dễ chịu`);
    } else if (signals.tempC > 34) {
      score -= 10;
      parts.push(`trời nóng ${signals.tempC.toFixed(0)}°C`);
    } else {
      score -= 5;
      parts.push(`trời mát ${signals.tempC.toFixed(0)}°C`);
    }
  }

  if (signals.wmo != null) {
    if ([95, 96, 99].includes(signals.wmo)) {
      score -= 40;
      parts.push("có dông");
    } else if (signals.wmo >= 61) {
      score -= 20;
      parts.push("dự báo mưa");
    } else if (signals.wmo <= 3) {
      score += 5;
      parts.push("trời quang / ít mây");
    }
  }

  score = Math.max(0, Math.min(100, score));
  const summary =
    parts.length > 0
      ? parts.join(" · ")
      : "chưa có đủ chỉ số chi tiết từ API";

  return { score, summary };
}

export function parseWeatherRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((x): x is Record<string, unknown> => x && typeof x === "object");
  }
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    if (Array.isArray(o.data)) return parseWeatherRows(o.data);
    if (Array.isArray(o.results)) return parseWeatherRows(o.results);
    if (Array.isArray(o.forecasts)) return parseWeatherRows(o.forecasts);
    if (Array.isArray(o.items)) return parseWeatherRows(o.items);
  }
  return [];
}

export function extractDateKey(row: Record<string, unknown>): string | null {
  const keys = [
    "date",
    "forecast_date",
    "ngay",
    "day",
    "time",
    "valid_date",
  ];
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    if (typeof v === "string" && v.length >= 8) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

export function parseDistrictsList(payload: unknown): string[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    if (payload.length && typeof payload[0] === "object" && payload[0] !== null) {
      return parseWeatherRows(payload).map((r) => extractDistrictLabel(r));
    }
    return payload.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  }
  if (typeof payload === "object" && payload !== null) {
    const o = payload as Record<string, unknown>;
    if (Array.isArray(o.districts)) return parseDistrictsList(o.districts);
    if (Array.isArray(o.data)) return parseDistrictsList(o.data);
  }
  return [];
}

function isBackendSummary(obj: unknown): obj is BackendDailySummary {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.temp_min === "number" &&
    typeof s.temp_max === "number" &&
    typeof s.rain_total === "number"
  );
}

function isBackendWeatherRow(obj: unknown): obj is BackendWeatherSummaryRow {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.district === "string" &&
    typeof r.date === "string" &&
    isBackendSummary(r.summary)
  );
}

/** GET /api/weather — mảng { district, date, summary } */
export function parseBackendWeatherSummaries(
  payload: unknown
): BackendWeatherSummaryRow[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter(isBackendWeatherRow);
}

function isBackendDistrict(obj: unknown): obj is BackendDistrict {
  if (!obj || typeof obj !== "object") return false;
  const d = obj as Record<string, unknown>;
  return typeof d.district_id === "number" && typeof d.district_name === "string";
}

/** GET /api/districts */
export function parseBackendDistricts(payload: unknown): BackendDistrict[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter(isBackendDistrict);
}

/**
 * Chấm điểm 0–100 từ `summary` của BE (rain_total, rain_prob_avg, nhiệt độ, gió, ẩm).
 */
export function scoreFromBackendSummary(
  s: BackendDailySummary
): { score: number; summary: string } {
  let score = 62;
  const parts: string[] = [];

  if (s.rain_total <= 0.1) {
    score += 22;
    parts.push(`dự báo gần không mưa trong ngày (${s.rain_total.toFixed(1)} mm)`);
  } else if (s.rain_total < 3) {
    score += 10;
    parts.push(`mưa nhẹ (${s.rain_total.toFixed(1)} mm)`);
  } else if (s.rain_total < 10) {
    score -= 8;
    parts.push(`có mưa vừa (${s.rain_total.toFixed(1)} mm)`);
  } else {
    score -= 28;
    parts.push(`mưa nhiều (${s.rain_total.toFixed(1)} mm)`);
  }

  if (typeof s.rain_prob_avg === "number") {
    if (s.rain_prob_avg < 25) {
      score += 6;
      parts.push(`xác suất mưa trung bình thấp (${s.rain_prob_avg.toFixed(0)}%)`);
    } else if (s.rain_prob_avg > 55) {
      score -= 12;
      parts.push(`xác suất mưa cao (${s.rain_prob_avg.toFixed(0)}%)`);
    }
  }

  if (typeof s.temp_avg === "number") {
    if (s.temp_avg >= 22 && s.temp_avg <= 32) {
      score += 6;
      parts.push(`nhiệt độ trung bình ${s.temp_avg.toFixed(1)}°C phù hợp đi chơi`);
    } else if (s.temp_avg > 34) {
      score -= 8;
      parts.push(`trời khá nóng (${s.temp_avg.toFixed(1)}°C)`);
    } else if (s.temp_avg < 18) {
      score -= 5;
      parts.push(`trời mát/lạnh (${s.temp_avg.toFixed(1)}°C)`);
    }
  }

  if (typeof s.wind_max === "number") {
    if (s.wind_max > 50) {
      score -= 10;
      parts.push(`gió mạnh (tối đa ~${s.wind_max.toFixed(0)} km/h)`);
    } else if (s.wind_max > 35) {
      score -= 4;
      parts.push(`gió khá mạnh (~${s.wind_max.toFixed(0)} km/h)`);
    }
  }

  if (typeof s.humidity_avg === "number" && s.humidity_avg > 88) {
    score -= 4;
    parts.push(`độ ẩm cao (${s.humidity_avg.toFixed(0)}%)`);
  }

  score = Math.max(0, Math.min(100, score));
  const text =
    parts.length > 0
      ? parts.join(" · ")
      : "dữ liệu summary từ API";

  return { score, summary: text };
}
