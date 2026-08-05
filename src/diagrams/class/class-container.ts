/**
 * Descriptive-container helpers for the class parser. A descriptive container
 * (`rectangle`/`component`/`stack`/… opened with a `{` body — upstream
 * CommandPackageWithUSymbol) groups like a package when it has children (a
 * cluster), but an EMPTY one renders as a plain rect box, unlike an empty
 * `package` which vanishes at THIS (parse-time) chokepoint. `closeContainer`
 * performs that empty→leaf conversion when the block closes.
 *
 * A plain `package`/`namespace` is NOT collapsed here, deliberately: unlike a
 * descriptive container (which cannot be reopened by name after its `}`), a
 * dotted namespace path CAN be reopened by a later block adding real content
 * under it (`namespace f1 {}` … `namespace f1.function { class Fox }` — `f1`
 * is empty at ITS OWN close, not empty once `f1.function` exists under it).
 * Collapsing `f1` eagerly here would strand it as a classifier while a LATER
 * `ensureNamespaceChain` call for `f1.function` recreates a fresh, disconnected
 * `f1` namespace — a stray duplicate node with no way to reconcile the two
 * without re-scanning the whole array. Confirmed via regression on the oracle
 * DOT for delano-03-xino845/faxoga-34-moja699/jabeme-35-logi109 (all reopen a
 * previously-empty-closed namespace) when this collapse was broadened to
 * plain containers. The general (reopen-safe) collapse for plain
 * `package`/`namespace` instead runs ONCE on the fully-parsed AST, at the
 * layout-input boundary — see `collapseEmptyNamespacesFinal`
 * (class-namespace.ts), called from `layout.ts` alongside
 * `filterRemovedEntities` — mirroring upstream's real timing:
 * `GraphvizImageBuilder#printGroups` (svek/GraphvizImageBuilder.java:406-419)
 * mutes an empty `GroupType.PACKAGE` to `LeafType.EMPTY_PACKAGE` at
 * DOT-export time, on the complete diagram model, not per-block-close.
 */
import type { ParseState } from './parser.js';
import {
  splitOnSeparator,
  ensureNamespaceChain,
  collapseEmptyNamespace,
  qualifiedId,
} from './class-namespace.js';
import { NOTE_URL, NOTE_COLOR } from './class-notes.js';
import { stripQuotes } from './class-relationship-parser.js';
import { parseWithNewlines } from '../../core/klimt/creole/DisplayNewlines.js';
import { Pragma } from '../../core/skin/Pragma.js';

/**
 * Quark collision: a `package`/`namespace` block reuses the SAME name as an
 * already-declared classifier at the same qualified position (e.g. `class
 * Toto` then `package Toto { class Titi }`). Upstream's Quark tree has one
 * node per qualified name shared by leaves and groups (Quark.java:134-141,
 * `getDirectChild` returns the EXISTING child rather than creating a new
 * one); `CucaDiagram#gotoGroup` (CucaDiagram.java:342-363) finds the quark's
 * data already set (the leaf `Toto` entity) and calls
 * `ent.muteToGroupType(type)` (abel/Entity.java:201-204) — mutating that SAME
 * entity into a group in place, rather than creating a second entity. The
 * leaf's own node therefore never reaches DOT; only its (now-)children do.
 * Ported as: drop the pre-existing classifier before registering the
 * namespace at the same id, so no node is emitted for it and its former
 * top-level slot is simply superseded by the cluster.
 */
/** Returns the muted classifier's own `creationIndex` (undefined when
 *  nothing was muted, or the muted row never had one) -- G2 N8, so the
 *  caller can hand it to the replacement `Namespace` instead of letting it
 *  consume a brand-new counter slot (see `ensureNamespaceChain`'s
 *  `reuseCreationIndex` param doc, class-namespace.ts). */
function muteClassifierToGroup(state: ParseState, effectiveId: string): number | undefined {
  const idx = state.classifierIndex.get(effectiveId);
  if (idx === undefined) return undefined;
  const creationIndex = state.ast.classifiers[idx]!.creationIndex;
  state.ast.classifiers.splice(idx, 1);
  state.classifierIndex.delete(effectiveId);
  for (const [id, i] of state.classifierIndex) {
    if (i > idx) state.classifierIndex.set(id, i - 1);
  }
  for (const ns of state.ast.namespaces) {
    const pos = ns.classifiers.indexOf(effectiveId);
    if (pos !== -1) ns.classifiers.splice(pos, 1);
  }
  return creationIndex;
}

