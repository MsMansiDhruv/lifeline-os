/**
 * LIFELINE OS — EVIDENCE CATALOGUE SERVICE
 * Unified, searchable catalogue for satellite imagery, observed flood extent,
 * official assessments, ground-reported conditions, critical infrastructure,
 * community media, and simulated scenario layers.
 * 
 * Follows Nepal Flood Map & Lifeline OS canonical provenance standards.
 */

import { EvidenceState, EvidenceCategory } from '../types/evidence';

export interface EvidenceDatasetItem {
  id: string;
  theaterId: 'silchar' | 'nepal' | 'all';
  name: string;
  category: EvidenceCategory;
  evidenceState: EvidenceState;
  source: string;
  sourceUrl?: string;
  acquisitionDate: string;
  retrievalTime: string;
  geographicCoverage: string;
  spatialResolution?: string;
  licence: string;
  attribution: string;
  freshness: string;
  limitations: string;
  featureCount: number;
  isPreEvent?: boolean;
  isPostEvent?: boolean;
  layerId?: string;
}

const CATALOGUE_DATA: EvidenceDatasetItem[] = [
  // 1. SILCHAR / CACHAR THEATER
  {
    id: 'silchar-s2-pre',
    theaterId: 'silchar',
    name: 'Copernicus Sentinel-2 Pre-Disaster Baseline Imagery',
    category: 'imagery',
    evidenceState: 'OBSERVED',
    source: 'European Space Agency (ESA) Copernicus Programme',
    sourceUrl: 'https://dataspace.copernicus.eu',
    acquisitionDate: '2022-04-18T04:22:19Z',
    retrievalTime: '2026-10-17T06:00:00Z',
    geographicCoverage: 'Barak Valley, Cachar District (24.6°N - 24.95°N, 92.65°E - 93.05°E)',
    spatialResolution: '10m Multi-Spectral (RGB True Colour)',
    licence: 'Copernicus Open Access / CC-BY 4.0',
    attribution: 'Contains modified Copernicus Sentinel data (2022) processed by Lifeline OS',
    freshness: 'Historical baseline captured 64 days prior to flood crest',
    limitations: 'Sun glint on standing paddy fields; 0.4% cloud cover over rural outskirts',
    featureCount: 1,
    isPreEvent: true,
    layerId: 'basemap-pre',
  },
  {
    id: 'silchar-s1-sar-post',
    theaterId: 'silchar',
    name: 'Sentinel-1 SAR C-Band Flood Inundation Extent',
    category: 'flood_extent',
    evidenceState: 'OBSERVED',
    source: 'Copernicus Sentinel-1 / GEE Otsu Calibrated Radar',
    sourceUrl: 'https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-1',
    acquisitionDate: '2022-06-21T00:15:32Z',
    retrievalTime: '2026-10-17T06:00:00Z',
    geographicCoverage: 'Silchar Urban & Sub-basin (area: unavailable; Silchar_Flood_Polygon_2022.geojson: origin undocumented; shown as reference only)',
    spatialResolution: '10m Synthetic Aperture Radar (VV+VH polarimetric)',
    licence: 'Copernicus Open Access / CC-BY 4.0',
    attribution: 'ESA Copernicus Sentinel-1 processed via Google Earth Engine (Otsu threshold: -14.2 dB)',
    freshness: 'Captured T+14h post-crest during peak inundation event',
    limitations: 'Silchar_Flood_Polygon_2022.geojson: origin undocumented; shown as reference only. Specular radar bounce in submerged canopy leads to possible under-detection in dense arecanut groves',
    featureCount: 1,
    isPostEvent: true,
    layerId: 'floodExtent',
  },
  {
    id: 'silchar-asdma-sitrep',
    theaterId: 'silchar',
    name: 'ASDMA Official Incident Damage SitRep #22',
    category: 'official_assessment',
    evidenceState: 'OFFICIAL',
    source: 'Assam State Disaster Management Authority & Cachar DDMA',
    sourceUrl: 'https://asdma.assam.gov.in',
    acquisitionDate: '2022-06-22T10:00:00Z',
    retrievalTime: '2026-10-17T08:30:00Z',
    geographicCoverage: 'Cachar District, 4 Revenue Circles',
    spatialResolution: 'Revenue Circle administrative granularity',
    licence: 'Government Open Data Licence - India (GODL)',
    attribution: 'State Disaster Management Authority, Govt of Assam',
    freshness: 'Official government record published 24h post-breach',
    limitations: 'Excludes unmapped isolated habitations in tea-estate spurs',
    featureCount: 4,
  },
  {
    id: 'silchar-pwd-bridge-reports',
    theaterId: 'silchar',
    name: 'PWD Ground Verified Bridge & Culvert Inspections',
    category: 'ground_reports',
    evidenceState: 'OBSERVED',
    source: 'Assam PWD (Roads) Division & Quick Response Teams',
    sourceUrl: 'https://pwdroads.assam.gov.in',
    acquisitionDate: '2022-06-20T16:45:00Z',
    retrievalTime: '2026-10-17T09:15:00Z',
    geographicCoverage: 'JT Road, Sonabarighat, Korkoli & Harinagar corridors',
    spatialResolution: 'Point inspection ±5m GPS accuracy',
    licence: 'Public Safety Records / Section 4 RTI',
    attribution: 'Executive Engineer, PWD Cachar Rural Division',
    freshness: 'Physical visual inspection verified on ground',
    limitations: 'Subsurface foundation scour depth unmeasured while flood current > 2.5 m/s',
    featureCount: 4,
    layerId: 'bridges',
  },
  {
    id: 'silchar-osm-buildings',
    theaterId: 'silchar',
    name: 'OpenStreetMap Mapped Structure Footprints',
    category: 'infrastructure_footprints',
    evidenceState: 'OFFICIAL',
    source: 'OpenStreetMap Contributors & Humanitarian OSM Team (HOT)',
    sourceUrl: 'https://www.openstreetmap.org',
    acquisitionDate: '2024-05-10T00:00:00Z',
    retrievalTime: '2026-10-17T07:00:00Z',
    geographicCoverage: 'Silchar Sadar, Sonai & Lakhipur clusters',
    spatialResolution: 'Polygon building footprints',
    licence: 'Open Database Licence (ODbL) 1.0',
    attribution: '© OpenStreetMap contributors (ODbL)',
    freshness: 'Continuously maintained community mapping baseline',
    limitations: 'Rural thatched outbuildings partially unmapped; building heights assumed single-story unless tagged',
    featureCount: 3150,
  },
  {
    id: 'silchar-nhm-hospitals',
    theaterId: 'silchar',
    name: 'NHM Cachar Healthcare Facility Bed Registry',
    category: 'critical_facilities',
    evidenceState: 'OFFICIAL',
    source: 'National Health Mission (NHM) Assam & Joint Director of Health Services Cachar',
    sourceUrl: 'https://nhm.assam.gov.in',
    acquisitionDate: '2022-06-19T08:00:00Z',
    retrievalTime: '2026-10-17T08:00:00Z',
    geographicCoverage: 'SMCH Apex, Civil Hospital, Nightingale Hospital, Valley Hospital',
    spatialResolution: 'Geocoded campus coordinates ±10m',
    licence: 'Official Health Registry Data',
    attribution: 'Department of Health & Family Welfare, Govt of Assam',
    freshness: 'Pre-surge bed census validated against hospital superintendent registers',
    limitations: 'Emergency oxygen backup duration based on self-reported declarations',
    featureCount: 4,
    layerId: 'hospitals',
  },
  {
    id: 'silchar-osm-road-network',
    theaterId: 'silchar',
    name: 'Cachar Routable Highway & Feeder Road Graph',
    category: 'transport_network',
    evidenceState: 'OBSERVED',
    source: 'OpenStreetMap & Assam PWD Highway Geometries',
    sourceUrl: 'https://download.geofabrik.de/asia/india.html',
    acquisitionDate: '2024-06-01T00:00:00Z',
    retrievalTime: '2026-10-17T07:30:00Z',
    geographicCoverage: 'NH-37, JT Road, Sonai Road, Kumbhirgram bypass',
    spatialResolution: 'Routable vector multilinestrings (OSRM compatible)',
    licence: 'ODbL 1.0',
    attribution: '© OpenStreetMap contributors',
    freshness: 'Baseline network topology active',
    limitations: 'Unpaved village tracks may change alignment after seasonal monsoons',
    featureCount: 42,
    layerId: 'roads',
  },
  {
    id: 'silchar-sim-jt-breach',
    theaterId: 'silchar',
    name: 'Simulated JT Road 80m Embankment Severance & Culvert Bridge',
    category: 'simulated_scenarios',
    evidenceState: 'SIMULATED',
    source: 'Lifeline OS Hydrology-Transit Simulation Engine',
    acquisitionDate: '2026-10-17T17:30:00Z',
    retrievalTime: '2026-10-17T17:30:00Z',
    geographicCoverage: 'Jirighat-Thaligram (JT) Road Km 4.2',
    spatialResolution: '80m breach gap geometry',
    licence: 'Lifeline OS Demonstration Engine',
    attribution: 'Lifeline OS Multi-Tool Simulator',
    freshness: 'Computed live in operator session',
    limitations: 'Simulated bridge placement assumes level roadway abutment load-bearing capacity of 24 tonnes',
    featureCount: 1,
    layerId: 'interventions',
  },

  // 2. NEPAL THEATER (GORKHA / BUDHI GANDAKI & TRISHULI)
  {
    id: 'nepal-s2-pre',
    theaterId: 'nepal',
    name: 'Copernicus Sentinel-2 Pre-Monsoon Nepal Basemap',
    category: 'imagery',
    evidenceState: 'OBSERVED',
    source: 'ESA Copernicus Sentinel-2',
    sourceUrl: 'https://dataspace.copernicus.eu',
    acquisitionDate: '2024-03-12T05:04:11Z',
    retrievalTime: '2026-10-17T06:00:00Z',
    geographicCoverage: 'Gorkha, Dharche, Budhi Gandaki Gorge (27.9°N - 28.2°N, 84.7°E - 85.2°E)',
    spatialResolution: '10m True Colour (Band 4-3-2)',
    licence: 'Copernicus Open Access / CC-BY 4.0',
    attribution: 'Contains modified Copernicus Sentinel data (2024)',
    freshness: 'Pre-monsoon dry season baseline',
    limitations: 'Deep topographic shadow along northern mountain cliff walls',
    featureCount: 1,
    isPreEvent: true,
  },
  {
    id: 'nepal-copernicus-ems-post',
    theaterId: 'nepal',
    name: 'Copernicus EMS Rapid Mapping Activation Flood & Debris',
    category: 'flood_extent',
    evidenceState: 'OBSERVED',
    source: 'Copernicus Emergency Management Service (EMS)',
    sourceUrl: 'https://emergency.copernicus.eu',
    acquisitionDate: '2024-09-29T12:30:00Z',
    retrievalTime: '2026-10-17T07:00:00Z',
    geographicCoverage: 'Budhi Gandaki & Trishuli Basin (48.2 sq km impact)',
    spatialResolution: '10m SAR & Optical delineation',
    licence: 'Copernicus EMS Open Access',
    attribution: 'Copernicus Emergency Management Service (2024)',
    freshness: 'Rapid Mapping Delineation Product T+18h',
    limitations: 'Steep river gorge reflections introduce radar geometry distortion (layover/foreshortening)',
    featureCount: 1,
    isPostEvent: true,
  },
  {
    id: 'nepal-ndrrma-sitrep',
    theaterId: 'nepal',
    name: 'NDRRMA Official Monsoon Disaster Bulletin #14',
    category: 'official_assessment',
    evidenceState: 'OFFICIAL',
    source: 'National Disaster Risk Reduction & Management Authority, Nepal',
    sourceUrl: 'https://bipadportal.gov.np',
    acquisitionDate: '2024-09-30T14:00:00Z',
    retrievalTime: '2026-10-17T08:00:00Z',
    geographicCoverage: 'Gorkha & Dhading Districts',
    spatialResolution: 'Municipality / Ward Level',
    licence: 'Government of Nepal Open Data',
    attribution: 'Ministry of Home Affairs / NDRRMA Nepal BIPAD Portal',
    freshness: 'Official national situation report',
    limitations: 'High-altitude trails in Upper Manaslu unverified due to comms disruption',
    featureCount: 4,
  },
  {
    id: 'nepal-dor-bridge-inspections',
    theaterId: 'nepal',
    name: 'Department of Roads (DoR) Gorkha Bridge Status Reports',
    category: 'ground_reports',
    evidenceState: 'OBSERVED',
    source: 'DoR Nepal Division Road Office & Nepal Army Engineers',
    sourceUrl: 'https://dor.gov.np',
    acquisitionDate: '2024-09-29T18:00:00Z',
    retrievalTime: '2026-10-17T09:00:00Z',
    geographicCoverage: 'Soti Khola washed-out bridge, Arughat approach road',
    spatialResolution: 'Inspection point ±10m',
    licence: 'Government of Nepal Official Public Notice',
    attribution: 'DoR Nepal & District Administration Office Gorkha',
    freshness: 'Field team on-site radio telemetry report',
    limitations: 'Debris flow continuing; structural integrity of remaining piers unassessed under water',
    featureCount: 3,
  },
  {
    id: 'nepal-mohp-facilities',
    theaterId: 'nepal',
    name: 'MoHP Nepal Health Facility Infrastructure Census',
    category: 'critical_facilities',
    evidenceState: 'OFFICIAL',
    source: 'Ministry of Health and Population Nepal (HMIS Database)',
    sourceUrl: 'https://mohp.gov.np',
    acquisitionDate: '2024-05-01T00:00:00Z',
    retrievalTime: '2026-10-17T08:00:00Z',
    geographicCoverage: 'Gorkha District Hospital, Arughat Primary Hospital, Amppipal Hospital',
    spatialResolution: 'Geocoded point coordinates',
    licence: 'Nepal MoHP Open Data',
    attribution: 'Govt of Nepal Ministry of Health and Population',
    freshness: 'Annual health census with emergency surge verified',
    limitations: 'Blood bank cold chain dependent on local diesel generator fuel supplies',
    featureCount: 3,
  },
  {
    id: 'nepal-s2-post',
    theaterId: 'nepal',
    name: 'Sentinel-2 MSI Post-Disaster Cloud-Free Imagery',
    category: 'imagery',
    evidenceState: 'OBSERVED',
    source: 'Copernicus Sentinel-2 & Nepal Flood Map Registry',
    sourceUrl: 'https://dataspace.copernicus.eu',
    acquisitionDate: '2024-10-02T04:45:00Z',
    retrievalTime: '2026-10-17T08:30:00Z',
    geographicCoverage: 'Roshi River, Kavrepalanchok & Sindhuli (27.4°N - 27.65°N, 85.5°E - 85.9°E)',
    spatialResolution: '10m True Colour (Band 4-3-2)',
    licence: 'Copernicus Open Access / CC-BY 4.0',
    attribution: 'Contains modified Copernicus Sentinel data (2024) processed by Nepal Flood Map & Lifeline OS',
    freshness: 'First cloud-free post-event pass T+96h after heavy cloudbursts',
    limitations: 'Narrow river gorge shadow along steep southern canyon walls',
    featureCount: 1,
    isPostEvent: true,
  },
  {
    id: 'nepal-icimod-hazard',
    theaterId: 'nepal',
    name: 'ICIMOD / NDRRMA Official Flash Flood & Debris Hazard Map',
    category: 'official_assessment',
    evidenceState: 'OFFICIAL',
    source: 'International Centre for Integrated Mountain Development (ICIMOD) & NDRRMA',
    sourceUrl: 'https://www.icimod.org',
    acquisitionDate: '2024-10-03T12:00:00Z',
    retrievalTime: '2026-10-17T09:15:00Z',
    geographicCoverage: 'Roshi Khola, Sunkoshi River, Bagmati Basin',
    spatialResolution: '12.5m terrain-hydrology hazard model',
    licence: 'CC-BY-NC 4.0 Open Scientific Access',
    attribution: 'ICIMOD Disaster Risk Reduction Programme (2024)',
    freshness: 'Multi-agency scientific hazard synthesis',
    limitations: 'Secondary landslide dam breach risks along unmapped feeder ravines',
    featureCount: 1,
  },
  {
    id: 'nepal-osm-buildings',
    theaterId: 'nepal',
    name: 'Humanitarian OpenStreetMap (HOT) Building Footprints',
    category: 'infrastructure_footprints',
    evidenceState: 'OBSERVED',
    source: 'Humanitarian OpenStreetMap Team (HOT) Disaster Activation #17420',
    sourceUrl: 'https://tasks.hotosm.org',
    acquisitionDate: '2024-10-01T00:00:00Z',
    retrievalTime: '2026-10-17T09:00:00Z',
    geographicCoverage: 'Mangaltar, Bhakundebesi, Dapcha, Nepalthok',
    spatialResolution: 'Vector polygon footprints (4,210 structures)',
    licence: 'ODbL 1.0',
    attribution: '© OpenStreetMap and HOT community contributors',
    freshness: 'Community remote mapping sprint validation',
    limitations: 'Informal agricultural sheds and temporary tin-roof shelters not mapped',
    featureCount: 4210,
    layerId: 'buildings',
  },
];

