# Architecture decisions (locked 2026-09-20)

Contradicting one is stop 3.

## D1 — Registration order is frozen
Inherited from `routing-heuristic-repair` D1: the plugin order in
`src/index.ts` is load-bearing. Fixes narrow a claim or make a parser refuse;
nothing reorders or re-registers a plugin.

## D2 — Fix-or-pin criterion
**Fix** when the mechanism is (a) an over-claim in a dispatch heuristic or
probe (`block-extractor.ts`, `descriptive-keywords.ts`, an engine's
`index.ts`), (b) a parser silently accepting lines it should refuse
(`PSystemCommandFactory.java:169-175` strictness), or (c) exactly one missing
upstream `Command` whose port is small and self-contained (≤ ~60 NLOC, no new
model). **Pin** (`known-misroute` / `known-gap`, reason with `File.java:line`)
when it is a whole unported command family (legacy `(*) -->` activity,
`activitydiagram/`), an unported engine (`PSystemBuilder.java` factory line),
or a defect already filed under its own note (`.agent-notes/
tim-nested-call-argcount.md`). "Too big to fix" is argued from the upstream
source in the diagnosis note, never asserted.

## D3 — A fix is judged by where the fixture lands
Re-measured through the gates' own seams (`renderSync` + `DeterministicMeasurer`
+ `fixtureIncludeStore()`, root `data-diagram-type`, PSystemError banner) after
the change, over the parked tree AND the existing 4484. Landing on a third
engine is stop 5. Inherited from `routing-heuristic-repair` D2.

## D4 — One ledger, written as per-task fragments
`tests/oracle/svg-conformance/unknown-ledger/<task>.json`, one file per task,
so parallel tasks never share a writer. Row:
```
{ slug, cohort, disposition: "agree" | "jar-error" | "known-misroute" |
  "known-gap" | "fix-candidate" | "fixed", reason?, seam?, command?, size?, task }
```
`reason` is REQUIRED for `known-misroute`/`known-gap` and must match
`/\w+\.java:\d+/`. Batch 2 tasks flip `fix-candidate` rows to `fixed` (or to a
pin with reason) in the SAME fragment file, which they then own. The pins are
generated from the fragments (D5), never hand-written.

## D5 — The pin generator is committed
`scripts/pin-corpus-tree.ts <type> --tree <dir> --ledger <dir> [--dry]`:
measures every fixture of the tree through the gates' seams, joins the ledger
by slug, derives each row's routing status (agree / jar-error / known-misroute
+ reason) and refusal status (ok / jar-error / known-gap + reason), appends
to both baselines, and REFUSES to write unless every pre-existing row is
byte-identical and every measured disagreement has a ledger reason. Third
mission to write this as scratch; measurement must survive compaction.
Orchestrator-only, like `repin-activity-baselines.ts`.

## D6 — Tasks measure the parked tree by path
The 825 renders stay at `test-results/dot-cache-unknown-2026-09-20/` through
batches 0–2 so both gates stay green in every commit. T14 pins, then moves the
tree to `test-results/dot-cache/unknown/`, then commits both together (the
`new-corpus-tree-trips-two-gates` order).

## D7 — No "unknown queue" in the refusal gate
Every fixture that errors here on a source the jar rendered ends `fixed` or
`known-gap`; the invariant "the only non-gapped defect outside activity is
nuvoja" is preserved as written. The activity-style honest-record queue is
not used here: adjudicating these rows IS the mission.

## D8 — The dashboard's `unknown` row shows its numbers
Engine cell stays `n/a (accounting bucket)` (D7 of `parity-dashboard-refresh`
stands: it is not a type). Oracle, DOT, survey, census, ratchet, diff-baseline,
routing and refusal cells follow the normal column rules; the no-engine
override (`parity-dashboard-matrix.ts#noEngineColumn`) must not fire for it.

## D9 — Narrow, never widen
Inherited from `routing-heuristic-repair` D3, including its two named
under-claim exceptions as the only ones.

## D10 — Every batch ends green
The four gates plus the drift test. Any commit that moves a pin, a cache tree
or a survey artifact runs `npm run parity:dashboard` in the same commit.

## D11 — Cross-seam mechanisms are fixed in both seams (user ruling 2026-09-20)
Amends stop 8 and D2 for this mission. When a fixture lands on the jar's
engine only after two seams change (one engine stops over-claiming AND
another gains the upstream Command), BOTH changes are made, each in its own
seam task, and the landing is judged (D3) after both are on the mission
branch. The intermediate state (one seam changed) is never a commit on the
mission branch's batch boundary; a seam task reports the intermediate
landing and does not treat it as stop 5. Jar behaviour is the target; a
divergence is never kept because matching it needs two files.

## D12 — No size bar on a faithful port (user ruling 2026-09-20)
Amends D2(c). A missing upstream `Command` is ported faithfully regardless
of NLOC; long Java is split into hook-sized functions (≤30 NLOC, CCN ≤10)
that keep upstream's names and structure. "Too big" is not a pin reason in
this mission. Pins remain for unported engines/factories, whole unported
families upstream itself routes elsewhere, and defects already filed under
their own note (D2's other arms are unchanged).
