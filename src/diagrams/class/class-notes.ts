/**
 * Note-block accumulation + note AST construction for the class parser.
 *
 * Split out of `parser.ts` to keep it within the module line budget. These
 * helpers operate only on the public `ClassDiagramAST` (no parse state).
 */

import { removeEmptyColumns } from './class-note-columns.js';
import type { ClassDiagramAST, NotePosition } from './ast.js';
import type { UrlInfo } from './class-url.js';
import { registerInNamespace } from './class-namespace.js';
import { resolveReference, type ResolvedRef } from './class-namespace-resolve.js';
import { noteSeparator } from './class-note-endpoint.js';
import { applyNoteOnLink } from './class-note-on-link.js';
import { splitEndpointPort, stripQuotes } from './class-relationship-parser.js';
import type { ParseState } from './class-parse-state.js';

/**
 * Optional note decoration segments, shared by all four note command shapes
 * in class-commands.ts (attached single/multi-line, freestanding
 * single/multi-line). Mirrors upstream's optional STEREO / COLOR / URL
 * groups, in order — TAGS1, STEREO, TAGS2, COLOR, URL
 * (CommandFactoryNoteOnEntity.java:96-109; CommandFactoryNote.java:83-88 has
 * no URL group). $-prefixed Stereotag groups (TAGS1/TAGS2) are STILL not
 * ported (no fixture in the corpus exercises a `.tagname` style-cascade
 * keyed on them — surveyed, not built, G2 N34) — STEREO stays non-capturing
 * for the same reason. `NOTE_COLOR` (G2 N34) IS now capturing: `ClassNote
 * .color` threads it through to `renderer-note.ts`'s background-fill
 * resolution (mirrors `Classifier.color`, N31). Every command below already
 * accounts for the shifted capture-group index this introduces (position/
 * target, alias, text, tags, …) — see each command's own comment.
 */
export const NOTE_STEREO = '(?:\\s*<<[^<>]+>>)?';
/**
 * G2 N37: the SAME optional `<<stereotype>>` group as {@link NOTE_STEREO},
 * but CAPTURING the inner label text -- used ONLY by the note-creation call
 * sites in class-commands.ts (6b/6c/6d/6e) that actually need the value
 * ({@link ClassNote.stereotype}, `ast.ts`'s own doc comment). Kept as a
 * SEPARATE constant rather than making `NOTE_STEREO` itself capturing --
 * that constant is ALSO imported by class-container.ts's namespace-block
 * commands (which have no use for a note's stereotype value), and G2 N34's
 * own ledger already recorded the capture-group-index regression risk of
 * silently widening a shared non-capturing fragment across module
 * boundaries; this avoids repeating that mistake.
 */
export const NOTE_STEREO_CAPTURE = '(?:\\s*<<([^<>]+)>>)?';
// `\` joins `-`/`/`/`|` as a gradient separator (upstream COLOR_REGEXP
// "#\\w+[-\\\\|/]?\\w+", ColorParser.java:43 — `#yellow\gold`, dacixi-46).
// `;`/`:` additionally cover ColorParser's PART2 multi-attribute form
// (`#color;attr:value;attr2:value2`, ColorParser.java:45 —
// `#blue;line.bold:purple;text:777`, xoxuni-96-fere626 mission A2 iteration
// 12): without them the color group stopped at the bare color name, leaving
// `;line.bold:purple;text:777` unconsumed and failing the whole note command
// match (not just dropping the extra attrs) since nothing else in the note
// grammar accounts for a stray `;`.
export const NOTE_COLOR = '(?:\\s*(#[-\\w./|\\\\;:]+))?';
// G2 N70: now CAPTURING (the full `[[...]]` bracket) so a note's own URL
// reaches `parseUrlBracket`. Adds ONE capture group at every use site -- each
// site's trailing group indices shift +1 (see the `execute` comments at the
// `class-commands.ts` note rules 6a/6b and the `class-container.ts` namespace
// rules). `[^\]]*` keeps the pre-N70 "stops at first `]`" behavior.
export const NOTE_URL = '(?:\\s*(\\[\\[[^\\]]*\\]\\]))?';
/**
 * `note <pos> of <Entity>` target: a bare id, a quoted string, or either
 * followed by a `::member`/`::"quoted member"` suffix (legacy UML namespace
 * separator reused to target a specific field/method —
 * CommandFactoryNoteOnEntity's entity-ref grammar). Captured whole; `addNote`
 * below splits the `::member` suffix back off via `splitEndpointPort` (same
 * helper the relationship parser uses for `Class::member` endpoints).
 *
 * T3 (unknown-bucket-routing-repair): the bare-id charset was ASCII `\w`;
 * upstream's `CODE` (`NameAndCodeParser.codeForClass()`, `command/
 * NameAndCodeParser.java:49,90-91`) is a NEGATED class --
 * `[^%s{}%g<>]+` (anything but whitespace/brace/quote/angle-bracket) --
 * which accepts Unicode identifiers (and everything else) trivially since it
 * excludes rather than enumerates. Widened to match (`note right of 春`);
 * the `+` here still backtracks to let the optional `::member` suffix split
 * off, same as the ASCII form did.
 */
