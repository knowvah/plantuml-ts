# T2 — USymbol / atom-image helpers → core

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (`~/git/plantuml`
is the spec; read the Java before acting; never fit a value). Pure SVG,
vitest, 500-line cap. `src/diagrams/class/renderer-usymbol-entity.ts:51-52`
imports `upstreamKeyword`, `mapComponentStyle`, `textFont`,
`resolveActorStyle` from `../description/renderer-symbol.js` and
`makeAtomImageResolverFor` from `../description/render-atoms.js` — an engine
reaching into another engine for helpers that are shared upstream:
`Entity#getUSymbol` / `USymbols` (`renderer-symbol.ts:1-16,63-107`),
`ISkinParam#actorStyle` default `STICKMAN` (`:24-35`), and
`klimt/sprite/AtomSprite#calculateDimensionSlow` + `svg/parser/SvgNanoParser`
(`render-atoms.ts:237-238,307-333`). Both engines already share
`core/decoration/symbol/USymbol.ts` and `core/svek/image/EntityImage
Description.ts`; the helpers just never followed.

## Task

1. Read `description/renderer-symbol.ts` (176 lines) whole and `render-atoms.
   ts:230-333`. For each exported symbol decide: shared (used by class or by
   `core/svek/image/*`) → move; description-only → stays. Expected: ALL of
   `renderer-symbol.ts` is shared (it is `Entity#getUSymbol` territory);
   `makeAtomImageResolverFor` (+ whatever private helpers it closes over)
   moves; the rest of `render-atoms.ts` (description drawing) stays.
2. Create `src/core/decoration/symbol/usymbol-resolve.ts` = moved
   `renderer-symbol.ts` (git mv, then fix relative imports; keep every doc
   comment and `@see`; add the file's own `@see Entity.java#getUSymbol` +
   `ISkinParam.java#actorStyle`). Delete `description/renderer-symbol.ts`
   (no shim — rewire callers).
3. Create `src/core/creole-atoms-image-resolver.ts` with
   `makeAtomImageResolverFor` (and its private helpers) moved out of
   `render-atoms.ts`; `@see AtomSprite.java#calculateDimensionSlow`,
   `SvgNanoParser.java#drawU`.
4. Rewire callers: `class/renderer-usymbol-entity.ts:51-52`; description
   `leaf-sizing-entity.ts`, `leaf-sizing-text.ts`, `renderer-cluster.ts`,
   `renderer-entity.ts`, `render-atoms.ts` (if it still needs the resolver).
   Move the colocated tests with the code (`renderer-symbol.test.ts` →
   `tests/unit/core/decoration/usymbol-resolve.test.ts` or colocated per repo
   convention — follow what `core/decoration/symbol/*.test.ts` does).
5. Manifest: expected EMPTY (pure move).

## Write-set

`src/core/decoration/symbol/usymbol-resolve.ts` (new), `src/core/creole-
atoms-image-resolver.ts` (new), `src/diagrams/description/renderer-symbol.ts`
(delete), `src/diagrams/description/render-atoms.ts`, `src/diagrams/class/
renderer-usymbol-entity.ts`, `src/diagrams/description/{leaf-sizing-entity,
leaf-sizing-text,renderer-cluster,renderer-entity}.ts`, and the moved/adapted
`*.test.ts` files.

Do NOT touch `leaf-sizing.ts` itself or class's `class-layout-*` files — that
is T3 (batch 2), which depends on this task's new paths.

## Read-set

- `src/diagrams/description/renderer-symbol.ts` (whole), `render-atoms.ts:
  1-40,230-333`, `src/diagrams/class/renderer-usymbol-entity.ts:40-60`
- `src/core/decoration/symbol/USymbol.ts` (exports), `src/core/svek/image/
  EntityImageDescription.ts:1-60` (the `atomImageResolverFor` param)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Entity.java`
  (`getUSymbol`), `klimt/sprite/AtomSprite.java`, `svg/parser/SvgNanoParser.java`
- `decisions.md#d1`, `#d8`

## Architecture decisions

D1, D8. Names: `usymbol-resolve.ts`, `creole-atoms-image-resolver.ts`.

## Interface contract (consumed by T3)

Exports keep their names and signatures; only paths change:
`core/decoration/symbol/usymbol-resolve.js` → `resolveActorStyle`,
`JAR_DEFAULT_TEXT_COLOR`, `upstreamKeyword`, `mapComponentStyle`,
`resolveSymbol`, `textFontColor`, `textFont` (+ any others found);
`core/creole-atoms-image-resolver.js` → `makeAtomImageResolverFor`.

## Acceptance criteria

- Given `src/diagrams/class/renderer-usymbol-entity.ts`, when compiled, then
  it imports nothing from `../description/`.
- Given `src/diagrams/description/`, then `renderer-symbol.ts` no longer
  exists and every former importer compiles against the core paths.
- Given the baseline manifest, when re-run (full), then `0 fixtures differ`.
- Given the moved tests, then every prior assertion still runs (count equal
  or higher).

## Quality bar

4 gates + manifest green. Commit
`refactor(T2): move USymbol/atom-image helpers from description to core`.

## Observability

N/A.

## Rollback

Reversible.
