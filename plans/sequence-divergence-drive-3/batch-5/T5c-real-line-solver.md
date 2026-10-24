# T5c — the participant x solver mirrors upstream's `RealLine`

Agent: `typescript-pro` (sonnet), worktree `sdd3-T5c`. Commit:
`fix(sequence): solve participant x through a RealLine port`.
Read [../task-contract.md](../task-contract.md) first, then
[../diagnosis/leftovers.md](../diagnosis/leftovers.md) section **M2** in
full (lines ~177–324). Spawned from T5b's artifact (journal rows 72–73).

## Mechanism (T5b, instrumented in the jar — HIGH)
Upstream lays participants out with `real/RealLine.compile()`: a Gauss-Seidel
loop over `PositiveForce`s in creation order (`real/RealLine.java:77-110`,
`real/PositiveForce.java:64-71`). A `RealMax`/`RealMin` caches its value
FOREVER at its first `getCurrentValue()` (`real/RealMax.java:89-94,109-111`,
`real/RealMin.java:55-60,69`). `PlayingSpace#ensureDisjoint`
(`teoz/PlayingSpace.java:232-266`) registers
`groupMin.ensureBiggerThan(commMaxX)` for parallel siblings; on
`jexavi-40-degi377` that pair is cyclic and is finite in the jar only
because the previous tile's `RealMax` is frozen at its pass-1 read
(119.1625, converged 232.93125): `p.posB` is pushed by
`119.1625 + 19 − 24.39375 = 113.76875`. The port's `solveParticipantXs`
(`sequence-layout-participants.ts:384`) is a DAG longest-path sweep;
`pairConstraint` (`sequence-layout-parallel-disjoint.ts:298-300`) drops the
cyclic pair and keeps acyclic pairs LIVE where the jar holds them frozen.

## Outcome
The participant-row x layout is solved by a faithful port of upstream's
`real` package, in upstream's force creation order
(`SequenceDiagramFileMakerTeoz.java:112-116`: `dolls.addConstraints` →
`PlayingSpace` tiles → `livingSpaces.addConstraints`
(`LivingSpaces.java:61-71`) → `mainTile.addConstraints()` incl. the
disjoint pass at `PlayingSpace.java:167` → `compileNow`), with
`RealImpl`/`RealDelta`/`RealMin`/`RealMax` first-read caching,
`PositiveForce`'s epsilon (`max(1e-6, 1000*ulp)`) and the pass loop —
so the first-read freeze is reproduced, not approximated. jexavi
121 → 0; every other row byte-identical.

**Shape (A) is the target:** the line solver replaces the sweep for every
diagram (the upstream structure; the sweep is a never-faithful local
structure, CLAUDE.md "re-mirror rather than patch"). **Shape (B) is the
measured fallback only:** if (A) moves any pinned row and the mover's
mechanism is not found inside the 2-fix budget, gate the line solver to
diagrams where `ensureDisjoint` yields at least one cyclic pair and keep
the sweep elsewhere — journal the movers that forced it, row by row. Never
fit a number to make a pin pass.

## Targets
jexavi-40-degi377: ws 121 → 0 (all x; no y). T5b verified no other fixture
has a firing cyclic disjoint force (of the 63 `&`/`par2` fixtures, forces
fire in codeti-52, dalata-11, koneju-77, vajoke-72, zoculi-89 — acyclic,
all conformant — and jexavi).

## Write-set (sequence-local; no `src/core`)
new `src/diagrams/sequence/sequence-real-line.ts` (the `real/*.java` port;
split `sequence-real-force.ts` under the 500-line hook, journal it),
`src/diagrams/sequence/sequence-layout-participants.ts`,
`src/diagrams/sequence/sequence-layout-parallel-disjoint.ts`,
`src/diagrams/sequence/sequence-layout-participant-constraints.ts`
(`SpanConstraint` carries creation order), their tests, `docs/catalog.md`.
Anything else is stop 1: report, do not edit.

## Read-set
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/*.java` (every
class, in full); `teoz/PlayingSpace.java:160-270`,
`teoz/LivingSpaces.java:55-80`, `teoz/SequenceDiagramFileMakerTeoz.java:
100-120`, `teoz/CommunicationTile.java:453-460`, `teoz/GroupingTile.java:
83,90,211,984-986`; the four port files above; `diagnosis/leftovers.md` M2
(force trace numbers: first read 119.1625, push 113.76875, lifeline x
148.163 / 242.931 / 308.188 / 362.731).

## Gates
- Tests first (red): a unit test pinning the jexavi force trace quoting
  `RealMax.java:89-94` and `PlayingSpace.java:263-264` (first-read value
  119.1625, `p.posB` push 113.76875, the four lifeline x); solver unit tests
  for `RealMax`/`RealMin` caching, `RealDelta`, `PositiveForce` epsilon,
  pass termination and the `Infinite Loop?` guard (`RealLine.java`).
- `npx tsx $T/classify.mts` vs `$M/b4-classify.json`: jexavi 0, 0 rose, no
  other row moved. Golden ratchet 1133 pins green (stop 6).
- `npx tsx $T/svg-hashes.mts --all` before/after: movers = jexavi only
  (sequence-local change; other engines cannot move — confirm).
- `npm run typecheck`, eslint, prettier, `vitest run tests/unit/sequence
  tests/oracle/svg-conformance/sequence.*`, coverage 90/90/90 on the new
  module, `npm run catalog`.

## Acceptance
- Given jexavi, then zero diff with the trace test above.
- Given the 1133 pins and every other sequence row, then byte-identical
  under shape (A) — or shape (B) with every forcing mover journaled.
- Given the solver module, then every class carries `@see` to `real/*.java`
  and preserves upstream names.

Observability: N/A. Rollback: Reversible (revert the task commit).
