# Architecture decisions — `activity-lane-capture`

Confirmed 2026-09-15 before decomposition. Treat every one as **locked**. If
a task discovers a conflicting constraint, amend the decision here and halt
for review — never silently override it.

Java paths are under
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/`.

## D1 — Upstream names: `swimlane` at the opener, `swimlaneOut` where upstream has one

**Context.** Every upstream compound takes `swimlanes.getCurrentSwimlane()`
in its constructor when the opener is parsed: fork `ActivityDiagram3.java:219`,
split `:250`, switch `:277`, if `:309`, while `:397`, repeat
`InstructionRepeat.java:107`. Only fork, split and repeat hold a second
field, `swimlaneOut`: fork sets it at `fork again` and `end fork`
(`InstructionFork.java:89,139,196`), split at `end split`
(`InstructionSplit.java:140`), repeat at `repeat while`
(`InstructionRepeat.java:194-196`). Our AST has one `swimlane?` per node
(`ast.ts:97-107`) filled after the body parses.

**Decision.** All five AST nodes set `swimlane` from `ctx.currentSwimlane`
read BEFORE their body parses. `ActivityFork`, `ActivitySplit` and
`ActivityRepeat` gain `swimlaneOut?: string`. `Tile` gains
`readonly swimlaneOut?: string`. `laneIn` reads `swimlane`; `laneOut` reads
`swimlaneOut ?? swimlane` before descending into children. Rejected:
renaming to `swimlaneIn`/`swimlaneOut` on every node (upstream's if/while
have no such pair); keeping end-capture and adding `swimlaneIn` (inverts
upstream's field meaning).

**Consequences.** Upstream names survive grep across both trees. `laneIn` is
unchanged for every tile that never sets `swimlaneOut`, so T2 is
output-neutral.

## D2 — Mirror each Instruction's getters, verified by dump before code

**Context.** The getters differ per class: `InstructionIf`/`InstructionSwitch`
return `swimlane` for both (`InstructionIf.java:247-253`); `InstructionFork`
returns `swimlaneIn`/`swimlaneOut` (`:174-181`); `InstructionSplit#
getSwimlaneIn` returns `parent.getSwimlaneOut()` (`:167`);
`InstructionRepeat` and `InstructionWhile` return the PARENT's lanes
(`InstructionRepeat.java:236-242`, `InstructionWhile.java:175-181`). Drawing
reads Ftile/Gtile lanes, which are not always the Instruction getters.

**Decision.** Mirror each class verbatim. T1 settles, by reading the callers
and dumping ours vs jar, which of our `laneIn`/`laneOut` call sites read the
In and which the Out lane, and writes that as a call-site table T4–T7
implement literally. Rejected: one uniform rule for all five kinds — a
special case upstream does not have.

**Consequences.** T1 is a gate: stop 4 forbids `src/` edits before it.

## D3 — FILE the repeat entry diamond and `ConnectionBackComplex1`

**Context.** When a repeat's `swimlane != swimlaneOut`, `FtileRepeat.create`
draws `ConnectionBackComplex1`, a snake from `diamond2` back to `diamond1`
(`ftile/vcompact/FtileRepeat.java:188-196,333-402`). `diamond1` is the entry
diamond drawn when `entry == null` (`:135-136`). Our live `GtileRepeat` has
no entry diamond (`tiles/gtile-repeat.ts:32`: body, condition, backward); the
only `repeat-start` emitter is in dead `activity-layout-repeat.ts`, reachable
only from `layout.old.ts`. Six baseline fixtures open and close a repeat in
different lanes.

**Decision.** Out of scope. File `activity-repeat-entry-diamond` at T8 with
the six slugs and the cites above. This mission still gives the condition
diamond its `swimlaneOut` (`FtileRepeat.java:149,152`).

**Consequences.** The six fixtures keep a known loop-back geometry gap;
their rises from it are journaled against the filing, not fixed (stop 7).

## D4 — Commit the probe and the re-pin tool

**Context.** `activity-parallel-connectors` and `activity-klimt-compress`
both measured with a scratch `probe.ts` and re-pinned with a scratch
`repin-activity.ts`; neither exists on disk now. A re-pin that compares only
against the pin silently adopts a pre-existing regression (the
`repin-sequence-baselines.ts` hazard).

**Decision.** T0a commits `scripts/activity-probe.ts`; T0b commits
`scripts/repin-activity-baselines.ts`, which prints `ROSE` for every pin
whose new score is higher and exits non-zero unless `--accept-rises` names
the slug. Both reuse the gates' own measurement functions; neither runs
inside `npm test`.

**Consequences.** Measurement survives compaction and future missions.

## D5 — Exit bar is lanes, overlaps and explained rises — not the aggregate

**Context.** `weightedScore` pairs elements positionally, so a correct lane
can raise a fixture whose draw order already diverges. `activity-klimt-
compress` closed with Σ above its reference for exactly that reason.

**Decision.** The bar is the four-part list in the README: empty or
attributed `ALLOWED_NEW_OVERLAPS`; jar-matching compound lanes on the 40
(`--lanes`) or named misses; zero unexplained rises; four gates green. The
aggregate and subset are reported, never gated.

**Consequences.** Every riser costs a journal row before its commit.

## D6 — Diagnose first, one task per compound kind, one re-pin

**Context.** Five kinds share one mechanism with five call sites; attributing
a score change needs each kind's effect measured alone. The four activity
oracle gates are equality pins that break on any change.

**Decision.** Batch 0 builds tooling; Batch 1 states mechanisms with no
`src/` edits; T3–T7 each change one kind, measured against T1's
`measurements/base.json`; the orchestrator re-pins once at T8. Between T3
and T7 only the four activity oracle gates may be red, only on
`fixtures.md` slugs the journal explains.

**Consequences.** Sequential batches 3–6 (they share `node-dispatch.ts`).

## D7 — FILE `backward:`

**Context.** Upstream captures a third repeat lane at `backward:`
(`ActivityDiagram3.java:382`, `InstructionRepeat.java:124-127`). Our parser
has no `backward` handling at all (no match in `ast.ts`/`node-dispatch.ts`).

**Decision.** A missing feature, not a capture bug. File
`activity-repeat-backward` at T8.

**Consequences.** None for this mission's fixtures; `GtileRepeat`'s
`backwardBody` slot stays unfed.
