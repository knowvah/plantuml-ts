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
 * step. `tile-layout-backward.ts#extractBackward` pulls it out of the
 * body and builds it as its own tile (`GtileWhile`/`GtileRepeat`'s own
 * `backward` field); the stereogroup/box-style the label would carry on
 * that tile are out of scope, matching `GtileRepeat`'s own class doc
 * ("`backward:` bodies are out of scope ... filed as `activity-loop-
 * backward`"). BACKLBL (add2 T3i): {@link incoming}/{@link outgoing} ARE
 * now parsed and drawn -- the arrow-COLOR half of each decoration
 * (`INCOMING_COLOR`/`OUTCOMING_COLOR`) stays out of scope, same "parsed
 * not drawn" bar every other base-form field here already sits at.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandBackward3.java:73-170
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:135
 *   -- registration.
 */
export interface ActivityBackward {
  kind: 'backward';
  label: string;
  swimlane?: string;
  /**
   * BACKLBL (add2 T3i): the leading `(incoming)` decoration, drawn on
   * `ConnectionBackBackward1` (body-exit -> this backward box).
   * @see net/sourceforge/plantuml/activitydiagram3/command/CommandBackward3.java:64-69
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:146,158-161,341-364
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:170-178,440-459
   */
  incoming?: string;
  /**
   * BACKLBL (add2 T3i): the trailing `(outgoing)` decoration, drawn on
   * `ConnectionBackBackward2` (this backward box -> the condition/entry).
   * Single-line `backward:label;(outgoing)` only -- the multiline closer
   * reuses the generic `RE_ACTION_CLOSE` shape, which has no trailing-
   * paren group (shared with plain multiline actions, out of this
   * family's scope).
   * @see net/sourceforge/plantuml/activitydiagram3/command/CommandBackward3.java:81-86
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:158-161,386-407
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:182-187,513-535
   */
  outgoing?: string;
  /**
   * BACKNOTE (`activity-divergence-drive-3` T2a): `InstructionRepeat
   * .addNote` (`:218-226`) routes a note to {@link notes} ONLY while
   * `backward` is already set -- i.e. a note parsed IMMEDIATELY after
   * this `backward:` line, before any other body node. A note BEFORE
   * `backward:` belongs to the regular body flow instead (the
   * pre-existing generic `tileNote` pairing, `tile-layout-structural.ts`)
   * and never reaches this field. Drawn beside this backward activity
   * via the same `GtileNoteOpale` wrap `tileNote` already builds for a
   * simple leaf -- never a flow sibling.
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionRepeat.java:177-185,218-226
   */
  notes?: ActivityNote[];
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
  /**
   * Notes the IF ITSELF owns (never a branch's own flow content), in
   * `WithNote#addNote`'s own insertion order: a LEADING note in the
   * then/elseif/else branch (`InstructionIf.addNote`'s `current.isEmpty()`
   * arm -- `if-dispatch.ts#tryIf`'s own extraction), then a note parsed
   * immediately after this `if`'s `endif` while this if is still the
   * enclosing list's `getLast()` (the `endifCalled` arm --
   * `pushParsedNode`'s `kind==='note'`-onto-`kind==='if'` merge,
   * `list-backward-dispatch.ts`). Drawn beside diamond1 by whichever
   * builder `conditional-builder.ts#buildIf` picks -- never a flow
   * sibling. Omitted (not `[]`) when the if owns no such note.
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionIf.java:222-227
   * @see net/sourceforge/plantuml/activitydiagram3/WithNote.java:56-59
   */
  notes?: ActivityNote[];
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
  /**
   * add4-T2g: the while's OWN notes (`WithNote#addNote`, appended): every
   * note parsed while `repeatList` is still empty (a leading run in the
   * body, or after `endwhile` of an empty body). `createFtile` wraps the
   * whole while with them, `FtileWithNoteOpale.create(tmp, notes, false,
   * CENTER)` (no link).
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionWhile.java:126-127,162-167
   */
  notes?: ActivityNote[];
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
   * The lane current at the most recent `fork again` or at `end fork`, when it differs from {@link swimlane}.
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
  /**
   * N (add2 T3i): `end fork {label}`'s own join-bar label, braces kept
   * VERBATIM (upstream never strips them -- `zafoxu-20-xofe568`'s own
   * jar SVG draws the literal text `{or}`). Never set when
   * {@link style} is `'merge'` (see that field's own doc).
   * @see net/sourceforge/plantuml/activitydiagram3/command/CommandForkEnd3.java:72-74
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionFork.java:193-196
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderFork.java:114-115
   */
  label?: string;
}