/**
 * Open a `package`/`namespace`/descriptive-container block: mark it the active
 * container, splitting a dotted name into a nested chain. All map to the same
 * GroupType.PACKAGE container upstream; the USymbol difference does not affect
 * DOT cluster structure. A dotted id is qualified under the enclosing
 * container unless its first segment already names an EXISTING top-level
 * namespace — `qualifiedId` (class-namespace.ts) ports this exact
 * `CucaDiagram#quarkInContextSafe` rule (CucaDiagram.java:248-286) shared
 * with classifier-reference resolution, so two `package ddf.sub {}` blocks
 * under two different enclosing packages build two independent `ddf`
 * clusters instead of merging into one global `ddf` (tibatu-28-jiro743).
 */
export function openNamespaceBlock(
  state: ParseState,
  id: string,
  display: string,
): string {
  // Restore point for the enclosing container on the matching `}`.
  const enclosing = state.activeNamespace;
  state.namespaceStack.push(enclosing);

  const sep = state.namespaceSeparator ?? '.';
  const ns = state.ast.namespaces;
  const effectiveId = qualifiedId(id, enclosing, state.namespaceSeparator, ns);
  const mutedCreationIndex = muteClassifierToGroup(state, effectiveId);
  // G2 N8: thread the muted classifier's OWN creationIndex to whichever
  // namespace path below actually creates the `effectiveId` group, so it
  // reuses that slot instead of consuming a fresh one (see
  // `ensureNamespaceChain`'s `reuseCreationIndex` doc comment).
  const reuseCreationIndex =
    mutedCreationIndex !== undefined ? { id: effectiveId, creationIndex: mutedCreationIndex } : undefined;

  const segments = splitOnSeparator(effectiveId, state.namespaceSeparator);
  if (segments !== null) {
    // A2s R2d (rakuci-96-tuti371): a nested container's id qualifies to a
    // dotted path, and `ensureNamespaceChain` creates each level with
    // `display: seg` -- losing an explicit quoted display (`rectangle " YY "
    // as YYY {`). Upstream threads the DISPLAY capture verbatim into
    // `gotoGroup`, which sets it on the NEWLY-created group only (an
    // existing group keeps its display -- `setDisplay` runs under
    // `quark.getData() == null`). Mirror both halves: override the chain
    // leaf's display iff the caller passed a display distinct from the id
    // (a bare/dotted name keeps segment semantics) AND this call created it.
    // @see ~/git/plantuml/.../descdiagram/command/CommandPackageWithUSymbol.java:182-198
    // @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:349-355
    const existedBefore = ns.some((n) => n.id === effectiveId);
    state.activeNamespace = ensureNamespaceChain(ns, sep, segments, state.creationCounter, reuseCreationIndex);
    if (!existedBefore && display !== id) {
      const leaf = ns.find((n) => n.id === state.activeNamespace);
      if (leaf !== undefined) leaf.display = display;
    }
    return state.activeNamespace;
  }
  state.activeNamespace = effectiveId;
  if (ns.find((n) => n.id === effectiveId) === undefined) {
    // G2 N2 (mechanism 3): a non-dotted namespace open bypasses
    // ensureNamespaceChain's own chokepoint -- stamp creationIndex here
    // too, same counter, same semantics (see ast.ts#Classifier
    // .creationIndex's doc comment). G2 N8: reuse the muted classifier's
    // own index (see `reuseCreationIndex` above) instead of bumping the
    // counter, when applicable.
    let creationIndex: number;
    if (reuseCreationIndex !== undefined) {
      creationIndex = reuseCreationIndex.creationIndex;
    } else {
      state.creationCounter.value += 1;
      creationIndex = state.creationCounter.value;
    }
    ns.push({ id: effectiveId, display, classifiers: [], creationIndex });
  }
  // #lizard forgives -- pre-existing 32 NLOC / 7 CCN (unchanged by A2s F-G;
  // the branch structure ports CucaDiagram#quarkInContextSafe + G2 N8's
  // creationIndex reuse and must not be refactored mid-port).
  return effectiveId;
}

/**
 * On `}` close of the namespace `nsId`: if it is an EMPTY descriptive container,
 * drop the (member-less) namespace and add a `descriptive` rect-leaf classifier
 * in its place, carrying the container's USymbol. A non-empty descriptive
 * container is left as a cluster. A no-op for any other container kind (plain
 * `package`/`namespace`) — see the file doc for why that collapse is deferred
 * to `collapseEmptyNamespacesFinal`. Delegates the actual collapse to
 * `collapseEmptyNamespace` (class-namespace.ts), shared with the same-line
 * `X {}` path.
 */
