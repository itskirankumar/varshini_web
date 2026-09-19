'use client';

import { useCallback, useRef, type ReactNode, type MouseEvent } from 'react';

/**
 * Maximum tilt angle in degrees. Kept subtle — the goal is a premium tactile
 * feel, not a carnival ride.
 */
const MAX_TILT = 8;

/**
 * Z-lift on hover in px. Creates the "card lifts off the surface" feeling.
 */
const LIFT_PX = 12;

/**
 * A wrapper that gives its child a 3D perspective-tilt driven by the cursor.
 *
 * How it works:
 *  1. A CSS `perspective` on the outer container establishes a 3D viewing
 *     plane — everything inside it is projected from a single vanishing point.
 *  2. On mouse-move the wrapper reads the cursor's normalised position inside
 *     the card (–1 … +1 on both axes) and sets `rotateX` / `rotateY` via a
 *     CSS custom property so it runs entirely on the compositor thread.
 *  3. The image layer has `translateZ(20px)` inside `preserve-3d`, so it
 *     parallax-shifts relative to the card body — the same depth trick real
 *     lenticular printing uses, just done in real-time.
 *  4. Box-shadow is repositioned to follow the tilt direction, anchoring the
 *     card to the dark surface beneath it.
 *  5. On mouse-leave everything eases back to flat with a slow cubic
 *     transition, so the card settles rather than snapping.
 *
 * Performance: all animated properties (`transform`, `box-shadow`, `opacity`)
 * are compositor-friendly. `will-change` is applied on hover only.
 */
export default function Tilt3DCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const handleMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = outer.current;
    const card = inner.current;
    if (!el || !card) return;

    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      // Normalise cursor to –1 … +1 from card centre.
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      // Tilt: Y-axis follows horizontal cursor, X-axis follows vertical
      // (inverted so the near edge tilts toward you, not away).
      const rotX = -ny * MAX_TILT;
      const rotY = nx * MAX_TILT;

      // Shadow offsets opposite to the tilt for a natural light-from-above.
      const shadowX = -nx * 14;
      const shadowY = -ny * 10 + 18;

      card.style.transform =
        `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${LIFT_PX}px)`;
      card.style.boxShadow =
        `${shadowX}px ${shadowY}px 40px -12px rgba(200,168,78,0.10), ` +
        `0 ${shadowY * 0.5}px 60px -20px rgba(0,0,0,0.55)`;
    });
  }, []);

  const handleEnter = useCallback(() => {
    const card = inner.current;
    if (!card) return;
    card.style.willChange = 'transform, box-shadow';
    card.style.transition =
      'transform 0.15s cubic-bezier(0.33,1,0.68,1), box-shadow 0.15s ease-out';
  }, []);

  const handleLeave = useCallback(() => {
    const card = inner.current;
    if (!card) return;
    cancelAnimationFrame(raf.current);
    // Slow, settling ease-out back to flat.
    card.style.transition =
      'transform 0.55s cubic-bezier(0.33,1,0.68,1), box-shadow 0.55s ease-out';
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    card.style.boxShadow = '';
    // Clear will-change after transition completes to free GPU memory.
    setTimeout(() => {
      if (card) card.style.willChange = '';
    }, 600);
  }, []);

  return (
    <div
      ref={outer}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="tilt-3d-outer"
    >
      <div ref={inner} className={`tilt-3d-inner ${className}`} style={{ transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  );
}
