# cdd-close-b8 — batch 8 close (class-divergence-drive)

Written 2026-09-23. Survey 521/104/98 → 528/110/85; census 523 → 530;
ratchet 523 → 530 (7 pins); DOT 711/712. Measured on a tree that already
holds batch 9's first three merges (T31 r1, T32, T33) — see journal row 213
for the per-task attribution.

## Observation: "scale at serialization" means every emitted numeric, including literals no geometry field carries
- **Finding**: the geometry scaler (T29 round 1) left every render-time
  literal unscaled — border stroke 0.5, badge radius 11, round corner 5,
  arrowhead radii, note stroke, dash arrays, folder-tab margins. Three
  rounds (T29 r2, T30's findings, B8FU) were needed to reach the jar's
  `SvgGraphics#format` reach. The sequence engine's `ScaledTheme.scaleK`
  pattern was the right vehicle; the audit that found the rest was a
  literal grep of emitted attributes, not the fixture list.
- **Confidence**: High (corine/jiramo/koxoco/fuxoju/bavoxa byte-exact).

## Observation: dimension-dependent scale forms expose a pre-existing layout gap
- **Finding**: `scale max N width|height` and `scale N width` compute
  `k = target / unscaledDimension`; a ~1 px difference in our unscaled
  canvas (nadaba: 70 vs the jar's implied 69.0) changes `k` itself and
  every number with it. cagace/nadaba/kujiji are therefore layout
  residuals, not scale residuals; the pure-factor forms are exact.
- **Confidence**: High (measured); the layout gap's own cause is undiagnosed.

## Observation: json/yaml/hcl discard `skinparam dpi` upstream as well
- **Finding**: `jsondiagram/StyleExtractor.java:53-97` drops any generic
  `skinparam` line, so `getDpi()` is always 96 there; oracle-confirmed on
  `json/kicati-76-guvi771` (`skinparam dpi 600`, `font-size="14"`). A
  faithful port leaves those engines unwired — a report's "wire every
  engine" must be checked against the jar per engine (T30 row 182).
- **Confidence**: High.

## Observation: the survey lacked the include store the census had
- **Finding**: `!include <bundle/...>` class fixtures surveyed as the
  include-guard error page and read like a dispatch bug (T32's brief
  built a whole hypothesis on it). Any tool that calls `renderSync` on
  corpus sources needs `tests/helpers/fixture-include-store.ts`; the
  next survey of every other type will show its stdlib fixtures moving.
- **Confidence**: High (row 212).
