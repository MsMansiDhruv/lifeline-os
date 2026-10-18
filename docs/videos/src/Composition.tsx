import React from 'react';
import { Composition, Sequence } from 'remotion';
import { Scene1Problem } from './scenes/Scene1Problem';
import { Scene2Intro } from './scenes/Scene2Intro';
import { Scene3Evidence } from './scenes/Scene3Evidence';
import { Scene4Impact } from './scenes/Scene4Impact';
import { Scene5Planning } from './scenes/Scene5Planning';
import { Scene6Review } from './scenes/Scene6Review';
import { Scene7Architecture } from './scenes/Scene7Architecture';
import { Scene8Close } from './scenes/Scene8Close';

export const TOTAL_DURATION_IN_FRAMES = 6600; // 220 seconds (3m 40s) @ 30fps
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const MainStoryComposition: React.FC = () => {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* SCENE 1: THE PROBLEM (0-18s) */}
      <Sequence from={0} durationInFrames={18 * FPS} name="Scene 1: The Problem">
        <Scene1Problem />
      </Sequence>

      {/* SCENE 2: INTRODUCE LIFELINE OS (18-38s) */}
      <Sequence from={18 * FPS} durationInFrames={20 * FPS} name="Scene 2: Introduce Lifeline OS">
        <Scene2Intro />
      </Sequence>

      {/* SCENE 3: EVIDENCE & VALIDATION (38-65s) */}
      <Sequence from={38 * FPS} durationInFrames={27 * FPS} name="Scene 3: Evidence and Validation">
        <Scene3Evidence />
      </Sequence>

      {/* SCENE 4: GEOSPATIAL IMPACT & ACCESSIBILITY (65-102s) */}
      <Sequence from={65 * FPS} durationInFrames={37 * FPS} name="Scene 4: Geospatial Impact">
        <Scene4Impact />
      </Sequence>

      {/* SCENE 5: RESPONSE PLANNING (102-140s) */}
      <Sequence from={102 * FPS} durationInFrames={38 * FPS} name="Scene 5: Response Planning">
        <Scene5Planning />
      </Sequence>

      {/* SCENE 6: HUMAN REVIEW & AUDITABILITY (140-168s) */}
      <Sequence from={140 * FPS} durationInFrames={28 * FPS} name="Scene 6: Human Review & Audit">
        <Scene6Review />
      </Sequence>

      {/* SCENE 7: TECHNICAL ARCHITECTURE (168-192s) */}
      <Sequence from={168 * FPS} durationInFrames={24 * FPS} name="Scene 7: Technical Architecture">
        <Scene7Architecture />
      </Sequence>

      {/* SCENE 8: CLOSE (192-220s) */}
      <Sequence from={192 * FPS} durationInFrames={28 * FPS} name="Scene 8: Close & Synthesis">
        <Scene8Close />
      </Sequence>
    </div>
  );
};

export const LifelineVideoRoot = () => {
  return (
    <Composition
      id="LifelineOS-Demo"
      component={MainStoryComposition}
      durationInFrames={TOTAL_DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
