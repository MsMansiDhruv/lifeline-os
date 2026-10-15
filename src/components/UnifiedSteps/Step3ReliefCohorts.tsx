import React, { useState } from 'react';
import {
  Users,
  HeartPulse,
  Baby,
  Truck,
  School,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Droplets,
  PackageCheck,
  Search,
} from 'lucide-react';
import { TheaterData } from '../../data/theaters';

export interface ReliefCamp {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation_asl: number;
  capacity: number;
  occupancy: number;
  status: 'DRY / OPERATIONAL' | 'STANDBY';
  potable_water_liters: number;
  fci_grain_quintals: number;
}

export const DRY_RELIEF_CAMPS: ReliefCamp[] = [
  {
    id: 'camp_1',
    name: 'Silchar Govt Boys HS Relief Camp',
    lat: 24.825,
    lon: 92.798,
    elevation_asl: 42,
    capacity: 1200,
    occupancy: 480,
    status: 'DRY / OPERATIONAL',
    potable_water_liters: 15000,
    fci_grain_quintals: 320,
  },
  {
    id: 'camp_2',
    name: 'Lakhipur Central College Camp',
    lat: 24.798,
    lon: 93.021,
    elevation_asl: 45,
    capacity: 950,
    occupancy: 310,
    status: 'DRY / OPERATIONAL',
    potable_water_liters: 12000,
    fci_grain_quintals: 240,
  },
  {
    id: 'camp_3',
    name: 'Sonai Model HS Ground Camp',
    lat: 24.810,
    lon: 92.835,
    elevation_asl: 39,
    capacity: 800,
    occupancy: 290,
    status: 'DRY / OPERATIONAL',
    potable_water_liters: 10000,
    fci_grain_quintals: 190,
  },
  {
    id: 'camp_4',
    name: 'Udharbond Community Shelter',
    lat: 24.898,
    lon: 92.885,
    elevation_asl: 41,
    capacity: 650,
    occupancy: 210,
    status: 'DRY / OPERATIONAL',
    potable_water_liters: 8500,
    fci_grain_quintals: 160,
  },
];

interface VillageCohort {
  id: string;
  name: string;
  corridor: string;
  population: number;
  elevation_asl: number;
  dialysisPatients: number;
  maternalPatients: number;
  infantsUnder5: number;
  dailyRationTons: number;
  primaryAssignedCamp: string;
}

const VILLAGE_COHORTS: VillageCohort[] = [
  {
    id: 'vc_bin',
    name: 'Binnākāndi',
    corridor: 'JT Road Breach',
    population: 4200,
    elevation_asl: 41,
    dialysisPatients: 14,
    maternalPatients: 9,
    infantsUnder5: 42,
    dailyRationTons: 2.88,
    primaryAssignedCamp: 'Silchar Govt Boys HS Relief Camp',
  },
  {
    id: 'vc_tol',
    name: 'Tolengram',
    corridor: 'JT Road Breach',
    population: 3100,
    elevation_asl: 40,
    dialysisPatients: 8,
    maternalPatients: 6,
    infantsUnder5: 31,
    dailyRationTons: 2.12,
    primaryAssignedCamp: 'Silchar Govt Boys HS Relief Camp',
  },
  {
    id: 'vc_har',
    name: 'Harinagar Bazar',
    corridor: 'Harinagar Inbound',
    population: 3800,
    elevation_asl: 42,
    dialysisPatients: 10,
    maternalPatients: 7,
    infantsUnder5: 35,
    dailyRationTons: 2.60,
    primaryAssignedCamp: 'Udharbond Community Shelter',
  },
  {
    id: 'vc_kor',
    name: 'Korkoli East & Tea Garden',
    corridor: 'Korkoli Causeway',
    population: 3950,
    elevation_asl: 39,
    dialysisPatients: 6,
    maternalPatients: 5,
    infantsUnder5: 34,
    dailyRationTons: 2.71,
    primaryAssignedCamp: 'Sonai Model HS Ground Camp',
  },
];

interface Step3ReliefCohortsProps {
  currentTheater: TheaterData;
  onAdvanceToStep4?: () => void;
  showCampsOnMap?: boolean;
  onToggleShowCamps?: () => void;
  onFocusVillage?: (village: { lat: number; lon: number; name: string }) => void;
  onFocusCamp?: (camp: { lat: number; lon: number; name: string }) => void;
  panelWidth?: number;
}

