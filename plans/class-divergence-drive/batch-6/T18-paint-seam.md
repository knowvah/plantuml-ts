# T18 — `Paint` at the class colour seam

**Agent:** typescript-pro (opus) · **Depends on:** — · widens types T19/T20
consume; T21/T22/T23 start after it merges but do not need its types.

## Context

`core/paint.ts:201-230` (`paintToSvg`) and `core/svg.ts:204-260,457-510`
(`resolvePaint`/def-lifting) are a complete, working gradient `Paint`
already wired for the generic `<sname>BackgroundColor` bucket
(`skinparam-key-handlers.ts:58-67 tryElementColorBucket`, doc comment
"gradients become a Gradient Paint"). Two class-only paths bypass it: a
classifier's own inline declaration colour flows through
`resolveBareOrBackColor` into `classifierFill()`'s
`resolveColorToSvgHex(override)` (`renderer-classifier-colors.ts:108-151`,
a plain string call); the "dedicated" handler-table entries
(`classBackgroundColor`, `classBorderColor`, `iconPrivateColor`, etc.)
receive `resolveColor(value)` — a deliberately-simpler flatten-to-solid
helper (`skinparam-key-normalize.ts:46-68`, doc comment 55-63 names the
divergence) — never `parseColor`. Java has one parser for every caller
(`klimt/color/HColorSet.java:78-119`) and one gradient emission path
(`klimt/drawing/svg/SvgGraphics.java:357-399,371,415`). D8 decides:
widen `ThemeGraphColors.classBackground|classBorder|icon*Color` to `Paint`;
route the dedicated-key path through `parseColor`; the divider-line
flat-first-colour exception (`capode-04-jeka075`) is a named branch, not a
blanket substitution. Stop 12 bounds the blast radius: this is a
shared-return-type widening (`classifierFill`/`classBorder` are also
called by `renderEnhancedBody` and `renderVisibilityUrlBackground`). The
report is a lead: re-read the cited bodies before editing.

## Task

1. **Audit first, before any edit.** Grep every consumer of
   `ThemeGraphColors.classBackground|classBorder|iconPrivateColor|…` and
   every call site of `classifierFill()`/`classBorder()`
   (`grep -rn "classifierFill\|classBorder(" src/`) across the WHOLE repo,
   not just `src/core`/`src/diagrams/class`. Confirm the two known callers
   (`renderer-body-enhanced.ts:127 renderEnhancedBody`,
   `class-visibility-icon.ts:308 renderVisibilityUrlBackground`, both
   invoked from `renderer-classifier-box.ts:255,317`) are the full set.
   Journal the result. **Stop 12**: halt before step 2 if any consumer
   outside `src/core` and `src/diagrams/class` would change output.
