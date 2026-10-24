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

import { PragmaKey, pragmaKeyLazyFrom } from '../../core/skin/PragmaKey.js';
import type { Command } from './sequence-parse-helpers.js';
import { matchScaleCommand } from '../../core/scale-command.js';
import { RE_ASSUME_TRANSPARENT } from '../../core/assume-transparent.js';

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
 * plain `system.getPragma().define(name, value)` branch, whose only
 * representable effect on `SequenceDiagramAST` is `sequenceMessageSpan`
 * (`AbstractCommunicationTile.java:52-54`), stored as an option. `svgparser`
 * is consumed in `core/sprite-commands.ts#svgParserSelectorAt`, which replays
 * the `!pragma` lines before each sprite definition (upstream reads the
 * pragma at definition time, `CommandSpriteSvg.java:81-82`). Same "recognised,
 * no observable effect" precedent as `state/state-commands.ts`'s rule 3a.
 * @see command/CommandPragma.java:101-134
 */
export const pragmaCommand: Command = {
  pattern: /^!pragma\s+([A-Za-z_][A-Za-z_0-9]*)(?:\s+(.*))?$/,
  execute(state, match) {
    // The one pragma with a representable effect: `Pragma#isTrue` is
    // "true" or "on", case-insensitively (`Pragma.java:85-88`).
    if (pragmaKeyLazyFrom(match[1]!) !== PragmaKey.SEQUENCE_MESSAGE_SPAN) return;
    const value = match[2]?.toLowerCase();
    state.ast.options.sequenceMessageSpan = value === 'true' || value === 'on';
  },
};

/** `!assume transparent dark|light` — `CommandAssumeTransparent`, the next
 *  `addCommonCommands2` registration after `CommandPragma`
 *  (`CommonCommands.java:64-65`); a no-op upstream (see
 *  `core/assume-transparent.ts`). */
export const assumeTransparentCommand: Command = {
  pattern: RE_ASSUME_TRANSPARENT,
  execute() {
    /* ignored — CommandAssumeTransparent.java:74-81 */
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

/** `GENDER` -- `CommandHideShowByGender.java:75-77`, `%pLN_.` widened to its
 *  `\p{L}\p{N}_.` JS spelling. */
const GENDER = String.raw`(?:(?:class|object|interface|enum|annotation|dataclass|record|abstract|[\p{L}\p{N}_.]+|"[^"]+"|<<.*>>)\s+)*?`;

/** `hide|show [GENDER] stereotype(s)` — reached in sequence diagrams through
 *  `SequenceDiagramFactory:100` -> `CommonCommands#addCommonCommands1` ->
 *  `addCommonHides` (`CommonCommands.java:103-106`) ->
 *  `CommandHideShowByGender`. The regex's GENDER run
 *  (`CommandHideShowByGender.java:75-77`) is a lazy repeat of a type keyword,
 *  a name, a quoted name or `<<...>>`; the sequence arm IGNORES it and only
 *  applies the PORTION (`executeSequenceDiagram` `:163-166`: `diagram
 *  .hideOrShow(portion.asSet(), show)`). Sequence-scoped: the class engine
 *  carries its own `hide`/`show` directive (`class-command-directives.ts`);
 *  this module is imported by no other engine's dispatch.
 *
 *  Of the portions (`:79-81`, `getEntityPortion :286-304`) only `stereotype`
 *  is observable in a sequence diagram (`Participant.java:125-135`); the
 *  others are accepted and have no effect. T13 confirmed the jar's goldens
 *  both ways (`secida-27-jaco323` hides, `birocu-87-xubi808` shows). */
export const hideStereotypeCommand: Command = {
  pattern: new RegExp(
    String.raw`^(hide|show)\s+${GENDER}(?:empty\s+)?(members?|attributes?|fields?|methods?|circles?|circled?|(stereotypes?))$`,
    'iu',
  ),
  execute(state, match) {
    if (match[3] === undefined) return;
    state.ast.options.hideStereotype = match[1]!.toLowerCase() === 'hide';
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
