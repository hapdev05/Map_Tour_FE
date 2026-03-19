export type SpotCategory =
  | "beach"
  | "nature"
  | "bridge"
  | "culture"
  | "temple"
  | "entertainment"
  | "market"
  | "landmark";

export interface TouristSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: SpotCategory;
  description: string;
  color: string;
  emoji: string;
}

export const CATEGORY_META: Record<
  SpotCategory,
  { label: string; color: string; emoji: string }
> = {
  beach:         { label: "Bãi biển",   color: "#0EA5E9", emoji: "🏖️" },
  nature:        { label: "Thiên nhiên", color: "#10B981", emoji: "🌿" },
  bridge:        { label: "Cầu",         color: "#F59E0B", emoji: "🌉" },
  culture:       { label: "Văn hóa",    color: "#8B5CF6", emoji: "🏛️" },
  temple:        { label: "Chùa",        color: "#EC4899", emoji: "🛕" },
  entertainment: { label: "Giải trí",   color: "#F97316", emoji: "🎡" },
  market:        { label: "Chợ & Mua sắm", color: "#EF4444", emoji: "🛍️" },
  landmark:      { label: "Điểm nổi bật", color: "#A78BFA", emoji: "📍" },
};

export const DA_NANG_SPOTS: TouristSpot[] = [
  // ── BEACH ──────────────────────────────────────────────────────
  { id: "my_khe",         name: "Bãi biển Mỹ Khê",          lat: 16.0678, lng: 108.2452, category: "beach",         description: "Một trong những bãi biển đẹp nhất hành tinh",         color: "#0EA5E9", emoji: "🏖️" },
  { id: "non_nuoc",       name: "Biển Non Nước",             lat: 16.0009, lng: 108.2687, category: "beach",         description: "Bãi biển hoang sơ cạnh Ngũ Hành Sơn",                color: "#0EA5E9", emoji: "🏖️" },
  { id: "xuan_thieu",     name: "Bãi biển Xuân Thiều",       lat: 16.1019, lng: 108.1701, category: "beach",         description: "Bãi biển yên tĩnh phía tây bắc thành phố",           color: "#0EA5E9", emoji: "🏖️" },
  { id: "pvd_beach",      name: "Bãi tắm Phạm Văn Đồng",    lat: 16.0745, lng: 108.2462, category: "beach",         description: "Bãi biển đô thị sầm uất trung tâm",                  color: "#0EA5E9", emoji: "🏖️" },
  { id: "thanh_binh",     name: "Bãi biển Thanh Bình",       lat: 16.0821, lng: 108.2104, category: "beach",         description: "Bãi biển bình yên phía bắc sông Hàn",                color: "#0EA5E9", emoji: "🏖️" },
  { id: "obama_rock",     name: "Bãi đá Obama",              lat: 16.1134, lng: 108.2861, category: "beach",         description: "Bãi đá nổi tiếng trên bán đảo Sơn Trà",              color: "#0EA5E9", emoji: "🪨" },
  { id: "east_sea_park",  name: "Công viên biển Đông",       lat: 16.0728, lng: 108.2457, category: "beach",         description: "Công viên ven biển, tổ chức lễ hội pháo hoa",         color: "#0EA5E9", emoji: "🌊" },
  { id: "bai_but",        name: "Bãi Bụt",                   lat: 16.1117, lng: 108.2890, category: "beach",         description: "Bãi biển hoang sơ đẹp trên bán đảo Sơn Trà",         color: "#0EA5E9", emoji: "🏝️" },
  { id: "bai_rang",       name: "Bãi Rạng",                  lat: 16.1096, lng: 108.2821, category: "beach",         description: "Bãi biển nhỏ xinh trong lành ít người biết",          color: "#0EA5E9", emoji: "🏝️" },

  // ── NATURE ─────────────────────────────────────────────────────
  { id: "bana",           name: "Bà Nà Hills",               lat: 15.9950, lng: 107.9967, category: "nature",        description: "Khu nghỉ dưỡng núi cao 1487m, khí hậu mát mẻ",       color: "#10B981", emoji: "⛰️" },
  { id: "than_tai",       name: "Suối khoáng nóng Núi Thần Tài", lat: 15.9704, lng: 107.9792, category: "nature",  description: "Khu du lịch suối khoáng nóng thiên nhiên",            color: "#10B981", emoji: "♨️" },
  { id: "hai_van",        name: "Đèo Hải Vân",               lat: 16.1856, lng: 108.1326, category: "nature",        description: "Đèo biển hùng vĩ, tầm nhìn ngoạn mục ra biển",       color: "#10B981", emoji: "🌄" },
  { id: "son_tra",        name: "Bán đảo Sơn Trà",           lat: 16.1214, lng: 108.2920, category: "nature",        description: "Khu bảo tồn thiên nhiên, nơi voọc chà vá sinh sống", color: "#10B981", emoji: "🌿" },
  { id: "ban_co",         name: "Đỉnh Bàn Cờ",              lat: 16.1297, lng: 108.2965, category: "nature",        description: "Đỉnh cao nhất Sơn Trà, view 360° cực đỉnh",          color: "#10B981", emoji: "🏔️" },
  { id: "ho_xanh",        name: "Hồ Xanh",                   lat: 16.1084, lng: 108.2738, category: "nature",        description: "Hồ nước xanh ngắt giữa rừng Sơn Trà",               color: "#10B981", emoji: "💚" },
  { id: "nam_o_reef",     name: "Rạn Nam Ô",                 lat: 16.1283, lng: 108.1147, category: "nature",        description: "Rạn san hô tự nhiên đẹp phía bắc thành phố",         color: "#10B981", emoji: "🐠" },
  { id: "nam_o",          name: "Nam Ô",                     lat: 16.1280, lng: 108.1140, category: "nature",        description: "Làng chài cổ nghề làm nước mắm truyền thống",        color: "#10B981", emoji: "🎣" },
  { id: "ghenh_bang",     name: "Ghềnh Bàng",                lat: 16.1190, lng: 108.2873, category: "nature",        description: "Bãi đá ghềnh đẹp như tranh vẽ Sơn Trà",              color: "#10B981", emoji: "🌊" },
  { id: "banyan_tree",    name: "Cây đa nghìn năm",          lat: 16.1188, lng: 108.2867, category: "nature",        description: "Cây đa cổ thụ hàng nghìn năm tuổi Sơn Trà",          color: "#10B981", emoji: "🌳" },
  { id: "mom_nghe",       name: "Mỏm Nghê",                  lat: 16.1345, lng: 108.3015, category: "nature",        description: "Mỏm đá nhô ra biển, cảnh quan hùng vĩ",              color: "#10B981", emoji: "🪨" },
  { id: "thac_gian",      name: "Hồ Thạc Gián",              lat: 16.0615, lng: 108.1995, category: "nature",        description: "Hồ điều tiết nước đô thị, công viên xanh mát",       color: "#10B981", emoji: "🏞️" },
  { id: "park_293",       name: "Công viên 29/3",            lat: 16.0548, lng: 108.2083, category: "nature",        description: "Công viên lớn nhất Đà Nẵng với nhiều cây xanh",      color: "#10B981", emoji: "🌳" },

  // ── BRIDGE ─────────────────────────────────────────────────────
  { id: "cau_vang",       name: "Cầu Vàng",                  lat: 15.9983, lng: 107.9969, category: "bridge",        description: "Cây cầu bàn tay khổng lồ nổi tiếng thế giới",        color: "#F59E0B", emoji: "🌉" },
  { id: "dragon_bridge",  name: "Cầu Rồng",                  lat: 16.0617, lng: 108.2271, category: "bridge",        description: "Cầu hình rồng phun lửa biểu tượng Đà Nẵng",          color: "#F59E0B", emoji: "🐉" },
  { id: "han_bridge",     name: "Cầu Sông Hàn",              lat: 16.0720, lng: 108.2245, category: "bridge",        description: "Cầu quay đầu tiên ở Việt Nam",                        color: "#F59E0B", emoji: "🌉" },
  { id: "love_bridge",    name: "Cầu Tình Yêu",              lat: 16.0671, lng: 108.2287, category: "bridge",        description: "Cầu đi bộ lãng mạn dành cho các cặp đôi",            color: "#F59E0B", emoji: "💛" },
  { id: "nvt_bridge",     name: "Cầu Nguyễn Văn Trỗi",      lat: 16.0519, lng: 108.2302, category: "bridge",        description: "Cầu lịch sử, nay là cầu đi bộ & xe đạp",             color: "#F59E0B", emoji: "🌉" },

  // ── CULTURE ────────────────────────────────────────────────────
  { id: "ngu_hanh_son",   name: "Ngũ Hành Sơn",             lat: 16.0037, lng: 108.2640, category: "culture",       description: "Quần thể núi đá cẩm thạch & hang động huyền bí",     color: "#8B5CF6", emoji: "⛰️" },
  { id: "cham_museum",    name: "Bảo tàng Điêu khắc Chăm",  lat: 16.0614, lng: 108.2239, category: "culture",       description: "Bảo tàng di vật Chăm Pa độc đáo nhất thế giới",      color: "#8B5CF6", emoji: "🏛️" },
  { id: "non_nuoc_stone", name: "Làng đá mỹ nghệ Non Nước", lat: 16.0021, lng: 108.2648, category: "culture",       description: "Làng nghề điêu khắc đá truyền thống 400 năm",        color: "#8B5CF6", emoji: "🪨" },
  { id: "da_nang_museum", name: "Bảo tàng Đà Nẵng",         lat: 16.0740, lng: 108.2211, category: "culture",       description: "Lưu giữ lịch sử văn hóa thành phố Đà Nẵng",          color: "#8B5CF6", emoji: "🏛️" },
  { id: "dien_hai",       name: "Thành Điện Hải",            lat: 16.0734, lng: 108.2195, category: "culture",       description: "Di tích lịch sử quốc gia, thành cổ thời Nguyễn",     color: "#8B5CF6", emoji: "🏰" },
  { id: "cathedral",      name: "Nhà thờ Chính tòa Đà Nẵng", lat: 16.0679, lng: 108.2234, category: "culture",     description: "Nhà thờ con gà hồng biểu tượng kiến trúc Pháp",     color: "#8B5CF6", emoji: "⛪" },

  // ── TEMPLE ─────────────────────────────────────────────────────
  { id: "linh_ung",       name: "Chùa Linh Ứng Sơn Trà",    lat: 16.0939, lng: 108.2775, category: "temple",        description: "Tượng Phật Quan Âm cao 67m nhìn ra biển Đông",       color: "#EC4899", emoji: "🛕" },

  // ── ENTERTAINMENT ───────────────────────────────────────────────
  { id: "asia_park",      name: "Công viên Châu Á",          lat: 16.0386, lng: 108.2267, category: "entertainment", description: "Công viên giải trí lớn với Sun Wheel cao 115m",       color: "#F97316", emoji: "🎡" },
  { id: "sun_wheel",      name: "Sun Wheel",                 lat: 16.0381, lng: 108.2281, category: "entertainment", description: "Vòng quay mặt trời cao nhất Đông Nam Á",             color: "#F97316", emoji: "🎠" },
  { id: "mikazuki",       name: "Mikazuki Water Park 365",   lat: 16.0926, lng: 108.1560, category: "entertainment", description: "Công viên nước Nhật Bản hoạt động 365 ngày",          color: "#F97316", emoji: "🏊" },
  { id: "fantasy_park",   name: "Fantasy Park",              lat: 15.9955, lng: 107.9972, category: "entertainment", description: "Công viên giải trí trong nhà tại Bà Nà Hills",        color: "#F97316", emoji: "🎭" },
  { id: "helio_center",   name: "Helio Center",              lat: 16.0348, lng: 108.2246, category: "entertainment", description: "Trung tâm sự kiện và chợ đêm cuối tuần",             color: "#F97316", emoji: "🎪" },
  { id: "son_tra_marina", name: "Son Tra Marina",            lat: 16.1059, lng: 108.2735, category: "entertainment", description: "Bến cảng du thuyền cao cấp Sơn Trà",                 color: "#F97316", emoji: "⛵" },
  { id: "han_marina",     name: "Bến du thuyền sông Hàn",   lat: 16.0693, lng: 108.2289, category: "entertainment", description: "Bến thuyền ngắm sông Hàn về đêm",                    color: "#F97316", emoji: "🚢" },
  { id: "bach_dang_walk", name: "Phố đi bộ Bạch Đằng",     lat: 16.0701, lng: 108.2240, category: "entertainment", description: "Phố đi bộ ven sông Hàn thoáng mát",                  color: "#F97316", emoji: "🚶" },
  { id: "apec_park",      name: "Công viên APEC",            lat: 16.0609, lng: 108.2248, category: "entertainment", description: "Công viên kỷ niệm Hội nghị APEC 2017",                color: "#F97316", emoji: "🌐" },
  { id: "bach_dang_flower", name: "Đường hoa Bạch Đằng",   lat: 16.0712, lng: 108.2238, category: "entertainment", description: "Con đường hoa rực rỡ bên bờ sông Hàn",               color: "#F97316", emoji: "🌸" },

  // ── MARKET ─────────────────────────────────────────────────────
  { id: "han_market",     name: "Chợ Hàn",                   lat: 16.0704, lng: 108.2237, category: "market",        description: "Chợ truyền thống lớn nhất Đà Nẵng",                  color: "#EF4444", emoji: "🛒" },
  { id: "con_market",     name: "Chợ Cồn",                   lat: 16.0675, lng: 108.2148, category: "market",        description: "Chợ bình dân giá rẻ, ăn uống đặc sản",              color: "#EF4444", emoji: "🛒" },
  { id: "vincom",         name: "Vincom Plaza Đà Nẵng",      lat: 16.0735, lng: 108.2304, category: "market",        description: "Trung tâm thương mại hiện đại trung tâm TP",          color: "#EF4444", emoji: "🏬" },
  { id: "lotte",          name: "Lotte Mart Đà Nẵng",        lat: 16.0341, lng: 108.2199, category: "market",        description: "Siêu thị Hàn Quốc với nhiều mặt hàng đa dạng",       color: "#EF4444", emoji: "🏬" },
  { id: "helio_night",    name: "Chợ đêm Helio",             lat: 16.0344, lng: 108.2248, category: "market",        description: "Chợ đêm cuối tuần náo nhiệt tại Helio Center",       color: "#EF4444", emoji: "🌙" },
  { id: "bac_my_an",      name: "Chợ Bắc Mỹ An",            lat: 16.0455, lng: 108.2418, category: "market",        description: "Chợ khu vực biển Mỹ Khê, hải sản tươi sống",        color: "#EF4444", emoji: "🦐" },
  { id: "son_tra_night",  name: "Chợ đêm Sơn Trà",          lat: 16.0715, lng: 108.2330, category: "market",        description: "Chợ đêm sầm uất khu vực Sơn Trà",                   color: "#EF4444", emoji: "🌙" },

  // ── LANDMARK ───────────────────────────────────────────────────
  { id: "carp_dragon",    name: "Tượng Cá Chép Hóa Rồng",   lat: 16.0675, lng: 108.2285, category: "landmark",      description: "Biểu tượng may mắn tại cầu sông Hàn",                color: "#A78BFA", emoji: "🐟" },
  { id: "downtown",       name: "Da Nang Downtown",          lat: 16.0388, lng: 108.2268, category: "landmark",      description: "Trung tâm thành phố Đà Nẵng sầm uất",                color: "#A78BFA", emoji: "🏙️" },
];
