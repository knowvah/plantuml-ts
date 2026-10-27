# T8c — thread the asset store through the gantt plugin (emoji artwork)

Agent: `typescript-pro` (sonnet), worktree `gep-T8c`. Commit:
`fix(gantt): forward the asset store so emoji artwork draws (T8c)`. Journal row 88.

## Diagnosis artifact (Explore agent, row 88)
- **Symptom:** corpus `ribupo-71-poku778` (`It is displayed as <:innocent:>`,
  a milestone label) — firstDiff `svg/g[1][childCount]`: jar 57 children, ours
  51; the jar draws the Twemoji artwork (ellipse + 3 paths, children 40–45).
- **Mechanism:** `src/diagrams/gantt/index.ts:305-313` forwards only
  `options?.clock`; `render` gets no store, so `createLeftTextBlock`
  (`draw/header/TimeHeader.ts:66-72`) builds `new SpriteContainerEmpty()` with
  no emoji store → `emojiArtwork` undefined (`core/annotations/blocks-creole.ts:166-170`)
  → `AtomEmoji.ts:113-127` falls back to a text run whose colour is null →
  `driver-text-svg.ts:142` drops it. Java draws the artwork always
  (`emoji/Emoji.java:175-181`; `TaskDrawDiamond.java:183-205`).
- **Ruled out:** parsing (display string stored, `SubjectTaskVerbs.ts:415-424`);
  the harness alone (passing stores into `renderSync` changes nothing because the
  plugin never reads `assetStore`); artwork presence (`assets/emoji/1f607.svg`
  resolves).

## Write-set (gantt tree + one harness line; nothing under src/core/)
`src/diagrams/gantt/index.ts` (carry `options?.assetStore` into the geometry /
render), `src/diagrams/gantt/draw/header/TimeHeader.ts` (`createLeftTextBlock`
takes the emoji store and passes it to the sprite container the way the wbs/
mindmap engines do — read `src/diagrams/wbs/index.ts` for the store plumbing)
and its call sites `TimeHeaderSimple.ts:127`, `draw/TaskDrawDiamond.ts:124,177`,
`draw/TaskDrawGroup.ts:96`, `draw/TaskDrawRegular.ts:137`, `GanttTaskTable.ts:178`,
`draw/ResourceDrawNumbers.ts:74,118`; `tests/oracle/svg-conformance/render-fixture-gantt.ts`
(`ganttRenderOptions` also passes the asset store the other engine harnesses
pass); tests for the touched gantt files. Do not add a text fallback (Java has
none).

## Acceptance
Typecheck/eslint/prettier clean; `tests/unit/gantt` green; ribupo through the
harness: `compareSvg` 0 diffs vs `test-results/dot-cache/gantt/ribupo-71-poku778/in.svg`
(report before/after); `npx vitest run tests/oracle/svg-conformance/gantt.golden.ratchet.test.ts tests/oracle/svg-conformance/gantt.diff-baseline.ratchet.test.ts`
green (ribupo is a diff-baseline row whose score must fall, never rise); no
other engine's test touched.

Observability: N/A. Rollback: Reversible.
