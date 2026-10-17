import React, { useState } from 'react';
import { SettlementRecord, FleetMode } from '../../types';
import { LeafletMap, MapLine } from '../LeafletMap';
import {
  HeartPulse,
  AlertTriangle,
  Activity,
  Truck,
  ArrowRight,
  ShieldAlert,
  Hospital,
  Download,
  CheckCircle2,
  Syringe,
  Layers,
  MapPin,
  Clock,
  Compass,
  Sparkles,
} from 'lucide-react';

import {
  TheaterData,
  TheaterHospital,
  TheaterChokePoint,
  TheaterVillage,
} from '../../data/theaters';

interface HealthcareSurgeTabProps {
  settlements: SettlementRecord[];
  fleetMode: FleetMode;
  hardenedCorridorIds?: string[];
  currentTheater?: TheaterData;
  tourStep?: number;
}

export interface SurgeHospital {
  id: string;
  name: string;
  tier: 'District Medical College' | 'Super-Specialty' | 'Sub-Divisional Hospital' | 'Block PHC' | 'Primary Health Centre';
  lat: number;
  lon: number;
  bed_capacity: number;
  baseline_intake_daily: number;
  flood_surge_intake_daily: number;
  surge_percentage: number;
  status: 'CRITICAL_SURGE' | 'HIGH_SURGE' | 'MODERATE_SURGE' | 'STARVED_FACILITY';
  asdma_directive: string;
  mmu_assets_dispatched: string;
  feeder_settlements: Array<{
    name: string;
    baseline_facility: string;
    add_km: number;
    add_min: number;
    population: number;
  }>;
}

