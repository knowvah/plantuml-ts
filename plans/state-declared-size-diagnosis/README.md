# Mission: state-declared-size-diagnosis (SI28)

**Diagnose, to a `file:line` mechanism each, every state-engine node whose
DECLARED graphviz size differs from the jar's, and re-partition them by TRUE
shared cause so a fix mission can be planned straight off the output.** This
mission writes **no source code** (decisions.md ADR-2). Chosen 2026-08-18 from
`planning/next-missions.md §4` after S1L-e/i/j were found already done
(`d9f0ddda`). Precedent for shape and schema: `plans/s1l-tail-diagnosis/`.
Register row **SI28** at T14.

**Branch:** `docs/state-declared-size-diagnosis` · **Merge:** merge commit ·
**Agents run no git** — the orchestrator commits each task by pathspec
(ADR-8; SI27's shared-index incident).

## The oracle

`scripts/measure-composite-declared-size.ts` (T1 of the halted
`plans/state-composite-inner-canvas/` — read its HALT banner first): for
every state fixture in `test-results/dot-cache/state/<slug>/`, compares the
`width`/`height` (inches) this port DECLARES per svek scope against the jar's
cached `svek-N.dot`. Scopes pair by index; nodes pair by SORTED value per
axis, so a mis-pairing is possible and every row carries both values.
`npx jiti scripts/measure-composite-declared-size.ts --mismatched-only`.

## Starting state (pre-planning 2026-08-18 at `d9f0ddda`; verified unchanged at T0, branch point `e544038d`, baseline sha256 `b790fabc…505e0`)

272 fixtures · **2654** declarations · **2481** exact · 173 inexact =
**120 rows / 63 fixtures** with |Δ| ≥ 0.05 px + **53 sub-pixel rows / 27
fixtures** with only |Δ| < 0.05 px (29 last-digit) + **4 unmatched** fixtures
(scope count differs). First-match labels (provenance only, ADR-3):
composite 20 · concurrent-region 8 · pseudo-state 7 · skinparam-style 7 ·
attribute-line 6 · stereotype 5 · other 4 · note 3 · creole-sprite+escape 3.
Repeated |Δ|: 36 px ×7, 28 ×6, 10 ×5, 12/40/21 ×3, 445 ×2, 80 ×2 — an
identical delta is ONE shared cause until evidence says otherwise.
Preview slices: [findings/PARTITION-preview.md](findings/PARTITION-preview.md); final slices (T0): [findings/PARTITION.md](findings/PARTITION.md) — identical to the preview.

## Exit bar (score clause by clause; do not reword)

1. Every one of the 94 fixtures (63 + 27 + 4) has exactly one record in
   `findings/*.md` on `findings/SCHEMA.md`: `originFileLine` is a real
   `file:line`, a Java citation, non-empty `ruledOut`; `unresolved` records
   carry `nextStep`.
2. `findings/SYNTHESIS.md` re-partitions all 94 by TRUE mechanism; every
   repeated |Δ| is either one group or explicitly reconciled; each group has a
   proposed write-set + size estimate; a fix-mission batch proposal with
   disjoint write-sets.
3. `findings/METRIC-AUDIT.md` gives every mismatched fixture a `pairingRisk`
   and a proposed (not implemented) id-aware pairing.
4. `git diff --name-only <branch-point>` contains no `src/`, `tests/`,
   `oracle/`, `scripts/` path; the close-out harness run is byte-identical to
   the T0 baseline.
5. Four quality gates green (unchanged, docs-only tree); SI28 row in
   `planning/mission-index.md`; `planning/next-missions.md §4` updated.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Baseline + PARTITION + SCHEMA check | T0 | [x] |
| [1a](batch-1a/overview.md) | Bucket diagnosis (parallel) | T1 T2 T3 T4 T5 T6 T7 | [x] |
| [1b](batch-1b/overview.md) | Bucket diagnosis + precision + unmatched + audit (parallel) | T8 T9 T10 T11 T12 T13 | [x] |
| [2](batch-2/overview.md) | SYNTHESIS + close-out | T14 | [x] |

1a and 1b are disjoint and MAY run as one 13-way batch.

## Quality gates

```
- command: npm test
  pass: exit 0
  on_fail: fix_and_rerun   # docs-only tree — a failure means src drift: STOP
- command: npm run typecheck
  pass: exit 0
  on_fail: stop
- command: npm run lint
  pass: exit 0
  on_fail: stop
- command: npm run build
  pass: exit 0
  on_fail: stop
- command: git diff --name-only <branch-point>..HEAD | grep -E '^(src|tests|oracle|scripts)/' ; test $? -eq 1
  pass: no output (grep finds nothing)
  on_fail: stop
- command: npx jiti scripts/measure-composite-declared-size.ts --mismatched-only > /tmp/sds-now.jsonl && cmp /tmp/sds-now.jsonl test-results/state-declared-size-baseline.jsonl
  pass: cmp silent (byte-identical to T0)
  on_fail: stop
- command: python3 plans/state-declared-size-diagnosis/findings/check-schema.py   # written by T0
  pass: "94 records, 0 violations"
  on_fail: fix_and_rerun
```

## Stop conditions

1. Any path under `src/`, `tests/`, `oracle/`, `scripts/` in the diff.
2. A task must write outside its own `findings/<name>.md` (T0/T14 excepted).
3. Close-out harness run ≠ T0 baseline — do not re-baseline.
4. Two consecutive schema-check failures on the same file after one fix.
5. A finding contradicts a locked ADR (declaring a divergence; editing the
   harness for id-aware pairing).
6. > 10 % of a bucket `unresolved` with the same `nextStep` — a missing tool,
   not per-fixture work.
7. `.claude/catalog.md` absent — do NOT create it.
8. Same fixture re-diagnosed 3× to a different `originFileLine`.

## Push forward (journal the call)

Re-slicing a fixture whose label is obviously wrong (keep `bucketLabel` as
provenance) · `<slug>#a/#b` split on distinct causes · merging buckets under
one `sharedCauseWith` in SYNTHESIS · `already-conformant` if T0 re-measure
differs from the preview · probes under `scripts_scratch/` (deleted before
commit); gated temporary tracing in `src/` ONLY if reverted before commit ·
recording proposed harness improvements in METRIC-AUDIT · choosing among
several plausible Java owners by reading them all and citing the method body
that produces the number.

## Index

- [decisions.md](decisions.md) — ADR-1…ADR-9 · [decision-journal.md](decision-journal.md)
- [findings/SCHEMA.md](findings/SCHEMA.md) — the record format (T0 adds `check-schema.py`)
- [diagrams/component-map.md](diagrams/component-map.md) · [diagrams/data-flow.md](diagrams/data-flow.md)
- [findings/SYNTHESIS.md](findings/SYNTHESIS.md) — the true-cause re-partition + fix-mission proposal (T14)
- Precedents: `plans/s1l-tail-diagnosis/` (shape), `plans/state-composite-inner-canvas/`
  (harness, HALT banner, `layout-ink-extent.ts:391` finding), `plans/transition-label-ink/`,
  `plans/shared-seam-extraction/` (SI27 T1 `\t` note, `.agent-notes/si27-t1-*`).

## Close-out (2026-08-18)

**Result: 5 of 5 exit-bar clauses MET, two orchestrator corrections flagged.**
94 fixtures / 100 records / 173 harness rows diagnosed into **24 true-cause
groups**; **75 fixtures fully resolved**, 1 partial, **14 unresolved**, 4
`divergence-proposed`. By record: 81 resolved / 15 unresolved / 4
divergence-proposed.

**Clause 1 — one record per fixture, on SCHEMA.** ✅
`python3 findings/check-schema.py` → **`94 records, 0 violations`** (100
record blocks: six legitimate `#a`/`#b` splits on `fibudu-53`, `xeziki-47`,
`fovafu-44`, `jorere-75`, `ketibo-84`, `zitifa-97`). Every `resolved` record
carries a real `file:line` origin, a Java citation and a non-empty
`ruledOut`; every `unresolved` record carries a `nextStep`.
*Flag (closed):* `skinparam-style.md`'s `kejabo-83-vinu490` rows table had
omitted one of its two baseline rows (`scope 2 / height / idx 2 / −0.000`);
added by the orchestrator in `fix(T5)` `d2e44edf` — 173 of 173 rows carried.
METRIC-AUDIT's re-cache proposal for the 4 unmatched fixtures was withdrawn
in `fix(T13)` `8eb3ec0e` (they are jar error renders, per T12). SYNTHESIS §7.3.

**Clause 2 — SYNTHESIS re-partitions all 94; every repeated |Δ| one group or
reconciled; per-group write-set + size; disjoint fix batches.** ✅
24 groups, verified disjoint and exhaustive (100 assigned, 0 missing, 0
duplicated). All **28** repeated-|Δpx| values reconciled one by one
(SYNTHESIS §2): 13 one-group, 15 explicitly split with the evidence — the
sharpest being `2.6 ×5` (+2.550 raw `[[S1]]` vs −2.575 `<<O-O>>` clamp,
opposite signs), `28 ×6` (backslash continuation vs EXPANSION_* rankdir) and
`1.0 ×8` (five distinct causes). Every group has a proposed write-set, size
estimate, confidence and pairingRisk summary. Fix mission
**`state-declared-size-fix`**: **5 batches** (0 harness · 1 six parallel text
and leaf tasks · 2 two composite-geometry tasks · 3 two overlapping-tail
tasks · 4 eight re-diagnosis tasks), pairwise-disjoint write-sets within each
batch, biggest-delta-first, each exit stated as harness rows going exact.
G14 (30 records, all ≤ 0.005 px, `graph-layout.ts`) is explicitly **not
scheduled** and the reasoning is recorded.

**Clause 3 — METRIC-AUDIT: pairingRisk per fixture + proposed id-aware
pairing.** ✅ All **90** mismatched fixtures rated (**none 73 / possible 17 /
likely 0**), proven by an exhaustive `O(n²)` re-pairing over 205
scope-instances: sorted pairing is already the error-minimizing bijection
everywhere, so **no reported Δ can be wrong**. Candidate B
(declaration-order pairing after a `shape === 'point'` filter, 100 % real-node
alignment on all 205 scopes) is proposed, not implemented — it becomes the
fix mission's T0. Eight records self-label `likely` on a looser rubric;
reconciled in SYNTHESIS §7.2 with the audit authoritative.

**Clause 4 — no `src/ tests/ oracle/ scripts/` path; harness == T0
baseline.** ✅ `git diff --name-only e544038d..HEAD` = 22 paths, all under
`plans/state-declared-size-diagnosis/` plus one `.agent-notes/` file; the
`grep -E '^(src|tests|oracle|scripts)/` filter returns nothing. Close-out run
of `npx jiti scripts/measure-composite-declared-size.ts --mismatched-only`
`cmp`s **silent** against `test-results/state-declared-size-baseline.jsonl`
(sha256 `b790fabc…505e0`). No re-baseline.

**Clause 5 — four gates green; SI28 row; next-missions §4.** ✅ for the
docs; gates run by the orchestrator after T14 on the final tree: `npm test`
601 files / 14,599 pass (coverage 95.41 / 90.40 / 96.93 / 96.50) · typecheck
✓ · lint ✓ · build ✓ · harness `cmp` silent · schema `94 records, 0
violations` · no `src/ tests/ oracle/ scripts/` path in the diff. SI28 row added to
`planning/mission-index.md` after SI27; `planning/next-missions.md` §4's
`state-composite-inner-canvas` bullet replaced with a DONE line pointing at
`findings/SYNTHESIS.md` and naming `state-declared-size-fix`.

### Numbers

| | |
|---|---|
| fixtures / records / rows | 94 / 100 / 173 (172 carried by records) |
| true-cause groups | **24** (9 unresolved-only, 1 divergence-proposed, 14 with a fix path) |
| fixtures resolved / partial / unresolved / divergence | 75 / 1 / 14 / 4 |
| largest single group | G1 (state text measured raw) — 16 fixtures, 23 rows, max Δ 445.200 px |
| largest single Δ | 445.200 px (`jafazu-60`, `rejike-58` — `skinparam wrapWidth` never consumed) |
| deliberately unscheduled | G14 — 30 records / 27 fixtures, all ≤ 0.005 px |
| stop conditions triggered | none (stop 6 checked: the 15 unresolved records span **7** distinct nextStep families, not one missing tool) |

### Flags

1. `kejabo-83-vinu490`'s record is missing its second baseline row (above).
2. `METRIC-AUDIT.md` §5 / §6-item-2 frames the four unmatched fixtures as an
   "absent-oracle caching gap" and proposes re-caching; T12 read the sources
   and the jar **errors** on all four, so there is nothing to cache. Item 2
   should be struck; items 1, 3, 4 stand. Stated T12's way in SYNTHESIS.
3. Two inherited-mechanism lists did not survive re-derivation (ADR-4's exact
   failure mode): `size-backlog.json`'s RE-PIN group of six is **three**
   (`bajelo-54`/`fotuje-06` have no row in that band; `pavuzo-79` is a
   different mechanism), and `gokife-89`'s adoption of the `RoundedSouth`
   family is refuted by shape (single-node scopes, no composite outer box) —
   it stays unresolved as its own group.
4. Batch-1 gate saw one non-reproducible `npm run typecheck` failure
   (`include-resolver-node.ts` TS2591) when run immediately after `npm test`
   in the same shell; three consecutive clean runs after, tree unchanged.
   Environment flake, recorded in the journal, not src drift.

### Follow-ups

- **`state-declared-size-fix`** (5 batches, SYNTHESIS §4) — the whole point of
  this mission. Start with Batch 0 (harness attribution) so every later row
  names a declared node.
- **G24 divergences — rulings 2026-08-18** (SYNTHESIS §6, records corrected
  after orchestrator re-verification against the jar): `checkConcurrentStateOk`
  guard → **RULED: port it** (covers cagego, xacona AND zecivu — zecivu's
  "dispatch order" mechanism was wrong; the jar tries every factory and its
  state factory trips the same guard); fugedo dotted-path → it is a **walking
  error** (we build and draw the same phantom `Quark#child` builds) —
  **RULED: port the `parent.getData()==null` gate** (same write-set as the
  concurrent guard); dispatch order → withdrawn. Both guards are fix-mission
  tasks; no `DIVERGENCES.md` entry needed.
- **`docs/graphviz-issues/` candidates**: G20 (`linetype polyline`/`ortho`
  composite ink) and G21 (`zacajo-09`, byte-identical DOT, different geometry)
  are likely dot-engine findings, which must be filed as a self-contained
  `.md` + a `TRACKER.md` line, not left in a ledger.
- **Two observations still to file** in `.agent-notes/` (SYNTHESIS §8):
  CLAUDE.md's "everything else shells out to real graphviz" is stale
  (`src/core/graph-layout.ts:15` imports `@knowvah/dot-engine`;
  `src/diagrams/state/layout.ts:27` calls it), and
  `layout-ink-extent.ts:82-85`'s arrowhead over-reach comment is not
  reproduced by G6's exact geometry.
