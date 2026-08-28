# T1 — Frame colour + tab contract

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` is the canonical specification: **open the method body**, never
a filename or a summary. Sequence pixels come from
`net/sourceforge/plantuml/sequencediagram/teoz/` — `sequencediagram/graphic/` is
DEAD (see `prior-observations.md` §4).

This mission ports the sequence background pass. This task lays the type
contract every other task consumes, and gives the cited style constants a home.

Read `../README.md` and `../decisions.md` first. D3 is the decision that
governs this task.

## Task

1. Add to `FrameEvent` and `FrameGeo` (`src/diagrams/sequence/ast.ts`) the
   colour fields below, and to `FrameGeo` the header-Display fields.
2. Carry them through `scaleFrame` in `src/diagrams/sequence/scale-geo.ts` —
   **lengths scale, colour tokens do not**.
3. Create `src/diagrams/sequence/frame-style.ts` with every constant in the
   table below, each carrying its `resources/skin/plantuml.skin:NNN` in a
   comment, plus `groupingHeaderDisplay()`.
4. Repoint `theme.colors.frame` — the light default at `src/core/theme.ts:272`
   (`#999999`) and the dark value at `:347` (`#666666`) — to black, citing
   `plantuml.skin:117`.
5. **(D3 amendment, 2026-08-28.)** Update the two stale regression assertions
   at `tests/unit/measurer.test.ts:61` and `:136` to `#000000`, citing
   `plantuml.skin:117`. D3's original claim that `colors.frame` "appears only
   at `theme.ts:212,272,347`" was false — it appears at 7 sites (measured), and
   these two pin the exact values D3 corrects. `tests/unit/measurer.test.ts` is
   hereby part of this task's write-set.

Do NOT wire anything up. No renderer or layout changes; those are T5 and T6.

## Read-set

- `src/diagrams/sequence/ast.ts:154-183` (`FrameEvent`), `:419-446` (`FrameGeo`)
- `src/diagrams/sequence/scale-geo.ts:170-182` (the dispatch), `scaleFrame`
- `src/core/theme.ts:212,272,347` (`colors.frame`)
- `~/git/plantuml/src/main/resources/skin/plantuml.skin:102-129`
- `~/git/plantuml/.../teoz/GroupingTile.java:120-131` (the Display rule)
- `~/git/plantuml/.../skin/rose/ComponentRoseGroupingHeader.java:73-77`
  (the `ClockwiseTopRightBottomLeft.topRightBottomLeft(1, 30, 1, 15)` padding
  and `cornersize = 10`)

## Interface contract — consumed by T2, T3, T4, T5, T6

```ts
// FrameEvent additions — RAW source tokens, resolved late
// (`core/klimt/color/HColorSet.ts`'s "stored verbatim, interpreted late")
backColorElement?: string;   // CommandGrouping COLORS group 0 — the TAB fill
backColorGeneral?: string;   // CommandGrouping COLORS group 1 — the BODY band

// FrameGeo additions
backColorElement?: string;
backColorGeneral?: string;
branchSeparators: { y: number; label: string; backColorGeneral?: string }[];
// The header Display, resolved in LAYOUT because the renderer has no measurer
tabText: string;          // GroupingTile:126-127
tabComment?: string;      // the `[comment]` half; absent when title === 'group'
tabTextWidth: number;     // measure(tabText) at HEADER_FONT_SIZE, bold
tabWidth: number;         // HEADER_PADDING.left + tabTextWidth + HEADER_PADDING.right
tabHeight: number;        // textHeight + 2 * paddingY
```

```ts
// frame-style.ts
export const GROUP_BACKGROUND = 'transparent';   // plantuml.skin:103
export const GROUP_LINE_COLOR = 'black';         // plantuml.skin:117
export const GROUP_LINE_THICKNESS = 1.5;         // plantuml.skin:118
export const GROUP_FONT_SIZE = 11;               // plantuml.skin:119
export const GROUP_FONT_BOLD = true;             // plantuml.skin:120
export const HEADER_LINE_THICKNESS = 1.5;        // plantuml.skin:124
export const HEADER_BACKGROUND = '#e';           // plantuml.skin:125
export const HEADER_LINE_COLOR = 'black';        // plantuml.skin:126
export const HEADER_FONT_SIZE = 13;              // plantuml.skin:127
export const HEADER_FONT_BOLD = true;            // plantuml.skin:128
export const HEADER_PADDING = { top: 1, right: 30, bottom: 1, left: 15 };
                                                 // ComponentRoseGroupingHeader.java:74
export const CORNER_SIZE = 10;                   // ComponentRoseGroupingHeader.java:65

export function groupingHeaderDisplay(
  title: string, comment: string | undefined,
): { tabText: string; tabComment?: string };     // GroupingTile.java:126-127
```

## Architecture decisions (locked)

- **D3** — constants live here with citations; `theme.colors.frame` is
  corrected rather than duplicated.
- **Never fit a value.** Every constant above has a `file:line`. If you need
  one that does not, **stop** (stop condition 5).

## Acceptance criteria

- Given `title === 'group'` and comment `'foo'`, when `groupingHeaderDisplay`
  runs, then `tabText === 'foo'` and `tabComment === undefined`.
- Given `title === 'alt'` and comment `'cond'`, then `tabText === 'alt'` and
  `tabComment === 'cond'`.
- Given `k = 2`, when `scaleFrame` runs, then `tabWidth`, `tabHeight` and
  `tabTextWidth` scale by 2 and `backColorGeneral` / `backColorElement` /
  each separator's colour pass through **unchanged**.
- Given every exported constant, then each carries a `plantuml.skin:NNN` or
  `ComponentRoseGroupingHeader.java:NN` citation in a comment.

## Observability

N/A — no new observable operations. This task changes no rendered output, so
it does not move the ratchet.

## Rollback

Reversible. Type-only plus one theme default; reverting the commit restores
prior behaviour exactly.

## Quality bar

**Amended 2026-08-28 (D9).** `npm run lint`, `npx vitest run tests/unit` and
`npm run build` must exit 0. `npm run typecheck` is DEFERRED to the Batch 2
gate: making the tab fields required breaks `sequence-layout-events.ts:176`
(T5's file) and `tests/unit/sequence/renderer.test.ts:716,734,751` (T6's), and
no fix exists inside this write-set. T1 commits with exactly those four
`TS2739` errors and no others. New code is covered to the repo's 90/90/90 floor.
No Prettier (it rewrites every quote and no gate catches it).

## Commit

One commit: `feat(T1): add the frame colour and header-tab contract`
