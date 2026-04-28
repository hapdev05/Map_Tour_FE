/** GET /api/districts */
export interface BackendDistrict {
  district_id: number;
  district_name: string;
}

/** summary trong từng phần tử GET /api/weather */
export interface BackendDailySummary {
  temp_min: number;
  temp_max: number;
  temp_avg: number;
  humidity_avg: number;
  rain_total: number;
  wind_max: number;
  rain_prob_avg: number;
}

/** Một dòng GET /api/weather (tất cả quận × ngày) */
export interface BackendWeatherSummaryRow {
  district: string;
  date: string;
  summary: BackendDailySummary;
}

/** Giờ trong GET /api/weather/{district} hoặc /{district}/{date} */
export interface BackendHourlyPoint {
  hour: number;
  temperature_c: number;
  humidity_percent: number;
  wind_speed_m_s: number;
  rain_mm: number;
  rain_probability: number;
  description: string;
}

export interface BackendForecastDay {
  date: string;
  hourly: BackendHourlyPoint[];
}

/** GET /api/weather/{district} */
export interface BackendDistrictWeatherResponse {
  district: string;
  forecasts: BackendForecastDay[];
}

/** GET /api/weather/{district}/{date} */
export interface BackendDistrictDateWeatherResponse {
  district: string;
  date: string;
  hourly: BackendHourlyPoint[];
}

/** GET /api/actual/{district}/{date} — lỗi FastAPI */
export interface BackendActualError {
  detail: string;
}
