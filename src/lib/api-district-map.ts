import { DA_NANG_SPOTS, type TouristSpot } from "@/lib/da-nang-spots";

/**
 * Khóa `district_name` / `district` từ BE (Pascal_Snake) → `id` trong DA_NANG_SPOTS.
 * Đồng bộ với 53 bản ghi GET /api/districts.
 */
export const API_DISTRICT_TO_SPOT_ID: Record<string, string> = {
  "29_3_Park": "park_293",
  Ancient_Banyan_Tree: "banyan_tree",
  APEC_Park: "apec_park",
  Asia_Park: "asia_park",
  Ba_Na_Hills: "bana",
  Bac_My_An_Market: "bac_my_an",
  Bach_Dang_Flower_Street: "bach_dang_flower",
  Bach_Dang_Walking_Street: "bach_dang_walk",
  Bai_But: "bai_but",
  Bai_Rang: "bai_rang",
  Ban_Co_Peak: "ban_co",
  Carp_Dragon_Statue: "carp_dragon",
  Cau_Vang: "cau_vang",
  Cham_Museum: "cham_museum",
  Con_Market: "con_market",
  Da_Nang_Cathedral: "cathedral",
  Da_Nang_Downtown: "downtown",
  Da_Nang_Museum: "da_nang_museum",
  Dien_Hai_Citadel: "dien_hai",
  Dragon_Bridge: "dragon_bridge",
  East_Sea_Park: "east_sea_park",
  Fantasy_Park: "fantasy_park",
  Ghenh_Bang: "ghenh_bang",
  Hai_Van_Pass: "hai_van",
  Han_Market: "han_market",
  Han_River_Bridge: "han_bridge",
  Han_River_Marina: "han_marina",
  Helio_Center: "helio_center",
  Helio_Night_Market: "helio_night",
  Ho_Xanh: "ho_xanh",
  Linh_Ung_Pagoda: "linh_ung",
  Lotte_Mart: "lotte",
  Love_Bridge: "love_bridge",
  Mikazuki_Water_Park: "mikazuki",
  Mom_Nghe: "mom_nghe",
  My_Khe_Beach: "my_khe",
  Nam_O: "nam_o",
  Nam_O_Reef: "nam_o_reef",
  Ngu_Hanh_Son: "ngu_hanh_son",
  Nguyen_Van_Troi_Bridge: "nvt_bridge",
  Non_Nuoc_Beach: "non_nuoc",
  Non_Nuoc_Stone_Village: "non_nuoc_stone",
  Obama_Rock: "obama_rock",
  Pham_Van_Dong_Beach: "pvd_beach",
  Son_Tra_Marina: "son_tra_marina",
  Son_Tra_Night_Market: "son_tra_night",
  Son_Tra_Peninsula: "son_tra",
  Sun_Wheel: "sun_wheel",
  Thac_Gian_Lake: "thac_gian",
  Than_Tai_Hot_Spring: "than_tai",
  Thanh_Binh_Beach: "thanh_binh",
  Vincom_Plaza: "vincom",
  Xuan_Thieu_Beach: "xuan_thieu",
};

export function getSpotByApiDistrict(apiDistrictKey: string): TouristSpot | undefined {
  const spotId = API_DISTRICT_TO_SPOT_ID[apiDistrictKey];
  if (!spotId) return undefined;
  return DA_NANG_SPOTS.find((s) => s.id === spotId);
}

export function resolveCoordsFromApiDistrict(apiDistrictKey: string): {
  lat: number;
  lng: number;
} {
  const spot = getSpotByApiDistrict(apiDistrictKey);
  if (spot) return { lat: spot.lat, lng: spot.lng };
  return { lat: 16.0544, lng: 108.2022 };
}

/** Tên hiển thị: ưu tiên tên tiếng Việt từ map địa điểm */
export function displayNameForApiDistrict(apiDistrictKey: string): string {
  return getSpotByApiDistrict(apiDistrictKey)?.name ?? apiDistrictKey.replace(/_/g, " ");
}
