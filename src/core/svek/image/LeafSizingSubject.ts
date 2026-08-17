/**
 * Structural subject type for the leaf-sizing family (`leaf-sizing*.ts`,
 * this directory) — the exact fields `measureLeafNode` and its callees read
 * off the description engine's leaf-node AST type
 * (`src/diagrams/description/ast.ts:45`), extracted so the class engine's
 * synthesized leaf can satisfy the same contract without importing an AST
 * type from another diagram engine (`shared-seam-extraction` T3, D1/D3).
 *
 * Upstream `EntityImageDescription`'s ctor
 * (`svek/image/EntityImageDescription.java:116-189`) reads exactly this
 * slice off its `Entity` argument: `entity.getName()` (id),
 * `entity.getDisplay()` (display), `entity.getUSymbol()` (symbol), and
 * `entity.getStereotype()` (stereotype + its sprite half,
 * `Stereotype#getMultipleLabels()`/`#getSprite()`) — colors/url/links are
 * supplied separately by this port's sizing call sites
 * (`leaf-sizing-entity.ts#sizingPaint`), never read off the node.
 * `LeafSizingSubject` mirrors that exact slice, field for field.
 *
 * Read sites (2026-08-17, walked across all seven family files):
 * - `id`: `leaf-sizing-entity.ts#buildSizingEntityParams` (`entity.name`/
 *   `.qualifiedName`), `leaf-sizing-folder.ts#measureFolderLeaf` (the shown
 *   title's code text, and the `showTitle && display === id`
 *   label-suppression test).
 * - `display`: every per-symbol case in `leaf-sizing.ts#measureLeafNode`,
 *   `leaf-sizing-entity.ts#buildSizingEntityParams` (`labels.codeName`/
 *   `.displayText`), `leaf-sizing-folder.ts#measureFolderLeaf`,
 *   `leaf-sizing-legacy-fallback.ts#measureLegacyBoxFallback`.
 * - `symbol`: the `measureLeafNode` dispatch switch,
 *   `leaf-sizing-entity.ts#buildSizingEntityParams` (`symbol.keyword`),
 *   `leaf-sizing-folder.ts#measureFolderLeaf` (margin/tab-family lookup),
 *   `leaf-sizing-legacy-fallback.ts#measureLegacyBoxFallback`/`#boxIcon`.
 * - `stereotype`: `leaf-sizing.ts#measureLeafNode`'s `<latex>`-usecase
 *   branch, `leaf-sizing-entity.ts#buildSizingEntityParams`
 *   (`labels.stereotypeLabels`), `leaf-sizing-folder.ts#folderStereoBlock`,
 *   `leaf-sizing-legacy-fallback.ts#measureLegacyBoxFallback`.
 * - `stereotypeSprite`: `leaf-sizing-entity.ts#spriteLabel`, which hands it
 *   straight to `resolveStereotypeSprite`
 *   (`EntityImageDescriptionDelegates.ts`) — already typed structurally
 *   there, not against `description/ast.ts:30`'s sprite-ref type directly.
 *
 * The description engine's node type (`description/ast.ts:45`) satisfies
 * this interface unmodified — structural typing, no cast at any description
 * call site. The class engine's synthesized leaf
 * (`class-layout-generic-classifier.ts#tryMeasureDescriptionLeaf`,
 * `class-layout-leaf-shapes.ts#measureUsecaseOrActor`) builds a
 * `LeafSizingSubject` literal directly instead of borrowing that type.
 *
 * NOT done here (Track SI-1, `planning/mission-guide.md`): converging this
 * onto `core/abel/Entity`. `Entity` carries far more than a leaf sizer reads
 * (ports, Quark identity, style-cascade machinery) and no call site in this
 * task's write-set constructs one. `LeafSizingSubject` is a narrower,
 * purpose-built seam, not a step toward that convergence — SI-1 supersedes
 * it if/when the description and class engines share a real `Entity`.
 */
import type { USymbol } from '../../descriptive-keywords.js';
import type { ResolvedColor } from '../../klimt/color/HColorSet.js';

/** The sprite half of a `<<...>>` stereotype run — mirrors
 *  `resolveStereotypeSprite`'s own structural parameter shape
 *  (`EntityImageDescriptionDelegates.ts`), not `description/ast.ts:30`'s
 *  sprite-ref type directly, so the two stay independently assignable
 *  rather than one importing the other. Kept field-for-field identical on
 *  purpose — the description engine's node type must remain assignable
 *  here without a cast. */
export interface LeafSizingStereotypeSprite {
  readonly name: string;
  readonly scale: number;
  readonly color?: ResolvedColor | undefined;
}

/** See module doc comment for the upstream citation and the per-field read
 *  sites across the leaf-sizing family. */
export interface LeafSizingSubject {
  readonly id: string;
  readonly display: string;
  readonly symbol: USymbol;
  readonly stereotype?: readonly string[];
  readonly stereotypeSprite?: LeafSizingStereotypeSprite;
}
