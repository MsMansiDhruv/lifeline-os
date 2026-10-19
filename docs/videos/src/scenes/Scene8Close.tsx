import React from 'react';
import { interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { HeaderBar } from '../components/HeaderBar';
import { Captions } from '../components/Captions';

export const Scene8Close: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [15, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [15, 45], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cardsOpacity = interpolate(frame, [45, 80], [0, 1], {
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
      <Audio src={staticFile('audio/scene8_close.wav')} />

      <HeaderBar
        sceneNumber={8}
        totalScenes={8}
        stageName="Summary & Close"
        sectionTitle="Connected Situational Awareness for Disaster Response"
      />

      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 64,
          right: 64,
          bottom: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 960 }}>
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
            <span>DISASTER MANAGEMENT DECISION SUPPORT SYSTEM</span>
          </div>

          <h1
            style={{
              margin: '0 0 12px 0',
              fontSize: 64,
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            Lifeline OS
          </h1>

          <p
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: '#0284c7',
              margin: '0 auto 16px auto',
              letterSpacing: '-0.01em',
            }}
          >
            From flood evidence to informed response.
          </p>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.5,
              color: '#64748b',
              margin: '0 auto',
              maxWidth: 780,
            }}
          >
            A decision-support system connecting real satellite radar extent, open highway topologies, hospital surge dynamics, and constrained warehouse inventory into a reviewable statutory plan.
          </p>
        </div>

        {/* 3 Pillar Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 28,
            width: '100%',
            maxWidth: 1300,
            opacity: cardsOpacity,
          }}
        >
          <div
            style={{
              padding: '24px 28px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              borderTop: '4px solid #0284c7',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>
              01 • PROVENANCE INTEGRITY
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>
              Real Data, Zero Hallucinations
            </div>
            <p style={{ fontSize: 14, color: '#64748b', margin: '8px 0 0 0', lineHeight: 1.45 }}>
              Copernicus Sentinel-1 SAR, OpenStreetMap vector graphs, GloFAS river discharge, and CWC telemetry with explicit epistemic bounds.
            </p>
          </div>

          <div
            style={{
              padding: '24px 28px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              borderTop: '4px solid #0d9488',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0d9488', fontFamily: 'monospace' }}>
              02 • CONSTRAINED SOLVER
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>
              Deterministic Logistics
            </div>
            <p style={{ fontSize: 14, color: '#64748b', margin: '8px 0 0 0', lineHeight: 1.45 }}>
              Hard caps on Bailey bridges (1/1), medical units (2/2), boats, and budget ceilings (₹2.5 Cr SDRF) prevent unfeasible response plans.
            </p>
          </div>

          <div
            style={{
              padding: '24px 28px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              borderTop: '4px solid #6366f1',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>
              03 • STATUTORY AUDITABILITY
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>
              Human Decision Authority
            </div>
            <p style={{ fontSize: 14, color: '#64748b', margin: '8px 0 0 0', lineHeight: 1.45 }}>
              Generates legal SDRF Form-3B orders with SHA-256 cryptographic verification, preserving human accountability under the Disaster Management Act.
            </p>
          </div>
        </div>

        {/* Verification Footer Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            padding: '12px 28px',
            backgroundColor: '#ffffff',
            borderRadius: 999,
            border: '1px solid #e2e8f0',
            fontSize: 14,
            fontFamily: 'monospace',
            color: '#475569',
          }}
        >
          <span>Repository: <strong>github.com/MsMansiDhruv/lifeline-os</strong></span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span>Application: <strong>lifeline-os.ai.studio</strong></span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span style={{ color: '#0284c7', fontWeight: 700 }}>220s Technical Video Edit</span>
        </div>
      </div>

      <Captions
        text="Lifeline OS brings flood evidence, infrastructure exposure and response planning into a connected decision-support workflow. The objective is clearer situational awareness, more transparent decisions and better-informed emergency response."
        subtext="LIFELINE OS: FROM FLOOD EVIDENCE TO INFORMED RESPONSE"
      />
    </div>
  );
};
