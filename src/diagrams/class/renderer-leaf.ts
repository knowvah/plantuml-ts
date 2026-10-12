/**
 * One class leaf's draw: `renderClass`'s leaf loop body (`renderer.ts`),
 * moved here unchanged so the ELK drawing (cdd8 T3a, `renderer-elk.ts`)
 * draws each node through the SAME code the svek path does — upstream's ELK
 * maker reuses the very entity image svek draws (`MyElkDrawing.java:131-142`
 * prints `printEntityInternal(entity)`, i.e. `GeneralImageBuilder
 * .createEntityImageBlock`, as `GraphvizImageBuilder` does).
 *
 * Draw order and the leaf-kind dispatch are `svek/SvekResult.java:82-90`
 * (every node, hidden ones through `UHidden`) and `GeneralImageBuilder
 * #createEntityImageBlock`'s leaf-type switch; see the per-branch comments.
 */
import type { ClassifierGeo, EdgeGeo } from './layout.js';
import type { ClassLeafGeo } from './class-geo-types.js';
import { isNoteGeo } from './class-geo-types.js';
import { renderOneNote, type NoteRenderContext, type NoteConnector } from './renderer-note-dispatch.js';
import type { ScaledTheme } from './class-scale-geo.js';
import type { ClassUidPlan } from './renderer-uid.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { renderUSymbolIcon } from '../../core/usymbol-shapes.js';
import { renderEmptyPackageLeaf } from './renderer-empty-package-leaf.js';
import { wrapEntity, leafPortion, renderGroupInheritanceNeighborhood } from './renderer-group.js';
import { renderAssocPoint, renderAssociationLeaf, renderLollipop } from './renderer-assoc-lollipop.js';
import { renderClassifierBox } from './renderer-classifier-box.js';
import { renderClassUSymbolEntity, usesClassUSymbolEntity } from './renderer-usymbol-entity.js';
import { renderClassEntityPort, isClassEntityPort } from './renderer-entity-port.js';
import type { DrawableFragment } from '../../core/klimt/document-shell.js';

/** Descriptive elements (database/component/actor/usecase) draw their USymbol
 *  icon instead of the class box; usecase carries no usymbol (its kind is
 *  enough). Returns undefined when this classifier has no icon to draw (the
 *  normal box path below applies) or the icon renderer declines. Split out of
 *  renderClassifier purely to keep that function's own NLOC/CCN under cap. */
function tryRenderUSymbol(geo: ClassifierGeo, theme: ScaledTheme): string | undefined {
  const usymbol = geo.kind === 'usecase' ? 'usecase' : geo.usymbol;
  if (usymbol === undefined) return undefined;
  const display = geo.rows[0]?.text ?? geo.id;
  return renderUSymbolIcon(usymbol, { ...geo, display }, theme);
}

function renderClassifier(geo: ClassifierGeo, theme: ScaledTheme): string {
  const icon = tryRenderUSymbol(geo, theme);
  if (icon !== undefined) return icon;
  return renderClassifierBox(geo, theme);
}

/** What one leaf's draw reads besides the leaf itself. */
export interface ClassLeafRenderContext {
  readonly theme: ScaledTheme;
  readonly uidPlan: ClassUidPlan;
  readonly noteCtx: NoteRenderContext;
  readonly measurer: StringMeasurer | undefined;
  readonly sprites: SpriteRegistry | undefined;
  /** `renderGroupInheritanceNeighborhood`'s edge list (cdd-T16). */
  readonly edges: readonly EdgeGeo[];
}

/** Where one leaf's draw writes: the body markup in draw order, the note
 *  connectors deferred to the edge phase (cdd-T9), and the klimt fragments
 *  whose defs and `ensureVisible` extents the document merges (SI14 T4). */
export interface ClassLeafSink {
  readonly children: string[];
  readonly noteConnectors: NoteConnector[];
  readonly usymbolEntityFragments: DrawableFragment[];
}

/**
 * G2 N20: the lollipop circle DOES get a normal `<g class="entity">` wrap
 * (unlike assoc-circle) but the label `<text>` is a plain, unwrapped sibling
 * -- see `renderLollipop`'s own doc comment.
 */
function renderLollipopLeaf(classifier: ClassifierGeo, ctx: ClassLeafRenderContext, sink: ClassLeafSink): void {
  const lollipopUid = ctx.uidPlan.classifierUid.get(classifier.id) ?? '';
  const { circle, label } = renderLollipop(classifier, ctx.theme);
  sink.children.push(wrapEntity(leafPortion(classifier.id), lollipopUid, classifier.id, false, circle));
  if (label !== '') sink.children.push(label);
}

