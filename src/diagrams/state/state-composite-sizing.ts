/**
 * Sizing formulas for composite-state wrapping (mission A4/T4 — the
 * autonom/cluster split, mechanisms.md §1/§3). Split out of ./state-sizing.ts
 * to keep both files under the project's per-file size cap.
 *
 * @see ~/git/plantuml/.../svek/InnerStateAutonom.java (calculateDimensionSlow,
 *      drawU — MARGIN*2+2*MARGIN_LINE+marginForFields delta, title/attr/img
 *      vertical merge)
 * @see ~/git/plantuml/.../svek/ConcurrentStates.java (region image stacking)
 */

import type { Separator, State } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { splitStateDisplayLines } from './state-sizing.js';
// G1/G23 (mission state-declared-size-fix, D1): a composite's own title and
// attribute block go through the SAME creole seam the leaf sizer uses --
// `InnerStateAutonom.java:97` (`group.getDisplay().create(...)`) and
// `Entity.java:631` (`getStateDescription` -> `display.create(...)`), both
// `Display.create` (`Display.java:614`, `LineBreakStrategy.NONE`), so NO
// `wrapWidth` here, unlike the leaf `create8` path.
import { stateCreoleBlock, stateCreoleOpts } from './state-sizing-creole.js';

interface Dim {
  width: number;
  height: number;
}

/** IEntityImage.MARGIN / MARGIN_LINE (both 5) — same constants used by the
 *  flat EntityImageState formula (state-sizing.ts's STATE_MARGIN_DELTA). */
import {
  ENTITY_IMAGE_MARGIN as MARGIN,
  ENTITY_IMAGE_MARGIN_LINE as MARGIN_LINE,
} from '../../core/svek/IEntityImage.js';

function measureLines(lines: readonly string[], font: FontSpec, measurer: StringMeasurer, theme: Theme): Dim {
  if (lines.length === 0) return { width: 0, height: 0 };
  const block = stateCreoleBlock(lines, font, measurer, stateCreoleOpts(theme, false));
  return { width: block.width, height: block.height };
}

/** The vertical offset at which an InnerStateAutonom's wrapped child image is
 *  drawn inside the outer box — needed to shift the child pass's own
 *  (locally-rooted) geometry into the parent's absolute coordinate space.
 *  Mirrors `InnerStateAutonom.getSpaceYforURL` (no URL case: `url==null`
 *  skips the URL gap, matching every state-diagram fixture in the corpus). */
export interface AutonomOffset {
  x: number;
  y: number;
}

export interface AutonomWrapper {
  width: number;
  height: number;
  /** Offset at which the wrapped child pass's own geometry is drawn,
   *  relative to the wrapper box's own top-left corner. */
  childOffset: AutonomOffset;
}

/**
 * InnerStateAutonom.calculateDimensionSlow + getSpaceYforURL: title (state's
 * own display name) stacked above an optional description/body, stacked
 * above the wrapped child pass's own total image dimensions — delta by
 * MARGIN*2+2*MARGIN_LINE(+MARGIN if a body is present), applied to both axes.
 */
export function measureAutonomWrapper(
  state: State,
  childImg: Dim,
  theme: Theme,
  measurer: StringMeasurer,
): AutonomWrapper {
  const font: FontSpec = { family: theme.fontFamily, size: theme.fontSize };
  const text = measureLines(splitStateDisplayLines(state.display), font, measurer, theme);
  const bodyLines = (state.description ?? []).flatMap(splitStateDisplayLines);
  const attr = measureLines(bodyLines, font, measurer, theme);
  const marginForFields = attr.height > 0 ? MARGIN : 0;

  const nameHeight = MARGIN + text.height + MARGIN_LINE;
  const descriptionHeight = attr.height + marginForFields;

  const mergedWidth = Math.max(text.width, attr.width, childImg.width);
  const mergedHeight = text.height + attr.height + childImg.height;
  const delta = MARGIN * 2 + 2 * MARGIN_LINE + marginForFields;

  return {
    width: mergedWidth + delta,
    height: mergedHeight + delta,
    childOffset: { x: MARGIN, y: nameHeight + descriptionHeight + MARGIN_LINE },
  };
  // #lizard forgives -- faithful port of InnerStateAutonom's dimension
  // formula; CCN 2, length driven by the doc comment + straight-line math.
}

