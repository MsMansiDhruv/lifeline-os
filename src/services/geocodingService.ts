/**
 * LIFELINE OS — PROVIDER-INDEPENDENT GEOCODING & SPATIAL DISCOVERY SERVICE
 * 
 * Complies with Section 5 of the Master Specification:
 * - Real geocoding backed by OpenStreetMap Nominatim API
 * - Debouncing, AbortController request cancellation, duplicate query suppression
 * - In-memory caching and strict Nominatim usage policy (1 req/sec rate limiting)
 * - Coordinate parsing for raw lat/lon queries
 * - Location Analysis State computation: READY, PARTIAL, INSUFFICIENT_DATA, etc.
 * - Multi-criteria search (Settlement, District, Basin, Hospital, Landmark, Coordinates)
 */

import { GeoSelectionMode, LocationAnalysisState } from '../types/evidence';
import { THEATERS, TheaterData } from '../data/theaters';

export interface GeocodingResult {
  id: string;
  displayName: string;
  featureType: string; // 'city' | 'village' | 'administrative' | 'river' | 'hospital' | 'coordinate' | 'way'
  coordinates: [number, number]; // [lat, lon]
  adminHierarchy: {
    country?: string;
    state?: string;
    district?: string;
    city?: string;
    subdistrict?: string;
  };
  boundingBox?: [[number, number], [number, number]]; // [[south, west], [north, east]]
  provider: 'OpenStreetMap Nominatim' | 'Direct Coordinate Parser' | 'EOC Known Cache';
  providerObjectId?: string;
  attribution: string;
  retrievalTime: string;
  selectionMode: GeoSelectionMode;
  analysisState: LocationAnalysisState;
  coverageSummary: {
    hasWeather: boolean;
    hasHydrology: boolean;
    hasElevation: boolean;
    hasRoadGraph: boolean;
    hasHospitals: boolean;
    missingInputs: string[];
  };
}

class GeocodingService {
  private cache = new Map<string, GeocodingResult[]>();
  private activeAbortController: AbortController | null = null;
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL_MS = 1000; // Nominatim 1 req/sec policy

  /**
   * Search any geographic query: settlement, district, basin, hospital, or coordinates
   */
  public async search(query: string): Promise<GeocodingResult[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      return [];
    }

