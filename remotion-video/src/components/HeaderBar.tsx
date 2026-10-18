import React from 'react';

interface HeaderBarProps {
  sceneNumber: number;
  totalScenes: number;
  sectionTitle: string;
  stageName: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  sceneNumber,
  totalScenes,
  sectionTitle,
  stageName,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 72,
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 64px',
        zIndex: 50,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              backgroundColor: '#0284c7',
            }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#0f172a',
            }}
          >
            LIFELINE OS
          </span>
        </div>
        <span style={{ color: '#cbd5e1', fontSize: 18 }}>/</span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#0284c7',
            backgroundColor: '#f0f9ff',
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #bae6fd',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {stageName}
        </span>
        <span style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>
          {sectionTitle}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span
          style={{
            fontSize: 12,
            fontFamily: 'monospace',
            color: '#64748b',
            backgroundColor: '#f8fafc',
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #e2e8f0',
          }}
        >
          VERIFIED PROTOTYPE DEMO • 1920×1080 30FPS
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'monospace',
            color: '#0f172a',
          }}
        >
          {String(sceneNumber).padStart(2, '0')} / {String(totalScenes).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};
