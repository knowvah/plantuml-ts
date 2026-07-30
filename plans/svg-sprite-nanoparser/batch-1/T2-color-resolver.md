# T2 — Port `emoji/ColorResolver.java`

## Context

See [`../README.md`](../README.md) for the mission mechanism (jar-verified —
do not re-derive). plantuml-ts ports PlantUML's Java faithfully; upstream
names are preserved including ugly ones, and ported symbols carry a JSDoc
`@see` to their origin.

`SvgNanoParser.drawU` constructs `new ColorResolver(fontColor, forcedColor,
this)` before walking the SVG. It resolves a raw SVG colour string (plus the
sprite's own grey-level range) into an `HColor`. It does not exist in this
port.

**Note the package:** `emoji/ColorResolver.java`, NOT `svg/parser/`. Scoping
a search to the package you expect is what produced an earlier wrong
conclusion in this mission line.

## Task

Port `~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/ColorResolver.java`
(77 lines) to `src/core/klimt/sprite/ColorResolver.ts`. Read it in full,
including how `minGray`/`maxGray` on the parser feed it.

## Write-set

- `src/core/klimt/sprite/ColorResolver.ts` (create)
- `src/core/klimt/sprite/ColorResolver.test.ts` (create)

## Read-set

- `~/git/plantuml/.../emoji/ColorResolver.java` — the spec
- `~/git/plantuml/.../svg/parser/SvgNanoParser.java:135-145` — the only
  construction site; also `minGray`/`maxGray` fields (`:118-119`)
- This port's existing colour type — find it via
  `grep -rn "class HColor\|HColor" src/core/ | head` before assuming a shape.
  **Verify what exists rather than inventing a parallel colour type.**

## Architecture decisions (locked)

- [ADR-4](../decisions.md#adr-4) — full-class port. `stroke` appears 112× in
  bootstrap alone and 2 `style=` across all of stdlib, so the fill/stroke
  resolution path IS exercised; this is not dead code.

## Interface contract

Consumed by T6/T8. Mirror upstream's method surface rather than inventing
one; the exact signature falls out of the Java.

## Acceptance criteria

1. Given a `forcedColor`, when resolving any colour string, then the forced
   colour wins — matching upstream's precedence exactly.
2. Given a sprite whose `minGray`/`maxGray` span a range, when resolving a
   grey, then the interpolation matches the Java's arithmetic.
3. Given a colour string upstream does not recognise, then this port
   reproduces upstream's fallback rather than throwing.

## Quality bar

All four gates exit 0. TDD. Coverage 90/90/90.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — new files only, no consumers until T6.

## Boundaries

**Always:** preserve upstream naming; `@see` the Java origin.
**Never:** invent a new colour abstraction. If the port's existing colour
type does not fit upstream's needs, that is a scope finding → journal it and
STOP rather than building a parallel one.

## Method rules

1. **Trace two dependency levels** before ruling on scope.
2. **Verify any "already wired" claim against the CURRENT call graph.**
   Specifically: before concluding this port has no suitable colour type,
   grep for it. "The port has no support for X" is a hypothesis, not a
   finding.

## Commit

One commit: `feat(T2): port ColorResolver for SVG sprite decomposition`