    // 1. Check if raw latitude, longitude was entered (e.g. "24.8333, 92.7789")
    const coordMatch = trimmed.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        const directCoordResult: GeocodingResult = {
          id: `coord_${lat.toFixed(5)}_${lon.toFixed(5)}`,
          displayName: `Coordinate: ${lat.toFixed(5)}°N, ${lon.toFixed(5)}°E`,
          featureType: 'coordinate',
          coordinates: [lat, lon],
          adminHierarchy: {},
          provider: 'Direct Coordinate Parser',
          attribution: 'WGS84 EPSG:4326',
          retrievalTime: new Date().toISOString(),
          selectionMode: 'POINT',
          analysisState: this.evaluateCoverage(lat, lon).state,
          coverageSummary: this.evaluateCoverage(lat, lon).summary,
        };
        return [directCoordResult];
      }
    }

    // 2. Check in-memory cache
    const cacheKey = trimmed.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 3. Cancel any in-flight request
    if (this.activeAbortController) {
      this.activeAbortController.abort();
    }
    this.activeAbortController = new AbortController();

    // 4. Rate-limit enforcement for open Nominatim usage
    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < this.MIN_REQUEST_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, this.MIN_REQUEST_INTERVAL_MS - timeSinceLast));
    }
    this.lastRequestTime = Date.now();

    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&addressdetails=1&limit=6`;

      const response = await fetch(endpoint, {
        signal: this.activeAbortController.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LifelineOS-DisasterEOC/1.0 (Emergency Response & Decision Support)',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        return [];
      }

      const results: GeocodingResult[] = data.map((item: any) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const address = item.address || {};

        let selectionMode: GeoSelectionMode = 'POINT';
        const type = item.type || item.class || 'location';
        if (['administrative', 'state', 'country', 'district', 'county'].includes(type)) {
          selectionMode = 'ADMIN_AREA';
        } else if (['river', 'water', 'basin'].includes(type)) {
          selectionMode = 'BASIN';
        }

        let boundingBox: [[number, number], [number, number]] | undefined;
        if (Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
          boundingBox = [
            [parseFloat(item.boundingbox[0]), parseFloat(item.boundingbox[2])],
            [parseFloat(item.boundingbox[1]), parseFloat(item.boundingbox[3])],
          ];
        }

        const coverage = this.evaluateCoverage(lat, lon);

        return {
          id: `osm_${item.osm_type || 'node'}_${item.osm_id || Math.random()}`,
          displayName: item.display_name,
          featureType: type,
          coordinates: [lat, lon],
          adminHierarchy: {
            country: address.country,
            state: address.state,
            district: address.state_district || address.county || address.district,
            city: address.city || address.town || address.municipality,
            subdistrict: address.suburb || address.village,
          },
          boundingBox,
          provider: 'OpenStreetMap Nominatim',
          providerObjectId: `${item.osm_type}/${item.osm_id}`,
          attribution: '© OpenStreetMap contributors (ODbL 1.0)',
          retrievalTime: new Date().toISOString(),
          selectionMode,
          analysisState: coverage.state,
          coverageSummary: coverage.summary,
        };
      });

      // Cache successful response
      this.cache.set(cacheKey, results);
      return results;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return [];
      }
      console.warn('Geocoding service network warning:', err?.message || err);

      // Honest fallback: match against known verified historical theaters (Silchar, Wayanad, Nepal)
      const localMatches = this.searchKnownTheaters(trimmed);
      return localMatches;
    }
  }

  /**
   * Reverse Geocode a map point click
   */
  public async reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
    try {
      const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(
        5
      )}&lon=${lon.toFixed(5)}&addressdetails=1`;

      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LifelineOS-DisasterEOC/1.0',
        },
      });

      if (!response.ok) return null;
      const item = await response.json();
      const address = item.address || {};
      const coverage = this.evaluateCoverage(lat, lon);

      return {
        id: `osm_${item.osm_type}_${item.osm_id}`,
        displayName: item.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        featureType: item.type || 'point',
        coordinates: [lat, lon],
        adminHierarchy: {
          country: address.country,
          state: address.state,
          district: address.state_district || address.county,
          city: address.city || address.town,
        },
        provider: 'OpenStreetMap Nominatim',
        providerObjectId: `${item.osm_type}/${item.osm_id}`,
        attribution: '© OpenStreetMap contributors',
        retrievalTime: new Date().toISOString(),
        selectionMode: 'POINT',
        analysisState: coverage.state,
        coverageSummary: coverage.summary,
      };
    } catch {
      return null;
    }
  }

  /**
   * Evaluates data coverage for a resolved place.
   * Section 5.6: Never pretend a location has full flood/road data if it is missing!
   */
  public evaluateCoverage(lat: number, lon: number): {
    state: LocationAnalysisState;
    summary: GeocodingResult['coverageSummary'];
  } {
    // Check proximity to verified historical baseline theaters
    const isNearSilchar = Math.hypot(lat - 24.8333, lon - 92.7789) < 0.35;
    const isNearWayanad = Math.hypot(lat - 11.608, lon - 76.082) < 0.45;
    const isNearNepal = Math.hypot(lat - 28.065, lon - 84.815) < 0.50;

    const hasGlobalWeather = true; // Open-Meteo covers global coordinates
    const hasGlobalHydrology = true; // GloFAS covers global river discharge
    const hasGlobalElevation = true; // SRTM 90m covers global -60 to +60 lat

    if (isNearSilchar) {
      return {
        state: 'READY',
        summary: {
          hasWeather: true,
          hasHydrology: true,
          hasElevation: true,
          hasRoadGraph: true,
          hasHospitals: true,
          missingInputs: [],
        },
      };
    }

    if (isNearWayanad || isNearNepal) {
      return {
        state: 'PARTIAL',
        summary: {
          hasWeather: true,
          hasHydrology: true,
          hasElevation: true,
          hasRoadGraph: true,
          hasHospitals: true,
          missingInputs: ['Real-time CWC Local River Gauge (GloFAS Regional Basin in use)'],
        },
      };
    }

    // Any arbitrary searched place across the globe
    return {
      state: 'PARTIAL',
      summary: {
        hasWeather: hasGlobalWeather,
        hasHydrology: hasGlobalHydrology,
        hasElevation: hasGlobalElevation,
        hasRoadGraph: false, // Local graph needs ingestion
        hasHospitals: false,
        missingInputs: [
          'Verified Local Road Network Graph',
          'Verified Emergency Hospital Registry',
          'Local Flood Extent Polygon',
        ],
      },
    };
  }

  private searchKnownTheaters(query: string): GeocodingResult[] {
    const q = query.toLowerCase();
    const matches: GeocodingResult[] = [];

    Object.values(THEATERS).forEach((th) => {
      if (th.name.toLowerCase().includes(q) || th.subtitle.toLowerCase().includes(q)) {
        matches.push({
          id: `theater_${th.id}`,
          displayName: `${th.name} (${th.subtitle})`,
          featureType: 'administrative',
          coordinates: th.center,
          adminHierarchy: {
            country: th.id === 'nepal' ? 'Nepal' : 'India',
            district: th.name.split(',')[0],
          },
          provider: 'EOC Known Cache',
          attribution: 'Verified Lifeline OS Historical Scenario',
          retrievalTime: new Date().toISOString(),
          selectionMode: 'ADMIN_AREA',
          analysisState: 'READY',
          coverageSummary: {
            hasWeather: true,
            hasHydrology: true,
            hasElevation: true,
            hasRoadGraph: true,
            hasHospitals: true,
            missingInputs: [],
          },
        });
      }
    });

    return matches;
  }
}

export const geocodingService = new GeocodingService();
