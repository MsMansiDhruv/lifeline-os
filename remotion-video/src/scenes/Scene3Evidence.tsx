import React from 'react';
import { interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { HeaderBar } from '../components/HeaderBar';
import { Captions } from '../components/Captions';

export const Scene3Evidence: React.FC = () => {
  const frame = useCurrentFrame();

  // Transition between technical evidence nodes (0-450 frames) and genuine app evidence catalogue (450-810 frames)
  const isAppView = frame > 450;
  const appOpacity = interpolate(frame, [450, 480], [0, 1], {
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
      <Audio src={staticFile('audio/scene3_evidence.wav')} />

      <HeaderBar
        sceneNumber={3}
        totalScenes={8}
        stageName="Evidence & Provenance"
        sectionTitle="Validation of Multimodal Datasets & Epistemic Bounds"
      />

      {/* Main View: Technical Nodes & Provenance Ledger */}
      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 64,
          right: 64,
          bottom: 120,
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: 40,
          alignItems: 'center',
          opacity: 1 - appOpacity * 0.9,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 999,
              color: '#166534',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
              marginBottom: 16,
            }}
          >
            <span>DATA PROVENANCE & QUALITY AUDIT</span>
          </div>

          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: 44,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Every decision links to an <br />
            <span style={{ color: '#0284c7' }}>authoritative, verified source.</span>
          </h2>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.5,
              color: '#475569',
              margin: '0 0 24px 0',
            }}
          >
            Lifeline OS registers spatial freshness, sensor limitations, and missing attributes. Unverified assumptions are explicitly quarantined as demonstration sandboxes.
          </p>

          {/* 4 Provenance Nodes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div
              style={{
                padding: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                borderLeft: '4px solid #0284c7',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>
                OBSERVED • 10M RADAR
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                Copernicus Sentinel-1 SAR
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                VV+VH Polarimetric C-Band Ortho. Captures cloud-penetrating water boundaries.
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                borderLeft: '4px solid #0d9488',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', fontFamily: 'monospace' }}>
                LIVE STREAM • 15-MIN
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                Copernicus GloFAS & Open-Meteo
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Discharge: 950 m³/s • Wind: 3.2 km/h (below 45 km/h UAV flight ceiling).
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                borderLeft: '4px solid #6366f1',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>
                TOPOLOGICAL EDGES
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                OpenStreetMap Overpass + OSRM
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                31,214 graph nodes. Verified highway geometries and bridge classifications.
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                borderLeft: '4px solid #f59e0b',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', fontFamily: 'monospace' }}>
                OFFICIAL SITREP #22
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                Assam DMA & Cachar DDMA
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Statutory casualty reports, facility bed counts, and administrative boundaries.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Evidence Catalogue UI Visual */}
        <div
          style={{
            position: 'relative',
            height: 620,
            borderRadius: 16,
            border: '1px solid #cbd5e1',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#0f172a',
          }}
        >
          <img
            src={staticFile('assets/03_evidence_catalogue_metadata.png')}
            alt="Live Evidence Catalogue"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Overlay: Genuine Application Evidence Catalogue In Action */}
      {isAppView && (
        <div
          style={{
            position: 'absolute',
            top: 90,
            left: 64,
            right: 64,
            bottom: 120,
            opacity: appOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: 16,
              overflow: 'hidden',
              border: '2px solid #0284c7',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <img
              src={staticFile('assets/03_evidence_catalogue_metadata.png')}
              alt="Evidence Catalogue in App"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                backgroundColor: 'rgba(2, 132, 199, 0.95)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: '0.04em',
              }}
            >
              LIVE PROTOTYPE: 8 DATASETS CATALOGUED (0 UNVERIFIED FABRICATIONS)
            </div>
          </div>
        </div>
      )}

      <Captions
        text="The workflow starts with available flood, weather, geographic and infrastructure evidence. Source provenance, timestamps, geographic validity and missing data all matter before conclusions can be drawn."
        subtext="METADATA & QUALITY AUDIT: 4 OBSERVED • 3 OFFICIAL • 1 SIMULATED BOUND"
      />
    </div>
  );
};
