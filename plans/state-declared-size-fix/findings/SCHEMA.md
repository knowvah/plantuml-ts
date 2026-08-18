# Findings record schema — copied verbatim from SI28 (`plans/state-declared-size-diagnosis/findings/SCHEMA.md`) for Batch 5 D-tasks and T20

One record per fixture (or `<slug>#a`, `<slug>#b` when rows have distinct
causes). Copy verbatim; T14 and `check-schema.py` parse field names in this
order — do not rename or reorder.

```markdown
### <slug>

- **bucketLabel:** <T0's first-match label — provenance only, ADR-3>
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 0 | 2.736111 | 3.027778 | -21.000 |
- **status:** resolved | unresolved | already-conformant | divergence-proposed
- **mechanism:** <the CAUSE in 1–2 sentences, not the symptom. If unresolved: "UNRESOLVED".>
- **originFileLine:** <src/…/file.ts:LINE — the single site the mechanism originates at>
- **javaRef:** <~/git/plantuml/src/main/java/net/…/File.java:LINE-LINE — the method body that produces the jar's number>
- **causalChain:** <why Δpx follows from the cause; show the arithmetic (px = in × 72)>
- **ruledOut:** <what you eliminated and the evidence; non-empty for any non-trivial fixture>
- **pairingRisk:** none | possible | likely  <sorted-per-axis pairing could have mis-attributed this row — say why>
- **sharedCauseWith:** <slugs from ANY bucket sharing this exact mechanism, or `none`>
- **proposedWriteSet:** <files a fix would touch — estimate, not a patch>
- **sizeEstimate:** <files / blast radius / verification cost, one line>
- **confidence:** high | medium | low
- **nextStep:** <required when unresolved: the next instrumentation to run>
```

## Rules

1. `originFileLine` and `javaRef` are real file:line references (open both).
2. `ruledOut` non-empty on any non-trivial fixture (`~/.claude/rules/diagnosis.md`).
3. Identical |Δpx| across fixtures (36 ×7, 28 ×6, 10 ×5, 12/40/21 ×3, 445 ×2,
   80 ×2 in the preview) must be reconciled: name each other in
   `sharedCauseWith` OR state why an identical delta is NOT a shared cause.
4. `unresolved` is legitimate; a fabricated mechanism is strictly worse.
5. No fix, no patch, no source edit (ADR-2/ADR-5). Sub-pixel threshold: 0.05 px (ADR-7).

## Measuring

```sh
npx jiti scripts/measure-composite-declared-size.ts <slug>…        # named fixtures
ls test-results/dot-cache/state/<slug>/                             # in.puml, in.svg, svek-N.dot (jar)
scripts/oracle-render.sh <out-dir> <puml>                           # fresh jar render, deterministic text
```
Probes go in `scripts_scratch/` (deleted before commit); import the real
pipeline (`renderSync` + `WidthTableMeasurer` + `setLayoutInputObserver`, as
the harness does) rather than reimplementing it.
