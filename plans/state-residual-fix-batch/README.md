# Mission: state-residual-fix-batch (SI31)

**Apply the five fixes SI29 diagnosed to a `file:line` + Java citation but
deliberately never applied (D6, diagnosis-only), and close the declared-size
residual rows they account for.** The records are the spec — this mission does
not re-diagnose — but every cited Java method body is re-read before any
constant is written. Planned 2026-08-19 off `plans/state-declared-size-fix/`'s
close-out follow-on list (`findings/CLOSE-OUT.md:140-160`). Register row
**SI31** at T5.

**Branch:** `fix/state-residual-fix-batch` (from `main` at or after `1fd425e0`)
· **Merge:** merge commit · **Agents run no git** — the orchestrator commits
each task by pathspec.

## The exit

**15 rows across 10 fixtures, all re-measured 2026-08-19 against `main` and
byte-identical to the records they come from** (SI30 moved none of them):

| Group | Fixture | Rows | Δ today | Batch |
|---|---|---|---|---|
| G17 | `joleju-94-maru748` | 6 | −3 ×5, −9 | 1 |
| G21 | `zacajo-09-tamu628` | 1 | −3.733 | 2 |
| G21? | `jetuse-93-gopi146` | 1 | −5.000 | 2 (verify, D6) |
| G5 | `pacami-67-dafe414` | 1 | −1.000 | 3 |
| G5 | `tofezi-64-koda860` | 1 | −1.000 | 3 |
| G5 | `xojudi-20-keco020` | 1 | −1.000 | 3 |
| G5 | `decede-10-buvu414` | 1 | −1.000 | 3 |
| G5 | `gokife-89-boja382` | 1 | −1.000 | 3 |
| G15 | `fovafu-44-mifu394` | 1 | +7.820 | 4 |
| G20a | `kejabo-83-vinu490` | 1 | +0.750 | 5 |

Exit = every row above exact, **or** carrying a jar-cited mechanism for the
residual; the harness net shrink-only; no fixture outside `expected-moves.txt`
moved.

**G20b is NOT in this mission.** `pavuzo-79-zodu430`'s −2.460 px cannot be
closed here: `@knowvah/dot-engine`'s public `EdgeGeometry` has no `xlabel`
field, so the position the engine computes and draws is never published.
Verified live on the installed 1.5.0, filed 2026-08-19 as
[`docs/graphviz-issues/16-edge-xlabel-position-not-in-getlayout.md`](../../docs/graphviz-issues/16-edge-xlabel-position-not-in-getlayout.md)
+ TRACKER line (commit `1fd425e0`).

**Status as of 2026-08-19: FIXED upstream, NOT YET PUBLISHED.** dot-engine
added `xlabel?: {x, y}` to `EdgeGeometry`, populated in `snapshotEdge` and
gated on `placedLabelPos`'s `set` flag exactly as the filing asked — see the
resolution note at the foot of issue 16. But this repo pins a published
package, and npm's latest is still **1.5.0 with no `xlabel`** (checked
2026-08-19). So it remains not consumable, and **this mission does not start
it** — the port-side half would be untestable, and the 90/90/90 coverage gate
would flag unreachable code. When the release lands it becomes a short
follow-on mission: issue 16's own "Verification when it lands" section already
carries its four steps. T6 records that in `next-missions.md`.

**G15 joined the mission on 2026-08-19**, reclassified out of
`docs/graphviz-issues/15-*` (commit `6199b5f3`). It was filed as a dot-engine
anchor-ranking defect and disproven: the port reproduces native graphviz
byte-for-byte on the fixture's own DOT, and the filing compared the jar's
*clipped* spline start against our *unclipped* one. The work is ours — apply
the `simulateCompound` clip we already ship. Batch 4.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Baselines + allow-list | T0 | [ ] |
| [1](batch-1/overview.md) | G17 note-only region (+15 per `SvekResult.java:135`) | T1 | [ ] |
| [2](batch-2/overview.md) | G21 accumulator wiring + verify `jetuse-93` | T2 | [ ] |
| [3](batch-3/overview.md) | G5 south-cap opacity thread | T3 | [ ] |
| [4](batch-4/overview.md) | G15 composite-anchor spline clip (core extraction) | T4 | [ ] |
| [5](batch-5/overview.md) | G20a declaration order (revert-on-net-growth) | T5 | [ ] |
| [6](batch-6/overview.md) | Close-out | T6 | [ ] |