2. Tests first: a `classBorderColor #FFBD42-white` case asserting a
   `<linearGradient>` def + `stroke="url(#…)"` on the box outline but flat
   `#FFBD42` on the two inner divider lines (`capode-04-jeka075`'s shape);
   one case per separator (`-`, `\`, `/`, `|`) on a dedicated key
   (`taceve-49-mezi408`'s Test1-4); a plain-hex dedicated-key case
   asserting unchanged solid output (regression guard).
3. Widen `ThemeGraphColors.classBackground`, `.classBorder`,
   `.iconPrivateColor`, `.iconProtectedColor`, `.iconPackageColor`,
   `.iconPublicColor` (and any sibling `icon*Color` field the audit finds)
   from `string` to `Paint` in `theme.ts`/`theme-graph-colors-a.ts`/
   `theme-graph-colors-b.ts`.
4. Route the dedicated-key handlers (`applyNormalKey` in
   `skinparam-key-handlers.ts:120-127`, and the `-table-a.ts`/`-table-b.ts`
   entries for `class*Color`/`icon*Color`) through `parseColor` instead of
   `resolveColor`.
5. `classifierFill()`/`classBorder()` (`renderer-classifier-colors.ts`)
   return `Paint`; thread through `resolvePaintAttrs`
   (`svg.ts:204-260,457-510`) into `renderer-classifier-box.ts`'s
   `path()`/`rect()` calls — those already accept `Paint`-typed
   `stroke`/`fill` (`svg.ts:33,49`), so this is mostly mechanical.
6. Divider-line branch (`capode`): the box outline gets the resolved
   gradient `Paint`; the inner divider lines get the flattened colour1
   only — a named `if` in the divider-drawing call, not a second Paint
   resolution path.
7. `.agent-notes/cdd-T18.md`: the audit's consumer list, the divider-line
   branch's exact condition, and whether `dacixi-46-lina038`'s namespace
   `#yellow\gold` case needed batch-4 T11's `Namespace.color` field (it
   should already be on main by batch 6; note if it wasn't).

## Read-set

`src/core/paint.ts:201-236`; `src/core/svg.ts:1-60,204-260,457-510`;
`src/core/color-override.ts` (whole, 57 lines);
`src/core/skinparam-key-normalize.ts:46-68`;
`src/core/skinparam-key-handlers.ts:58-67,120-127`;
`src/diagrams/class/renderer-classifier-colors.ts:95-226`;
`src/diagrams/class/renderer-classifier-box.ts:140-186,255,307-317`.
Java: `klimt/color/HColorSet.java:78-119`;
`klimt/drawing/svg/SvgGraphics.java:357-399,371,415`.
Diagnosis: `diagnosis/A2b-entity-groups.md` E2; `diagnosis/A3-style.md` M4;
`decisions.md` D8.

## Write-set

`src/core/paint.ts`, `src/core/color-override.ts`, `src/core/theme.ts`,
`src/core/theme-graph-colors-a.ts`, `src/core/theme-graph-colors-b.ts`,
`src/core/skinparam-key-handlers.ts`, `src/core/skinparam-key-handlers-
table-a.ts`, `src/core/skinparam-key-handlers-table-b.ts`,
`src/diagrams/class/renderer-classifier-colors.ts` (fill/gradient half —
T20 later owns the border-stroke/dasharray half of the same file, after
this task merges), their `*.test.ts` files, `.agent-notes/cdd-T18.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface out (consumed by T19, T20)

`ThemeGraphColors.classBackground|classBorder|iconPrivateColor|
iconProtectedColor|iconPackageColor|iconPublicColor : Paint` (was
`string`); `classifierFill(geo, theme): Paint`, `classBorder(geo, theme):
Paint` (were `string`) in `renderer-classifier-colors.ts`.

Also, so that T19 and T20 can run in parallel worktrees without sharing a
file: this task extends `class-declaration-extractors.ts#extractDecorations`
(`:72-107`) to return `{ line?: string; text?: string; lineStyle?: 'bold' |
'dashed' | 'dotted' }` parsed from the `line:`/`text:`/`line.bold|dashed|
dotted`/`##[style]colour` remainder (A3 M1: `klimt/color/Colors.java`), with
unit tests for each form. It changes no consumer; today's `undefined`
paths stay `undefined`. Add `src/diagrams/class/class-declaration-extractors.ts`
to this task's write-set.

## Acceptance criteria

- Given `dizuse-83-dabi909`, when rendered, then `<defs>` holds one
  `<linearGradient>` and the class rect's fill is `url(#…)`
- Given `taceve-49-mezi408`, when rendered, then all four separators
  (`\ - / |`) resolve to gradient fills
- Given `capode-04-jeka075`, when rendered, then the outline is a gradient
  and both inner divider lines are flat `#FFBD42`
- Given `dacixi-46-lina038`, when rendered, then the namespace
  `#yellow\gold` resolves as a gradient (consuming T11's `color` field)
- Given the audit in step 1, then every consumer is inside `src/core` or
  `src/diagrams/class`, or the task halted at stop 12 instead of proceeding

## Observability

N/A — no new observable operations; internal type widening + render fix.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all
green. `npx tsx tools/render-diff.mts dizuse-83-dabi909 taceve-49-mezi408
capode-04-jeka075 dacixi-46-lina038 popesa-39-sobe866 mexaka-52-gati860`
before/after with structural counts. Files ≤500 lines, functions ≤30 NLOC,
CCN ≤10, ≤5 params — split `renderer-classifier-colors.ts` into a sibling
module if the widening pushes it over the cap (push-forward list).

## Boundaries

Always: run the audit before any edit; cite `file:line` for every
consumer found. Ask first: any stop condition in `../README.md`. Never:
touch `object`/`map`/`json`'s own `Paint` widening (`classifierFill`'s own
doc comment flags it "out of this iteration's scope" — leave it); fit a
value without an upstream citation; edit outside the write-set (stop 1).

## Commit

`feat(cdd-T18): widen class colour fields to Paint`

Body: why — D8's audit found the class colour seam split into a
Paint-aware generic path and a string-only dedicated-key/classifier-decl
path; this widens the latter to match, with the divider-line
flat-colour1 exception named explicitly.
