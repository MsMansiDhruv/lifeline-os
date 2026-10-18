import React from 'react';
import { interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { HeaderBar } from '../components/HeaderBar';
import { Captions } from '../components/Captions';

export const Scene5Planning: React.FC = () => {
  const frame = useCurrentFrame();

  // Switch between technical solver diagram (0-550) and genuine product planner (550-1140)
  const isAppView = frame > 550;
  const appOpacity = interpolate(frame, [550, 580], [0, 1], {
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
      <Audio src={staticFile('audio/scene5_planning.wav')} />

      <HeaderBar
        sceneNumber={5}
        totalScenes={8}
        stageName="Response Planning"
        sectionTitle="Deterministic Multi-Modal Solver Under Strict Operational Bounds"
      />

      {/* View 1: Deterministic Decision Engine Architecture */}
      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 64,
          right: 64,
          bottom: 120,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
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
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: 999,
              color: '#92400e',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
              marginBottom: 16,
            }}
          >
            <span>CONSTRAINED RESOURCE ALLOCATION ENGINE</span>
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
            Exposing constraints instead of <br />
            <span style={{ color: '#d97706' }}>hallucinating unfeasible plans.</span>
          </h2>

          <p style={{ fontSize: 18, color: '#475569', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Emergency budgets and district stockpiles are strictly bounded. If a Bailey bridge is deployed to JT Road, the solver locks that inventory and directs remaining corridors to medical camps, drones, or boats.
          </p>

          {/* 4 Multi-Modal Tool Constraints */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                borderLeft: '4px solid #b45309',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Bailey Bridge</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309', fontFamily: 'monospace' }}>
                  STOCK: 1/1
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                ₹1.8 Cr • 72h Setup. Restores 16T truck freight across 80m washouts.
              </div>
            </div>

            <div
              style={{
                padding: '14px 18px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                borderLeft: '4px solid #eab308',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Hospital Camp (MMU)</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#ca8a04', fontFamily: 'monospace' }}>
                  STOCK: 2/2
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                ₹25 Lakhs • 6h Setup. Intercepts local trauma on dry roadhead (-80% surge).
              </div>
            </div>

            <div
              style={{
                padding: '14px 18px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                borderLeft: '4px solid #a855f7',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Heavy Med-Drone</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#9333ea', fontFamily: 'monospace' }}>
                  STOCK: 2/2
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                ₹12 Lakhs • 45m Setup. 12-min antivenom airbridge. Grounded if wind &gt; 45 km/h.
              </div>
            </div>

            <div
              style={{
                padding: '14px 18px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                borderLeft: '4px solid #0284c7',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>NDRF Boat (40HP)</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>
                  STOCK: 2/2
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                ₹6.5 Lakhs • 25m Transit. Shallow draft evacuation for riparian clusters.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mathematical Decision Pipeline */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #cbd5e1',
            padding: '36px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>
            DETERMINISTIC ALLOCATION PIPELINE
          </div>

          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontFamily: 'monospace',
              fontSize: 14,
              color: '#0f172a',
            }}
          >
            [Resource Inventory] + [Community Demand] + [Operational Constraints]
          </div>
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 20, fontWeight: 900 }}>↓</div>

          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#eff6ff',
              borderRadius: 8,
              border: '1px solid #bfdbfe',
              fontFamily: 'monospace',
              fontSize: 14,
              color: '#1d4ed8',
              fontWeight: 700,
            }}
          >
            Deterministic Life-Safety ROI Ranking Engine
          </div>
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 20, fontWeight: 900 }}>↓</div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <div
              style={{
                padding: '14px',
                backgroundColor: '#f0fdf4',
                borderRadius: 8,
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontSize: 13,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              FEASIBLE PLAN:
              <br />
              <span style={{ fontWeight: 400, fontSize: 12 }}>Under Budget &amp; Stock Caps</span>
            </div>

            <div
              style={{
                padding: '14px',
                backgroundColor: '#fef2f2',
                borderRadius: 8,
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: 13,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              NO_FEASIBLE_PLAN:
              <br />
              <span style={{ fontWeight: 400, fontSize: 12 }}>Explicitly Expose Limitation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay: Genuine Product Footage of the 4-Tool Planner */}
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
              src={staticFile('assets/08_resource_planner_roi.png')}
              alt="Genuine Resource Planner UI"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: '0.04em',
                border: '1px solid #38bdf8',
              }}
            >
              VERIFIED LOGISTICS: BAILEY BRIDGE (₹1.8 CR) + MMU CLINIC (₹25L)
            </div>
          </div>
        </div>
      )}

      <Captions
        text="Response planning must account for available resources, demand, priorities and operational constraints. A feasible recommendation should follow from those inputs. When constraints cannot be satisfied, the system must expose the limitation rather than invent a plan."
        subtext="CONSTRAINED ALLOCATION: INVENTORY HARD-CAPS • BUDGET CEILING ₹250L • ZERO HALLUCINATED CAPACITY"
      />
    </div>
  );
};
