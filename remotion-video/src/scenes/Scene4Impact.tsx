import React from 'react';
import { interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { HeaderBar } from '../components/HeaderBar';
import { Captions } from '../components/Captions';

export const Scene4Impact: React.FC = () => {
  const frame = useCurrentFrame();

  // Animation timeline across 1110 frames (37 seconds)
  const mapZoom = interpolate(frame, [0, 1110], [1.0, 1.06], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const callout1Opacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const callout2Opacity = interpolate(frame, [150, 180], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const callout3Opacity = interpolate(frame, [300, 330], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Audio src={staticFile('audio/scene4_impact.wav')} />

      <HeaderBar
        sceneNumber={4}
        totalScenes={8}
        stageName="Geospatial Impact"
        sectionTitle="Infrastructure Exposure, Road Severance & Detour Penalties"
      />

      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 64,
          right: 64,
          bottom: 120,
          display: 'grid',
          gridTemplateColumns: '460px 1fr',
          gap: 36,
          alignItems: 'center',
        }}
      >
        {/* Left Column: Analytical Metrics & Exposure Bounds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: 999,
                color: '#b91c1c',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: '0.04em',
                marginBottom: 12,
              }}
            >
              <span>SPATIAL INTERSECTION ≠ CONFIRMED CLOSURE</span>
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 38,
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              Exposing route disruption <br />
              <span style={{ color: '#0284c7' }}>without false certainty.</span>
            </h2>

            <p style={{ fontSize: 16, color: '#475569', margin: '10px 0 0 0', lineHeight: 1.45 }}>
              Intersections identify potential exposure points. Topological routing calculates whether detours exist or if communities are completely severed.
            </p>
          </div>

          {/* Analytical Breakdown Cards */}
          <div
            style={{
              opacity: callout1Opacity,
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>
                PRIMARY BREACH
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>JT Road Highway</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              80-Meter Gap
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Direct Route (14.2 km • 18m) completely severed by Barak river floodwaters.
            </div>
          </div>

          <div
            style={{
              opacity: callout2Opacity,
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
                DETOUR PENALTY
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>Bypass Route</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#b45309', marginTop: 4 }}>
              +47 Min Delay (65m Total)
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              42 rural habitations cut off; detour viable only for light 4x4 vehicles.
            </div>
          </div>

          <div
            style={{
              opacity: callout3Opacity,
              padding: '16px 20px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                HOSPITAL SURGE BALANCING
              </span>
              <span style={{ fontSize: 12, color: '#059669' }}>Active Triage</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#065f46', marginTop: 4 }}>
              Valley Hosp: 100% → 74%
            </div>
            <div style={{ fontSize: 13, color: '#047857', marginTop: 2 }}>
              AMB-01 & AMB-02 successfully diverted to SMCH Regional Trauma Center.
            </div>
          </div>
        </div>

        {/* Right Column: Genuine Geographic Product Screenshot with Live UI Callouts */}
        <div
          style={{
            position: 'relative',
            height: 640,
            borderRadius: 16,
            border: '2px solid #cbd5e1',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12)',
            backgroundColor: '#0f172a',
          }}
        >
          <img
            src={staticFile('assets/07_route_disruption_hospital_surge.png')}
            alt="Live Route Disruption & Hospital Surge"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${mapZoom})`,
            }}
          />

          {/* Genuine Feature Badge */}
          <div
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
            }}
          >
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#38bdf8' }}>
              TOPOLOGICAL ACCESSIBILITY CALCULATOR
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
              JT Road Cut-Off • 42 Settlements Severed
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          >
            Blue Line: Diversion to SMCH Regional (75m)
          </div>
        </div>
      </div>

      <Captions
        text="Validated geographic evidence can help identify potentially exposed infrastructure and examine road accessibility. A spatial intersection is evidence of potential exposure, not proof of damage or a confirmed road closure."
        subtext="TOPOLOGICAL ANALYSIS: 80M BREACH → +47M DELAY → AMBULANCE RE-ROUTING TO REGIONAL ICU"
      />
    </div>
  );
};
