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
} from 'lucide-react';

interface HealthcareSurgeTabProps {
  settlements: SettlementRecord[];
  fleetMode: FleetMode;
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

export const SURGE_HOSPITALS: SurgeHospital[] = [
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
    mmu_assets_dispatched: '1x Epidemic Surveillance Unit + Zodiac Inflatable Ambulance',
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

export const HealthcareSurgeTab: React.FC<HealthcareSurgeTabProps> = ({ settlements, fleetMode }) => {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('HOSP_VALLEY_SILCHAR');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const isHeavy = fleetMode === 'Heavy Supply (Truck/Bus)';

  const activeHospital = SURGE_HOSPITALS.find((h) => h.id === selectedHospitalId) || SURGE_HOSPITALS[0];

  const filteredHospitals = SURGE_HOSPITALS.filter((h) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CRITICAL_SURGE') return h.surge_percentage >= 150;
    if (statusFilter === 'STARVED_FACILITY') return h.status === 'STARVED_FACILITY';
    return h.status === statusFilter;
  });

  // Calculate System-Wide Clinical Metrics
  const criticalSurgeCount = SURGE_HOSPITALS.filter((h) => h.surge_percentage >= 150).length;
  const totalDivertedPatientsDaily = SURGE_HOSPITALS.reduce((acc, h) => acc + (h.flood_surge_intake_daily || 0), 0);
  const totalReroutedHabitations = SURGE_HOSPITALS.reduce((acc, h) => acc + h.feeder_settlements.length, 0);

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
    ...SURGE_HOSPITALS.map((h) => {
      const isOverloaded = h.surge_percentage >= 150;
      const isStarved = h.status === 'STARVED_FACILITY';
      return {
        lat: h.lat,
        lon: h.lon,
        title: `${h.name} (${h.tier})`,
        description: isStarved
          ? `⚠️ CUT-OFF CLINIC: ${h.asdma_directive}`
          : `🏥 Bed Capacity: ${h.bed_capacity} | Baseline: ${h.baseline_intake_daily}/day | Influx: +${h.flood_surge_intake_daily}/day (${h.surge_percentage}% SURGE). Directive: ${h.asdma_directive}`,
        type: 'facility' as const,
        badge: isStarved
          ? 'FLOOD INUNDATED'
          : isOverloaded
          ? `SURGE +${h.surge_percentage}% (CRITICAL)`
          : `SURGE +${h.surge_percentage}%`,
      };
    }),

    // 2. Feeder settlements for the selected hospital
    ...activeHospital.feeder_settlements.map((v, idx) => {
      // Derive lat/lon based on active hospital centroid + offsets
      const angle = (idx / activeHospital.feeder_settlements.length) * 2 * Math.PI;
      const vLat = activeHospital.lat + Math.sin(angle) * 0.045;
      const vLon = activeHospital.lon + Math.cos(angle) * 0.055;
      return {
        lat: vLat,
        lon: vLon,
        title: `Rerouted Origin: ${v.name} (Pop: ${v.population})`,
        description: `Primary clinic was ${v.baseline_facility}. Redirected +${v.add_km} km detour (+${v.add_min} min delay) to ${activeHospital.name}.`,
        type: 'rerouted' as const,
        badge: `+${v.add_km} km / +${v.add_min} min`,
      };
    }),
  ];

