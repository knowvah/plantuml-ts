/**
 * AST type definitions for PlantUML activity diagrams (new syntax).
 */

import type { DiagramAnnotations } from '../../core/annotations/index.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { Pragma } from '../../core/skin/Pragma.js';

// ---------------------------------------------------------------------------
// Leaf node types
// ---------------------------------------------------------------------------

export interface ActivityAction {
  kind: 'action';
  label: string;
  color?: string;
  stereotype?: string;
  swimlane?: string;
}

export interface ActivityStart {
  kind: 'start';
  swimlane?: string;
}

export interface ActivityStop {
  kind: 'stop';
  swimlane?: string;
}

export interface ActivityEnd {
  kind: 'end';
  swimlane?: string;
}

export interface ActivityKill {
  kind: 'kill';
  swimlane?: string;
}

export interface ActivityDetach {
  kind: 'detach';
  swimlane?: string;
}

export interface ActivityBreak {
  kind: 'break';
  swimlane?: string;
}

export interface ActivityArrowLabel {
  kind: 'arrow-label';
  label: string;
  color?: string;
  swimlane?: string;
}

/**
 * `backward:LABEL;` inside a `repeat`/`repeatwhile` body -- names the
 * activity drawn on the loop's own RETURN edge, not a sequential body
 * step. Base form only (label + optional trailing stereogroup, both
 * ignored downstream): the incoming/outgoing arrow-color decoration and
 * the box-style/stereotype the label would carry on the return edge are
 * out of scope, matching `GtileRepeat`'s own class doc ("`backward:`
 * bodies are out of scope ... filed as `activity-loop-backward`").
 * `tileNode` (`layout/tile-layout.ts`) drops this node the same way it
 * drops `arrow-label` -- parsed, not yet drawn.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandBackward3.java:73-170
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:135
 *   -- registration.
 */
export interface ActivityBackward {
  kind: 'backward';
  label: string;
  swimlane?: string;
}

/**
 * `(X)` / `#color:(X)` -- a single-character "circled spot" connector,
 * drawn as a real 20x20 circle (`FtileCircleSpot.java:60` `SIZE = 20`,
 * fixed regardless of the character's own measured width -- the upstream
 * regex captures exactly one non-space character, never more). `color`
 * overrides ONLY the fill (`addSpot(spot, color)`); the border is always
 * the diagram's plain root ink, never themed through the `activity`
 * skinparam bucket (`circle,spot`'s merged style has no skinparam convert
 * at all -- verified by grep of `FromSkinparamToStyle.java`, unlike
 * `circle,start/stop/end`, which DO).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandCircleSpot3.java:56-62
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionSpot.java:66-74,84-90
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileCircleSpot.java:60,96-117
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:144
 *   -- registered right after Start3/Stop3.
 */
export interface ActivitySpot {
  kind: 'spot';
  /** The single circled character (upstream's `SPOT` regex group,
   *  `\((\S)\)` -- always exactly one character). */
  name: string;
  color?: string;
  swimlane?: string;
}

/**
 * `label NAME` -- declares the target of a later `goto NAME` jump. Maps
 * 1:1 to `FtileLabel`, which extends `FtileEmpty` with NO override of
 * either `drawU` (empty -- draws nothing) or `calculateDimensionFtile`
 * (inherited `calculateDimensionEmpty()`: `width = height = 0`, a normal
 * out point). Verified empirically, not just read: a controlled
 * `start; label X; :A; stop;` oracle render is BYTE-IDENTICAL to the same
 * diagram with the `label X;` line deleted (`.agent-notes/T2g-spot-label-
 * goto.md`) -- `tile-layout.ts#tileNode` must therefore build a REAL
 * zero-size tile (not drop the node, the way `arrow-label`/`backward`
 * do), and the existing generic zero-gap-merge + snake-merge machinery
 * (D1, `layout/snake-merge.ts`) collapses its two adjacent links into the
 * jar's own single one with no code change of its own.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandLabel.java:56-61
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionLabel.java:52-58
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileLabel.java:40-49
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileEmpty.java:47,83,87-92
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:160
 */
export interface ActivityLabel {
  kind: 'label';
  name: string;
  swimlane?: string;
}