export class EvidenceCatalogueService {
  private items: EvidenceDatasetItem[] = [...CATALOGUE_DATA];

  public getAllDatasets(): EvidenceDatasetItem[] {
    return [...this.items];
  }

  public getDatasetsByTheater(theaterId: string): EvidenceDatasetItem[] {
    return this.items.filter(
      (item) => item.theaterId === theaterId || item.theaterId === 'all'
    );
  }

  public getDatasetsByCategory(
    theaterId: string,
    category: EvidenceCategory
  ): EvidenceDatasetItem[] {
    return this.getDatasetsByTheater(theaterId).filter(
      (item) => item.category === category
    );
  }

  public searchDatasets(
    theaterId: string,
    query: string,
    filterState?: EvidenceState
  ): EvidenceDatasetItem[] {
    const q = query.trim().toLowerCase();
    return this.getDatasetsByTheater(theaterId).filter((item) => {
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.licence.toLowerCase().includes(q) ||
        item.limitations.toLowerCase().includes(q);
      const matchesState = !filterState || item.evidenceState === filterState;
      return matchesQuery && matchesState;
    });
  }

  public getPreEventImagery(theaterId: string): EvidenceDatasetItem | undefined {
    return this.getDatasetsByTheater(theaterId).find(
      (item) => item.category === 'imagery' && item.isPreEvent
    );
  }

  public getPostEventImagery(theaterId: string): EvidenceDatasetItem | undefined {
    return this.getDatasetsByTheater(theaterId).find(
      (item) => item.isPostEvent
    );
  }

  public getDatasetCountByState(theaterId: string): Record<EvidenceState, number> {
    const counts: Record<EvidenceState, number> = {
      OBSERVED: 0,
      OFFICIAL: 0,
      REPORTED: 0,
      MODELLED: 0,
      ASSUMED: 0,
      SIMULATED: 0,
      UNKNOWN: 0,
    };
    for (const item of this.getDatasetsByTheater(theaterId)) {
      counts[item.evidenceState] = (counts[item.evidenceState] || 0) + 1;
    }
    return counts;
  }
}

export const evidenceCatalogueService = new EvidenceCatalogueService();
