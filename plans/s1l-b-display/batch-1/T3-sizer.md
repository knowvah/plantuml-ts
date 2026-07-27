# T3 — Sizer: creole-lexer width + HR height

## Context
`measureBox` in `src/diagrams/description/leaf-sizing.ts` sizes a leaf box as
`max(minimumWidth, contentW) + margin + icon` wide and
`textBlockHeight + margin + icon` tall. Two gaps once the `[ … ]` body (T2) is
the display:
1. **Width** — creole formatting tags (`<b>`, `<color:…>`) are measured as
   literal text. The deterministic `WidthTableMeasurer` is weight-agnostic
   (bold = normal advance widths), so measuring inner text at normal weight is
   exact. See ADR-2.
2. **Height** — `====`/`----`/`____` HR lines must count as ~8px, not a full
   `lineH` (14px) text line. Verified: `node [ foo1 ==== foo2 ]` oracle height
   66px = 14 + 8 + 14 + 30 margin. See ADR-4.

The WIP branch does (1) with an ad-hoc regex and (2) with a fixed 8px — **replace
the regex with the creole lexer** (ADR-2); keep the HR-height approach.

## Task
- Width: in `maxLineWidth`, parse each line with `creole-lexer.ts` (`tokenise`
  → `mergeSpans`) and sum span *text* widths (atoms still via
  `measureLineWithAtoms`), instead of the regex strip.
- Height: keep `textBlockHeight` treating a creole-HR line as `CREOLE_HR_HEIGHT`
  (8px). Verify `----` and `____` are also 8px against the oracle; split
  per-style only if a fixture proves a difference (ADR-4).

## Read-set
- `src/core/creole-lexer.ts` — `tokenise`, `parseTokens`, `mergeSpans`,
  `CreoleSpan` (span carries text + format flags).
- `src/core/creole-atoms.ts` — `measureLineWithAtoms`, `lineAtomHeightExcess`
  (keep atom handling; formatting is orthogonal).
- `src/core/measurer.ts` — `WidthTableMeasurer.measure` (weight-agnostic width).
- `git show feat/s1l-b-display-expansion:src/diagrams/description/leaf-sizing.ts`
  — the WIP HR-height (`CREOLE_HR_RE`/`textBlockHeight`) to keep, and the regex
  strip to replace.

## Write-set
- `src/diagrams/description/leaf-sizing.ts`
- `tests/unit/description/leaf-sizing-body.test.ts` (new)

## Quality bar
`npm run typecheck` clean; complexity hook non-block; new unit tests pass.

## Acceptance criteria
- Given display `"foo1\n====\nfoo2"` on a `node`, when measured, then height ===
  66px (HR contributes 8px).
- Given a line `"<b>arn</b>"`, when measured, then width === width of `"arn"`
  (formatting tags contribute 0 width).
- Given a line `"<color:red>text</color>"`, when measured, then width === width
  of `"text"`.
- Given `dexigu-24-deru622` via `scripts/measure-description-size-deltas.ts`,
  then its `maxSizeDeltaIn === 0` (conformant).

## Commit
`feat(description): creole-aware leaf width + HR-line height (S1L-b T3)`.
