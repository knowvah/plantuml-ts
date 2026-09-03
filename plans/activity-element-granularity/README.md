# Mission: `activity-element-granularity`

> ## ⛔ HALTED 2026-09-03 after T1 — awaiting a decision on the INSTRUMENT
>
> T1 did exactly what [D1](decisions.md) specifies and every element-level
> measure improved (`<polyline>` 1666 → **0**; summed \|element delta\|
> **−57.0%**; summed \|root-`g` childCountDelta\| **−19.3%**) — while the
> **gated `weightedScore` ROSE 7.0%** and the ratchet failed **207 of 268**
> fixtures. `compare.ts:404` charges a `[childCount]` short-circuit the
> **sum** of both sides' sizes, so growing our side is penalised even when it
> moves us closer to the jar. The exit bar below is therefore **unreachable
> as written**, for the whole class of change all three swaps make.
>
> Mechanism, isolation experiment and the three options:
> [D10](decisions.md#d10) and `.agent-notes/aeg-T1.md`. T1 is preserved
> unmerged on `wip/aeg-T1-measured-halt` (`f59c26bb`). Nothing was re-pinned.

**Branch:** `feat/activity-element-granularity` · **Planned:** 2026-09-03 ·
**Baseline commit:** `804232d4` (main, clean tree, all four gates green)

## Objective

Converge activity's SVG **element vocabulary** with the jar's. We draw the
same picture using different elements: one `<polyline>` where the jar draws
N `<line>`, `<circle>` where it draws `<ellipse>`, and one `<text>` with
`<tspan>` children where it draws one `<text>` per line. The child-count
mismatch this produces short-circuits whole subtrees in `compareSvg`, which
is why `svg/g[][childCount]` alone carries **91.6% of all remaining
activity diff weight** (99321 of 108447, across 209 fixtures).

## The premise this mission CORRECTS

`planning/next-missions.md` describes this work as *"missing ink, not chrome
— unported activity content."* **Measured, that is false.** The content is
drawn; it is drawn with different elements. Element census over the 268
numerically-comparable fixtures, ours vs jar:

| element | ours | jar | delta |
|---|---|---|---|
| `line` | 289 | 3336 | **−3047** |
| `polyline` | 1666 | 0 | +1666 |
| `text` | 1393 | 1915 | −522 |
| `ellipse` | 0 | 488 | −488 |
| `circle` | 518 | 0 | +518 |
| `a` / `image` / `linearGradient` / `stop` | 0 | 16 | −16 |

On `numalo-91-pole243` the child counts are **equal** (5 v 5) and every
element still differs — proof the deficit is granularity, not absence.

This is the **fourth** premise in this codebase to die on measurement (after
the uniform 12-diff floor, the "+2 extra `g` children", and the
`g[1][childCount]` exit clause). Re-measure before deriving.

## Exit bar

- Zero `<polyline>` and zero `<circle>` emitted by the activity engine
- Multi-line labels emit one `<text>` per line; creole `<tspan>` survives
  **within** a line
- `svg/g[][childCount]`'s share of total weight is restated against its
  91.6% starting point, and the aggregate `weightedScore` falls
- Every fixture whose `weightedScore` **rose** is named with a mechanism
- `src/core/svg-shapes.ts` is **unchanged** — sequence and json must not move
- All four gates green

## What this mission does NOT do

- **Does not touch the shared primitives.** `circle()` and `tspan()` are used
  by sequence and json; only activity's CALL SITES change ([D2], [D3]).
- **Does not chase `style=` vs presentation attributes.** `normalize.ts:124`
  expands `style="k:v"` into attributes before comparing, so the gate cannot
  see that difference. Work there would measure nothing ([D7]).
- **Does not change font size.** Ours 14 vs the jar's 12 is a theme default,
  not element granularity ([D5]).
- **Does not port `<a>`, `<image>` or gradients.** 16 occurrences across 268
  fixtures — a rounding error against 91.6%, and each is a separate feature
  port ([D8]).

## Quality gates — all four, before any commit lands

```
- command: npm test            # vitest + 90/90/90 coverage
  pass: exit 0 AND `Test Files` total == 683
  on_fail: fix_and_rerun
- command: npm run typecheck   # both tsconfigs
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: git diff --name-only HEAD~1
  pass: output matches the task's declared write-set only
  on_fail: stop
```

**The `Test Files` count is part of the gate, not decoration.** An orphaned
`coverage/.tmp` makes vitest silently skip files while exiting 0 with a clean
summary — observed 2026-09-02 at 683 / 675 / 673 on one unchanged tree.
`npx vitest list --filesOnly` is authoritative; `rm -rf coverage/.tmp` before
any run following a killed, timed-out or backgrounded one. See
`.agent-notes/aoh-coverage-tmp-undercollect.md`.

The `npm test` wall-clock is advisory context, not a gate. Poll `uptime`
before trusting any timing number.

## Batches

| Batch | Tasks | Parallel | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | T0 pin the pre-swap element census | — | [x] |
| [1](batch-1/overview.md) | T1 polyline→line · T2 circle→ellipse · T3 text-per-line | no — shared write-set | ⛔ halted at T1 |
| [2](batch-2/overview.md) | T4 re-pin, re-census, name every riser | — | blocked by the halt |

**T0 gates everything.** Without a pre-swap element pin the descent is
unmeasurable and each swap's effect unattributable ([D6]).

## Stop conditions

1. A task needs to write a file outside its write-set, and no other task
   owns it
2. Two consecutive gate failures on the same check — the cap bounds **fix
   attempts, not investigation**; keep diagnosing until the mechanism is
   stated (`~/.claude/rules/diagnosis.md`)
3. Any of [D1–D8](decisions.md) is contradicted by the code — amend the
   decision and halt; never silently override
4. **T3: the per-line y advance cannot be located in upstream.** Never fit a
   value — especially not one that shrinks the error ([D4])
5. `src/core/svg-shapes.ts` or any non-activity engine's output changes
6. A re-pin would raise a pin without a stated mechanism — a risen pin is an
   adopted regression until proven otherwise
7. `npm test` reports a `Test Files` total other than 683
8. A constant is needed and its upstream `file:line` cannot be located

## Push-forward conditions

1. A swap is simpler than estimated → do it, log why in the journal first
2. `diffCount` rises while `weightedScore` falls → expected; collapsing a
   short-circuit into real comparison does this
3. Purely stylistic choices with no behavioral effect
4. Self-explanatory error with an obvious fix
5. SVG output grows → expected and accepted ([D9]), not a regression

## Index

- [decisions.md](decisions.md) — D1–D9
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md)
- [diagrams/data-flow.md](diagrams/data-flow.md)
