/**
 * The registration-order guard for `SEQUENCE_COMMANDS`.
 *
 * Upstream dispatches sequence commands from ONE list, built by
 * `SequenceDiagramFactory#initCommandsList` (`:99-155`) and walked by
 * `PSystemCommandFactory#getCandidate` (`:225-246`), first match winning.
 * This port's list is that list's counterpart, but NOT in that list's order:
 * it is the port's historical dispatch order, frozen. These tests hold both
 * facts in place — the exact order, and the exact set of places where it
 * departs from `initCommandsList` — so neither can drift silently, and so a
 * task adding a command has to state which it is doing.
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:99-155
 */

import { describe, expect, it } from 'vitest';
import {
  SEQUENCE_COMMANDS,
  type SequenceCommand,
} from '../../../src/diagrams/sequence/sequence-command-registry.js';
import {
  arrowCommand,
  decoratedArrowCommand,
  returnCommand,
} from '../../../src/diagrams/sequence/command-arrow.js';
import {
  autonumberCommand,
  autonumberIncrementCommand,
  autonumberResumeCommand,
  autonumberStopCommand,
} from '../../../src/diagrams/sequence/command-autonumber.js';
import {
  hideStereotypeCommand,
  hideUnlinkedCommand,
  pragmaCommand,
  rotateCommand,
  scaleCommand,
  skinParamMessageAlignCommand,
} from '../../../src/diagrams/sequence/command-common.js';
import {
  boxEndCommand,
  boxStartCommand,
  elseCommand,
  endCommand,
  groupingCommand,
} from '../../../src/diagrams/sequence/command-grouping.js';
import {
  activateCommand,
  deactivateCommand,
  deactivateShortCommand,
  destroyCommand,
} from '../../../src/diagrams/sequence/command-lifeline.js';
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
} from '../../../src/diagrams/sequence/command-misc.js';
import {
  endNoteCommand,
  noteAcrossCommand,
  noteCommand,
  noteOnArrowCommand,
  styledNoteCommand,
} from '../../../src/diagrams/sequence/command-note-factory.js';
import {
  minwidthOrPagingCommand,
  newpageCommand,
} from '../../../src/diagrams/sequence/command-page.js';
import {
  createCommand,
  participantCommand,
} from '../../../src/diagrams/sequence/command-participant.js';

/**
 * One registry entry: the command itself, the name it is dispatched under,
 * and the `SequenceDiagramFactory.java` line that registers its upstream
 * counterpart (`null` where the port has a rule upstream does not register
 * for sequence diagrams at all).
 */
interface RegistryEntry {
  readonly name: string;
  readonly command: SequenceCommand;
  readonly upstreamLine: number | null;
}

