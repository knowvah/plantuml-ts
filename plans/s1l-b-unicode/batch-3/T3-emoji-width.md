# T3 — Emoji / wide-glyph width: fixed fallback or documented residual

## Context
`lurupu-11-fubo915` (Δ2.05in) uses emoji/symbols in usecase labels:
`<U+1F601>`😁 `<U+1F680>`🚀 `<U+263A>`☺ `<U+221E>`∞ and `&#8734;`∞, inside `<b>`
and `<font Segoe UI Emoji>`. After T1 these decode to real code points, but the
deterministic `WidthTableMeasurer` (`src/core/measurer.ts` +
`measurer-width-table.data.ts`, a 96-entry port of upstream `StringBounderFixed`)
has NO entry for above-BMP / emoji code points, so their glyph width is wrong.
The oracle was generated with real AWT font metrics. See `decisions.md` ADR-3.

## Task (diagnosis-first)
1. Measure the gap: how does `WidthTableMeasurer.measure` currently size an
   emoji / `<U+221E>` code point (0? default?) vs the oracle's per-glyph width?
2. Test whether ONE fixed fallback width for above-BMP / unknown-wide code
   points closes lurupu-11's delta to ≤0.01in without moving other goldens.
3. If cheap and portable, apply it (with a unit test). ELSE document lurupu as
   a named residual/divergence (deterministic table ≠ AWT emoji metrics) in
   `plans/s1l-leaf-sizing/ledger.md` and keep its pin. Do NOT hand-tune
   per-emoji widths.

## Read-set
- `src/core/measurer.ts` (`WidthTableMeasurer.measure`, the width lookup),
  `src/core/measurer-width-table.data.ts` (the 96-entry table).
- `oracle/corpus-cache/usecase/lurupu-11-fubo915/input.svg` +
  `oracle/goldens/description/lurupu-11-fubo915/svek-1.dot`.
- `planning/mission-guide.md:40-48` (the files-diagram emoji `ICON_WIDTH=20`
  precedent — a fixed fallback is an established pattern).
- `decisions.md#adr-3`.

## Write-set
- Per finding: `src/core/measurer.ts` (+ a unit test) — OR
  `plans/s1l-leaf-sizing/ledger.md` (document + keep the pin).

## Boundaries
- Do NOT build a per-emoji width table. One portable fallback, or document.
- Do NOT move any other fixture's pin.

## Observability
N/A.

## Rollback
Reversible — revert the commit.

## Quality bar
If a fix lands: lurupu delta ≤ its prior pin (no widen), other goldens
unchanged (structure EQUAL, zero widened), unit test passes. If documented:
`measure` exit 0 with lurupu pinned at its true delta.

## Acceptance criteria (Given/When/Then)
- Given an emoji code point (e.g. `<U+1F601>`), when measured, then its width is
  the chosen fixed fallback (fix) OR the residual is documented (no fix).
- Given a cheap portable fallback, when applied, then `lurupu-11`
  `maxSizeDeltaIn` ≤ its prior pin and no other golden widens.
- Given no cheap fix, then `lurupu-11` is pinned at its true delta with a
  one-line ledger rationale and `measure` exit 0.

## Commit
`fix(measurer): fixed fallback width for wide/emoji code points (S1L-b-unicode T3)`
OR `docs(s1l): ledger lurupu-11 emoji-width residual (S1L-b-unicode T3)`.