/** ConcurrentStates: per-region images stacked either top-to-bottom (`--`,
 *  HORIZONTAL separator LINE — width is the widest region, height is the
 *  PLAIN SUM of region heights) or side-by-side (`||`, VERTICAL separator
 *  LINE — width is the PLAIN SUM of region widths, height is the widest
 *  region) — the exact axis swap `Separator.add` performs, keyed by which
 *  separator character produced the regions (G11, mission
 *  state-declared-size-fix T10, jar-verified `fimivu-15-vogi904`: this port
 *  used to apply the HORIZONTAL/`--` formula unconditionally, so a `||`
 *  composite came out identically sized to an equivalent `--` one instead
 *  of swapped). ZERO extra gap between regions on either axis.
 *
 *  Mission G4 S4 (mechanism 7's own concurrent-composite companion,
 *  diagnosed while chasing `nelupe-49-xova546`'s regression): direct read of
 *  `ConcurrentStates.java` (not guessed) replaces the S1-era placeholder
 *  (`RANK_SEP`'s own 60pt floor, explicitly flagged "no exact upstream pixel
 *  constant traced" in that iteration's own doc comment, now known WRONG).
 *  `Separator.add(orig, other)` (HORIZONTAL/`--` case) is
 *  `new XDimension2D(max(orig.w,other.w), orig.h+other.h)` — a bare sum, NO
 *  gap term at all; `Separator.drawSeparator` draws the dashed rule WITHIN
 *  the already-summed dimension (it never reserves extra layout space, only
 *  paints a line at the junction `drawU`'s own `ug.apply(separator.move
 *  (dim))` already placed the cursor at). `CONCURRENT_SEPARATOR_GAP` is kept
 *  (not deleted) as the single, obviously-named knob for this — set to `0`,
 *  matching the real formula exactly, rather than removed, so a future
 *  reader immediately sees WHERE the (absent) gap term would go and WHY it's
 *  zero, rather than wondering if the term was silently dropped by mistake.
 *  Jar-verified via the full `oracle/goldens/state/size-backlog.json`
 *  DOT-parity ratchet (268/268 passing, up from a 21-regression starting
 *  point once mechanism 7's own autonom-composite fix made region content
 *  sizing accurate enough to expose this SEPARATE gap-formula bug) — see
 *  plans/g4-state-svg/ledger.md S4 for the full diagnosis.
 * @see ~/git/plantuml/.../svek/ConcurrentStates.java
 */
const CONCURRENT_SEPARATOR_GAP = 0;

/** `Separator.add` (`ConcurrentStates.java:79-84`): VERTICAL (`||`) sums
 *  WIDTH and maxes HEIGHT; HORIZONTAL (`--`) maxes WIDTH and sums HEIGHT --
 *  the exact axis swap G11 restores (state-declared-size-fix T10). */
export function stackConcurrentRegions(regionDims: readonly Dim[], separator: Separator): Dim {
  if (regionDims.length === 0) return { width: 0, height: 0 };
  const gap = CONCURRENT_SEPARATOR_GAP * (regionDims.length - 1);
  if (separator === 'VERTICAL') {
    return {
      width: regionDims.reduce((sum, d) => sum + d.width, 0) + gap,
      height: Math.max(...regionDims.map((d) => d.height)),
    };
  }
  return {
    width: Math.max(...regionDims.map((d) => d.width)),
    height: regionDims.reduce((sum, d) => sum + d.height, 0) + gap,
  };
}