export const Step3ReliefCohorts: React.FC<Step3ReliefCohortsProps> = ({
  currentTheater,
  onAdvanceToStep4,
  showCampsOnMap = true,
  onToggleShowCamps,
  onFocusVillage,
  onFocusCamp,
  panelWidth = 430,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'dialysis' | 'maternal' | 'camps'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const totalDialysis = VILLAGE_COHORTS.reduce((sum, v) => sum + v.dialysisPatients, 0);
  const totalMaternal = VILLAGE_COHORTS.reduce((sum, v) => sum + v.maternalPatients, 0);
  const totalInfants = VILLAGE_COHORTS.reduce((sum, v) => sum + v.infantsUnder5, 0);
  const totalRationTons = 18.5;

  const filteredVillages = VILLAGE_COHORTS.filter((v) => {
    if (searchQuery.trim() && !v.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterType === 'dialysis') return v.dialysisPatients > 8;
    if (filterType === 'maternal') return v.maternalPatients > 6;
    return true;
  });

  return (
    <div className="space-y-3.5">
      {/* Step Header */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
            <School className="w-3.5 h-3.5 text-amber-400" />
            Step 3: Relief Camps & Vulnerable Cohorts
          </span>
          <span className="text-[9px] font-mono bg-amber-950/80 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded font-bold">
            NDMA STANDARD
          </span>
        </div>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Identifies high-ground relief centers (41m–45m ASL) and prioritizes vulnerable village cohorts (dialysis, maternal, infants) requiring urgent cold-chain and dry rations.
        </p>
      </div>

      {/* 4 NDMA Cohort KPI Cards */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-[11px]">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              Dialysis Patients
            </span>
            <span className="text-[9px] bg-rose-950 text-rose-300 px-1 rounded border border-rose-800 font-bold">
              48h LIMIT
            </span>
          </div>
          <div className="text-xl font-bold text-white flex items-baseline gap-1.5">
            {totalDialysis} Patients
            <span className="text-[10px] text-rose-400 font-normal">Need Direct Access</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-[11px]">
              <Baby className="w-3.5 h-3.5 text-purple-400" />
              Maternal / Infants
            </span>
            <span className="text-[9px] bg-purple-950 text-purple-300 px-1 rounded border border-purple-800 font-bold">
              PRIORITY
            </span>
          </div>
          <div className="text-xl font-bold text-white flex items-baseline gap-1.5">
            {totalMaternal} + {totalInfants}
            <span className="text-[10px] text-purple-400 font-normal">Expectant / Under 5</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-[11px]">
              <School className="w-3.5 h-3.5 text-emerald-400" />
              Dry Relief Camps
            </span>
            <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1 rounded border border-emerald-800 font-bold">
              41m ASL
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-400 flex items-baseline gap-1.5">
            4 Government
            <span className="text-[10px] text-slate-400 font-normal">3,600 Capacity</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-[11px]">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              Daily FCI Load
            </span>
            <span className="text-[9px] bg-amber-950 text-amber-300 px-1 rounded border border-amber-800 font-bold">
              18.5 T/DAY
            </span>
          </div>
          <div className="text-xl font-bold text-amber-300 flex items-baseline gap-1.5">
            {totalRationTons} Tons/Day
            <span className="text-[10px] text-slate-400 font-normal">Ration & Water</span>
          </div>
        </div>
      </div>

      {/* Triage Cohort Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none font-mono text-[10px]">
        <button
          onClick={() => setFilterType('all')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Cohorts
        </button>
        <button
          onClick={() => setFilterType('dialysis')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterType === 'dialysis'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <HeartPulse className="w-3 h-3 text-rose-400" />
          <span>🩸 Dialysis ({totalDialysis})</span>
        </button>
        <button
          onClick={() => setFilterType('maternal')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterType === 'maternal'
              ? 'bg-purple-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Baby className="w-3 h-3 text-purple-400" />
          <span>🤰 Maternal ({totalMaternal})</span>
        </button>
        <button
          onClick={() => setFilterType('camps')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterType === 'camps'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <School className="w-3 h-3 text-emerald-400" />
          <span>🏫 4 Relief Camps</span>
        </button>
      </div>

      {/* If Camps filter selected, show 4 High-Ground School Relief Camps */}
      {filterType === 'camps' ? (
        <div className="space-y-2">
          {DRY_RELIEF_CAMPS.map((camp) => (
            <div
              key={camp.id}
              onClick={() => onFocusCamp?.({ lat: camp.lat, lon: camp.lon, name: camp.name })}
              className="p-3 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/60 rounded-xl space-y-1.5 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {camp.name}
                  </h4>
                  <p className="text-[10px] font-mono text-emerald-400">
                    High Ridge Altitude: {camp.elevation_asl}m ASL (Completely Dry & Flood Safe)
                  </p>
                </div>
                <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-bold">
                  {camp.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-300">
                <div>
                  <span className="text-slate-500 block">Capacity:</span>
                  <span className="font-bold text-white">{camp.occupancy} / {camp.capacity}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Potable Water:</span>
                  <span className="font-bold text-cyan-400">{camp.potable_water_liters.toLocaleString()} L</span>
                </div>
                <div>
                  <span className="text-slate-500 block">FCI Grain:</span>
                  <span className="font-bold text-amber-300">{camp.fci_grain_quintals} Qtl</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Village Cohort Cards */
        <div className="space-y-2">
          {filteredVillages.map((v) => (
            <div
              key={v.id}
              onClick={() => onFocusVillage?.({ lat: v.lat, lon: v.lon, name: v.name })}
              className="p-3 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/60 rounded-xl space-y-2 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    {v.name}
                    <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                      {v.corridor}
                    </span>
                  </h4>
                  <p className="text-[10px] font-mono text-slate-400">
                    Population: {v.population.toLocaleString()} • Dry Ridge: {v.elevation_asl}m ASL
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                    {v.dailyRationTons} Tons/Day
                  </span>
                </div>
              </div>

              {/* Triage badges */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                <div className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-900/60 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <div>
                    <span className="text-rose-300 font-bold block">{v.dialysisPatients} Dialysis</span>
                    <span className="text-[8px] text-slate-400">48h Critical</span>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-900/60 flex items-center gap-1.5">
                  <Baby className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-purple-300 font-bold block">{v.maternalPatients} Maternal</span>
                    <span className="text-[8px] text-slate-400">{v.infantsUnder5} Under-5s</span>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-emerald-300 font-bold block truncate">Assigned Camp</span>
                    <span className="text-[8px] text-slate-400 truncate">{v.primaryAssignedCamp.split(' ')[0]} HS</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advance to Step 4 Button */}
      {onAdvanceToStep4 && (
        <button
          onClick={onAdvanceToStep4}
          className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Proceed to 4. ROI & Ground-Truth</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
