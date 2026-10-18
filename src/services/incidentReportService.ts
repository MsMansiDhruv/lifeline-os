/**
 * LIFELINE OS — INCIDENT REPORT SERVICE
 * Provides verified and ground-reported damage, bridge/road status,
 * verification workflows, and field observations modeled after the Nepal Flood Map.
 */

import { DamageReportStatus } from '../types/evidence';

export interface IncidentDamageReport {
  id: string;
  theaterId: 'silchar' | 'nepal';
  featureType: 'bridge' | 'road' | 'embankment' | 'facility' | 'settlement';
  featureName: string;
  roadName: string;
  coordinates: [number, number]; // [lat, lon]
  reportedCondition: string;
  normalizedStatus: DamageReportStatus;
  source: string;
  sourceUrl: string;
  observationTime: string; // ISO 8601
  retrievalTime: string;   // ISO 8601
  verificationStatus: 'REPORTED/UNVERIFIED' | 'VERIFIED' | 'PROVISIONAL_UNVERIFIED' | 'CONFLICTING' | 'OFFICIAL_CONFIRMED';
  attachments: Array<{
    type: 'photo' | 'video' | 'document';
    title: string;
    url?: string;
    caption: string;
    credit: string;
    license: string;
  }>;
  notes: string;
  uncertainty: string;
  chokePointIdx?: number;
  breachMeters?: number;
  isolatedPopEst?: number;
}