/**
 * `goto NAME` -- jumps to the `label NAME` declared elsewhere. Maps 1:1
 * to `FtileGoto`, which extends `FtileEmpty` (zero size, draws nothing)
 * and additionally overrides `calculateDimensionFtile` to
 * `.withoutPointOut()` -- unlike {@link ActivityLabel}, a `goto` tile has
 * NO out point, so no link is ever drawn FROM it to whatever sequential
 * sibling follows (verified empirically: `start;:A;goto X;:B;stop;`
 * renders `B` 10px lower than the same diagram with the `goto X;` line
 * deleted, with no connecting line into that gap -- `.agent-notes/T2g-
 * spot-label-goto.md`).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandGoto.java:56-61
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionGoto.java:52-58
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGoto.java:41-53
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:161
 */
export interface ActivityGoto {
  kind: 'goto';
  name: string;
  swimlane?: string;
}

// ---------------------------------------------------------------------------
// Composite node types
// ---------------------------------------------------------------------------

export interface ActivityElseIf {
  condition: string;
  label?: string;
  /**
   * ELSEIFIN -- the leading `(incoming)` decoration on `elseif`, e.g.
   * `(additional text) elseif (foo2) then (ok2)`. Drawn on the diamond's
   * OWN west side (`FtileDiamondInside2.withWest`), never on the
   * connecting arrow -- `dispatch-support.ts#RE_ELSEIF`'s own doc.
   * @see net/sourceforge/plantuml/activitydiagram3/command/CommandElseIf2.java:70-76,147-151
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:178-186
   */
  incomingLabel?: string;
  body: ActivityNode[];
}

export interface ActivityIf {
  kind: 'if';
  condition: string;
  thenLabel?: string;
  elseLabel?: string;
  thenBranch: ActivityNode[];
  elseBranch: ActivityNode[];
  /** Intermediate elseif clauses in order; may be empty. */
  elseIfBranches: ActivityElseIf[];
  swimlane?: string;
}

export interface ActivityWhile {
  kind: 'while';
  condition: string;
  /** Label on the entry edge (the "is" / "yes" path into the body). */
  yesLabel?: string;
  /** Label on the exit edge (the "is not" path). */
  exitLabel?: string;
  body: ActivityNode[];
  swimlane?: string;
  /**
   * `ActivityDiagram3#manageSpecialStopEndAfterEndWhile` (`:177-192`): a
   * bare `stop`/`end` immediately after this while's `endwhile`, when the
   * body contains no `break` anywhere (recursively through every nested
   * container -- `InstructionWhile.containsBreak()` -> `repeatList
   * .containsBreak()`, `InstructionList.java:70-75`'s own recursion into
   * every child instruction). Set by `node-dispatch.ts#parseNodes`, which
   * consumes that stop/end as this field INSTEAD OF pushing it as an
   * ordinary sibling (`InstructionWhile.setSpecial`, never `current()
   * .add(ins)`, `ActivityDiagram3.java:162-165,171-174`). Drawn via
   * `FtileWhile.java:513-552`'s `ConnectionOutSpecial`, which REPLACES the
   * ordinary `ConnectionOut` entirely (`:163-166`) -- this while's own
   * tile then reports `hasPointOut() === false` (`InstructionWhile.java:
   * 128-129`'s `FtileKilled` wrap), same as a ordinary `stop`/`kill`.
   */
  specialOut?: ActivityStop | ActivityEnd;
}

