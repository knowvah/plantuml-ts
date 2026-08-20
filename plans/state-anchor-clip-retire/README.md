# Mission: state-anchor-clip-retire (SI32)

**Retire the composite-anchor spline-clip divergence SI31's T5 knowingly left
in.** Upstream clips a cluster-sourced edge once, before anything reads it, so
the ink walk and the drawn path see the same curve. This port clips only for
the ink fold, so the state renderer still draws the in-cluster segment the jar
discards — on a canvas the clip has already narrowed. Recorded at
`DIVERGENCES.md` "State diagrams — Composite-anchor transitions", which this
mission **deletes** rather than softens. Register row **SI32** at T4.

**Branch:** `fix/state-anchor-clip-retire` (from `main` at or after `90d79baf`)
· **Merge:** merge commit · **Agents run no git** — the orchestrator commits
each task by pathspec.

## The exit

State clips **once**, in a pass that mirrors `DotStringFactory.solve`'s own
edge loop, and both the ink walk and the renderer read that clipped path.

- `DIVERGENCES.md`'s entry is **deleted** (the divergence is gone, not smaller).
- `fovafu-44-mifu394` scope2 width **stays exact** — it is exact today; this
  mission must not regress it.
- Harness net shrink-only; no fixture outside `expected-moves.txt` moves.
- Arrowheads derive from the clipped path, per `SvekEdge.java:679-684`.

**This changes rendered SVG**, deliberately and more broadly than SI31 did:
SI31 moved 31 of 2017 fixtures by changing canvas size, and this changes the
drawn curve itself plus arrowhead placement wherever the head end clips.

## Why "option D", and why not the obvious one

The obvious shape is description's: clip during edge-geo construction
(`description/layout-geo-post.ts#clipEdgePoints`). **Upstream does not do that**,
and copying description here would have been the less faithful choice.
`DotStringFactory.solve` (`svek/DotStringFactory.java:441-467`) reads:

```java
   ... set node + cluster positions from the graphviz SVG ...
   for (SvekEdge line : getBibliotekon().allLines())
       line.solveLine(svgResult);              // <- the clip, one pass over ALL edges
   if (skinParam.getDotSplines() == DotSplines.ORTHO)
       alignEdgesAtLabelNodes();
   for (SvekEdge line : getBibliotekon().allLines())
       line.manageCollision(getBibliotekon().allNodes());
   -> then new SvekResult(...)                 // ink walk + drawU both come after
```

