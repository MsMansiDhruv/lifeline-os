import React from 'react';
import { interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { HeaderBar } from '../components/HeaderBar';
import { Captions } from '../components/Captions';

export const Scene6Review: React.FC = () => {
  const frame = useCurrentFrame();

  // Animation timeline across 840 frames (28 seconds)
  const isFormView = frame < 480;
  const formOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const alertOpacity = interpolate(frame, [480, 510], [0, 1], {
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
      <Audio src={staticFile('audio/scene6_review.wav')} />

      <HeaderBar
        sceneNumber={6}
        totalScenes={8}
        stageName="Human Review & Auditability"
        sectionTitle="Statutory Requisition Orders & Provenance Traceability"
      />

      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 64,
          right: 64,
          bottom: 120,
          display: 'grid',
          gridTemplateColumns: '480px 1fr',
          gap: 40,
          alignItems: 'center',
        }}
      >
        {/* Left Column: Human Decision Support Principles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 999,
                color: '#1d4ed8',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: '0.04em',
                marginBottom: 12,
              }}
            >
              <span>HUMAN-IN-THE-LOOP AUTHORIZATION</span>
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 40,
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              Traceable accountability for <br />
              <span style={{ color: '#0284c7' }}>statutory civil orders.</span>
            </h2>

            <p style={{ fontSize: 16, color: '#475569', margin: '10px 0 0 0', lineHeight: 1.45 }}>
              AI models provide situational intelligence, not autonomous authority. Operational dispatch requires executive sign-off from the District Magistrate under the Disaster Management Act, 2005.
            </p>
          </div>

          {/* Review Cards */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>
              LEGAL COMPLIANCE
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
              SDRF Form-3B Requisition Order
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Statutory legal order under Section 30(2) &amp; Section 34 of the Disaster Management Act, 2005.
            </div>
          </div>

          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', fontFamily: 'monospace' }}>
              IMMUTABLE AUDIT TRAIL
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
              SHA-256 Cryptographic Verification
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
              SEOC-SHA256: d8f3a2c0...419b
            </div>
          </div>

          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309', fontFamily: 'monospace' }}>
              DISCLOSED SIMULATION
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginTop: 4 }}>
              Clearly Labelled Notification Sandbox
            </div>
            <div style={{ fontSize: 13, color: '#78350f', marginTop: 2 }}>
              Proposed SMS evacuation alerts are reviewed and transmitted in sandbox mode to prevent civil panic.
            </div>
          </div>
        </div>

        {/* Right Column: Actual Statutory Order Screenshot or Simulated Alert */}
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
          {isFormView ? (
            <img
              src={staticFile('assets/09_sanction_order_audit_trail.png')}
              alt="Statutory SDRF Sanction Order Form-3B"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: formOpacity,
              }}
            />
          ) : (
            <img
              src={staticFile('assets/10_simulated_alert.png')}
              alt="Labelled Simulated Emergency Notification"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: alertOpacity,
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
            {isFormView
              ? 'FORM-3B VERIFIED • DISASTER MANAGEMENT ACT SECTION 30(2)'
              : 'DEMONSTRATION SANDBOX • SIMULATED MULTILINGUAL EMERGENCY ALERT'}
          </div>
        </div>
      </div>

      <Captions
        text="Lifeline OS is designed to support human decisions, not replace them. Evidence, assumptions and constraints should remain traceable, and operational action must remain subject to appropriate review."
        subtext="STATUTORY AUDITABILITY: LEGAL SANCTION ORDER • SHA-256 PROVENANCE • HUMAN APPROVAL REQUIRED"
      />
    </div>
  );
};
