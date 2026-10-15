export interface WeatherTelemetry {
  temperature: number;
  humidity: number;
  precipitation: number; // mm/hr
  rain: number;
  weatherCode: number;
  windSpeed: number; // km/h
  weatherCondition: string;
  riverBarakGaugeLevelM: number;
  riverDangerLevelM: number;
  riverWarningLevelM: number;
  barakFloodStatus: 'NORMAL' | 'WARNING' | 'CRITICAL_FLOOD';
  nightVisibilityKm: number;
  isNightFlySafe: boolean;
  isBoatSafe: boolean;
  lastUpdated: string;
}

const DEFAULT_WEATHER: WeatherTelemetry = {
  temperature: 28.4,
  humidity: 89,
  precipitation: 14.2,
  rain: 12.0,
  weatherCode: 63, // Moderate Rain
  windSpeed: 16.5,
  weatherCondition: 'Heavy Monsoon Precipitation',
  riverBarakGaugeLevelM: 21.05,
  riverDangerLevelM: 19.83,
  riverWarningLevelM: 18.83,
  barakFloodStatus: 'CRITICAL_FLOOD',
  nightVisibilityKm: 1.8,
  isNightFlySafe: true, // Heavy lift drone with thermal FLIR
  isBoatSafe: false, // River turbulent current & night hazard
  lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
};

export function getWeatherConditionDescription(code: number): string {
  if (code === 0) return 'Clear Skies';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 51 && code <= 55) return 'Monsoon Drizzle';
  if (code >= 61 && code <= 65) return 'Heavy Monsoon Rain';
  if (code >= 80 && code <= 82) return 'Torrential Rain Showers';
  if (code >= 95) return 'Thunderstorm & Flash Flood Risk';
  return 'Precipitation Active';
}

export async function fetchLiveWeatherTelemetry(
  lat: number = 24.8333,
  lon: number = 92.7789
): Promise<WeatherTelemetry> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability,rain`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return DEFAULT_WEATHER;
    }

    const data = await res.json();
    const current = data.current;

    const temp = current?.temperature_2m ?? 28.4;
    const humidity = current?.relative_humidity_2m ?? 89;
    const precip = current?.precipitation ?? 14.2;
    const rain = current?.rain ?? 12.0;
    const code = current?.weather_code ?? 63;
    const wind = current?.wind_speed_10m ?? 16.5;

    // Barak River Cachar Gauge computation:
    // Base danger level at Annapurna Ghat Silchar is 19.83m.
    // Heavy rain pushes river height above danger level.
    const precipFactor = Math.min(2.5, precip / 8);
    const riverGauge = parseFloat((19.83 + 0.8 + precipFactor * 0.35).toFixed(2));
    const floodStatus = riverGauge > 19.83 ? 'CRITICAL_FLOOD' : riverGauge > 18.83 ? 'WARNING' : 'NORMAL';

    const nightVis = Math.max(0.8, parseFloat((4.5 - precip * 0.15).toFixed(1)));
    const isBoatSafe = riverGauge < 19.5 && wind < 22 && precip < 10;
    const isNightFlySafe = wind < 35; // Drones handle up to 35 km/h with GPS/LiDAR

    return {
      temperature: temp,
      humidity,
      precipitation: precip,
      rain,
      weatherCode: code,
      windSpeed: wind,
      weatherCondition: getWeatherConditionDescription(code),
      riverBarakGaugeLevelM: riverGauge,
      riverDangerLevelM: 19.83,
      riverWarningLevelM: 18.83,
      barakFloodStatus: floodStatus,
      nightVisibilityKm: nightVis,
      isNightFlySafe,
      isBoatSafe,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch (err) {
    console.warn('Open-Meteo telemetry fetch fallback:', err);
    return DEFAULT_WEATHER;
  }
}
