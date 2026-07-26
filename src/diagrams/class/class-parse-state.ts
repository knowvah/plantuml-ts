/**
 * Mutable class-parser state (local to each `parseClass` call). Split out
 * of `parser.ts` (line cap); re-exported from it so every
 * `import { ..., type ParseState } from './parser.js'` site is unchanged.
 */

import type { ClassDiagramAST, Classifier } from './ast.js';
import type { PendingNote, TipGroupSeenSet } from './class-notes.js';
import type { UmlSource } from '../../core/block-extractor.js';

export interface ParseState {
  ast: ClassDiagramAST;
  /** Map from classifier id to its index in ast.classifiers. */
  classifierIndex: Map<string, number>;
  /**
   * When non-null we are inside an open brace body for this classifier id.
   * Lines are parsed as member definitions until `}` closes it.
   */
  pendingBodyId: string | null;
  /**
   * Raw body lines accumulated for a pending `json Name { ... }` classifier
   * (kind `'json'` only — a map/object/class body is parsed line-by-line
   * instead, see handlePendingBodyLine). Parsed as ONE JSON blob by
   * `finalizeJsonBody` (class-json-commands.ts) when the closing `}` line is
   * reached — a single body line (e.g. `"name": "component c1",`) is not
   * independently valid JSON, unlike a map/object body line. Reset on every
   * body close and on `newpage`.
   */
  pendingJsonLines: string[];
  /**
   * When non-null we are inside a namespace block.
   * New classifiers get this namespace assigned.
   */
  activeNamespace: string | null;
  /**
   * When non-null we are inside a multi-line note block (attached or
   * freestanding). Lines accumulate as note text until `end note`.
   */
  pendingNote: PendingNote | null;
  /**
   * `$tag` names captured by a multi-line freestanding note opener
   * (`note as N1 $z` … `end note`), attached to the note when the block
   * finalizes. Carried here rather than on `PendingNote` so the tag feature
   * stays within the command/parse seam. Reset together with `pendingNote`.
   * @see ~/git/plantuml/.../command/note/CommandFactoryNote.java:85 (TAGS)
   */
  pendingNoteTags: string[];
  /**
   * The namespace separator for splitting dotted ids into nested namespaces.
   * Defaults to `.` (AbstractEntityDiagram.java:88); `set namespaceSeparator`
   * or `set separator` overrides it, and `none` (→ null) disables splitting.
   */
  namespaceSeparator: string | null;
  /** `!pragma useIntermediatePackages false` collapses a dotted id to one
   *  namespace instead of a nested chain (default true). */
  intermediatePackages: boolean;
  /**
   * Namespace id → usymbol for *descriptive* containers (`rectangle`/`component`/
   * `stack`/… opened with a `{` body — not a plain `package`). Used on `}` close
   * to convert an EMPTY descriptive container into a rect leaf (upstream renders
   * an empty descriptive-element box as a rect, whereas an empty package vanishes).
   */
  descriptiveContainers: Map<string, string>;
  /**
   * Enclosing-container ids saved when a brace container opens, so a `}`
   * restores the parent container. The flat `activeNamespace` alone cannot nest
   * brace-delimited containers (`package { rectangle { … } }`).
   */
  namespaceStack: (string | null)[];
  /**
   * Namespace ids active when each open `together {` block started
   * (CommandTogether → CucaDiagram#gotoTogether pushes a Together entry on
   * the same stacks list as groups). Lets the `}` handler pop the innermost
   * together instead of the enclosing namespace — see closeBraceScope
   * (class-container.ts).
   */
  togetherStack: (string | null)[];
  /**
   * The most recently created entity's id — classifier OR note (upstream
   * `CucaDiagram#lastEntity`, set unconditionally by every `reallyCreateLeaf`
   * call). Used to resolve a `note <pos>` line whose `of <Entity>` clause is
   * omitted. `null` before any entity has been created, or right after a
   * `newpage` resets the diagram.
   * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java:140,218-228,675-676
   */
  lastEntity: string | null;
  /**
   * Completed pages, in source order, accumulated by `newpage`
   * (upstream `NewpagedDiagram`). Does NOT include the in-progress
   * `state.ast` — that is appended once parsing finishes.
   */
  pages: ClassDiagramAST[];
  /**
   * G2 N2 (mechanism 3, entity/cluster/link `<g>` wrapping + uid
   * assignment): shared parse-time creation counter, mirroring upstream
   * `CucaDiagram#cpt1` (`AtomicInteger`, `getUniqueSequenceValue()`).
   * Stamped onto `Classifier.creationIndex`/`Namespace.creationIndex`/
   * `Relationship.creationIndex` at their respective creation chokepoints
   * (`ensureClassifier` below, `ensureNamespaceChain`, and the primary
   * relationship-dispatch site in `class-commands.ts`) — see those
   * fields' own doc comments for the exact/fallback gate this feeds.
   * Reset on `newpage` (a fresh page is a fresh upstream `CucaDiagram`).
   */
  creationCounter: { value: number };
  /**
   * G2 N53: shared parse-time dedup set for member-tip note groups -- see
   * `ClassNote.tipGroupPhantomIndex`'s doc comment (ast.ts) and
   * `class-notes.ts#TipGroupSeenSet`. Reset alongside `creationCounter` on
   * `newpage` (a fresh page is a fresh upstream `CucaDiagram`, with its own
   * fresh `identTip` Quark namespace).
   */
  tipGroupsSeen: TipGroupSeenSet;
  /**
   * G2 N9: 0-indexed source line of the CURRENT line being dispatched
   * (`UmlSource.linePositions[i]`, minimal "command-dispatch level"
   * tracking -- see `preprocessor.ts#PreprocessorResult.linePositions`'s
   * doc comment). `undefined` when the block carries no position data
   * (a hand-built literal `UmlSource` fixture) or the line was merged by
   * `mergeStandaloneBraces` from a position-less source. Read by the
   * relationship-dispatch command (`class-commands.ts`) to stamp
   * `Relationship.sourceLine`; not consulted by any other command this
   * iteration (narrowly scoped to the edge `<path codeLine="...">`
   * mechanism -- see `ast.ts#Relationship.sourceLine`'s doc comment).
   */
  currentLine?: number | undefined;
  /**
   * G2 N42: the CURRENT line being dispatched, trailing-whitespace-only
   * trimmed (`MergedLines.rawLines`'s own doc comment) -- read by
   * `handlePendingBodyLine`'s `rawBodyLines` capture so a `|_` tree-list
   * line's leading indentation survives `mergeStandaloneBraces`'s own full
   * `.trim()` of `state.currentLine`'s sibling, the dispatched `line`
   * value. `undefined` only for a hand-built literal `UmlSource` fixture
   * that bypasses `parseClass`'s main loop.
   */
  currentRawLine?: string | undefined;
  /**
   * G2 N39: the block's `<style>`-block open positions
   * (`UmlSource.stylePositions`, parallel to its `rawStyles`), read by
   * `ensureClassifier` to stamp `Classifier.styleGeneration` -- see that
   * field's own doc comment. Empty for a hand-built literal `UmlSource`
   * fixture (every pre-N39 call site), which makes every classifier's
   * `styleGeneration` compute to a constant `0` (harmless: `theme.ts
   * #classTagCascadeGenerations` is itself only ever populated when the
   * source carries >1 `<style>` block, so this value is never consulted).
   */
  stylePositions: readonly (number | undefined)[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
