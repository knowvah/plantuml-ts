/**
 * `ClusterHeader`'s title-table sizing for a class/object package cluster --
 * split out of ./class-dot-graph.ts (T4, namespace-cluster-box mission,
 * 500-line file-cap compliance; pure move, no behavior change from the
 * split itself, mirroring state-composite-header.ts's identical prior
 * split off state-composite-cluster.ts).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java
 */

import type { Theme } from '../../core/theme.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { computeTitleTableHeight } from '../../core/cluster-title-table.js';

/** `ClusterHeader`'s title font for a class/object package cluster --
 *  `getStyle()` resolves the `package.title` style signature
 *  (`plantuml.skin`'s `package { title { FontStyle bold } }`), the SAME
 *  `TextBlock` `Cluster.java:368/432/439` draws for the visible folder-tab
 *  title -- i.e. this is not a second, independent font choice, it is the
 *  one `class-namespace-shape.ts#titleFont` already established for that
 *  render path. Duplicated rather than exported (this is the DOT-title-
 *  table's only OTHER call site) per this project's own "small enough to
 *  duplicate beats widening a module's public surface for one extra caller"
 *  precedent (state-composite-header.ts's `measureLines` doc comment). */
function namespaceTitleFont(theme: Theme): FontSpec {
  const size = theme.colors.elements?.package?.fontSize ?? theme.fontSize;
  return { family: theme.fontFamily, size, weight: 'bold' };
}

/**
 * `ClusterHeader`'s title-table dims for a class/object package cluster:
 * `dimLabel.getWidth()`/`getHeight()` (`ClusterHeader.java:78-90`) with the
 * stereo term forced to 0 (ast.ts's own `Namespace.stereotype` doc comment:
 * "cluster-title stereotype display is not wired -- out of A8 scope") and
 * the attribute term forced to 0 (`g.getStateDescription()` -- a
 * package/namespace entity never carries state-description lines) -- a
 * class package's cluster title is always its bare display text, one line
 * (matching `class-namespace-shape.ts#getHTitle`/`getWTitle`'s identical
 * single-line assumption for the same text). `dimLabel.getWidth()` is the
 * RAW text width with NO margin (unlike `getWTitle`'s +6px folder-tab
 * margin) -- `Math.max(titleWidth, 0, 0)` reduces to `titleWidth`.
 *
 * Verified against `cidepu-54-bemo048`'s cached oracle (`test-results/
 * dot-cache/class/cidepu-54-bemo048/svek-1.dot`): "pack" at the default
 * 14pt bold measures 29.575px (`WidthTableMeasurer`); the LAYOUT builder's
 * own `Math.floor` (graph-layout-build.ts:366, NOT pre-rounded here) ->
 * 29, matching `WIDTH="29"` exactly. `computeTitleTableHeight(1, 0, 0, 14)
 * = (0+1)*14 - 5 = 9`, matching `HEIGHT="9"` exactly.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:73-96
 */
export function namespaceTitleTableDims(
  display: string,
  theme: Theme,
  measurer: StringMeasurer,
): { width: number; height: number } {
  const font = namespaceTitleFont(theme);
  const { width } = measurer.measure(display, font);
  return { width, height: computeTitleTableHeight(1, 0, 0, font.size) };
}
