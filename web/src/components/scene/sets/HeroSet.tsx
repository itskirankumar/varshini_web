'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Backdrop from '../Backdrop';
import Birds from '../Birds';
import FitText from '../FitText';
import SectionSet from '../SectionSet';
import { FONT_SERIF_URL, FRAMES } from '@/lib/assets';
import { approach, clamp01, getProgress, remap, smoothstep } from '@/lib/scroll-progress';
import { CAM_LEAD } from '@/lib/journey';

const CREAM = '#ffffff';
/** Brand green, lifted from the deep accent so it holds against photography. */
const BRAND_GREEN = '#9ad24e';

/**
 * The headline, positioned so the camera flies straight through it.
 *
 * Two faces rather than one: a tight condensed display line answered by a
 * serif italic, ragged to the same left margin and set at very different
 * sizes. A single centred face at full frame width reads as a banner laid on
 * top of the picture; this reads as a title designed for it — and at these
 * smaller sizes the photograph behind stays the subject.
 *
 * The camera passes z = 0 halfway through the section, so the lines start just
 * ahead of it and separate on Z as it approaches: one rushes past the viewer,
 * the other retreats toward the plate the camera is heading for.
 */
const LINES = [
  {
    text: 'YOUR BRAND.',
    from: -2,
    to: 16,
    color: BRAND_GREEN,
    fill: 0.46,
    font: undefined as string | undefined,
    letterSpacing: -0.02,
    offset: 0.34,
    /** Sweeps right and enlarges as it comes toward the viewer, so the line
     *  exits past the right of the frame rather than straight through it. */
    driftX: 16,
    shadow: { blur: 0.09, offsetX: 0.012, offsetY: -0.016, opacity: 0.42 },
  },
  {
    text: 'Our plant.',
    from: -6,
    to: -26,
    color: CREAM,
    fill: 0.34,
    font: FONT_SERIF_URL,
    letterSpacing: 0,
    offset: -0.62,
    driftX: 0,
    shadow: { blur: 0.07, offsetX: 0.01, offsetY: -0.012, opacity: 0.3 },
  },
] as const;

/** Cap height as a fraction of em — how tall a line actually reads. */
const CAP_RATIO = 0.72;

/** Troika's text mesh, which carries fill opacity as its own property. */
type TroikaText = THREE.Mesh & { fillOpacity: number };

export default function HeroSet() {
  const lineRefs = useRef<(THREE.Group | null)[]>([]);
  const fitted = useRef<number[]>([1, 1]);
  const smoothed = useRef(0);

  useFrame((state, delta) => {
    const { camera } = state;
    smoothed.current = approach(smoothed.current, getProgress('hero'), 7, delta);
    const p = smoothed.current;

    LINES.forEach((line, i) => {
      const group = lineRefs.current[i];
      if (!group) return;
      const glyphs = group.children[0] as TroikaText | undefined;
      if (!glyphs) return;

      // Stack against the solved cap heights so the two faces sit tight
      // together whatever size the fit landed on.
      const cap = Math.max(...fitted.current) * CAP_RATIO;
      const baseY = line.offset * cap;

      group.position.z = THREE.MathUtils.lerp(line.from, line.to, p);
      group.position.y = THREE.MathUtils.lerp(baseY, baseY * 2.4, p);
      // Eased so the slide starts gently rather than snapping off the mark.
      group.position.x = line.driftX * smoothstep(p);

      // Fade a line only once it is past the camera or far behind the frame —
      // never mid-frame, where it would read as a glitch.
      const gap = group.position.z - camera.position.z;
      glyphs.fillOpacity =
        clamp01(remap(gap, 0.5, -3.5, 0, 1)) * clamp01(remap(p, 0.82, 0.96, 1, 0));
    });
  });
  const backdropGroup = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!backdropGroup.current) return;
    // Scroll-driven push-in: starts at 1.0 (exact fit) → grows to 1.35 as
    // the user scrolls through the hero. Image stays pixel-sharp at rest.
    const p = clamp01(getProgress('hero'));
    const zoom = 1.0 + p * 0.35;
    backdropGroup.current.scale.setScalar(zoom);
  });

  return (
    <SectionSet section="hero">
      {/* Wrap backdrop so we can scale it with scroll without rebuilding geometry */}
      <group ref={backdropGroup}>
        <Backdrop section="hero" src={FRAMES.gate} bleed={1.0} />
      </group>

      {/* The flock belongs to the opening shot alone and clears as it ends. */}
      <Birds />

      {LINES.map((line, i) => (
        <group
          key={line.text}
          position={[0, 0, line.from]}
          ref={(el) => {
            lineRefs.current[i] = el;
          }}
        >
          <FitText
            fitDistance={CAM_LEAD - line.from}
            color={line.color}
            fill={line.fill}
            font={line.font}
            anchor="left"
            letterSpacing={line.letterSpacing}
            shadow={line.shadow}
            onFit={(size) => {
              fitted.current[i] = size;
            }}
          >
            {line.text}
          </FitText>
        </group>
      ))}
    </SectionSet>
  );
}