const NOTE_TARGET_CODE = '[^\\s{}"\'<>]+';
export const NOTE_TARGET = `(${NOTE_TARGET_CODE}(?:::(?:${NOTE_TARGET_CODE}|"[^"]+"))?|"[^"]+")`;

/**
 * A note block being accumulated until `end note`. Two shapes:
 *  - `attached`: `note <pos> of <Entity>` — has a host + position.
 *  - `freestanding`: `note as <alias>` — no host; the alias becomes the note's
 *    id so later relationship lines (`alias .> Something`) can reference it.
 *
 * `namespace` is captured at note-OPEN time (the active namespace when the
 * `note ...` line was seen), not at `end note` — mirrors upstream, where the
 * note leaf is created under `getCurrentGroup()` as soon as the command runs
 * (`CommandFactoryNote.java:197`), before any body lines are consumed.
 */
export type PendingNote =
  | {
      kind: 'attached';
      target: string | undefined;
      /**
       * True when `target` came from falling back to `lastEntity` (no
       * `of <Entity>` clause was written at all) rather than an explicit
       * `of` reference. `CommandFactoryNote` (bare `note <pos>`) and
       * `CommandFactoryNoteOnEntity` (`note <pos> of <Entity>`) are separate
       * upstream commands with separate merge behavior — verified against
       * the oracle (zepeki-75-pifo352: a bare `note left` and an explicit
       * `note left of test::member`, same host+side, do NOT merge into one
       * svek node, unlike two explicit `of` notes on the same side — see
       * note-layout.ts's `groupNotes`).
       */
      implicitTarget: boolean;
      position: NotePosition;
      textLines: string[];
      namespace: string | null;
      /** T3c: the diagram's active `set separator`
       *  (`ParseState.namespaceSeparator`) at note-OPEN time — same capture
       *  timing as `namespace` above; needed to qualify `target` against it
       *  (`resolveNoteHostId`'s doc comment). */
      sep: string | null;
      /**
       * `'brace'` for the `note <pos> [of X] {` opener, closed by a bare `}`
       * instead of `end note` — upstream registers this as a SEPARATE
       * `withBracket=true` grammar; only the attached-note command has a
       * bracket form, freestanding notes never do.
       * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnEntity.java:120-146
       * @see ~/git/plantuml/.../classdiagram/ClassDiagramFactory.java:150-157
       */
      closer?: 'brace';
      /** G2 N34: this note's own `#color` override, captured from
       *  `NOTE_COLOR` — see `ClassNote.color`'s doc comment (ast.ts) for the
       *  full grammar/precedence. */
      color?: string;
      /** G2 N37: this note's own `<<stereotype>>`, captured from
       *  `NOTE_STEREO_CAPTURE` — see `ClassNote.stereotype`'s doc comment
       *  (ast.ts). */
      stereotype?: string;
      /** G2 N70: this note's own `[[url]]`, captured from `NOTE_URL` and
       *  parsed via `parseUrlBracket` — see `ClassNote.url`'s doc comment. */
      url?: UrlInfo;
    }
  | {
      kind: 'freestanding';
      alias: string;
      textLines: string[];
      namespace: string | null;
      /** G2 N34: see the `attached` variant's identical field above. */
      color?: string;
      /** G2 N37: see the `attached` variant's identical field above. */
      stereotype?: string;
    }
  | {
      /** T10: `note [pos] on|of link` (multi-line, `NOTE_ON_LINK_MULTI_RE`)
       *  — attaches to the LAST relationship in `ast.relationships` at
       *  `end note` time, not to an entity; never sets `lastEntity`. Mirrors
       *  `state-notes.ts#PendingNote`'s `'link'` variant. */
      kind: 'link';
      position: NotePosition;
      textLines: string[];
      /** cdd2-T19c: this note-on-link's own `#color` spec, captured from
       *  `NOTE_ON_LINK_COLOR` (group 2 of `NOTE_ON_LINK_MULTI_RE`) — see
       *  {@link applyNoteOnLink}'s doc comment for how it is parsed and
       *  applied. */
      color?: string;
    };

