# Architecture decisions: cdd5 (approved 2026-09-27, "Approve all")

Scope answers (planning Phase 2):
- Scope is the re-pin plus the unknown-CLASS drive.
- The pin target is 8beta1 at upstream `97a5992`.
- The stray fork commit gets dropped.

## D1: a pin the re-pin breaks is unpinned, not preserved
Some pinned fixtures, in any engine, will match 7beta11 but not 8beta1.
Re-baseline the golden to 8beta1, remove the fixture from its ratchet, and give it
a journal row plus a `fixtures.md` row whose mechanism names the upstream commit or
Java file. Keeping 7beta11 goldens would pin a jar we no longer run. Class losses
become drive rows; non-class losses are filed (D2).

## D2: non-class engines are measured, not fixed
After the re-pin, classify every non-class mover as one of:
- **upstream change** (the jar output moved, the port did not): name the Java
  file from `git -C ~/git/plantuml diff 11ed6720 97a5992 --stat`;
- **reveal** (the port already followed 8beta1).
Sample-based classification is acceptable for engines with more than 20 movers:
sample ≥ 5 per engine, with the count stated. Put everything in next-missions as a
per-engine entry. No `src/` fix for a non-class engine in this mission.

## D3: the class census renders through renderSync
The class census calls `renderSync(markup, { measurer: new DeterministicMeasurer(),
assetStore, includeStore })`, so census = survey minus the measurer. That removes the
forced-parser and entity-collision-guard drift (luzive, sadamo, sokevu) at the
root, and it makes unknown-bucket CLASS fixtures censusable with no new pipeline.
Other engines' census paths are unchanged. If a previously census-0 class fixture
rises under this change, it is a mechanism to state (stop 5), not a reason to revert.

## D4: one class ratchet with a `tree` field
`oracle/goldens/svg-class/ratchet.json` entries gain an optional
`tree: 'class' | 'unknown'`; absent means `class`. The key is `tree/slug`. Goldens for
`tree: unknown` live at `oracle/goldens/svg-class/unknown/<slug>/`. `pin-goldens.mts`
takes `--tree <t>`. The routing/refusal twin rows are cloned from the matching
`dot-cache`/`<tree>` row.

## D5: diagnosis before fixes; families set the batches
Batch 2 assigns every non-conformant CLASS row, from both buckets at b1, a mechanism
family citing the upstream Java `file:line` and the port `file:line`. T10 ranks the
families by rows closed per file touched and generates the batch 3–5 task specs, with
collision-free write-sets, from `batch-3/TEMPLATE.md`. Parallel fix agents run in git
worktrees (memory: batch-parallelism-needs-worktrees). A row with no stated
mechanism is never "fixed".

## D6: exit bar
- Every CLASS row in `fixtures.md` has a mechanism and a `final`: `fixed`,
  `open -> cdd6`, or `accept-candidate`.
- Zero conformant losses against b1, and zero unexplained rises, in every engine.
- Class DOT parity is green, and the four gates are green with collected = on-disk.
- Numeric target: T10 journals it as b1's conformant CLASS count (both buckets) plus
  the row count of the families scheduled into batches 3–5. There is no halt for
  approval. Missing it by rows whose fix revealed a deeper mechanism is acceptable
  when each row is journaled.

## D7: the executor never signs an acceptance
A row that looks like a deliberate divergence gets `final = accept-candidate`, with
evidence in `fixtures.md`, and stays `open -> maintainer`. The 17 existing entries in
`oracle/accepted-divergences.json` are re-verified against 8beta1. If an entry's
premise changed, flag it in the journal and next-missions; do not rewrite its reason.

## D8: fork cleanup and jar reproducibility
In `~/git/plantuml`:
1. `git branch dot-output-pre-cdd5 dot-output`;
2. `git rebase --onto 377fbd12dce 7726a27b12e dot-output`, which drops the stray
   plantuml-ts planning commit and leaves the 2 seam commits on `97a5992a`;
3. `oracle/build-oracle.sh` with no `ORACLE_ALLOW_DRIFT`;
4. `cmp` the fresh jar against `build/libs/plantuml-1.2026.8beta1.jar` (copied aside
   first, because the build overwrites that name).

A mismatch is stop 8: an unreproducible build means pinning an unknown. Never push
the fork, and never touch its `master`.

## D9: error-page identity (luzive, sadamo)
Keep the port's `plantuml-ts version 0.1.0 / unknown` banner. Re-verify both entries
against 8beta1 and update only the evidence line (date, version), per D7.
