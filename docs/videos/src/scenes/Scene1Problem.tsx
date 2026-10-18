import React from 'react';
import { interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { HeaderBar } from '../components/HeaderBar';
import { Captions } from '../components/Captions';

export const Scene1Problem: React.FC = () => {
  const frame = useCurrentFrame();

  // Animations
  const titleOpacity = interpolate(frame, [15, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [15, 45], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const card1Opacity = interpolate(frame, [50, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const card2Opacity = interpolate(frame, [80, 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const card3Opacity = interpolate(frame, [110, 140], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const mapScale = interpolate(frame, [0, 540], [1.0, 1.05], {
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
      <Audio src={staticFile('audio/scene1_problem.wav')} />

      <HeaderBar
        sceneNumber={1}
        totalScenes={8}
        stageName="Problem Statement"
        sectionTitle="Operational Realities During Flood Emergencies"
      />

      {/* Main Grid Layout */}
      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 64,
          right: 64,
          bottom: 120,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 48,
          alignItems: 'center',
        }}
      >
        {/* Left Column: Technical Editorial Framing */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 999,
              color: '#991b1b',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
              marginBottom: 20,
            }}
          >
            <span>THE OPERATIONAL GAP IN FLOOD RESPONSE</span>
          </div>

          <h1
            style={{
              margin: '0 0 16px 0',
              fontSize: 54,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            Flood evidence is <br />
            <span style={{ color: '#0284c7' }}>only the beginning.</span>
          </h1>

          <p
            style={{
              fontSize: 20,
              lineHeight: 1.5,
              color: '#475569',
              margin: '0 0 32px 0',
              maxWidth: 720,
            }}
          >
            Inundation maps identify where water stands. But incident commanders need to determine which vital networks are severed, which populations are stranded, and how constrained relief can realistically navigate disrupted corridors.
          </p>

          {/* 3 Core Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                opacity: card1Opacity,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #ef4444',
                borderRadius: 8,
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ fontSize: 20 }}>🏥</span>
              <div>
                <strong style={{ color: '#0f172a', fontSize: 16, display: 'block' }}>
                  Critical Infrastructure Exposure
                </strong>
                <span style={{ color: '#64748b', fontSize: 14 }}>
                  Which trauma centers, sub-stations, and clinics are within inundation zones?
                </span>
              </div>
            </div>

            <div
              style={{
                opacity: card2Opacity,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #f59e0b',
                borderRadius: 8,
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ fontSize: 20 }}>🚧</span>
              <div>
                <strong style={{ color: '#0f172a', fontSize: 16, display: 'block' }}>
                  Road Network Accessibility & Severance
                </strong>
                <span style={{ color: '#64748b', fontSize: 14 }}>
                  Which bridges have breached, and what detour penalties prevent emergency routing?
                </span>
              </div>
            </div>

            <div
              style={{
                opacity: card3Opacity,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #0284c7',
                borderRadius: 8,
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ fontSize: 20 }}>📦</span>
              <div>
                <strong style={{ color: '#0f172a', fontSize: 16, display: 'block' }}>
                  Resource & Budget Bottlenecks
                </strong>
                <span style={{ color: '#64748b', fontSize: 14 }}>
                  How can limited Bailey bridges, medical units, and boats be deployed under strict fiscal caps?
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Genuine Geographic Inundation Proof */}
        <div
          style={{
            position: 'relative',
            height: 640,
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #cbd5e1',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
          }}
        >
          <img
            src={staticFile('assets/05_satellite_and_map_layers.png')}
            alt="Actual Satellite Flood Inundation"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${mapScale})`,
            }}
          />

          {/* Technical Map Overlay Callout */}
          <div
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              color: '#ffffff',
              padding: '12px 18px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#38bdf8' }}>
              COPERNICUS SENTINEL-1 SAR EXTENT
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
              Barak Valley Basin • 31,214 Topological Nodes
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Red Buffer: Observed Flooded Corridor | Amber Pins: Cut-Off Villages
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              backgroundColor: '#ffffff',
              color: '#0f172a',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            📍 Silchar, Assam (Monsoon Riverine Flood Baseline)
          </div>
        </div>
      </div>

      <Captions
        text="During a flood, the challenge is not just identifying inundated areas. Emergency teams must understand what may be exposed, which routes could be disrupted, and how limited resources can reach affected communities."
        subtext="OPERATIONAL CHALLENGE: EVIDENCE → EXPOSURE → DISRUPTION → CONSTRAINTS"
      />
    </div>
  );
};
