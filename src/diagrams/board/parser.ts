import { createAnnotations, matchAnnotationCommand } from '../../core/annotations/index.js';
import { createSpriteRegistry, matchSpriteCommand } from '../../core/sprite-commands.js';
import { refuse } from '../../core/parse-refusal.js';
import type { BoardDiagramAST, BoardActivity, BoardNode } from './ast.js';
import type { UmlSource } from '../../core/block-extractor.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';

/** Counts a leading run of `+` characters (the node's nesting depth). */
function countLeadingPlus(t: string): number {
  let plusCount = 0;
  while (plusCount < t.length && t[plusCount] === '+') plusCount++;
  return plusCount;
}

/** Inserts one `+`-prefixed board node: a new root activity when
 *  `plusCount === 0`, otherwise a child of the deepest stack entry whose
 *  `stage` is less than `plusCount`. Mutates `activities`/`stack` in place. */
function insertBoardNode(
  activities: BoardActivity[],
  stack: BoardNode[],
  plusCount: number,
  label: string,
): void {
  if (plusCount === 0) {
    const root: BoardNode = { name: label, stage: 0, children: [] };
    activities.push({ name: label, root });
    stack.length = 0;
    stack.push(root);
    return;
  }
  if (stack.length === 0) return;
  const newNode: BoardNode = { name: label, stage: plusCount, children: [] };
  while (stack.length > 1 && stack[stack.length - 1]!.stage >= plusCount) {
    stack.pop();
  }
  stack[stack.length - 1]!.children.push(newNode);
  stack.push(newNode);
}

export function parseBoard(source: UmlSource): BoardDiagramAST | ParseRefusal {
  const activities: BoardActivity[] = [];
  const stack: BoardNode[] = [];
  const annotations = createAnnotations();
  const sprites = createSpriteRegistry();
  const lines = source.lines;

  for (let i = 0; i < lines.length; ) {
    const t = lines[i]!.trim();
    if (t === '') {
      i++;
      continue;
    }
    if (/^@startboard\s*$/i.test(t) || /^@endboard\s*$/i.test(t)) {
      i++;
      continue;
    }

    // title/caption/legend/header/footer/mainframe (mission G0b/T6): tried
    // BEFORE the `+`-prefix node grammar below, mirroring upstream
    // CommonCommands being registered first — board has no other "ignore"
    // mechanism, so without this every chrome directive would otherwise be
    // misread as a board activity/node label.
    const annotationMatch = matchAnnotationCommand(lines, i, annotations);
    if (annotationMatch !== null) {
      i += annotationMatch.consumed;
      continue;
    }

    // `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4): tried
    // immediately after the chrome matcher, mirroring upstream registering
    // `CommandFactorySprite` right after `addTitleCommands`.
    const spriteMatch = matchSpriteCommand(lines, i, sprites);
    if (spriteMatch !== null) {
      i += spriteMatch.consumed;
      continue;
    }

    const refusal = matchBoardPlusOrRefuse(t, i, activities, stack);
    if (refusal !== null) return refusal;
    i++;
  }

  return { activities, annotations, sprites };
}

/**
 * `CommandBoardPlus` (mission T9): matches `^([+]*)\s*([^%s].*)$` -- PLUS
 * then a LABEL that must start with a non-whitespace character. `t` is
 * already whole-line-trimmed by the caller, so the only way a non-blank line
 * fails this is a line of `+` characters with nothing after them (LABEL has
 * no non-whitespace character left to match). No other registered command
 * (title/skinparam/etc., tried first in upstream's `cmds` list) matches such
 * a line either, so this is a genuine "no candidate" fall-through, not a
 * narrowing of an existing branch.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/board/CommandBoardPlus.java:54-59
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemCommandFactory.java:169-175
 */
function matchBoardPlusOrRefuse(
  t: string,
  i: number,
  activities: BoardActivity[],
  stack: BoardNode[],
): ParseRefusal | null {
  const plusCount = countLeadingPlus(t);
  const label = t.slice(plusCount).trim();
  if (label === '') {
    return refuse('syntax', i, i, 'Syntax Error?');
  }
  insertBoardNode(activities, stack, plusCount, label);
  return null;
}
