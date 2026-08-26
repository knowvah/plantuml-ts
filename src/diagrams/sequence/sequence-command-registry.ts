/**
 * THE sequence command list — one registration-ordered array, tried
 * top-to-bottom with first match winning, mirroring
 * `PSystemCommandFactory#getCandidate` (`:225-246`), which walks the single
 * `cmds` list `SequenceDiagramFactory#initCommandsList` (`:99-155`) built and
 * returns a `Step` on the first `Command` that says OK.
 *
 * This replaces the `COMMANDS` + `COMMANDS_2` pair, which `parser.ts`
 * documented as "a file-size accommodation, not a second dispatch tier" —
 * i.e. a structural divergence from that single list. Each command now lives
 * in a per-family module named for the upstream command class or factory it
 * ports, and this file holds the order and nothing else, so a task adding a
 * command adds it to its family module and inserts ONE line here.
 *
 * **The order is FROZEN.** It is this port's historical dispatch order, which
 * is NOT `initCommandsList`'s order: the trailing comment on each entry gives
 * the upstream registration line, and those line numbers descend at thirteen
 * seams. `tests/unit/sequence/command-registry-order.test.ts` asserts both the
 * exact order and that exact set of descents, so neither drifts silently.
 *
 * Two of those descents are load-bearing and must not be "fixed" by sorting
 * this list into upstream's order:
 *
 *  - `endNoteCommand` precedes `endCommand`. Upstream registers the note
 *    multi-line closers at `:134-137`, AFTER `CommandGrouping` (`:126`), but
 *    that is safe there because upstream's multi-line note command consumes
 *    its own closing line inside `isMultilineCommandOk`
 *    (`PSystemCommandFactory.java:236-243`) rather than dispatching it. Here
 *    the closer is an ordinary table entry, and `endCommand`'s pattern
 *    (`/^end(?:\s+.+)?\s*$/i`) matches `end note` too — so putting `endCommand`
 *    first would pop a frame instead of closing the note.
 *  - `arrowCommand` precedes `decoratedArrowCommand`, and both map to the one
 *    upstream `CommandArrow` (`:111`). Upstream registers `CommandArrow`
 *    BEFORE `CommandExoArrowLeft`/`CommandExoArrowRight` (`:113-114`);
 *    `CommandArrow` declines `[-> Bob` because its PART1 group is absent
 *    entirely, which is why the exo commands get that line. Any exo command
 *    added later belongs after both arrow entries.
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:99-155
 * @see ~/git/plantuml/.../command/PSystemCommandFactory.java:225-246
 */

import type { Command } from './sequence-parse-helpers.js';
import { arrowCommand, decoratedArrowCommand, returnCommand } from './command-arrow.js';
import {
  autonumberCommand,
  autonumberIncrementCommand,
  autonumberResumeCommand,
  autonumberStopCommand,
} from './command-autonumber.js';
import {
  hideStereotypeCommand,
  hideUnlinkedCommand,
  pragmaCommand,
  rotateCommand,
  scaleCommand,
  skinParamMessageAlignCommand,
} from './command-common.js';
import {
  boxEndCommand,
  boxStartCommand,
  elseCommand,
  endCommand,
  groupingCommand,
} from './command-grouping.js';
import {
  activateCommand,
  deactivateCommand,
  deactivateShortCommand,
  destroyCommand,
} from './command-lifeline.js';
import {
  autoactivateCommand,
  bareDelayCommand,
  delayWithTextCommand,
  dividerCommand,
  hideEmptyDescriptionCommand,
  hideFootboxCommand,
  refOverCommand,
  refOverMultilineCommand,
  setSeparatorCommand,
  spaceCommand,
} from './command-misc.js';
import {
  endNoteCommand,
  noteAcrossCommand,
  noteCommand,
  noteOnArrowCommand,
  styledNoteCommand,
} from './command-note-factory.js';
import { minwidthOrPagingCommand, newpageCommand } from './command-page.js';
import { createCommand, participantCommand } from './command-participant.js';

/**
 * A registered sequence command: the `{ pattern, execute }` pair
 * `PSystemCommandFactory#getCandidate` tests and then runs. Alias of the
 * shared `Command` type bound to this engine's `ParseState`.
 */
export type SequenceCommand = Command;

/**
 * The frozen registration order. The trailing comment on each line is the
 * `SequenceDiagramFactory.java` line that registers this command's upstream
 * counterpart, or `none` where the port has a rule upstream does not.
 */
export const SEQUENCE_COMMANDS: readonly SequenceCommand[] = [
  skinParamMessageAlignCommand, // :100 CommandSkinParam (addCommonCommands2)
  hideFootboxCommand, //           :151 CommandFootbox
  boxStartCommand, //              :124 CommandBoxStart
  boxEndCommand, //                :125 CommandBoxEnd
  autonumberCommand, //            :146 CommandAutonumber
  autonumberStopCommand, //        :147 CommandAutonumberStop
  autonumberResumeCommand, //      :148 CommandAutonumberResume
  autonumberIncrementCommand, //   :149 CommandAutonumberIncrement
  participantCommand, //           :106 CommandParticipantA..A4
  activateCommand, //              :103 CommandActivate (TYPE=activate)
  deactivateCommand, //            :103 CommandActivate (TYPE=deactivate)
  destroyCommand, //               :103 CommandActivate (TYPE=destroy)
  deactivateShortCommand, //       :104 CommandDeactivateShort
  noteCommand, //                  :117 FactorySequenceNoteCommand.createSingleLine
  endNoteCommand, //               :134 FactorySequenceNoteCommand.createMultiLine
  groupingCommand, //              :126 CommandGrouping (TYPE=loop|alt|opt|...)
  elseCommand, //                  :126 CommandGrouping (TYPE=else|also)
  endCommand, //                   :126 CommandGrouping (TYPE=end)
  dividerCommand, //               :142 CommandDivider
  delayWithTextCommand, //         :152 CommandDelay
  bareDelayCommand, //             :152 CommandDelay
  spaceCommand, //                 :143 CommandHSpace
  returnCommand, //                :129 CommandReturn
  arrowCommand, //                 :111 CommandArrow
  pragmaCommand, //                :100 CommandPragma (addCommonCommands2)
  rotateCommand, //                :100 CommandRotate (addCommonCommands2)
  hideEmptyDescriptionCommand, //  :100 CommandHideEmptyDescription (addCommonHides)
  hideStereotypeCommand, //        :100 CommandHideShowByGender (addCommonHides)
  hideUnlinkedCommand, //          :101 CommandHideUnlinked
  autoactivateCommand, //          :150 CommandAutoactivate
  scaleCommand, //                 :100 CommandScale.. (addCommonScaleCommands)
  newpageCommand, //               :139 CommandNewpage
  minwidthOrPagingCommand, //      :140 CommandIgnoreNewpage / :141 CommandAutoNewpage
  setSeparatorCommand, //          none — `set separator` is registered on the
  //                                      class/description factories only
  //                                      (classdiagram/command/
  //                                      CommandNamespaceSeparator.java:50-61)
  createCommand, //                :106 CommandParticipantA (getRegexType CREATE)
  refOverCommand, //               :144 CommandReferenceOverSeveral
  refOverMultilineCommand, //      :145 CommandReferenceMultilinesOverSeveral
  noteOnArrowCommand, //           :132 FactorySequenceNoteOnArrowCommand
  styledNoteCommand, //            :117 FactorySequenceNoteCommand.createSingleLine
  noteAcrossCommand, //            :122 FactorySequenceNoteAcrossCommand
  decoratedArrowCommand, //        :111 CommandArrow (reverse/decorated forms)
];
