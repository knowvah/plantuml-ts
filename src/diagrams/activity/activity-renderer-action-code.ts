/**
 * `<code>...</code>` action-box bodies: monospace, measured like `tiles/
 * gtile-action.ts`'s own `monoCharWidth` sizing, not the proportional
 * table `ActivityTextOpts` reads elsewhere. Split out of `renderAction`
 * (`activity-renderer-shapes.ts`, add3-T2b pass 2) purely to make room
 * for that file's own KLIMT-FLOOR fix under its 500-line cap -- a
 * pure-move extraction, same pattern as `activity-renderer-bars.ts`/
 * `activity-renderer-terminals.ts`/`activity-renderer-signal-shapes.ts`.
 */
import type { Theme } from '../../core/theme.js';
import { drawActivityText } from './activity-renderer-text.js';
import { measureMonoLineWidth, activityTextLineX, type ActivityTextOpts } from './activity-text-placement.js';
import { activityFontColor } from './activity-text-style.js';
import { centeredFirstBaselineY } from './activity-renderer-shapes.js';

const CODE_BLOCK_RE = /^<code>([\s\S]*?)<\/code>$/i;

/** `null` when `label` is not a `<code>` block -- shared by the caller
 *  (which needs the line COUNT for the baseline Y before it has a box to
 *  draw into) and {@link renderActionCodeBlock} below, so the regex has
 *  exactly one owner. */
export function codeBlockLines(label: string): readonly string[] | null {
  const codeMatch = CODE_BLOCK_RE.exec(label.trim());
  if (codeMatch === null) return null;
  return codeMatch[1]!.replace(/^\n/, '').replace(/\n$/, '').split('\n');
}

/** One call site's worth of already-resolved geometry -- bundled so the
 *  function below stays within this project's 5-param ceiling. `floored`
 *  is `gtile-action.ts#floorActionLineHeight(actionSize)` -- the KLIMT-
 *  FLOOR advance the caller already needed for its OWN plain-text branch,
 *  reused here so this helper does not need a 7th param. */
export interface ActionCodeBlockArgs {
  readonly label: string;
  readonly theme: Theme;
  readonly cx: number;
  readonly cy: number;
  readonly floored: number;
  readonly actionSize: number;
  readonly opts: ActivityTextOpts;
}

/** `null` when `label` is not a `<code>` block -- the caller falls
 *  through to its own plain-text rendering in that case. */
export function renderActionCodeBlock(args: ActionCodeBlockArgs): string | null {
  const { label, theme, cx, cy, floored, actionSize, opts } = args;
  const codeLines = codeBlockLines(label);
  if (codeLines === null) return null;
  const lineY = centeredFirstBaselineY(cy, floored, codeLines.length);
  const codeFill = activityFontColor(theme, 'activity');
  return codeLines
    .map((ln, i) => {
      const w = measureMonoLineWidth(actionSize, ln);
      const x = activityTextLineX(theme, cx, w, opts);
      return drawActivityText(x, lineY + floored * i, ln, {
        fontFamily: 'monospace',
        fontSize: actionSize,
        fill: codeFill,
        floorCoordinated: true,
      });
    })
    .join('');
}
