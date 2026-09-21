# T1 — ledger fragment for the 668 settled rows

## Context
`plans/unknown-bucket-routing-repair/measured-at-base.json` holds all 825
`unknown` fixtures measured through the gates' seams; `cohorts/T1.tsv` lists
the 668 whose disposition needs no diagnosis: 538 agree, 26 jar error pages,
96 with no engine in this port (jar NWDIAG 64, TIMING 13, BPM 7, HELP 7, GIT
4, FLOW 1), 8 FILES whose golden is typed but our files engine stamps no root
attribute. The D4 ledger row and the reason bar (`File.java:line`) are in
`decisions.md`.

## Task
Write `tests/oracle/svg-conformance/unknown-ledger/T1-settled.json` with one
row per T1.tsv slug:
- agree → `{ disposition: "agree" }`; jar error page → `"jar-error"`.
- No-engine types → `known-misroute` AND (when `weErrored`) `known-gap`, one
  reason per type, cite the factory line in `PSystemBuilder.java`: BPM `:141`
  (`BpmDiagramFactory`), NWDIAG `:155` (`NwDiagramFactory`, mission-index D5),
  FLOW `:185` (`FlowDiagramFactory`), TIMING `:187` (`TimingDiagramFactory`,
  D1), HELP `:188` (`HelpFactory`), GIT `:191` (`GitDiagramFactory`, D6);
  mechanism: no plugin registers the DiagramType, `DiagramRegistry#resolve`
  has zero candidates and returns the error sentinel
  (`src/core/dispatcher.ts:317-342`). For the 13 TIMING and 7 HELP rows,
  which open with `@startuml`, the candidate set is the legacy-UML run
  (`DiagramType.java:198-201`), all ten refuse, and class's refusal draws the
  banner page — say so in their reason (they are `known-gap`, weErrored).
- FILES → `known-misroute` (FILES → NONE): `renderFiles` returns a
  `RenderFragment` without `diagramType` (`src/diagrams/files/renderer.ts:
  64-69`), so `assemble-svg.ts:496-497` never stamps what
  `TextBlockExporter.java:292-294` writes; registered `PSystemBuilder.java:192`.
Set `cohort` to the cohort name, `task: "T1"`. Verify each row's `weErrored`/
`jarErrored` against the measurement (do not invent).

## Write-set
`tests/oracle/svg-conformance/unknown-ledger/T1-settled.json` (new dir).

## Read-set
`plans/unknown-bucket-routing-repair/{decisions.md#d4,cohorts/T1.tsv,
measured-at-base.json}`; `oracle/goldens/svg-conformance/routing-baseline.json`
grep `board/gasaxu-65-cipo396` (the T5 no-engine reason style to mirror);
`src/core/dispatcher.ts:317-342`; `~/git/plantuml/src/main/java/net/
sourceforge/plantuml/PSystemBuilder.java:135-200` (verify the line numbers
above before citing them).

## Architecture decisions
D4, D7.

## Interface contracts
Fragment `{ rows: LedgerRow[] }`, 668 rows, consumed by T0's generator.

## Acceptance criteria
1. Given the fragment, when parsed, then it has 668 rows, every slug is in
   `cohorts/T1.tsv`, and none repeats.
2. Given every `known-misroute`/`known-gap` row, when its reason is tested
   against `/\w+\.java:\d+/`, then it matches.
3. Given T0's generator (after batch-0 merge), when run `--dry` over the
   parked tree, then `unpinned` = 157 and no T1 slug is listed.

## Observability / Rollback
N/A / Reversible.

## Quality bar
`npx prettier --check` on the file; a 5-line vitest under
`tests/unit/scripts/unknown-ledger.test.ts` is NOT required (T0's test
covers the schema); AC1–2 checked with a one-off `node -e` and pasted into
the return.

## Boundaries
Never touch the baselines or `test-results/`.

## Commit
`test(ubrr-T1): ledger fragment for the 668 settled unknown fixtures`
