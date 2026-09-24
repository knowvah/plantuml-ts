# T11 — single-qualifier residual

**Agent:** typescript-pro (opus, effort high — multi-term geometry) ·
**Depends on:** T10

## Fixtures

baneru-00-kuro607, comaxe-39-goza236, vorimi-67-gudu296,
kadifi-56-bili996, kopida-02-vaje995, pumocu-32-fiji248,
tikovu-50-gale862, vileca-45-melo541, coxose-20-nifu136 (from T12).
Their Q-2 term is T12's (parallel); a fixture closes when both land.
rifuzu/camuna/nafiki moved to T13 (Q-4/Q-5/Q-10).

## Mechanisms · Write-set

Diagnosis sections are quoted from `diagnosis/Q.md` into the agent prompt.

- **Q-1** (HIGH, T15-documented) — `HeaderLayout`'s badge/name split is
  computed in `measureClassifier` BEFORE `applyKalWidthFloor`/
  `applySameClassWidthFloor` widen the box, so header content never
  re-centres on the widened width (Δ≈0.572). Port `svek/HeaderLayout.java:81-117`
  whole; run it on the FINAL width.
- **Q-3** (LOW, diagnose first) — the NON-Kal box of the pair sits Δ≈0.495
  in X though DOT is byte-identical and both graphviz and dot-engine
  give the same polygon (`8,-176..80,-128`). Q.md's probe: `shieldCorner`
  computes `n.x - width/2` with the DECLARED table width (72.995) where
  graphviz reports node width 88 → 7.5025 vs the jar's 7. Instrument
  `graph-layout.ts#mapNodes`/`shieldCorner` against
  `SvekNode`/`DotStringFactory` position extraction before editing.

Write-set: `src/diagrams/class/class-badge.ts`, `class-dot-width-floors.ts`,
`class-layout-generic-classifier.ts`, `src/core/graph-layout.ts`,
`src/core/graph-layout-build.ts`, tests beside each. `class-kal.ts`,
`class-edge-geo.ts` are T12's. `src/core/` edits: stop 13 applies.

## Read-set

`diagnosis/Q.md` (T11 sections), `decisions.md` D4, D7;
`src/diagrams/class/class-kal.ts` module doc; `svek/Kal.java`,
`svek/SvekEdge.java` at the lines the diagnosis cites.

## Acceptance criteria

- Given each fixture, when it renders, then its diff is 0 or its residual
  has a new diagnosis artifact in the task report
- Given a `class-kal.ts` edit, when reviewed, then each changed statement
  cites its `Kal`/`SvekEdge` line, and the file's structure is unchanged
  (stop 11 otherwise)
- Given the qualifier fixtures already conformant, when render-all runs,
  then they stay conformant, and DOT parity stays 711/712

## Observability · Rollback

N/A. Reversible; layout moves are confined to qualifier fixtures and proven
by the close's pin-diff.
