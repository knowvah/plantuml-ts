# T2 — diagnosis: activity-jar cohort (38)

## Context
plantuml-ts ports PlantUML; upstream decides diagram ownership by parse
attempt (`PSystemBuilder.java:256-266`) over the `@start` line's candidate set
(`DiagramType.java:69-92`; `@startuml` → the ten legacy-UML factories,
`:198-201`), and every line must match a registered `Command`
(`PSystemCommandFactory.java:169-175`). This port mirrors that in
`src/core/dispatcher.ts#resolve` (`:317-342`) over plugins registered in
`src/index.ts` (order FROZEN, D1). The jar said one thing about these
fixtures and this port another; `cohorts/T2.tsv` lists them with jar type,
our type, whether we errored and which engine the error page names.
Known so far: the 25 `activity-legacy1-example-N` fixtures use the OLD activity syntax (`(*) -down-> "x"`), which upstream's `ActivityDiagramFactory` (`PSystemBuilder.java:137`) handles via `activitydiagram/command/CommandLinkActivity.java:73` (registered `ActivityDiagramFactory.java:96`); this port's activity plugin ports the `activitydiagram3` family only, so every candidate refuses and class's refusal draws the page. The other 13 are jar-ACTIVITY sources that description (5), class (3) or state (1) CLAIMED, or that our activity/sequence parser refused (4).

## Task
For EVERY row of `cohorts/T2.tsv`: (1) read the source
(`test-results/dot-cache-unknown-2026-09-20/<slug>/in.puml`) and the jar's
golden head; (2) render it through the gates' seams (`renderSync` +
`DeterministicMeasurer` + `fixtureIncludeStore()`) and read the refusing
line from our error page, or which plugin claimed it and on what line; (3)
open the upstream Java that decides it — the factory's command list and the
specific `Command` class — and state the mechanism with `File.java:line`;
(4) classify per D2: `fix-candidate { seam, command, size }` where `seam` ∈
{class, description, state, activity, sequence, block-extractor} names the
directory the fix lives in, or `known-misroute`/`known-gap` with the reason.
Group rows by mechanism first — a cohort of 42 is usually 3 mechanisms — and
diagnose one exemplar per mechanism fully, then verify the others share it
(re-measure; do not assume from the name). For the 13: an over-claim by an engine registered BEFORE activity (class, description, state all are) is a D2(a)/(b) fix-candidate in THAT engine's seam; a refusal by our activity parser on activity3 syntax is a D2(c) candidate in the activity seam if one Command is missing. For the 25 legacy rows the expected verdict is pin — unless your reading of `ActivityDiagramFactory` shows a small subset this port could accept; say so with sizes.

Write `diagnosis/T2.md`: a table mechanism → count → upstream cite → our
`file:line` → verdict → seam, then one paragraph per mechanism with the
exemplar's refusing line. Write the fragment
`tests/oracle/svg-conformance/unknown-ledger/T2-*.json` (name per the batch
table) with one D4 row per slug, `task: "T2"`.

## Write-set
The two files named in `batch-1/overview.md`. Nothing under `src/`.

## Read-set
`plans/unknown-bucket-routing-repair/{decisions.md,cohorts/T2.tsv,
measured-at-base.json}`; `.agent-notes/unknown-bucket-mapping.md`;
`plans/routing-heuristic-repair/README.md` (the "measured scope" table is the
model for your diagnosis table); `src/core/dispatcher.ts:250-350`;
`src/core/block-extractor.ts` (candidate set); the engine parsers your cohort
names; `~/git/plantuml/src/main/java/net/sourceforge/plantuml/` — the
factory and command classes you cite (READ the method bodies).

## Architecture decisions
D1, D2 (the verdict bar), D3 (a fix-candidate must say where the fixture
would LAND after the fix, not only what stops claiming it), D4, D7.

## Interface contracts
Fragment rows consumed by T0's generator (batch 3) and by the orchestrator's
batch-2 seam assignment: `seam` and `size` decide the task; `command` and
`reason` are copied verbatim into the eventual pin.

## Acceptance criteria
1. Given the cohort, when the fragment is parsed, then every slug in
   `cohorts/T2.tsv` has exactly one row and no other slug appears.
2. Given each `known-misroute`/`known-gap` row, when its reason is tested,
   then it matches `/\w+\.java:\d+/` and names the refusing line or the
   over-claiming probe.
3. Given each `fix-candidate` row, when read, then `seam`, `command` and
   `size` (NLOC estimate from the upstream source) are present and the
   diagnosis note says where the fixture lands after the fix (D3).
4. Given the diagnosis table, when its counts are summed, then they equal
   the cohort size.
5. Given T0's generator, when run `--dry` with this fragment in the ledger
   dir, then no slug of this cohort is `unpinned`.

## Observability / Rollback
N/A / Reversible (two new files).

## Quality bar
`npx prettier --check` on both files. Re-measure every verdict you state;
`measurement-artifacts-outnumber-defects` is this repo's standing finding.

## Boundaries
- Always: cite upstream by `File.java:line` after reading the body.
- Never: edit `src/`, the baselines, or `test-results/`; never run the jar
  except through `scripts/oracle-render.sh` for a single probe.

## Commit
`docs(ubrr-T2): diagnose the activity-jar cohort (38) cohort`