/** True if `line` is the closer for `note` (`}` for a brace note, else `end note`). */
export function isNoteCloser(note: PendingNote, line: string): boolean {
  if (note.kind === 'attached' && note.closer === 'brace') return /^\}\s*$/.test(line);
  return /^end\s*note\s*$/i.test(line);
}

/**
 * Append an attached (`note <pos> [of <Entity>]`) note with a generated id.
 * Returns the generated id so the caller (parser.ts / class-commands.ts) can
 * update `ParseState.lastEntity` — upstream's `reallyCreateLeaf` unconditionally
 * sets `lastEntity` to every leaf it creates, including notes.
 * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java:218-228
 *
 * `namespace` is the active namespace at note-creation time — notes are
 * leaves in the same Quark tree as classifiers (`CucaDiagram.java:175-184
 * getCurrentGroup`), so they register into `Namespace.classifiers` the same
 * way `ensureClassifier`/`registerInNamespace` do for classifiers.
 */
/**
 * G2 N15: shared parse-time creation counter, same shape as `ParseState
 * .creationCounter` (mutable `{value}` box rather than a plain number so
 * every consumer sees the SAME running total) -- optional so hand-built
 * `ClassDiagramAST` fixtures that call `addNote`/`addFreestandingNote`
 * directly (most unit tests) keep working unchanged, same "absent when
 * built by hand" posture `Classifier.creationIndex`'s doc comment already
 * establishes.
 */
export interface NoteCreationCounter {
  value: number;
}

/**
 * G2 N53: shared parse-time dedup set for member-tip note groups, keyed
 * `${target}|${position}` (the SAME (host, side) pair `CommandFactory
 * TipOnEntity`'s `identTip` Quark dedups on, `idShort + "$$$" +
 * position.name()`) — mirrors `NoteCreationCounter`'s "mutable box shared
 * across every `addNote` call in one parse" shape. See `ClassNote
 * .tipGroupPhantomIndex`'s doc comment (ast.ts) for the burn this drives.
 */
export type TipGroupSeenSet = Set<string>;

/**
 * T3c (note-target-not-namespace-qualified): both `CommandFactoryNoteOnEntity`
 * (plain attached note) and `CommandFactoryTipOnEntity` (member-tip note)
 * resolve their host id via `diagram.quarkInContext(true, idShort)` BEFORE
 * reading its Entity -- reuse the SAME reference resolver a classifier
 * endpoint uses (`class-ensure-classifier.ts#resolveClassifierRef`'s
 * identical `reuseExistingChild: true`), so a bare `of X` inside a namespace
 * resolves to the namespace-qualified id, exactly as the host classifier's
 * own id does. Diagnosed in diagnosis/S2-edge.md
 * (note-target-not-namespace-qualified): a `note left of X` inside
 * `namespace ns { }` kept the bare target `X` while the class id was `ns.X`,
 * dropping the note's DOT edge and its opale connector. Split out of
 * `addNote` to stay under the function NLOC cap.
 * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnEntity.java:304
 * @see ~/git/plantuml/.../command/note/CommandFactoryTipOnEntity.java:206
 */
