/**
 * One note leaf's draw dispatch -- split out of `renderer.ts` (500-line
 * cap, cdd-T9) so `renderClass`'s single ordered `geo.leaves` loop keeps
 * calling one function per note/tips leaf without growing that file past
 * the complexity-hook line limit. Pure move of `renderOneNote` + its two
 * small result shapes; no behavior change from the split itself.
 */
import type { NoteGeo } from './note-layout.js';
import type { Theme } from '../../core/theme.js';
import type { ClassUidPlan } from './renderer-uid.js';
import type { TipResolution } from './note-tips-resolve.js';
// cdd-T10 wiring fix: divider/table extras now draw INSIDE
// `renderer-note.ts#renderNoteText`'s own per-row loop (row-ordered, not
// appended once per note -- see that function's own doc comment), so
// `renderPlainNote`/`renderTipNote`/`renderOpaleNote` already include them
// with no wrapper needed.
import { renderPlainNote, renderTipNote, renderOpaleNote } from './renderer-note.js';
import { linkWrap } from '../../core/svg.js';
import { wrapEntity } from './renderer-group.js';

/** The two per-render note tables `renderOneNote` reads (complexity-hook
 *  param cap): the uid plan and the draw-time tip resolutions. */
export interface NoteRenderContext {
  readonly uidPlan: ClassUidPlan;
  readonly tips: ReadonlyMap<string, TipResolution>;
}

/** cdd-T9 (E6 mechanism a): one note's connector, pulled out of its entity
 *  group -- just the note it belongs to (for `id`/`target`/uid/geometry
 *  lookups). cdd-T9b: no longer carries a pre-rendered `body` string --
 *  the connector's own path/style/id can only be finalized in the edges
 *  phase (`renderer.ts`'s `noteConnectors.forEach`, AFTER the real edges
 *  populate the shared id-collision `Set` a `Link#idCommentForSvg()`-
 *  faithful id needs -- see `renderer-note-connector.ts
 *  #renderNoteConnectorPath`'s own doc comment), so building it here in
 *  the leaf loop (BEFORE that set exists) would be premature. */
export interface NoteConnector {
  readonly note: NoteGeo;
}

/** One note's draw output: the entity-group markup (pushed immediately, in
 *  leaf-loop position) plus its connector, if any (deferred to the edges
 *  phase -- see {@link NoteConnector}). */
export interface NoteDrawResult {
  readonly entity: string[];
  readonly connector?: NoteConnector;
}

/**
 * G2 N52 / mission leaf-draw-order T4: one note's own draw output -- called
 * once per `'note'`/`'tips'` leaf from `renderClass`'s single ordered
 * `geo.leaves` loop, the same dispatch site every `ClassifierGeo` leaf goes
 * through (jar's `SvekResult#drawU` draws every `bibliotekon.allNodes()`
 * entry through ONE loop, notes and classifiers alike --
 * `svek/SvekResult.java:82-90`). D5: drawn regardless of its host's
 * `hidden` -- nothing in the leaf loop below skips a note/tips leaf for its
 * host's sake, matching jar (`UHidden` wraps only the host NODE's own
 * image, `:84-87`). `NoteGeo`'s own doc comments (`note-layout.ts`) cover
 * the tip/opale/plain shape choice this mirrors unchanged.
 *
 * cdd-T9 (E6 mechanism a): a PLAIN note's dashed connector is upstream's own
 * ordinary edge (`<g class="link">`), drawn by `SvekEdge#drawU` in the
 * EDGES phase, never folded into the note's `<g class="entity">`
 * (`EntityImageNote.java:275-289` draws only the box+text; the connector is
 * a separate `Link`). cdd-T9b: this function no longer asks `renderPlainNote`
 * for a connector string at all (that function only builds the box+text
 * now) -- a note whose `connector` geometry is non-empty is returned here
 * as its own {@link NoteConnector} (just the note, not a body), NOT joined
 * into `entity` -- `renderClass`'s edges phase resolves its style/id/order
 * and emits it via the SAME `wrapLink` call an ordinary relationship edge
 * gets (`renderer-note-connector.ts`).
 */
export function renderOneNote(note: NoteGeo, ctx: NoteRenderContext, theme: Theme): NoteDrawResult {
  const { uidPlan, tips } = ctx;
  // `GeneralImageBuilder#createEntityImageBlock`'s leaf-type dispatch:
  // `LeafType.TIPS -> EntityImageTips` (:219-220), whose `drawU` resolves
  // the notch against the host at DRAW time (mission note-leaf-model D3,
  // `note-tips-resolve.ts`) and draws NOTHING for a dropped tip;
  // `LeafType.NOTE -> EntityImageNote` (:118-119), plain or opalisable.
  if (note.kind === 'tips') {
    const tip = tips.get(note.id);
    return { entity: tip === undefined || tip === 'dropped' ? [] : [renderTipNote(note, tip, theme)] };
  }
  const uid = uidPlan.noteUid.get(note.id) ?? '';
  let raw: string;
  let connector: NoteConnector | undefined;
  if (note.opale !== undefined) {
    raw = renderOpaleNote(note, theme);
  } else {
    raw = renderPlainNote(note, theme).entityParts.join('');
    // cdd-T9b: `note.connector.length > 0` is the SAME predicate
    // `NoteGeo.connector`'s own doc comment documents (empty for a tips
    // leaf / a resolved opalisable note) -- deferred to the edges phase,
    // see {@link NoteConnector}'s own doc comment.
    if (note.connector.length > 0) connector = { note };
  }
  // G2 N70: a note's own `[[url]]` wraps its ENTIRE drawn body in one
  // `<a xlink:href>` INSIDE the `<g class="entity">` -- upstream's
  // `note.addUrl(url)` + `SvgGraphics` anchor open/close around the note
  // shape. Jar-verified `danozo-79-nunu375`.
  const inner = note.url !== undefined ? linkWrap(raw, note.url) : raw;
  return {
    entity: [wrapEntity(note.id, uid, note.id, false, inner)],
    ...(connector !== undefined ? { connector } : {}),
  };
}