export interface ActivityRepeat {
  kind: 'repeat';
  /**
   * `repeat :label;` -- the inline action, absent for a bare `repeat`.
   * Never appears in {@link body}.
   * @see net/sourceforge/plantuml/activitydiagram3/CommandRepeat3.java:126
   *   -- the inline label is handed to `ActivityDiagram3#startRepeat`.
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionRepeat.java:51
   *   -- stored as `startLabel`, handed to `factory.repeat(…, startLabel,
   *   …)` (`:166-167`) as the ENTRY tile that replaces the entry diamond
   *   (`ftile/vcompact/FtileRepeat.java:77-80`).
   */
  entry?: ActivityAction;
  body: ActivityNode[];
  condition: string;
  /**
   * `InstructionRepeat.isLastOfTheParent()` (`InstructionRepeat.java:
   * 117-121,170`): `true` when this repeat is the LAST element of its own
   * parent list -- set by `node-dispatch.ts#parseNodes` once that list
   * finishes building (every such list, top-level or nested, is exactly
   * one `parseNodes` call, mirroring one upstream `InstructionList`).
   * Combined with an empty {@link condition} at tile-build time
   * (`tile-layout.ts#tileRepeat`) to select {@link
   * RepeatConditionEmpty} for diamond2 (`FtileRepeat.java:143-144`).
   */
  noOut?: boolean;
  /**
   * `is (…)` on `repeat while` -- the condition hexagon's east/north side
   * label, absent when not written or empty.
   * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:359-371
   *   -- `repeatWhile(label, yes, out, …)`.
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionRepeat.java:193-200
   *   -- `setTest` stores `yesTb`/`outTb`, drawn on the condition hexagon
   *   (`ftile/vcompact/FtileRepeat.java:150-151`).
   */
  yesLabel?: string;
  /** `not (…)` on `repeat while` -- the condition hexagon's south/west side
   * label. @see the {@link yesLabel} cites. */
  outLabel?: string;
  swimlane?: string;
  /**
   * The lane at `repeat while`, when it differs from {@link swimlane}.
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionRepeat.java:194-196
   *   -- `setTest` stores `swimlaneOut`, taken when `repeat while` is
   *   parsed (`ActivityDiagram3.java:367`).
   */
  swimlaneOut?: string;
}

export interface ActivityFork {
  kind: 'fork';
  branches: ActivityNode[][];
  swimlane?: string;
  /**
   * The lane current at the most recent `fork again` or at `end fork`,
   * when it differs from {@link swimlane}.
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionFork.java:138-141
   *   -- `forkAgain` re-reads `swimlaneOut` at each `fork again`.
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionFork.java:193-197
   *   -- `setStyle` re-reads `swimlaneOut` at `end fork`.
   */
  swimlaneOut?: string;
  /**
   * `ForkStyle.MERGE` (`fork ... end merge`) -- the branches converge into
   * an un-synchronized diamond instead of the default `ForkStyle.FORK`
   * synchronization bar. Omitted (not `'fork'`) for the default, mirroring
   * `InstructionFork`'s own default field.
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionFork.java:70
   *   -- `private ForkStyle style = ForkStyle.FORK;`.
   * @see net/sourceforge/plantuml/activitydiagram3/command/CommandForkEnd3.java:92-95,107-108
   *   -- `style.contains("merge") ? ForkStyle.MERGE : ForkStyle.FORK`. The
   *   regex's optional trailing `{LABEL}` is parsed but never reaches
   *   `ParallelBuilderMerge` (its constructor takes no label,
   *   `FtileFactoryDelegatorCreateParallel.java:60` vs `:62`) -- a merge
   *   join never carries a label upstream, so this port parses no label
   *   for `end merge` either (matching upstream's own silent drop).
   */
  style?: 'merge';
}

export interface ActivitySplit {
  kind: 'split';
  branches: ActivityNode[][];
  swimlane?: string;
  /**
   * The lane current at `end split`, when it differs from {@link swimlane}.
   * Unlike fork, split has no second capture point at `split again`
   * (`InstructionSplit.java:128-134` opens each further list with the
   * DEFAULT lane, never re-reading `swimlaneOut`).
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionSplit.java:136-141
   *   -- `endSplit` reads `swimlanes.getCurrentSwimlane()` once, at
   *   `end split`.
   */
  swimlaneOut?: string;
}

export interface ActivityNote {
  kind: 'note';
  text: string;
  position: 'left' | 'right';
  swimlane?: string;
}

/**
 * One `case (LABEL)` branch of an enclosing `switch`. `label` is omitted
 * for an unlabelled branch (`case ()`, upstream's empty-`TEST` arm --
 * `CommandCase.java:81-84`, `test.length() == 0`), never an empty string.
 */
export interface ActivitySwitchCase {
  label?: string;
  body: ActivityNode[];
}

