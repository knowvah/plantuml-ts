# sdd2 — architecture decisions (locked 2026-10-21)

Approved by the user in planning. A finding that contradicts one is stop 3:
amend here (dated "Amendment N"), then halt.

| ID | Decision (one line) |
|---|---|
| D1 | sdd1's pins / reference-and-loss / execution rules carry forward |
| D2 | Research C's patches are reference + expected results, never applied |
| D3 | Re-mirror the teoz structures: YGauge, LiveBoxes, note-on-message tiles |
| D4 | Batch 0 splits the over-cap files as pure moves |
| D5 | Sequence labels go through core `DisplayCreole`; parity probe first |
| D6 | Core preprocessor + core creole in scope; survey after every core commit |
| D7 | The unexplained remainder gets diagnosis tasks before any fix |
| D8 | Batch order: splits → small fixes → V → H → T → remainder → creole → structural → core |
| D9 | Target: every zero-diff row pinned, floor 560; 0 conformant losses |
| D10 | No accepted divergences; two stale premises get corrected |
| D11 | Many commits while running; one commit per batch at the end (squash batch) |

## D1 — sdd1 rules carry forward

**Decision.** Unchanged from `../sequence-divergence-drive/decisions.md`:
- **Pins (sdd1 D6).** A pin requires a zero-diff `renderFixtureSequence`
  render (`DeterministicMeasurer`, `fixtureIncludeStore()`) against the
  cached `in.svg`. The `renderSync` survey is taken at every close; a
  fixture where the two disagree gets a journal row with its mechanism
  (stop 13 if not isolated). Baselines re-pin once per close. Falls are
  adopted; every rise needs its own mechanism line.
- **Reference and loss gate (sdd1 D7).** b0 is the reference; every close
  surveys every engine into `$M/bN-eng/` and diffs against the previous
  close. No fitting: every numeric change carries its upstream `file:line`
  in the same commit.
- **Execution (sdd1 D9).** `$M/mkwt.sh <Tn>` worktrees; agents run targeted
  vitest + typecheck + eslint, no Serena edit tools, no `git stash`; the
  orchestrator runs the four gates + the full conformance set at
  `--maxWorkers=4` before every merge.

## D2 — Research C's patches are reference only

**Context.** `prototypes/m_*.patch` reproduce six vertical mechanisms in a
scratch copy (all on: 419 → 478 zero, 0 pinned lost, 0 rises). They keep
side state in WeakMaps and shift y generically — not upstream's structure.
**Decision.** Reimplement every mechanism from the Java. The patches and
`loo_*.json` (fixtures that fail to reach zero when that mechanism alone
is off) are the expected results: a task lands its mechanism only when its
LOO set goes to zero, or each straggler has a journaled mechanism.
**Consequence.** Prototype numbers are data, not a contract (push-forward).

## D3 — re-mirror the teoz structures

**Context.** The port's vertical model is a cursor: a message's arrow y is
handed to the first life event only (`cursor.lastMessageY`, consume-once),
on-message notes are stacked below the message, and `&` parallel is
parsed and never read. **Decision.** Port the upstream structures:
`YGauge.createParallel` (`teoz/YGauge.java:124-145`) for `&`; the
note-on-message wrapper tiles (`teoz/CommunicationTileNoteLeft/Right.java`,
`CommunicationTileSelfNote*.java`, built at `TileBuilder.java:102-119`);
`LiveBoxes` (`teoz/LiveBoxes.java:79-86,284-336`) in a new
`sequence-live-boxes.ts`, with every life event bound to
`lastEventWithDeactivate` (`SequenceDiagram.java:367-404`).
**Consequence.** The highest-risk change of the drive; the B2 close runs
the all-engine survey.

## D4 — Batch 0 splits as pure moves

**Context.** `layout.ts` (547) and `sequence-layout-participants.ts` (510)
exceed the 500-line hook cap; `sequence-layout-message.ts` (495) and
`ast.ts` (480) will grow. **Decision.** Split each along upstream tile
boundaries before any behaviour change; exports are re-exported so callers
do not change; gate = all 1141 rows hash-identical (stop 7). Never add a
file we own to `complexity-ignore`. A later task whose change pushes any
file past 500 splits it in the same commit (push-forward).