function resolveNoteHostId(ast: ClassDiagramAST, hostId: string, namespace: string | null, sep: string | null): string {
  return resolveReference({
    namespaces: ast.namespaces,
    sep,
    activeNamespace: namespace,
    name: stripQuotes(hostId),
    display: undefined,
    classifiers: ast.classifiers,
    reuseExistingChild: true,
  }).id;
}

export function addNote(
  ast: ClassDiagramAST,
  position: NotePosition,
  target: string,
  text: string,
  // T3c: `sep` is the diagram's active `set separator`
  // (`ParseState.namespaceSeparator`) -- see `resolveNoteHostId`'s doc
  // comment for why the target needs it.
  opts: {
    namespace: string | null;
    implicitTarget: boolean;
    sep: string | null;
    color?: string;
    stereotype?: string;
    url?: UrlInfo;
  },
  counter?: NoteCreationCounter,
  tipGroupsSeen?: TipGroupSeenSet,
): string {
  const { namespace, implicitTarget, sep, color, stereotype, url } = opts;
  const id = `__note_${ast.notes.length}`;
  // `Class::member`/`Class::"quoted member"` (NOTE_TARGET grammar above) — the
  // note anchors to the host classifier; the member suffix is metadata only
  // (targetPort), not a separate classifier (mirrors the relationship
  // parser's `Class::member` endpoint handling).
  const { id: hostId, port } = splitEndpointPort(target);
  // T3c: qualify the host id against the active namespace -- see
  // `resolveNoteHostId`'s own doc comment for the upstream citation.
  const resolvedHostId = resolveNoteHostId(ast, hostId, namespace, sep);
  // G2 N15 (ast.ts#ClassNote.creationIndex's doc comment): a non-tip
  // attached note (no `::member`) is `CommandFactoryNoteOnEntity`, which
  // ALWAYS burns one phantom `getUniqueSequence("GMN")` slot before its own
  // `Entity` ctor slot — consume two counter increments, keep only the
  // second.
  let creationIndex: number | undefined;
  let phantomSlot: true | undefined;
  if (counter !== undefined && port === undefined) {
    counter.value += 1; // phantom GMN slot -- consumes a rank, never an entity
    counter.value += 1;
    creationIndex = counter.value;
    // G2 N68: `CommandFactoryNoteOnEntity` (jar) ALSO creates the note's
    // note<->host CONNECTOR `Link` (a `noDisplay` dashed link, added via
    // `diagram.addLink` right after the note Leaf) -- it burns ONE more
    // shared-counter rank AFTER the note entity. Invisible when the note is
    // the last emitted element (its slot lands past the last id), but shifts
    // every element declared after the note (jar-verified `lenunu-95-bame774`:
    // note-left's connector burns the slot between it and the auto-created
    // `Data`). Recorded as a `type: 'phantom'` Ranked entry at
    // `creationIndex + 1` in `renderer-uid.ts`.
    counter.value += 1;
    phantomSlot = true;
  }
  // G2 N53 (ast.ts#ClassNote.tipGroupPhantomIndex's doc comment): a
  // member-tip note (`port !== undefined`, `CommandFactoryTipOnEntity`) has
  // no GMN call, but its FIRST occurrence per (target, position) burns TWO
  // phantom ranks (the TIPS entity + its invisible link) -- every LATER
  // member of the same group reuses the leader's already-created entity,
  // consuming nothing.
  let tipGroupPhantomIndex: number | undefined;
  if (counter !== undefined && port !== undefined) {
    const groupKey = `${resolvedHostId}|${position}`;
    if (tipGroupsSeen === undefined || !tipGroupsSeen.has(groupKey)) {
      counter.value += 1; // TIPS entity's own phantom ent-slot
      tipGroupPhantomIndex = counter.value;
      counter.value += 1; // its invisible Link's phantom lnk-slot
      tipGroupsSeen?.add(groupKey);
    }
  }
  ast.notes.push({
    id,
    target: resolvedHostId,
    ...(port !== undefined ? { targetPort: stripQuotes(port) } : {}),
    ...(implicitTarget ? { implicitTarget: true } : {}),
    position,
    text,
    ...(namespace !== null ? { namespace } : {}),
    ...(creationIndex !== undefined ? { creationIndex } : {}),
    ...(phantomSlot !== undefined ? { phantomSlot } : {}),
    ...(tipGroupPhantomIndex !== undefined ? { tipGroupPhantomIndex } : {}),
    ...(color !== undefined ? { color } : {}),
    ...(stereotype !== undefined ? { stereotype } : {}),
    ...(url !== undefined ? { url } : {}),
  });
  registerInNamespace(ast.namespaces, namespace, id);
  return id;
}

