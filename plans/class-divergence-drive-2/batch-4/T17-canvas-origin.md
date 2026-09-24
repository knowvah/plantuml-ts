# T17 — canvas 1 px at its origin

**Agent:** debugger in fix mode (sonnet, effort high) · **Depends on:** T16

## Fixtures

jixamu-89-ribo225, gatula-10-bifu561, jubobo-22-fapu993,
bejeli-39-sina124, julixi-10-jide878, rulite-35-muno361,
cacoma-43-poxu615, daxeno-00-kasu166, sijisi-94-ripu606. lojiga moved
to T7b (structural: unported `USymbolStack`); xosiza settled by T6 as
`open -> next-missions` (R-4, below).

## Mechanisms · Write-set

From `diagnosis/R.md` (quoted into the prompt). Re-measure first: batches
1–3 may already have moved some of these (journal which). R.md REFUTED the
old "~0.005 px rounding" attribution for gatula/jixamu/xosiza.

- **R-1** jixamu (HIGH) — `assoc-circle` falls through `addClassifierInk`
  to the box rule; upstream draws a bare `UEllipse` (`LimitFinder#drawEllipse`).
  Dispatch it to `addEllipseInk` beside `usecase`/`lollipop`
  (`class-ink-box.ts:230-247`, T6 confirmed no `assoc-circle` arm); retire
  the "not extended" note in `class-ink-shapes.ts:178-185` for it.
- **R-3** jubobo, bejeli (MEDIUM-HIGH) — fully suppressed body
  (`BodierLikeClassOrObject#getBody` → `TextBlockUtils.empty(0,0)`) still
  gets `addRectInk`'s Y un-inset; thread a body-ink-height flag like the
  existing `bodyInkWidth` from `class-layout-generic-classifier.ts:318-323`.
  Trace the Java branch before editing.
- **R-2** gatula (MEDIUM, trace first) — shown-but-empty body (`mergeTB`
  of two empty areas, a DIFFERENT branch from R-3); `bodyInkWidth` is set
  only for `object` (`class-object-sizing.ts:248`). Do not fold R-2 into
  R-3's flag without a jar trace showing both branches have zero width.
- **R-5** julixi, rulite; **R-6** cacoma; **R-7** daxeno; **R-9** sijisi —
  OPEN, diagnose first (R.md "ruled out" + "instrument next" per
  fixture). An origin in dot-engine coordinates: stop 8. An origin that
  would need an epsilon/rounding change: stop 12.
- **R-4** xosiza — NOT a jar divergence: our raw extent is 186.999992
  (floors to the jar's 187+1), and `absorbLayoutEpsilon`
  (`core/layout-epsilon.ts:33-35`, called at `TextBlockExporter.ts:72-73`)
  rounds it UP to 187.000. Any change is a rounding-policy change (D6);
  settled out of mission by T6 (journal row 10). Do not touch.

Write-set: `src/diagrams/class/class-ink-box.ts`, `class-ink-shapes.ts`,
`class-layout-generic-classifier.ts`, `class-geo-types.ts`,
`class-object-sizing.ts`, `layout-ink-extent.ts`, tests beside each; an
OPEN mechanism landing outside: report (stop 1).

## Read-set

`diagnosis/R.md`; `decisions.md` D6; `src/diagrams/class/layout-ink-extent.ts:1-105`
(module doc: the ported canvas chain); prior T35 spec and journal rows.

## Acceptance criteria

- Given each fixture, when it renders, then `svg/@width`, `@height` and
  `@viewBox` equal the jar's exactly
- Given the fix, when reviewed, then it changes an ink term that mirrors a
  cited `LimitFinder`/`SvekResult`/`TextBlockExporter` line, and adds no
  epsilon or rounding tie-break (stop 12)
- Given an origin in dot-engine coordinates, when confirmed by probe, then
  a `docs/graphviz-issues/` file + `TRACKER.md` line exist and the fixture's
  `final` names it
- Given the 13 fixtures T35 made canvas-exact, when render-all runs, then
  they stay exact

## Observability · Rollback

N/A. Reversible.