const INCIDENT_REPORTS: IncidentDamageReport[] = [
  // SILCHAR INCIDENT REPORTS
  {
    id: 'REP-CACHAR-001',
    theaterId: 'silchar',
    featureType: 'bridge',
    featureName: 'Jirighat-Thaligram (JT) Road Bridge Abutment',
    roadName: 'JT Road (State Highway 34)',
    coordinates: [24.7891, 92.8124],
    reportedCondition: '80m bridge approach embankment washed away by turbulent Barak overflow; structural deck exposed',
    normalizedStatus: 'REPORTED_DESTROYED',
    source: 'Assam PWD (Roads) Field Assessment Unit',
    sourceUrl: '',
    observationTime: '2022-06-20T16:45:00Z',
    retrievalTime: '',
    verificationStatus: 'REPORTED/UNVERIFIED',
    attachments: [
      {
        type: 'photo',
        title: 'JT Road Abutment Scour',
        caption: 'Severed northern approach slab with 3.2m water level below missing embankment',
        credit: 'Executive Engineer, PWD Cachar Rural Division',
        license: 'CC-BY-SA 4.0 / Public Safety Disclosure',
      },
      {
        type: 'document',
        title: 'Assam PWD Damage Inspection Certificate',
        caption: 'Structural failure classification: Confirmed Breach #01',
        credit: 'DDMA Cachar Inspection Record #441',
        license: 'Government Public Record',
      },
    ],
    notes: 'Primary arterial route connecting Thaligram rural cluster to Silchar Civil Hospital. Bypassed via Kumbhirgram (+47m delay).',
    uncertainty: '±2m spatial GPS error; foundation scour depth under investigation.',
    chokePointIdx: 0,
    breachMeters: 80,
    isolatedPopEst: 14000,
  },
  {
    id: 'REP-CACHAR-002',
    theaterId: 'silchar',
    featureType: 'road',
    featureName: 'Sonabarighat Culvert & Feeder Road',
    roadName: 'Sonai-Sonabarighat Road',
    coordinates: [24.7612, 92.7935],
    reportedCondition: 'Overtopped by 0.75m standing water; culvert barrel clogged with floating hyacinth debris',
    normalizedStatus: 'REPORTED_DAMAGED',
    source: 'Cachar DDMA Revenue Circle Officer',
    sourceUrl: '',
    observationTime: '2022-06-21T08:30:00Z',
    retrievalTime: '',
    verificationStatus: 'REPORTED/UNVERIFIED',
    attachments: [
      {
        type: 'photo',
        title: 'Sonabarighat Inundated Embankment',
        caption: 'Standing backwater from Sonai tributary crossing bituminous wearing course',
        credit: 'Sonai Revenue Circle Quick Response Team',
        license: 'Open Government Data',
      },
    ],
    notes: 'Passable only for 4x4 tractors and high-clearance military trucks. Standard patient ambulances halted.',
    uncertainty: 'Water receding at ~3 cm/hr based on local staff gauge reading.',
    chokePointIdx: 1,
    breachMeters: 45,
    isolatedPopEst: 8500,
  },
  {
    id: 'REP-CACHAR-003',
    theaterId: 'silchar',
    featureType: 'embankment',
    featureName: 'Korkoli Flood Dyke Breached Section',
    roadName: 'Korkoli Embankment Bund Road',
    coordinates: [24.8120, 92.8340],
    reportedCondition: '120m earthen dyke failure caused catastrophic backflow inundation of Korkoli agricultural bowl',
    normalizedStatus: 'REPORTED_DESTROYED',
    source: 'Water Resources Department (WRD) Assam',
    sourceUrl: '',
    observationTime: '2022-06-20T14:10:00Z',
    retrievalTime: '',
    verificationStatus: 'REPORTED/UNVERIFIED',
    attachments: [
      {
        type: 'photo',
        title: 'Korkoli Dyke Breach Chasm',
        caption: 'Barak floodwaters pouring through failed earthen embankment bund',
        credit: 'WRD Assam Sub-Divisional Officer',
        license: 'Public Safety Records',
      },
    ],
    notes: 'Causes backflow flooding isolating Harinagar and upper Korkoli hamlets from eastern access.',
    uncertainty: 'High-velocity flow prevents immediate geotextile sandbag plugging.',
    breachMeters: 120,
    isolatedPopEst: 11200,
  },
  {
    id: 'REP-CACHAR-004',
    theaterId: 'silchar',
    featureType: 'facility',
    featureName: 'Nightingale Hospital & Trauma Care Approach',
    roadName: 'Hospital Link Road #2',
    coordinates: [24.8105, 92.7980],
    reportedCondition: 'Approach road waterlogged by 0.4m; ground floor storm drains overwhelmed. Power operating on emergency diesel genset.',
    normalizedStatus: 'REPORTED_DAMAGED',
    source: 'Hospital Medical Superintendent Dispatch Log',
    sourceUrl: '',
    observationTime: '2022-06-21T11:00:00Z',
    retrievalTime: '',
    verificationStatus: 'REPORTED/UNVERIFIED',
    attachments: [
      {
        type: 'photo',
        title: 'Nightingale Forecourt Waterlogging',
        caption: 'Water level reaching ground floor steps; patient transfers diverted to high-clearance vehicles',
        credit: 'Hospital Administrative Staff',
        license: 'Hospital Incident Log',
      },
    ],
    notes: 'Facility still operational with 10 reserved triage beds, but standard ambulances cannot dock safely.',
    uncertainty: 'Depends on urban pump house diesel fuel availability.',
    isolatedPopEst: 0,
  },
  {
    id: 'REP-CACHAR-005',
    theaterId: 'silchar',
    featureType: 'bridge',
    featureName: 'Harinagar Feeder Culvert',
    roadName: 'Harinagar Rural Link',
    coordinates: [24.7450, 92.8620],
    reportedCondition: 'Conflicting reports: Local gram panchayat reports structure washed away; SDRF patrol reports bridge intact with flooded approaches.',
    normalizedStatus: 'CONFLICTING_REPORTS',
    source: 'Citizen Ground SMS + SDRF Radio Relay',
    sourceUrl: '',
    observationTime: '2022-06-21T15:20:00Z',
    retrievalTime: '',
    verificationStatus: 'REPORTED/UNVERIFIED',
    attachments: [
      {
        type: 'document',
        title: 'SDRF Patrol Log Excerpt',
        caption: 'Submerged bridge deck visible through clear floodwater; unpassable for civilians but structurally standing',
        credit: 'SDRF Unit 2 Radio Operator',
        license: 'Incident Dispatch Log',
      },
    ],
    notes: 'Classified as CONFLICTING_REPORTS until drone reconnaissance confirms span integrity.',
    uncertainty: 'Physical visual check pending drone flight authorization (wind-dependent).',
    breachMeters: 60,
    isolatedPopEst: 6400,
  },

  // NEPAL INCIDENT REPORTS (ROSHI KHOLA / BP HIGHWAY / KAVRE & SINDHULI)
  {
    id: 'REP-NEPAL-001',
    theaterId: 'nepal',
    featureType: 'bridge',
    featureName: 'BP Highway (NH08) Roshi Khola Gorge Bridge Abutment (Km 48)',
    roadName: 'BP Highway (Banepa-Bardibas Corridor)',
    coordinates: [27.5380, 85.6420],
    reportedCondition: '120m section of highway approach slab and concrete abutment swept into swollen Roshi river gorge by boulder-laden debris torrent',
    normalizedStatus: 'REPORTED_DESTROYED',
    source: 'Department of Roads (DoR Nepal) & Nepal Police Roshi Outpost',
    sourceUrl: '',
    observationTime: '2024-09-28T22:15:00Z',
    retrievalTime: '',
    verificationStatus: 'REPORTED/UNVERIFIED',
    attachments: [
      {
        type: 'photo',
        title: 'BP Highway Roshi Gorge Abutment Collapse',
        caption: 'Violent floodwaters in Roshi gorge scouring out 120m of paved highway embankment',
        credit: 'Nepal Police Outpost Mangaltar',
        license: 'Public Disaster Record / MoHA Nepal',
      },
    ],
    notes: 'Cut off eastern Nepal lifeline to Kathmandu; stranding over 28,000 citizens in Mangaltar and Bhakundebesi sectors.',
    uncertainty: 'Ongoing slope instability and debris movement from steep upper canyon walls.',
    chokePointIdx: 0,
    breachMeters: 120,
    isolatedPopEst: 28400,
  },
  {
    id: 'REP-NEPAL-002',
    theaterId: 'nepal',
    featureType: 'road',
    featureName: 'Mangaltar Feeder & Suspension Bridge Link',
    roadName: 'Mangaltar Valley Connecting Road',
    coordinates: [27.5120, 85.6980],
    reportedCondition: '85m river embankment slumping into Roshi Khola channel; suspension bridge eastern anchor exposed to severe hydraulic scour',
    normalizedStatus: 'REPORTED_DAMAGED',
    source: 'Kavrepalanchok District Emergency Operations Center (DEOC) & Nepal Red Cross',
    sourceUrl: '',
    observationTime: '2024-09-29T06:30:00Z',
    retrievalTime: '',
    verificationStatus: 'REPORTED/UNVERIFIED',
    attachments: [
      {
        type: 'photo',
        title: 'Mangaltar Valley River Scour',
        caption: 'Roshi River overflow cutting into terraced fields and approach road',
        credit: 'Nepal Red Cross Society Kavre Chapter',
        license: 'Open Humanitarian License',
      },
    ],
    notes: 'Vehicular transit completely halted; zip-line aerial resupply established by Armed Police Force.',
    uncertainty: 'Subsurface foundation assessment pending geotechnical drone survey.',
    chokePointIdx: 1,
    breachMeters: 85,
    isolatedPopEst: 7600,
  },
  {
    id: 'REP-NEPAL-003',
    theaterId: 'nepal',
    featureType: 'bridge',
    featureName: 'Nepalthok Sunkoshi Confluence Bridgehead',
    roadName: 'Mid-Hill Highway Confluence at BP Highway',
    coordinates: [27.4280, 85.8350],
    reportedCondition: 'Gravel and mud inundation over bridgehead exceeding 1.4m depth from combined Roshi and Sunkoshi flash flood backflow',
    normalizedStatus: 'UNDER_REPAIR',
    source: 'Department of Roads Heavy Equipment Division & Sindhuli DAO',
    sourceUrl: '',
    observationTime: '2024-09-29T10:00:00Z',
    retrievalTime: '',
    verificationStatus: 'REPORTED/UNVERIFIED',
    attachments: [
      {
        type: 'document',
        title: 'DoR Heavy Machinery Clearance Log',
        caption: 'Bulldozers and wheel loaders clearing alluvial debris deposit; temporary track opening',
        credit: 'DoR Sindhuli Division Engineer',
        license: 'Government Public Record',
      },
    ],
    notes: 'Single-lane emergency military convoy passage opened under strict convoy control.',
    uncertainty: 'Confluence backwater surge risk if precipitation intensifies in upper Sun Kosi.',
    chokePointIdx: 2,
    breachMeters: 95,
    isolatedPopEst: 8200,
  },
];

