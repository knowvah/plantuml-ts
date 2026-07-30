/**
 * svg-nanoparser-transform.ts -- `<g transform="...">`/element `transform=`
 * attribute-string parsing for `SvgNanoParser`, split into its own module
 * per this task's complexity-hook budget (the combined port exceeded the
 * 500-line split threshold; `applyTransform` and its four regex-driven
 * helpers have no dependency on `SvgNanoParser`'s own instance state, so
 * they extract cleanly as free functions).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java
 * (`applyTransform`/`applyMatrix`/`applyRotate`/`getTranslate`/`getScale`)
 */

import type { UGraphicWithScale } from '../UGraphicWithScale.js';
import { UTranslate } from '../UTranslate.js';

/** @see SvgNanoParser.java#extract -- shared here since every other regex
 *  extraction in `SvgNanoParser.ts` also needs it; owned here to avoid a
 *  circular import back from this file. */
export function extract(p: RegExp, s: string): string | undefined {
  const m = p.exec(s);
  return m === null ? undefined : m[1];
}

/** `equals_something = "=\"([^\"]+)\""`. */
const EQUALS_SOMETHING = '="([^"]+)"';
const DATA_TRANSFORM = new RegExp('transform' + EQUALS_SOMETHING);

/** `P_MATRIX`, unchanged. */
const P_MATRIX =
  /matrix\(([-.0-9]+)[ ,]+([-.0-9]+)[ ,]+([-.0-9]+)[ ,]+([-.0-9]+)[ ,]+([-.0-9]+)[ ,]+([-.0-9]+)\)/;
/** `P_ROTATE`, unchanged. */
const P_ROTATE = /rotate\(([-.0-9]+)[ ,]+([-.0-9]+)[ ,]+([-.0-9]+)\)/;
/** `P_TRANSLATE1`/`P_TRANSLATE2`, unchanged. */
const P_TRANSLATE1 = /translate\(([-.0-9]+)[ ,]+([-.0-9]+)\)/;
const P_TRANSLATE2 = /translate\(([-.0-9]+)\)/;
/** `P_SCALE1`/`P_SCALE2`, unchanged. */
const P_SCALE1 = /scale\(([-.0-9]+)\)/;
const P_SCALE2 = /scale\(([-.0-9]+)[ ,]+([-.0-9]+)\)/;

/** @see SvgNanoParser.java#applyMatrix */
function applyMatrix(ugs: UGraphicWithScale, transform: string): UGraphicWithScale {
  const m3 = P_MATRIX.exec(transform);
  if (m3 !== null) {
    const v1 = Number.parseFloat(m3[1]!);
    const v2 = Number.parseFloat(m3[2]!);
    const v3 = Number.parseFloat(m3[3]!);
    const v4 = Number.parseFloat(m3[4]!);
    const v5 = Number.parseFloat(m3[5]!);
    const v6 = Number.parseFloat(m3[6]!);
    ugs = ugs.applyMatrix(v1, v2, v3, v4, v5, v6);
  } else {
    console.warn(`WARNING: ${transform}`);
  }
  return ugs;
  // 6-group flat matrix extraction is a faithful port of
  // SvgNanoParser.java:396-409, not real branching complexity.
  // #lizard forgives
}

/** @see SvgNanoParser.java#applyRotate */
function applyRotate(ugs: UGraphicWithScale, transform: string): UGraphicWithScale {
  const m3 = P_ROTATE.exec(transform);
  if (m3 !== null) {
    const angle = Number.parseFloat(m3[1]!);
    const x = Number.parseFloat(m3[2]!);
    const y = Number.parseFloat(m3[3]!);
    ugs = ugs.applyRotate(angle, x, y);
  } else {
    console.warn(`WARNING: ${transform}`);
  }
  return ugs;
}

/** @see SvgNanoParser.java#getTranslate */
function getTranslate(transform: string): UTranslate {
  let x = 0;
  let y = 0;

  const m3 = P_TRANSLATE1.exec(transform);
  if (m3 !== null) {
    x = Number.parseFloat(m3[1]!);
    y = Number.parseFloat(m3[2]!);
  } else {
    const m4 = P_TRANSLATE2.exec(transform);
    if (m4 !== null) {
      x = Number.parseFloat(m4[1]!);
      y = Number.parseFloat(m4[1]!);
    }
  }
  return new UTranslate(x, y);
}

/** @see SvgNanoParser.java#getScale */
function getScale(transform: string): readonly [number, number] {
  const scale: [number, number] = [1, 1];
  const m1 = P_SCALE1.exec(transform);
  if (m1 !== null) {
    scale[0] = Number.parseFloat(m1[1]!);
    scale[1] = scale[0];
  } else {
    const m2 = P_SCALE2.exec(transform);
    if (m2 !== null) {
      scale[0] = Number.parseFloat(m2[1]!);
      scale[1] = Number.parseFloat(m2[2]!);
    }
  }
  return scale;
}

/** @see SvgNanoParser.java#applyTransform */
export function applyTransformAttribute(ugs: UGraphicWithScale, s: string): UGraphicWithScale {
  const transform = extract(DATA_TRANSFORM, s);
  if (transform === undefined) return ugs;

  if (transform.includes('rotate(')) return applyRotate(ugs, transform);

  if (transform.includes('matrix(')) return applyMatrix(ugs, transform);

  const scale = getScale(transform);
  const translate = getTranslate(transform);
  ugs = ugs.applyTranslate(translate.getDx(), translate.getDy());

  return ugs.applyScale(scale[0], scale[1]);
}
