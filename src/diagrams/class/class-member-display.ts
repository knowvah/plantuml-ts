/**
 * class-member-display.ts — the physical-line splitter + plain-text
 * projection for classifier member rows. Split out of
 * `class-member-creole.ts` (A2s R2i) purely to keep that file under the
 * repo's 500-line cap while it grows the emoji/row-height seam — both
 * functions are pure moves, no behavior change (mirrors the existing
 * `class-member-rows.ts` split precedent).
 */
import type { MemberRenderAtom } from './class-member-creole.js';

/**
 * A2s F-B B5: `Display.getWithNewlines`' physical-line split, applied to one
 * member display string BEFORE any creole processing -- literal 2-char
 * `\n`/`\r`/`\l` escapes break the line (`\r`/`\l` alignment side effects
 * have no member-row sizing impact; SIMPLE_LINE rows draw left-aligned),
 * `\t` -> real tab, `\\` -> one backslash, other `\x` kept verbatim, raw
 * spans (`[[`..`]]`, `<math>`/`<latex>`) untouched. The gate is hardcoded
 * true (Pragma.java:95-97); the Jaws `BLOCK_E1_*` sentinel branches
 * (Display.java:316-341, preprocessor-internal chars that never reach this
 * AST) are not ported.
 * @see ~/git/plantuml/.../klimt/creole/Display.java:262-345 (getWithNewlines)
 */
export function splitMemberDisplayLines(s: string): readonly string[] {
  // #lizard forgives -- one-to-one port of getWithNewlines' escape dispatch.
  const result: string[] = [];
  let current = '';
  let rawMode = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    const sub = s.slice(i);
    // Display.java:273-277 -- raw spans suppress escape handling.
    if (sub.startsWith('<math>') || sub.startsWith('<latex>') || sub.startsWith('[[')) rawMode = true;
    else if (sub.startsWith('</math>') || sub.startsWith('</latex>') || sub.startsWith(']]')) rawMode = false;
    if (!rawMode && c === '\\' && i < s.length - 1) {
      // Display.java:288-313 -- legacyReplaceBackslashNByNewline branch.
      const c2 = s[i + 1]!;
      i++;
      if (c2 === 'n' || c2 === 'r' || c2 === 'l') {
        result.push(current); // Display.java:292-304 -- all three break.
        current = '';
      } else if (c2 === 't') {
        current += '\t'; // Display.java:305-306
      } else if (c2 === '\\') {
        current += c2; // Display.java:308-309
      } else {
        current += c + c2; // Display.java:310-312
      }
    } else {
      current += c;
    }
  }
  result.push(current); // Display.java:344
  return result;
}

/** G2 N65 item 35: plain-text rendering of one wrapped sub-line's own atoms
 *  (non-text atoms contribute nothing -- a member row's own `ClassifierGeo
 *  .rows[].text` field is UNCONSUMED by production rendering whenever
 *  `row.atoms` is set, `renderer-classifier-box.ts#renderRowText`'s own
 *  `row.atoms !== undefined` early branch; this exists only to keep that
 *  field non-empty/informative for a wrapped continuation row, matching the
 *  pre-existing single-row convention of storing the member's own display
 *  text there). */
export function atomsToPlainText(atoms: readonly MemberRenderAtom[]): string {
  return atoms.filter((a): a is Extract<MemberRenderAtom, { kind: 'text' }> => a.kind === 'text')
    .map((a) => a.text).join('');
}
