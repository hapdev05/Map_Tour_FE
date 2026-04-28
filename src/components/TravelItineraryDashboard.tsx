"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  distanceKm,
  parseBackendDistricts,
  parseBackendWeatherSummaries,
  scoreFromBackendSummary,
} from "@/lib/itinerary-scoring";
import { DA_NANG_DEFAULT } from "@/lib/district-coords";
import type { BackendHourlyPoint } from "@/types/travel-backend";
import {
  generateItineraryOptions,
  hourLabel,
  type ItineraryOption,
  type ItineraryStop,
} from "@/lib/itinerary-generator";
import { scoreLabel, scoreBgClass } from "@/lib/time-slot-weather";

const PROXY = (path: string) => `/api/travel-proxy/${path}`;

/* ─── Component ──────────────────────────────────────────────── */

export default function TravelItineraryDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawWeather, setRawWeather] = useState<unknown>(null);
  const [rawDistricts, setRawDistricts] = useState<unknown>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [dateFilter, setDateFilter] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [hourlyAll, setHourlyAll] = useState<Record<string, BackendHourlyPoint[]>>({});
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, dRes] = await Promise.all([
        fetch(PROXY("api/weather")),
        fetch(PROXY("api/districts")),
      ]);
      if (!wRes.ok) {
        const t = await wRes.text();
        throw new Error(`GET /api/weather: ${wRes.status} ${t.slice(0, 160)}`);
      }
      if (!dRes.ok) {
        const t = await dRes.text();
        throw new Error(`GET /api/districts: ${dRes.status} ${t.slice(0, 160)}`);
      }
      setRawWeather(await wRes.json());
      setRawDistricts(await dRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* GPS */
  function requestGps() {
    if (!navigator.geolocation) { setGpsStatus("denied"); return; }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => { setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsStatus("granted"); },
      () => setGpsStatus("denied"),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  useEffect(() => { requestGps(); }, []);

  /* ── Parsed data ── */
  const districts = useMemo(() => parseBackendDistricts(rawDistricts), [rawDistricts]);
  const weatherSummaries = useMemo(() => parseBackendWeatherSummaries(rawWeather), [rawWeather]);

  const summaryMap = useMemo(() => {
    const m = new Map<string, (typeof weatherSummaries)[0]>();
    for (const row of weatherSummaries) m.set(`${row.district}|${row.date.slice(0, 10)}`, row);
    return m;
  }, [weatherSummaries]);

  const availableDates = useMemo(() => {
    const s = new Set<string>();
    weatherSummaries.forEach((r) => s.add(r.date.slice(0, 10)));
    return [...s].sort();
  }, [weatherSummaries]);

  const orderedDistricts = useMemo(() => {
    if (districts.length > 0) return [...districts].sort((a, b) => a.district_id - b.district_id);
    return Array.from(new Set(weatherSummaries.map((w) => w.district))).map((name, i) => ({
      district_id: i + 1, district_name: name,
    }));
  }, [districts, weatherSummaries]);

  /* ── Auto-fetch hourly ── */
  useEffect(() => {
    if (!orderedDistricts.length) return;
    let cancelled = false;
    setHourlyLoading(true);

    const BATCH = 8;
    async function fetchAll() {
      const results: Record<string, BackendHourlyPoint[]> = {};
      for (let i = 0; i < orderedDistricts.length; i += BATCH) {
        const batch = orderedDistricts.slice(i, i + BATCH);
        const responses = await Promise.all(
          batch.map(async (d) => {
            try {
              const path = `api/weather/${encodeURIComponent(d.district_name)}/${encodeURIComponent(dateFilter)}`;
              const res = await fetch(PROXY(path));
              const data = await res.json();
              return { key: d.district_name, hourly: Array.isArray(data?.hourly) ? (data.hourly as BackendHourlyPoint[]) : [] };
            } catch { return { key: d.district_name, hourly: [] as BackendHourlyPoint[] }; }
          })
        );
        for (const r of responses) results[r.key] = r.hourly;
      }
      if (!cancelled) { setHourlyAll(results); setHourlyLoading(false); }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [orderedDistricts, dateFilter]);

  /* ── Overall weather scores for fallback ── */
  const overallScores = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of orderedDistricts) {
      const row = summaryMap.get(`${d.district_name}|${dateFilter}`);
      m[d.district_name] = row ? scoreFromBackendSummary(row.summary).score : 55;
    }
    return m;
  }, [orderedDistricts, summaryMap, dateFilter]);

  /* ── Generate options ── */
  const options: ItineraryOption[] = useMemo(() => {
    if (!orderedDistricts.length) return [];
    const origin = userPos ?? DA_NANG_DEFAULT;
    const keys = orderedDistricts.map((d) => d.district_name);
    return generateItineraryOptions(keys, hourlyAll, origin, overallScores);
  }, [orderedDistricts, hourlyAll, userPos, overallScores]);

  /* Auto-expand the first option */
  useEffect(() => {
    if (options.length > 0 && expandedOption === null) {
      setExpandedOption(options[0].id);
    }
  }, [options, expandedOption]);

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold md:text-2xl">Lịch trình gợi ý</h1>
            <p className="text-xs text-slate-500 dark:text-white/50">
              Tự động xếp lịch theo thời tiết & khoảng cách — chọn 1 option phù hợp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
            >
              ← Bản đồ
            </Link>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
            >
              {loading ? "Đang tải…" : "Làm mới"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* Date picker */}
        <section className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-xs text-slate-500 dark:text-white/50">Ngày tham quan</label>
            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setExpandedOption(null); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-500/50 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value={dateFilter}>{dateFilter}</option>
              {availableDates.filter((d) => d !== dateFilter).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {gpsStatus !== "granted" && (
            <button onClick={requestGps} disabled={gpsStatus === "loading"} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              {gpsStatus === "loading" ? "Đang lấy GPS…" : "📍 Bật GPS"}
            </button>
          )}
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <strong>Lỗi:</strong> {error}
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-12 h-12 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-white/50">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Hourly loading indicator */}
        {!loading && hourlyLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            Đang tải dữ liệu theo giờ để tối ưu lịch trình…
          </div>
        )}

        {/* Options */}
        {!loading && !error && options.length > 0 && (
          <div className="space-y-5">
            {options.map((opt) => {
              const isExpanded = expandedOption === opt.id;
              const sl = scoreLabel(opt.avgScore);
              return (
                <section key={opt.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                  {/* Option header — always visible */}
                  <button
                    type="button"
                    onClick={() => setExpandedOption(isExpanded ? null : opt.id)}
                    className="w-full text-left p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-3xl">{opt.themeEmoji}</span>
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold truncate">{opt.title}</h2>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {opt.themeTags.map((t) => (
                            <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-white/5 dark:text-white/40">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center">
                        <span className={`block text-2xl font-black ${sl.colorClass}`}>{opt.avgScore}</span>
                        <span className="text-[10px] text-slate-400 dark:text-white/40">điểm</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-lg font-bold">{opt.stops.length}</span>
                        <span className="text-[10px] text-slate-400 dark:text-white/40">điểm dừng</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-lg font-bold">{hourLabel(opt.stops[0]?.startHour ?? 6.5)}</span>
                        <span className="text-[10px] text-slate-400 dark:text-white/40">→ {hourLabel(opt.endsAt)}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-lg font-bold">{opt.totalDistanceKm.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400 dark:text-white/40">km</span>
                      </div>
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 transition-colors">
                        {isExpanded ? "Thu gọn ▲" : "Xem thêm ▼"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded timeline */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-white/5">
                      {/* Overall score banner */}
                      <div className={`mx-5 mt-5 md:mx-6 rounded-xl border p-4 ${scoreBgClass(opt.avgScore)}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">Đánh giá thời tiết tổng</p>
                            <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                              {opt.avgScore >= 75
                                ? "Thời tiết thuận lợi cho hầu hết các hoạt động ngoài trời"
                                : opt.avgScore >= 55
                                  ? "Thời tiết tạm ổn — mang ô phòng mưa"
                                  : "Thời tiết không lý tưởng — cân nhắc hoạt động trong nhà"}
                            </p>
                          </div>
                          <span className={`text-3xl font-black ${sl.colorClass}`}>{opt.avgScore}<span className="text-sm font-normal text-slate-400">/100</span></span>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="p-5 md:p-6 space-y-0">
                        {opt.stops.map((stop, i) => (
                          <StopCard key={stop.districtKey} stop={stop} index={i} isLast={i === opt.stops.length - 1} hourly={hourlyAll[stop.districtKey] ?? []} />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {!loading && !error && options.length === 0 && (
          <p className="py-12 text-center text-slate-500 dark:text-white/50">
            Không có dữ liệu districts / weather.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Stop Card ──────────────────────────────────────────────── */

function StopCard({ stop, index, isLast, hourly }: { stop: ItineraryStop; index: number; isLast: boolean; hourly: BackendHourlyPoint[] }) {
  const sl = scoreLabel(stop.weather.score);
  const [showHourly, setShowHourly] = useState(false);

  return (
    <div className="relative">
      {/* Travel connector */}
      {stop.travelMinFromPrev > 0 && (
        <div className="flex items-center gap-3 py-2 pl-9">
          <div className="w-0.5 h-5 bg-slate-200 dark:bg-white/10 ml-[3px]" />
          <span className="text-[11px] text-slate-400 dark:text-white/35 italic">
            🚗 ~{stop.travelMinFromPrev} phút di chuyển ({stop.distanceKm.toFixed(1)} km)
          </span>
        </div>
      )}

      <div className="flex gap-4">
        {/* Timeline dot + line */}
        <div className="flex flex-col items-center pt-1">
          <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
            stop.weather.score >= 70
              ? "border-emerald-500 bg-emerald-500"
              : stop.weather.score >= 50
                ? "border-amber-500 bg-amber-500"
                : "border-red-400 bg-red-400"
          }`} />
          {!isLast && (
            <div className="w-0.5 flex-1 bg-slate-200 dark:bg-white/10 mt-1" />
          )}
        </div>

        {/* Card content */}
        <div className={`flex-1 rounded-xl border p-4 mb-3 transition-all ${
          stop.weather.score >= 70
            ? "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
            : stop.weather.score >= 50
              ? "border-amber-200 bg-amber-50/50 dark:border-amber-500/15 dark:bg-amber-500/5"
              : "border-red-200 bg-red-50/50 dark:border-red-500/15 dark:bg-red-500/5"
        }`}>
          {/* Time + Name */}
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-mono font-bold text-slate-700 dark:bg-white/10 dark:text-white/80">
                {hourLabel(stop.startHour)} – {hourLabel(stop.endHour)}
              </span>
              <span className="text-lg">{stop.emoji}</span>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{stop.displayName}</h3>
                <span className="text-[10px] text-slate-400 dark:text-white/40">{stop.categoryLabel} · {stop.durationH >= 1 ? `${Math.round(stop.durationH * 10) / 10}h` : `${Math.round(stop.durationH * 60)} phút`}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-lg font-black ${sl.colorClass}`}>{stop.weather.score}</span>
              <p className={`text-[10px] ${sl.colorClass}`}>{sl.text}</p>
            </div>
          </div>

          {/* Weather chips */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {stop.weather.tempC != null && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                🌡 {stop.weather.tempC.toFixed(1)}°C
              </span>
            )}
            {stop.weather.rainMm != null && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                stop.weather.rainMm > 2
                  ? "bg-blue-200 text-blue-900 dark:bg-blue-500/25 dark:text-blue-200"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200"
              }`}>
                🌧 {stop.weather.rainMm.toFixed(1)} mm
              </span>
            )}
            {stop.weather.rainProb != null && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                stop.weather.rainProb > 50
                  ? "bg-violet-200 text-violet-900 dark:bg-violet-500/25 dark:text-violet-200"
                  : "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200"
              }`}>
                ☔ {stop.weather.rainProb.toFixed(0)}%
              </span>
            )}
            {stop.weather.windKph != null && stop.weather.windKph > 15 && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] text-teal-800 dark:bg-teal-500/15 dark:text-teal-200">
                💨 {stop.weather.windKph.toFixed(0)} km/h
              </span>
            )}
            {stop.weather.description && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-white/5 dark:text-white/50">
                {stop.weather.description}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setShowHourly(!showHourly)}
              className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-slate-200 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
            >
              {showHourly ? "▲ Ẩn theo giờ" : "▼ Theo giờ"}
            </button>
            <Link
              href={`/?directTo=${stop.lat},${stop.lng}&name=${encodeURIComponent(stop.displayName)}`}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25"
            >
              🧭 Chỉ đường
            </Link>
          </div>

          {/* Hourly weather table */}
          {showHourly && (
            <div className="mt-3 max-h-56 overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-slate-100 text-slate-500 dark:bg-slate-900/95 dark:text-white/50">
                  <tr>
                    <th className="p-2">Giờ</th>
                    <th className="p-2">°C</th>
                    <th className="p-2">Ẩm %</th>
                    <th className="p-2">Mưa mm</th>
                    <th className="p-2">P mưa</th>
                    <th className="p-2">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {hourly.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-3 text-slate-400 dark:text-white/40">
                        Không có dữ liệu hourly.
                      </td>
                    </tr>
                  )}
                  {hourly.map((h) => (
                    <tr
                      key={h.hour}
                      className={`border-t border-slate-100 dark:border-white/5 ${
                        h.hour >= Math.floor(stop.startHour) && h.hour < Math.ceil(stop.endHour)
                          ? "bg-sky-50/50 dark:bg-sky-500/5"
                          : ""
                      }`}
                    >
                      <td className="p-2 font-mono">
                        {h.hour}h
                        {h.hour >= Math.floor(stop.startHour) && h.hour < Math.ceil(stop.endHour) && (
                          <span className="ml-1 text-[9px] text-sky-500">●</span>
                        )}
                      </td>
                      <td className="p-2">{h.temperature_c?.toFixed(1)}</td>
                      <td className="p-2">{h.humidity_percent?.toFixed(0)}</td>
                      <td className="p-2">{h.rain_mm?.toFixed(2)}</td>
                      <td className="p-2">{h.rain_probability?.toFixed(0)}%</td>
                      <td className="p-2 text-slate-600 dark:text-white/70">{h.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
