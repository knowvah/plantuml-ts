# T8p — core prerequisites for the UGraphic moves (D5 Amendment 1 bundle)

Agent: `typescript-pro` (sonnet), worktree `sdd3-T8p`. Commit:
`feat(klimt): port the UGraphic pieces the sequence moves need`.
Read [../task-contract.md](../task-contract.md) first, then
[../diagnosis/handwritten.md](../diagnosis/handwritten.md) F3 and the
per-element chain table. Spawned by journal row 94 (user ruling 2026-10-23).

## Mechanism (T8a, F3 — each a pure addition no engine reaches today)
1. `UGraphicDelegator.ts:17-35` forwards no `startGroup`/`closeGroup`, while
   `u-graphic-svg.ts:237` has them: `ComponentRoseLine.java:80` /
   `ComponentRoseActiveLine.java:78` open a titled group under the decorator
   (`UGraphicHandwritten` extends the delegator), so the moved lifeline would
   lose its `<g>` under handwritten mode.
2. The lifeline hover rect is `fill="#000" fill-opacity="0"` in the jar
   (pafene golden): `ComponentRoseLine` applies `HColors.transparent(
   TransparentFillBehavior.WITH_FILL_OPACITY)`-style colours and
   `DriverPolygonSvg.java:63` → `applyFillColor` honours the behaviour.
   `HColorSimple.ts:25-27` has no `transparentFillBehavior`, `Paint` has no
   representation (`driver-rectangle-svg.ts` header), though
   `svg-graphics-core.ts:312-320` already honours `WITH_FILL_OPACITY`.
3. `UCenteredCharacter` (`klimt/shape/UCenteredCharacter.java`),
   `CircledCharacter` (`CircledCharacter.java:65-74`: `ug.apply(back.bg())`
   → `UEllipse`; `ug.apply(fontColor).apply(translate(r, r))` →
   `UCenteredCharacter`) and `DriverCenteredCharacterSvg` are not ported
   (`driver-svg-stubs.ts`, `DisplayCreole.ts:33`); the spot is a string today
   (`core/spot-glyph-data.ts` holds the scraped outlines; the jar writes a
   trailing `Z ` on the path).

## Outcome
The three pieces exist in core, mirroring the Java class and method bodies
(quote `file:line` for every value), registered where the jar registers
them (`UGraphicSvg.java` driver table → `u-graphic-svg.ts`), with unit
tests; NOTHING else changes: every engine's render is byte-identical.

## Targets
None (infrastructure). Unblocks T8b (1, 2) and T8c (3).

## Write-set
`src/core/klimt/drawing/UGraphicDelegator.ts`,
`src/core/klimt/color/HColors.ts`, `src/core/klimt/color/HColorSimple.ts`,
`src/core/paint.ts`, `src/core/klimt/drawing/svg/driver-rectangle-svg.ts`
(and the polygon driver if `applyFillColor` lives there), new
`src/core/klimt/shape/UCenteredCharacter.ts`, new
`src/core/klimt/shape/CircledCharacter.ts`, new
`src/core/klimt/drawing/svg/driver-centered-character-svg.ts`,
`src/core/klimt/drawing/svg/u-graphic-svg.ts` (register),
`src/core/klimt/drawing/svg/driver-svg-stubs.ts` (stub removed), tests
under `tests/unit/core/klimt/`, `docs/catalog.md`. Anything else = stop 1.

## Read-set
`klimt/drawing/UGraphicDelegator.java`, `klimt/color/HColors.java`,
`HColorSimple.java`, `TransparentFillBehavior.java`,
`klimt/drawing/svg/DriverRectangleSvg.java:81-113`,
`DriverPolygonSvg.java:55-70`, `klimt/shape/UCenteredCharacter.java`,
`klimt/shape/CircledCharacter.java`, `klimt/drawing/svg/
DriverCenteredCharacterSvg.java`, `UGraphicSvg.java:100-140` (driver
table); ours: the write-set files, `svg-graphics-core.ts:300-330`,
`core/spot-glyph-data.ts`, `renderer-participant-symbol.ts:87-104`
(already draws through `UGraphic`), `diagnosis/handwritten.md` F3 and the
"spot" / "lifeline piece" rows of the chain table.

## Gates
- Tests first (red): group forwarding through the delegator (a decorator
  over a recording graphic sees `startGroup`/`closeGroup`); the
  `WITH_FILL_OPACITY` colour emits `fill="#000" fill-opacity="0"` on a rect
  and a polygon exactly as the jar (quote `DriverRectangleSvg.java`); a
  `CircledCharacter` draw yields the ellipse then the glyph path with the
  jar's `Z ` form (compare against a golden's spot bytes, e.g. jefoke's
  stripped render `diagnosis/handwritten-stripped/jefoke-95-jara779/in.svg`).
- `npm run typecheck`, eslint, prettier, `vitest run tests/unit/core
  tests/architecture`, coverage 90/90/90 on the new modules, `npm run build`,
  `npm run catalog`.
- Golden ratchet 1137 green; `npx tsx $T/classify.mts` vs
  `$M/b8-m-T8a.json`: 0 moved; **raw hash gate** `npx tsx
  $T/svg-hashes.mts --all` before/after: 0 movers in every engine.

## Acceptance
- Given the three pieces, then each carries `@see` to its Java origin and
  preserves upstream names.
- Given every corpus fixture in every engine, then byte-identical.

Observability: N/A. Rollback: Reversible.
