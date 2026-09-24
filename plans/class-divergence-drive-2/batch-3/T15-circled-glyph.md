# T15 — circled-character glyph family

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T14

## Fixtures

befasi-62-vimu310, mububu-79-nalu431, ribove-58-tefu515,
soboro-52-pevi612, zakuta-81-pese010, ziruni-05-fona846, zosaxa-86-mora157

## Mechanisms · Write-set

T6 fills from `diagnosis/C.md`.

## Read-set

`diagnosis/C.md`; `decisions.md` D4; prior mission push-forward "scrape a
glyph outline from an oracle SVG rather than compute it" (T21) — the same
choice is allowed here, with the source SVG and element path recorded in
the data file's comment.

## Acceptance criteria

- Given the seven fixtures, when they render, then all 818 (886) numerics
  match — or the residual has a diagnosis artifact
- Given glyph data added, when its test runs, then it asserts the outline
  for the exact skinparam combination (`CircledCharacterFontSize 12`,
  `Bold`, `Radius 8`) and names the oracle it was scraped from
- Given other engines drawing circled characters, when their suites run,
  then nothing moves, or each mover is journaled

## Observability · Rollback

N/A. Reversible.