/**
 * `switch (test) ... case (v1) ... case (v2) ... endswitch` (mission
 * ubrr-T10 M2): structurally the N-way branch-and-merge
 * `CommandSwitch`/`CommandCase`/`CommandEndSwitch` build together, one
 * `startSwitch`/`switchCase`/`endSwitch` sequence per `switch`.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandSwitch.java:60-70
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandCase.java:56-63
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandEndSwitch.java:58-63
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:129-131
 *   -- registration.
 */
export interface ActivitySwitch {
  kind: 'switch';
  condition: string;
  cases: ActivitySwitchCase[];
  swimlane?: string;
}

/**
 * `partition|package|rectangle|card|group "NAME" { ... }` (bracketed) or
 * the bracket-less/legacy `Group NAME ... End group` spelling (mission
 * ubrr-T10 M6): all five type keywords are ONE command upstream-side, one
 * `startGroup`/`closeGroup` pair, differing only in the drawn `USymbol`.
 * `hasBracket === false` is upstream's OWN deprecation path -- it still
 * builds the group, just with `diagram.addWarning(...)`
 * ("You should use a bracket ({) when defining your container '<type>'
 * <name>") -- rendering that banner is NOT reproduced here (see
 * `tile-layout.ts#tileGroup`'s own doc for the divergence).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandPartition3.java:64-172
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandCloseGroup3.java:56-63
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandCloseGroupLegacy3.java:57-73
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:110-113
 *   -- registration.
 */
export interface ActivityGroup {
  kind: 'group';
  groupType: 'partition' | 'package' | 'rectangle' | 'card' | 'group';
  title: string;
  hasBracket: boolean;
  body: ActivityNode[];
  swimlane?: string;
}

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

export type ActivityNode =
  | ActivityAction
  | ActivityStart
  | ActivityStop
  | ActivityEnd
  | ActivityKill
  | ActivityDetach
  | ActivityBreak
  | ActivityArrowLabel
  | ActivityBackward
  | ActivitySpot
  | ActivityLabel
  | ActivityGoto
  | ActivityIf
  | ActivityWhile
  | ActivityRepeat
  | ActivityFork
  | ActivitySplit
  | ActivityNote
  | ActivitySwitch
  | ActivityGroup;

// ---------------------------------------------------------------------------
// Root AST
// ---------------------------------------------------------------------------

export interface ActivityDiagramAST {
  /** Top-level sequence of activity nodes (may contain nested structures). */
  nodes: ActivityNode[];
  /** Ordered list of swimlane names as they appear in the source. */
  swimlanes: string[];
  /** O (add2 T3i): `|#color|name|`'s background, keyed by lane name --
   *  undefined/absent for a lane with no color segment (transparent, no
   *  rect drawn, `Swimlanes.java:332-340`'s own `back != null` guard).
   *  Optional so hand-authored AST literal fixtures compile unchanged. */
  swimlaneColors?: Record<string, string>;
  /**
   * title/caption/legend/header/footer/mainframe chrome (mission G0b).
   * Always populated by `parseActivity` (default `createAnnotations()`
   * when no annotation directive is present) -- optional in the type only
   * so the shared structural consumer type `{ annotations?: DiagramAnnotations
   * }` (T7) stays uniform across engines.
   */
  annotations?: DiagramAnnotations;
  /**
   * `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4),
   * populated by {@link matchSpriteCommand} at the SAME dispatch position
   * as {@link matchAnnotationCommand} (tried immediately after it, mirroring
   * upstream's `CommonCommands.addTitleCommands` then `addCommonCommands2`
   * registration order). Optional so hand-authored AST literal fixtures
   * compile unchanged; a real `parseActivity()` call always sets it via
   * `createSpriteRegistry()`.
   */
  sprites?: SpriteRegistry;
  /**
   * `!pragma NAME [VALUE]` (D12/T1p-b), populated by {@link tryPragma}
   * (`dispatch-common-commands.ts`) during `parseNodes` -- mirrors
   * `TitledDiagram#getPragma()`'s single per-diagram `Pragma` instance
   * (`skin/Pragma.java`). Optional so hand-authored AST literal fixtures
   * compile unchanged (read sites default to an empty `Pragma` when
   * absent -- `conditional-builder.ts#buildIf`); a real `parseActivity()`
   * call always sets it via `Pragma.createEmpty()`.
   */
  pragma?: Pragma;
}
