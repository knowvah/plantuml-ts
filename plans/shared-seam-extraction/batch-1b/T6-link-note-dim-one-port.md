# T6 — ONE `measureLinkNoteDim` (`svek/image/EntityImageNoteLink`)

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (`~/git/plantuml`
is the spec; read the Java before acting; never fit a value). Pure SVG,
vitest, 500-line cap. The size of a `note on link` box comes from upstream
`svek/image/EntityImageNoteLink.java` (Rose note component). We have FOUR
copies of that measurement: `class/class-note-link-box.ts:70` (exported;
theme/measurer/sprites signature), `state/state-dot-graph.ts:172` and
`state/state-composite-edge-label.ts:49` (private, identical to each other,
`fontFamily`/`measurer` signature, hand-summed `OPALE_MARGIN_*` +
`ROSE_NOTE_PADDING`), and `description/link-note-box.ts:58` (uses
`core/rose-note-dim.ts#roseNoteDim`, SI24 T3). `planning/next-missions.md`
item 4 names this collapse.

## Task

1. Read `EntityImageNoteLink.java` (constructor + `calculateDimension` /
   `getTextBlock`) and `skin/rose/ComponentRoseNote.java` sizing; read all
   four copies. Table them against the Java. Differences settled by the Java
   line; unsettled → STOP (README stop 5).
2. Write `src/core/svek/image/EntityImageNoteLink.ts` exporting ONE
   `measureLinkNoteDim` whose signature is the SUPERSET the callers need
   (theme-derived font + measurer + optional sprites/creole handling — the
   class copy's shape is the richest; the state copies' `fontFamily`-only
   form must be reproducible through it byte-identically). Padding via
   `core/rose-note-dim.ts#roseNoteDim` (extend that file only if a constant
   is missing; keep it under 500). `@see EntityImageNoteLink.java` lines.
3. Rewire the four callers; delete the two state copies. `class-note-link-
   box.ts` STAYS as a thin class-side adapter that calls the core function
   (T1 owns `class-layout-edge-labels.ts:36` in the same batch — do not touch
   that file). Description's `link-note-box.ts` delegates to core or is
   deleted if it only wrapped this (its importer `link-edge-attrs.ts:18` is
   also T1's — if deletion would require editing it, keep the wrapper and
   journal).
4. Move/merge tests; every prior assertion kept.
5. Manifest: EMPTY (`--only class,state,component,usecase` per task).

## Write-set

`src/core/svek/image/EntityImageNoteLink.ts` (new), `src/core/rose-note-dim.ts`,
`src/diagrams/class/class-note-link-box.ts` (body → delegate to core), `src/diagrams/state/
{state-dot-graph,state-composite-edge-label}.ts`, `src/diagrams/description/
link-note-box.ts`, moved tests.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageNoteLink.java`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseNote.java`
- `src/core/rose-note-dim.ts` (whole, 65), the four copies (function bodies +
  headers), `src/diagrams/description/link-edge-attrs.ts:15-30,60-75`
- `decisions.md#d1`, `#d8`

## Architecture decisions

D1, D8 (`EntityImageNoteLink.ts`). Never edit `class-layout-edge-labels.ts` or
`link-edge-attrs.ts` here (T1's write-set).

## Interface contract

`core/svek/image/EntityImageNoteLink.js#measureLinkNoteDim(text, font/theme
inputs, measurer, sprites?) → { width, height }` — one function; callers pass
what they have.

## Acceptance criteria

- Given `src/`, then exactly one `measureLinkNoteDim` body exists.
- Given class/state/component/usecase fixture sets, then `0 fixtures differ`.
- Given the state copies' former inputs (fontFamily-only), then the core
  function returns the identical `{width,height}` (test pins two examples
  from the former state test).

## Quality bar

4 gates + manifest green. Commit
`refactor(T6): one link-note dimension port (EntityImageNoteLink) in core`.

## Observability

N/A.

## Rollback

Reversible.