/**
 * cdd5-T5d (free-note-alias-not-quark-qualified): the note's own id is its
 * alias resolved against the current group, exactly like a declared
 * classifier's -- "final Quark<Entity> quark = diagram.quarkInContext(false,
 * diagram.cleanId(idShort));" -- so `note as _n` in packages `x` and `y` is
 * `x._n` and `y._n`, and `note as X.n` at root is child `n` of group `X`
 * (the chain `resolveReference` registers). The separator is the diagram's
 * live `set separator` (`ast.namespaceSeparator`, kept in step with
 * `ParseState` by `class-command-directives.ts`). Relationship endpoints
 * find the qualified id through `class-note-endpoint.ts#resolveNoteEndpoint`.
 * @see ~/git/plantuml/.../command/note/CommandFactoryNote.java:192-197
 */
/** `quarkInContext(false, cleanId(idShort))` for a freestanding note's
 *  alias (`CommandFactoryNote.java:192`), split out of
 *  {@link addFreestandingNote} for the function-length cap. */
function resolveFreestandingNoteId(ast: ClassDiagramAST, alias: string, namespace: string | null): ResolvedRef {
  return resolveReference({
    namespaces: ast.namespaces,
    sep: noteSeparator(ast),
    activeNamespace: namespace,
    name: stripQuotes(alias),
    display: undefined,
    classifiers: ast.classifiers,
    reuseExistingChild: false,
  });
}

export function addFreestandingNote(
  ast: ClassDiagramAST,
  alias: string,
  text: string,
  namespace: string | null,
  color?: string,
  counter?: NoteCreationCounter,
  stereotype?: string,
): string {
  const { id, nsId } = resolveFreestandingNoteId(ast, alias, namespace);
  // G2 N15: `CommandFactoryNote` (freestanding) has no GMN call — only the
  // `Entity` ctor's own slot is consumed, one increment.
  let creationIndex: number | undefined;
  if (counter !== undefined) {
    counter.value += 1;
    creationIndex = counter.value;
  }
  ast.notes.push({
    id,
    text,
    ...(nsId !== null ? { namespace: nsId } : {}),
    ...(creationIndex !== undefined ? { creationIndex } : {}),
    ...(color !== undefined ? { color } : {}),
    ...(stereotype !== undefined ? { stereotype } : {}),
  });
  registerInNamespace(ast.namespaces, nsId, id);
  return id;
}

/**
 * Returns the created note's id (to become the new `lastEntity`), or
 * `undefined` if the note was dropped — an `attached` note whose target could
 * not be resolved (no explicit `of <Entity>` and no `lastEntity` to fall back
 * to) mirrors upstream's `CommandExecutionResult.error("Nothing to note to")`
 * (`CommandFactoryNoteOnEntity.java:299-301`): our parser's posture for an
 * unresolvable command is a silent no-op, not a thrown error. A `'link'`
 * note (T10) never has an id and never updates `lastEntity` either — mirrors
 * `CommandFactoryNoteOnLink#executeInternal`, which only calls
 * `link.addNote(...)`, never `diagram.setLastEntity(...)`; same posture as
 * `state-notes.ts#finalizePendingNote`'s identical `'link'` branch.
 */
