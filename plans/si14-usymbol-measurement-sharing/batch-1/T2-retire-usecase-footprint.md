# T2 — retire `usecase-footprint.ts`; delete `measureActor`

## Context

**Project.** `plantuml-ts`, a TypeScript port of PlantUML (Java). `~/git/plantuml`
is the canonical spec. `src/` is browser-safe (no Node built-ins, no
`process.env`). Tests are vitest. TDD per `~/.claude/rules/testing.md`.

**Why this task exists.** The port contains **two faithful ports of the same
ellipse fit**, differing only in mechanism:

| | mechanism | callers |
|---|---|---|
| `src/core/svek/image/Footprint.ts` | object-based — an internal `MyUGraphic` collects points by **drawing** the TextBlock. This is upstream's actual mechanism. | `TextBlockInEllipse` |
| `src/diagrams/description/usecase-footprint.ts` | data-based — callers hand it precomputed `FootprintBox`es; `textFootprintBox` reproduces `Footprint#drawText`'s `-(h - 1.5)` shift by formula | `leaf-sizing.ts:318-319` (`boxPoints`, `containingEllipse`), `leaf-sizing-text.ts:347` (`textFootprintBox`) |

The second is **not** an approximation — its own header records jar verification
across seven shapes to within 5e-4 px. Read that header (`usecase-footprint.ts:1-44`)
before changing anything; it explains why the fit is order-dependent and why two
positional details are load-bearing.

Its only remaining reason to exist is the `<latex>` route through
`measureUsecase`.

Separately: `measureActor` has **zero live callers in `src/`**. SI10 changed
`class-layout-leaf-shapes.ts:14` to import only `measureUsecaseOrActorLeaf`.

## Task

Two changes, one commit each is *not* wanted — they share `leaf-sizing.ts`, so
this is one task and one commit.

1. **Retire `usecase-footprint.ts` (ADR-3).** Have the `<latex>` route build a
   real TextBlock and obtain its fit from `Footprint#getEllipse`, then delete
   `usecase-footprint.ts` and its imports.
2. **Delete `measureActor` (ADR-4)** and **correct the stale doc comment** at
   `leaf-sizing.ts:18-21`, which still claims
   "`class-layout-leaf-shapes.ts` imports both unconditionally … why
   `usecase-footprint.ts`/`footprintBoxes` survive too". That is no longer true.
   Replace it with what is now true; do not simply delete the paragraph and do
   not restate the stale claim.

`measureUsecase` **stays** — the `<latex>` route still needs it.

## Write-set

- `src/diagrams/description/leaf-sizing.ts`
- `src/diagrams/description/leaf-sizing-text.ts`
- `src/diagrams/description/usecase-footprint.ts` — **delete**
- `tests/unit/description/footprint-parity.test.ts` — create

Existing tests referencing the retired symbols may be updated **only** to keep
compiling. Any test whose assertion would weaken must instead be reported —
see Boundaries.

## Read-set

- `src/diagrams/description/usecase-footprint.ts:1-95` — the header and the box
  helpers. The header is the spec for what must be preserved.
- `src/diagrams/description/leaf-sizing.ts:130-200, 260-330` — the routing
  switch, `hasUnroutedUsecaseMarkup`, `measureUsecase`, `footprintBoxes`
- `src/diagrams/description/leaf-sizing-text.ts:305-355`
- `src/core/svek/image/Footprint.ts` — whole file (~160 lines)
- `src/core/svek/image/ContainingEllipse.ts` — `getCenter`, `asUEllipse`
- `src/core/klimt/shape/TextBlockInEllipse.ts` — how the object-based path is
  driven end to end
- `../decisions.md#adr-3` and `#adr-4`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Footprint.java`

## Architecture decisions (locked)

- **ADR-3.** This changes **which implementation computes the fit**, never
  **which measurement path a `<latex>` display takes**. Routing latex onto the
  faithful path was measured by SI10 as `widened 2`. `<latex>` is a permanent
  documented divergence (`DIVERGENCES.md:260-285` — KaTeX, not JLaTeXMath).
  **Do not edit `DIVERGENCES.md`.**
- **ADR-3 fallback.** If the two mechanisms cannot be shown numerically
  identical, delete only the duplicated circle solver, keep the box-computing
  entry points, and journal the remainder as tracked work. Record a partial
  retirement **as partial** — do not describe it as complete.
- **ADR-4.** `measureActor` goes; `measureUsecase` stays.

## Acceptance criteria

1. **Given** the seven shapes named in `usecase-footprint.ts`'s header (sprite;
   text; text×2; sprite+text; text+sprite; sprite+text×2; sprite×2), **when**
   fitted through `Footprint#getEllipse`, **then** each result matches the
   retired implementation's to within 5e-4 px.
2. **Given** a `<latex>`-bearing usecase display, **when** measured, **then** it
   still routes through `measureUsecase` (the routing decision is unchanged) and
   the size-delta gate reports **320/351, widened 0**.
3. **Given** `src/`, **when** grepped, **then** `measureActor` and
   `usecase-footprint` have zero matches.
4. **Given** `leaf-sizing.ts:18-21`, **when** read after the change, **then** it
   describes the current call graph and no longer names
   `class-layout-leaf-shapes.ts` as an unconditional caller.

Criterion 1 is the gate on the whole retirement. Write it as a real numeric
comparison against values captured **before** the deletion — not as a
tautological "new path equals new path".

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — revert the commit. No persisted state; no public API change
(`measureActor` was not re-exported outside the description engine — verify this
before deleting, and if it *is* public, stop and report).

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` exit 0.
`npx jiti scripts/measure-description-size-deltas.ts` reports **320/351,
widened 0** with a cause histogram identical to baseline. All 449 golden +
ratchet tests byte-identical; the 54-fixture description ratchet zero-diff.

## Boundaries

**Always:** capture the retired implementation's numbers *before* deleting it,
so criterion 1 can be checked against something real.
**Ask first:** any change outside the write-set; taking the ADR-3 fallback.
**Never:** change which path a `<latex>` display takes; edit `DIVERGENCES.md`;
weaken, skip or delete a test to make it pass (rewrite stronger instead);
accept `widened` above 0; run git mutations.

## Commit

One commit: `refactor(T2): fit use-case ellipses by drawing, not by box math`
Body must explain **why** (one fit implementation, upstream's mechanism) and
note that `measureActor` was dead and the doc comment stale.
