'use client';

import { useCallback, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Backdrop from '../Backdrop';
import CoverPlane from '../CoverPlane';
import SectionSet from '../SectionSet';
import { FRAMES, opt } from '@/lib/assets';
import { BACKDROP_FIT, backdropOpacity } from '@/lib/journey';
import { clamp01, getProgress, remap } from '@/lib/scroll-progress';

const INTAKE_Z = -48;
const INTAKE_FIT = BACKDROP_FIT - 2;

/**
 * Section 02 — The Group.
 *
 * The hero's aerial plate clears to reveal this interior, and the raw-material
 * bay then wipes up over it. The wipe carries a leading edge: without one the
 * two plates meet on an unexplained horizontal seam, which reads as a
 * rendering fault rather than a transition.
 */
export default function GroupSet() {
  const edge = useRef<THREE.Mesh>(null);
  const [intake, setIntake] = useState({ width: 60, height: 34 });

  const handleSize = useCallback(
    (size: { width: number; height: number }) => setIntake(size),
    [],
  );

  const slide = () => remap(getProgress('group'), 0.3, 0.62, -intake.height * 1.05, 0);

  useFrame(() => {
    if (!edge.current) return;
    const p = getProgress('group');
    edge.current.position.y = slide() + intake.height / 2;
    const material = edge.current.material as THREE.MeshBasicMaterial;
    material.opacity =
      clamp01(remap(p, 0.28, 0.34, 0, 1)) * clamp01(remap(p, 0.58, 0.64, 1, 0));
  });

  return (
    <SectionSet section="group">
      <Backdrop section="group" src={FRAMES.interior} />

      <CoverPlane
        url={opt(FRAMES.intake)}
        z={INTAKE_Z}
        fitDistance={INTAKE_FIT}
        offsetY={slide}
        opacity={() => backdropOpacity('group')}
        onSize={handleSize}
      />

      <mesh ref={edge} position={[0, 0, INTAKE_Z + 0.4]}>
        <planeGeometry args={[intake.width, 0.12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </SectionSet>
  );
}
