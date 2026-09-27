/**
 * class-ink-note.ts — the note-leaf ink term of `buildInkBox`'s
 * `LimitFinder`-shaped walk. Split out of `class-ink-box.ts` (cdd3-T15,
 * line cap) — same "purely for size, no behavior change to the split
 * itself" precedent `class-ink-dot-path.ts`'s own header already
 * establishes.
 */
import type { ClassifierGeo } from './layout.js';
import type { NoteGeo } from './note-layout.js';
import { resolveTips } from './note-tips-resolve.js';
import { addPlainInk, addPoint } from './class-ink-shapes.js';
import type { InkBox } from './class-ink-shapes.js';

/**
 * G2/N13: a dropped member-tip note (unresolved `::member`) draws NOTHING
 * at all — jar's own ink extent excludes it (`fupope-12-zoku847`'s canvas
 * dims match a plain single-classifier render with no note space reserved
 * at all). Mission note-leaf-model D3: dropped-ness is resolved HERE, in
 * the draw pass, exactly as upstream's `LimitFinder` sees
 * `EntityImageTips#drawU`'s early return — never stored on the geo
 * (`note-tips-resolve.ts`).
 *
 * G2/N14 CORRECTION: notes use the PLAIN (no x-hack) ink rule, not the
 * polygon rule — `Opale.java#drawU` draws its outline via `ug.draw
 * (polygon)` where `polygon` is a `UPath` (built through `UPath.none()` +
 * `moveTo`/`lineTo`/`arcTo`, EVERY branch: `getPolygonNormal`/`Left`/
 * `Right`/`Up`/`Down` all return `UPath`, never `UPolygon`) — so
 * `LimitFinder` dispatches to `drawUPath` (plain bbox), not `drawUPolygon`
 * (`HACK_X_FOR_POLYGON`-padded). The PREVIOUS `addPolygonInk` choice here
 * was an unverified guess from before ANY note fixture had been jar-
 * checked — jar-verified wrong by exactly `HACK_X_FOR_POLYGON` (10px)
 * against `fezugi-39-fujo327` (canvas width 174 vs jar's real 164).
 *
 * cdd3-T15 (C-15/E3-19 reveal): a note that FAILED to opalise (more than
 * one bezier, `core/svek/image/Opale.ts#resolveOpaleConnector`'s guard)
 * draws its connector as an ordinary `SvekEdge#drawU` line —
 * `LimitFinder#drawDotPath` (`klimt/drawing/LimitFinder.java:190-194`)
 * walks every bezier end AND control point of that spline too, the same
 * "control point, not just endpoint" rule `class-ink-dot-path.ts
 * #drawnEdgePoints`'s own doc comment establishes for a real `EdgeGeo`.
 * `nt.connector` is `[]` for an opalised note (own box already covers the
 * merged notch) and for a freestanding note (its connector is a real
 * `EdgeGeo`, walked by `buildInkBox`'s edges loop) — adding those points
 * here too is a harmless idempotent no-op (same points, min/max unaffected).
 * Jar-verified: `zepeki-75-pifo352`'s canvas height was 49.21px short
 * without this (the connector's control point reaches above both the note
 * and the host).
 * @see ~/git/plantuml/.../svek/SvekEdge.java:769-770,804-806
 */
export function addNoteInk(box: InkBox, notes: readonly NoteGeo[], classifiers: readonly ClassifierGeo[]): void {
  const tips = resolveTips(notes, classifiers);
  for (const nt of notes) {
    if (nt.kind === 'tips' && tips.get(nt.id) === 'dropped') continue;
    addPlainInk(box, nt.x, nt.y, nt.width, nt.height);
    for (const p of nt.connector) addPoint(box, p.x, p.y);
  }
}
