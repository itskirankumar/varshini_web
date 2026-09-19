import { SECTIONS, clamp01, remap, smoothstep, type SectionKey } from './scroll-progress';

/**
 * Layout of the camera's flight through the page.
 *
 * Every section owns a slab of world space and the camera travels exactly one
 * slab per section. That equality is the whole trick: the flight is continuous
 * across section boundaries because the camera's position where one section
 * ends is precisely where the next begins — there is no seam to hide.
 */

/** World-space distance between consecutive section origins. */
export const SPACING = 20;

/** Camera passes symmetrically through each section's origin. */
export const CAM_LEAD = SPACING / 2;

/** Depth of a section's backdrop plate, relative to its own origin. */
export const BACKDROP_Z = -50;

/**
 * Distance the backdrop is cover-fitted for: the distance at the moment its
 * section begins. Held against the camera's travel this yields a 1.5x push-in
 * across the section — enough to feel like a move, short of a lurch.
 */
export const BACKDROP_FIT = -BACKDROP_Z + CAM_LEAD;

export const sectionIndex = (key: SectionKey) => SECTIONS.indexOf(key);

/** World Z of a section's origin. */
export const sectionOrigin = (key: SectionKey) => -sectionIndex(key) * SPACING;

/** Camera Z for a given point along the flight, measured in sections. */
export const cameraZAt = (t: number) => CAM_LEAD - t * SPACING;

/**
 * The camera's smoothed position along the flight.
 *
 * CameraRig damps the raw scroll value, so anything that has to agree with
 * where the camera actually is — backdrop fades above all — must read this
 * rather than recomputing from raw progress, or it will fade a plate out
 * before the camera has arrived.
 */
let cameraTime = 0;

export function setCameraTime(value: number) {
  cameraTime = value;
}

export function getCameraTime(): number {
  return cameraTime;
}

/**
 * Opacity for a section's backdrop.
 *
 * A section's plate reaches full opacity long before its own section arrives —
 * while it is still completely hidden behind the previous plate, so the fade-in
 * costs nothing visually. The handover is then a short dissolve of the outgoing
 * plate alone, revealing a backdrop that is already solid behind it.
 *
 * That ordering is what avoids both earlier failures at once. Two plates fading
 * independently left them each half-transparent over the page, which washed out
 * to a blank white screen; fading them in step across a wide window showed two
 * factory interiors through each other. Here the frame is always backed by one
 * fully opaque image, and the dissolve is over in a fraction of a section.
 */
export function backdropOpacity(key: SectionKey): number {
  const t = getCameraTime();
  const i = sectionIndex(key);

  // The first frame is already on screen when the page opens.
  const fadeIn = i === 0 ? 1 : remap(t, i - 0.5, i - 0.3, 0, 1);
  // Held opaque right through the wipe; it stops drawing only once it is clear
  // of the frame, so nothing is ever seen through it.
  const retire = remap(t, i + 1.16, i + 1.2, 1, 0);

  return clamp01(fadeIn * retire);
}

/**
 * How far through its exit wipe a section's plate is, 0 to 1.
 *
 * Runs slightly past the section boundary so the uncovering is still in motion
 * as the next section's copy arrives, rather than completing early and leaving
 * a static frame.
 */
export function handoverProgress(key: SectionKey): number {
  const t = getCameraTime();
  const i = sectionIndex(key);
  return smoothstep(remap(t, i + 0.9, i + 1.14, 0, 1));
}

/**
 * Same non-overlapping dissolve, for plates that switch within a section
 * (the technology carousel's four steps).
 */
export function stepOpacity(step: number, index: number, last: number): number {
  const fadeIn = index === 0 ? 1 : remap(step, index - 0.34, index - 0.1, 0, 1);
  const fadeOut = index === last ? 1 : remap(step, index + 0.1, index + 0.34, 1, 0);
  return clamp01(fadeIn * fadeOut);
}

/**
 * Where a transition effect sits: just ahead of the camera at the moment it
 * crosses from one section into the next.
 */
export const boundaryZ = (index: number) => cameraZAt(index + 1) - 16;

/**
 * Progress through a boundary's transition window, 0 to 1, and whether it is
 * worth drawing at all.
 *
 * Effects run only across their own hand-off. Outside that window they are
 * switched off entirely rather than merely faded, so a page with seven
 * transitions costs no more per frame than a page with one.
 */
export function transitionState(index: number): { progress: number; active: boolean } {
  const t = getCameraTime();
  const progress = clamp01(remap(t, index + 0.55, index + 1.35, 0, 1));
  return { progress, active: progress > 0.001 && progress < 0.999 };
}

/** Rises to 1 at the middle of a transition and falls away at either end. */
export const arch = (progress: number) => Math.sin(clamp01(progress) * Math.PI);

/** True once a set is far enough behind the camera to skip drawing entirely. */
export function setIsBehind(key: SectionKey): boolean {
  return getCameraTime() - sectionIndex(key) > 1.6;
}
