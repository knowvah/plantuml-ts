/**
 * `symbolInk` for a `class-layout-generic-classifier.ts#tryMeasureDescriptionLeaf`
 * leaf — split out purely to keep that file under the project's 500-line
 * cap (cdd3-T8, R-LEAF); a pure move plus the new gate/call, zero behavior
 * change to anything this file does not itself add.
 *
 * @see class-layout-generic-classifier.ts#tryMeasureDescriptionLeaf
 */

import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';
import type { BoxSizingOpts } from '../../core/svek/image/leaf-sizing.js';
import { measureEntityLeafInk, type LeafSymbolInk } from '../../core/svek/image/leaf-sizing-entity.js';
import type { LeafSizingSubject } from '../../core/svek/image/LeafSizingSubject.js';

/**
 * cdd5-T4e (`desc-usymbol-ink-missing`, close-b3): widened from a
 * hand-picked allowlist (`component`/`database`/`node`) to a denylist,
 * mirroring `leaf-sizing.ts#measureLeafNode`'s OWN dispatch -- the sibling
 * function that computes this SAME leaf's box `Dim`. `descriptionLeafSymbolInk`
 * may only walk `EntityImageDescription.drawU` (via {@link measureEntityLeafInk})
 * for a symbol whose BOX also comes from that generic construction
 * (`measureLeafNode`'s `default:` case, or its `entity`/`boundary`/`actor`/
 * `control` case, both routing to `measureEntityLeaf`); every symbol
 * `measureLeafNode` sizes through a DIFFERENT, non-generic construction must
 * stay excluded here too, or the ink and the box it is meant to bound
 * disagree about which shape was actually drawn -- jar-verified regressions,
 * not a guess:
 *
 * - `port`: `leaf-sizing.ts` returns a fixed `PORT_SIZE` square
 *   (`EntityImagePort`, a different `LeafType`/class entirely, not yet
 *   ported -- `class-portin-unported`).
 * - `interface`/`circle`: `leaf-sizing.ts:122-133` -- "`hideText = symbol ==
 *   USymbols.INTERFACE`, then :209-211 builds `asSmall` from EMPTY name/
 *   desc/stereo" (`USymbols.java:115`: `if (s.equalsIgnoreCase("circle"))
 *   return INTERFACE;` -- `circle` really is `USymbols.INTERFACE` upstream,
 *   not a distinct symbol) -- the BOX is a FIXED `INTERFACE_CIRCLE_SIZE`
 *   square, independent of the real display text, whenever this leaf has NO
 *   visible members. Walking the generic construction with the real label
 *   would measure a differently-shaped block than that fixed square.
 *   Excluded per this reading of `leaf-sizing.ts`, not jar-verified by any
 *   row in this task: `unknown/felixe-38-dilu011` (this family's one
 *   `circle` row) declares VISIBLE members (`circle A [ a\nb\nc ]`), so its
 *   classifier never reaches `tryMeasureDescriptionLeaf` at all --
 *   `class-layout-generic-classifier.ts#tryMeasureDescriptionLeaf`'s own
 *   guard, `if (classifier.members.some((m) => m.hidden !== true)) return
 *   undefined;`, declines it before `descriptionLeafSymbolInk` is ever
 *   called. Confirmed by measurement: felixe's residual `svg/@height`
 *   Δ34 is IDENTICAL whether `circle` is included in or excluded from this
 *   set -- its own mechanism is the separate "visible members" leaf-sizing
 *   gap `tryMeasureDescriptionLeaf`'s doc comment already names as a
 *   deliberate exclusion, unrelated to this function and out of this file's
 *   write-set (reported, not fixed, in this task's own report).
 * - `note`: `leaf-sizing.ts` routes through `measureNote`, a third
 *   construction (never actually reachable as a classifier `usymbol` in
 *   practice -- notes are `NoteGeo`, not `ClassifierGeo` -- but excluded
 *   here to keep this function's contract accurate to its sibling's own
 *   dispatch table, not merely "happens to be unreachable today").
 * - `folder`/`package`: `leaf-sizing.ts:142-155` dispatches to
 *   `measureFolderLeaf` (`leaf-sizing-folder.ts`) -- `USymbolFolder.asSmall
 *   .calculateDimension`'s OWN `mergeTB(dimStereo, dimLabel)` composition
 *   with its own `getMargin()`, a construction `measureEntityLeafInk`'s
 *   `EntityImageDescription`/`buildSizingEntityParams` walk does not
 *   reproduce. Jar-verified regression: widening to include `package`
 *   turned `unknown/cepedu-19-namu934`'s already-wrong `+1,+1` shift into a
 *   `svg/@width` 430 -> 462 (Δ32) blowout -- the generic walk's title/
 *   margin math simply measures a DIFFERENT box than `measureFolderLeaf`
 *   sized. (`unknown/fipezo-93-zimi512`'s package rows are unaffected either
 *   way -- they nest CHILD packages, so they never reach
 *   `tryMeasureDescriptionLeaf` at all; its Δ10 residual is a namespace/
 *   cluster-layout issue, out of this function's reach.)
 * - `hexagon`: `EntityImageDescription.ts:423-425` throws
 *   `"no hexagon geometry supplied"` when `hexagonPolygon === undefined` --
 *   exactly what sizing-time `buildSizingEntityParams` leaves it as
 *   (`leaf-sizing-entity.ts:182`'s own doc comment lists it among the
 *   fields "Deliberately NOT threaded"; only the RENDER-time params
 *   (`renderer-usymbol-entity.ts`'s `hexagonPolygon: null`) set it).
 *   Crash-verified, not a mere mismatch: `npx vitest run tests/unit/class/`
 *   throws through this exact call chain the moment any `descriptive`
 *   `hexagon` leaf with no visible members exists in the suite.
 *
 * Every OTHER usymbol -- `rectangle`, `queue`, `card`, `entity`, `stack`,
 * `frame`, `label`, `collections`, `artifact`, `person`, `agent`, `cloud`,
 * `storage`, `action`, `process`, `usecase`/`usecase-business` (barring the
 * pre-existing, content-gated `<latex>` exception `measureLeafNode`'s own
 * `default:`/`usecase` cases carve out, already an accepted gap for the
 * pre-widening `component`/`database`/`node` set and unchanged by this
 * task) -- sizes its `Dim` via the SAME `measureEntityLeaf` this file's
 * `measureEntityLeafInk` mirrors, so ink and box now agree (jar-verified
 * zero-diff: `unknown/gasevo-58-ciso782` (rectangle), `unknown/gogisu-39
 * -bepa573` (entity), `unknown/jimizu-14-zole306` (rectangle),
 * `unknown/juzuno-58-gesi397` (card/rectangle)).
 *
 * `actor` is never passed here in practice -- `tryMeasureDescriptionLeaf`'s
 * own early return declines it before this function is ever called (sizing
 * routes it through the actor-specific `measureUsecaseOrActor`/
 * `measureUsecaseOrActorLeafInk` pair instead) -- and `usecase`/`circle`-KIND
 * (as opposed to `descriptive`+`usymbol: 'circle'`) leaves never reach
 * `tryMeasureDescriptionLeaf` at all: both carry `classifier.kind !==
 * 'descriptive'`.
 */
