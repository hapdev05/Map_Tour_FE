export interface WeatherInfo {
  vi: string;
  icon: string;
  gradient: string;
  textColor: string;
}

export const WMO_CODES: Record<number, WeatherInfo> = {
  0: { vi: "Trời quang", icon: "☀️", gradient: "from-amber-400 to-orange-500", textColor: "text-amber-300" },
  1: { vi: "Ít mây", icon: "🌤️", gradient: "from-amber-300 to-sky-400", textColor: "text-amber-200" },
  2: { vi: "Có mây", icon: "⛅", gradient: "from-sky-400 to-slate-500", textColor: "text-sky-300" },
  3: { vi: "Nhiều mây", icon: "☁️", gradient: "from-slate-400 to-slate-600", textColor: "text-slate-300" },
  45: { vi: "Sương mù", icon: "🌫️", gradient: "from-slate-500 to-slate-700", textColor: "text-slate-300" },
  48: { vi: "Sương đá", icon: "🌫️", gradient: "from-slate-500 to-slate-700", textColor: "text-slate-300" },
  51: { vi: "Mưa phùn", icon: "🌦️", gradient: "from-sky-500 to-blue-600", textColor: "text-sky-300" },
  53: { vi: "Mưa phùn", icon: "🌦️", gradient: "from-sky-500 to-blue-600", textColor: "text-sky-300" },
  55: { vi: "Mưa phùn dày", icon: "🌧️", gradient: "from-blue-500 to-blue-700", textColor: "text-blue-300" },
  61: { vi: "Mưa nhẹ", icon: "🌧️", gradient: "from-blue-500 to-indigo-600", textColor: "text-blue-300" },
  63: { vi: "Mưa vừa", icon: "🌧️", gradient: "from-blue-600 to-indigo-700", textColor: "text-blue-200" },
  65: { vi: "Mưa to", icon: "🌧️", gradient: "from-indigo-600 to-slate-800", textColor: "text-indigo-300" },
  80: { vi: "Mưa rào nhẹ", icon: "🌦️", gradient: "from-sky-500 to-blue-600", textColor: "text-sky-300" },
  81: { vi: "Mưa rào", icon: "🌧️", gradient: "from-blue-600 to-indigo-700", textColor: "text-blue-300" },
  82: { vi: "Mưa rào lớn", icon: "⛈️", gradient: "from-indigo-700 to-slate-800", textColor: "text-indigo-200" },
  95: { vi: "Dông", icon: "⛈️", gradient: "from-slate-700 to-slate-900", textColor: "text-slate-200" },
  96: { vi: "Dông mưa đá", icon: "⛈️", gradient: "from-slate-800 to-slate-950", textColor: "text-slate-200" },
  99: { vi: "Dông mưa đá lớn", icon: "⛈️", gradient: "from-slate-900 to-black", textColor: "text-slate-100" },
};

export function getWeatherInfo(code: number): WeatherInfo {
  return WMO_CODES[code] ?? WMO_CODES[0];
}

export function getWindDirection(degrees: number): string {
  const dirs = ["B", "ĐB", "Đ", "ĐN", "N", "TN", "T", "TB"];
  return dirs[Math.round(degrees / 45) % 8];
}

export function getUVLevel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: "Thấp", color: "text-green-400" };
  if (uv <= 5) return { label: "Trung bình", color: "text-yellow-400" };
  if (uv <= 7) return { label: "Cao", color: "text-orange-400" };
  if (uv <= 10) return { label: "Rất cao", color: "text-red-400" };
  return { label: "Cực cao", color: "text-purple-400" };
}