  // Generate Cascade Map Lines
  const mapLines: MapLine[] = [];
  activeHospital.feeder_settlements.forEach((v, idx) => {
    const angle = (idx / activeHospital.feeder_settlements.length) * 2 * Math.PI;
    const vLat = activeHospital.lat + Math.sin(angle) * 0.045;
    const vLon = activeHospital.lon + Math.cos(angle) * 0.055;
    mapLines.push({
      id: `cascade_line_${idx}`,
      points: [
        [vLat, vLon],
        [activeHospital.lat, activeHospital.lon],
      ],
      color: activeHospital.surge_percentage >= 150 ? '#ff1155' : '#ffaa00',
      dashArray: '6, 8',
      weight: 3,
      label: `Patient Influx Vector: ${v.name} ➔ ${activeHospital.name} (+${v.add_km} km)`,
      layerType: 'detour',
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
    SURGE_HOSPITALS.forEach((h) => {
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
    link.setAttribute('download', 'cachar_healthcare_surge_triage_audit.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                  SURGE OVERLOAD &gt;150% FLAGGED
                </span>
              </div>
              <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
                When flood waters sever baseline access corridors, emergency patient catchments do not disappear — they
                <strong className="text-rose-400 ml-1">cascade into surrounding surviving hospitals</strong>.
                Lifeline OS models hospital catchment overload in real time to direct the Assam State Disaster Management Authority (ASDMA)
                on where to pre-position Mobile Medical Units (MMUs), emergency hemodialysis generators, and trauma resuscitation packs.
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

      {/* 4 Surge KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161b22] border border-rose-500/50 p-4 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <div className="flex items-center justify-between text-xs text-[#8b949e] uppercase font-semibold">
            <span>Critical Surge Clinics (&gt;150%)</span>
            <span className="pulse-danger" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {criticalSurgeCount} Facilities
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1">
            Valley Hospital, South City, Udharbond, Jiribam CHC
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="text-xs text-[#8b949e] uppercase font-semibold">Redirected Patient Flow</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            +{totalDivertedPatientsDaily} Emergencies/Day
          </div>
          <div className="text-[11px] text-[#8b949e] mt-1">
            From {totalReroutedHabitations} displaced feeder habitations
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="text-xs text-[#8b949e] uppercase font-semibold">ASDMA MMUs Dispatched</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            7 Tactical Units
          </div>
          <div className="text-[11px] text-cyan-300/80 mt-1">
            MICUs, Surgical Vans, and Inflatable Ambulances
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="text-xs text-[#8b949e] uppercase font-semibold">Peak Transit Delay Penalty</div>
          <div className="text-2xl font-bold text-red-400 mt-1">
            {isHeavy ? '+59.9 min / +13.5 km' : '+46.7 min / +11.7 km'}
          </div>
          <div className="text-[11px] text-[#8b949e] mt-1">
            Binnākāndi bypass to Valley Hospital, Silchar
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Hospital Surge Manifest & Interactive Cascade Vector Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Hospital Surge Cards */}
        <div className="lg:col-span-5 space-y-4">
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
              <option value="ALL">All Facilities ({SURGE_HOSPITALS.length})</option>
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
              🚨 Valley Hospital (+191%)
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
              🚨 South City (+181%)
            </button>
            <button
              type="button"
              onClick={() => setSelectedHospitalId('HOSP_BPHC_UDHARBOND')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                selectedHospitalId === 'HOSP_BPHC_UDHARBOND'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-[#161b22] text-rose-300 border border-rose-900/60 hover:bg-rose-950/60'
              }`}
            >
              🚨 BPHC Udharbond (+168%)
            </button>
          </div>

          {/* Hospital Manifest List */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredHospitals.map((h) => {
              const isSelected = selectedHospitalId === h.id;
              const isOverloaded = h.surge_percentage >= 150;
              const isStarved = h.status === 'STARVED_FACILITY';

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHospitalId(h.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
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

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isStarved
                          ? 'bg-gray-800 text-gray-300 border border-gray-600'
                          : isOverloaded
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-600 animate-pulse'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                      }`}
                    >
                      {isStarved ? 'INACCESSIBLE' : `+${h.surge_percentage}% SURGE`}
                    </span>
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
                          className="bg-rose-500 h-full animate-pulse"
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
                          className="px-1.5 py-0.5 rounded bg-[#0d1117] text-amber-300 border border-amber-900/40 text-[9px] font-mono font-medium"
                        >
                          {v.name} (+{v.add_km}km)
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ASDMA Action Directive */}
                  <div className="mt-2.5 text-[11px] text-rose-300 bg-[#0d1117] p-2 rounded-lg border border-rose-950 flex items-start gap-1.5">
                    <Syringe className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
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
            <span className="font-mono text-rose-300 font-bold">
              Surge: +{activeHospital.surge_percentage}% Over Baseline
            </span>
          </div>

          <LeafletMap
            center={[activeHospital.lat, activeHospital.lon]}
            zoom={12}
            height="460px"
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
                  This facility has experienced direct access cut-off; patient inflow has collapsed due to road inundation.
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
                        <span className="text-amber-400 font-mono font-bold block">
                          +{v.add_km} km Surcharge
                        </span>
                        <span className="text-[#8b949e] text-[10px]">
                          +{v.add_min} min delay
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-rose-950/40 border border-rose-800/50 p-3 rounded-lg flex items-center justify-between gap-3 text-xs text-rose-200">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-400 shrink-0" />
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
