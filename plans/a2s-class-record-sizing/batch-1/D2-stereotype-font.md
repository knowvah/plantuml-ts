# D2 — Diagnose stereotype and element-font width residuals

## Context

Same mission context as D1 (`batch-1/D1-bare-class-width.md` §Context, or
`plans/a2s-class-record-sizing/README.md`): TypeScript port of PlantUML,
jar svek DOT is the size oracle, ratchet =
`npx tsx scripts/measure-class-size-deltas.ts`. You are a DIAGNOSIS task:
find the MECHANISM; do not edit `src/`.

## Task

Diagnose the mechanism(s) behind (slug lists:
`plans/a2s-class-record-sizing/batch-1/clusters.md`):

- **0.064182 in = 4.6211 px — 11 fixtures** — forensics found ALL sampled
  fixtures carry `<<stereotype>>` markup (plus skinparam/style blocks).
- **0.040579 in = 2.9217 px — 11 fixtures** — qualifier links, skinparam
  (dpi/package) mixes.
- The **element-font bucket (32 fixtures)** — the classifier labels these
  as per-element font divergence (e.g. 0.499348×7 also appears here). The
  bucket label is a HYPOTHESIS to verify, never a finding.

For each mechanism: cause, our `file:line`, Java `file:line`, causal chain,
ruled-out list. Hand-derive the expected value from the Java expression and
match a jar probe to <0.01px.

## Read-set

- `plans/a2s-class-record-sizing/README.md` (Key code map + probe recipe)
- `src/diagrams/class/class-stereotype.ts` (stereo block: height
  `(count+0.5)*fontSize+4` at :99 — check against upstream Display sizing)
- `src/diagrams/class/class-layout-header-geo.ts:133-193` (stereo/name/
  generic composition; header height max(badge, stereo+lines*size+10, generic))
- `src/diagrams/class/class-badge.ts` (fonts, margins)
- Java: `EntityImageClassHeader.java:125-159` (stereotype Display with
  `FontParam.CLASS_STEREOTYPE`, withMargin(1,0); generic withMargin(1,1)
  twice), `svek/HeaderLayout.java:68-78`, `skin/SkinParam.java`
  (FontParam default sizes — CLASS_STEREOTYPE vs CLASS_ATTRIBUTE vs CLASS),
  and wherever skinparam classFontSize/classStereotypeFontSize resolve.
  Grep the WHOLE `net/` root.
- How OUR theme resolves those fonts: grep `src/` for the class font
  resolution feeding `class-layout-header-geo.ts` (the recurring bug class
  is "renderer font ≠ sizer font" — check both paths read the SAME
  resolved font; see `planning/sizer-renderer-parity.md:331` procedure).
- 3-5 fixtures per cluster: `oracle/goldens/class/<slug>/input.puml` + `svek-*.dot`

## Probes

Same recipe + traps as D1 (README §Method constraints). Probe matrix to
consider: bare class vs `class X <<s>>` vs stacked stereotypes vs
`skinparam classFontSize` vs `<style>` FontSize — ONE varying element per
probe diagram.

## Boundaries

Same as D1: no `src`/test/oracle edits, no state-mutating git; fitted
constant = STOP; SI1 body-layer requirement = STOP (ADR-1).

## Output

Same schema and rules as `batch-1/overview.md` — one JSON block per
mechanism, closure predicted against the FULL backlog. ≤2k tokens, raw
data only.
