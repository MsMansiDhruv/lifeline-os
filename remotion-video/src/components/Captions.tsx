import React from 'react';

interface CaptionsProps {
  text: string;
  subtext?: string;
}

export const Captions: React.FC<CaptionsProps> = ({ text, subtext }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 36,
        left: 64,
        right: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          padding: '14px 28px',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
          maxWidth: 1200,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 500,
            color: '#f8fafc',
            lineHeight: 1.45,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.01em',
          }}
        >
          {text}
        </p>
        {subtext && (
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: 13,
              fontWeight: 600,
              color: '#38bdf8',
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
