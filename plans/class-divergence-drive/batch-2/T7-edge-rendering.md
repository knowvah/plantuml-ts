# T7 — edge rendering: icons, url wrap, note body, new decors, constraint, quantifier, hidden skip

**Agent:** typescript-pro (sonnet) · **Depends on:** T6

## Context

T5 widened the AST, T6 carried the new fields through geometry; this task
draws them. Six mechanisms: A2a M2 (visibility icon glyph), M3 (`[[url]]`
→ `<a>` wrap), M5 (note-on-link body/fold/text — reuses `renderer-note.ts`'s
CURRENT path builder; A5 M2's fix to that builder lands in batch 3's T8,
after this task, so `lipazi-06-care921`'s note vertices/fold paint stay
non-byte-exact until then — this task only restores the missing children),
M6 (new extremity decors + `middleDecor`'s `labelShield`), M9 (constraint
line+text), M10 (quantifier lines), M12 (skip `hidden` links); plus A5 M4
(port `DotPath#getMiddle`, documented unported at `DotPath.ts:107`, for the
`-0)-` arc+ellipse). Report: `diagnosis/A2a-link-groups.md` M2, M3, M5, M6,
M9, M10, M12; `diagnosis/A5-geometry.md` M4. Re-read the Java before
editing — the report is a lead.

## Task

1. Tests first per mechanism, one minimal fixture each (reuse the AC slugs
   below as the golden targets via `render-diff.mts`).
2. `renderer-edge.ts#renderEdgeMainLabel`: emit `<g
   data-visibility-modifier="...">` + `<rect/>` from `geo.visibilityIcon`
   using `src/core/skin/VisibilityModifier.ts`'s existing drawable — no new
   icon shape.
3. When `rel.url` is set, wrap the ENTIRE link group body (path, polygons,
   label, note — everything already emitted) with `linkWrap`
   (`src/core/svg.ts`) so the jar's single `<a>` child count matches
   exactly (`fitini-85-kupo803`: 1 child, not 3).
4. Emit `geo.noteBox` as body path + fold path + text, reusing
   `renderer-note.ts`'s CURRENT plain-note path builder (`:366-382`) — call
   it, don't copy it. Note in the commit body that this fixture's exact
   vertex order/paint is corrected by batch 3's T8, not this task.
5. `renderer-arrowhead.ts`: dispatch `redefines`/`definedBy`/`arrowTriangle`
   /`circle`/`circleFill`/`circleConnect`/`halfArrowUp`/`halfArrowDown` to
   the matching `src/core/svek/extremity/*` factory via `link-decor.ts:
   47-68`; for `middleDecor`, set `labelShield = 7`
   (`SvekEdge.java:373-376`) before label placement runs.
6. Port `DotPath#getMiddle` (`klimt/shape/DotPath.java:154+`) into
   `src/core/klimt/shape/DotPath.ts` (replacing the `:107` unported note);
   emit the arc `<path>` + filled `<ellipse>` for `middleDecor ===
   'circleConnect'` at the returned midpoint/tangent.
7. Emit `geo.constraint` as a dashed `<line stroke-dasharray="3,3">` +
   `<text>` (A2a M9's own confidence is MEDIUM-HIGH — the Java `drawMe`
   body itself was not read by the diagnosis; confirm the exact attributes
   against the rendered jar SVG before hardcoding).
8. Emit one `<text>` per `geo.quantifierLines[n]` entry instead of the
   current single raw-string anchor.
9. Skip the entire link group when `rel.hidden === true` (`guxode-39-
   dobi371` — no `<g class="link">` for `A-B` at all).
10. `.agent-notes/cdd-T7.md`: the `LinkConstraint.drawMe` attributes as
    read from the jar SVG, for anyone who later reads the real Java body.

## Read-set

`src/diagrams/class/renderer-edge.ts` (whole); `renderer-arrowhead.ts`
(whole); `src/core/klimt/shape/DotPath.ts:100-115` (the unported note) +
`net/sourceforge/plantuml/klimt/shape/DotPath.java:140-200` (`getMiddle`);
`src/core/skin/VisibilityModifier.ts:89-140`; `src/core/svg.ts` (`linkWrap`
— grep for it, read its signature); `src/diagrams/class/renderer-note.ts:
354-382`; `src/core/svek/extremity/link-decor.ts:47-68` +
`ExtremityCircleConnect.ts`, `ExtremityExtendsLike.ts`,
`ExtremityHalfArrow.ts`, `ExtremityCircle.ts`; `net/sourceforge/plantuml/
svek/SvekEdge.java:373-376,835-861,956-1011`.

## Write-set

`src/diagrams/class/renderer-edge.ts`, `renderer-arrowhead.ts`,
`src/core/klimt/shape/DotPath.ts`, their `.test.ts` files,
`.agent-notes/cdd-T7.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface in (from T6, and via T6 from T5)

`EdgeGeo.{ visibilityIcon, noteBox, constraint, quantifierLines, dashed }`;
`Relationship.{ url, hidden, middleDecor, sourceDecor, targetDecor }`.

## Acceptance criteria

- Given `lipazi-06-care921`, when rendered, then the link group's children
  are the note rect path, the corner path and the text (structural
  presence — byte-exact vertex order lands with batch 3's T8)
- Given `cenubi-27-xova754`, when rendered, then the link group has an arc
  `<path>` and a filled `<ellipse>` at the line midpoint and the fixture is
  survey-conformant
- Given `fitini-85-kupo803`, when rendered, then the link group's only
  child is `<a>`
- Given `guxode-39-dobi371`, when rendered, then no `<g class="link">`
  exists for `A-B`
- Given `nixema-71-tuke505`, when rendered, then both ends draw their
  factory polygons (DEFINEDBY: polygon + 2 ellipses; REDEFINES: polygon +
  line)
- Given `gikipi-69-pepo172` and `gixesa-28-feri809`, when rendered, then
  both are survey-conformant

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`render-diff.mts` on every AC slug before/after. `renderer-edge.ts` (432
lines) is approaching the hook cap; `DotPath.ts` gains `getMiddle` — a
split re-export is pre-authorised (stop 1) if either crosses 500 lines.

## Boundaries

Always: reuse `renderer-note.ts`'s CURRENT builder for step 4, don't
pre-empt T8's fix. Ask first: any stop condition in `../README.md`; the
`LinkConstraint.drawMe` attribute shape (step 7) if the jar SVG's
`stroke-dasharray` differs from `3,3` — confirm before hardcoding. Never:
touch `renderer-note.ts` itself (T8's write-set, batch 3) or
`class-edge-geo.ts`/`class-geo-types.ts` (T6's write-set, already merged).

## Commit

`feat(cdd-T7): render link url wrap, note body, new decors, constraint`

Body: cites A2a M2/M3/M5/M6/M9/M10/M12 and A5 M4; notes the T8 dependency
for `lipazi`'s byte-exact note shape.
