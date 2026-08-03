# T3 — carry the measurer on the class geometry

## Context

**Project.** `plantuml-ts`, a TypeScript port of PlantUML. `src/` is
browser-safe. Tests are vitest, TDD per `~/.claude/rules/testing.md`.

**Why this task exists.** `SyncPlugin.render(geo, theme)`
(`src/core/dispatcher.ts:153`) receives no measurer and no sprite registry. That
is the structural reason the class engine draws usecase/actor labels at a
constant offset instead of asking the faithful `TextBlock` tree where the label
goes: at draw time it has nothing to measure with.

`src/diagrams/class/index.ts:68-71` already documents this exact constraint and
its established workaround — `errors` are carried from the AST onto the geometry
"for the same reason: `SyncPlugin.render()` only receives the geo". This task
applies the same pattern to the measurer.

## Task

Add `measurer` (and optional `sprites`) to `ClassGeometry`, populate them in
`layoutSync`, and make them available to `renderClass`. Nothing consumes them
yet — T4 does.

Keep the existing doc comment's reasoning intact and extend it, so the next
reader sees one explanation covering both `errors` and the measurer rather than
two competing ones.

## Write-set

- `src/diagrams/class/class-geo-types.ts`
- `src/diagrams/class/index.ts`

If `src/diagrams/class/layout.ts` (or whichever module actually constructs the
`ClassGeometry` object) must also change to populate the field, that file is
**outside this write-set** — stop and escalate before editing it. Determine this
during the read phase, not mid-edit.

## Read-set

- `src/diagrams/class/index.ts:60-90` — `layoutSync`/`render` and the existing
  "carried onto the geometry" comment
- `src/diagrams/class/class-geo-types.ts` — the `ClassGeometry` type
- `src/core/dispatcher.ts:148-155` — the `SyncPlugin` contract (read-only; do
  **not** change it — ADR-1 rejected that)
- `src/core/measurer.ts` — `StringMeasurer`
- `src/core/sprite-commands.ts` — `SpriteRegistry`
- `src/diagrams/description/renderer-entity.ts:363-390` — the precedent: how the
  description engine gets a measurer to draw time
- `../decisions.md#adr-1`

## Architecture decisions (locked)

- **ADR-1.** Carry the measurer on the geo. Do **not** change the `SyncPlugin`
  contract; do **not** carry the constructed `EntityImageDescription` object.
  Both alternatives were considered and rejected.

## Interface contract (consumed by T4)

```ts
interface ClassGeometry {
  // …existing fields unchanged…
  measurer: StringMeasurer;      // required
  sprites?: SpriteRegistry;      // optional; undefined when the diagram defines none
}
```

`sprites` must be **omitted**, not set to `undefined`, when absent, if that is
the surrounding file's existing convention — match what `class-geo-types.ts`
already does for other optional fields.

## Acceptance criteria

1. **Given** any class diagram, **when** `layoutSync` runs, **then**
   `geo.measurer` is the same `StringMeasurer` instance `layoutSync` received.
2. **Given** a class diagram declaring sprites, **when** `layoutSync` runs,
   **then** `geo.sprites` is populated; **given** one declaring none, **then**
   it is absent.
3. **Given** all 449 golden + ratchet tests, **when** run, **then** every one is
   byte-identical — this task changes no rendering behaviour.
4. **Given** `src/core/dispatcher.ts`, **when** diffed, **then** it is unchanged.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — revert the commit. `ClassGeometry` is an internal type with no
public export surface; confirm that during the read phase and report if it turns
out to be re-exported from `src/index.ts`.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` exit 0.
All 449 golden + ratchet tests byte-identical. Size-delta gate unmoved
(320/351, widened 0).

## Boundaries

**Always:** keep the change behaviour-neutral; extend the existing doc comment
rather than adding a competing one.
**Ask first:** editing any file that constructs `ClassGeometry` but is not in
the write-set.
**Never:** change the `SyncPlugin` contract; run git mutations.

## Commit

One commit: `refactor(T3): carry the measurer onto the class geometry`