export class IncidentReportService {
  private reports: IncidentDamageReport[] = [...INCIDENT_REPORTS];

  public getAllReports(): IncidentDamageReport[] {
    return [...this.reports];
  }

  public getReportsByTheater(theaterId: string): IncidentDamageReport[] {
    return this.reports.filter((r) => r.theaterId === theaterId);
  }

  public getReportById(id: string): IncidentDamageReport | undefined {
    return this.reports.find((r) => r.id === id);
  }

  public searchReports(
    theaterId: string,
    query: string,
    statusFilter?: DamageReportStatus | 'ALL'
  ): IncidentDamageReport[] {
    const q = query.trim().toLowerCase();
    return this.getReportsByTheater(theaterId).filter((r) => {
      const matchesQuery =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.featureName.toLowerCase().includes(q) ||
        r.roadName.toLowerCase().includes(q) ||
        r.reportedCondition.toLowerCase().includes(q) ||
        r.source.toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter || statusFilter === 'ALL' || r.normalizedStatus === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }

  public getStatusBreakdown(theaterId: string): Record<DamageReportStatus, number> {
    const breakdown: Record<DamageReportStatus, number> = {
      UNASSESSED: 0,
      REPORTED_DAMAGED: 0,
      REPORTED_DESTROYED: 0,
      UNDER_REPAIR: 0,
      REPORTED_RESTORED: 0,
      VERIFIED: 0,
      CONFLICTING_REPORTS: 0,
      UNKNOWN: 0,
    };
    for (const r of this.getReportsByTheater(theaterId)) {
      breakdown[r.normalizedStatus] = (breakdown[r.normalizedStatus] || 0) + 1;
    }
    return breakdown;
  }
}

export const incidentReportService = new IncidentReportService();