export interface ActivitySplit {
  kind: 'split';
  branches: ActivityNode[][];
  swimlane?: string;
  /**
   * The lane current at `end split`, when it differs from {@link swimlane}. Unlike fork, split
   * has no second capture point at `split again` (`InstructionSplit.java:128-134` opens each
   * further list with the DEFAULT lane, never re-reading `swimlaneOut`).
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionSplit.java:136-141
   *   -- `endSplit` reads `swimlanes.getCurrentSwimlane()` once, at `end split`.
   */
  swimlaneOut?: string;
}

export interface ActivityNote {
  kind: 'note';
  text: string;
  position: 'left' | 'right';
  swimlane?: string;
  /** add4-T1c: `#color` (BACK, `#` kept) / `floating` (NoteType.FLOATING_NOTE); absent = omitted. @see CommandNote3.java:121-123 */
  color?: string;
  floating?: true;
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
 * `switch (test) ... case (v1) ... endswitch` (ubrr-T10 M2): one
 * `startSwitch`/`switchCase`/`endSwitch` sequence. `notes` (add4-T1f): a
 * note while `current == null || current.isEmpty()` is the switch's own
 * (`InstructionSwitch.java:186-189`), drawn TOP-aligned (`:125`).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandSwitch.java:60-70
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandCase.java:56-63
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandEndSwitch.java:58-63
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:129-131
 */
export interface ActivitySwitch {
  kind: 'switch';
  condition: string;
  cases: ActivitySwitchCase[];
  swimlane?: string;
  notes?: ActivityNote[];
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
  /** `BACK1` (before the name) else `BACK2` (after it), `#` kept; absent =
   *  the style's own `BackGroundColor`.
   * @see net/sourceforge/plantuml/activitydiagram3/command/CommandPartition3.java:145-147,163-165 */
  backColor?: string;
  /** `<<...>>` (`STEREO`), chevrons kept -- `Stereotype.build(stereo)`.
   * @see net/sourceforge/plantuml/activitydiagram3/command/CommandPartition3.java:151-152 */
  stereotype?: string;
  body: ActivityNode[];
  swimlane?: string;
  /**
   * GROUPNOTE: `InstructionGroup.addNote` self-captures only while
   * `list.isEmpty()` (a run of leading notes each overwrites the last --
   * a single field, not a collection). `createFtile` wraps the body
   * (before the frame) with it via `FtileWithNotes`, never
   * `FtileWithNoteOpale`, even for this one note.
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionGroup.java:104-105,125-131
   */
  note?: ActivityNote;
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

// --- Root AST ---------------------------------------------------------------

export interface ActivityDiagramAST {
  /** Top-level sequence of activity nodes (may contain nested structures). */
  nodes: ActivityNode[];
  /** Ordered list of swimlane names as they appear in the source. */
  swimlanes: string[];
  /** O (add2 T3i): `|#color|name|`'s background, keyed by lane name; absent
   *  = transparent (`Swimlanes.java:332-340`'s `back != null`). Optional. */
  swimlaneColors?: Record<string, string>;
  /** `|name|LABEL`'s display, keyed by lane name (`Swimlanes.java:163-164`). */
  swimlaneDisplays?: Record<string, string>;
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
  /** `CommandSkinParam#executeArg` warnings (java:92-99), ahead of `pragma`'s: `activity-warnings.ts`. */
  warnings?: ReturnType<Pragma['getWarnings']>;
}
