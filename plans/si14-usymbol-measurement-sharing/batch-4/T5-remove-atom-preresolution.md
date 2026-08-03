# T5 — remove the now-dead atom pre-resolution

## Context

**Project.** `plantuml-ts`, a TypeScript port of PlantUML. `src/` is
browser-safe. Tests are vitest.

**Why this task exists.** Before SI14, `renderClass(geo, theme)` received no
sprite registry, so the class engine resolved a usecase/actor label's creole
atoms at **layout** time and baked them onto the geometry row:

```ts
// src/diagrams/class/class-layout-leaf-shapes.ts
const built = resolveMemberAtoms(buildMemberAtoms(classifier.display, baseFont), …);
const hasAtomImage = built.atoms.some((a) => a.kind !== 'text');
…
...(hasAtomImage ? { atoms: built.atoms, atomsWidth: built.width } : {}),
```

That existed *only* because the renderer could not measure. After T3 and T4 it
can, and the label is drawn by the `TextBlock` tree — so this pre-resolution is
dead weight on the usecase/actor path.

## Task

Remove the usecase/actor atom pre-resolution and the `atomsWidth` field it
introduced.

**Before deleting anything, grep for other consumers.** `rows[].atoms` is a
pre-existing carrier used by **member rows and notes** as well
(`class-geo-types.ts` G2 N22, drawn by
`renderer-classifier-rows.ts#renderRowAtoms`). Those paths are **not** in scope
and must keep working. Only the usecase/actor population added by SI10 goes.
"Looks unused" is not "is unused".

If `atomsWidth` turns out to have a member-row consumer, keep the field and
remove only the usecase/actor population — and say so in the commit body.

## Write-set

- `src/diagrams/class/class-layout-leaf-shapes.ts`
- `src/diagrams/class/class-geo-types.ts`

`renderer-classifier-rows.ts` is **not** in the write-set. If it needs changing,
stop and escalate.

## Read-set

- `src/diagrams/class/class-layout-leaf-shapes.ts:43-84` — `measureUsecaseOrActor`
- `src/diagrams/class/class-geo-types.ts` — `atoms`, `atomsWidth` on the row type
- `src/diagrams/class/renderer-classifier-rows.ts` — `renderRowAtoms`, the other
  consumer
- `src/diagrams/class/renderer.ts:88-110` — post-T4 shape
- `../decisions.md`

## Architecture decisions (locked)

- The member-row and note atom pipeline is **untouched**. This task narrows a
  usecase/actor-specific addition, nothing else.
- D9 (`plans/si5b-stdlib/decisions.md` Amendment 1) governs where sprite
  rounding lives — at the `<image>` emission site, not in resolvers. Do not move
  it.

## Acceptance criteria

1. **Given** a class diagram whose usecase label carries a sprite, **when**
   rendered, **then** output is byte-identical to T4's.
2. **Given** a class diagram with sprite-bearing **member rows**, **when**
   rendered, **then** output is unchanged — the member atom path still works.
3. **Given** `src/`, **when** grepped, **then** no usecase/actor code path
   populates `atoms`/`atomsWidth`.
4. **Given** all 449 golden + ratchet tests plus the three authored fixtures,
   **when** run, **then** every one is byte-identical to T4's result.

Criterion 2 is the one that catches an over-deletion. Make sure a fixture
actually exercising sprite-bearing member rows is in the run, and say which one.

## Observability

N/A.

## Rollback

**Reversible** — revert the commit.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` exit 0.
Size-delta gate 320/351, widened 0. All goldens byte-identical.

Run the test gate on a **cold tree** once here
(`rm -rf packages/*/assets && npm test`, twice) — this is the mission's last
code-changing task, and warm gitignored assets have previously hidden a worker
race.

## Boundaries

**Always:** grep for other consumers before deleting a shared field.
**Ask first:** touching `renderer-classifier-rows.ts` or any member-row path.
**Never:** remove the member-row/note atom pipeline; run git mutations.

## Commit

One commit: `refactor(T5): drop the use-case atom pre-resolution`
