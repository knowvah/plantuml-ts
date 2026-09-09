# T1 — The unconsumed resolvers

**Agent:** `typescript-pro` · **Depends on:** —

## Context

Faithful TypeScript port of PlantUML; `~/git/plantuml` is the spec — read
the method body, not a filename. Read [`../README.md`](../README.md) and
[`../decisions.md`](../decisions.md) — D1, D2 and D3 govern this task and
are locked. `activity-style-defaults.ts` is THE ONE PLACE an activity
`plantuml.skin` value is written; extend it, never create a second table.
Its existing `swimlaneTitleFontColor` (`:411`) is the cascade shape to
mirror: explicit skinparam field → element bucket → cited constant via
`resolveColorToSvgHex`.

## Read-set

- `src/diagrams/activity/activity-style-defaults.ts` (whole; especially
  `:355-438`, T2 of the previous mission)
- `src/core/theme-element-resolve.ts:139-141` (`resolveElementMinimumWidth`),
  `src/core/theme.ts:85,470` (`minimumWidth`), `src/core/style-map-element.ts:170-185`
  (how a bucket gets `minimumWidth`), `src/core/theme-graph-colors.ts:135-170`
  (`ElementColors.minimumWidth`, `font`)
- how `skinparam defaultTextAlignment` is parsed today, if at all:
  `rg -n -i 'defaulttextalignment|horizontalalignment' src/core/` — if it is
  unparsed, the resolver's middle tier reads the bucket's alignment only and
  the key is FILED, not added here (`src/core` is outside the write-set)
- Java: `FtileBox.java:80-89` (alignment, padding, font, minimum width),
  `ValueNull.java:55-70`, `FromSkinparamToStyle.java:241,396-407`,
  `StyleStorage.java:102-116`, `plantuml.skin:1-19` (root `FontColor black`
  `:9`, `HorizontalAlignment left` `:12`)
- `docs/catalog.md` row for `activity-style-defaults.ts`

## Write-set

- `src/diagrams/activity/activity-style-defaults.ts`
- `tests/unit/activity/activity-style-defaults.test.ts`
- `docs/catalog.md` only on drift

## Task

Add, with tests first:

```ts
export function activityMinimumWidth(theme: Theme): number;             // D1
export function activityFontColor(theme: Theme, sname: ActivitySName): string; // D3
export function activityHorizontalAlignment(theme: Theme): 'left' | 'center' | 'right'; // D2
```

- `activityMinimumWidth` = `resolveElementMinimumWidth(theme, 'activity') ?? 0`,
  cited to `FtileBox.java:87,237-243`, `ValueNull.java:61-63`,
  `FromSkinparamToStyle.java:241`.
- `activityFontColor` = bucket `font` for `sname` (a `Paint` string) →
  `ACTIVITY_FONT_COLOR = resolveColorToSvgHex('black')` (`plantuml.skin:9`).
  Same `Paint`-string-only handling `swimlaneTitleFontColor` uses.
- `activityHorizontalAlignment` = bucket alignment if `ElementColors`
  carries one → the parsed `defaultTextAlignment` if the theme carries one
  → `'left'` (`plantuml.skin:12`, `FtileBox.java:80,89`). State which tiers
  are reachable today.

Consume NOTHING. No renderer, tile or layout file changes.

## Interface contract (consumed by T2, T4, T5)

The three signatures above.

## Acceptance criteria

- Given the default theme, then minimum width is 0, font colour is
  `resolveColorToSvgHex('black')`'s form, alignment is `'left'`
- Given `skinparam minClassWidth 200` resolved into the theme, then
  `activityMinimumWidth` is 200; given a `<style> activity { MinimumWidth 150 }`
  bucket AND the bare key, then 150 wins
- Given `<style> activityDiagram { activity { FontColor red } }`, then
  `activityFontColor(theme, 'activity')` is red and `('diamond')` is black
- Given the aggregate probe, then it is **EXACTLY 48291** (stop condition 6);
  the four activity oracle gates all pass unchanged

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates green; full `npm test`.

## Commit

`feat(amb-T1): add the activity box width, colour and alignment resolvers`