/**
 * SI14 T4 (ADR-1/ADR-2)/cdd-T22 (E8, cacoma-43-poxu615): usecase/actor/
 * circle/component draw via the SAME faithful `EntityImageDescription
 * .drawU` path description uses, when a real `StringMeasurer` reached
 * this geo (absent only for hand-built test fixtures --
 * `class-geo-types.ts#ClassGeometry.measurer`). The fragment's `body`
 * carries EntityImageDescription's OWN `<!--entity NAME-->` wrap
 * (`renderer-usymbol-entity.ts`) -- push UNWRAPPED, never through
 * `wrapEntity` (wrong `<!--class NAME-->` comment). Returns false when the
 * leaf is not drawn this way.
 */
function tryRenderEntityFragment(classifier: ClassifierGeo, ctx: ClassLeafRenderContext, sink: ClassLeafSink): boolean {
  const port = isClassEntityPort(classifier); // cdd7-T2a: before DESCRIPTION, GeneralImageBuilder.java:122-127
  if (!(port || usesClassUSymbolEntity(classifier)) || ctx.measurer === undefined) return false;
  const entityUid = ctx.uidPlan.classifierUid.get(classifier.id) ?? '';
  const fragment = port
    ? renderClassEntityPort(classifier, ctx.theme, ctx.measurer, entityUid)
    : renderClassUSymbolEntity(classifier, ctx.theme, ctx.measurer, ctx.sprites, entityUid);
  sink.usymbolEntityFragments.push(fragment);
  sink.children.push(fragment.body);
  return true;
}

/** One classifier leaf, `renderClass`'s classifier branch. */
function renderClassifierLeaf(classifier: ClassifierGeo, ctx: ClassLeafRenderContext, sink: ClassLeafSink): void {
  const theme = ctx.theme;
  if (classifier.hidden === true) return;
  // G2 N8: an association-class-couple "point" entity draws unwrapped --
  // no `<g class="entity">`, no id, no comment -- see `renderAssocPoint`'s
  // own doc comment.
  if (classifier.kind === 'assoc-circle') {
    sink.children.push(renderAssocPoint(classifier, theme));
    return;
  }
  if (classifier.kind === 'association') {
    sink.children.push(renderAssociationLeaf(classifier, theme, ctx.uidPlan.classifierUid.get(classifier.id))); // cdd-T34
    return;
  }
  // G2 N33: a collapsed-empty package/namespace draws its folder-tab icon
  // UNWRAPPED -- no `<g class="entity">`, no id, no `<!--class ...-->`
  // comment (jar-verified `gatula-10-bifu561`: `package foo {}`/
  // `namespace bar {}` emit bare `<path>`/`<line>`/`<text>` siblings,
  // identical to `renderAssocPoint`'s own established unwrapped
  // precedent above) -- see `renderEmptyPackageLeaf`'s doc comment.
  if (classifier.folderTab !== undefined) {
    sink.children.push(renderEmptyPackageLeaf(classifier, theme, ctx.measurer));
    return;
  }
  if (classifier.kind === 'lollipop') {
    renderLollipopLeaf(classifier, ctx, sink);
    return;
  }
  if (tryRenderEntityFragment(classifier, ctx, sink)) return;
  const uid = ctx.uidPlan.classifierUid.get(classifier.id) ?? '';
  sink.children.push(
    wrapEntity(leafPortion(classifier.id), uid, classifier.id, true, renderClassifier(classifier, theme)),
  );
  // cdd-T16 (M7/E11, flagged write-set extension, SvekResult.java:82-89):
  sink.children.push(...renderGroupInheritanceNeighborhood(classifier, ctx.edges, theme));
}

/**
 * Draws one leaf (classifier OR note/tips) into `sink`, as `renderClass`'s
 * leaf loop does for each `geo.leaves` entry. D5: a note/tips leaf draws
 * regardless of its host's `hidden` -- `UHidden` wraps only the HOST node's
 * own image, never a separate note/tips node (see `renderOneNote`'s own doc
 * comment).
 */
export function renderClassLeaf(leaf: ClassLeafGeo, ctx: ClassLeafRenderContext, sink: ClassLeafSink): void {
  if (isNoteGeo(leaf)) {
    const drawn = renderOneNote(leaf, ctx.noteCtx, ctx.theme);
    sink.children.push(...drawn.entity);
    if (drawn.connector !== undefined) sink.noteConnectors.push(drawn.connector);
    return;
  }
  renderClassifierLeaf(leaf, ctx, sink);
}
