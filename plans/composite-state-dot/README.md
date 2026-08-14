# Mission: composite-state-dot

**Close the three independent defects in the composite-state DOT we hand
graphviz.** Found by a 267-fixture survey (Phase 2) after the `temuxi-28-cega322`
pin diagnosis (`fd079b88`) bottomed out in "our composite DOT is not jar's graph".

## Objective

159 of 267 state fixtures emit a DOT that matches jar's structurally. The other
108 diverge in one of three ways, and the survey proved the three are
**independent** — they must not be merged into one fix:

| defect | fixtures | reaches geometry? |
|---|---|---|
| wrapper subgraphs (`a`/`p0`/`i`/`p1`) never emitted | **56** | **no** — emitter-only |
| `minlen=0` edges not declared before nodes | **46** | **yes** |
| border-point pin span (temuxi's class) | disjoint from wrappers | **yes** |

Wrappers and order overlap on only 9 fixtures. Pins are disjoint from wrappers
**by construction**: `ClusterDotString.java:109-113` suppresses `p0`/`p1`
whenever a cluster has border points.

## Exit bar

1. `bupani-17-puxi938` emits 5 cluster subgraphs in jar's order `a p0 base i p1`.
2. Batch 1's census is **neutral** on all five diagram types. If it is not,
   ADR-2's emitter-only premise is false — STOP, do not patch.
3. Batch 2 improves the SVG census with **no fixture rising**.
4. `temuxi-28-cega322` reaches document height 418, or T5 records why not.
5. Every remaining miss carries a named mechanism with a `file:line`.

**Do not redefine the bar to make it look met.**

## Branch

`feat/composite-state-dot` off `main`. Merge with a **merge commit, not squash**
— per-task commit ids get cited in the journal.

## Quality gates

Run all four between every batch. Never pipe a gate: `npm test | tail` returns
`tail`'s exit code and masks failures.

```
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm test
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx tsx scripts/svg-conformance-census.ts component usecase state --per-fixture
  pass: no fixture's diff count RISES vs the pre-batch run
  on_fail: stop
- command: npx tsx scripts/svg-conformance-census.ts class object --per-fixture
  pass: no fixture's diff count RISES (batch 2 only — shared layout path)
  on_fail: stop
```

Capture the census **before** touching anything; a per-fixture diff against that
baseline is the only way to tell a fix from a trade.

## Batches

- [ ] **batch-1** — [emit the wrapper subgraphs](batch-1/overview.md) (exit-bar 1, 2)
- [ ] **batch-2** — [declaration order + `za` anchor](batch-2/overview.md) (exit-bar 3)
- [ ] **batch-3** — [border-point pins](batch-3/overview.md) (exit-bar 4)

## Stop conditions

1. A task needs to write a file outside its write-set, and no other task owns it.
2. Two consecutive gate failures on the same check. Investigation continues;
   code changes stop until the mechanism is stated with a `file:line`.
3. An implementation contradicts an approved ADR — reopen it, don't diverge.
4. **T5's mechanism lands outside `state-composite-*.ts`/`state-dot-graph.ts`.**
5. **Batch 1's census is not neutral** — falsifies ADR-2. Reopen, don't patch.
6. A fixture rises and the cause is not identified. Raising a baseline needs the
   mechanism recorded (`jecici`/`xamule` are the precedent for the bar).
7. Any fix that needs a ratchet re-pin, a `size-backlog` entry, or a loosened
   tolerance to pass. One such concession exists (`leloja`, 2.0e-6) and was
   flagged for review — it is a decision, never a reflex.
8. **Any fitted constant.** No value ships without an upstream `file:line`.

## Push-forward conditions

- The census moves a fixture DOWN — record it and continue.
- A pre-existing lint/typecheck violation in a file you are touching, under 3 lines.
- A test asserting a value this change legitimately moves — correct the test, but
  only after the fixture's own oracle decides it, and only if the property the
  test exists for survives.
- The complexity hook blocks on a file/param cap — split the module or bundle
  params. Never edit `hooks/complexity-ignore`.

## Two things that caused most of the defects behind this mission

- **The DOT-parity comparator is structural and blind to label pixel sizes.**
  Five defects lived in exactly that blind spot. "The DOT gate is green" is not
  evidence that the DOT matches.
- **`graph-layout-build.ts` and `svek-dot-emit.ts` are two independent consumers
  of one `DotInputGraph`.** Four defects were divergences between them, in BOTH
  directions. Any change to one must ask what the other does with the same field.

## Index

- [decisions.md](decisions.md) — the five approved ADRs
- [diagrams/component-map.md](diagrams/component-map.md) — what is touched
- [diagrams/data-flow.md](diagrams/data-flow.md) — the two-consumer seam
- [decision-journal.md](decision-journal.md) — appended during execution
