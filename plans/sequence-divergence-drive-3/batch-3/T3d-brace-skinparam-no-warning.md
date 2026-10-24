# T3d — a `skinparam { … }` block entry emits no deprecation warning

Agent: `typescript-pro` (sonnet), worktree `sdd3-T3d`. Commit:
`fix(core): warn on line-form skinparam only`.
Read [../task-contract.md](../task-contract.md) first. Spawned from T3a's
adjacent finding A1 (journal rows 51–53); runs in parallel with T3b
(file-disjoint; see Boundaries).

## Mechanism (confirmed against the Java)

`CommandSkinParam#executeArg` — the LINE form `skinparam handwritten true`
— adds `new Warning("Please use '!option handwritten true' to enable
handwritten ")` (and the `ParticipantPadding`/`padding` ones)
(`command/CommandSkinParam.java:88-99`). The BRACE form
`skinparam [name] {` is a different command: `CommandSkinParamMultilines
#execute` builds a `SkinLoader` and returns `skinLoader.execute(lines,
group1)` (`command/CommandSkinParamMultilines.java:90-102`); neither it nor
`SkinLoader` touches `addWarning` (grep: zero `Warning` in `SkinLoader.java`).
So a block entry never warns upstream.

The port rebuilds the warnings from the merged `skinparam` map after the
preprocessor hoisted the lines (`src/core/skinparam-warnings.ts:55-69`,
whose own doc comment admits "a `skinparam { ... }` block entry warns too,
where upstream's `CommandSkinParamMultilines` does not"). `tests/corpus/
sequence/gepuce-64-pivu656.puml` (`scale 0.50` + `skinparam {
handwritten true … }`) gets a banner the jar never draws; today it is
hidden only because `sequence-warnings.ts:63-71` returns early on a
scaled page — a guard T3b removes, which is why T3a's prototype saw gepuce
rise 241 -> 273.

## Outcome (what "done" means)

1. `SkinparamAssignment` (`src/core/preprocessor.ts:130-137`) records the
   form of each assignment (`form: 'line' | 'block'`); the collector sets it
   (`src/core/preprocessor-collector.ts:326-353` — `setSkinparam` is the
   single push; the block path and the line path must each say which they
   are). The merged `skinparam` map is unchanged (both forms set the
   parameter upstream: `diagram.setParam` / `SkinLoader`).
2. `skinParamWarnings` warns for LINE-form assignments only, in first-
   assignment order, de-duplicated as today (`LinkedHashSet`). It takes
   the style source (`Pick<PreprocessorResult, 'skinparam' |
   'skinparamAssignments'>`); a hand-built result without
   `skinparamAssignments` keeps today's map-based behaviour (documented).
3. `block-extractor.ts:119`'s `styleSource` Pick carries
   `skinparamAssignments`; `diagrams/sequence/index.ts:47` and
   `diagrams/activity/index.ts:53` hand the style source through
   `withSkinParamWarnings` (`sequence-warnings.ts:38-44`,
   `activity-warnings.ts:55-61`).
4. The stale doc comment at `skinparam-warnings.ts:55-60` says the new
   truth with both Java cites.

## Targets
No ledger row: gepuce's banner is hidden on its scaled page until T3b
lands, so this task alone moves NO sequence row (classify must show 0
movers vs `$M/b3-m-T3a.json`). Grep every engine's corpus
(`tests/corpus/**/*.puml`) for brace-form blocks containing `handwritten`,
`padding` or `ParticipantPadding` and report which activity/sequence rows
draw a banner today; each one that moves after the fix moves TOWARD the
jar (the hash gate below lists them — every mover needs that explanation).

## Write-set
`src/core/preprocessor.ts`, `src/core/preprocessor-collector.ts`,
`src/core/block-extractor.ts` (the Pick only), `src/core/skinparam-warnings.ts`,
`src/diagrams/sequence/sequence-warnings.ts` (lines 38–44 only — leave
`withSequenceWarningBanner` `:55-71` untouched; T3b's change makes its
guard unreachable and the orchestrator handles that at the close),
`src/diagrams/sequence/index.ts` (`:47`), `src/diagrams/activity/
activity-warnings.ts`, `src/diagrams/activity/index.ts` (`:53`); tests
(`tests/unit/core/skinparam-warnings*.test.ts` or the existing warnings
tests — find them with grep, extend rather than duplicate). **NOT in it:**
`renderer.ts`, `renderer-document.ts`, `assemble-svg*.ts`,
`TextBlockExporter.ts` (T3b), any baseline or golden.

## Read-set
`command/CommandSkinParam.java:60-105`,
`command/CommandSkinParamMultilines.java:44-110`, `skin/SkinLoader.java`;
`src/core/skinparam-warnings.ts`; `src/core/preprocessor.ts:100-145,
316-345`; `src/core/preprocessor-collector.ts:40-100,160-180,320-354`;
`tests/corpus/sequence/gepuce-64-pivu656.puml`.

## Gates
- Tests first: line form warns (each of the three texts, quoting
  `CommandSkinParam.java:92-99`); `skinparam {` and `skinparam sequence {`
  block entries do not (quoting `CommandSkinParamMultilines.java:90-102`);
  a line + block mix warns once; a hand-built result without assignments
  warns from the map.
- `npx tsx $T/classify.mts <wt>/cls.json` vs `$M/b3-m-T3a.json`: 0 rose,
  and every row that fell is one of the brace-form rows you listed.
- `npx tsx $T/svg-hashes.mts` base vs yours: movers are exactly the
  listed brace-form rows (activity/sequence); anything else = name the
  mechanism or revert. Never `pkill -f svg-parity-survey`.
- Golden ratchet (1083 pins byte-equal), `npm run typecheck`, eslint on
  your files, `vitest run tests/unit/core tests/unit/sequence
  tests/unit/activity tests/oracle/svg-conformance/sequence.*`.

## Acceptance
- Given `skinparam handwritten true` on a line, then the banner text
  matches `CommandSkinParam.java:92`.
- Given `skinparam { handwritten true }`, then no warning and the
  parameter still applies (`theme.handwritten === true`).
- Given the corpus, then no row rises and every mover is a listed
  brace-form row.

Observability: N/A. Rollback: Reversible (revert the task commit).
