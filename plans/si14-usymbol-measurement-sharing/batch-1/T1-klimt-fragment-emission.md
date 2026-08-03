# T1 — klimt fragment-emission seam

## Context

**Project.** `plantuml-ts` is a TypeScript port of PlantUML (Java) that turns
diagram source into an SVG **string**, synchronously, with no DOM and no canvas.
`src/` must stay browser-safe: no Node built-ins, no `process.env`, no
`Date.now()`/`Math.random()` in rendering paths. Tests are vitest, colocated
under `tests/`. Read `~/.claude/rules/testing.md` before writing tests (TDD:
test first; assert on specific values, never merely "did not throw").

**Why this task exists.** SI14 moves the class engine's usecase/actor leaves onto
klimt's `TextBlock`/`UGraphic` drawing path (see `../decisions.md` ADR-1, ADR-2).
The class renderer emits SVG by string concatenation, but klimt's emitter has no
fragment mode — `SvgGraphicsCore#createXml` unconditionally roots a `<svg>`
document via `getRootNode`. The existing workaround for exactly this is
`src/diagrams/description/renderer.ts#unwrapKlimtSvg` (:271), a narrow
string-level unwrap of a complete document.

This task generalises that workaround into a reusable seam so batch 3 can draw a
single node into a fragment.

## Task

Add a function to `src/core/klimt/document-shell.ts` that renders one
`UDrawable` to an SVG fragment:

```ts
renderDrawableToFragment(
  drawable: UDrawable,
  opts: { width: number; height: number; measurer: StringMeasurer; uid: string; /* … */ },
): { body: string; extraDefs?: string; width: number; height: number }
```

Build a `UGraphicSvg` (`src/core/klimt/drawing/svg/u-graphic-svg.ts`, `static
build`, `getStringBounder()` at :260), draw into it, emit the complete document,
and unwrap it — reusing `unwrapKlimtSvg`'s extraction rather than writing a
third implementation. Also provide a way to merge the `extraDefs` of several
fragments so a caller emitting N nodes gets each def exactly once.

Exact signature is yours to choose; the shape above is the contract batch 3
consumes.

## Write-set

- `src/core/klimt/document-shell.ts`
- `tests/unit/core/klimt/fragment-emission.test.ts` (create)

Nothing else. In particular **do not modify** `svg-graphics-core.ts`,
`svg-graphics.ts`, or `u-graphic-svg.ts`.

## Read-set

- `src/core/klimt/document-shell.ts` — whole file (it already documents the
  extraction, :4-10, :115)
- `src/diagrams/description/renderer.ts:228-277` — `unwrapKlimtSvg` and its doc
  comment, which records **why** string unwrapping is the sanctioned approach
- `src/core/klimt/drawing/svg/u-graphic-svg.ts:124-160, 255-270` — `build`,
  `getStringBounder`
- `src/core/klimt/drawing/svg/svg-seed.ts` — id seeding
- `src/core/dispatcher.ts:23-40` — `RenderFragment`, `klimtShell`
- `../decisions.md#adr-2` — the constraint and its rejected alternatives

## Architecture decisions (locked)

From `../decisions.md`:

- **ADR-2.** Per-node `UGraphicSvg` + string unwrap. Adding a real
  fragment-emission mode to `SvgGraphicsCore` is **rejected and is a stop
  condition** — a prior mission made touching that emission behavior a STOP.
- Do not introduce a third SVG-extraction implementation. Reuse or factor the
  one in `unwrapKlimtSvg`.

## Interface contract (consumed by T4)

```ts
{ body: string; extraDefs?: string; width: number; height: number }
```

`body` is inner SVG markup with no `<svg>` wrapper, positioned in the
drawable's own coordinate space. `extraDefs` is omitted (not empty-string) when
there are none — matching `unwrapKlimtSvg`'s existing convention.

## Acceptance criteria

1. **Given** a `UDrawable` and two different `uid` values, **when** rendered
   twice, **then** the two `body` strings share no element `id` value.
2. **Given** two fragments that each carry `extraDefs`, **when** merged,
   **then** each distinct def appears exactly once and every `url(#…)`
   reference in either body resolves to a def present in the merged output.
3. **Given** the same drawable, uid and measurer, **when** rendered twice,
   **then** the two results are byte-identical (determinism — no `Date.now()`,
   no `Math.random()`).
4. **Given** this task's diff, **when** `git diff --name-only` is inspected,
   **then** it lists only the two write-set files.

Criterion 1 is the one that must be *proved*, not assumed — it is ADR-2's named
risk. Write it so it can actually fail: construct a drawable that emits at least
one id-bearing element (gradient, shadow, or marker).

## Observability

N/A — no new observable operations. This is a pure, synchronous string
transform in a browser library.

## Rollback

**Reversible** — revert the commit. Nothing persisted, no public API change
(the new export is additive and has no consumer until batch 3).

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all exit 0.
All 449 golden + ratchet tests byte-identical — this task adds a new function
with no existing caller, so **any** golden movement means something else was
touched.

Respect the complexity hook: 500-line file cap, per-function NLOC/CCN caps. Use
`// #lizard forgives -- <reason>` near a function's end only for pre-existing
violations; never edit `complexity-ignore`.

## Boundaries

**Always:** keep `src/` browser-safe; write the test before the implementation.
**Ask first:** any change outside the write-set.
**Never:** modify `svg-graphics-core.ts` emission behavior (stop condition 5);
run git mutations — the orchestrator commits.

## Commit

One commit: `feat(T1): render a klimt drawable to an SVG fragment`
