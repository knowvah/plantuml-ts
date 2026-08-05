/**
 * CommandCreoleMonospaced — the creole `""text""` monospace run.
 *
 * Upstream: klimt/creole/command/CommandCreoleMonospaced.java — starter
 * `""`, pattern `^(""(.*?)"")` (lazy inner, closing pair required),
 * `executeAndAdvance` swaps the stripe's actual font family to
 * `stripe.getSkinParam().getMonospacedFamily()` (java:81), recurses into
 * the inner capture, then restores the saved configuration (java:79-83).
 * `getMonospacedFamily` resolves `skinparam defaultMonospacedFontName`
 * with `Parser.MONOSPACED` (`"monospaced"`) as the default
 * (skin/SkinParam.java:1068-1070); this port has no skinparam thread into
 * the creole engine (same as every other command here — `Command.ts`'s own
 * doc comment on the dropped `ISkinSimple` parameter), so the default
 * constant is used directly. The `monospaced` -> `monospace` SVG
 * font-family mapping is a DRAW-time concern (SvgGraphics.java:720-722),
 * not this command's.
 *
 * Sizing (A2s R2a, curupe-50-kibu120): the deterministic width table is
 * family-agnostic (`StringBounderFromWidthTable` ignores the family;
 * `WidthTableMeasurer` mirrors that), so conformant widths come purely
 * from CONSUMING the `""` delimiters — jar-probe verified
 * (`""Test""` -> one `font-family="monospace"` run, textLength 27.2125 at
 * 14pt, identical to the sans table's `Test`).
 */
import type { Command } from './Command.js';
import { MONOSPACED } from '../Parser.js';

/** Upstream: `CommandCreoleMonospaced.create()` — `^(""(.*?)"")`. */
export function createMonospacedCommand(): Command {
  const re = /^(""(.*?)"")/;
  return {
    starters: ['""'],
    matchingSize(line, pos) {
      const m = re.exec(line.slice(pos));
      return m === null ? 0 : m[1]!.length;
    },
    executeAndAdvance(line, pos, stripe) {
      const m = re.exec(line.slice(pos));
      if (m === null) return 0;
      const fc1 = stripe.getActualFontConfiguration();
      stripe.setActualFontConfiguration({ ...fc1, family: MONOSPACED });
      stripe.analyzeAndAddInline(m[2]!);
      stripe.setActualFontConfiguration(fc1);
      return m[1]!.length;
    },
  };
}
