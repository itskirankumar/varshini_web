'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { approach, clamp01, journeyTime, remap, smoothstep } from '@/lib/scroll-progress';
import { cameraZAt, setCameraTime } from '@/lib/journey';

/**
 * The single camera for the whole page.
 *
 * Position is a pure function of how far the reader has scrolled — no section
 * reaches out and sets it, and nothing depends on event ordering. The camera
 * simply flies forward at a constant rate through the sets, which is what
 * makes the page read as one continuous shot rather than eight separate ones.
 *
 * The sway is deliberately slow and small. Camera movement that is obviously
 * animated reads as a gimmick; movement just past the threshold of notice
 * reads as a real camera on a real rig.
 */
export default function CameraRig() {
  const t = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const { camera, clock } = state;

    t.current = approach(t.current, journeyTime(), 6, delta);
    const time = t.current;
    // Publish the smoothed value so the sets fade in step with the camera.
    setCameraTime(time);

    // Hand-held float, on two incommensurate periods so it never visibly loops.
    const bob = Math.sin(clock.elapsedTime * 0.31) * 0.28;
    const drift = Math.cos(clock.elapsedTime * 0.21) * 0.42;

    // Through the opening shot the camera makes one deliberate move: across and
    // down toward the loading bays on the right of the plant, so the section
    // ends at the entrance the next one steps through. The idle swing is held
    // back until that move is done, or the two would cancel each other out.
    const approachEntrance = smoothstep(clamp01(time));
    const entranceX = approachEntrance * 3.2;
    const entranceY = approachEntrance * -1.1;

    const swingAmount = clamp01(remap(time, 0.85, 1.5, 0, 1)) * 1.9;
    const swing = Math.sin(time * Math.PI) * swingAmount;

    pointer.current.x = approach(pointer.current.x, state.pointer.x, 2.5, delta);
    pointer.current.y = approach(pointer.current.y, state.pointer.y, 2.5, delta);

    camera.position.set(
      swing + drift + entranceX + pointer.current.x * 1.1,
      bob + entranceY + pointer.current.y * 0.7,
      cameraZAt(time),
    );

    // Look ahead down the flight path, leading the turn slightly into the swing.
    camera.lookAt(
      swing * 0.35 + entranceX * 1.15 + pointer.current.x * 0.5,
      bob * 0.3 + entranceY * 1.1,
      cameraZAt(time) - 45,
    );
  });

  return null;
}