const DESCRIPTION_LEAF_INK_EXCLUDED_SYMBOLS: ReadonlySet<LeafSizingSubject['symbol']> = new Set([
  'port',
  'note',
  'folder',
  'package',
  'interface',
  'circle',
  'hexagon',
]);

/**
 * `measureEntityLeafInk`'s `fontSpec` param must be the SAME per-element
 * collapsed size `measureLeafNode`'s own default-case call to
 * `measureEntityLeaf` uses internally (`leaf-sizing.ts:117`,
 * `opts?.fontSize === undefined ? baseFont : {...baseFont, size:
 * opts.fontSize}`) -- reproduced here rather than threading a third
 * fontSpec out of `measureLeafNode`, which stays a plain `Dim` return.
 *
 * `undefined` for every symbol in {@link DESCRIPTION_LEAF_INK_EXCLUDED_SYMBOLS},
 * which keeps `tryMeasureDescriptionLeaf`'s caller falling through to the
 * existing `addRectInk` box rule for those (`class-ink-box.ts
 * #addClassifierInk`'s `c.symbolInk !== undefined` gate) -- the box rule is
 * still the wrong shape for them too, but no WORSE than before this task,
 * and fixing it needs each one's own non-generic ink walk (`folder`/
 * `package`'s own `mergeTB` geometry, `interface`/`circle`'s fixed square),
 * out of this file's write-set.
 */
export function descriptionLeafSymbolInk(
  node: LeafSizingSubject,
  symbol: LeafSizingSubject['symbol'],
  baseFont: { family: string; size: number },
  ctx: { opts: BoxSizingOpts; sprites: SpriteDimsLookup | undefined; measurer: StringMeasurer },
): LeafSymbolInk | undefined {
  if (DESCRIPTION_LEAF_INK_EXCLUDED_SYMBOLS.has(symbol)) return undefined;
  const fontSpec = ctx.opts.fontSize === undefined ? baseFont : { ...baseFont, size: ctx.opts.fontSize };
  return measureEntityLeafInk(node, fontSpec, ctx);
}
