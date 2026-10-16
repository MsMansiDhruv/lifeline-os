// Bulletproof Dual-Engine Web Audio API Synthesizer + Speech Synthesis
// Zero-dependency, works inside sandboxed iframes without external assets

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// 1. Tactical Radar Ping (corridor selection, button clicks)
export function playRadarPing(freq = 980) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.6, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch (e) {
    // Audio context silently ignored if blocked by autoplay policy
  }
}

// 2. Warning Beep (16T truck limit, budget overrun, unserved critical casualty)
export function playWarningBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.setValueAtTime(260, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {}
}

// 3. Deep Sonar Pulse (Marine boat launch, drone takeoff, water crossing)
export function playSonarPulse() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.55);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}

// 4. Mission Launch Chime (Ascending 4-tone harmonic arpeggio for T-00:00 Launch)
export function playLaunchChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch (e) {}
}

// 5. Victory Triumph Chord (Mission Accomplished - 148 Lives Saved)
export function playVictoryChord() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25]; // C4, E4, G4, C5, E5
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.8);
    });
  } catch (e) {}
}

// 6. Subtle Click
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {}
}

// Speech Synthesis Helper with GC Protection & Fallback
export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export function speakTacticalNarration(text: string, options: SpeakOptions = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    // Ensure audio context is ready
    getAudioContext();

    // Split into sentences if text is long (< 130 chars avoids Chrome silence bug)
    const cleanText = text.slice(0, 160);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.rate = options.rate ?? 1.05;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.lang = 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel'))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    // Prevent GC cutoff bug by retaining reference on window
    (window as any).__currentTTSUtterance = utterance;

    if (options.onStart) utterance.onstart = options.onStart;
    utterance.onend = () => {
      (window as any).__currentTTSUtterance = null;
      options.onEnd?.();
    };
    utterance.onerror = () => {
      (window as any).__currentTTSUtterance = null;
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    options.onEnd?.();
  }
}

export function stopTacticalNarration() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    (window as any).__currentTTSUtterance = null;
  }
}
