/**
 * Round away the sub-thousandth float noise this port's own unit conversion
 * introduces, so it cannot flip a truncating integer cast.
 *
 * Node dimensions reach the layout engine as an inches STRING at jar's own
 * 6-decimal precision (`svek-dot-emit.ts#inches`, mirrored by
 * `graph-layout-build.ts#addNodes` — the two MUST agree, because 6dp is what
 * upstream's graphviz actually lays out, and disagreeing changes spline
 * routing). That round trip is lossy: a 34px node is `0.472222in`, which is
 * 33.999984px coming back, so every stacked rank accumulates a ≤3.6e-5px
 * shortfall. A document that should end at exactly 336.0 arrives as
 * 335.99994, and `SvgGraphics#ensureVisible`'s `(int)(v) + 1` truncates to
 * 336 where jar gets 337.
 *
 * Jar runs the IDENTICAL layout — its graphviz reads the same `0.472222` —
 * but never sees the artifact, because it scrapes `dot -Tsvg`, whose
 * 2-decimal serialization absorbs it. We call the engine in-process and get
 * doubles.
 *
 * So this removes an artifact of OUR OWN making rather than matching a jar
 * number, and it is deliberately NOT the 2dp quantization of node/spline
 * geometry that the same finding rejects on measurement (that moves 3
 * fixtures, flips none to zero, and breaks 8 other oracle gates). Nothing
 * here moves a coordinate — only the integer boundary of a document extent.
 *
 * `EPSILON_DP` of 3 sits two orders above the worst accumulated artifact
 * (~1e-4) and one order below the 0.01 conformance band, so it absorbs the
 * noise without being able to reach any real difference.
 */
const EPSILON_DP = 3;
const EPSILON_SCALE = 10 ** EPSILON_DP;

export function absorbLayoutEpsilon(v: number): number {
  return Math.round(v * EPSILON_SCALE) / EPSILON_SCALE;
}