The clip is a **separate whole-collection pass**, after node/cluster geometry
is final and before any consumer — it has to be, because the loop directly
above it is what finalises the cluster positions the clip rectangles come from.
See [decisions.md#d1](decisions.md).

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Baselines (incl. a **tracked** copy — SI31's gap) | T0 | [x] |
| [1](batch-1/overview.md) | Pre-conditions, NO CODE — D1 stands or falls here | T1 | [x] |
| [2](batch-2/overview.md) | Port `solve()`'s edge pass; clip once; consumers follow | T2 | [x] |
| [3](batch-3/overview.md) | Delete the divergence; fix `overview.md`; file two gaps | T3 | [x] |
| [4](batch-4/overview.md) | Close-out | T4 | [x] |

Serial. Batch 1 is a real gate, not ceremony: if node geos are not final and
in the same frame at every pass site, D1 collapses and the mission needs
re-planning rather than patching.

**Batch numbering is load-bearing.** SI31's brief drifted — a decision said
"Batch 1/2" for what became 2/3, and two task files said "T2's" meaning T3's,
costing a correction in every agent prompt. If a batch is ever inserted,
renumber every reference.

## Quality gates (after every batch)

```
- command: npm test
  pass: exit 0 (coverage >= 90/90/90)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0 (both tsconfigs)
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0 (3 pre-existing [unplugin:dts] notes are NOT a failure)
  on_fail: fix_and_rerun
- command: npx jiti scripts/measure-composite-declared-size.ts --mismatched-only > /tmp/si32-now.jsonl && python3 plans/state-declared-size-fix/scripts/harness-diff.py test-results/state-declared-size-baseline.jsonl /tmp/si32-now.jsonl
  pass: "0 rows appeared or grew" — then re-pin: cp /tmp/si32-now.jsonl test-results/state-declared-size-baseline.jsonl
  on_fail: stop            # stop 3
- command: npx jiti scripts/render-manifest.ts --out /tmp/si32-manifest.json && python3 plans/state-declared-size-fix/scripts/manifest-diff.py test-results/render-manifest-baseline.json /tmp/si32-manifest.json plans/state-anchor-clip-retire/expected-moves.txt
  pass: "OK: N expected moves, 0 unexpected" — then re-pin the manifest baseline
  on_fail: stop            # stop 4
- command: npx vitest run tests/oracle/state-dot-parity.test.ts tests/oracle/class-dot-parity.test.ts tests/oracle/description-parity.ratchet.test.ts tests/oracle/object-dot-parity.test.ts tests/architecture/layering.test.ts tests/architecture/catalog.test.ts
  pass: state 270 · class 721 · description 357 · object 80; layering green with KNOWN_DEBT []; catalog not drifted
  on_fail: stop            # stop 5 / 6
- command: git diff --name-only <last-batch-commit>..HEAD
  pass: only the batch's declared write-set (+ shared files below)
  on_fail: stop
```
Wall-clock: report `npm test` each batch; **> 60.3 s is stop 11** (SI31 closed
at ~55 s).

## Stop conditions

1. A task must write a file outside its write-set that no task owns. Shared,
   pre-declared: both baselines, `expected-moves.txt`, `decision-journal.md`,
   this brief.
2. Two consecutive gate failures on the same check.
3. Harness: any row appears or grows.
4. `render-manifest` moves a fixture not on `expected-moves.txt`.
5. A DOT-parity ratchet falls or an svg-conformance golden count drops.
6. `layering.test.ts` needs an ALLOWLIST entry or `KNOWN_DEBT` becomes
   non-empty.
7. A numeric constant without a `~/git/plantuml` `file:line`.
8. A finding contradicts a locked decision (D1–D6).
9. **T1's premises fail** — node geos not final, or not in the same coordinate
   frame, at any pass site; or a consumer genuinely needs unclipped points.
   That collapses D1: re-plan, do not patch around it.
10. Same location changed 3× consecutively without the check clearing.
11. `npm test` wall-clock > 60.3 s.
12. The complexity hook blocks and the only way through is widening an
    exemption (forbidden — extract a helper).
13. **A second port of `simulateCompound` appears.** Copying instead of
    consuming `src/core/spline-clip.ts` is the exact condition SI27 and SI31's
    D9 exist to prevent.

## Push forward (journal the call)

Helper filenames/shape · extracting a helper to satisfy the complexity hook ·
tightening a ratchet a task made exact incidentally · regression tests authored
from a fixture's `in.puml` · probes under `scripts_scratch/T<N>/`, deleted
before commit · minor/patch dep bumps · **a fixture moving away from the jar
*with* a diagnosed `file:line` mechanism** — journal and continue (D6;
SI31's `sumiri-68-suvo696` precedent), do not halt and do not tune.

## Index

- [decisions.md](decisions.md) — D1…D6 (locked) ·
  [decision-journal.md](decision-journal.md) ·
  [expected-moves.txt](expected-moves.txt)
- [diagrams/component-map.md](diagrams/component-map.md) ·
  [diagrams/data-flow.md](diagrams/data-flow.md)
- **Source record:** `DIVERGENCES.md` "State diagrams" · SI31's close-out
  `plans/state-residual-fix-batch/README.md` · `planning/next-missions.md` §4
- Precedents: SI31 `plans/state-residual-fix-batch/` (harness/manifest gates,
  allow-list accounts, open-row rulings), SI27 `plans/shared-seam-extraction/`
  (one port of one upstream method).

## Close-out (2026-08-20)

**The plan changed mid-mission; the exit bar was still met.** T1 (Batch 1,
NO CODE) fired the brief's own stop 9: D1 placed the clip in "one pass, after
node geometry is final and before any consumer," and no such point exists in
this port. The state ink walk is not a terminal consumer —
`computeSvekResultGeometry` runs mid-assembly at
`state-composite-autonom.ts:268`, and its output becomes that composite's own
width/height in the CONTAINING pass (`state-composite-concurrent.ts:190` is
the same shape for region stacking). Clipping in a single late pass would
measure unclipped splines at those sites. Upstream turns out to have the
identical structure: `dot/CucaDiagramSimplifierState.java:57-71` builds every
autarkic group with its own `GroupMakerState.getImage()`, and
`svek/GraphvizImageBuilder.java:287-289` runs `dotStringFactory.solve(svg)`
then `new SvekResult(...)` **per layout result**, not once per diagram. D1's
global placement was therefore never the faithful port, independent of
whether this port could host it. The user ruled 2026-08-19, after
independently re-verifying T1's stop, to amend rather than re-plan: **D1'**
(clip inside `buildLevelTransitionGeos` at construction, per layout result),
**D1'a** (label attachment stays on pre-clip points — D5's guarantee was
temporal, not structural, and is preserved), **D2'** (clip rects come from
`result.clusters`, upstream's own provenance per `Cluster.java:511-512` /
`DotStringFactory.java:425-434`, not materialized `StateNodeGeo`), and
**D2'a** (a same-day correction to D2': the general provenance claim was
right, but was first written from the `SvekEdge.java:671` call site rather
than the method body that populates the rect — CLAUDE.md's most-violated rule,
caught and corrected before landing). Originals D1/D2 are left standing,
unedited, in `decisions.md`; the amendments supersede them explicitly. **D2's
isolation was knowingly spent**: rect provenance and clip timing moved
together, so no mover can be attributed to one independent of the other — the
mitigation was diagnosing every mover to a mechanism rather than inferring
one from the fact that it moved (D6).

