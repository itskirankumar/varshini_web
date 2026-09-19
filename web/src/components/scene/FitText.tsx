'use client';

import { forwardRef, useCallback, useRef, useState } from 'react';
import { Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FONT_DISPLAY_URL } from '@/lib/assets';

const FOV = 45;

type Props = {
  children: string;
  /** Camera distance the fit is solved for — the line keeps this world size
   *  afterwards, so moving it toward the camera genuinely enlarges it. */
  fitDistance: number;
  /** Fraction of the visible width the line should span at `fitZ`. */
  fill?: number;
  color?: string;
  /** Font file for troika. Defaults to the display face. */
  font?: string;
  /** Where the line sits in the frame. 'left' rags it to the frame's left
   *  margin, which reads as a designed column rather than a centred banner. */
  anchor?: 'center' | 'left';
  letterSpacing?: number;
  /** Soft drop shadow, as a fraction of the solved font size. Troika's outline
   *  doubles as a shadow when it is blurred and offset. */
  shadow?: { blur: number; offsetX: number; offsetY: number; opacity: number };
  /** Reports the solved world-space font size, so callers can stack lines
   *  against the size actually rendered rather than a guess. */
  onFit?: (fontSize: number) => void;
};

/**
 * Display type scaled to span the viewport width at a given depth.
 *
 * World-space font sizes are meaningless on their own — the same value is a
 * headline on a desktop and a wall of overflow on a phone. This measures the
 * rendered glyph run and solves for the size that fills the frame, so the
 * poster-width look holds at every viewport.
 */
const FitText = forwardRef<THREE.Mesh, Props>(function FitText(
  { children, fitDistance, fill = 0.92, color = '#f5f3ec', onFit, font = FONT_DISPLAY_URL, anchor = 'center', letterSpacing = -0.025, shadow },
  ref,
) {
  const { size } = useThree();
  const [fontSize, setFontSize] = useState(1);
  // onSync reports bounds at the *applied* size, so normalising by it is what
  // keeps this a one-step solve instead of a feedback loop.
  const appliedSize = useRef(1);

  const handleSync = useCallback(
    (troika: { textRenderInfo?: { blockBounds: number[] } }) => {
      const bounds = troika?.textRenderInfo?.blockBounds;
      if (!bounds) return;

      const renderedWidth = bounds[2] - bounds[0];
      if (renderedWidth <= 0) return;

      const widthPerUnit = renderedWidth / appliedSize.current;
      const visibleH = 2 * Math.tan((FOV * Math.PI) / 360) * fitDistance;
      const visibleW = visibleH * (size.width / size.height);
      const target = (visibleW * fill) / widthPerUnit;

      // Settle once we are within half a percent, or this never stops resyncing.
      if (Math.abs(target - appliedSize.current) / target < 0.005) return;
      appliedSize.current = target;
      setFontSize(target);
      onFit?.(target);
    },
    [fitDistance, fill, size.width, size.height, onFit],
  );

  // Visible frame width at this line's depth, for ragging it left. The margin
  // matches the DOM gutter, so the headline shares a left edge with the chrome
  // around it rather than floating on its own grid.
  const visibleWidth =
    2 * Math.tan((FOV * Math.PI) / 360) * fitDistance * (size.width / size.height);
  const offsetX = anchor === 'left' ? -visibleWidth / 2 + visibleWidth * 0.062 : 0;

  return (
    <Text
      ref={ref as never}
      font={font}
      position-x={offsetX}
      fontSize={fontSize}
      letterSpacing={letterSpacing}
      color={color}
      anchorX={anchor}
      anchorY="middle"
      outlineBlur={shadow ? `${shadow.blur * 100}%` : undefined}
      outlineOffsetX={shadow ? `${shadow.offsetX * 100}%` : undefined}
      outlineOffsetY={shadow ? `${shadow.offsetY * 100}%` : undefined}
      outlineColor={shadow ? '#0d0f0c' : undefined}
      outlineOpacity={shadow ? shadow.opacity : undefined}
      onSync={handleSync}
      // Troika renders through a material it derives internally, so opacity
      // must be driven via fillOpacity (see setFillOpacity) rather than by
      // attaching a material and writing to it.
      fillOpacity={1}
    >
      {children}
    </Text>
  );
});

export default FitText;
