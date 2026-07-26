/**
 * Class-diagram Note AST types (NotePosition, ClassNote). Split out of
 * `ast.ts` (line cap); re-exported from `ast.ts` for existing import sites.
 */

import type { UrlInfo } from './class-url.js';


export type NotePosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * A note. Two forms:
 *  - `note <pos> of <Entity>` — attached to a classifier; PlantUML lays this
 *    out as its own graphviz node connected to the host by a plain
 *    connector edge. `target` and `position` are set.
 *  - `note as <alias> ... end note` — freestanding/unattached; still becomes
 *    its own graph node (inside its enclosing package, if any), but has no
 *    host classifier and no position until/unless a later relationship
 *    line connects it to something. `target` and `position` are undefined;
 *    `id` is the user-declared alias so relationship endpoints can resolve
 *    to it.
 */
export interface ClassNote {
  /** Generated layout id (e.g. `__note_0`) for attached notes; the
   *  user-declared alias (e.g. `N3`) for freestanding notes. */
  id: string;
  /** Host classifier id the note is attached to (attached notes only). */
  target?: string;
  /**
   * Member/port name from `note <pos> of Class::member` syntax — mirrors
   * `Relationship.fromPort`/`toPort` (same `::` grammar, split the same way
   * via `splitEndpointPort`). The note still anchors to the host classifier
   * (`target`); this is metadata only. Notes anchored to a specific member
   * lay out with an invisible connector (svek routes member-anchored notes
   * as a layout-only constraint, unlike a plain classifier note's visible
   * connector) — see note-layout.ts's `buildNoteGraphParts`.
   * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnEntity.java
   */
  targetPort?: string;
  /**
   * True when `target` came from falling back to the last-created entity —
   * a bare `note <pos>` with no `of <Entity>` clause at all — rather than an
   * explicit `of` reference. `CommandFactoryNote` (bare) and
   * `CommandFactoryNoteOnEntity` (`of`) are separate upstream commands with
   * different merge behavior: only explicit-`of` notes on the same
   * (host, side) merge into one svek node (verified: zepeki-75-pifo352 — a
   * bare `note left` and an explicit `note left of test::member`, same host
   * and side, stay TWO separate oracle nodes). See note-layout.ts's
   * `groupNotes`.
   */
  implicitTarget?: true;
  position?: NotePosition;
  /** Note body (may contain newlines for multi-line notes). */
  text: string;
  /**
   * G2 N34: the note's own `#color` override (`note <pos> [of X] #green: ...`
   * / `note "text" as N1 #blue`) -- mirrors {@link Classifier.color} exactly
   * (same `ColorParser.simpleColor(BACK)` grammar, same bare/compound-`back:`
   * extraction at the render boundary, `renderer-note.ts#resolveNoteBackground`).
   * Takes precedence over any `<style> note { BackgroundColor ... }` bucket
   * default (`EntityImageNote.java`'s ctor: `entity.getColors().getColor(BACK)`
   * wins over the style-merged value) -- the LINECOLOR/`text:`/`line:`/
   * `shadowing` compound parts are captured here but not yet consumed by any
   * render-side field, same named-remainder posture as `Classifier.color`'s
   * own doc comment.
   * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnEntity.java:312
   */
  color?: string;
  /**
   * `$tag` names attached to a freestanding single-line note declaration
   * (`note "text" as N1 $z`) — mirrors {@link Classifier.tags}. In practice
   * these are rarely consulted directly: a note used as a relationship
   * endpoint delegates its `remove`/`restore` status entirely to that
   * neighbor (upstream `CucaDiagram#isNoteWithSingleLinkAttachedTo` —
   * see class-directives.ts#computeRemovedIds), so this field only matters
   * when the note has no single non-invisible neighbor to delegate to.
   * @see ~/git/plantuml/.../command/note/CommandFactoryNote.java
   */
  tags?: string[];
  /**
   * Enclosing namespace id, if the note was declared inside a `package`/
   * namespace block — mirrors `Classifier.namespace`. A note's DOT node id
   * (`id` above) is registered bare into `Namespace.classifiers` (same as any
   * other member), which is the sole source `buildDotClusters` uses for
   * cluster membership; upstream has no separate field since notes and
   * classifiers are both leaves in the same Quark tree.
   * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java:175-184 getCurrentGroup
   */
  namespace?: string;
  /**
   * G2 N37: the note's own `<<stereotype>>` label (`note left of A
   * <<faint>>: text`) -- mirrors {@link Classifier.stereotype} (same
   * `<<...>>` capture grammar, `NOTE_STEREO_CAPTURE` in class-notes.ts).
   * Feeds ONLY the `.tagname` `<style>` cascade (`note { .faint {
   * BackgroundColor red } } }`, `renderer-note.ts#resolveNoteBackground`)
   * -- unlike a classifier, a note never DRAWS its own stereotype text, so
   * there is no visible/invisible-bracket-count distinction to track here
   * (`class-stereotype.ts#splitStereotypeStyleTags` is reused as-is for the
   * tag-membership split, since a note's stereotype blob follows the SAME
   * `<<A>><<B>>` stacking grammar as a classifier's).
   */
  stereotype?: string;
  /**
   * G2 N70: this note's own `[[url]]` (`note <pos> of X [[url]]`), captured
   * from `NOTE_URL` and parsed via `parseUrlBracket`. Upstream's
   * `CommandFactoryNoteOnEntity` calls `note.addUrl(url)`, and the SVG emitter
   * wraps the whole note `<g>` body in a single `<a xlink:href>` -- the port
   * wraps the note's rendered inner SVG via `svg.ts#linkWrap` at
   * `renderer.ts` when this is set. Jar-verified `danozo-79-nunu375`.
   */
  url?: UrlInfo;
  /**
   * G2 N15: parse-time creation order, mirroring {@link Classifier
   * .creationIndex}'s shared-counter scheme -- but a note consumes a
   * DIFFERENT number of counter increments depending on which upstream
   * command created it:
   *  - `note <pos> [of <Entity>]` (attached, `targetPort` undefined --
   *    `CommandFactoryNoteOnEntity`) ALWAYS calls `diagram.getUniqueSequence
   *    ("GMN")` (a phantom quark-code slot, never visible as an `entN` id)
   *    BEFORE its own `reallyCreateLeaf` -> `Entity` ctor consumes the REAL
   *    slot this field stores -- two counter increments per note, jar-
   *    verified against `fezugi-39-fujo327` (`ent0002` expected `ent0003`,
   *    the class `a` alone consumes slot 1, the note's phantom GMN consumes
   *    slot 2, the note's own uid is slot 3).
   *  - `note "text" as N1` (freestanding -- `CommandFactoryNote`) has no GMN
   *    call at all; only the `Entity` ctor's own slot is consumed (one
   *    increment).
   *  - `note <pos> of Class::member` (member-tip, `targetPort` defined --
   *    `CommandFactoryTipOnEntity`) ALSO has no GMN call, but MERGES: only
   *    the group's FIRST tip (per host+position) creates a real `Entity`
   *    (`if (tips == null) { tips = reallyCreateLeaf(...); }`), later
   *    members of the same group reuse it and consume NOTHING. This port
   *    does not model that merge at parse time (grouping is computed later,
   *    in `note-layout.ts`) -- left `undefined` for tip notes, which keeps
   *    N13's already jar-verified tip numbering on the pre-existing
   *    fallback path (`renderer-uid.ts`'s doc comment).
   * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnEntity.java:327
   * @see ~/git/plantuml/.../command/note/CommandFactoryNote.java:197
   * @see ~/git/plantuml/.../command/note/CommandFactoryTipOnEntity.java:218-220
   * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java:725-731
   */
  creationIndex?: number;
  /**
   * G2 N15: true when this note's `creationIndex` was preceded by a
   * discarded phantom "GMN" counter slot (see {@link creationIndex}'s doc
   * comment) -- `renderer-uid.ts#assignExact`'s dense re-numbering must
   * NOT collapse that gap the way it collapses a genuinely absent geo item
   * (e.g. `ensureClassifier`'s package-endpoint phantom stub, that
   * function's own module doc comment): the GMN slot corresponds to no
   * drawn entity at all, so it must still consume a numbering RANK without
   * being written to any uid map, keeping `creationIndex - 1` a real gap
   * in the final `ent%04d` sequence (jar-verified: `fezugi-39-fujo327`'s
   * note is `ent0003`, with `ent0002` never assigned to anything).
   */
  phantomSlot?: true;
  /**
   * G2 N53: the ENTITY rank consumed by a member-tip note's GROUP LEADER --
   * the first `note <pos> of Class::member` for a given (target, position)
   * pair, in real parse order. `CommandFactoryTipOnEntity`'s `identTip`
   * Quark dedup (`if (tips == null) { tips = reallyCreateLeaf(...); ...
   * addLink(link); }`) creates exactly ONE real `Entity` (the TIPS leaf --
   * one `cpt1` tick, this field's value) immediately followed by ONE
   * invisible `Link` connecting it to the host (a SECOND, consecutive
   * `cpt1` tick, `tipGroupPhantomIndex + 1`) -- every LATER member of the
   * same (target, position) group reuses the already-created leaf via
   * `tips.putTip(member, display)`, consuming NO further ranks. Neither the
   * TIPS entity nor its invisible link is ever drawn with a `<g id=...>`
   * wrapper (`EntityImageTips#drawU` has no id-bearing group; this port's
   * `renderTipNote` mirrors that -- no `noteUid` map entry is ever read for
   * a tip note's own rendering), so BOTH ranks are PHANTOM from `renderer-
   * uid.ts#assignExact`'s point of view -- consumed to keep every LATER
   * classifier/edge/note's dense numbering in sync with jar, never written
   * to any uid map. `undefined` for every note except a tip group's leader
   * (plain notes, freestanding notes, and every non-leader tip both leave
   * this unset -- the pre-existing fallback numbering, unchanged for them).
   * jar-verified: `dozugo-00-jado141` (User::username's lone tip -- ent0002/
   * lnk3 both silently consumed before Role's real ent0004, User--Role's
   * real lnk5 -- confirmed via `svek-1.dot`'s `sh0007` invisible node/edge
   * pair sitting between User=sh0006 and Role=sh0008), `sanusa-54-
   * keda128` (TWO notes on WInstallationRecord::reportedVersion and
   * ::reported, SAME host+position -- jar's oracle SVG draws only ONE
   * `id="ent0001"` total, for the classifier itself, confirming the second
   * note reuses the group leader's already-created entity+link with no
   * additional rank burn).
   * @see ~/git/plantuml/.../command/note/CommandFactoryTipOnEntity.java:214-231
   * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java:725-731
   */
  tipGroupPhantomIndex?: number;
}