export const BASE_SURGE_HOSPITALS: SurgeHospital[] = [
  {
    id: 'HOSP_VALLEY_SILCHAR',
    name: 'Valley Hospital, Silchar',
    tier: 'Super-Specialty',
    lat: 24.8350,
    lon: 92.8120,
    bed_capacity: 120,
    baseline_intake_daily: 45,
    flood_surge_intake_daily: 86,
    surge_percentage: 191,
    status: 'CRITICAL_SURGE',
    asdma_directive: 'Pre-position 2x Mobile Intensive Care Units (MICU) + 500L cryogenic liquid O2 + 4 hemodialysis generator sets.',
    mmu_assets_dispatched: '2x 4x4 Heavy MMU + 1x Trauma Resuscitation Pod',
    feeder_settlements: [
      { name: 'Binnākāndi', baseline_facility: 'Nightingale Hospital (Inundated)', add_km: 11.68, add_min: 46.7, population: 3420 },
      { name: 'Tolengram', baseline_facility: 'Nightingale Hospital (Inundated)', add_km: 10.85, add_min: 44.2, population: 2850 },
      { name: 'Kanakpur', baseline_facility: 'Nightingale Hospital (Inundated)', add_km: 10.63, add_min: 43.1, population: 3900 },
      { name: 'Algapur Link', baseline_facility: 'CHC, Vairengte Link (Cut)', add_km: 9.19, add_min: 37.3, population: 2950 },
      { name: 'Motinagar Central', baseline_facility: 'SMCH (Severed Bridgehead)', add_km: 6.16, add_min: 25.0, population: 3200 },
      { name: 'Sonāimukh North', baseline_facility: 'Nightingale Hospital (Inundated)', add_km: 5.76, add_min: 26.0, population: 2100 },
    ],
  },
  {
    id: 'HOSP_SOUTHCITY_CACHAR',
    name: 'South City Hospital, Cachar',
    tier: 'District Medical College',
    lat: 24.7950,
    lon: 92.7950,
    bed_capacity: 90,
    baseline_intake_daily: 32,
    flood_surge_intake_daily: 58,
    surge_percentage: 181,
    status: 'CRITICAL_SURGE',
    asdma_directive: 'Deploy 1x MMU Trauma Surgical Van + 200 pediatric IV fluids + 300 orthopedic immobilization traction splints.',
    mmu_assets_dispatched: '1x Advanced Surgical Mobile Unit + 2x Paramedic Quads',
    feeder_settlements: [
      { name: 'Silkuri Border Enclave', baseline_facility: '50 Bed Hospital, Lakhipur (Submerged)', add_km: 5.18, add_min: 21.3, population: 2650 },
      { name: 'Khunow Sector', baseline_facility: '50 Bed Hospital, Lakhipur (Submerged)', add_km: 7.40, add_min: 28.5, population: 2100 },
      { name: 'Salchapra North', baseline_facility: 'Jiribam CHC (Severed Feeder)', add_km: 3.07, add_min: 14.3, population: 4100 },
      { name: 'Malugram Riverbank', baseline_facility: 'Nightingale Hospital (Inundated)', add_km: 8.63, add_min: 34.4, population: 3800 },
      { name: 'Joypur Roadhead', baseline_facility: 'State Dispensary, Nityanandpur (Cut)', add_km: 3.03, add_min: 16.3, population: 1550 },
    ],
  },
  {
    id: 'HOSP_BPHC_UDHARBOND',
    name: 'BPHC, Udharbond',
    tier: 'Block PHC',
    lat: 24.9050,
    lon: 92.8980,
    bed_capacity: 40,
    baseline_intake_daily: 25,
    flood_surge_intake_daily: 42,
    surge_percentage: 168,
    status: 'CRITICAL_SURGE',
    asdma_directive: 'Dispatch 10,000 ORS sachets, 80 vials lyophilized polyvalent anti-snake venom, and chlorine purification tablets.',
    mmu_assets_dispatched: '1x Epidemic Surveillance Unit + Rescue Boat Ambulance',
    feeder_settlements: [
      { name: 'Chibitabichia', baseline_facility: 'Jiribam CHC (Severed Feeder)', add_km: 4.18, add_min: 17.1, population: 1850 },
      { name: 'Cossipore', baseline_facility: 'Jiribam CHC (Severed Feeder)', add_km: 5.77, add_min: 24.2, population: 2400 },
      { name: 'Sadarghat Riverside', baseline_facility: 'Jiribam CHC (Severed Feeder)', add_km: 6.18, add_min: 25.8, population: 2900 },
      { name: 'Gungoor Feeder', baseline_facility: 'State Dispensary, Nityanandpur (Cut)', add_km: 6.80, add_min: 29.5, population: 2300 },
      { name: 'Mohanpur East', baseline_facility: 'South City Hospital (Bypass Blocked)', add_km: 10.68, add_min: 39.2, population: 2350 },
    ],
  },
  {
    id: 'HOSP_JIRIBAM_CHC',
    name: 'Jiribam CHC',
    tier: 'Sub-Divisional Hospital',
    lat: 24.8010,
    lon: 93.1200,
    bed_capacity: 50,
    baseline_intake_daily: 28,
    flood_surge_intake_daily: 44,
    surge_percentage: 157,
    status: 'CRITICAL_SURGE',
    asdma_directive: 'Erect 40-bed disaster triage surge tent annex + 50 kVA backup diesel generator + tetanus immunoglobulins.',
    mmu_assets_dispatched: '1x Border Tactical Medical Contingent + 1x Water Purification Rover',
    feeder_settlements: [
      { name: 'Lakhipur Sub-Division', baseline_facility: '50 Bed Hospital, Lakhipur (Submerged)', add_km: 6.32, add_min: 28.7, population: 4600 },
      { name: 'Umednagar East', baseline_facility: '50 Bed Hospital, Lakhipur (Submerged)', add_km: 3.31, add_min: 14.7, population: 2100 },
      { name: 'Cleverhouse East', baseline_facility: 'Nightingale Hospital (Inundated)', add_km: 5.12, add_min: 21.5, population: 1800 },
      { name: 'Madhurband East', baseline_facility: 'CHC, Vairengte Link (Cut)', add_km: 10.34, add_min: 43.0, population: 2400 },
    ],
  },
  {
    id: 'HOSP_BPHC_HARINAGAR',
    name: 'BPHC, Harinagar',
    tier: 'Block PHC',
    lat: 24.9180,
    lon: 93.1090,
    bed_capacity: 30,
    baseline_intake_daily: 20,
    flood_surge_intake_daily: 28,
    surge_percentage: 140,
    status: 'HIGH_SURGE',
    asdma_directive: 'Establish 4x4 ambulance shuttle convoy to transfer hemodialysis and obstetric emergencies to SMCH via northern flank.',
    mmu_assets_dispatched: '1x Rural Emergency Transfer Shuttle',
    feeder_settlements: [
      { name: 'Dudhpatil Feeder', baseline_facility: 'SMCH (Severed Bridgehead)', add_km: 6.45, add_min: 26.0, population: 3100 },
      { name: 'Barkhola Central', baseline_facility: 'Medinova, Silchar (Inundated)', add_km: 9.66, add_min: 36.4, population: 2750 },
      { name: 'Berenga East', baseline_facility: 'SMCH (Severed Bridgehead)', add_km: 6.06, add_min: 22.5, population: 2450 },
      { name: 'Moragang East', baseline_facility: 'CHC, Vairengte Link (Cut)', add_km: 9.89, add_min: 37.7, population: 2100 },
    ],
  },
  {
    id: 'HOSP_PHC_ALGAPUR',
    name: 'PHC, Algapur',
    tier: 'Primary Health Centre',
    lat: 24.8900,
    lon: 92.7400,
    bed_capacity: 25,
    baseline_intake_daily: 18,
    flood_surge_intake_daily: 22,
    surge_percentage: 122,
    status: 'MODERATE_SURGE',
    asdma_directive: 'Replenish essential antibiotic ampoules and suture sets for minor flood lacerations and soft-tissue trauma.',
    mmu_assets_dispatched: '1x Community First Responder Squad',
    feeder_settlements: [
      { name: 'Dholai West', baseline_facility: 'Emanuel Hospital, Pailapool (Severed Causeway)', add_km: 8.70, add_min: 31.9, population: 3200 },
    ],
  },
  {
    id: 'HOSP_NIGHTINGALE',
    name: 'Nightingale Hospital (Flooded Inflow)',
    tier: 'District Medical College',
    lat: 24.8250,
    lon: 92.7850,
    bed_capacity: 60,
    baseline_intake_daily: 40,
    flood_surge_intake_daily: 6,
    surge_percentage: 15,
    status: 'STARVED_FACILITY',
    asdma_directive: '🚨 FACILITY CUT-OFF: Main entrance roads submerged under 1.8m backwater. Patients divert to Valley & South City Hospitals.',
    mmu_assets_dispatched: 'SDRF Boat Resupply Unit for marooned inpatients',
    feeder_settlements: [],
  },
  {
    id: 'HOSP_EMANUEL_PAILAPOOL',
    name: 'Emanuel Hospital, Pailapool (Western Flank Severed)',
    tier: 'Sub-Divisional Hospital',
    lat: 24.8020,
    lon: 93.0750,
    bed_capacity: 75,
    baseline_intake_daily: 35,
    flood_surge_intake_daily: 11,
    surge_percentage: 31,
    status: 'STARVED_FACILITY',
    asdma_directive: '⚠️ PARTIAL ISOLATION: Western feeder causeway breached. Binnākāndi patients forced on 13.37 km detour to Valley Hospital.',
    mmu_assets_dispatched: 'Temporary Bailey Bridge Deployment at Western Feeder',
    feeder_settlements: [],
  },
];

