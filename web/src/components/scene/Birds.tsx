'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getCameraTime } from '@/lib/journey';
import { clamp01, remap } from '@/lib/scroll-progress';

/**
 * Procedural bird flock — realistic silhouettes with natural flight.
 *
 * Each bird is a small mesh built from a tapered body and two animated wings.
 * Wings flap with varied frequency and phase so no two birds beat in sync.
 * Flight paths use layered sine waves for gentle drifting, banking, and
 * altitude changes — the kind of unhurried thermal-riding motion real birds
 * make over an open field.
 *
 * No external model required: the geometry is a handful of triangles per bird,
 * drawn as a single instanced mesh for performance.
 */

const BIRD_COUNT = 18;

/** Seed data for each bird: position offsets, speed, phase, size. */
interface BirdSeed {
  /** Offset from flock centre */
  ox: number;
  oy: number;
  oz: number;
  /** Flight speed multiplier */
  speed: number;
  /** Wing flap phase offset */
  phase: number;
  /** Wing flap frequency */
  freq: number;
  /** Scale */
  size: number;
}

/** Pseudo-random seeded from index for deterministic flock layout. */
function seeded(i: number, offset = 0): number {
  const x = Math.sin(i * 127.1 + offset * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function createSeeds(): BirdSeed[] {
  return Array.from({ length: BIRD_COUNT }, (_, i) => ({
    ox: (seeded(i, 0) - 0.5) * 28,
    oy: (seeded(i, 1) - 0.5) * 6,
    oz: (seeded(i, 2) - 0.5) * 20,
    speed: 0.6 + seeded(i, 3) * 0.8,
    phase: seeded(i, 4) * Math.PI * 2,
    freq: 3.5 + seeded(i, 5) * 3.0,
    size: 0.18 + seeded(i, 6) * 0.14,
  }));
}

/**
 * Build a single bird shape: body + two wing halves.
 * Wingspan ~2 units, body ~0.6 units long. Intentionally tiny.
 */
function createBirdGeometry(): THREE.BufferGeometry {
  const verts: number[] = [];

  // Body — elongated diamond
  // Front
  verts.push(0, 0, 0.35);
  verts.push(-0.05, 0.02, 0);
  verts.push(0.05, 0.02, 0);
  // Rear
  verts.push(0, 0, -0.3);
  verts.push(-0.05, 0.02, 0);
  verts.push(0.05, 0.02, 0);
  // Tail fork
  verts.push(-0.06, 0, -0.42);
  verts.push(0, 0, -0.3);
  verts.push(0.06, 0, -0.42);

  // Left wing — 3 triangles for a swept shape
  verts.push(0, 0.02, 0.08);
  verts.push(-0.5, 0.04, -0.04);
  verts.push(0, 0.02, -0.12);

  verts.push(-0.5, 0.04, -0.04);
  verts.push(-1.0, 0.02, -0.14);
  verts.push(-0.4, 0.03, -0.1);

  // Right wing — mirror
  verts.push(0, 0.02, 0.08);
  verts.push(0.5, 0.04, -0.04);
  verts.push(0, 0.02, -0.12);

  verts.push(0.5, 0.04, -0.04);
  verts.push(1.0, 0.02, -0.14);
  verts.push(0.4, 0.03, -0.1);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Material — dark silhouette, like birds seen against sky at distance. */
const birdMaterial = new THREE.MeshStandardMaterial({
  color: '#1a1a18',
  roughness: 0.9,
  metalness: 0.0,
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: true,
});

export default function Birds() {
  const groupRef = useRef<THREE.Group>(null);
  const birdRefs = useRef<(THREE.Group | null)[]>([]);
  const seeds = useMemo(createSeeds, []);

  // Separate refs for left and right wing groups per bird
  const wingLRefs = useRef<(THREE.Group | null)[]>([]);
  const wingRRefs = useRef<(THREE.Group | null)[]>([]);

  const geo = useMemo(createBirdGeometry, []);

  // Build individual wing geometries for animation
  const wingGeoL = useMemo(() => {
    const verts = [
      // Inner wing
      0, 0.02, 0.08, -0.5, 0.04, -0.04, 0, 0.02, -0.12,
      // Outer wing
      -0.5, 0.04, -0.04, -1.0, 0.02, -0.14, -0.4, 0.03, -0.1,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  const wingGeoR = useMemo(() => {
    const verts = [
      0, 0.02, 0.08, 0.5, 0.04, -0.04, 0, 0.02, -0.12,
      0.5, 0.04, -0.04, 1.0, 0.02, -0.14, 0.4, 0.03, -0.1,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  const bodyGeo = useMemo(() => {
    const verts = [
      // Front
      0, 0, 0.35, -0.05, 0.02, 0, 0.05, 0.02, 0,
      // Rear
      0, 0, -0.3, -0.05, 0.02, 0, 0.05, 0.02, 0,
      // Tail
      -0.06, 0, -0.42, 0, 0, -0.3, 0.06, 0, -0.42,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame((state) => {
    const root = groupRef.current;
    if (!root) return;

    const t = state.clock.elapsedTime;

    // Fade out as user scrolls past the hero section
    const visibility = clamp01(remap(getCameraTime(), 0.55, 0.9, 1, 0));
    birdMaterial.opacity = visibility;
    root.visible = visibility > 0.01;
    if (!root.visible) return;

    for (let i = 0; i < BIRD_COUNT; i++) {
      const bird = birdRefs.current[i];
      const wingL = wingLRefs.current[i];
      const wingR = wingRRefs.current[i];
      if (!bird || !wingL || !wingR) continue;

      const s = seeds[i];
      const time = t * s.speed;

      // Circular/figure-8 path with drift — natural thermal riding
      const pathX = s.ox + Math.sin(time * 0.15 + s.phase) * 12 +
                    Math.sin(time * 0.07 + s.phase * 1.3) * 6;
      const pathY = 8 + s.oy + Math.sin(time * 0.12 + s.phase * 0.7) * 2.5 +
                    Math.sin(time * 0.25 + s.phase) * 0.8;
      const pathZ = -30 + s.oz + Math.cos(time * 0.1 + s.phase) * 10 +
                    Math.sin(time * 0.18 + s.phase * 2.1) * 5;

      bird.position.set(pathX, pathY, pathZ);
      bird.scale.setScalar(s.size);

      // Face direction of travel (approximate via derivative)
      const dx = Math.cos(time * 0.15 + s.phase) * 12 * 0.15 +
                 Math.cos(time * 0.07 + s.phase * 1.3) * 6 * 0.07;
      const dz = -Math.sin(time * 0.1 + s.phase) * 10 * 0.1 +
                  Math.cos(time * 0.18 + s.phase * 2.1) * 5 * 0.18;
      const heading = Math.atan2(dx, dz);
      bird.rotation.y = heading;

      // Bank into turns — tilt toward the direction of horizontal acceleration
      const bank = -dx * 0.08;
      bird.rotation.z = THREE.MathUtils.clamp(bank, -0.35, 0.35);

      // Wing flap — smooth sinusoidal with slight asymmetry for realism
      const flap = Math.sin(time * s.freq + s.phase) * 0.45;
      const flapOuter = flap * 1.15; // Outer wing bends a bit more

      wingL.rotation.z = flap + Math.sin(time * s.freq * 0.5 + s.phase) * 0.08;
      wingR.rotation.z = -(flap + Math.sin(time * s.freq * 0.5 + s.phase + 0.3) * 0.08);
    }
  });

  return (
    <group ref={groupRef}>
      {seeds.map((s, i) => (
        <group
          key={i}
          ref={(el) => { birdRefs.current[i] = el; }}
          position={[s.ox, 8 + s.oy, -30 + s.oz]}
          scale={s.size}
        >
          {/* Body */}
          <mesh geometry={bodyGeo} material={birdMaterial} />
          {/* Left wing — rotates from the body centre */}
          <group
            ref={(el) => { wingLRefs.current[i] = el; }}
          >
            <mesh geometry={wingGeoL} material={birdMaterial} />
          </group>
          {/* Right wing */}
          <group
            ref={(el) => { wingRRefs.current[i] = el; }}
          >
            <mesh geometry={wingGeoR} material={birdMaterial} />
          </group>
        </group>
      ))}
    </group>
  );
}
