# T8 — Wire `archimate` as a description element

## Context

T2 found ARCHIMATE is a USymbol we can size but never reach: `archimate`
is absent from `KEYWORD_SYMBOL_ENTRIES`, so the line never becomes a leaf.
Verified — `grep archimate src/` hits only `USymbolRectangle.ts`,
`USymbols.ts` and `SpriteSvg.ts`; the keyword map has no entry.

This is a PARSER gap, not a sizing one. T2's probe (the colour token is
mandatory): `archimate #Business "Hello"` → **52.025×34**, which is
`USymbolRectangle`'s plain `[20,20]` box — so once the line parses, sizing
already works and needs no change.

**Scope warning: upstream has THREE commands**, not one —
`CommandArchimate`, `CommandArchimateMultilines`, `CommandArchimatePackage`
(`~/git/plantuml/.../descdiagram/command/`). Read all three before deciding
what this task covers. If the multiline or package form is materially
larger than the single-line form, implement the single-line form, and FILE
the others with a jar probe rather than half-implementing them (ADR-4).

## Task

Make `archimate` lines parse into description leaves, matching upstream's
grammar — including the mandatory colour token and the `as <alias>` form.

## Write-set

- `src/core/descriptive-keywords.ts`
- `src/diagrams/description/parser.ts`
- co-located tests

## Read-set

- `~/git/plantuml/.../descdiagram/command/CommandArchimate.java` and its
  two siblings
- `src/core/descriptive-keywords.ts` — `KEYWORD_SYMBOL_ENTRIES` and the
  existing entries' shape
- `src/diagrams/description/parser.ts` — how a sibling keyword with a
  colour token is parsed
- `planning/usymbol-composition.md` — the ARCHIMATE row

## Acceptance criteria

- Given `archimate #Business "Hello"`, when parsed and measured, then it is
  a leaf of **52.025×34** (jar-verified)
- Given the `as <alias>` form, then the alias becomes the id and the
  quoted text the display — the id/display split `finalizeDisplay` already
  documents
- Given a form you do NOT implement, then it is FILED with a jar probe in
  the ledger, never silently dropped
- Given the ratchet, then `widened` is 0 and `conformant` does not fall
- Given DOT parity, then 262 / 90 / 708 EQUAL is unchanged — a new keyword
  that changes existing structure means the grammar is too greedy

## Observability / Rollback

N/A. Reversible.

## Quality bar

All four gates + the three ratchets.
