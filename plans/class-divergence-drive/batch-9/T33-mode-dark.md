# T33 — `skinparam mode dark`

**Agent:** typescript-pro (sonnet) · **Depends on:** — · parallel with
T31/T32 (worktrees).

## Context

`zirori-93-jefo337` (`skinparam mode dark; class foo`, nothing else) is
9 of 10 structural diffs, all colour: root `svg/@background` (`#1B1B1B`
vs our `#FFFFFF`), classifier fill (`#313139` vs `#F1F1F1`), classifier
stroke (`#E7E7E7` vs `#181818`), badge fill (`#2E5233` vs `#ADD1B2`),
text fill (`#FFF` vs `#000`) (A3 M6, A6 §5d). `mode` is parsed nowhere
(grep negative on `skinparam-key-handlers-table-a/b.ts`).

**Full mechanism, verified past what the diagnosis left as "needs a
dedicated follow-up mission"** — do not re-derive, but re-read the
bodies before coding: `SkinParam.isDark` (`skin/SkinParam.java:114-116`,
`"dark".equalsIgnoreCase(getValue("mode"))`) makes
`TitledDiagram#muteColorMapper` (`TitledDiagram.java:291-294`) return
`ColorMapper.DARK_MODE` (`klimt/color/ColorMapper.java:68-72`), whose
`fromColorSimple` calls `simple.darkSchemeTheme()`
(`klimt/color/HColorSimple.java:236-239` — returns the colour's baked-in
`.dark` field, or itself unchanged if none was ever set via
`withDark(...)`). The dark variant is baked in at STYLE-PARSE time, not
computed: `style/parser/StyleParser.java`'s `@media` token
(`AROBASE_MEDIA`, `:277-283,314-324`) flips `scheme = StyleScheme.DARK`
for every declaration until the next `}` closes the block (`:150-152`);
each `PName` value in that scope is built with `ValueImpl.dark(...)`
instead of `.regular(...)` (`style/ValueImpl.java:50-56`) and merged
onto the SAME key's earlier light value via `Context#putInContext`
(`style/parser/Context.java:123`) into one `value1`/`value2` pair, and
`ValueImpl#asColor` (`:88-106`) turns that into `lightColor.withDark
(darkColor)`. The literal dark palette lives in `resources/skin/
plantuml.skin`'s `@media (prefers-color-scheme:dark) { … }` block
(~line 562 onward): `root { LineColor #e7e7e7; BackGroundColor #313139
}` (stroke, fill), `document { BackGroundColor #1B1B1B }` (root canvas
background — a SEPARATE layer from `root`'s own fill; see childCount
note below), and `spot { spotClass { BackgroundColor #2E5233 } … }`
(badge). `root { FontColor white }` gives the `#FFF` text. This port has
no `@media`/dark-variant concept in its style pipeline at all — the
pragmatic port for class is a `mode: 'light' | 'dark'` flag on
`SkinparamAccumulator` (`skinparam-accumulator.ts:16-70`, alongside the
existing `background` field) that gates a SECOND, hardcoded dark-default
table read directly from the `.skin` values above (NOT a general
`@media` parser — that is the wide-blast-radius subsystem the diagnosis
correctly declined to build in one task).

**The 10th diff** (`svg/g[1][childCount] exp=2 act=1`, flagged
Unclassified-within-fixture in A3 M6): a leading hypothesis to VERIFY,
not assumed — `document { BackGroundColor #1B1B1B }` and `root {
BackGroundColor #313139 }` are two DIFFERENT selectors in the `.skin`
file, so dark mode likely draws two layers (an outer canvas `<rect>` at
`#1B1B1B` plus the root style fill `#313139` elsewhere), while
`svgRoot`'s single `bgRect` (`core/svg.ts:522-553`) only ever draws one.
Confirm against `zirori`'s `in.svg` root children before assuming this
is the fix.

## Task

1. Tests first, using `zirori-93-jefo337` plus a light-mode regression
   fixture (any already-conformant class fixture with no `mode`
   skinparam).
2. Add a `mode` skinparam-key handler (`skinparam-key-handlers-table-a
   .ts` or `-b.ts`) writing `SkinparamAccumulator.mode` (`'dark'` when
   the value case-insensitively equals `"dark"`, else `undefined` —
   mirrors `SkinParam.isDark`).
