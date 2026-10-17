import React from 'react';
import { Drone, Hospital, Truck, MapPin, OctagonAlert } from 'lucide-react';

/**
 * Tactical Unified Icon Library for LIFELINE OS
 * Replaces mismatched OS emojis with consistent, high-contrast vector SVG icons
 * across the Leaflet map pins, vehicle animations, step drawers, and HUD headers.
 */

// 1. Modular Steel Truss Bridge Icon (Class-40 Bailey Bridge)
export const BridgeIcon: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 16,
  className = '',
  color = 'currentColor',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M2 17h20" />
    <path d="M3 17V8c4-4 14-4 18 0v9" />
    <path d="M8 7v10" />
    <path d="M12 6v11" />
    <path d="M16 7v10" />
    <path d="m3 17 5-10" />
    <path d="m8 17 4-11" />
    <path d="m12 6 4 11" />
    <path d="m16 7 5 10" />
  </svg>
);

// 2. Hospital Camp Icon (Emergency Field Clinic Tent with Medical Cross)
export const CampIcon: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 16,
  className = '',
  color = 'currentColor',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3.5 21 12 3l8.5 18" />
    <path d="M16 21 12 14l-4 7" />
    <path d="M2 21h20" />
    <path d="M12 7.5v3" strokeWidth="2.5" />
    <path d="M10.5 9h3" strokeWidth="2.5" />
  </svg>
);

// 3. Heavy Cargo Med-Drone Icon (Quadcopter UAV)
export const DroneIcon: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 16,
  className = '',
  color = 'currentColor',
}) => (
  <Drone size={size} color={color} className={className} />
);

// 4. Tactical Rescue Boat Icon (40HP Marine Inflatable / Speedboat on Water)
export const BoatIcon: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 16,
  className = '',
  color = 'currentColor',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M2 13.5l3.5 6h13l3.5-6H2z" />
    <path d="M6 13.5l2-5h7l2 5" />
    <path d="M18.5 13.5v5" />
    <path d="M1 21c1.5-.8 3-.8 4.5 0s3 .8 4.5 0 3-.8 4.5 0 3 .8 4.5 0 3-.8 4.5 0" />
  </svg>
);

// 5. Heavy Supply Convoy Truck Icon
export const FreightTruckIcon: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 16,
  className = '',
  color = 'currentColor',
}) => (
  <Truck size={size} color={color} className={className} />
);

// 6. Hospital Facility Icon
export const HospitalPinIcon: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 16,
  className = '',
  color = 'currentColor',
}) => (
  <Hospital size={size} color={color} className={className} />
);

// 7. Hazard Breach Washout Icon
export const BreachHazardIcon: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 16,
  className = '',
  color = 'currentColor',
}) => (
  <OctagonAlert size={size} color={color} className={className} />
);

// 8. Origin Habitation Pin Icon
export const OriginVillageIcon: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 16,
  className = '',
  color = 'currentColor',
}) => (
  <MapPin size={size} color={color} className={className} />
);

/* ==========================================================================
   STATIC SVG STRINGS FOR LEAFLET L.divIcon HTML TEMPLATES (NO RAW EMOJIS)
   ========================================================================== */

export const SVG_BRIDGE_HTML = (size = 15, color = '#fef3c7') => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
    <path d="M2 17h20"/>
    <path d="M3 17V8c4-4 14-4 18 0v9"/>
    <path d="M8 7v10"/>
    <path d="M12 6v11"/>
    <path d="M16 7v10"/>
    <path d="m3 17 5-10"/>
    <path d="m8 17 4-11"/>
    <path d="m12 6 4 11"/>
    <path d="m16 7 5 10"/>
  </svg>
`;

export const SVG_CAMP_HTML = (size = 15, color = '#fef08a') => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
    <path d="M3.5 21 12 3l8.5 18"/>
    <path d="M16 21 12 14l-4 7"/>
    <path d="M2 21h20"/>
    <path d="M12 7.5v3" stroke-width="2.8"/>
    <path d="M10.5 9h3" stroke-width="2.8"/>
  </svg>
`;

export const SVG_DRONE_HTML = (size = 15, color = '#f3e8ff') => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
    <path d="M10 10 7 7"/>
    <path d="m10 14-3 3"/>
    <path d="m14 10 3-3"/>
    <path d="m14 14 3 3"/>
    <path d="M14.205 4.139a4 4 0 1 1 5.439 5.863"/>
    <path d="M19.637 14a4 4 0 1 1-5.432 5.868"/>
    <path d="M4.367 10a4 4 0 1 1 5.438-5.862"/>
    <path d="M9.795 19.862a4 4 0 1 1-5.429-5.873"/>
    <rect x="10" y="8" width="4" height="8" rx="1"/>
  </svg>
`;

export const SVG_BOAT_HTML = (size = 15, color = '#e0f2fe') => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
    <path d="M2 13.5l3.5 6h13l3.5-6H2z"/>
    <path d="M6 13.5l2-5h7l2 5"/>
    <path d="M18.5 13.5v5"/>
    <path d="M1 21c1.5-.8 3-.8 4.5 0s3 .8 4.5 0 3-.8 4.5 0 3 .8 4.5 0 3-.8 4.5 0"/>
  </svg>
`;

export const SVG_TRUCK_HTML = (size = 15, color = '#fef3c7') => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
    <path d="M15 18H9"/>
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
    <circle cx="17" cy="18" r="2"/>
    <circle cx="7" cy="18" r="2"/>
  </svg>
`;

export const SVG_HOSPITAL_HTML = (size = 15, color = '#bae6fd') => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
    <path d="M12 7v4"/>
    <path d="M14 21v-3a2 2 0 0 0-4 0v3"/>
    <path d="M14 9h-4"/>
    <path d="M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/>
    <path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16"/>
  </svg>
`;

export const SVG_HAZARD_HTML = (size = 15, color = '#fecdd3') => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
`;

export const SVG_ORIGIN_PIN_HTML = (size = 15, color = '#a7f3d0') => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
`;

export const SVG_SOS_HTML = (size = 15, color = '#f5d0fe') => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
`;
