# T5a — diagnose lifeline x placement and lifeline count

Agent: `debugger` (opus), worktree `sdd2-T5a` (scratch only). No commit to
`src/`; the orchestrator commits the artifact:
`docs(sdd2-T5a): diagnose lifeline x and count residuals`.
Read [../task-contract.md](../task-contract.md) and
`~/.claude/rules/diagnosis.md` first. Instrument before hypothesising.

## Clusters (research B "Unconfirmed remainder"; re-measure at the B4 close)
1. **First lifeline x differs** (160 rows at planning; ours usually left of
   the jar). Features: group 74, box 56, note 44, exo 31, participant
   shapes 19, `ParticipantPadding` 9. A sample of box rows (bofovo,
   fugilu, cinula, demeli) points at Dolls / englober extents:
   `teoz/Dolls.java` (`getMinX`/`getMaxX`), `PlayingSpace.java:81-84`.
   Ruled out at planning: M1–M5 alone.
2. **Later lifelines differ, no self gap** (94) and **self present, gap
   mismatch** (10).
3. **Lifeline count differs** (37): ours vs the jar draw a different number
   of lifelines — find which (created participants? hidden? boxes?).
4. **Nested boxes** (research D cluster I, 7 rows: nekeso, vekivu, kuniko,
   lokole, vinefa, binupo, rujimo): `SequenceDiagram.java:501-514`
   (`newChild`/`getParent`), `teoz/Dolls.java:84,116`; the port's flat
   `BoxGroup` (`command-grouping.ts:33-68`). Likely shares cluster 1's
   Dolls mechanism.

## Method
- Re-derive the cluster membership from `$M/b4-classify.json` (diff keys
  on lifeline `line/@x1`, participant `rect/@x`, `svg/@width`).
- Use `prototypes/width-predictor.mts` and `$T/diff-one.mts`; add
  temporary tracing in a scratch copy, never in the mission branch.
- Read `teoz/PlayingSpace.java`, `Dolls.java`, `Doll.java`,
  `LivingSpace.java`, `LivingSpaces.java` constraint setup.

## Write-set
`plans/sequence-divergence-drive-2/diagnosis/x-offset.md` only.

## Acceptance
- Given each cluster, then the artifact has a complete section (format in
  the batch overview) or an "Unexplained" entry naming what was ruled out
  and what to instrument next.
- Given each proposed fix, then its write-set and expected rows are
  explicit enough for the orchestrator to spawn it.
