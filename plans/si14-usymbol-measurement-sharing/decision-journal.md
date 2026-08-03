# SI14 decision journal

Appended during execution. Every non-trivial judgment call gets a row —
"non-trivial" means a reasonable developer might have chosen differently.

Also record, per `~/.claude/rules/autonomous-execution.md`:

- the execution plan for each batch, before launching it
- quality-gate results after each batch
- every stop condition triggered, with full error output
- any task that turned out simpler than specified, and why

| Date | Task | Decision | Rationale | Reversible? |
|------|------|----------|-----------|-------------|
| 2026-08-03 | batch-1 | Execution plan: T1 and T2 launched as parallel typescript-pro agents. Write-sets disjoint (T1: `src/core/klimt/document-shell.ts` + new klimt test; T2: description leaf-sizing pair + delete `usecase-footprint.ts` + new parity test). No shared files, no data dependency; they meet only in batch 3. Orchestrator commits after both return and gates pass. | Per `parallelism.md` default rule and batch overview. | Yes |
| 2026-08-03 | T2 | **ADR-3 fallback taken — retirement is PARTIAL.** The literal instruction (wrap the `<latex>` route in a real `Footprint#getEllipse` fit) was implemented and measured: `gevozu-46-sasu860` and `sunuju-01-pote718` (both `usecase (<latex>…)`) widened 0.611632in → 1.041146in, violating "widened 0". Cause: KaTeX's measured box for this markup is already far wider than JLaTeXMath's; an ellipse fit around it grows the gap. Reverted the wrap; the `<latex>` branch keeps returning its raw `measureNodeLabel` box (behaviour unchanged from baseline). The non-latex mechanism retirement IS complete and parity-verified to ~1e-14 px on the seven header shapes. **Tracked follow-up:** the latex ellipse-wrap remains unretired behaviour, documented in `leaf-sizing.ts` doc comments with the measured numbers. | ADR-3 pre-authorises exactly this fallback and forbids recording it as complete. The trigger differed slightly from ADR-3's wording (mechanisms *were* identical; the *wrap itself* widened) but the clause's substance — do not accept movement, keep the entry point, file the remainder — applies directly. | Yes (revert) |
| 2026-08-03 | T2 | Deleted `tests/unit/description/footprint-atom-ink.test.ts` (outside declared write-set). Its sole subject was `footprintBoxes`, deleted by this task; the mechanism it guarded is now covered by `footprint-parity.test.ts` (15 cases, stronger: numeric parity against pre-deletion captures). Not stop condition 4 — the test was not deleted to make anything pass; its subject ceased to exist. | Task file sanctions updating tests referencing retired symbols; full deletion was the honest form since every assertion targeted the retired symbol. | Yes |
| 2026-08-03 | T2 | Finding worth carrying: a synthetic sprite (declared 16×16 with ink-offset rectangle) shows a genuine ~0.9 px divergence between the two fit mechanisms for the `text+sprite` ordering specifically. Not one of the seven jar-verified header shapes; real stdlib sprites reproduce the jar numbers exactly. Filed here rather than actioned — out of T2's scope. | Journal is the tracking surface for sub-issue findings. | n/a |
| 2026-08-03 | T1 | T1's acceptance criterion 4 (diff lists only its two files) could not be checked mid-batch on the shared worktree (T2's concurrent edits visible). Verified by the orchestrator at commit time instead: `d4f49ebd` touches exactly `document-shell.ts` + `fragment-emission.test.ts`, additive only. | Shared-worktree parallelism makes per-agent diff checks meaningful only at commit. | n/a |

## Batch 2 execution plan (2026-08-03)

Single task T3, single typescript-pro agent, no parallelism (nothing to
parallelise). T1 is green so the batch-2 gate condition (ADR-2 survived) holds.
Write-set: `class-geo-types.ts` + `class/index.ts`; behaviour-neutral by
construction — all 449 goldens must stay byte-identical.

| 2026-08-03 | T3 | `measurer` landed **optional** (`measurer?: StringMeasurer`), not required as the interface contract sketched. Making it required broke typecheck in `layout.ts` + `class-geo-builders.ts` (outside the write-set) and two test files that hand-build `ClassGeometry` literals. Rather than widen the write-set, the agent matched the type's established convention (nearly every field optional; the real `layoutSync` path always sets it). **T4 must treat `geo.measurer` as possibly absent** — fall back to the pre-T4 constant-offset path or assert, T4's choice to justify. | Escalating to widen a write-set for a type-strictness preference would have been disproportionate; convention-matching is the smaller change. Criterion 1 still holds on every real diagram. | Yes |

## Batch 3 execution plan (2026-08-03)

Single task T4, single typescript-pro agent. Prompt injects the as-built
contracts: T1's `renderDrawableToFragment`/`mergeFragmentDefs` exports and
T3's `measurer?`/`sprites?` being OPTIONAL on the geo (T4 must handle
absence — hand-built fixtures omit them; the real path always sets them).
Expected movement: ONLY the three authored usecase/actor fixtures re-pin
smaller; the `ry` 13.4846-vs-13.0625 residual is expected to survive (T6's
subject). Movement in any of the 449 goldens = stop.

