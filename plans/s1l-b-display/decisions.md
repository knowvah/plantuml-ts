# Architecture decisions — S1L-b (locked)

Confirmed 2026-07-27. Treat as fixed; if a conflicting constraint appears, STOP
and log to `decision-journal.md` rather than silently overriding.

## ADR-1 — Fix the creole-HR render crash by wiring the interceptor

**Context:** A `UHorizontalLine` from a `[ … ==== … ]` body reaches
`LimitFinder.draw` raw and throws `unsupported shape UHorizontalLine`.
`UHorizontalLine` is an *infinite, stencil-clipped* rule (no coordinates); it
needs a `Stencil`-supplying graphic to draw. `AbstractUGraphicHorizontalLine`
and `UGraphicStencil` are **already ported** — just not wired into the
description node-body render path.

**Decision:** Wire the existing `AbstractUGraphicHorizontalLine`/`UGraphicStencil`
interception into the node-body creole render path, so `UHorizontalLine` is
converted to a drawn rule with the enclosing box's x-extent **before** reaching
`LimitFinder`. Do **NOT** add a `UHorizontalLine` branch to `LimitFinder` —
that is architecturally wrong (LimitFinder cannot supply the stencil extent) and
contradicts the faithful port.

**Consequences:** Matches upstream. HR renders correctly. If the fix seems to
require editing `LimitFinder`'s dispatch, that is the signal the interception is
wired at the wrong layer — STOP.

## ADR-2 — Creole formatting-aware width via the lexer (no bold-width fix)

**Context:** Formatting tags (`<b>`, `<color:…>`, …) were measured as literal
text. The deterministic `WidthTableMeasurer` is **weight-agnostic** (bold =
normal advance widths — see its own doc), so measuring inner text at normal
weight is *exact* against the oracle.

**Decision:** Reuse the existing creole lexer (`creole-lexer.ts` —
`tokenise`/`mergeSpans`) to parse each display line into spans and sum the span
*text* widths, instead of the WIP's ad-hoc regex strip. There is **no** separate
bold-glyph-width task.

**Consequences:** Correct for all creole (bold/italic/color/size); removes a
sub-task. Slightly more integration than a regex.

## ADR-3 — Scoped `<style> MinimumWidth` resolved per-element

**Context:** `zotiru-33` sets `<style> package { MinimumWidth 300 }`; it must
floor packages (not_nested → 4.583in) but NOT the sibling `card c`.

**Decision:** Resolve `MinimumWidth` per-element through the scoped-style-block
path (the same mechanism pass-13 used for scoped skinparam blocks), threaded to
`BoxSizingOpts.minimumWidth` per node. Do **NOT** map it to a global
`theme.minimumWidth` (that floors every box).

**Consequences:** Correct scoping. Reuses the S1L-g `BoxSizingOpts` seam.

## ADR-4 — Fixed 8px HR height (verify per-style in-batch)

**Context:** `====` verified 8px vs the oracle (`node [foo1 ==== foo2]` =
14+8+14+30 = 66px). `----`/`____` unverified.

**Decision:** Use a fixed 8px for all HR styles; verify `----`/`____` against the
oracle during T3 and split per-style **only if** a fixture proves a difference.

**Consequences:** Simple; avoids speculative per-style constants.

## ADR-5 — fariba's residual is diagnosed, not force-fixed

**Context:** `fariba-82` (JSON body, no HR) sits ~0.034in over after the
strip+HR fixes; it is **not** bold-width (measurer is weight-agnostic).

**Decision:** Diagnose the exact mechanism in T6 (diagnosis discipline —
file:line + causal chain). Apply a fix only if cheap and in-scope; otherwise
leave `fariba-82` pinned at its true delta with a documented reason.

**Consequences:** The mission is not held hostage to one compound fixture.
