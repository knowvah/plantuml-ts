/**
 * `isKnownColorToken` — split out of `command-arrow.ts` to stay under the
 * 500-line file cap; `command-arrow.ts`'s `applyStyle` is the only caller.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSet.java:78-120
 */

import { parseSimpleColor } from '../../core/klimt/color/HColorSet.js';

/** The `transparent`/`background`/`automatic` keywords
 *  (`HColorSet.java:82-86`). */
function isSimpleColorKeyword(s: string): boolean {
  return /^(?:transparent|background|automatic)$/iu.test(s);
}

/** `?light:dark[:transparent]` — the ternary scheme branch
 *  (`HColorSet.java:95-107`), each half a plain colour. */
function isConditionalColorToken(s: string): boolean {
  if (!s.startsWith('?')) return false;
  const parts = s.slice(1).split(':');
  if (parts.length !== 2 && parts.length !== 3) return false;
  return parts.every((p) => parseSimpleColor(p) !== undefined);
}

/** `color1<sep>color2` — the gradient-separator scan (`HColorSet.java:109-
 *  117`): the first `-`/`\`/`|`/`/` split where BOTH halves are plain
 *  colours. */
function isGradientColorToken(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== '-' && c !== '\\' && c !== '|' && c !== '/') continue;
    if (parseSimpleColor(s.slice(0, i)) !== undefined && parseSimpleColor(s.slice(i + 1)) !== undefined) return true;
  }
  return false;
}

/**
 * `HColorSet#parseColor` (`klimt/color/HColorSet.java:78-120`), reduced to
 * the boolean question `applyStyle`'s else-branch actually needs: does
 * `HColorSet.instance().getColor(s)` throw `NoSuchColorException`
 * (`CommandArrow.java:501`)? No `HColor` is ever built here — this port's
 * `ArrowConfiguration` still has no colour field (see `applyStyle`'s own
 * doc comment on the COLOUR fallback, `command-arrow.ts`) — only whether
 * `s` is SOME upstream-recognised colour shape, which decides whether the
 * token (and therefore the whole line) refuses. The four checks are
 * upstream's own cascade order, minus the "leading `#` stripped once" step
 * every one of them shares (done here, up front, exactly as `parseColor`
 * does it).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSet.java:78-120
 */
export function isKnownColorToken(sIn: string): boolean {
  const s = sIn.startsWith('#') ? sIn.slice(1) : sIn;
  return (
    isSimpleColorKeyword(s) ||
    parseSimpleColor(s) !== undefined ||
    isConditionalColorToken(s) ||
    isGradientColorToken(s)
  );
}
