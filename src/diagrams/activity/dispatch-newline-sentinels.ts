/**
 * `%n()`/`%newline()` -> a real line break in an activity action label
 * (mission `activity-divergence-drive-3` T2a, family PCTN). Split into
 * its own file purely to keep `dispatch-support.ts`/`node-dispatch.ts`
 * under the project's 500-line cap -- a one-function module, not a
 * structural seam.
 */

import {
  BLOCK_E1_NEWLINE,
  BLOCK_E1_NEWLINE_LEFT_ALIGN,
  BLOCK_E1_NEWLINE_RIGHT_ALIGN,
} from '../../core/tim/builtin/jaws-constants.js';

const RE_NEWLINE_SENTINEL = new RegExp(
  `[${BLOCK_E1_NEWLINE}${BLOCK_E1_NEWLINE_LEFT_ALIGN}${BLOCK_E1_NEWLINE_RIGHT_ALIGN}]`,
  'g',
);

/**
 * `%n()`/`%newline()` (`NewlineShort.java`/`Newline.java`, both lowercase
 * spellings) already expand to {@link BLOCK_E1_NEWLINE} at the TIM/
 * preprocessor stage (`preprocessor.ts`'s own doc: "decoding the sentinel
 * into a label line break is the Jaws/Creole display layer's job, which
 * this port does not have yet") -- an activity action label is exactly
 * that FOLLOW-UP. `Display#getWithNewlines`'s own `_LEFT_ALIGN`/
 * `_RIGHT_ALIGN` sentinel variants (`\r`/`\l` natural-alignment escapes)
 * decode to the same plain line break here -- the alignment HINT itself
 * is the same out-of-scope gap `if-dispatch.ts#unescapeLabelNewlines`'s
 * own doc already names for branch labels, not re-guessed into existence
 * here.
 * @see net/sourceforge/plantuml/klimt/creole/Display.java:315-339
 */
export function decodeNewlineSentinels(text: string): string {
  return text.replace(RE_NEWLINE_SENTINEL, '\n');
}
