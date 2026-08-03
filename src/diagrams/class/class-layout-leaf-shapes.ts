/**
 * The usecase/actor USymbol box and the lollipop-interface circle+label —
 * the two classifier kinds whose svek box is NOT the generic name+members
 * rect (`class-layout-generic-classifier.ts#measureGenericClassifier`).
 *
 * Split out of class-layout-helpers.ts purely to keep every function under
 * the project's per-function complexity/size caps and the file under the
 * 500-line cap. No behavior differs from the original inline code — this
 * is a pure move.
 */

import type { Classifier } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { measureUsecaseOrActorLeaf } from '../description/leaf-sizing.js';
import type { MeasuredClassifier } from './class-layout-helpers.js';
import { LOLLIPOP_SIZE } from './class-lollipop.js';
import {
  buildMemberAtoms,
  memberBaseFont,
  resolveMemberAtoms,
} from './class-member-creole.js';
import { javaRound4 } from '../../core/number-format.js';
import { spriteDimsLookupFor, type SpriteRegistry } from '../../core/sprite-commands.js';

/**
 * Measure the usecase/actor USymbol box — the two allowmixing kinds whose
 * svek box is NOT the generic name+members rect (see measureClassifier).
 *
 * SI10/ADR-2: routes through the description engine's
 * `measureUsecaseOrActorLeaf` (the SAME faithful `EntityImageDescription`
 * path the description diagram engine uses for these two USymbols) rather
 * than the class engine's own analytic substitute. This function still
 * builds its own `MeasuredClassifier` shape (`rows`/`dividerYs`) — that
 * composition is class-specific and unaffected by where `dim` comes from.
 *
 * `sprites` (SI10 scope item 3): threaded from
 * `class-layout-helpers.ts#tryMeasureNonGenericClassifier`, already in
 * scope there for the `measureObjectClassifier` call one line above this
 * branch's dispatch — previously NOT forwarded here, so a class-diagram
 * usecase/actor with a `<$sprite>` display measured with no sprite
 * awareness at all.
 */
export function measureUsecaseOrActor(
  classifier: Classifier,
  fontSpec: { family: string; size: number },
  measurer: StringMeasurer,
  sprites?: SpriteRegistry,
): MeasuredClassifier {
  const symbol = classifier.kind === 'usecase' ? 'usecase' : 'actor';
  const spriteDims = sprites !== undefined ? spriteDimsLookupFor(sprites) : undefined;
  const dim = measureUsecaseOrActorLeaf(classifier.display, symbol, fontSpec, measurer, spriteDims);

  // The label's creole atoms, resolved HERE rather than at draw time because
  // `renderClass(geo, theme)` receives no sprite registry -- this engine bakes
  // everything the renderer needs into the geometry (see the class golden
  // README's note on `renderClass` taking no measurer of its own). Without
  // this the sizing was sprite-aware (SI10 scope item 3) while the drawing
  // emitted the literal `&lt;$Gear&gt; Configure` markup as text.
  //
  // Reuses the class engine's OWN member-row atom pipeline, which already
  // does exactly this for member lines and notes -- `rows[].atoms` is the
  // established carrier (`class-geo-types.ts`, G2 N22) and
  // `renderer-classifier-rows.ts#renderRowAtoms` the established drawer.
  const baseFont = memberBaseFont(fontSpec, {});
  const built = resolveMemberAtoms(
    buildMemberAtoms(classifier.display, baseFont),
    baseFont,
    measurer,
    sprites,
  );
  const hasAtomImage = built.atoms.some((a: { kind: string }) => a.kind !== 'text');

  const row = {
    text: classifier.display,
    y: dim.height / 2,
    indent: 0,
    italic: false,
    // Only carried when there is something a plain `<text>` cannot draw. A
    // pure-text label keeps the existing single-`<text>` path, so no existing
    // class golden can move.
    ...(hasAtomImage ? { atoms: built.atoms, atomsWidth: built.width } : {}),
  };
  return { width: dim.width, height: dim.height, rows: [row], dividerYs: [] };
}

/**
 * G2 N20: the lollipop interface's own display-label text --
 * `EntityImageLollipopInterface.java:94-133`'s `desc.drawU(...)` call, drawn
 * OUTSIDE the circle's own `<g class="entity">` wrap (`renderer.ts`'s
 * `renderLollipop` pushes this row's rendered `<text>` as an unwrapped
 * sibling, mirroring jar's own `closeGroup()`-then-`desc.drawU(...)`
 * sequence). Jar never reserves DOT/layout space for it --
 * `calculateDimensionSlow` returns a flat `(SIZE, SIZE)` ignoring `desc`
 * entirely (`class-dot-graph.ts#buildOneDotNode`'s own "generic width/
 * height discarded" doc comment is the matching DOT-side half of this
 * fact) -- so `width`/`height` returned here are informational only, never
 * consulted for node sizing.
 *
 * Byte-verified against `bososa-44-fipu544`'s `dummylol2` ("toto1"): jar's
 * `<text x="6" y="26.8889" ... textLength="31.0625">toto1</text>` = node-left
 * `16.5313` + `(SIZE/2 - textWidth/2)` = `16.5313 + (5 - 15.53125)`, node-top
 * `6 + SIZE(10) + baselineOffset(10.8889)` -- `baselineOffset` is the SAME
 * ascent-from-line-top formula every other class text row uses (`measure
 * GenericClassifier`'s own doc comment in class-layout-generic-classifier.ts).
 */
export function measureLollipop(
  classifier: Classifier,
  fontSpec: { family: string; size: number },
  measurer: StringMeasurer,
): MeasuredClassifier {
  const textWidth = javaRound4(measurer.measure(classifier.display, fontSpec).width);
  const baselineOffset = fontSpec.size - measurer.getDescent(fontSpec, '');
  const row = {
    text: classifier.display,
    y: LOLLIPOP_SIZE + baselineOffset,
    indent: LOLLIPOP_SIZE / 2 - textWidth / 2,
    width: textWidth,
  };
  return { width: LOLLIPOP_SIZE, height: LOLLIPOP_SIZE, rows: [row], dividerYs: [] };
}
