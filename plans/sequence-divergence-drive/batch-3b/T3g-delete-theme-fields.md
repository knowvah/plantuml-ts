# T3g — delete the reader-less sequence Theme fields (D5 Amendment 1 ruling)

Agent: `typescript-pro`, worktree `sdd1-T3g`. Added 2026-10-20 after the
user's ruling (journal row 56). One commit, with a `BREAKING CHANGE:` footer.

## Context
plantuml-ts ports PlantUML. sdd1 moved every sequence component onto the
per-event `Style` path, and the ten `Theme` fields below lost every reader.
Upstream has no counterpart (`theme/Theme.java` only reads a `!theme`
file); each value lives in `Style` (`plantuml.skin`). The user ruled to
delete them, even though `RenderOptions['theme']` (exported, `Partial<Theme>`)
reaches them: the published type changes, rendering must not.

## Delete
- `colors.lifeline`, `colors.activation`, `colors.frame`,
  `colors.participantBackground` (and its writers: `style-map-theme.ts:245`,
  `theme-element-resolve.ts:279-286#foldRootBackgroundIntoSequence` and its
  callers `theme.ts:492,497`)
- `sequence.participantPadding`, `messageSpacing`, `noteMargin`,
  `frameHeaderHeight`, `lifelineExtension`
- `colors.graph.sequenceShadowing` with `src/core/sequence-shadowing.ts`,
  its `build-theme.ts:22,84-89` hook, and
  `tests/unit/core/sequence-shadowing.test.ts` (port any case no sdd1 test
  covers into `tests/unit/sequence/`)
- Every default (light and dark), partial-type entry and test assertion on
  these fields. If `Theme.sequence` ends up with only non-sequence-style
  fields (`activationWidth`, `participantGap`), keep them.

## Before deleting each field
Re-grep `src/` and `tests/` for every access form (dot, `?.`, bracket,
destructuring). A reader found anywhere is a stop: report it, do not delete
that field. Do not touch `src/core/style/**` or `src/core/klimt/**`.

## Prove it byte-neutral
- `npx tsx plans/sequence-divergence-drive/tools/svg-hashes.mts <out.json>
  plans/sequence-divergence-drive/measurements/pre-t3g-hashes.json` must
  print `0 moved`.
- Every engine's golden ratchet (`tests/oracle/svg-conformance/
  *.golden.ratchet.test.ts`) and `tests/unit/core/**` stay green.
- One test per deleted field that a skinparam used to feed, showing the
  skinparam still lands through the Style path (e.g. `skinparam
  sequenceLifeLineBorderColor`, `participantBackgroundColor`,
  `participantPadding`, `shadowing`), unless an existing sdd1 test already
  proves it (name it).

## Write-set
`src/core/{theme,theme-colors-fields,theme-sequence-fields,
theme-graph-colors-c,build-theme,sequence-shadowing,style-map-theme,
theme-element-resolve}.ts`, any other `src/core/theme*.ts` a deletion
reaches (list it), their tests, `tests/unit/core/sequence-shadowing.test.ts`
(delete), new tests under `tests/unit/sequence/`, `docs/catalog.md`.

## Commit
`refactor(theme)!: delete the sequence fields the style path replaced`,
body lines ≤80, footer `BREAKING CHANGE: RenderOptions['theme'] no longer
accepts <list>; they were ignored since sdd1 (the Style path reads the
jar's values).` No attribution.
