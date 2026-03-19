export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
}

export interface HourlyWeather {
  time: string[];
  temperature: number[];
  precipitationProbability: number[];
  weatherCode: number[];
}

export interface DailyWeather {
  time: string[];
  weatherCode: number[];
  temperatureMax: number[];
  temperatureMin: number[];
  sunrise: string[];
  sunset: string[];
  precipitationSum: number[];
  precipitationProbabilityMax: number[];
  uvIndexMax: number[];
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}
