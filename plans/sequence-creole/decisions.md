# Decisions — sequence-creole

Confirmed with the maintainer before execution. Treat every one as locked; a
conflicting constraint is a stop condition, not a licence to override.

## D1 — Wire the SHARED ATOM ENGINE, not `TextBlock` and not the span lexer

**Context.** Three paths could carry creole into sequence text, and all three
already exist in this port.

**Decision.** Route each display line through the shared creole atom engine —
`classifyStripeLine` (`core/klimt/creole/legacy/CreoleStripeSimpleParser.ts`)
plus `buildLineAtoms` (`legacy/StripeSimple.ts`), measured by
`core/creole-atoms-measure.ts` — and map each resulting atom to one `TextRun`.

**Why not the alternatives.**

- **`Display.create0` → `TextBlock` → `UGraphicSvg`** is what
  `AbstractTextualComponent` literally does, and is the most faithful. It is
  rejected because a `TextBlock`'s contract is `drawU(ug: UGraphic)`, and the
  sequence engine renders SVG strings rather than through `UGraphic`. Adopting
  `UGraphic` for sequence text would bypass the `sequenceText` seam and the
  carried-metrics rule the parent mission just built, for no output difference:
  `DriverTextSvg` emits one `<text>` per run either way.
- **`core/creole.ts#parseCreole` → `CreoleSpan[]`**, the path
  `annotations/blocks.ts` uses for titles, is rejected because `CreoleSpan`
  carries no url and no atoms. The 47 remaining `<a>` and any future
  `<img>`/`<$sprite>` would be out of reach and need a second pass.

**Precedent, and it is exact.** `class-member-creole.ts` does this already, for
the same reason and with the same charter — "REUSE the engine, don't re-port".
Its upstream mirror, `MethodsOrFieldsArea#createTextBlock` calling
`Display.getWithNewlines(...).create8(...)`, is the same family as sequence's
`create0`. `state` shares the same measure path via
`core/svek/image/leaf-sizing-text.ts`.

**Consequences.** Sequence layout gains a dependency on
`core/klimt/creole/legacy/` and `creole-atoms-measure.ts` — the edge `class` and
`state` already have. Nothing under `core/klimt/creole/` or `core/creole*.ts`
may be modified (stop condition 8).

## D2 — `CreoleMode.FULL`, because that is what the component asks for

**Context.** `class` uses `SIMPLE_LINE` for member rows; description uses
`FULL`.

**Decision.** `FULL`, per `AbstractTextualComponent.java:90`.

**Consequences.** The two modes differ only by the `*`-bullet and `#`-heading
patterns (`CreoleStripeSimpleParser.java:119-147`, both gated on `FULL`), and
this port ported neither for either mode. So `FULL` and `SIMPLE_LINE` are
presently identical here, and the decision costs nothing today — it is recorded
so that whoever ports those two patterns knows sequence expects them.

## D3 — One atom becomes one `TextRun`; the run array is not redesigned

**Context.** The parent mission's Phase A made every sequence text a
`TextRun[]` with per-run measured metrics.

**Decision.** A creole atom maps to a `TextRun` that gains style fields
(`bold`, `italic`, `color`, `decoration`) and an optional `url`. Runs keep
carrying their own `textWidth`; the renderer advances x by the previous run's
width and wraps a url-bearing run in `linkWrap`.

**Why.** It is the jar's own emitted shape — one sibling `<text
textLength="…">` per run, no `<tspan>`, jar-verified on
`object/linazi-45-gevo553` — and both `annotations/blocks.ts` and
`class/renderer-classifier-rows.ts:265-282` already emit exactly that.

## D4 — `\n` splitting is its own task, before any styling

**Context.** Escaped `\n` is the largest single element-count effect (75
fixtures whose only root-child difference is `text`); inline markup is a
content effect.

**Decision.** C2 does `\n` alone, across all four kinds. C3–C6 do markup.

**Why.** The two effects are measured by different instruments — cohort count
versus content mismatch — and landing them together makes both unreadable.
That is precisely how the parent mission's A4 shipped an unscaled run array
without noticing.

## D5 — Metrics stay carried from layout; the renderer still formats only

**Context.** The parent mission's D1: layout measures, geometry carries, the
renderer does no metric arithmetic.

**Decision.** Unchanged and inherited. Creole measurement happens in layout
through `creole-atoms-measure.ts`; the renderer reads `run.textWidth` and never
calls a measurer.

**Consequences.** Every per-atom width, and any atom-driven line-height excess
(`lineAtomHeightExcess`), is resolved before the geometry leaves layout.