**Movers: 41 of 2017 fixtures, all `state`, all SVG-hash-only, 0 DOT-hash, all
TOWARD the jar.** Re-verified this close-out, independently of T2's and the
orchestrator's prior counts: a `git worktree` at `f1720a14` (the last
docs-only commit before T2's fix) rendered the full manifest after installing
its own `node_modules` and vendoring `assets/stdlib` (both required —
omitting either makes render-manifest.ts report `{error: ...}` for nearly
every fixture, which the first pass of this re-measurement caught and is
recorded below as a number that needed correcting). Diffed against the
current tree's manifest: **exactly 41 movers, matching `expected-moves.txt`
in both directions** (0 measured-not-listed, 0 listed-not-measured). The
diff's one additional "unexpected" entry, `component/kofovu-01-niti223`, is
a pre-existing **untracked** stray fixture in `test-results/dot-cache/`
(confirmed via `git log --all` — zero history, `git status` shows it `??` at
session start) — not a code effect of this mission, and not in this task's
write-set to remove.

**Harness — direct byte-diff against T0's TRACKED pin, the gap SI31 could
not close.** `tests/fixtures/si32-harness-baseline.jsonl` (sha256
`fdff4e2c…4114`) byte-diffed (`cmp`) **identical** against a fresh
`measure-composite-declared-size.ts` run today: same sha256, same summary
**`273/2660/2576/47/37/0/39`** — unchanged from T0's pin, `harness-diff.py`:
`OK: 0 rows went exact, 0 rows appeared or grew`. This confirms the mission's
own claim (T2's journal entry) that the clip never touched canvas size, and
it is the first SI3x close-out able to say so from a byte-diff rather than a
journal chain. `fovafu-44-mifu394`'s declared-size row (scope 2, height) is
present, unchanged, and `match: false` in both the T0 pin and today's run —
the SAME row, byte-identical `deltaPx`. Its scope-2 **width** row does not
appear in either dump (mismatched-only), confirming it stays exact, as the
brief's exit bar required. Independently: `fovafu`'s manifest entry moved
(SVG hash `8a3e9f42…` → `5314992c…`) with its **DOT hash unchanged**
(`4fab029f…` both sides) — SVG-only, matching the "41 SVG-hash-only, 0
DOT-hash" claim for the whole mover set.

**Manifest gate vs the current pinned (post-T2) baseline**: `OK: 0 expected
moves, 0 unexpected` — this shows stability since the last re-pin, **not**
the mission delta (the baseline was re-pinned by T2 after its own fix
landed, per the brief's own gate design). The mission delta is the
independently-verified 41 movers above.

**The divergence is retired, and a narrower one is filed in its place — not
smoothed over.** `DIVERGENCES.md`'s old "State diagrams — Composite-anchor
transitions: `simulateCompound` clip applied to ink, not to the drawn path"
entry is deleted (verified in the code, not from T2's report:
`clipTransitionPoints` has no `src/` match; the ink walk and the renderer
both read the same `transition.points`, populated once at
`state-composite-pass.ts:370` and `layout.ts:178`). In its place,
`DIVERGENCES.md` "State diagrams" now carries: this port always clips against
the raw `result.clusters` cluster box, but upstream first adjusts that box
via `Cluster.java:410-430`'s `FrontierCalculator` for composites with a
direct border-point child (`SvekEdge.java:660-663`, gated by
`ClusterDotString.java:101-105`). Reachable on exactly **2 of the 41
movers** — `pesita-10-dene726`'s `AA` and `viroxo-69-fito663`'s `comp1` —
both still net-toward the jar under the raw-box clip; `pesita` retains the
largest residual spot-checked this mission (663.5 px). Porting
`FrontierCalculator` is out of scope (a second port of upstream arithmetic)
and is carried forward in `planning/next-missions.md` §4.

**SI31's own record is wrong on two fixtures — corrected here, not in its
file.** `plans/state-residual-fix-batch/expected-moves.txt:101-102` claims
`fajegu-17-joba577` landed 609→555 against jar 561 ("6px SHORT") and
`mefici-97-tudu030` landed 873→854 against jar 816 ("38px gap"). Re-measured
at SI31's own commits (T0's finding, re-confirmed here): `fajegu-17` is
614→**561**, exact vs the jar; `mefici-97` is 835→**816**, exact vs the jar.
Neither residual exists; this is a bookkeeping error in SI31's account, not
drift in the port. SI31's file is deliberately left unedited — it is outside
every SI32 task's write-set — so the correction is carried here and in
`planning/mission-index.md`'s SI32 row for a future reader to find.

**A second confidently-reported number failed re-measurement, mid-mission.**
T2 recorded `mefici-97-tudu030` as `820×673`, "NOT canvas-exact," at **High**
confidence, with a stated impact that a future task must not treat its width
as locked — the exact inverse of the truth. The orchestrator re-measured via
two independent render paths and found `816×673`, byte-exact to the jar's
`in.svg`, both today and at two earlier commits. Re-verified a third time
this close-out, independently: still `816×673`. All four of SI31's
ink-only movers (`fovafu-44-mifu394` 232×230, `tubojo-49-tudu915` 261×256,
`fajegu-17-joba577` 561×846, `mefici-97-tudu030` 816×673) are canvas-exact.

**This mission changed emitted SVG.** 41 of 2017 fixtures (2.0%) have a
different `<path d>` and, wherever the head end clips, a moved arrowhead
(D3 — `SvekEdge.java:679-684` builds both extremities from the reassigned,
clipped `dotPath`). Canvas size (width/height) is unchanged on all 41,
confirmed by the harness byte-diff above. **A downstream consumer pinning
golden SVGs will see diffs on those 41 fixtures**; a consumer pinning only
declared/DOT-derived size will see none.

**Ratchets, measured directly today.** DOT-parity `state 270/270`,
`class 721/721`, `description 357/357`, `object 80/80` — all unchanged from
SI31. `layering.test.ts`: 9/9 green, `KNOWN_DEBT` still `[]`.
`catalog.test.ts`: 2/2, not drifted.

**Coverage / wall-clock (measured 2026-08-20, this session).** `npm test`:
**619 files / 14,805 pass + 1 todo** (14,806) — up from SI31's 618 files /
14,795 + 1 todo, the +1 file / +10 tests being T2's new
`state-transition-clip.ts` module and its regression tests. Coverage
**95.42 / 90.33 / 96.94 / 96.51** — ≥ 90/90/90, unchanged from T2/T3's
recorded figures. Wall-clock: vitest's own report **55.60 s**, wrapped
`time` **56.73 s** — both under the 60.3 s ceiling (SI31 closed at ~55 s).
`npm run typecheck`, `npm run lint`: clean, no output. `npm run build`: exit
0 across three separate invocations; one of the three printed the brief's
"3 pre-existing `[unplugin:dts]`" TS2591/TS2503 notes during declaration
bundling (a `node:*` type-resolution diagnostic in the dts plugin's own
pass, not `tsc`'s own gate), the other two printed none — non-deterministic
but never blocking, consistent with the brief's characterization.

**Post-merge addendum (2026-08-20).** The first `npm test` run on `main`
after the merge commit (`3e65ead1`) clocked **62 s** — above the 60.3 s
stop-11 ceiling. Re-measured three times on the identical tree: vitest's own
`Duration` **57.64 s / 56.37 s / 57.35 s** (wrapped wall 59/57/59 s). The 62 s
reading was contention from a `npm run build` finishing moments earlier, not a
regression — source is byte-identical to the branch tip that measured 56 s on
three separate batches. Stop 11 did not genuinely fire, and the outlier is
recorded here rather than discarded. **The margin is nonetheless thin**: this
mission added a test file and ~10 tests and sits ~3 s under a ceiling set when
the suite ran ~55 s. The next state mission should expect to renegotiate the
ceiling rather than trim coverage to fit it.

**Per-task commits** (branch `fix/state-anchor-clip-retire`, off `main` at
or after `4895623b`, not yet merged at close-out): `1c674757` T0 (tracked +
gitignored baselines), `e5a60bdd` T1 (stop 9 — D1's placement impossible),
`7b745c87` + `f1720a14` (orchestrator: D1/D2 amendment, then a same-day
correction to D2' from the method bodies rather than the call site),
`276954ab` T2 (the clip — `state-composite-pass.ts:370`, `layout.ts:178`;
new `state-transition-clip.ts`; `clipTransitionPoints` and
`collectAnchorRects`'s `StateNodeGeo` threading deleted), `00b449b3`
(orchestrator: T3 task-file amendment recording the border-point finding),
`6544eab5` T3 (delete the old `DIVERGENCES.md` entry, file the new one, fix
a stale `^1.5.0`/tarball-label pair in `docs/architecture/overview.md`, file
three follow-on candidates in `planning/next-missions.md`).

**Flags for the maintainer.**
1. `FrontierCalculator`'s border-point clip-rect adjustment
   (`Cluster.java:410-430`) is unported — reachable on 2 of the 41 movers
   today (`pesita-10-dene726`, `viroxo-69-fito663`). Filed as its own
   candidate in `planning/next-missions.md` §4; it is a second port of
   upstream arithmetic and should be scoped as its own task before starting.
2. `alignEdgesAtLabelNodes` (`DotStringFactory.java:461-463`, ORTHO-gated)
   and state-side `manageCollision` (`SvekEdge.java:1205-1216`, ported for
   class only) remain unported — both filed in `planning/next-missions.md`
   §4 by T3.
3. SI31's three open hypotheses (`pavuzo-79-zodu430`, `jetuse-93-gopi146`,
   `kejabo-83-vinu490`) are untouched by this mission and remain exactly as
   SI31 left them.
4. `planning/next-missions.md` §4 already marks the divergence-retirement
   item DONE and carries T3's follow-on filings — verified this close-out,
   not duplicated.
