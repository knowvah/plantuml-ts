# T5 — `core/svg.ts`: central format + all six rules

**Agent:** typescript-pro · **Depends on:** T1 · **Commit:** `feat(T5): centralize numeric formatting in core/svg.ts emitter`

## Context

**This is the highest-leverage task in the mission.** `src/core/svg.ts` is
the port's *second* SVG emitter — a hand-rolled string builder used by the
class, state and object engines, which together own ~394 of the 445
pinned goldens. The klimt emitter (T3/T4) covers only the 51 description
goldens.

Its `attrs` and `attrsFromRecord` stringify via bare `String(value)` —
**there is no numeric formatting at emission at all.** The class engine
compensates by pre-rounding geometry with `javaRound4` at 23 call sites
(see `class-edge-geo.ts:212-219`, mission G2 N35). ADR-1 reverses that:
formatting moves here, and T6a–T6e/T7 then delete the pre-rounding.

⚠️ Gate deferred (ADR-5): SVG-comparing tests fail until batch-2d.

## Read-set

- `.agent-notes/svg-output-size-reduction-measured.md` — **the spec**
- `plans/svg-output-size-reduction/decisions.md#adr-1`, `#adr-2`, `#adr-3`
- `src/core/svg-format.ts` — T1's module
- `src/core/svg.ts` — `attrs` (:131-141), `attrsFromRecord` (:147-155),
  `resolvePaint`/`resolvePaintAttrs` (:170-218), `group` (:220-248),
  `svgRoot` (:393), and the `SvgTextOpts` fields `textLength`/`lengthAdjust`
  (~:81-95)
- `src/core/klimt/drawing/svg/svg-graphics-core.ts` — read T3's result for
  the equivalent decisions; the two emitters must agree

## Write-set

- `src/core/svg.ts`
- `tests/unit/core/svg.test.ts` (and any sibling test file for this module)

## Task

**Rule 1 + ADR-1 — central formatting.** Make `attrs` and
`attrsFromRecord` format every **numeric** value through
`formatDecimal(value, decimals)` instead of `String(value)`. String values
pass through untouched. Thread a `decimals` parameter defaulting to
`DEFAULT_SVG_DECIMALS` (ADR-2) rather than hardcoding 3.

This is the change that lets T6a–T6e delete `javaRound4`. Any numeric
attribute that currently reaches the output unrounded will change — that
is the point, and the golden regeneration will show it.

Audit for numeric attributes built by **template literal** rather than
through `attrs`/`attrsFromRecord` — e.g. the `stroke-width` interpolations
around :346-350. Those bypass the choke point and must be routed through
the formatter too, or they will emit raw floats forever. Enumerate them;
do not assume the two builders are the only path.

**Rule 2 — `shortenColor`** at every color-valued attribute: `fill`,
`stroke`, gradient stops in `resolvePaint`.

**Rule 3 — root attributes.** `svgRoot` (and/or the root `group`) gains
`font-family="sans-serif"` and `lengthAdjust`; text emission drops the
per-element `lengthAdjust` and emits `font-family` only when it differs
from `sans-serif` (case-insensitive). `textLength` stays per-element.

**Rule 4 — `stroke:none`** suppresses `stroke-width` and
`stroke-dasharray`, wherever this module emits them.

**Rule 5 — single-glyph `textLength`** skipped when the text is one
character.

**Rule 6 —** route opacity/percent through `formatOpacity`/`formatPercent`.

## Interface contract (consumed by T6a–T6e, T7)

After this task, `attrs`/`attrsFromRecord` (and every template-literal
site you routed) apply decimal formatting at emission. Callers **must
stop** pre-rounding geometry with `javaRound4`/`javaFixed4`; doing both is
the double-rounding defect ADR-1 exists to remove.

## Acceptance criteria

1. Given a numeric attribute value of `77.8125`, when emitted through
   `attrs` or `attrsFromRecord`, then `77.813`.
2. Given a value of `19.418750000000003` (the G2 N35 case), when emitted,
   then `19.419` — with **no** caller-side pre-rounding.
3. Given `stroke:none`, then neither `stroke-width` nor `stroke-dasharray`
   is emitted; given `#FF0000`, then `#F00`.
4. Given the root element, then it carries `font-family` and
   `lengthAdjust`; given a text element in the default family, then it
   carries neither.
5. Given single-character text, then no `textLength`.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — with the rest of batch-2a–2d (ADR-5). Reverting this
alone while T6a–T6e have landed would leave geometry *unrounded on both
sides*, so these commits revert together.

## Quality bar

- `npm run typecheck` and `npm run lint` pass. Cold-tree `npm test`
  expected red until batch-2d.
- Watch the 500-line cap (`core/svg.ts` is 414 lines; formatting logic will
  grow it). If a split is needed use the repo's re-export pattern.
- **Enumerate the template-literal numeric sites in the commit body.** The
  next person needs to know the audit happened and what it found.

## Boundaries

- **Always:** import rules from `src/core/svg-format.ts` (ADR-3); keep the
  two emitters' behavior identical.
- **Ask first:** if formatting at emission changes a value the class
  engine's layout arithmetic then consumes (rather than only emits) — that
  is a layout change, not an emission change, and is a stop condition.
- **Never:** modify `src/diagrams/**` (T6a–T6e, T7 own those call sites);
  regenerate goldens; run any `git` command.
