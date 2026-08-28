# T4 — Port `ComponentRoseGroupingHeader.java`, both halves

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is the spec.
**Open the method body.** Sequence pixels come from `sequencediagram/teoz/`.

This component draws the grouping frame's border AND its type tab. It is the
reason the frame outline appears **twice** in the jar's output — not because a
call sits outside a guard (the filing says that; it is wrong), but because
`AbstractComponent#drawU:140-147` dispatches to exactly one of two halves per
pass, and this component draws the same `URectangle` in both.

Read `../README.md` and `../decisions.md` first. **D4** governs this task.

## Task

Port `~/git/plantuml/.../skin/rose/ComponentRoseGroupingHeader.java` into
`src/diagrams/sequence/renderer-frame-header.ts` as two pure functions.

**Background half** (`drawBackgroundInternalU:127-134`): apply the symbol
context's stroke and fore colour, build a `URectangle` of the full area
rounded by `roundCorner`, and draw it with `background.bg()`. Under teoz
`this.background = HColors.transparent()` (`:80`), so this emits
`fill="none"` with `stroke:#000;stroke-width:1.5`.

**Foreground half** (`drawInternalU:137-157`), in this order:
1. `getCorner(textWidth, textHeight)` — a `<path>`, NOT a rect. Filled with the
   groupHeader background (`#e` → `#EEE`), stroked black 1.5.
2. The SAME full-area rect again.
3. The tab text at `(paddingX1, paddingY)`.
4. The optional `[comment]` text at `(paddingX1 + textWidth + commentMargin,
   paddingY + 1)`, at `GROUP_FONT_SIZE` — note it uses `style`'s font
   (`smallFont2`, `:85`), not `styleHeader`'s.

Port `getCorner`'s **both** branches (`:159-176`), including `roundCorner != 0`
which no corpus fixture reaches — the long tail is the deliverable.

Do NOT port `rect.setDeltaShadow(symbolContext.getDeltaShadow())` (`:132`);
shadowing is 0 by default. T8 records it in `DIVERGENCES.md`.

## Read-set

- `~/git/plantuml/.../skin/rose/ComponentRoseGroupingHeader.java` — whole file
- `~/git/plantuml/.../skin/AbstractComponent.java:136-148` (the two-half
  dispatch — read this before anything else)
- `~/git/plantuml/.../teoz/GroupingTile.java:243-248` (how `comp` is built),
  `:256-275` (`drawU`)
- `~/git/plantuml/src/main/resources/skin/plantuml.skin:115-129`
- `src/core/svg-shapes.ts:18,106,214` (`rect`, `text`, `path`)
- `src/diagrams/sequence/frame-style.ts` (from T1)

## Interface contract

```ts
/** `ComponentRoseGroupingHeader#drawBackgroundInternalU`. */
export function renderGroupingHeaderBackground(
  frame: FrameGeo, theme: ScaledTheme,
): string;

/** `ComponentRoseGroupingHeader#drawInternalU`. */
export function renderGroupingHeaderForeground(
  frame: FrameGeo, theme: ScaledTheme,
): string;
```

Both read `frame.tabText` / `tabComment` / `tabWidth` / `tabHeight` /
`tabTextWidth`, which T5 populates — the renderer has no measurer.

## Architecture decisions (locked)

- **D4** — both halves; `roundCorner` branch ported; shadowing not.
- **D3** — every constant comes from `frame-style.ts` with its citation.
  **Never fit a value**; if you need one with no `file:line`, stop.

## Acceptance criteria

- Given the background half, then exactly one `<rect>` is emitted, with
  `fill="none"` and stroke black at width 1.5 — nothing else.
- Given the foreground half for a `group` frame (no comment), then exactly
  three elements in order: `<path>`, `<rect>`, `<text>` — and the text is the
  group's own label, at font-size 13 bold.
- Given an `alt` frame with a condition, then four elements, the fourth being
  `[cond]` at font-size 11.
- Given `roundCorner === 0`, then the corner path is
  `M0,0 L w,0 L w,h-10 L w-10,h L 0,h L 0,0` (`getCorner:161-169`).
- Given `roundCorner > 0`, then the path opens at `roundCorner/2, 0` and closes
  with an `arcTo` (`getCorner:170-176`).

## Observability

N/A — no new observable operations. Nothing calls this until T6.

## Rollback

Reversible. New file plus its test.

## Quality bar

The four gates exit 0. 90/90/90 — the `roundCorner` branch needs an explicit
test since no fixture reaches it. Hook-enforced complexity: 500 lines/file,
30 NLOC/function, CCN 10, 5 params. No Prettier.

## Commit

`feat(T4): port ComponentRoseGroupingHeader in both passes`
