/**
 * The `CommonCommands.addCommonCommands1(cmds)` block — the VERY FIRST thing
 * `SequenceDiagramFactory#initCommandsList` registers (`:100`), ahead of every
 * sequence-specific command — plus `CommandHideUnlinked` (`:101`), the single
 * command registered between it and the activate/deactivate block.
 *
 * `addCommonCommands1` itself fans out to `addTitleCommands`,
 * `addCommonCommands2` (pragma / skinparam / rotate / minwidth / sprites /
 * style), `addCommonScaleCommands` and `addCommonHides`
 * (`command/CommonCommands.java:54-58`). The title and sprite halves of that
 * block are matched EARLIER than this table, by `parser.ts`'s
 * `dispatchAnnotationOrSprite`; what lives here is the remainder.
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:100-101
 * @see ~/git/plantuml/.../command/CommonCommands.java:54-106
 */

import type { Command } from './sequence-parse-helpers.js';
import { matchScaleCommand } from '../../core/scale-command.js';

// 1. skinparam sequenceMessageAlign
export const skinParamMessageAlignCommand: Command = {
  pattern: /^skinparam\s+sequenceMessageAlign\s+(left|center|right)\s*$/i,
  execute(state, match) {
    const align = match[1]?.toLowerCase() as 'left' | 'center' | 'right';
    state.ast.options.messageAlign = align;
  },
};

/**
 * `!pragma NAME [VALUE]` — `CommandPragma`, registered on EVERY factory via
 * `CommonCommands.addCommonCommands2` -> `addCommonCommands1`
 * (`SequenceDiagramFactory.java:100`). Recognised as a no-op: of
 * `executeArg`'s three special-cased names (`svgsize`, `graphviz_dot`,
 * `layout`), none is reachable from this port's sequence corpus bucket
 * (183 `teoz true`, 31 `svgparser sax`, 1 `showDeprecation true` — none of
 * `svgsize`/`graphviz_dot`/`layout`), so every instance falls through to the
 * plain `system.getPragma().define(name, value)` branch, which has no
 * representable effect on `SequenceDiagramAST`. Same "recognised, no
 * observable effect" precedent as `state/state-commands.ts`'s rule 3a.
 * @see command/CommandPragma.java:101-134
 */
export const pragmaCommand: Command = {
  pattern: /^!pragma\s+[A-Za-z_][A-Za-z_0-9]*(?:\s+.*)?$/,
  execute() {
    /* ignored — see doc comment above */
  },
};

/** `rotate` — `CommandRotate`: accepted for backward compatibility, no
 *  effect. Upstream's own `explainArg` says so explicitly.
 *  @see command/CommandRotate.java:56-71 */
export const rotateCommand: Command = {
  pattern: /^rotate\s*$/i,
  execute() {
    /* ignored — upstream's executeArg is a bare CommandExecutionResult.ok() */
  },
};

/** `hide stereotype` — reached in sequence diagrams through
 *  `SequenceDiagramFactory:100` -> `CommonCommands#addCommonCommands1` ->
 *  `addCommonHides` (`CommonCommands.java:103-106`) ->
 *  `CommandHideShowByGender`, whose `stereotype` arm is `:195`. T13 recorded
 *  this as an unmodelled no-op after grepping only `sequencediagram/command/`
 *  and the CommonCommands ADD list, and flagged it for re-checking: the
 *  registration is one level down, in `addCommonHides`. Now honoured —
 *  suppresses the participant stereotype run, which the jar's own goldens
 *  confirm both ways (`secida-27-jaco323` carries `hide stereotype` and shows
 *  bare names; `birocu-87-xubi808` has none and shows `«APIGateway»`). */
export const hideStereotypeCommand: Command = {
  pattern: /^hide\s+stereotype\s*$/i,
  execute(state) {
    state.ast.options.hideStereotype = true;
  },
};

/** `hide unlinked` / `show unlinked` / `hide @unlinked` — `CommandHideUnlinked`.
 *  Stored as an option; applied post-parse by `applyHideUnlinked`
 *  (`parser.ts`) so every event has already been visited (an unlinked
 *  participant must see the WHOLE event list, not a prefix of it).
 *  @see sequencediagram/command/CommandHideUnlinked.java:56-61 */
export const hideUnlinkedCommand: Command = {
  pattern: /^(hide|show)\s+@?unlinked\s*$/i,
  execute(state, match) {
    state.ast.options.hideUnlinked = match[1]!.toLowerCase() === 'hide';
  },
};

/** `scale ...` (6 forms) — shared `scale-command.ts` (`CommonCommands
 *  #addCommonScaleCommands`, registered for every `TitledDiagram` factory
 *  including sequence). Stored as a `ScaleSpec`; resolved to a factor and
 *  applied as an SVG transform at `renderSequence` (see `ast.ts`'s
 *  `SequenceDiagramAST.scale` doc comment for why the multiplier is applied
 *  in THIS engine's own renderer rather than in `src/core/`). */
export const scaleCommand: Command = {
  pattern: /^scale\s/i,
  execute(state, match) {
    const spec = matchScaleCommand(match.input);
    if (spec !== undefined) state.ast.scale = spec;
  },
};

