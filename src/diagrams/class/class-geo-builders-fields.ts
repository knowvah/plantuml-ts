/**
 * class-geo-builders-fields.ts — small pure `Partial<ClassifierGeo>`
 * field-builder helpers used by `buildClassifierGeos`/
 * `degenerateSingleClassifier` (`class-geo-builders.ts`), split out purely
 * to keep that file under the project's per-file size cap (mirrors the
 * `layout.ts` -> `class-geo-builders.ts` split precedent — see that file's
 * own header doc comment). No behavior change; every symbol here was
 * previously defined verbatim in `class-geo-builders.ts`.
 */
import type { Classifier } from './ast.js';
import { LIKE_CLASS_KINDS, type MeasuredClassifier } from './class-layout-helpers.js';
import { PROTECTED_BORDER } from './class-dot-graph.js';
import type { ClassifierGeo } from './layout.js';

/**
 * The body-state fields `class-ink-box.ts` reads to pick a classifier's ink
 * rule (B5/M6's `emptyFieldPlaceholder`, B35/M40's `bodyInkWidth`, cdd3-T7's
 * `bodyInkHeight`) -- bundled into one spread so the two `ClassifierGeo`
 * literals below stay under this file's per-function NLOC cap. All stay
 * ABSENT when unset, exactly as spreading them individually did.
 */
export function inkBodyFields(m: MeasuredClassifier): Partial<ClassifierGeo> {
  return {
    ...(m.emptyFieldPlaceholder === true ? { emptyFieldPlaceholder: true as const } : {}),
    ...(m.bodyInkWidth !== undefined ? { bodyInkWidth: m.bodyInkWidth } : {}),
    ...(m.bodyInkHeight !== undefined ? { bodyInkHeight: m.bodyInkHeight } : {}),
    ...(m.symbolInk !== undefined ? { symbolInk: m.symbolInk } : {}),
  };
}

/** CDD B7FU-R2 item (c-b): the badge-decoration fields, shared by both
 *  `buildClassifierGeos`/`degenerateSingleClassifier` call sites below
 *  (identical spread, previously duplicated) -- `mirrors inkBodyFields`'s
 *  own "one shared helper, two callers" precedent. */
export function badgeFields(m: MeasuredClassifier): Partial<ClassifierGeo> {
  return {
    ...(m.badgeChar !== undefined ? { badgeChar: m.badgeChar } : {}),
    ...(m.badgeColor !== undefined ? { badgeColor: m.badgeColor } : {}),
    ...(m.badgeSpriteImage !== undefined ? { badgeSpriteImage: m.badgeSpriteImage } : {}),
  };
}

/** cdd-B10FU: `ClassifierGeo.protectedBorder` -- gated the SAME way
 *  `class-dot-graph.ts#protectedPad` gates the DOT node's own +40
 *  inflation (`protectedIds.has(id) && LIKE_CLASS_KINDS.has(kind)`, that
 *  function's own doc comment). Split out purely to keep
 *  `buildClassifierGeos`'s own NLOC/CCN under the project caps, same
 *  "one shared helper" precedent as {@link inkBodyFields}/{@link badgeFields}. */
export function protectedBorderField(
  classifier: Classifier,
  protectedIds: ReadonlySet<string>,
): Partial<ClassifierGeo> {
  return protectedIds.has(classifier.id) && LIKE_CLASS_KINDS.has(classifier.kind)
    ? { protectedBorder: PROTECTED_BORDER }
    : {};
}

/** G2 N19/N20/E3-16 assoc-circle-only phantom-rank fields (`Classifier
 *  .subsumedLinkCreationIndex`/`.subsumedLinkPhantomSlot`/
 *  `.apointNameCreationIndex`/`.invertedClassEdgeOldCreationIndex`/
 *  `.repeatCoupleInvisLinkCreationIndex`, `ast.ts`) -- split out to keep
 *  `buildClassifierGeos` under the NLOC cap ({@link protectedBorderField}). */
export function assocCircleBookkeepingFields(c: Classifier): Partial<ClassifierGeo> {
  return {
    ...(c.subsumedLinkCreationIndex !== undefined ? { subsumedLinkCreationIndex: c.subsumedLinkCreationIndex } : {}),
    ...(c.subsumedLinkPhantomSlot === true ? { subsumedLinkPhantomSlot: true as const } : {}),
    ...(c.apointNameCreationIndex !== undefined ? { apointNameCreationIndex: c.apointNameCreationIndex } : {}),
    ...(c.invertedClassEdgeOldCreationIndex !== undefined
      ? { invertedClassEdgeOldCreationIndex: c.invertedClassEdgeOldCreationIndex }
      : {}),
    ...(c.repeatCoupleInvisLinkCreationIndex !== undefined
      ? { repeatCoupleInvisLinkCreationIndex: c.repeatCoupleInvisLinkCreationIndex }
      : {}),
  };
}