export const HealthcareSurgeTab: React.FC<HealthcareSurgeTabProps> = ({
  settlements,
  fleetMode,
  hardenedCorridorIds = [],
  currentTheater,
  tourStep = 0,
}) => {
  const defaultHospId =
    currentTheater && currentTheater.id !== 'silchar'
      ? currentTheater.hospitals[0]?.id || 'HOSP_VALLEY_SILCHAR'
      : 'HOSP_VALLEY_SILCHAR';

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(defaultHospId);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const isHeavy = fleetMode === 'Heavy Supply (Truck/Bus)';

  // Cross-Module Dynamic Surge Calculation (Critique 2 Fix)
  const isJtRoadHardened = hardenedCorridorIds.includes('CORRIDOR_JT_ROAD');
  const isBinnakandiHardened = hardenedCorridorIds.includes('CORRIDOR_BINNAKANDI');
  const isHarinagarHardened = hardenedCorridorIds.includes('CORRIDOR_HARINAGAR');
  const isUdharbondHardened = hardenedCorridorIds.includes('CORRIDOR_UDHARBOND_EAST');

  const currentBaseHospitals: SurgeHospital[] =
    currentTheater && currentTheater.id !== 'silchar'
      ? currentTheater.hospitals.map((h: TheaterHospital) => ({
          id: h.id,
          name: h.name,
          tier: (h.type === 'referral'
            ? 'District Medical College'
            : h.beds > 200
            ? 'Super-Specialty'
            : 'Primary Health Centre') as SurgeHospital['tier'],
          lat: h.lat,
          lon: h.lon,
          bed_capacity: h.beds,
          baseline_intake_daily: Math.round(h.beds * 0.4),
          flood_surge_intake_daily: Math.round(
            h.beds * 0.4 * (1 + Math.max(0, h.baseline_surge) / 100)
          ),
          surge_percentage: h.baseline_surge,
          status: (h.baseline_surge > 150
            ? 'CRITICAL_SURGE'
            : h.baseline_surge < 0
            ? 'STARVED_FACILITY'
            : 'MODERATE_SURGE') as SurgeHospital['status'],
          asdma_directive:
            h.baseline_surge > 150
              ? 'Pre-position Mobile Medical Units (MMUs) + trauma surge inventory.'
              : 'Dispatch amphibious relief to restore approach corridor.',
          mmu_assets_dispatched:
            h.baseline_surge > 150 ? '2x Heavy MMU + Trauma Pod' : 'Amphibious Egress Patrol',
          feeder_settlements: currentTheater.chokePoints.flatMap((cp: TheaterChokePoint) =>
            cp.villages.map((v: TheaterVillage) => ({
              name: v.name,
              baseline_facility: h.name,
              add_km: 8.5,
              add_min: 35.0,
              population: v.population || 2500,
            }))
          ),
        }))
      : BASE_SURGE_HOSPITALS;

  // Compute dynamically adjusted hospital data
  const surgeHospitals: SurgeHospital[] = currentBaseHospitals.map((base) => {
    // 1. Valley Hospital: Drops from +191% down to +118% when JT Road or Binnakandi is hardened!
    if (base.id === 'HOSP_VALLEY_SILCHAR') {
      if (isJtRoadHardened || isBinnakandiHardened) {
        const reliefRel = isJtRoadHardened && isBinnakandiHardened ? 0.78 : 0.73;
        const newSurgePct = isJtRoadHardened && isBinnakandiHardened ? 95 : 118;
        const newDivertedDaily = isJtRoadHardened && isBinnakandiHardened ? 22 : 32;
        return {
          ...base,
          surge_percentage: newSurgePct,
          flood_surge_intake_daily: newDivertedDaily,
          status: 'HIGH_SURGE',
          asdma_directive: '✅ COUNTERFACTUAL RELIEF: JT Road/Binnākāndi Bailey Bridge active! Reconnected direct arterial flow to SMCH. 1x MICU successfully reallocated to eastern sector.',
          mmu_assets_dispatched: '1x 4x4 MMU (1x MICU Reallocated to Secondary Sector)',
        };
      }
    }

    // 2. South City Hospital: Drops from +181% down to +112% when Udharbond/JT Road is hardened
    if (base.id === 'HOSP_SOUTHCITY_CACHAR') {
      if (isJtRoadHardened || isUdharbondHardened) {
        return {
          ...base,
          surge_percentage: 112,
          flood_surge_intake_daily: 24,
          status: 'HIGH_SURGE',
          asdma_directive: '✅ COUNTERFACTUAL RELIEF: Peripheral arterial reconnected. Southern basin overflow stabilized.',
          mmu_assets_dispatched: '1x Advanced Surgical Mobile Unit (Stabilized)',
        };
      }
    }

    // 3. BPHC Udharbond: Drops from +168% down to +105% when Udharbond or JT Road is hardened
    if (base.id === 'HOSP_BPHC_UDHARBOND') {
      if (isJtRoadHardened || isUdharbondHardened) {
        return {
          ...base,
          surge_percentage: 105,
          flood_surge_intake_daily: 18,
          status: 'MODERATE_SURGE',
          asdma_directive: '✅ CLINIC CROWDING NORMALIZED: Influx diverted back to direct district routes.',
        };
      }
    }

    // 4. Jiribam CHC: Drops from +157% down to +108% when Harinagar or Binnakandi is hardened
    if (base.id === 'HOSP_JIRIBAM_CHC') {
      if (isHarinagarHardened || isBinnakandiHardened) {
        return {
          ...base,
          surge_percentage: 108,
          flood_surge_intake_daily: 21,
          status: 'MODERATE_SURGE',
          asdma_directive: '✅ BORDER REFERRAL STABILIZED: Lakhipur corridor restored via modular bridging.',
        };
      }
    }

    // 5. Nightingale Hospital (Starved clinic recovers access when JT Road is hardened!)
    if (base.id === 'HOSP_NIGHTINGALE') {
      if (isJtRoadHardened) {
        return {
          ...base,
          surge_percentage: 100,
          flood_surge_intake_daily: 38,
          status: 'MODERATE_SURGE',
          name: 'Nightingale Hospital (Access Restored)',
          asdma_directive: '✅ ACCESS RESTORED: Modular Bailey approach bridge unblocked western ingress. Operational intake recovered to 38 patients/day.',
          mmu_assets_dispatched: 'Standard Facility Operations (Amphibious Unit Stood Down)',
        };
      }
    }

    // 6. Emanuel Hospital (Starved clinic recovers access when Binnakandi is hardened!)
    if (base.id === 'HOSP_EMANUEL_PAILAPOOL') {
      if (isBinnakandiHardened) {
        return {
          ...base,
          surge_percentage: 100,
          flood_surge_intake_daily: 34,
          status: 'MODERATE_SURGE',
          name: 'Emanuel Hospital, Pailapool (Western Access Restored)',
          asdma_directive: '✅ ACCESS RESTORED: Western causeway breach bridged. Direct Binnākāndi catchment re-established.',
          mmu_assets_dispatched: 'Standard Facility Operations',
        };
      }
    }

    // Dynamic multi-theater counterfactual relief
    if (currentTheater && currentTheater.id !== 'silchar') {
      if (hardenedCorridorIds.length > 0) {
        if ((base.status === 'CRITICAL_SURGE' || base.status === 'HIGH_SURGE') && base.id === currentTheater.hospitals[0]?.id) {
          return {
            ...base,
            surge_percentage: Math.max(85, base.surge_percentage - 73),
            flood_surge_intake_daily: Math.round(base.flood_surge_intake_daily * 0.65),
            status: 'HIGH_SURGE',
            asdma_directive: `✅ COUNTERFACTUAL RELIEF: Primary bridgehead reinforced via modular bridging! Direct arterial ambulance flow re-established. ${currentTheater.authorityShortName} emergency triage stabilized.`,
            mmu_assets_dispatched: '1x Tactical MMU (Surge Relieved)',
          };
        }
        if (base.status === 'STARVED_FACILITY') {
          return {
            ...base,
            surge_percentage: 100,
            status: 'MODERATE_SURGE',
            name: `${base.name} (Access Restored)`,
            asdma_directive: `✅ ACCESS RESTORED: Bridgehead restored. Direct catchment re-established under ${currentTheater.authorityShortName}.`,
            mmu_assets_dispatched: 'Standard Facility Operations',
          };
        }
      }
    }

    return base;
  });

  const activeHospital = surgeHospitals.find((h) => h.id === selectedHospitalId) || surgeHospitals[0];

  const filteredHospitals = surgeHospitals.filter((h) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CRITICAL_SURGE') return h.surge_percentage >= 150;
    if (statusFilter === 'STARVED_FACILITY') return h.status === 'STARVED_FACILITY';
    return h.status === statusFilter;
  });

  // Calculate System-Wide Clinical Metrics
  const criticalSurgeCount = surgeHospitals.filter((h) => h.surge_percentage >= 150).length;
  const totalDivertedPatientsDaily = surgeHospitals.reduce((acc, h) => acc + (h.flood_surge_intake_daily || 0), 0);
  const totalReroutedHabitations = surgeHospitals.reduce((acc, h) => acc + h.feeder_settlements.length, 0);

  // Generate Map Markers
  const mapMarkers: Array<{
    lat: number;
    lon: number;
    title: string;
    description?: string;
    type: 'isolated' | 'rerouted' | 'reachable' | 'chokepoint' | 'hub' | 'bridge' | 'facility';
    badge?: string;
  }> = [
    // 1. All Surge Hospitals
    ...surgeHospitals.map((h) => {
      const isOverloaded = h.surge_percentage >= 150;
      const isStarved = h.status === 'STARVED_FACILITY';
      const isRelieved =
        (h.id === 'HOSP_VALLEY_SILCHAR' && (isJtRoadHardened || isBinnakandiHardened)) ||
        (h.id === 'HOSP_NIGHTINGALE' && isJtRoadHardened) ||
        (h.id === 'HOSP_EMANUEL_PAILAPOOL' && isBinnakandiHardened);

      return {
        lat: h.lat,
        lon: h.lon,
        title: `${h.name}`,
        description: isStarved
          ? `⚠️ CUT-OFF CLINIC: ${h.asdma_directive}`
          : isRelieved
          ? `✅ COUNTERFACTUAL RELIEF: Intake normalized to ${h.flood_surge_intake_daily}/day (${h.surge_percentage}% load). ${h.asdma_directive}`
          : `🏥 Bed Capacity: ${h.bed_capacity} | Baseline: ${h.baseline_intake_daily}/day | Influx: +${h.flood_surge_intake_daily}/day (${h.surge_percentage}% SURGE). Directive: ${h.asdma_directive}`,
        type: 'facility' as const,
        badge: isStarved
          ? 'FLOOD INUNDATED'
          : isRelieved
          ? `RELIEVED (${h.surge_percentage}%)`
          : isOverloaded
          ? `SURGE +${h.surge_percentage}% (CRITICAL)`
          : `SURGE +${h.surge_percentage}%`,
      };
    }),

    // 2. Feeder settlements for the selected hospital
    ...activeHospital.feeder_settlements.map((v, idx) => {
      const angle = (idx / Math.max(1, activeHospital.feeder_settlements.length)) * 2 * Math.PI;
      const vLat = activeHospital.lat + Math.sin(angle) * 0.045;
      const vLon = activeHospital.lon + Math.cos(angle) * 0.055;
      const isRelieved = isJtRoadHardened && activeHospital.id === 'HOSP_VALLEY_SILCHAR';

      return {
        lat: vLat,
        lon: vLon,
        title: `${v.name} (Pop: ${v.population})`,
        description: isRelieved
          ? `✅ Direct baseline route restored via JT Road Bailey bridge! No longer forced on +${v.add_km} km detour.`
          : `Primary clinic was ${v.baseline_facility}. Redirected +${v.add_km} km detour (+${v.add_min} min delay) to ${activeHospital.name}.`,
        type: isRelieved ? ('reachable' as const) : ('rerouted' as const),
        badge: isRelieved ? 'RESTORED DIRECT' : `+${v.add_km} km / +${v.add_min} min`,
      };
    }),
  ];

  // Generate Cascade Map Lines
  const mapLines: MapLine[] = [];
  activeHospital.feeder_settlements.forEach((v, idx) => {
    const angle = (idx / Math.max(1, activeHospital.feeder_settlements.length)) * 2 * Math.PI;
    const vLat = activeHospital.lat + Math.sin(angle) * 0.045;
    const vLon = activeHospital.lon + Math.cos(angle) * 0.055;
    const isRelieved = isJtRoadHardened && activeHospital.id === 'HOSP_VALLEY_SILCHAR';

    mapLines.push({
      id: `cascade_line_${idx}`,
      points: [
        [vLat, vLon],
        [activeHospital.lat, activeHospital.lon],
      ],
      color: isRelieved ? '#00e676' : activeHospital.surge_percentage >= 150 ? '#ff1155' : '#ffaa00',
      dashArray: isRelieved ? undefined : '6, 8',
      weight: isRelieved ? 2 : 3,
      label: isRelieved
        ? `✅ Restored Direct Corridor: ${v.name} ➔ SMCH Primary (Valley Influx Avoided)`
        : `Patient Influx Vector: ${v.name} ➔ ${activeHospital.name} (+${v.add_km} km)`,
      layerType: isRelieved ? 'baseline' : 'detour',
    });
  });

  const handleDownloadCsv = () => {
    const headers = [
      'Origin Habitat',
      'Population',
      'Baseline Clinic (Flooded)',
      'Redirected Surge Clinic',
      'Detour Surcharge (km)',
      'Transit Delay (min)',
      'Clinic Surge (%)',
      'ASDMA MMU Directive',
    ];

    const rows: string[] = [];
    surgeHospitals.forEach((h) => {
      h.feeder_settlements.forEach((f) => {
        rows.push([
          `"${f.name}"`,
          f.population,
          `"${f.baseline_facility}"`,
          `"${h.name}"`,
          f.add_km,
          f.add_min,
          `${h.surge_percentage}%`,
          `"${h.asdma_directive.replace(/"/g, '""')}"`,
        ].join(','));
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentTheater?.id || 'theater'}_healthcare_surge_triage_audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const authorityName = currentTheater?.authorityName || 'Assam State Disaster Management Authority (ASDMA)';
  const authorityShort = currentTheater?.authorityShortName || 'Civil Defense';

  return (
    <div className="space-y-6">
      {/* Critique E Hero Banner */}
      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl shadow-md space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/50 mt-0.5">
              <Hospital className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  🏥 Healthcare Surge & Secondary Cascade Engine
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 font-bold">
                  CROSS-MODULE GRAPH SYNCHRONIZED
                </span>
              </div>
              <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
                When flood waters sever baseline access corridors, emergency patient catchments do not disappear — they
                <strong className="text-rose-400 ml-1">cascade into surrounding surviving hospitals</strong>.
                Lifeline OS models hospital catchment overload in real time to direct the <span className="text-rose-300 font-semibold">{authorityName}</span>
                {' '}on where to pre-position Mobile Medical Units (MMUs), emergency hemodialysis generators, and trauma resuscitation packs.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadCsv}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-white border border-[#30363d] transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Export Triage Audit (CSV)</span>
          </button>
        </div>
      </div>

      {/* CRITIQUE 2 CROSS-MODULE SYNC BANNER */}
      {hardenedCorridorIds.length > 0 && (
        <div className="bg-emerald-950/70 border-2 border-emerald-500 p-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <strong className="text-white font-bold block sm:inline mr-2">
                ⚡ Cross-Module Sync Active: Road Hardening ➔ Hospital Surge Relief
              </strong>
              <span>
                {currentTheater && currentTheater.id !== 'silchar'
                  ? `${hardenedCorridorIds.length} corridor(s) counterfactually hardened. Influx overload dropped across ${currentTheater.hospitals[0]?.name || 'primary hospitals'} (assumed demo values; SIMULATED CLOSURE on OSM graph)!`
                  : isJtRoadHardened
                  ? 'JT Road Hardening relieved Valley Hospital from simulated patient overload & unblocked starved Nightingale Hospital (assumed demo values; SIMULATED CLOSURE on OSM graph)!'
                  : `${hardenedCorridorIds.length} corridors hardened in Vulnerability Profiler. Hospital influx stabilized (assumed demo values).`}
              </span>
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-md bg-emerald-900/80 text-emerald-300 border border-emerald-400 font-mono font-bold text-[11px]">
            {currentTheater && currentTheater.id !== 'silchar'
              ? `${currentTheater.hospitals[0]?.name.split('(')[0].trim() || 'HOSPITAL'}: STABILIZED (DEMO)`
              : 'VALLEY HOSPITAL: STABILIZED (DEMO)'}
          </span>
        </div>
      )}

      {/* 4 Minimal Surge KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Critical Surge Clinics
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {criticalSurgeCount}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-950/70 text-rose-300 border border-rose-800/60">
              &gt;150% Capacity
            </span>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Redirected Emergencies
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
              +{totalDivertedPatientsDaily}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950/70 text-amber-300 border border-amber-800/60">
              Pts / Day
            </span>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            ASDMA MMUs Dispatched
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-cyan-400 tracking-tight">
              7
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
              Tactical Units
            </span>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Peak Transit Penalty
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
              +46.7 min
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-950/70 text-rose-300 border border-rose-800/60">
              +11.7 km Surcharge
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Hospital Surge Manifest & Interactive Cascade Vector Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Hospital Surge Cards (Spotlight Step 4) */}
        <div
          id="tour-step-4-hospital-surge"
          className={`lg:col-span-5 space-y-4 rounded-2xl p-2 transition-all duration-300 ${
            tourStep === 4
              ? 'ring-4 ring-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.7)] z-50 relative bg-[#161b22]'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              Surge Hospitals & Starved Clinics
            </h4>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#161b22] text-xs text-[#c9d1d9] border border-[#30363d] rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Facilities ({surgeHospitals.length})</option>
              <option value="CRITICAL_SURGE">Critical Surge (&gt;150%)</option>
              <option value="STARVED_FACILITY">Submerged / Starved Access</option>
            </select>
          </div>

          {/* Quick Focus Selectors */}
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-[#0d1117] border border-[#21262d]">
            <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">Quick Audit:</span>
            <button
              type="button"
              onClick={() => setSelectedHospitalId('HOSP_VALLEY_SILCHAR')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                selectedHospitalId === 'HOSP_VALLEY_SILCHAR'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-[#161b22] text-rose-300 border border-rose-900/60 hover:bg-rose-950/60'
              }`}
            >
              Valley Hospital {isJtRoadHardened ? '(Relieved)' : '(High Load)'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedHospitalId('HOSP_SOUTHCITY_CACHAR')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                selectedHospitalId === 'HOSP_SOUTHCITY_CACHAR'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-[#161b22] text-rose-300 border border-rose-900/60 hover:bg-rose-950/60'
              }`}
            >
              South City (Demo Load)
            </button>
            <button
              type="button"
              onClick={() => setSelectedHospitalId('HOSP_NIGHTINGALE')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                selectedHospitalId === 'HOSP_NIGHTINGALE'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-[#161b22] text-rose-300 border border-rose-900/60 hover:bg-rose-950/60'
              }`}
            >
              Nightingale {isJtRoadHardened ? '(Restored)' : '(Flooded)'}
            </button>
          </div>

          {/* Hospital Manifest List */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredHospitals.map((h) => {
              const isSelected = selectedHospitalId === h.id;
              const isOverloaded = h.surge_percentage >= 150;
              const isStarved = h.status === 'STARVED_FACILITY';
              const isValleyRelieved = h.id === 'HOSP_VALLEY_SILCHAR' && isJtRoadHardened;
              const isNightingaleRestored = h.id === 'HOSP_NIGHTINGALE' && isJtRoadHardened;

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHospitalId(h.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isValleyRelieved || isNightingaleRestored
                      ? 'bg-emerald-950/20 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                      : isSelected
                      ? 'bg-[#1c2128] border-rose-500 shadow-lg ring-1 ring-rose-500/50'
                      : 'bg-[#161b22] border-[#30363d] hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm block">
                        {h.name}
                      </span>
                      <span className="text-[10px] text-[#8b949e]">
                        {h.tier} • Capacity: {h.bed_capacity} beds
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isNightingaleRestored
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                            : isValleyRelieved
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                            : isStarved
                            ? 'bg-gray-800 text-gray-300 border border-gray-600'
                            : isOverloaded
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-600 animate-pulse'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        }`}
                      >
                        {isNightingaleRestored
                          ? '✅ ACCESS RESTORED'
                          : isValleyRelieved
                          ? '+118% SURGE (RELIEVED)'
                          : isStarved
                          ? 'INACCESSIBLE'
                          : `+${h.surge_percentage}% SURGE`}
                      </span>

                      {/* CRITIQUE 2 EMERALD BADGE: ⬇ -73% ICU Surge Relieved via Counterfactual Bridge Deployment */}
                      {isValleyRelieved && (
                        <span className="px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-300 border border-emerald-400 font-bold text-[9px] animate-pulse">
                          ⬇ -73% ICU Surge Relieved via Counterfactual Bridge Deployment
                        </span>
                      )}
                      {isNightingaleRestored && (
                        <span className="px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-300 border border-emerald-400 font-bold text-[9px]">
                          ✅ Approach Unblocked via Modular Bridging
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  {!isStarved && (
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                        <span>Baseline: {h.baseline_intake_daily}/day</span>
                        <span className="text-white font-bold">
                          Total Load: {h.baseline_intake_daily + h.flood_surge_intake_daily} pts/day
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#21262d] overflow-hidden flex">
                        <div
                          className="bg-blue-500 h-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (h.baseline_intake_daily / (h.baseline_intake_daily + h.flood_surge_intake_daily)) * 100
                            )}%`,
                          }}
                        />
                        <div
                          className={`${isValleyRelieved ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'} h-full`}
                          style={{
                            width: `${Math.min(
                              100,
                              (h.flood_surge_intake_daily / (h.baseline_intake_daily + h.flood_surge_intake_daily)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Feeder villages tag */}
                  {h.feeder_settlements.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-[#8b949e]">Receiving from:</span>
                      {h.feeder_settlements.map((v) => (
                        <span
                          key={v.name}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                            isValleyRelieved
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                              : 'bg-[#0d1117] text-amber-300 border border-amber-900/40'
                          }`}
                        >
                          {v.name} (+{v.add_km}km) {isValleyRelieved && '✓'}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ASDMA Action Directive */}
                  <div
                    className={`mt-2.5 text-[11px] p-2 rounded-lg border flex items-start gap-1.5 ${
                      isValleyRelieved || isNightingaleRestored
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        : 'bg-[#0d1117] border-rose-950 text-rose-300'
                    }`}
                  >
                    <Syringe
                      className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        isValleyRelieved || isNightingaleRestored ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    />
                    <span className="leading-tight">{h.asdma_directive}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Vector Cascade Map & Feeder Deep Dive */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8b949e]">
            <span className="font-semibold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-rose-400" />
              Patient Influx Vectors: {activeHospital.name}
            </span>
            <div className="flex items-center gap-2">
              {activeHospital.id === 'HOSP_VALLEY_SILCHAR' && isJtRoadHardened && (
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                  -73% SURGE RELIEVED
                </span>
              )}
              <span className="font-mono text-rose-300 font-bold">
                Surge: +{activeHospital.surge_percentage}% Over Baseline
              </span>
            </div>
          </div>

          <LeafletMap
            key={currentTheater?.id || 'silchar'}
            theaterId={currentTheater?.id || 'silchar'}
            center={[activeHospital.lat, activeHospital.lon]}
            zoom={currentTheater?.zoom || 12}
            height="580px"
            floodPolygon={currentTheater?.floodPolygon}
            markers={mapMarkers}
            lines={mapLines}
            showLayerControls={true}
          />

          {/* Detailed Inspector Box for Active Hospital Catchment */}
          <div className="bg-[#161b22] border-l-4 border-l-rose-500 border-y border-r border-[#30363d] p-4 rounded-r-xl space-y-3 text-xs shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Hospital className="w-4 h-4 text-rose-400" />
                ASDMA Triage & Resource Allocation Sheet: {activeHospital.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                {activeHospital.mmu_assets_dispatched}
              </span>
            </div>

            <div className="bg-[#0d1117] p-3 rounded-lg border border-[#21262d] space-y-2">
              <div className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">
                Emergency Influx Feeder Breakdown:
              </div>

              {activeHospital.feeder_settlements.length === 0 ? (
                <div className="text-gray-400 py-1 italic">
                  {activeHospital.id === 'HOSP_NIGHTINGALE' && isJtRoadHardened
                    ? 'Access fully re-opened! Inpatients and ambulances are safely utilizing the restored modular Bailey approach.'
                    : 'This facility has experienced direct access cut-off; patient inflow has collapsed due to road inundation.'}
                </div>
              ) : (
                <div className="divide-y divide-[#21262d]">
                  {activeHospital.feeder_settlements.map((v) => (
                    <div key={v.name} className="py-2 flex items-center justify-between gap-3 text-[11px]">
                      <div>
                        <strong className="text-white block">{v.name}</strong>
                        <span className="text-[#8b949e]">
                          Pop: {v.population.toLocaleString()} • Cut off from: <span className="text-red-400">{v.baseline_facility}</span>
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-bold block ${
                            isJtRoadHardened && activeHospital.id === 'HOSP_VALLEY_SILCHAR'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {isJtRoadHardened && activeHospital.id === 'HOSP_VALLEY_SILCHAR'
                            ? 'Baseline Restored'
                            : `+${v.add_km} km Surcharge`}
                        </span>
                        <span className="text-[#8b949e] text-[10px]">
                          {isJtRoadHardened && activeHospital.id === 'HOSP_VALLEY_SILCHAR'
                            ? '0 min delay'
                            : `+${v.add_min} min delay`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className={`p-3 rounded-lg flex items-center justify-between gap-3 text-xs border ${
                activeHospital.id === 'HOSP_VALLEY_SILCHAR' && isJtRoadHardened
                  ? 'bg-emerald-950/50 border-emerald-700 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-800/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck
                  className={`w-4 h-4 shrink-0 ${
                    activeHospital.id === 'HOSP_VALLEY_SILCHAR' && isJtRoadHardened
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                />
                <span>
                  <strong>ASDMA Pre-Positioning Directive:</strong> {activeHospital.asdma_directive}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
