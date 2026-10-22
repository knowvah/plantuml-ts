# T5b — diagnose note x, create/divider/ref misses, delay Y

Agent: `debugger` (opus), worktree `sdd2-T5b` (scratch only). The
orchestrator commits the artifact:
`docs(sdd2-T5b): diagnose note x and delay residuals`.
Read [../task-contract.md](../task-contract.md) and
`~/.claude/rules/diagnosis.md` first.

## Clusters (re-measure at the B4 close)
1. **Note x** (28 rows where lifelines match but the width model misses;
   e.g. cetale, lezonu, xatotu): note placement relative to lifelines /
   tiles — `teoz/NoteTile.java`, `CommunicationTileNote*.java`,
   `skin/rose/ComponentRoseNote.java`.
2. **Create / divider / ref** misses in the same research B group (13
   create, 6 divider, 2 exo, a ref margin the predictor approximates).
3. **Delay / space Y** (camuxi, xinope, xucibo): `teoz/DelayTile.java`,
   `HSpaceTile.java`, `ComponentRoseDelayText.java`.

## Method
As T5a: re-derive membership from `$M/b4-classify.json`; trace in a
scratch copy; read the tile classes above and the port modules they map
to (`sequence-layout-note.ts`, `sequence-delay.ts`, `sequence-layout-
divider.ts`, `sequence-layout-ref.ts`).

## Write-set
`plans/sequence-divergence-drive-2/diagnosis/note-x.md` only.

## Acceptance
- Given each cluster, then the artifact has a complete section or an
  "Unexplained" entry with ruled-out evidence.
- Given each proposed fix, then its write-set does not collide with
  another proposed fix, or the collision is called out.
