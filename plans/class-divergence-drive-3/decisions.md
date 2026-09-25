# Architecture decisions — `class-divergence-drive-3`

Confirmed 2026-09-25 (all as recommended). **Locked**; amend and halt on
contradiction (stop 3). Java paths are under `~/git/plantuml/src/main/java/net/`.

## D1 — One mission aimed at 712, floor 670

**Context.** 105 fixtures remain (607 conformant + 11 accepted of 723); the
prior mission closed 47. **Decision.** One brief aims at 712 with an exit
floor of conformant ≥ 670; every fixture not closed leaves with mechanism +
owner or an acceptance proposal; each batch close keeps its residual round.
**Consequences.** Long run, no artificial halt mid-workstream; batches 2–4
are provisional until T6.

## D2 — dot-engine workstream: verify, do not fix here

**Context.** ~17 fixtures are attributed to `@knowvah/dot-engine` issues
(19, 20, 21, spline precision); the engine is consumed as a published npm
tarball, and the prior mission disproved two such attributions with one
probe. **Decision.** T5 re-verifies each with real `dot -Tdot svek-N.dot`
vs dot-engine raw layout; confirmed ones refresh `docs/graphviz-issues/`
and are handed to a dot-engine mission; anything not truly dot-engine's
returns to this mission's scope. **Consequences.** 712 is reachable only
after a dot-engine release; realistic ceiling ~695.

## D3 — Layout precision: one measured task

**Context.** The jar reads node positions from graphviz's 2-dp `-Tsvg` text
(`svek/DotStringFactory.java:388-396`); we read exact doubles. gatula
(155.42 vs 155.425) and ririlu (`LineOfSegments.java:89-111` float dust)
depend on it; a 2-dp quantisation was rejected long ago on a much older ink
model (`src/core/layout-epsilon.ts` module doc). **Decision.** Batch 5 runs
one task re-measuring 2-dp quantisation of layout output on the then-current
tree; adopt only if it closes fixtures and moves no gate across all engines
(then retire `absorbLayoutEpsilon` if made redundant); otherwise propose an
accepted divergence (D6). **Consequences.** If adopted, every DOT-backed
engine's layout read changes: own commit, all-engine survey, commit body
states the reach.

## D4 — Write-sets: primaries plus journaled extension

**Context.** The prior mission's largest loss was ~12 ready fixes blocked
purely by narrow write-sets; the maintainer ruled `src/core/` fully in
scope (the test suite is the guard). **Decision.** Each task owns a primary
file list and may extend into any file under `src/` (and its tests) that no
CONCURRENTLY RUNNING task owns, naming each extension in its commit body.
Serial is the default; parallel only in worktrees with disjoint primaries.
**Consequences.** Stop 1 narrows to "a file a concurrent task owns";
merges happen at closes; the orchestrator re-checks disjointness against
the tree before each parallel wave.

## D5 — Diagnosis first for C + E, with mandatory probes

**Context.** ~60 fixtures have untraced mechanisms; prior diagnoses were
wrong where a probe was skipped. **Decision.** Batch 0 diagnoses C + E
read-only (T1–T4). A claim naming dot-engine must carry a real-`dot`
comparison; a canvas claim an ink-extent probe; HIGH only when a probe
printed it. Workstream A skips diagnosis (its artifacts exist) and runs in
batch 1. **Consequences.** T6 builds batches 2–4 from the reports and
re-runs every HIGH probe a fix depends on.

## D6 — Accepted divergences: propose, maintainer signs

**Context.** Some rows may be unfixable by design (e.g. error-page version
identity luzive/sadamo; D3's fallback). **Decision.** An agent may PROPOSE
an `oracle/accepted-divergences.json` entry with evidence (in
`fixtures.md` `final` as `proposed-accept -> <evidence>`); only the
maintainer signs it into the file. A proposal pauses that fixture, not the
mission (stop 12). **Consequences.** The exit bar counts signed and
proposed entries separately.

## D7 — Carried over unchanged

Faithful port only — no fitting, no epsilon, every constant cites its
upstream `file:line`; the oracle stays pinned (no `--rebuild`, no
`pin.json`/symlink change); one re-pin per batch, pin only survey-conformant
AND census-0-diff fixtures, every riser journaled with its mechanism;
other-engine comparisons use the T0 baseline survey, never the committed
engine pins (stale since before cdd2, journal row 25 there); `pin.mjs` is
promoted into the mission tools with a test (T0); the census writes only
with `--json <path>`; ratchet appends are never re-sorted (the tamper test
mutates `fixtures[0]`).

## Push-forward

Decide alone, journal, continue:

- Extend a task into any `src/` file no concurrent task owns (D4)
- Re-assign a fixture to another task or batch when its diagnosis says so
- Split / merge tasks, reorder within a batch, or move a task across batches
  for a dependency or shared file
- Pin a fixture that is survey-conformant AND census 0-diff
- Adopt D3 when its clean-measurement criterion is met
- File an out-of-mission mechanism in `planning/next-missions.md` once its
  artifact is complete
- Pick a task's model: opus for diagnose-first or multi-term geometry,
  sonnet for fully diagnosed fixes
- Serialise planned-parallel tasks when worktree conditions or file overlap
  make parallel unsafe
- Write `.agent-notes/cdd3-Tn.md`
