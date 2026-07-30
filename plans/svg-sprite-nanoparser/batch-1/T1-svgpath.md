# T1 — Port `openiconic/SvgPath.java` → `d` → `UPath`

## Context

plantuml-ts is a TypeScript port of PlantUML (Java) that renders diagram
source to SVG strings synchronously — no DOM, no canvas, no Node built-ins in
`src/`. The Java at `~/git/plantuml` is the spec. Ported symbols carry a JSDoc
`@see` to their Java origin.

This mission restores upstream's two independent dimension channels for SVG
sprites (see [`../README.md`](../README.md) for the mechanism — it is
jar-verified; do not re-derive it).

Upstream's `SvgNanoParser.drawPath` does `new SvgPath(tmp, UTranslate.none())`
(`SvgNanoParser.java:373`) — it owns no path reader. This port currently has
no `d` → `UPath` parser at all. You are building it.

## Task

Port `~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgPath.java`
(255 lines) to `src/core/klimt/sprite/SvgPath.ts`. Read the Java in full
before designing anything — including its `Movement` / `StringDecipher` /
`SvgCommand*` / `SvgPosition` collaborators, which normalise relative commands
and the `H`/`V`/`S` shorthands before `toUPath` sees them.

## Write-set

- `src/core/klimt/sprite/SvgPath.ts` (create)
- `src/core/klimt/sprite/SvgPath.test.ts` (create)

Nothing else. Writing outside this set is a STOP.

## Read-set

- `~/git/plantuml/.../openiconic/SvgPath.java` — the spec
- `~/git/plantuml/.../openiconic/{StringDecipher,Movement,SvgCommand*,SvgPosition}.java`
- `src/core/klimt/shape/UPath.ts:113-250` — the target type. Note `add`,
  `addInternal`, `getMinX/getMaxX/getMinY/getMaxY`, and that it is iterable
  over segments.
- `src/core/klimt/sprite/svg-path-bbox.ts:1-60` — its doc comment documents
  the exact command coverage and normalisation rules you must reproduce.
  **Read-only. Do not modify it — that is T5's write-set.**
- `src/core/openiconic-glyphs.ts:107-355` — an EXISTING port of the same
  tokenizer/absolutizer chain, emitting a `d` string rather than a `UPath`.
  Useful as reference for the tokenizing rules. **Read-only, and modifying it
  is a STOP** (ADR-1 rejected option C — it is byte-verified against 5 jar
  fixtures).

## Architecture decisions (locked)

- [ADR-1](../decisions.md#adr-1) — this is the single `d` → `UPath` parser.
  T5 will re-express `pathBBox` over it. Design the API so a caller can get
  both the segments (for drawing) and the minmax (via `UPath`'s own getters).

## Interface contract

Consumed by T5 and T6:

```ts
export function parseSvgPath(d: string, translate: UTranslate): UPath;
```

`UPath` already carries the minmax — do not add a parallel bbox return.

## Acceptance criteria

1. Given `bi-globe`'s `d` attribute, when parsed, then
   `UPath.getMinX/getMaxX/getMinY/getMaxY` equal exactly what
   `pathBBox` returns for the same input today.
2. Given an `A` (arc) command, when parsed, then ONLY its endpoint
   (`coord[5], coord[6]`) enters minmax — the bulge is ignored. This is
   `UPath.addInternal`'s `SEG_ARCTO` branch and it is load-bearing for the
   ±0.01pt conformance bar.
3. Given `H` / `V` / `S` / `T` shorthands, when parsed, then they normalise
   exactly as `svg-path-bbox.ts:20-27` documents — `S`/`T` reflect the
   previous control point, and the reflected point IS a real path coordinate
   that enters the box.
4. Given a `Q` command, when parsed, then its single control point
   contributes to the box (upstream duplicates it into a cubic, which cannot
   change a min/max).
5. Given a multi-subpath `d` with `Z`, when parsed, then the subsequent
   `m` resets against the FIRST subpath's `M` point (`SvgPath`'s `lastMove`
   convention), not the immediately-preceding point.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` — all exit 0.
Tests written first (TDD, per `~/.claude/rules/testing.md`). Coverage
90/90/90.

## Observability

N/A — no new observable operations. This is a pure function in a synchronous
library with no runtime, no telemetry surface, and a CLAUDE.md prohibition on
`Date.now()`/`Math.random()` in render paths.

## Rollback

**Reversible** — new files only, no consumers until T5/T6. Revert the commit.

## Boundaries

**Always:** port faithfully including awkward branches (CLAUDE.md: do not
refactor while porting — a branch that looks redundant probably handles a case
the corpus surfaces later). Add a JSDoc `@see` to the Java origin.

**Never:** modify `svg-path-bbox.ts` (T5's) or `openiconic-glyphs.ts`
(STOP). Do not "improve" the arc handling to compute true extrema — the
jar's own numbers depend on the control-polygon box.

## Method rules — apply to your own plan, not just to what you read

1. **Trace two dependency levels** before ruling on scope or asking for a
   ruling. This brief's own sizing changed at level two.
2. **Verify any "already fixed / already wired" claim against the CURRENT
   call graph**, not the commit that introduced the fix.

## Commit

One commit: `feat(T1): port SvgPath d-to-UPath parser`
