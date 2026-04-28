"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  DA_NANG_SPOTS,
  CATEGORY_META,
  type TouristSpot,
  type SpotCategory,
} from "@/lib/da-nang-spots";

const DA_NANG_CENTER: [number, number] = [16.0544, 108.2022];
const DEFAULT_ZOOM = 13;

export default function DaNangMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const [selected, setSelected] = useState<TouristSpot | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SpotCategory | "all">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "loading" | "granted" | "denied"
  >("idle");
  const userMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const userCircleRef = useRef<import("leaflet").Circle | null>(null);
  const routeLayerRef = useRef<import("leaflet").Polyline | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Virtual spot from URL params (e.g. ?directTo=lat,lng&name=...)
  const searchParams = useSearchParams();
  const [pendingDirectTo, setPendingDirectTo] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);

  const filtered = DA_NANG_SPOTS.filter((s) => {
    const matchCat = activeCategory === "all" || s.category === activeCategory;
    const matchSearch =
      search.trim() === "" ||
      s.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Update marker visibility when filter changes
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const spot = DA_NANG_SPOTS.find((s) => s.id === id);
      if (!spot) return;
      const visible =
        (activeCategory === "all" || spot.category === activeCategory) &&
        (search.trim() === "" ||
          spot.name.toLowerCase().includes(search.toLowerCase()));
      const el = marker.getElement();
      if (el) {
        (el as HTMLElement).style.display = visible ? "" : "none";
      }
    });
  }, [activeCategory, search]);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      markersRef.current.clear();
    }

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center: DA_NANG_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { maxZoom: 19, subdomains: "abcd" },
      ).addTo(map);

      L.control.attribution({ position: "bottomright", prefix: "" }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // City center pulse
      const centerIcon = L.divIcon({
        html: `<div style="position:relative;width:16px;height:16px">
          <div style="position:absolute;inset:0;background:#38BDF8;border-radius:50%;border:2px solid white;animation:pulse-ring 2s ease-out infinite"></div>
        </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        className: "",
      });
      L.marker(DA_NANG_CENTER, { icon: centerIcon })
        .addTo(map)
        .bindTooltip("📍 Trung tâm Đà Nẵng", {
          direction: "top",
          className: "leaflet-tooltip-custom",
        });

      // Spot markers
      DA_NANG_SPOTS.forEach((spot) => {
        const icon = L.divIcon({
          html: `<div style="
            background:${spot.color};width:32px;height:32px;
            border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;">
            <span style="transform:rotate(45deg);font-size:14px;line-height:1">${spot.emoji}</span>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          className: "",
        });

        const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(map);
        marker.bindTooltip(spot.name, {
          direction: "top",
          offset: [0, -32],
          className: "leaflet-tooltip-custom",
        });
        marker.on("click", () => {
          setSelected(spot);
          map.flyTo([spot.lat, spot.lng], 16, { animate: true, duration: 1 });
        });

        markersRef.current.set(spot.id, marker);
      });

      leafletMapRef.current = map;
      setIsLoaded(true);
    });

    return () => {
      cancelled = true;
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
      markersRef.current.clear();
      setIsLoaded(false);
    };
  }, []);

  // Place/update the GPS marker on the map
  useEffect(() => {
    if (!userPos || !leafletMapRef.current) return;

    import("leaflet").then((L) => {
      const map = leafletMapRef.current;
      if (!map) return;

      // Remove old markers
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userCircleRef.current) {
        userCircleRef.current.remove();
        userCircleRef.current = null;
      }

      // Accuracy circle
      userCircleRef.current = L.circle([userPos.lat, userPos.lng], {
        radius: 80,
        color: "#3B82F6",
        fillColor: "#3B82F6",
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(map);

      // User marker (blue dot)
      const icon = L.divIcon({
        html: `<div style="position:relative;width:22px;height:22px">
          <div style="position:absolute;inset:0;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 0 rgba(59,130,246,0.6);animation:pulse-gps 2s ease-out infinite"></div>
        </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        className: "",
      });

      userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon })
        .addTo(map)
        .bindTooltip("📍 Vị trí của bạn", {
          direction: "top",
          className: "leaflet-tooltip-custom",
        });
    });
  }, [userPos]);

  function locateMe() {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        setGpsStatus("granted");
        setSelected(null);
        leafletMapRef.current?.flyTo([coords.lat, coords.lng], 16, {
          animate: true,
          duration: 1.2,
        });
      },
      () => {
        setGpsStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function clearRoute() {
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    setRouteInfo(null);
  }

  const getDirectionsTo = useCallback(async (
    dest: { lat: number; lng: number },
    from: { lat: number; lng: number },
  ) => {
    if (!leafletMapRef.current) return;
    setRouteLoading(true);
    clearRoute();

    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${from.lng},${from.lat};${dest.lng},${dest.lat}` +
        `?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== "Ok" || !data.routes?.[0]) return;

      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
      );

      const L = await import("leaflet");
      const map = leafletMapRef.current;
      if (!map) return;

      routeLayerRef.current = L.polyline(coords, {
        color: "#4285F4",
        weight: 5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      map.fitBounds(routeLayerRef.current.getBounds(), {
        padding: [60, 60],
        animate: true,
        duration: 1,
      });

      const distKm = (route.distance / 1000).toFixed(1);
      const durMin = Math.round(route.duration / 60);
      setRouteInfo({
        distance: `${distKm} km`,
        duration:
          durMin >= 60
            ? `${Math.floor(durMin / 60)}h ${durMin % 60} phút`
            : `${durMin} phút`,
      });
    } catch {
      // Silently fail
    } finally {
      setRouteLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-request GPS on first load
  useEffect(() => {
    locateMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read ?directTo=lat,lng&name=... from URL on mount
  useEffect(() => {
    const raw = searchParams.get("directTo");
    const name = searchParams.get("name") ?? "Điểm đến";
    if (!raw) return;
    const [latStr, lngStr] = raw.split(",");
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng)) {
      setPendingDirectTo({ lat, lng, name });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once GPS is ready AND we have a pending destination → fly + get directions
  useEffect(() => {
    if (!pendingDirectTo || !userPos || !isLoaded) return;
    const dest = pendingDirectTo;

    // Create a virtual TouristSpot-like selected state so the info card shows
    const virtualSpot = {
      id: "pending-direct",
      name: dest.name,
      description: `Điểm đến từ lịch trình`,
      lat: dest.lat,
      lng: dest.lng,
      category: "beach" as const,
      emoji: "📍",
      color: "#4285F4",
    };
    setSelected(virtualSpot);
    leafletMapRef.current?.flyTo([dest.lat, dest.lng], 15, {
      animate: true,
      duration: 1.2,
    });

    // Trigger the actual routing
    void getDirectionsTo(dest, userPos);

    // Clear the pending target so it doesn't re-fire
    setPendingDirectTo(null);
  }, [pendingDirectTo, userPos, isLoaded, getDirectionsTo]);


  // Decode Google Maps encoded polyline
  function decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let idx = 0;
    let lat = 0;
    let lng = 0;
    while (idx < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(idx++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      lat += result & 1 ? ~(result >> 1) : result >> 1;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(idx++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      lng += result & 1 ? ~(result >> 1) : result >> 1;

      points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
  }

  async function getDirections(spot: TouristSpot) {
    if (!userPos) return;
    await getDirectionsTo(spot, userPos);
  }

  function flyTo(spot: TouristSpot) {
    setSelected(spot);
    leafletMapRef.current?.flyTo([spot.lat, spot.lng], 16, {
      animate: true,
      duration: 1,
    });
  }

  function resetView() {
    setSelected(null);
    clearRoute();
    leafletMapRef.current?.flyTo(DA_NANG_CENTER, DEFAULT_ZOOM, {
      animate: true,
      duration: 1,
    });
  }

  const categories = Object.entries(CATEGORY_META) as [
    SpotCategory,
    { label: string; color: string; emoji: string },
  ][];

  return (
    <section className="relative w-full bg-slate-100 py-12 px-4 dark:bg-slate-950">
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(56,189,248,0.7); }
          70%  { box-shadow: 0 0 0 12px rgba(56,189,248,0); }
          100% { box-shadow: 0 0 0 0 rgba(56,189,248,0); }
        }
        @keyframes pulse-gps {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.6); }
          70%  { box-shadow: 0 0 0 16px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        .leaflet-tooltip-custom {
          background: rgba(255,255,255,0.96) !important;
          border: 1px solid rgba(15,23,42,0.12) !important;
          color: #0f172a !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          padding: 4px 10px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
          white-space: nowrap !important;
        }
        .leaflet-tooltip-custom::before { border-top-color: rgba(15,23,42,0.12) !important; }
        .dark .leaflet-tooltip-custom {
          background: rgba(15,23,42,0.95) !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          color: #f1f5f9 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .dark .leaflet-tooltip-custom::before { border-top-color: rgba(255,255,255,0.15) !important; }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
        .leaflet-control-zoom a {
          background: rgba(255,255,255,0.95) !important;
          color: #475569 !important;
          border-color: rgba(15,23,42,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .dark .leaflet-control-zoom { box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important; }
        .dark .leaflet-control-zoom a { background: rgba(15,23,42,0.9) !important; color: #94a3b8 !important; border-color: rgba(255,255,255,0.1) !important; }
        .dark .leaflet-control-zoom a:hover { background: rgba(30,41,59,0.95) !important; color: #f1f5f9 !important; }
        .leaflet-control-attribution { background: rgba(255,255,255,0.85) !important; color: #64748b !important; font-size: 10px !important; }
        .leaflet-control-attribution a { color: #475569 !important; }
        .dark .leaflet-control-attribution { background: rgba(15,23,42,0.7) !important; color: #64748b !important; }
        .dark .leaflet-control-attribution a { color: #94a3b8 !important; }
      `}</style>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🗺️</span>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Địa điểm du lịch Đà Nẵng
          </h2>
          <span className="ml-auto text-sm text-slate-400 dark:text-white/30">
            {DA_NANG_SPOTS.length} địa điểm
          </span>
        </div>
        <p className="ml-9 text-sm text-slate-500 dark:text-white/40">
          Khám phá địa điểm nổi bật tại Đà Nẵng
        </p>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mt-4 ml-9">
          <button
            onClick={() => setActiveCategory("all")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              activeCategory === "all"
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                : "border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
            }`}
          >
            🌏 Tất cả ({DA_NANG_SPOTS.length})
          </button>
          {categories.map(([cat, meta]) => {
            const count = DA_NANG_SPOTS.filter(
              (s) => s.category === cat,
            ).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? "border-transparent text-white"
                    : "border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
                }`}
                style={
                  activeCategory === cat
                    ? { background: meta.color, borderColor: meta.color }
                    : {}
                }
              >
                {meta.emoji} {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0 flex flex-col gap-2">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-white/30">
              🔍
            </span>
            <input
              type="text"
              placeholder="Tìm địa điểm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-white/30 dark:focus:bg-white/8"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={resetView}
              className="flex flex-1 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-left text-xs font-semibold text-sky-700 transition-all hover:bg-sky-100 dark:border-sky-500/25 dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/25"
            >
              <span>📍</span> Trung tâm
            </button>
            <button
              onClick={locateMe}
              disabled={gpsStatus === "loading"}
              className={`flex-1 text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${
                gpsStatus === "granted"
                  ? "bg-blue-500/20 border-blue-500/30 text-blue-300"
                  : gpsStatus === "denied"
                    ? "bg-red-500/15 border-red-500/25 text-red-300"
                    : "bg-emerald-500/15 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25"
              }`}
            >
              {gpsStatus === "loading" ? (
                <>
                  <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  Đang tìm...
                </>
              ) : gpsStatus === "denied" ? (
                <>
                  <span>⚠️</span> Bị từ chối
                </>
              ) : (
                <>
                  <span>🧭</span> Vị trí tôi
                </>
              )}
            </button>
          </div>

          {/* Spot list */}
          <div className="flex flex-col gap-1.5 max-h-[460px] overflow-y-auto pr-0.5">
            {filtered.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400 dark:text-white/30">
                Không tìm thấy địa điểm
              </p>
            )}
            {filtered.map((spot) => (
              <button
                key={spot.id}
                onClick={() => flyTo(spot)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
                  selected?.id === spot.id
                    ? "scale-[1.01] border-sky-300 bg-sky-50 dark:border-white/30 dark:bg-white/12"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-white/8 dark:bg-white/4 dark:hover:border-white/20 dark:hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base shrink-0">{spot.emoji}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold leading-tight text-slate-800 dark:text-white">
                      {spot.name}
                    </p>
                    <span
                      className="text-[10px] font-medium mt-0.5 inline-block"
                      style={{ color: spot.color }}
                    >
                      {CATEGORY_META[spot.category].label}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div
          className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200 shadow-xl dark:border-white/10 dark:shadow-2xl"
          style={{ height: 580 }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-slate-900">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                <p className="text-sm text-slate-500 dark:text-white/50">Đang tải bản đồ...</p>
              </div>
            </div>
          )}

          <div ref={mapRef} className="w-full h-full" />

          {/* Info card */}
          {selected && (
            <div className="absolute bottom-4 left-4 right-16 z-500">
              <div className="rounded-xl border border-slate-200/90 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/92">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-xl">
                    {selected.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {selected.name}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-white/55">
                      {selected.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: selected.color + "25",
                          color: selected.color,
                        }}
                      >
                        {CATEGORY_META[selected.category].emoji}{" "}
                        {CATEGORY_META[selected.category].label}
                      </span>

                      {/* Route info */}
                      {routeInfo && (
                        <>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                            🚗 {routeInfo.distance}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                            ⏱ {routeInfo.duration}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Direction button */}
                  {userPos && (
                    <button
                      onClick={() => getDirections(selected)}
                      disabled={routeLoading}
                      className="shrink-0 mt-0.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      {routeLoading ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </>
                      ) : (
                        <>🧭 Chỉ đường</>
                      )}
                    </button>
                  )}
                </div>

                {/* Clear route */}
                {routeInfo && (
                  <button
                    onClick={clearRoute}
                    className="mt-2 text-[10px] text-slate-400 transition-colors hover:text-slate-600 dark:text-white/40 dark:hover:text-white/70"
                  >
                    ✕ Xóa đường đi
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