## Batch 2 gate results (2026-08-03, tree at `73234529`)

| Gate | Result |
|---|---|
| `npm test` | exit 0 — 476 files / 11,428 tests; 449 goldens byte-identical |
| `npm run typecheck` / `lint` / `build` | exit 0 |
| size-deltas | 320/351, widened 0 |
| write-set check | exactly `class-geo-types.ts` + `class/index.ts`; `dispatcher.ts` unchanged |
| commits | `73234529` (T3) |

## Batch 1 gate results (2026-08-03, tree at `9b4debf1`)

| Gate | Result |
|---|---|
| `npm test` | exit 0 — 476 files / 11,428 tests (449 goldens byte-identical) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 |
| `vendor-stdlib --verify` | 34,587 files verbatim |
| size-deltas | 320/351, widened 0, histogram identical to baseline |
| write-set check | tree matched combined write-sets exactly (plus journal + sanctioned test deletion, logged above) |
| commits | one per task: `d4f49ebd` (T1), `9b4debf1` (T2) |

## Measured baselines (recorded 2026-08-03, before batch 1)

All measured from actual runs on `feature/si14-usymbol-measurement-sharing`
at `01315734` (brief commit; code identical to `main`@`1406e139`).

| Metric | Baseline | Source |
|---|---|---|
| size-delta conformant | 320/351 (91.2%) — reproduces | `npx jiti scripts/measure-description-size-deltas.ts` |
| size-delta widened | 0 — reproduces | same |
| size-delta cause histogram | sprite 5, icon 2, other 2, container-cluster 9, emoji-unicode 2, latex 2, element-font 5, creole-titled-separator 2, multiline-display 2 | same |
| goldens + ratchets | 449 green (312 class + 24 object + 59 state + 54 description); full `npm test` exit 0; `tests/oracle` alone: 15 files, 1954 tests | `npm test`, `npx vitest run tests/oracle` |
| vendor verify | 34,587 files verbatim (sha256) — reproduces | `npx jiti scripts/vendor-stdlib.ts --verify` |
| `class-usecase-inline-sprite` pinned diffs | pinned exactly in test; ellipse `cx` actual 177.531 vs jar 175.528 (Δ2.003) | `tests/oracle/svg-conformance/class-usecase-actor.test.ts` (7 tests green) |
| `class-usecase-inline-sprite` ry | 13.4846 vs jar 13.0625 (Δ0.4221) — reproduces | same |
| `text/@x`, `image/@x` delta | 2.003 both — reproduces | same |

## Stop-condition log

| Date | Condition | What happened | Resolution |
|------|-----------|---------------|------------|
| 2026-08-03 | #8 — file outside every task's write-set | T4 edited `tests/oracle/svg-conformance/render-fixture-class.ts` (+10/−1): mirrors `classPlugin.layoutSync`'s `measurer`/`sprites` passthrough onto the harness's `layoutClass` result. Without it `geo.measurer` is `undefined` in the harness and every conformance fixture silently exercises the pre-T4 fallback — the re-pinned test in T4's own write-set would be pinning the wrong path. The file is in no task's write-set. Agent flagged it; orchestrator verified the diff is a mechanical mirror of production with no new logic, and that all gates pass with it (476 files / 11,428 tests; 449 goldens byte-identical; deltas 320/351 widened 0). | **Maintainer approved 2026-08-03** (with the pending items below). T4 committed with the harness change included. |

### Pending with the same escalation (context for the decision)

1. **New file `src/diagrams/class/renderer-usymbol-entity.ts`** (153 lines, not
   in the declared write-set). Orchestrator ruling: covered by the brief's
   push-forward provisions ("file organisation within a declared write-set" +
   the complexity hook's 500-line cap — `renderer.ts` was at 465 lines and the
   params builder must live in `diagrams/class/` because `src/core` cannot
   import `src/diagrams/description`). Ruled push-forward, not escalated, but
   listed here for visibility.
2. **AC1 partial.** `image/@x` reached 0; `text/@x` stayed at 2.003. Measured
   cause: same out-of-scope ellipse-fit mechanism as the `ry` delta (`rx`
   delta ≈ `x` delta) — T6's diagnosis subject, strengthened by this finding.
   Not an independent centring bug.
3. **AC4 partial.** `class-allowmixing-usecase-mix` 9 → 2 pinned diffs (all
   actor-specific deltas closed); `class-usecase-inline-sprite` 10 → 11 — a NEW
   residual appeared because the faithful path is now reachable:
   `image/@width`/`@height` 3.2308×2.1538 vs jar 3×2, tracing to
   `EntityImageDescriptionTextBlock.ts#drawAtoms`'s unrounded sprite dims,
   which commit `1406e139` (pre-mission) already flagged as needing its own
   pass. Correct fix is rounding at the `<image>` emission site only (rounding
   the resolver would corrupt cursor advance) — file outside every write-set,
   so it is follow-up work either way.
4. **Batch-3 "success signal" partially met**: label baselines are now
   content-dependent (constant `cy + 2.6667` retired — the mission's core
   objective) and stroke-width/text-anchor/textLength/y-family deltas closed,
   but the overview's "both `text/@x` and `image/@x` reach delta 0" held only
   for `image/@x`.