/** `together {` (CommandTogether → CucaDiagram#gotoTogether,
 *  CucaDiagram.java:337): a layout-proximity grouping with NO structural DOT
 *  cluster of its own that the comparator counts (svek emits a letter-suffixed
 *  `cluster6t0` subgraph the parity bar ignores) — members still belong to the
 *  enclosing namespace. Records the namespace active at open time so the
 *  matching `}` pops the together, not that namespace (nadono-22-gidu983: the
 *  stray `}` popped the enclosing namespace early, stranding later
 *  classifiers outside its cluster). */
export function openTogetherBlock(state: ParseState): void {
  state.togetherStack.push(state.activeNamespace);
}

/** Shared `}` handling (rule 4 in class-commands.ts, pure move): an open
 *  member body wins, then an innermost together block (one opened in the
 *  CURRENT namespace scope — LIFO, mirroring upstream's single
 *  CucaDiagram.stacks list holding Together and group entries), then the
 *  active namespace. */
export function closeBraceScope(state: ParseState): void {
  if (state.pendingBodyId !== null) {
    state.pendingBodyId = null;
    return;
  }
  if (
    state.togetherStack.length > 0 &&
    state.togetherStack[state.togetherStack.length - 1] === state.activeNamespace
  ) {
    state.togetherStack.pop();
    return;
  }
  if (state.activeNamespace !== null) {
    closeContainer(state, state.activeNamespace);
    state.activeNamespace = state.namespaceStack.pop() ?? null;
  }
}

export function closeContainer(state: ParseState, nsId: string): void {
  const usymbol = state.descriptiveContainers.get(nsId);
  if (usymbol === undefined) return;
  const ns = state.ast.namespaces.find((n) => n.id === nsId);
  if (ns === undefined || ns.classifiers.length > 0) return;

  state.ast.namespaces = collapseEmptyNamespace(
    state.ast.namespaces,
    state.classifierIndex,
    state.ast.classifiers,
    nsId,
  );
  const idx = state.classifierIndex.get(nsId);
  if (idx !== undefined) {
    const leaf = state.ast.classifiers[idx]!;
    leaf.usymbol = usymbol;
    // A2s R2h (daxeno-00): upstream routes EVERY package/container display
    // through `Display.getWithNewlines` when the group is created
    // (CommandPackage.java:182-183's gotoGroup call), so a literal `\n`
    // break sequence in the header title is already split into real lines
    // by the time `EntityImageDescription` measures the collapsed leaf.
    // Mirror it here, where the USymbol leaf materializes -- the ported
    // scanner (`DisplayNewlines.ts#parseWithNewlines`) is the same one the
    // note pipeline uses. Verified: with real newlines the description
    // sizing reproduces daxeno's golden node byte-exact (1.575694x0.847222).
    const parsed = parseWithNewlines(Pragma.createEmpty(), leaf.display);
    if (parsed !== null) leaf.display = parsed.lines.join('\n');
  }
}

interface Command {
  pattern: RegExp;
  execute(state: ParseState, match: RegExpExecArray): void;
}

/**
 * The `USymbols` registry names (`all` map keys, recorded UPPERCASE), for
 * the `USymbols.fromString` lookup below. The bracket-including special
 * cases at the top of `fromString` (`s.equalsIgnoreCase("package")` etc.)
 * can never match a `<<...>>`-delimited stereotype string, so only this
 * registry lookup is live on the package/namespace-header path.
 * @see ~/git/plantuml/.../decoration/symbol/USymbols.java:60-95 (record calls)
 * @see ~/git/plantuml/.../decoration/symbol/USymbols.java:98-120 (fromString)
 */
const USYMBOL_NAMES: ReadonlySet<string> = new Set([
  'ACTION', 'ACTOR_AWESOME', 'ACTOR_HOLLOW', 'ACTOR_STICKMAN',
  'ACTOR_STICKMAN_BUSINESS', 'AGENT', 'ARCHIMATE', 'ARTIFACT', 'BOUNDARY',
  'CARD', 'CLOUD', 'COLLECTIONS', 'COMPONENT_RECTANGLE', 'COMPONENT1',
  'COMPONENT2', 'CONTROL', 'DATABASE', 'ENTITY_DOMAIN', 'FILE', 'FOLDER',
  'FRAME', 'GROUP', 'HEXAGON', 'INTERFACE', 'LABEL', 'NODE', 'PACKAGE',
  'PARTITION', 'PERSON', 'PROCESS', 'QUEUE', 'RECTANGLE', 'STACK', 'STORAGE',
  'USECASE', 'USECASE_BUSINESS',
]);