## D5 — creole through core

**Context.** Sequence labels use their own line parser (`sequence-creole.ts`).
Upstream has one path: `AbstractTextualComponent.java:84-90` →
`Display.create0` (`Display.java:644-669`) → `SheetBlock1/2`. Core already
has it (`core/klimt/creole/DisplayCreole.ts`, SheetBlock1/2, Fission,
AtomTable/Tree/Emoji/OpenIconic, CreoleHorizontalLine, EmbeddedDiagram);
activity uses it via `diagrams/activity/activity-creole-sheet.ts`.
Research D attributes ~85 structural rows to this (MEDIUM confidence).
**Decision.** Route every sequence label through core and delete
`sequence-creole.ts` — after T6a proves plain text renders byte-identical
on all 419 pins (stop 7 otherwise). Core creole edits are additive only
(stop 8); the activity ratchet stays green.

## D6 — core changes in scope

**Decision.** In scope: core preprocessor (`BlockUmlBuilder.ts` YAML strip,
`tim/IncludeExecutor.ts` missing `!includedef` → empty, `preprocessor-
collector.ts` `<style src=>` and `</?style>` close) and additive core
creole/warning/glyph lifts. Every core commit is followed by the all-engine
survey; any conformant loss in any engine is stop 4.

## D7 — the unexplained remainder

**Context.** Not explained in planning: first-lifeline x offset (160 rows;
box / Dolls extents suspected), later lifelines (104), lifeline count (37),
note x (28), delay/space Y (camuxi, xinope, xucibo). **Decision.** Batch 5
diagnoses first: each task writes only `diagnosis/*.md`, delivering the
diagnosis artifact (mechanism, origin `file:line`, causal chain, ruled out)
and a proposed write-set. The orchestrator then spawns fix tasks
(push-forward). An incomplete artifact halts (stop 18).

## D8 — batch order

**Decision.** 0 splits → 1 small independent fixes → 2 vertical model → 3
horizontal → 4 text → 5 remainder → 6 creole → 7 structural → 8 core →
exit. V before H: self-message width reads activation levels (STAIRS).
Geometry before creole: creole changes text sizes only on creole rows,
geometry fixes move every row.

## D9 — target

**Decision.** Every zero-diff row pinned; floor **560** pins (478 measured
for V + a conservative share of H/T/E; estimate ≈ 590); 0 conformant losses
in any engine; 0 unexplained rises; error rows 13 → 0 (each renders, or the
jar and we both error = conformant, ruling 2026-10-10). A miss is
acceptable only if every non-zero row has a named mechanism and an owner in
`fixtures.md`.

## D10 — divergences and stale premises

**Decision.** Nothing is signed into `oracle/accepted-divergences.json`;
proposing one is stop 10. Two stale premises are corrected where the code
lands: `ast.ts:72-75` ("the classic renderer reads neither `parallel` nor
`anchor`" — the jar is always teoz) with T2a; `DIVERGENCES.md:779`
(reverse self `A <- A`, no library forces it) deleted with T3b.
LaTeX/math stays a permanent divergence.

## D11 — branch and commits

**Decision.** Branch `feat/sequence-divergence-drive-2`; one unsigned commit
per task, Conventional Commits, no attribution; task branches merge with
`--no-ff`; never push; main is not merged into the branch mid-drive.
**Amended at planning (user, 2026-10-21): the squash is a planned batch,
not an offer.** Many commits while the batches run; at the end the
[squash batch](batch-squash/overview.md) rebuilds the branch as one commit
per batch with `git commit-tree` from the batch-close trees (tree-identical,
verified; never `rebase -r`, which drops merge-introduced content — sdd1).
The working history is kept in the local tag `sdd2/pre-squash`, which every
journal citation resolves through. The user signs (`rebase -S`), pushes and
opens the PR.
