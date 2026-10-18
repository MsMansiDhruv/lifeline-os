import React from 'react';
import { interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { HeaderBar } from '../components/HeaderBar';
import { Captions } from '../components/Captions';
import { ProcessFlow } from '../components/ProcessFlow';

export const Scene2Intro: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [10, 35], [15, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const flowOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Highlight stages across time (0-600 frames = 20s)
  const currentStage = Math.min(5, Math.floor(interpolate(frame, [60, 480], [0, 5.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })));

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
      <Audio src={staticFile('audio/scene2_intro.wav')} />

      <HeaderBar
        sceneNumber={2}
        totalScenes={8}
        stageName="Prototype Introduction"
        sectionTitle="Connected Decision-Support Workflow"
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
              backgroundColor: '#e0f2fe',
              border: '1px solid #bae6fd',
              borderRadius: 999,
              color: '#0369a1',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
              marginBottom: 16,
            }}
          >
            <span>DECISION SUPPORT PROTOTYPE</span>
          </div>

          <h1
            style={{
              margin: '0 0 16px 0',
              fontSize: 52,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            Lifeline OS connects evidence to <br />
            <span style={{ color: '#0d9488' }}>actionable, reviewable response.</span>
          </h1>

          <p
            style={{
              fontSize: 20,
              lineHeight: 1.5,
              color: '#475569',
              margin: '0 auto',
              maxWidth: 820,
            }}
          >
            A multi-chapter technical framework transforming disconnected satellite observations and elevation contours into validated accessibility graphs and resource-constrained logistics.
          </p>
        </div>

        {/* 6-Stage Process Flow Architecture */}
        <div style={{ width: '100%', opacity: flowOpacity, marginTop: 10 }}>
          <ProcessFlow activeStageIndex={currentStage} />
        </div>

        {/* Technical Callout Card Below */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            width: '100%',
            maxWidth: 1400,
            marginTop: 10,
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              borderTop: '3px solid #0284c7',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>
              PILLAR 01: TRANSPARENT EVIDENCE
            </div>
            <div style={{ fontSize: 14, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
              Zero synthetic assumptions. Every flood polygon and water level tracks back to Copernicus Sentinel, GloFAS, or CWC telemetry.
            </div>
          </div>

          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              borderTop: '3px solid #0d9488',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0d9488', fontFamily: 'monospace' }}>
              PILLAR 02: DETERMINISTIC LOGISTICS
            </div>
            <div style={{ fontSize: 14, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
              Strict warehouse caps (Bailey bridges, medical camps, boats) and statutory budget ceilings prevent unfeasible allocation orders.
            </div>
          </div>

          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              borderTop: '3px solid #6366f1',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>
              PILLAR 03: HUMAN-IN-THE-LOOP AUDIT
            </div>
            <div style={{ fontSize: 14, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
              Statutory SDRF Form-3B order generation with SHA-256 cryptographic verification for full legal accountability.
            </div>
          </div>
        </div>
      </div>

      <Captions
        text="Lifeline OS is a flood-impact intelligence and emergency-response decision-support prototype. It connects geographic evidence, infrastructure analysis, accessibility assessment and constrained response planning into one workflow."
        subtext="END-TO-END PIPELINE: EVIDENCE → VALIDATION → GEOSPATIAL → IMPACT → PLANNING → AUDIT"
      />
    </div>
  );
};
