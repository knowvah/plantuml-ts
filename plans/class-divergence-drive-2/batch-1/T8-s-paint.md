# T8 — S paint / text singletons

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T7 (shares
`renderer-classifier-box.ts`) · parallel with T7b.

## Fixtures

fumalu-64-vude116 (from T7), gabejo-44-juki791, guxode-39-dobi371
(structural half; its numeric half is CLIP-1, T9), tuguku-78-zega630,
nesivu-99-cexu403, nisune-86-faji869. xoxuni and vuresa moved to T7
(they share `renderer-edge.ts`); rezoba and jojime moved to T9 (CLIP-1).

## Mechanisms

From `diagnosis/S.md`. Diagnosis sections are quoted from `diagnosis/<group>.md` into the agent prompt.

- **S-5** fumalu — `applyColorCascadeOverrides` never cascades the class
  header `BackgroundColor`; `style-cascade-class.ts`. HIGH.
- **S-3** gabejo — no `classbordercolor<<X>>`/`classfontcolor<<X>>`
  stereo keys (the STATE pattern exists); `skinparam-stereo-keys.ts`,
  consumed by `renderer-classifier-colors.ts`/`renderer-classifier-rows.ts`.
  HIGH on colours; its height Δ1 re-measure after.
- **S-6** guxode — `packageBorder` handler passes `color` where the
  sibling handler passes `paint`; `skinparam-key-handlers-table-b.ts:162-167`.
  Resolve in the accumulator path, NOT in `class-namespace-shape.ts`
  (T7/T7b own it). HIGH.
- **S-7** tuguku — no `visibilityIcon` style selector; hardcoded icon
  defaults; `style-cascade-class*.ts`, `class-visibility-icon.ts`. HIGH.
- **S-10** nesivu — no `defaultmonospacedfontname` skinparam handler;
  `skinparam-key-handlers-table-a/b.ts`, `svg-text-font.ts`. HIGH.
- **S-13** nisune — `classFontColor automatic` early-returns (a deferral
  documented in the code, naming this fixture); port the jar's contrast
  choice (`HColorSimple#isDark`; `HColorSet.ts#isDarkResolved` exists).
  Re-read the Java for which colour `automatic` resolves against. HIGH.

All six edit `src/core/`: stop 13 applies (>20 non-class survey movers
halts for review even if explained). Every change is additive for
fixtures that never set the key/style.

## Write-set

`src/core/style-cascade-class.ts`, `style-cascade-class-snames.ts`,
`style-cascade-class-font.ts`, `skinparam-stereo-keys.ts`,
`skinparam-key-handlers-table-a.ts`, `skinparam-key-handlers-table-b.ts`,
`skinparam-accumulator.ts`, `skinparam-theme-builder.ts`,
`theme-graph-colors-a.ts`, `theme-graph-colors-b.ts`, `svg-text-font.ts`;
`src/diagrams/class/class-visibility-icon.ts`, `renderer-classifier-box.ts`,
`renderer-classifier-header-split.ts`, `renderer-classifier-rows.ts`,
`renderer-classifier-colors.ts`; tests beside each.

## Read-set

`diagnosis/S.md` (this task's sections), `decisions.md` D2–D4; prior
mission `decisions.md` D8 (colours are `Paint` at the class seam — route
new colour handling through it).

## Acceptance criteria

- Given each fixture, when it renders, then the fill/stroke/font/path
  attribute the diagnosis names equals the jar's value
- Given a colour or font default, when its test runs, then it asserts the
  literal jar value and cites the Java line (skin/theme default) it comes from
- Given the 560 conformant fixtures, when render-all runs, then none leaves
  conformant

## Observability · Rollback

N/A. Reversible.
