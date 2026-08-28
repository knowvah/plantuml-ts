# T1 — The participant-symbol seam

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` is the canonical specification: **open the method body**,
never a filename or a summary — the most-violated rule in this repo. Sequence
pixels come from `net/sourceforge/plantuml/sequencediagram/teoz/`;
`sequencediagram/graphic/` is DEAD (`SequenceDiagram.java:306-309` returns
`SequenceDiagramFileMakerTeoz` unconditionally).

The sequence engine hand-rolls its participant glyphs. This task builds the
seam that lets it stop. Read `../README.md` and `../decisions.md` first; D1
and D2 govern.

## Task

Create `src/diagrams/sequence/renderer-participant-symbol.ts`: a
sequence-local composition mirroring upstream's `ComponentRose*` family,
driving the SHARED already-ported primitives.

1. Read `~/git/plantuml/.../skin/rose/Rose.java:137-190` to see how upstream
   dispatches `PARTICIPANT_HEAD` / `DATABASE_HEAD` / `COLLECTIONS_HEAD` /
   `QUEUE_HEAD` / `ENTITY_HEAD` / `BOUNDARY_HEAD` / `CONTROL_HEAD` to
   `ComponentRose*` classes. Mirror the dispatch shape.
2. Read `~/git/plantuml/.../skin/rose/ComponentRoseDatabase.java` in full —
   it is the template. Note especially `:70` (`USymbols.DATABASE.asSmall(null,
   TextBlockUtils.empty(16, 17), TextBlockUtils.empty(0, 0), symbolContext,
   HorizontalAlignment.CENTER)`), `:75-89` (`drawInternalU`, and how the
   `head` boolean flips glyph/text order), and `:95-105`
   (`getPreferredHeight`/`getPreferredWidth`).
3. Export the two entry points in the contract below, driving
   `USymbol*.asSmall(...)` through `UGraphicSvg`
   (`src/core/klimt/drawing/svg/u-graphic-svg.ts:124`).

Do NOT wire anything up. No renderer or layout changes — those are T2-T5.
Do NOT touch `actor`; it is a different family entirely (D4) and lands in T6.

## Write-set (exhaustive — writing anything else is a stop condition)

- `src/diagrams/sequence/renderer-participant-symbol.ts` (new)
- `tests/unit/sequence/renderer-participant-symbol.test.ts` (new)

## Read-set

- `~/git/plantuml/.../skin/rose/ComponentRoseDatabase.java` — whole file
- `~/git/plantuml/.../skin/rose/Rose.java:137-190` — the dispatch
- `~/git/plantuml/.../skin/AbstractTextualComponent.java:100-127` — the
  width/height/padding accessors `getPreferredWidth` composes from
- `src/core/decoration/symbol/USymbolDatabase.ts` — `drawDatabase:108`,
  `getClosingPath:98`, `getMargin:165`, `asSmall:174`
- `src/core/klimt/drawing/svg/u-graphic-svg.ts:124` — the adapter
- `src/diagrams/class/renderer-usymbol-entity.ts:1-40` — the precedent for
  this exact move, and the ADR-1/ADR-2 split it documents
- `src/diagrams/sequence/ast.ts:15-30` — `ParticipantType` (all eight values
  already exist; no AST work is needed)

## Interface contract — consumed by T2, T3, T4, T5

```ts
/** The USymbol-backed participant types. `actor` is deliberately absent —
 *  it is an ActorStyle case, not a USymbol one (D4). */
export type SymbolParticipantType =
  | 'database' | 'collections' | 'queue' | 'entity' | 'boundary' | 'control';

/** `ComponentRoseDatabase#drawInternalU` and its siblings. `head` flips the
 *  glyph/text order exactly as `ComponentRoseDatabase.java:81-87` does. */
export function renderParticipantSymbol(
  type: SymbolParticipantType,
  geo: { x: number; y: number; width: number; height: number },
  opts: { head: boolean; display: string; theme: ScaledTheme },
): string;

/** `getPreferredWidth`/`getPreferredHeight`
 *  (`ComponentRoseDatabase.java:95-105`). The glyph half only — the caller
 *  composes it with its own text measurement. */
export function measureParticipantSymbol(
  type: SymbolParticipantType,
  theme: Theme,
): { width: number; height: number };
```

## Architecture decisions (locked)

- **D1** — faithful `asSmall` + `UGraphicSvg`; NOT `usymbol-shapes.ts`'s
  simplified emitters, which the class engine already migrated away from.
- **D2** — composition is sequence-local; the primitives are shared.
- **Never fit a value.** Every constant needs an upstream `file:line`. If you
  need one that has none, **stop and report** (stop condition 5).

## Acceptance criteria

- Given `type: 'database'`, when `renderParticipantSymbol` runs, then it emits
  the `USymbolDatabase` geometry — a body path plus the closing path from
  `USymbolDatabase.java:62-79` — and **no `rect`, `line` or `ellipse`**.
- Given `head: true` vs `head: false`, then the glyph/text vertical order
  swaps, matching `ComponentRoseDatabase.java:81-87`.
- Given `measureParticipantSymbol('database', theme)`, then the returned
  dimension is `asSmall(null, empty(16,17), empty(0,0), …)`'s own dimension,
  with `16,17` cited to `ComponentRoseDatabase.java:70`.
- Given each of the six `SymbolParticipantType` values, then a glyph is
  emitted and no branch throws.
- 90/90/90 on the new file.

## Observability

N/A — no new observable operations. Nothing calls this until T2/T3, and this
task changes no rendered output.

## Rollback

**Reversible.** New file plus its test; reverting the commit removes both.

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run tests/unit`,
`npm run build` — all exit 0. Hook-enforced complexity: 500 lines/file, 30
NLOC/function, CCN 10, 5 params. No Prettier (it rewrites every quote and no
gate catches it).

`npm test` as a whole is RED at baseline with exactly three sequence-ratchet
failures (`fobube-11-nifo424`, `junaxa-14-biko373`, `rugeco-70-muro754`).
Do not try to fix them here and **never re-pin a baseline JSON**.

## Commit

`feat(T1): add the sequence participant-symbol seam`
