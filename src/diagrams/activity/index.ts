/**
 * Activity diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 */

import type { SyncPlugin } from '../../core/dispatcher.js';
import type { ActivityDiagramAST } from './ast.js';
import type { ActivityGeometry } from './layout/tile-layout.js';
import { parseActivity } from './parser.js';
import { layoutActivity } from './layout/tile-layout.js';
import { renderActivity } from './renderer.js';

// ---------------------------------------------------------------------------
// Accepts heuristics
// ---------------------------------------------------------------------------

/**
 * Keywords that appear in activity diagrams but not other diagram types.
 *
 * The swimlane patterns below were previously one bare `/^\|.+\|/` -- "starts
 * with a pipe, ends with a pipe" -- which also matched sequence's `|||`
 * spacer directive, sequence's `||0||` parameterised delay, and creole table
 * rows inside a `legend` block (`|= |= Type |`, `| Item1 | 1 | 3 |`). All
 * nine SEQUENCE fixtures that tripped it are pinned in
 * `tests/unit/activity/accepts.test.ts`. Narrowed to mirror upstream's own
 * grammar instead of guessing from those fixtures:
 *
 * - `CommandSwimlane.java:60-67` (the `|name|` form) -- concatenates
 *   `^\|`, an optional `(#color)\|` prefix, `([^|]+)` for the name (1+
 *   non-pipe chars, so `||` back-to-back cannot satisfy it), a literal `\|`,
 *   then an optional `([^|]+)?` label and `$`. Exactly two literal pipes
 *   (three with a color) are ever consumed; `|||`, `||0||` and any line
 *   carrying a third, unconsumed pipe (the creole rows) fail to reach `$`.
 * - `CommandSwimlane2.java:60-75` (the `swimlane NAME [as LABEL]` keyword
 *   form) -- `swimlane`, one-or-more spaces, an optional color, the name,
 *   then an optional ` as LABEL`. Case-insensitive globally
 *   (`Pattern2.java:114`), matching this file's other keyword patterns.
 *
 * A bare `end` is deliberately NOT here, even though `end` IS a real activity
 * node (`ast.ts`'s `kind: 'end'`, the crossed circle). It is not EVIDENCE of
 * an activity diagram, because it is also the terminator of every sequence
 * grouping construct -- `alt`/`else`, `opt`, `loop`, `par`, `group`. Since
 * `activityPlugin` is registered before `sequencePlugin` (`src/index.ts`),
 * matching on it made the activity engine claim any sequence diagram
 * containing a group, parse away everything it did not recognise, and emit a
 * lone crossed-circle end node: a 52x52 SVG with zero text, no error card and
 * no throw. Every real activity diagram carries a stronger signal (`start`,
 * `:action;`, `if (`, a swimlane), so this costs no coverage -- an activity
 * diagram whose ONLY recognisable line is `end` is degenerate.
 *
 * Two fixtures under `tests/corpus/activity/` (`jetigu-21-zaje860`,
 * `nuzise-60-temi305`) are in fact SEQUENCE diagrams misfiled by this very
 * pattern -- they are `group ... end` with `Test <- Test` messages.
 *
 * @see tests/unit/diagrams/sequence-group-routing.test.ts
 */
const ACTIVITY_ACCEPTS_PATTERNS: readonly RegExp[] = [
  /^start\s*$/i,
  /^stop\s*$/i,
  /^:\s*.+;\s*$/,              // :action;
  /^:[^:;]+$/,                 // :multi-line-opener — no second colon (excludes :actor:), no semicolon
  /^if\s*\(/i,
  /^while\s*\(/i,
  /^repeat\s*$/i,
  /^fork\s*$/i,
  /^split\s*$/i,
  // |swimlane| or |#color|swimlane|label — CommandSwimlane.java:60-67
  /^\|(?:#\w+[-\\|/]?\w+\|)?[^|]+\|[^|]*$/,
  // swimlane NAME [as LABEL] — CommandSwimlane2.java:60-75
  /^swimlane\s+(?:#\w+[-\\|/]?\w+\s*)?[^|]+?(?:\s+as\s+[^|]+)?$/i,
  /^fork\s+again\s*$/i,
  /^split\s+again\s*$/i,
];

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const activityPlugin: SyncPlugin<ActivityDiagramAST, ActivityGeometry> = {
  type: 'activity',

  accepts(lines: readonly string[]): boolean {
    return lines.slice(0, 30).some((l) =>
      ACTIVITY_ACCEPTS_PATTERNS.some((p) => p.test(l.trim())),
    );
  },

  parse(block) {
    return parseActivity(block);
  },

  layoutSync(ast, theme, measurer) {
    return layoutActivity(ast, theme, measurer);
  },

  render(geo, theme) {
    return renderActivity(geo, theme);
  },
};