/** {@link finalizePendingNote}'s `'attached'`-branch, split out (cdd5-T3c) so
 *  threading `note.sep` through to `addNote` does not grow that function's
 *  own NLOC past its pre-existing cap. */
function finalizeAttachedNote(
  ast: ClassDiagramAST,
  note: Extract<PendingNote, { kind: 'attached' }>,
  text: string,
  counter?: NoteCreationCounter,
  tipGroupsSeen?: TipGroupSeenSet,
): string | undefined {
  if (note.target === undefined) return undefined;
  return addNote(
    ast,
    note.position,
    note.target,
    text,
    {
      namespace: note.namespace,
      implicitTarget: note.implicitTarget,
      sep: note.sep,
      ...(note.color !== undefined ? { color: note.color } : {}),
      ...(note.stereotype !== undefined ? { stereotype: note.stereotype } : {}),
      ...(note.url !== undefined ? { url: note.url } : {}),
    },
    counter,
    tipGroupsSeen,
  );
}

export function finalizePendingNote(
  ast: ClassDiagramAST,
  note: PendingNote,
  counter?: NoteCreationCounter,
  tipGroupsSeen?: TipGroupSeenSet,
): string | undefined {
  // isw-T2-cls F3: BlocLines#removeEmptyColumns only -- trailing and interior
  // whitespace survive (the lines are the RAW source lines, see
  // handlePendingNoteLine).
  const text = removeEmptyColumns(note.textLines).join('\n');
  if (note.kind === 'attached') return finalizeAttachedNote(ast, note, text, counter, tipGroupsSeen);
  if (note.kind === 'link') {
    applyNoteOnLink(ast, note.position, text, note.color);
    return undefined;
  }
  return addFreestandingNote(ast, note.alias, text, note.namespace, note.color, counter, note.stereotype);
}

/**
 * Consume a line while inside a multi-line note block, accumulating text
 * until `end note`. Returns true when the line was consumed (i.e. a note
 * was open). Moved from parser.ts (500-line cap split) — pure move, no
 * behavior change.
 */
export function handlePendingNoteLine(state: ParseState, line: string): boolean {
  if (state.pendingNote === null) return false;
  if (isNoteCloser(state.pendingNote, line)) {
    const id = finalizePendingNote(state.ast, state.pendingNote, state.creationCounter, state.tipGroupsSeen);
    if (id !== undefined) {
      state.lastEntity = id;
      // Attach `$tag`s captured on the opener (multi-line freestanding note).
      if (state.pendingNoteTags.length > 0) {
        const note = state.ast.notes.find((n) => n.id === id);
        if (note !== undefined) note.tags = state.pendingNoteTags;
      }
    }
    state.pendingNote = null;
    state.pendingNoteTags = [];
  } else {
    state.pendingNote.textLines.push(state.currentRawLine ?? line);
  }
  return true;
}

/** True if `id` refers to an already-parsed note (attached or freestanding). */
export function isNoteId(ast: ClassDiagramAST, id: string): boolean {
  return ast.notes.some((n) => n.id === id);
}

// cdd5-T3c (file-cap push-forward): `note on link` + `constraint on links`
// moved to `class-note-on-link.ts` to make room in this file for the
// namespace-qualification fix below; re-exported so existing
// `from './class-notes.js'` import sites (class-command-containers.ts,
// tests/unit/class/class-notes-link-color.test.ts) are unchanged. Pure move,
// no behavior change.
export {
  NOTE_ON_LINK_RE,
  NOTE_ON_LINK_MULTI_RE,
  parseNoteOnLinkColors,
  resolveLinkNotePosition,
  applyNoteOnLink,
  CONSTRAINT_ON_LINKS_RE,
  applyConstraintOnLinks,
} from './class-note-on-link.js';
export type { NoteOnLinkColors } from './class-note-on-link.js';
