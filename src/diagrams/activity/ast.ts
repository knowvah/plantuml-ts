/**
 * AST type definitions for PlantUML activity diagrams (new syntax).
 */

import type { DiagramAnnotations } from '../../core/annotations/index.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';

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

// ---------------------------------------------------------------------------
// Composite node types
// ---------------------------------------------------------------------------

export interface ActivityElseIf {
  condition: string;
  label?: string;
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
}