3. Add a dark-default table to `core/theme.ts` (or a sibling
   `theme-dark.ts`) sourced from the `.skin` lines cited above:
   `background`, `classBackground`, `classBorder` (line), text
   fill, `spotClass` background. Cite the exact `.skin` line for each
   constant, same discipline as every other themed default in this
   file.
4. Wire `SkinparamAccumulator.mode === 'dark'` through to theme
   resolution so the class renderer's `resolveColorToSvgHex(theme
   .colors.background)` (`renderer.ts:269`) and the badge default
   (`class-badge.ts:174-184`, ONLY if the theme-level override does not
   already reach it) pick the dark table instead of the light one.
5. Instrument the 10th diff per the hypothesis above; implement the
   second layer only if confirmed, else journal the actual mechanism.
6. `.agent-notes/cdd-T33.md`: the childCount finding either way; confirm
   light-mode defaults are byte-identical when `mode` is unset (render
   every batch-0..8 conformant class fixture unaffected — this is a
   theme-default change with wide reach if mis-gated).

## Read-set

`src/core/skinparam-accumulator.ts:16-70,175-190,245-260`;
`src/core/theme.ts:348-410`; `src/core/skinparam-key-handlers-table-a
.ts`, `-table-b.ts` (find an existing single-value handler to mirror);
`src/diagrams/class/renderer.ts:210-275`; `src/diagrams/class/
class-badge.ts:159-215`; `src/core/svg.ts:522-553`. Java: `skin/
SkinParam.java:114-116`; `TitledDiagram.java:280-303`; `klimt/color/
ColorMapper.java:40-100`; `klimt/color/HColorSimple.java:230-239`;
`style/parser/StyleParser.java:96-155,270-325`; `style/ValueImpl.java:
46-106`; `style/parser/Context.java:100-135`; `resources/skin/
plantuml.skin:560-660` (the `@media (prefers-color-scheme:dark)` block —
read it directly, do not trust the excerpt above). Diagnosis:
`diagnosis/A3-style.md` M6; `diagnosis/A6-oracle.md` §5d.

## Write-set

`src/core/theme.ts` or a new `src/core/theme-dark.ts`,
`src/core/skinparam-accumulator.ts` (`mode` field only),
`src/core/skinparam-key-handlers-table-a.ts` or `-table-b.ts` (the new
key only), `src/diagrams/class/class-badge.ts` (spot defaults, ONLY if
step 4's theme routing does not already cover it), `src/diagrams/class/
renderer.ts` (if the second-layer rect is confirmed), their `*.test.ts`
files, `.agent-notes/cdd-T33.md`, `decision-journal.md` (append-only).

## Acceptance criteria

- Given `zirori-93-jefo337`, when rendered, then root background is
  `#1B1B1B`, classifier fill `#313139`, stroke `#E7E7E7`, badge
  `#2E5233`, text `#FFF`
- Given the childCount instrument, then the root `<rect>`/E14 finding is
  either implemented (2 children match) or journaled as a named,
  separate mechanism
- Given every already-conformant class fixture with no `mode`
  skinparam, when re-rendered, then output is byte-identical (light
  defaults untouched)
- Given `sadamo-18-siva346`/`luzive-62-zote562` (T32/T34's fixtures,
  each with an unrelated `svg/@background` mismatch per A3 M6's own
  note), then this task does NOT touch them — they carry no `mode dark`

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the
code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all
green. `npx tsx tools/render-diff.mts zirori-93-jefo337` before/after,
plus a spot-check render-diff on 5 already-conformant class fixtures to
confirm zero movement. Files ≤500 lines, functions ≤30 NLOC, CCN ≤10,
≤5 params.

## Boundaries

Always: cite the exact `.skin` line for every dark-mode hex constant —
never guess a value that "looks close". Ask first: any stop condition in
`../README.md`; extending the dark table beyond `background`/
`classBackground`/`classBorder`/text/`spotClass` (other diagram types'
dark defaults are out of scope — D5-style shared-seam risk, name them in
`next-missions.md` instead of implementing). Never: build a general
`@media`/dark-variant style parser (explicitly rejected — too wide for
one task); touch `sadamo`/`luzive`'s backgrounds (T32/T34's fixtures).

## Commit

`feat(cdd-T33): implement skinparam mode dark`

Body: why — one missing skinparam key with upstream's widest possible
blast radius (every default colour constant), scoped here to exactly
the five class-diagram defaults `zirori` exercises, citing the `.skin`
resource's `@media` block as the literal source of truth.