/**
 * A2s F-G mechanism A8: capturing variant of `NOTE_STEREO` for the
 * package/namespace header commands -- `StereotypePattern.mandatory`'s own
 * `(\<\<.+?\>\>)` (non-greedy), wrapped optional like
 * `StereotypePattern.optional`.
 * @see ~/git/plantuml/.../stereo/StereotypePattern.java:66-68
 */
export const HEADER_STEREO_CAPTURE = '(?:\\s*(<<.+?>>))?';

/**
 * `USymbols` registry name -> this port's descriptive-leaf keyword (the
 * `Classifier.usymbol` / `descriptiveContainers` value vocabulary,
 * `core/descriptive-keywords.ts#KEYWORD_TO_SYMBOL`'s key set). Style
 * variants collapse onto their base keyword exactly as upstream's keyword
 * grammar does (`COMPONENT1`/`COMPONENT2`/`COMPONENT_RECTANGLE` are all
 * spelled `component`, with `skinparam componentStyle` picking the face;
 * likewise the three plain-actor registry entries -> `actor` +
 * `actorStyle`). `GROUP`/`PARTITION` have NO leaf keyword in upstream's
 * `ALL_TYPES` grammar either (they are group-only USymbols) -- absent here,
 * so a `<<Group>>` package header stays consumed-but-unmapped (the
 * pre-R2h behavior for the whole gated set).
 * @see ~/git/plantuml/.../decoration/symbol/USymbols.java:60-95
 */
const USYMBOL_REGISTRY_TO_KEYWORD: ReadonlyMap<string, string> = new Map([
  ['ACTION', 'action'], ['ACTOR_AWESOME', 'actor'], ['ACTOR_HOLLOW', 'actor'],
  ['ACTOR_STICKMAN', 'actor'], ['ACTOR_STICKMAN_BUSINESS', 'actor/'],
  ['AGENT', 'agent'], ['ARCHIMATE', 'archimate'], ['ARTIFACT', 'artifact'],
  ['BOUNDARY', 'boundary'], ['CARD', 'card'], ['CLOUD', 'cloud'],
  ['COLLECTIONS', 'collections'], ['COMPONENT_RECTANGLE', 'component'],
  ['COMPONENT1', 'component'], ['COMPONENT2', 'component'],
  ['CONTROL', 'control'], ['DATABASE', 'database'],
  ['ENTITY_DOMAIN', 'entity'], ['FILE', 'file'], ['FOLDER', 'folder'],
  ['FRAME', 'frame'], ['HEXAGON', 'hexagon'], ['INTERFACE', 'interface'],
  ['LABEL', 'label'], ['NODE', 'node'], ['PACKAGE', 'package'],
  ['PERSON', 'person'], ['PROCESS', 'process'], ['QUEUE', 'queue'],
  ['RECTANGLE', 'rectangle'], ['STACK', 'stack'], ['STORAGE', 'storage'],
  ['USECASE', 'usecase'], ['USECASE_BUSINESS', 'usecase/'],
]);

/**
 * Store a `package`/`namespace` header's `<<stereotype>>` on its Namespace
 * (A2s F-G mechanism A8; consumed by `collapseEmptyNamespace`,
 * class-namespace.ts, when the group ends EMPTY). `stereoRaw` is the full
 * `<<...>>` capture (undefined when the header has none). When `gated`, a
 * stereotype naming a USymbol selects the package SHAPE upstream instead of
 * being displayed (`if (stereotype != null && usymbol == null)
 * p.setStereotype(...)`) -- mirror `USymbols.fromString`'s
 * `goUpperCase(s.replaceAll("\\W", ""))` registry lookup and, instead of
 * displaying it, record the mapped descriptive keyword in
 * `state.descriptiveContainers` (A2s R2h, daxeno-00): upstream passes the
 * `USymbols.fromString` hit to `gotoGroup` as the group's OWN USymbol
 * (CommandPackage.java:179-183), and the existing `closeContainer` collapse
 * then attaches it to the collapsed-empty leaf, routing sizing through
 * `tryMeasureDescriptionLeaf` -> `measureLeafNode`.
 * `CommandNamespace2` (quoted `"Display" as alias` form) passes
 * `gated: false`: upstream sets its stereotype unconditionally.
 * Stored as the inner text (`<<`/`>>` stripped, trimmed) -- the same
 * convention as `Classifier.stereotype` (class-declaration-extractors.ts).
 * @see ~/git/plantuml/.../command/CommandPackage.java:178-191
 * @see ~/git/plantuml/.../command/CommandNamespace.java:113-124
 * @see ~/git/plantuml/.../command/CommandNamespace2.java:122-124
 */
