/**
 * Translates the `linetype` semantic enum on `DotInputGraph` into the DOT
 * attribute pairs upstream emits for it.
 *
 * Upstream reads `skinParam.getDotSplines()` (a `DotSplines` enum) and
 * branches on it:
 *
 * ```java
 * final DotSplines dotSplines = skinParam.getDotSplines();
 * if (dotSplines == DotSplines.POLYLINE) {
 *     sb.append("splines=polyline;");
 *     SvekUtils.println(sb);
 * } else if (dotSplines == DotSplines.ORTHO) {
 *     sb.append("splines=ortho;");
 *     sb.append("forcelabels=true;");
 *     SvekUtils.println(sb);
 * }
 * ```
 *
 * The ORTHO arm appends both strings before the single `println` call,
 * which is why the jar's cached DOT carries `splines=ortho;forcelabels=true;`
 * on one line — callers that join these pairs into a single line reproduce
 * that. The POLYLINE arm appends only `splines=polyline;`; this asymmetry is
 * upstream behavior, preserved exactly rather than "tidied" (D4).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java:161-169
 */
export function dotSplinesAttrs(
  linetype: 'ortho' | 'polyline' | undefined,
): ReadonlyArray<readonly [string, string]> {
  if (linetype === 'polyline') {
    return [['splines', 'polyline']];
  }
  if (linetype === 'ortho') {
    return [
      ['splines', 'ortho'],
      ['forcelabels', 'true'],
    ];
  }
  return [];
}