Serial. Batches 1 and 2 both write `state-composite-concurrent.ts` in disjoint
functions ~95 lines apart, and Batches 3 and 4 both write
`layout-ink-extent.ts` (south-cap term vs transition-ink path) — separate
batches keeps every blast radius isolated (D4).

## Quality gates (after every batch)

```
- command: npm test
  pass: exit 0 (coverage >= 90/90/90)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx jiti scripts/measure-composite-declared-size.ts --mismatched-only > /tmp/srfb-now.jsonl && python3 plans/state-declared-size-fix/scripts/harness-diff.py test-results/state-declared-size-baseline.jsonl /tmp/srfb-now.jsonl
  pass: "OK: N rows went exact, 0 rows appeared or grew" — then re-pin: cp /tmp/srfb-now.jsonl test-results/state-declared-size-baseline.jsonl
  on_fail: stop            # stop 3 (Batch 4: D5 revert rule instead)
- command: npx jiti scripts/render-manifest.ts --out /tmp/srfb-manifest.json && python3 plans/state-declared-size-fix/scripts/manifest-diff.py test-results/render-manifest-baseline.json /tmp/srfb-manifest.json plans/state-residual-fix-batch/expected-moves.txt
  pass: "OK: N expected moves, 0 unexpected" — then re-pin the manifest baseline
  on_fail: stop            # stop 4
- command: npx vitest run tests/oracle/state-dot-parity.test.ts tests/oracle/class-dot-parity.test.ts tests/oracle/description-parity.ratchet.test.ts tests/oracle/object-dot-parity.test.ts tests/architecture/layering.test.ts
  pass: state 270 · class 721 · description 357 · object 80, layering green
  on_fail: stop            # stop 5 / 6
- command: git diff --name-only <last-batch-commit>..HEAD
  pass: only the batch's declared write-set (+ shared files below)
  on_fail: stop
```
Wall-clock: report `npm test` time each batch; > +10 % of 54.8 s is stop 11.
Honest current sample is **58.9 s** (55.0 s on a quiet machine).

## Stop conditions

1. A task must write a file outside its write-set that no task owns. Shared,
   pre-declared: both gitignored baselines, `expected-moves.txt`,
   `decision-journal.md`, this brief.
2. Two consecutive gate failures on the same check.
3. Harness: any row appears or grows vs the previous baseline — **except
   Batch 5**, where D5's revert rule replaces this.
4. `render-manifest` moves a fixture not on `expected-moves.txt`.
5. A DOT-parity ratchet falls (state < 270, class < 721, description < 357,
   object < 80) or an svg-conformance golden count drops.
6. `tests/architecture/layering.test.ts` needs an ALLOWLIST entry or
   `KNOWN_DEBT` becomes non-empty.
7. A numeric constant without a `~/git/plantuml` `file:line`, or a delta that
   shrinks without the mechanism explaining ALL of it.
8. A finding contradicts a locked decision (decisions.md D1–D8).
9. **G5's premise fails** — T3's pre-condition investigation shows the record's
   opacity gate is wrong. The +1 px is real; its trigger would not be. That is
   re-diagnosis, not a fix.
10. Same location changed 3× consecutively without the check clearing.
11. `npm test` wall-clock > +10 % of 54.8 s.
12. The complexity hook blocks a write and the only way through is widening an
    exemption (D7 forbids it).

## Push forward (journal the call)

Helper filenames/shape within D2 · extracting a helper to satisfy the
complexity hook (D7) · tightening a ratchet a task made exact incidentally ·
regression tests authored from a fixture's `in.puml` · probes under
`scripts_scratch/T<N>/` deleted before commit; gated tracing in `src/` only if
reverted · minor/patch dep bumps · `jetuse-93` proving to be a different
mechanism (journal it with `file:line`, do not chase it — D6).

## Index

- [decisions.md](decisions.md) — D1…D8 (locked) · [decision-journal.md](decision-journal.md)
- [expected-moves.txt](expected-moves.txt) — written by T0, appended per batch
- [diagrams/component-map.md](diagrams/component-map.md) · [diagrams/data-flow.md](diagrams/data-flow.md)
- **Source records (the spec):** `plans/state-declared-size-fix/findings/`
  — `G17-note-only-region.md`, `G21-dot-identical-geometry.md`,
  `G18-single-node-autonom.md` (G5), `G20-linetype-routing.md` (G20a),
  `CLOSE-OUT.md:140-160`.
- Precedents: SI29 `plans/state-declared-size-fix/` (harness gates, grown-row
  rulings), SI30 `plans/creole-exposant-port/` (STOP-4 collateral handling).