export function setNamespaceStereotype(
  state: ParseState,
  nsId: string,
  stereoRaw: string | undefined,
  gated: boolean,
): void {
  if (stereoRaw === undefined) return;
  const registryName = stereoRaw.replace(/\W/g, '').toUpperCase();
  if (gated && USYMBOL_NAMES.has(registryName)) {
    const keyword = USYMBOL_REGISTRY_TO_KEYWORD.get(registryName);
    if (keyword !== undefined) state.descriptiveContainers.set(nsId, keyword);
    return;
  }
  const inner = /<<\s*(.+)\s*>>/.exec(stereoRaw)?.[1]?.trim();
  if (inner === undefined || inner.length === 0) return;
  const ns = state.ast.namespaces.find((n) => n.id === nsId);
  if (ns !== undefined) ns.stereotype = inner;
}

/**
 * Namespace-block command pair, moved out of class-commands.ts (line cap):
 * CommandNamespace2 (`namespace "Display" as alias {`, tried first) and
 * CommandNamespace (`namespace NAME {`). Spread into `COMMANDS` in place —
 * order preserved.
 */
export const NAMESPACE_COMMANDS: readonly Command[] = [
  // CommandNamespace2: `namespace "Display <img:...>" as alias {`. The quoted
  // DISPLAY group is `[^"]+` upstream (CommandNamespace2.java:70) — no
  // restriction on `<`/`>`/`{`/`}` inside it, so an embedded
  // `<img:...{scale=1.5}>` tag is just display text, not grammar. Tried
  // BEFORE the plain-NAME form below, whose bare-token alternative would
  // otherwise consume the opening quote and then fail on ` as alias {`.
  {
    pattern: new RegExp(
      '^namespace\\s+"([^"]+)"\\s+as\\s+(\\S+)' +
        HEADER_STEREO_CAPTURE +
        NOTE_URL +
        NOTE_COLOR +
        '\\s*\\{(\\s*\\})?\\s*$',
      'i',
    ),
    execute(state, match) {
      const display = match[1]!;
      const nsId = match[2]!;
      const effectiveId = openNamespaceBlock(state, nsId, display);
      // A2s F-G mechanism A8: stereo capture (group 3) -- UNGATED,
      // CommandNamespace2.java:122-124 calls setStereotype without any
      // `USymbols.fromString` check (unlike CommandNamespace/CommandPackage).
      setNamespaceStereotype(state, effectiveId, match[3], false);
      // G2 N34: NOTE_COLOR is capturing; G2 N70: NOTE_URL is now capturing
      // too (it precedes COLOR here); A8: the stereo group above shifted
      // url/color/brace by one more -- the same-line-brace group is now
      // match[6]. This command does not consume a namespace's own URL (no
      // render path for it yet).
      if (match[6] !== undefined) {
        state.ast.namespaces = collapseEmptyNamespace(
          state.ast.namespaces,
          state.classifierIndex,
          state.ast.classifiers,
          effectiveId,
        );
        state.activeNamespace = state.namespaceStack.pop() ?? null;
      }
    },
  },

  // CommandNamespace (opens, closed by a later '}') and CommandNamespaceEmpty
  // (same-line 'X {}', group 2 — collapsed to a rect leaf) share this
  // pattern. URL sits before COLOR so a tooltip's own '{'/'}' is consumed as
  // part of the bracket run, not the trailing brace.
  {
    pattern: new RegExp(
      '^namespace\\s+("[^"]*"|[^\\s#<{]+)' +
        HEADER_STEREO_CAPTURE +
        NOTE_URL +
        NOTE_COLOR +
        '\\s*\\{(\\s*\\})?\\s*$',
      'i',
    ),
    execute(state, match) {
      const nsId = stripQuotes(match[1]!);
      const effectiveId = openNamespaceBlock(state, nsId, nsId);
      // A2s F-G mechanism A8: stereo capture (group 2) -- GATED, a
      // USymbol-naming stereotype selects the shape instead
      // (CommandNamespace.java:113-124).
      setNamespaceStereotype(state, effectiveId, match[2], true);
      // G2 N34: NOTE_COLOR is capturing; G2 N70: NOTE_URL is now capturing
      // too (it precedes COLOR here); A8: the stereo group above shifted
      // url/color/brace by one more -- the same-line-brace group is now
      // match[5]. This command does not consume a namespace's own URL (no
      // render path for it yet).
      if (match[5] !== undefined) {
        state.ast.namespaces = collapseEmptyNamespace(
          state.ast.namespaces,
          state.classifierIndex,
          state.ast.classifiers,
          effectiveId,
        );
        state.activeNamespace = state.namespaceStack.pop() ?? null;
      }
    },
  },
];
