"use client";

import { useEffect, useRef, useState } from "react";
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
    if (!userPos || !leafletMapRef.current) return;
    setRouteLoading(true);
    clearRoute();

    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${userPos.lng},${userPos.lat};${spot.lng},${spot.lat}` +
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
    <section className="relative w-full bg-slate-950 py-12 px-4">
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
          background: rgba(15,23,42,0.95) !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          color: #f1f5f9 !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          padding: 4px 10px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
          white-space: nowrap !important;
        }
        .leaflet-tooltip-custom::before { border-top-color: rgba(255,255,255,0.15) !important; }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important; }
        .leaflet-control-zoom a { background: rgba(15,23,42,0.9) !important; color: #94a3b8 !important; border-color: rgba(255,255,255,0.1) !important; }
        .leaflet-control-zoom a:hover { background: rgba(30,41,59,0.95) !important; color: #f1f5f9 !important; }
        .leaflet-control-attribution { background: rgba(15,23,42,0.7) !important; color: #64748b !important; font-size: 10px !important; }
        .leaflet-control-attribution a { color: #94a3b8 !important; }
      `}</style>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🗺️</span>
          <h2 className="text-3xl font-bold text-white">
            Địa điểm du lịch Đà Nẵng
          </h2>
          <span className="ml-auto text-white/30 text-sm">
            {DA_NANG_SPOTS.length} địa điểm
          </span>
        </div>
        <p className="text-white/40 text-sm ml-9">
          Khám phá địa điểm nổi bật tại Đà Nẵng
        </p>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mt-4 ml-9">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              activeCategory === "all"
                ? "bg-white text-slate-900 border-white"
                : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  activeCategory === cat
                    ? "border-transparent text-white"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Tìm địa điểm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:border-sky-500/50 focus:bg-white/8 transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={resetView}
              className="flex-1 text-left px-3 py-2.5 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-300 text-xs font-semibold hover:bg-sky-500/25 transition-all flex items-center gap-2"
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

          {/* GPS info */}
          {userPos && gpsStatus === "granted" && (
            <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-300 text-[10px] font-medium">
                📍 {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
              </p>
            </div>
          )}

          {/* Spot list */}
          <div className="flex flex-col gap-1.5 max-h-[460px] overflow-y-auto pr-0.5">
            {filtered.length === 0 && (
              <p className="text-white/30 text-xs text-center py-6">
                Không tìm thấy địa điểm
              </p>
            )}
            {filtered.map((spot) => (
              <button
                key={spot.id}
                onClick={() => flyTo(spot)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                  selected?.id === spot.id
                    ? "bg-white/12 border-white/30 scale-[1.01]"
                    : "bg-white/4 border-white/8 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base shrink-0">{spot.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate leading-tight">
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
          className="relative flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          style={{ height: 580 }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-white/50 text-sm">Đang tải bản đồ...</p>
              </div>
            </div>
          )}

          <div ref={mapRef} className="w-full h-full" />

          {/* Info card */}
          {selected && (
            <div className="absolute bottom-4 left-4 right-16 z-500">
              <div
                className="rounded-xl px-4 py-3 border border-white/10 backdrop-blur-md shadow-2xl"
                style={{ background: "rgba(15,23,42,0.92)" }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5 shrink-0">
                    {selected.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm">
                      {selected.name}
                    </p>
                    <p className="text-white/55 text-xs mt-0.5 leading-relaxed">
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
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                            🚗 {routeInfo.distance}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
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
                    className="mt-2 text-[10px] text-white/40 hover:text-white/70 transition-colors"
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
