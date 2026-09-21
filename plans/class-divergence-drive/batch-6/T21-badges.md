# T21 — stereotype-spot badges

**Agent:** typescript-pro (sonnet) · **Depends on:** T18 (nominal —
badges don't consume `Paint`, but start after it merges). Parallel with
T19/T20/T22/T23.

## Context

`<<(X,color)>>` sets the spot character drawn inside the classifier's
badge ellipse. This port honours the colour but falls back to the kind's
default letter whenever `X` is outside a 9-entry table (`C I A E @ P M F
?`), so the jar draws e.g. an `S` outline and this port draws `C` — a
structural `@d` diff, not a colour diff (A5 M3a). Separately, three
fixtures with NO explicit spot override get the wrong default letter for
their kind (A5 M3b) — a kind→letter mapping defect, not a missing
outline. The oracle's spot glyphs are real system-font outlines: the
`<text>` shortcut in `DriverCenteredCharacterSvg.java:65` fires only for
`FileFormat.SVG_DETERMINISTIC`, and `-DPLANTUML_DETERMINISTIC_TEXT=true`
only swaps the StringBounder (`FileFormat.java:185-187`) while the
format stays `SVG` — so a missing letter's outline cannot be computed,
it must be scraped from an oracle SVG the same way the existing table
was (decisions.md push-forward: "Scrape a glyph outline from an oracle
SVG rather than compute it"). The report is a lead: re-read the cited
bodies before editing.

## Task

1. Tests first: one case per new letter (R J O W D Q S X), asserting the
   badge's `<path d="…">` matches the scraped outline exactly; one case
   for M3b's kind→letter mapping fix.
2. M3b first (smaller, no scraping needed): read
   `EntityImageClassHeader`'s `getCircledCharacter` kind→char switch and
   compare against `class-badge.ts#badgeLetter`'s table; fix the mapping
   for the kind `tepazu-23-zapo261`/`xidura-26-teki974`/`lilura-67-
   cati343` share (their spot is an all-straight-line outline in the
   jar, already present in this port's table under the correct letter —
   `badgeLetter` is just picking the wrong entry for that `LeafType`).
3. M3a: for each of R, J, O, W, D, Q, S, X — locate a fixture from A5's
   16-fixture reach list that declares that letter
   (`<<(D,orange)ABC>>` on `jikase-93-tipa633` for D, `(S,#FF7700)` on
   `bejeli-39-sina124` for S, etc.), render it through the pinned oracle
   jar, and scrape the letter's `<path d="…">` outline verbatim into
   `BADGE_GLYPH_D` (`class-badge.ts:477-492`) alongside the existing 9.
   Cite the exact fixture each glyph was scraped from in a code comment.
4. Extend `resolveBadgeLetter`'s table to the full R/J/O/W/D/Q/S/X set;
   confirm the colour path (already correct per M3a's causal chain) is
   untouched.
5. `.agent-notes/cdd-T21.md`: which fixture each of the 8 letters was
   scraped from; the M3b kind→letter mapping fix's exact `file:line` on
   both sides.

## Read-set

`src/diagrams/class/class-badge.ts:477-492` (`resolveBadgeLetter`,
`BADGE_GLYPH_D`). Java: `klimt/shape/CircledCharacter.java:65-74`;
`klimt/drawing/svg/DriverCenteredCharacterSvg.java:65,71-81`;
`FileFormat.java:185-187`; `svek/image/EntityImageClassHeader.java`
(`getCircledCharacter` kind switch — locate via grep, not yet cited by
line). Diagnosis: `diagnosis/A5-geometry.md` M3 (M3a, M3b), full 16- and
3-fixture reach lists.

## Write-set

`src/diagrams/class/class-badge.ts`, its `*.test.ts` file,
`.agent-notes/cdd-T21.md`, `decision-journal.md` (append-only).

## Acceptance criteria

- Given `bejeli-39-sina124`, when rendered, then the badge spot path
  equals the jar's `S` outline exactly
- Given the 8 letters R J O W D Q S X, when scraped, then each carries a
  code comment naming its source fixture and each renders byte-identical
  to that fixture's oracle SVG
- Given `lilura-67-cati343`, `tepazu-23-zapo261`, `xidura-26-teki974`,
  when rendered, then all three are conformant (M3b's mapping fix)

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

Four gates green. `npx tsx tools/render-diff.mts bejeli-39-sina124
lilura-67-cati343 tepazu-23-zapo261 xidura-26-teki974 jikase-93-tipa633`
before/after. Files ≤500 lines, functions ≤30 NLOC, CCN ≤10, ≤5 params —
split `class-badge.ts`'s glyph data into a sibling data module if the
scraped outlines push it over 500 lines (push-forward list).

## Boundaries

Always: scrape every new glyph from a real oracle SVG, never compute or
hand-draw an approximation; cite the source fixture per glyph. Ask
first: any stop condition in `../README.md`. Never: touch the colour
resolution path (`(X,color)`'s colour half is already correct); rebuild
the oracle cache to get a cleaner scrape (D12); fit an outline.

## Commit

`feat(cdd-T21): scrape R/J/O/W/D/Q/S/X badge glyphs, fix kind mapping`

Body: why — the badge letter table covered 9 of 17 corpus letters and
one kind→letter mapping was wrong; the 8 new outlines are scraped from
oracle SVGs (system-font glyphs, not computable) with their source
fixtures cited.
