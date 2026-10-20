# T1c — `paint` on every geo node; scaling

Agent: `typescript-pro`, worktree `sdd1-T1c`. Commit:
`refactor(sequence): add the paint field to sequence geometry`.

## Context
plantuml-ts ports PlantUML faithfully; the Java is the spec. Batch 2/3
families resolve each element's `Style` at layout and hand the renderer its
paint through the geometry (D1), so the renderer stops reading
`theme.colors` for style-owned properties (D5). T1a defined
`SequencePaint` (`src/diagrams/sequence/sequence-skin-param.ts`). Geometry
lives in `geo.ts` + `geo-participant.ts`, `geo-message.ts`, `geo-frame.ts`,
`geo-annotation.ts`; `scale-geo.ts` (`scaleParticipant:136`, `scaleBox:153`,
`scaleMessage:170`, `scaleNote:185`, `scaleActivation:198`, `scaleFrame:209`,
`scaleDivider:233`, `scaleSpace:246`, `scaleNewpage:252`) rescales geometry
for `scale N`. Today strokes are scaled through `theme.scaleK`
(`renderer-lifeline.ts:215`). Families populate the field; this task only
adds it, so that five parallel batch-2 tasks never write the same geo file.

## Task
1. Add `readonly paint?: SequencePaint` to `ParticipantGeo`, `BoxGeo`,
   `MessageGeo`, `ActivationGeo`, `NoteGeo`, `FrameGeo` (plus a header paint
   for group/ref headers), `DividerGeo`, `DelayGeo`, `NewpageGeo`, the
   lifeline segment and the destroy cross. Add nothing else.
2. **Read upstream before scaling anything**: how `scale` reaches strokes,
   corners and padding — the `UGraphic` scale transform the jar applies at
   export (`ImageBuilder` / `UGraphicSvg` / the `SvgGraphics` stroke-width
   emission) — and quote it in the commit body. Then scale `paint` in
   `scale-geo.ts` the same way (thickness, roundCorner, dash, padding:
   whichever the jar scales), or not at all if the jar scales at emission
   and the port's renderer already applies `scaleK` at emission.
3. Tests: a scaled geo with and without `paint`; existing geometry tests
   unchanged.

## Write-set
`src/diagrams/sequence/{geo,geo-participant,geo-message,geo-frame,
geo-annotation,scale-geo}.ts`, their unit tests under `tests/unit/sequence/`.

## Read-set
`decisions.md#d1`, `#d5`; T1a's `SequencePaint`; `scale-geo.ts` (whole);
`geo*.ts` (whole, small); `renderer-lifeline.ts:200-230`; Java:
`klimt/drawing/svg/SvgGraphics.java` (stroke-width emission), the export
scale path from `core/ImageBuilder.java` (grep `scale`).

## Interface contracts
Input (T1a): `SequencePaint`. Output (consumed by T2*, T3*): the optional
`paint` field on each geo type above; `scale-geo` handles it, so a family
never edits `scale-geo.ts`.

## Acceptance
- Given any corpus fixture, then output is byte-identical to b0 (no
  producer sets `paint` yet).
- Given a geo with `paint.thickness 0.5` under `scale 2`, then the scaled
  value matches the upstream site quoted in the commit (unit test names it).
- Given `grep -n "paint" src/diagrams/sequence/scale-geo.ts`, then every geo
  type with `paint` is handled.

Quality bar: targeted vitest (`tests/unit/sequence/**scale**`, geo tests) +
typecheck + eslint. Boundaries: no parser/AST/renderer/layout file; no Serena
edit tools. Observability: N/A — no new observable operations. Rollback:
Reversible.
