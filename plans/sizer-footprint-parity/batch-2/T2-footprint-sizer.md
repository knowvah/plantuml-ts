# T2 — Route the usecase sizer through the real `Footprint`

## Context

Upstream gets ink by DRAWING. `Footprint` is a point-collecting `UGraphic` —
`draw(UShape)` accumulates `new XPoint2D(x, y)` — and
`TextBlockInEllipse.java:60` builds one, draws the text block through it, and
fits an ellipse to the points.

**This port already does that, on the renderer side.**
`src/core/klimt/shape/TextBlockInEllipse.ts:7,37-38` imports `Footprint` and
calls `getEllipse(text, alpha)`; it is reached from `USymbolUsecase.ts`.

The SIZER does not. It uses `footprintBoxes` →
`src/diagrams/description/usecase-footprint.ts` (152 lines), an analytic
substitute that must be TOLD each sprite's ink — which is why the previous
mission added optional ink fields to `AtomImageResolver`, and why a
multi-line sprite display still mis-stacks.

## Task

1. Route the usecase sizer through `TextBlockInEllipse`/`Footprint` — the
   same path the renderer uses.
2. Retire `usecase-footprint.ts` and `footprintBoxes`.
3. **Delete the optional `inkX`/`inkY`/`inkWidth`/`inkHeight` from
   `AtomImageResolver`** in `src/core/creole-atoms.ts`, plus their consumers
   in `sprite-commands.ts` / `leaf-sizing-text.ts`.

**DO NOT delete `SpriteSvg.ts`'s `inkX/inkY/inkWidth/inkHeight`.** Those are
pre-existing and legitimate — the previous mission's ADR-2 *mirrored* them.
Only the `AtomImageResolver` additions go. Verify by reading before deleting.

## Write-set

- `src/diagrams/description/leaf-sizing-text.ts`
- `src/diagrams/description/usecase-footprint.ts` (delete)
- `src/core/creole-atoms.ts`
- `src/core/sprite-commands.ts`
- co-located tests

`leaf-sizing.ts` is **T3's** — do not touch it.

## Read-set

- `~/git/plantuml/.../klimt/shape/TextBlockInEllipse.java:44-70`
- `~/git/plantuml/.../svek/image/Footprint.java:65-189` — `MyUGraphic`, `draw`, `getEllipse`
- `src/core/klimt/shape/TextBlockInEllipse.ts:7,22-56`
- `src/core/svek/image/Footprint.ts:148+`
- `src/core/decoration/symbol/USymbolUsecase.ts:14` — how the renderer reaches it
- `src/diagrams/description/leaf-sizing-text.ts:299-320` — `footprintBoxes`
- `decisions.md#adr-2--route-the-usecase-sizer-through-textblockinellipsefootprint`

## Acceptance criteria

- Given a usecase display, when sized, then the footprint comes from `Footprint`'s collected points, not an analytic box
- Given a sprite whose ink differs from its declared box, when sized, then the ellipse fits the INK — with no ink field on the resolver
- Given a MULTI-LINE sprite display, when sized, then stacking is correct — this sub-case should dissolve, not need its own fix
- Given `AtomImageResolver`, then it carries no ink fields; given `SpriteSvg`, then its own ink fields are UNTOUCHED
- Given the sizer↔renderer parity guard, then it is green
- Given the suite, then no size pin widens and no diff-count baseline rises

## If ink still has to be passed in

**STOP.** ADR-2's premise is that drawing through `Footprint` makes the ink
channel unnecessary. If it does not, say so with the `file:line` that forces
it rather than reinstating the channel.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — one commit. Note it deletes a file (`usecase-footprint.ts`);
revert restores it.

## Quality bar

All four gates (lint separately). Ratchets: description >= 320/351 w0, DOT
262/90/708 EQUAL, class 219/708 w0, parity guard green, no diff-count rise.
