# T1e: description notes are opale

Prepend [task-preamble.md](task-preamble.md).

## Task (TDD)
**tefeco (b) (`desc-embed-ink-missing`, cdd6 rows 12, 73).** The nested
description diagram's note is 1px narrower than the jar's because description
notes are never opale: `description/renderer-entity.ts:379` `drawNoteFallback`
draws a plain note where the jar attaches a pointer polygon
(`GraphvizImageBuilder.java:245-257` picks `EntityImageNote`'s opale arm;
`EntityImageNote.java:235-243` draws it; `Opale.java` for the geometry and the
width it adds). Port the opale arm for a note linked to an entity, mirroring how
the class engine's note renderer does it (`class/renderer-note.ts`, cdd6 T2d/T3g —
read it as the in-repo precedent, do not edit it). This is description-wide (D7):
survey `description`, `component`, `usecase` and `object` before and after; every
mover is reported with its mechanism; re-pin the description golden/diff-baseline
rows this fix moves, Java-quoted in the commit body.

## Rows
- `unknown/tefeco-12-rato895` (0/1: nested note width Δ1)

## Write-set
- `src/diagrams/description/renderer-entity.ts` (481 lines — a helper module for
  the opale arm is a push-forward file-cap move; name it)
- description goldens / diff-baseline rows this fix moves
  (`oracle/goldens/svg-description/**`, the description baseline JSON)
- its unit tests under `tests/unit/description/`

## Read-set
cdd6 journal rows 12, 73; `GraphvizImageBuilder.java:240-260`;
`EntityImageNote.java:220-250`; `Opale.java`; `class/renderer-note.ts` (opale arm);
`renderer-entity.ts:360-480`.

## Interface contracts
none.

## Acceptance
- Given a description note attached to an entity, when drawn, then the SVG carries
  the opale polygon of `EntityImageNote.java:235-243` with the jar's point count
  and the width `Opale.java` adds, asserted on specific coordinates.
- Given tefeco, when render-diff runs, then 0/1 → 0/0.
- Given the description/component/usecase/object surveys, then 0 conformant losses;
  every mover journaled (rises expected).

## Architecture decisions (locked)
D7, D11.
