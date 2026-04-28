import { DA_NANG_SPOTS } from "@/lib/da-nang-spots";

/** Chuẩn hóa tên để so khớp */
export function normalizeDistrictKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Tọa độ mặc định trung tâm Đà Nẵng */
export const DA_NANG_DEFAULT: { lat: number; lng: number } = {
  lat: 16.0544,
  lng: 108.2022,
};

/**
 * Ghép tên quận/huyện/điểm từ API với danh sách địa điểm map (tên tiếng Việt).
 */
export function resolveDistrictCoords(name: string): { lat: number; lng: number } {
  const key = normalizeDistrictKey(name);
  if (!key) return DA_NANG_DEFAULT;

  for (const spot of DA_NANG_SPOTS) {
    const nk = normalizeDistrictKey(spot.name);
    if (key.includes(nk) || nk.includes(key)) {
      return { lat: spot.lat, lng: spot.lng };
    }
  }

  const tokens = key.split(/\s+/).filter((t) => t.length > 2);
  for (const spot of DA_NANG_SPOTS) {
    const nk = normalizeDistrictKey(spot.name);
    if (tokens.some((t) => nk.includes(t) || t.includes(nk))) {
      return { lat: spot.lat, lng: spot.lng };
    }
  }

  return DA_NANG_DEFAULT;
}
