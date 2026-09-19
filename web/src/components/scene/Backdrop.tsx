'use client';

import { useCallback, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CoverPlane from './CoverPlane';
import { BACKDROP_FIT, BACKDROP_Z, backdropOpacity, handoverProgress } from '@/lib/journey';
import type { SectionKey } from '@/lib/scroll-progress';
import { opt } from '@/lib/assets';

/**
 * A section's full-frame backdrop plate.
 *
 * The hand-off is a wipe, not a crossfade. The outgoing plate stays fully
 * opaque and simply travels up out of frame, uncovering the next plate, which
 * has already reached full opacity while hidden behind it. Fading between two
 * photographs cannot avoid both failure modes — hold them each half-transparent
 * and the page washes out to blank white, fade them in step and two factory
 * interiors show through one another. Moving an opaque plate has neither
 * problem, and it carries the forward motion of the flight.
 */
export default function Backdrop({
  section,
  src,
  tint = '#ffffff',
  z = BACKDROP_Z,
  bleed,
}: {
  section: SectionKey;
  src: string;
  tint?: string;
  z?: number;
  /** Oversize, for plates the camera pans across. */
  bleed?: number;
}) {
  const [height, setHeight] = useState(40);
  const [width, setWidth] = useState(60);
  const edge = useRef<THREE.Mesh>(null);

  const handleSize = useCallback((size: { width: number; height: number }) => {
    setHeight(size.height);
    setWidth(size.width);
  }, []);

  /** How far the plate has travelled out of frame. */
  const lift = () => handoverProgress(section) * height * 1.12;

  useFrame(() => {
    if (!edge.current) return;
    const travel = handoverProgress(section);
    edge.current.position.y = lift() - height / 2;
    const material = edge.current.material as THREE.MeshBasicMaterial;
    // Only while the edge is actually crossing the frame.
    material.opacity = travel > 0.02 && travel < 0.96 ? 0.85 : 0;
  });

  return (
    <group>
      <CoverPlane
        url={opt(src)}
        z={z}
        fitDistance={BACKDROP_FIT + (BACKDROP_Z - z)}
        tint={tint}
        bleed={bleed}
        offsetY={lift}
        opacity={() => backdropOpacity(section)}
        onSize={handleSize}
      />

      {/* The wipe's leading edge, so the move reads as deliberate rather than
          as the picture slipping. */}
      <mesh ref={edge} position={[0, 0, z + 0.3]}>
        <planeGeometry args={[width, 0.09]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