/** The frozen order, with each entry's `initCommandsList` registration line. */
const EXPECTED: readonly RegistryEntry[] = [
  { name: 'skinParamMessageAlignCommand', command: skinParamMessageAlignCommand, upstreamLine: 100 },
  { name: 'hideFootboxCommand', command: hideFootboxCommand, upstreamLine: 151 },
  { name: 'boxStartCommand', command: boxStartCommand, upstreamLine: 124 },
  { name: 'boxEndCommand', command: boxEndCommand, upstreamLine: 125 },
  { name: 'autonumberCommand', command: autonumberCommand, upstreamLine: 146 },
  { name: 'autonumberStopCommand', command: autonumberStopCommand, upstreamLine: 147 },
  { name: 'autonumberResumeCommand', command: autonumberResumeCommand, upstreamLine: 148 },
  { name: 'autonumberIncrementCommand', command: autonumberIncrementCommand, upstreamLine: 149 },
  { name: 'participantCommand', command: participantCommand, upstreamLine: 106 },
  { name: 'activateCommand', command: activateCommand, upstreamLine: 103 },
  { name: 'deactivateCommand', command: deactivateCommand, upstreamLine: 103 },
  { name: 'destroyCommand', command: destroyCommand, upstreamLine: 103 },
  { name: 'deactivateShortCommand', command: deactivateShortCommand, upstreamLine: 104 },
  { name: 'noteCommand', command: noteCommand, upstreamLine: 117 },
  { name: 'endNoteCommand', command: endNoteCommand, upstreamLine: 134 },
  { name: 'groupingCommand', command: groupingCommand, upstreamLine: 126 },
  { name: 'elseCommand', command: elseCommand, upstreamLine: 126 },
  { name: 'endCommand', command: endCommand, upstreamLine: 126 },
  { name: 'dividerCommand', command: dividerCommand, upstreamLine: 142 },
  { name: 'delayWithTextCommand', command: delayWithTextCommand, upstreamLine: 152 },
  { name: 'bareDelayCommand', command: bareDelayCommand, upstreamLine: 152 },
  { name: 'spaceCommand', command: spaceCommand, upstreamLine: 143 },
  { name: 'returnCommand', command: returnCommand, upstreamLine: 129 },
  { name: 'arrowCommand', command: arrowCommand, upstreamLine: 111 },
  { name: 'pragmaCommand', command: pragmaCommand, upstreamLine: 100 },
  { name: 'rotateCommand', command: rotateCommand, upstreamLine: 100 },
  {
    name: 'hideEmptyDescriptionCommand',
    command: hideEmptyDescriptionCommand,
    upstreamLine: 100,
  },
  { name: 'hideStereotypeCommand', command: hideStereotypeCommand, upstreamLine: 100 },
  { name: 'hideUnlinkedCommand', command: hideUnlinkedCommand, upstreamLine: 101 },
  { name: 'autoactivateCommand', command: autoactivateCommand, upstreamLine: 150 },
  { name: 'scaleCommand', command: scaleCommand, upstreamLine: 100 },
  { name: 'newpageCommand', command: newpageCommand, upstreamLine: 139 },
  { name: 'minwidthOrPagingCommand', command: minwidthOrPagingCommand, upstreamLine: 140 },
  { name: 'setSeparatorCommand', command: setSeparatorCommand, upstreamLine: null },
  { name: 'createCommand', command: createCommand, upstreamLine: 106 },
  { name: 'refOverCommand', command: refOverCommand, upstreamLine: 144 },
  { name: 'refOverMultilineCommand', command: refOverMultilineCommand, upstreamLine: 145 },
  { name: 'noteOnArrowCommand', command: noteOnArrowCommand, upstreamLine: 132 },
  { name: 'styledNoteCommand', command: styledNoteCommand, upstreamLine: 117 },
  { name: 'noteAcrossCommand', command: noteAcrossCommand, upstreamLine: 122 },
  { name: 'decoratedArrowCommand', command: decoratedArrowCommand, upstreamLine: 111 },
];

/**
 * The seams where the port's order runs BACKWARDS against `initCommandsList`
 * — each pair is (earlier entry, later entry) whose upstream registration
 * lines descend. Adding a command that introduces a new descent fails this
 * test: either it belongs at a position that keeps the list flat, or the
 * descent is deliberate and gets recorded here with its reason.
 *
 * Two of them are load-bearing and must not be sorted away:
 *  - `endNoteCommand` -> `endCommand`: `endCommand`'s pattern also matches
 *    `end note`, so upstream's order (grouping at `:126` before the note
 *    multi-line closers at `:134-137`) would pop a frame instead of closing
 *    the note. Upstream is safe at `:126` only because its multi-line note
 *    command eats its own closer inside `isMultilineCommandOk`
 *    (`PSystemCommandFactory.java:236-243`) rather than dispatching it.
 *  - `arrowCommand` -> `pragmaCommand` and the tail's note entries: the two
 *    arrow rules split ONE upstream `CommandArrow` (`:111`), and every
 *    `COMMANDS_2`-era rule was added after them.
 */
