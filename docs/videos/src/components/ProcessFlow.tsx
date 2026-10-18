import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface ProcessFlowProps {
  activeStageIndex?: number;
  progressFrame?: number;
}

const STAGES = [
  { id: 'sources', title: 'Data Sources', sub: 'Satellite, Gauge, OSM', icon: '📡' },
  { id: 'validation', title: 'Validation', sub: 'Provenance & Bounds', icon: '🛡️' },
  { id: 'geospatial', title: 'Geospatial Analysis', sub: 'Topological Overlays', icon: '🗺️' },
  { id: 'impact', title: 'Impact Assessment', sub: 'Cut-off Corridors & Surge', icon: '⚡' },
  { id: 'planning', title: 'Response Planning', sub: 'Deterministic Solver', icon: '⚙️' },
  { id: 'review', title: 'Human Review', sub: 'Statutory Order & Audit', icon: '⚖️' },
];

export const ProcessFlow: React.FC<ProcessFlowProps> = ({ activeStageIndex = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
        maxWidth: 1600,
        margin: '0 auto',
      }}
    >
      {STAGES.map((st, i) => {
        const stageDelay = i * 15;
        const opacity = interpolate(frame, [stageDelay, stageDelay + 15], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const translateY = interpolate(frame, [stageDelay, stageDelay + 15], [20, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const isCurrent = activeStageIndex === i;
        const isPassed = activeStageIndex > i;

        let borderColor = '#e2e8f0';
        let bgColor = '#ffffff';
        let textColor = '#0f172a';
        let badgeBg = '#f1f5f9';
        let badgeColor = '#64748b';

        if (isCurrent) {
          borderColor = '#0284c7';
          bgColor = '#f0f9ff';
          textColor = '#0369a1';
          badgeBg = '#0284c7';
          badgeColor = '#ffffff';
        } else if (isPassed) {
          borderColor = '#0d9488';
          bgColor = '#f0fdf4';
          textColor = '#115e59';
          badgeBg = '#0d9488';
          badgeColor = '#ffffff';
        }

        return (
          <React.Fragment key={st.id}>
            <div
              style={{
                flex: 1,
                opacity,
                transform: `translateY(${translateY}px)`,
                backgroundColor: bgColor,
                border: `2px solid ${borderColor}`,
                borderRadius: 12,
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: isCurrent
                  ? '0 10px 25px -5px rgba(2, 132, 199, 0.2)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 22 }}>{st.icon}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  STAGE 0{i + 1}
                </span>
              </div>
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: textColor,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {st.title}
                </h4>
                <p
                  style={{
                    margin: '3px 0 0 0',
                    fontSize: 12,
                    color: '#64748b',
                    lineHeight: 1.3,
                  }}
                >
                  {st.sub}
                </p>
              </div>
            </div>

            {i < STAGES.length - 1 && (
              <div
                style={{
                  width: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isPassed ? '#0d9488' : '#cbd5e1',
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                →
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
