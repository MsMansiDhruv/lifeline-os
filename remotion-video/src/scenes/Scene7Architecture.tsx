import React from 'react';
import { interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { HeaderBar } from '../components/HeaderBar';
import { Captions } from '../components/Captions';

export const Scene7Architecture: React.FC = () => {
  const frame = useCurrentFrame();

  // Animation timeline across 720 frames (24 seconds)
  const isDiagramView = frame < 420;
  const diagramOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cloudOpacity = interpolate(frame, [420, 450], [0, 1], {
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
      <Audio src={staticFile('audio/scene7_architecture.wav')} />

      <HeaderBar
        sceneNumber={7}
        totalScenes={8}
        stageName="Technical Architecture"
        sectionTitle="Decoupled Modular Architecture & Verified Service Bus"
      />

      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 64,
          right: 64,
          bottom: 120,
          display: 'grid',
          gridTemplateColumns: '440px 1fr',
          gap: 36,
          alignItems: 'center',
        }}
      >
        {/* Left Column: Architectural Principles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                border: '1px solid #c7d2fe',
                borderRadius: 999,
                color: '#3730a3',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: '0.04em',
                marginBottom: 12,
              }}
            >
              <span>DECOUPLED VERIFIABLE ARCHITECTURE</span>
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
              Separating raw evidence <br />
              <span style={{ color: '#4f46e5' }}>from decision logic.</span>
            </h2>

            <p style={{ fontSize: 16, color: '#475569', margin: '8px 0 0 0', lineHeight: 1.45 }}>
              Each layer maintains isolated invariants. Ground truth cannot be polluted by AI hallucination; recommendations cannot exceed warehouse constraints.
            </p>
          </div>

          {/* 5 Architecture Tiers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #0284c7',
                borderRadius: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>
                TIER 1: MULTI-SOURCE INGESTION
              </div>
              <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                Sentinel-1 SAR, GloFAS discharge, CWC gauges, SRTM 30m DEM.
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #0d9488',
                borderRadius: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', fontFamily: 'monospace' }}>
                TIER 2: TOPOLOGICAL GEOSPATIAL ENGINE
              </div>
              <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                OSRM graph pruning, road cut intersection, and detour latency modeling.
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #f59e0b',
                borderRadius: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', fontFamily: 'monospace' }}>
                TIER 3: DETERMINISTIC SOLVER &amp; ADAPTERS
              </div>
              <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                Bounded integer optimization for multi-modal deployment under fiscal caps.
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #6366f1',
                borderRadius: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', fontFamily: 'monospace' }}>
                TIER 4: STATUTORY AUDIT &amp; HUMAN SIGN-OFF
              </div>
              <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                SDRF Form-3B order generation with SHA-256 cryptographic provenance.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Architecture Diagram or Cloud GEE Modal */}
        <div
          style={{
            position: 'relative',
            height: 640,
            borderRadius: 16,
            border: '2px solid #cbd5e1',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12)',
            backgroundColor: isDiagramView ? '#ffffff' : '#0f172a',
          }}
        >
          {isDiagramView ? (
            <img
              src={staticFile('assets/lifeline_os_system_architecture.png')}
              alt="Lifeline OS System Architecture Diagram"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: 16,
                opacity: diagramOpacity,
              }}
            />
          ) : (
            <img
              src={staticFile('assets/11_cloud_architecture_gee.png')}
              alt="4-Tier Cloud & Gemini MCP Architecture"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: cloudOpacity,
              }}
            />
          )}

          <div
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'monospace',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {isDiagramView
              ? 'LIFELINE OS SYSTEM ARCHITECTURE & DATA FLOW'
              : '4-TIER GOOGLE CLOUD & GEMINI MCP INTEGRATION STATUS'}
          </div>
        </div>
      </div>

      <Captions
        text="The architecture separates external evidence from validation, geospatial processing and decision logic. Each recommendation can then be understood in the context of its inputs, assumptions and constraints."
        subtext="SYSTEM ARCHITECTURE: DECOUPLED INGESTION • TOPOLOGICAL ROUTING • AUDITABLE SOLVER"
      />
    </div>
  );
};
