import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import type { HColor } from '../../core/abel/Colors.js';
import { NoSuchColorException } from '../../core/klimt/color/NoSuchColorException.js';
import { Display } from '../../core/klimt/creole/Display.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import { StringLocated } from '../../core/tim/StringLocated.js';
import { fromDesc } from './IdeaShape.js';
import type { MindMapDiagram } from './MindMapDiagram.js';

/**
 * `CommandMindMapOrgmodeMultiline` — the `**[#color][_]:first line ...
 * last line;[ <<stereotype>>]` block form. Unlike single-line org-mode,
 * `TYPE` has NO leading-whitespace allowance (`[*#]+`, not `[ \t]*[*#]+`):
 * depth is `type.length() - 1` directly, never through `getSmartLevel`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/CommandMindMapOrgmodeMultiline.java:59-132
 */
export const ORGMODE_MULTILINE_START_RE = /^([*#]+)(?:\[(#\w+)\])?(_)?:(.*)$/i;

/** `CommandMindMapOrgmodeMultiline.END` — checked against each line's
 *  TRIMMED text (`Trim.BOTH`) as the block accumulates.
 * @see CommandMindMapOrgmodeMultiline.java:61-62 */
export const ORGMODE_MULTILINE_END_RE = /^(.*);\s*(<<(.+)>>)?$/i;

export interface OrgmodeMultilineBlock {
  readonly displayLines: readonly string[];
  /** The whole `<<label>>` token (brackets included), or `undefined`. */
  readonly stereotypeToken: string | undefined;
  /** Index of the last line consumed (the terminator line, or the start
   *  line itself for a one-line block). */
  readonly endIndex: number;
}

/**
 * Scans forward from `startIndex` for {@link ORGMODE_MULTILINE_END_RE},
 * checking the start line's own DATA capture first (a one-line block is
 * valid: `**: text;`). Returns `undefined` when no terminator is found
 * before the source ends — the block's own "Syntax Error?" case (upstream:
 * `PSystemCommandFactory#isMultilineCommandOk` returns `null`).
 * @see CommandMindMapOrgmodeMultiline.java:107-116 (`removeStartingAndEnding`/`overrideLastLine`)
 */
export function collectOrgmodeMultilineBlock(
  lines: readonly string[],
  startIndex: number,
  startMatch: RegExpExecArray,
): OrgmodeMultilineBlock | undefined {
  const displayLines: string[] = [];
  const firstLine = (startMatch[4] ?? '').trim();
  const firstEnd = ORGMODE_MULTILINE_END_RE.exec(firstLine);
  if (firstEnd !== null) {
    displayLines.push(firstEnd[1] ?? '');
    return { displayLines, stereotypeToken: firstEnd[2], endIndex: startIndex };
  }
  displayLines.push(firstLine);

  for (let i = startIndex + 1; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    const endMatch = ORGMODE_MULTILINE_END_RE.exec(trimmed);
    if (endMatch !== null) {
      displayLines.push(endMatch[1] ?? '');
      return { displayLines, stereotypeToken: endMatch[2], endIndex: i };
    }
    displayLines.push(trimmed);
  }
  return undefined;
}

/** @see CommandMindMapOrgmodeMultiline.java:106-130 */
export function applyMindMapOrgmodeMultiline(
  diagram: MindMapDiagram,
  startMatch: RegExpExecArray,
  block: OrgmodeMultilineBlock,
): CommandExecutionResult {
  const type = startMatch[1]!;
  const colorToken = startMatch[2];
  let backColor: HColor | undefined;
  try {
    if (colorToken !== undefined) backColor = diagram.getSkinParam().getIHtmlColorSet().getColor(colorToken);
  } catch (e) {
    // The command's own `catch (NoSuchColorException e) { return badColor(); }` (CommandMultilines2.java:117-121).
    if (e instanceof NoSuchColorException) return CommandExecutionResult.badColor();
    throw e;
  }

  const label = Display.createFoo(block.displayLines.map((line) => new StringLocated(line, undefined)));
  const stereotype = block.stereotypeToken === undefined ? undefined : Stereotype.build(block.stereotypeToken);

  return diagram.addIdea({ backColor, label, shape: fromDesc(startMatch[3]), stereotype }, type.length - 1);
}
