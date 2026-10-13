/**
 * `PSystemDonors` — the `donors` page. This file holds ONLY `getCols` for now
 * (ufp T0c, decisions.md D3): the openiconic, archimate and donors listings all
 * split their lines into columns with it. The rest of the class lands with T1g.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java
 */

/**
 * Splits `lines` into at most `nbCol` columns of `maxLine` lines each, where
 * `maxLine = (lines.size() + (nbCol - 1) + reserved) / nbCol` (Java `int`
 * division: every operand is a non-negative `int`, so `Math.trunc`).
 *
 * Upstream wraps each column in `GraphicStrings.createBlackOnWhite(current)`
 * and returns `List<TextBlock>`; this port returns the columns' lines (the
 * ufp `batch-0/overview.md` interface contract), and the caller wraps them.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:146-154
 */
export function getCols(lines: readonly string[], nbCol: number, reserved: number): string[][] {
  const result: string[][] = [];
  const maxLine = Math.trunc((lines.length + (nbCol - 1) + reserved) / nbCol);
  for (let i = 0; i < lines.length; i += maxLine) {
    result.push(lines.slice(i, Math.min(lines.length, i + maxLine)));
  }
  return result;
}