const KNOWN_DESCENTS: readonly (readonly [string, string])[] = [
  ['hideFootboxCommand', 'boxStartCommand'],
  ['autonumberIncrementCommand', 'participantCommand'],
  ['participantCommand', 'activateCommand'],
  ['endNoteCommand', 'groupingCommand'],
  ['bareDelayCommand', 'spaceCommand'],
  ['spaceCommand', 'returnCommand'],
  ['returnCommand', 'arrowCommand'],
  ['arrowCommand', 'pragmaCommand'],
  ['autoactivateCommand', 'scaleCommand'],
  ['minwidthOrPagingCommand', 'createCommand'],
  ['refOverMultilineCommand', 'noteOnArrowCommand'],
  ['noteOnArrowCommand', 'styledNoteCommand'],
  ['noteAcrossCommand', 'decoratedArrowCommand'],
];

/** Adjacent pairs whose upstream registration line goes DOWN, skipping the
 *  entries that have no upstream counterpart to compare against. */
function measureDescents(
  entries: readonly RegistryEntry[],
): readonly (readonly [string, string])[] {
  const known = entries.filter((e) => e.upstreamLine !== null);
  const descents: (readonly [string, string])[] = [];
  for (let i = 1; i < known.length; i++) {
    const prev = known[i - 1]!;
    const next = known[i]!;
    if (prev.upstreamLine! > next.upstreamLine!) descents.push([prev.name, next.name]);
  }
  return descents;
}

describe('sequence command registry — frozen registration order', () => {
  it('dispatches exactly the expected commands, in the expected order', () => {
    expect(SEQUENCE_COMMANDS.map((c) => EXPECTED.find((e) => e.command === c)?.name)).toEqual(
      EXPECTED.map((e) => e.name),
    );
  });

  it('holds 41 commands — one array, not two tiers', () => {
    expect(SEQUENCE_COMMANDS).toHaveLength(41);
    expect(new Set(SEQUENCE_COMMANDS).size).toBe(41);
  });

  it('cites only lines inside initCommandsList (99-155) upstream', () => {
    const cited = EXPECTED.map((e) => e.upstreamLine).filter((l): l is number => l !== null);
    expect(cited).toHaveLength(40);
    expect(cited.filter((l) => l < 99 || l > 155)).toEqual([]);
  });

  it('departs from initCommandsList order at exactly the recorded seams', () => {
    expect(measureDescents(EXPECTED)).toEqual(KNOWN_DESCENTS);
  });

  it('keeps endNoteCommand ahead of endCommand, which also matches "end note"', () => {
    const iEndNote = SEQUENCE_COMMANDS.indexOf(endNoteCommand);
    const iEnd = SEQUENCE_COMMANDS.indexOf(endCommand);
    expect(iEndNote).toBeGreaterThanOrEqual(0);
    expect(iEndNote).toBeLessThan(iEnd);
    expect(endCommand.pattern.test('end note')).toBe(true);
  });

  it('keeps CommandArrow ahead of every later-registered rule that shares :111', () => {
    // `CommandArrow` (`:111`) is registered BEFORE `CommandExoArrowLeft`/
    // `CommandExoArrowRight` (`:113-114`) and declines `[-> Bob` because its
    // PART1 group is absent entirely — which is why the exo commands get that
    // line. Neither exo command is ported yet; when one lands it belongs
    // after both arrow entries, and this assertion is where that is checked.
    expect(SEQUENCE_COMMANDS.indexOf(arrowCommand)).toBeLessThan(
      SEQUENCE_COMMANDS.indexOf(decoratedArrowCommand),
    );
    expect(arrowCommand.pattern.test('[-> Bob')).toBe(false);
    expect(decoratedArrowCommand.pattern.test('[-> Bob')).toBe(false);
  });

  it('measureDescents reports a descent only when the upstream line drops', () => {
    const flat: readonly RegistryEntry[] = [
      { name: 'a', command: arrowCommand, upstreamLine: 100 },
      { name: 'b', command: endCommand, upstreamLine: 126 },
    ];
    const dropping: readonly RegistryEntry[] = [
      { name: 'a', command: arrowCommand, upstreamLine: 126 },
      { name: 'unpinned', command: setSeparatorCommand, upstreamLine: null },
      { name: 'b', command: endCommand, upstreamLine: 100 },
    ];
    expect(measureDescents(flat)).toEqual([]);
    expect(measureDescents(dropping)).toEqual([['a', 'b']]);
  });
});
