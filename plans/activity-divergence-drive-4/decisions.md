# Architecture decisions: add4 (approved 2026-10-07, "approve all")

Scope answers: cohort = add3's 48 open rows + the 80 uncaptured corpus fixtures;
EMBED out (oracle seam).

## D1: capture the 80 in one orchestrator commit
`scripts/capture-oracle-cache.ts` (oracle seam flags) writes
`test-results/dot-cache/activity/<slug>/` for every `tests/corpus/activity/*.puml`
without a capture. Routing and refusal rows are pinned in the SAME commit (memory
new-corpus-tree-trips-two-gates); new rows enter the four activity baselines via the
re-pin promotion pass; jar errors become `jar-error` rows. No existing cached oracle
byte changes (stop 9).

## D2: re-census before fixing
T0c/T0d census every baseline row (old 48 + the new), split at ws 100, with the add3
tools; sandbox proofs allowed out of repo. Batch 1 is fixed regardless; the census
shapes batches 2-3.

## D3: batch 1 = add3 measurement debts
Switch `getYdelta1a` (`FtileSwitchWithManyLinks.java:412-423`; literal 21, jar 32) is
settled by authored multi-line case-label oracle fixtures — never fit 32. `swimlaneWidth`
behaviour is established by oracle A/B renders before any core handler (add3 T3e: 400 vs
9000 byte-identical; `same` does not equalize). NOTE-MULTI: `TextBlockMarged` UEmpty in
the canvas ink; note `#color` parsed. Spot letters from new captures.

## D4: EMBED open -> add5
The deterministic oracle reserves a fixed 42x42 slot for `{{ }}` (memory
oracle-seam-embedded-42x42); moving it needs a fork-side change (stop 8). Not in add4.

## D5: spot glyph table grows by capture only
New circle-spot letters are added to `activity-spot-glyph-data.ts` from cached oracle
SVGs, normalized to (10,10), with a round-trip test (add3 T3g / class-badge precedent).

## D6: census away-from-jar + element sweep at every merge
After each task merge the orchestrator re-pins into a scratch copy and runs
`measurements/census-away.py`; any attribute moving AWAY from the jar needs a mechanism,
and any row whose element-count delta grew is a fix task, never an accepted rise.
(add3: two dropped-element regressions hid behind falling scores.)

## D7: exit bar
- Every `fixtures.md` row `final` ∈ `pinned (<tag>)`, `open -> add5 (<mechanism>)`.
- Four gates green, collected = on-disk; golden ratchet + harness-parity green.
- 0 conformant losses in any engine (b0 -> final); 0 unexplained rises.
- **>= 340 activity fixtures pinned; Σ over add3's 48 rows <= 2200.**
- All 80 captured, routed, pinned in routing/refusal, and given a census family.
A miss is acceptable only when every short row is mechanised.

## D8: execution rules
`common-rules.md` first in every agent prompt (no Serena, no stash, foreground surveys
one engine per command, worktree paths). Parallel tasks in `measurements/mkwt.sh`
worktrees. A stalled agent: inspect its worktree, resume via SendMessage. Klimt/core
edits allowed when named in the write-set, all-engine survey before/after.

## D9: no staging gate survives
`isActionSheetEligible` fallbacks (non-LEFT alignment, missing `UHorizontalLine` SVG
driver, `[[url]]` hyperlink theme) and any other heuristic/legacy path are retired or
replaced by the upstream structure before T-exit (batch 3 sweep task).
