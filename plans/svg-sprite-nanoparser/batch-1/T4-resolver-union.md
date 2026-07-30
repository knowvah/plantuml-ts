# T4 — `AtomImageResolver` discriminated union (ADR-2)

## Context

See [`../README.md`](../README.md) for the mission mechanism (jar-verified —
do not re-derive).

`AtomImageResolver` (`src/core/creole-atoms.ts:133`) is today
`(atom) => {href, width, height} | undefined` — ONE opaque channel. Ink and
layout are forced through it together. That is the bug: `drawAtoms` emits one
`UImage`, so the jar-verified `svgInkBox` precomputation has nowhere to go but
the same field `SheetBlock1.ts:180-182` reads to advance its line-stacking
cursor.

This task adds the second channel to the type. **Nothing emits it yet** —
T9 does that. This task is additive-only, and the batch must end with zero
rendered-output change.

## Task

Widen `AtomImageResolver` to the ADR-2 discriminated union in
`src/core/creole-atoms.ts`. Update the doc comment to explain both channels
and record the non-goal below.

## Write-set

- `src/core/creole-atoms.ts` (modify)

Nothing else. No consumer updates in this task — they must keep compiling
unchanged, and proving that is criterion 2.

## Read-set

- `src/core/creole-atoms.ts:118-142` — the current type and the doc comment
  recording T2/ADR-2's field deletion
- `src/core/svek/image/EntityImageDescriptionDelegates.ts:127-133`
  (`descAtomOps#dimensionOf`) — destructures `{width, height}` off a
  resolver result. Read-only; it must compile unchanged.
- `src/diagrams/description/render-atoms.ts:63-92` — the producer T9 will
  change. Read-only here.
- `src/diagrams/description/leaf-sizing.ts:360-376` — the other producer,
  T10's write-set. Read-only here.
- `src/core/klimt/shape/UPath.ts:113-140` — the primitive type carried by the
  new variant

## Architecture decisions (locked)

- [ADR-2](../decisions.md#adr-2) — the union shape, verbatim:

```ts
| { kind: 'image';    href: string;        width: number; height: number }
| { kind: 'drawable'; primitives: UPath[]; width: number; height: number }
```

`width`/`height` remain the **DECLARED** box in BOTH variants. Ink exists
ONLY inside `primitives`.

### Non-goal — read before proposing anything to this type

This is **NOT** re-adding the `inkX`/`inkY`/`inkWidth`/`inkHeight` fields
that `sizer-footprint-parity` T2/ADR-2 deleted as a dead duplicate channel.
Those were a MEASUREMENT side channel; these are DRAW-TIME primitives.
Proposing measurement ink on this type contradicts an architecture decision →
**STOP** and journal it.

## Interface contract

Produced here, consumed by T7 (`drawAtoms`) and T9 (`resolveSpriteAtom`).
Both variants carry `width`/`height` specifically so `dimensionOf` needs no
change — that is the design, not a coincidence.

## Acceptance criteria

1. Given the widened type, when `npm run typecheck` runs, then it exits 0
   with **no consumer modified** — the union is additive.
2. Given `descAtomOps#dimensionOf` (`Delegates.ts:127-133`), when it
   destructures `{width, height}` from either variant, then it compiles
   unchanged.
3. Given the existing `image` producers (`render-atoms.ts`,
   `leaf-sizing.ts`), when unchanged, then they still satisfy the type.
4. Given the full test suite and the 390 SVG goldens, when run, then output
   is byte-identical — this task changes no behavior.

## Quality bar

All four gates exit 0. SVG goldens 310/23/57 byte-identical.

## Observability

N/A — a type change in a synchronous library.

## Rollback

**Reversible** — revert the commit; no consumers depend on the new variant
yet.

## Boundaries

**Always:** keep the change additive; update the doc comment to explain WHY
two channels exist (different objects/method calls upstream), citing
`AtomSprite.calculateDimensionSlow` (declared) vs `Footprint.drawPath`
(observed).
**Ask first:** if the union shape genuinely cannot express a case — journal
and STOP.
**Never:** add ink/measurement fields to this type (see non-goal). Never
update consumers here; that is T7/T9's work and doing it early creates a
write-set collision.

## Method rules

1. **Trace two dependency levels** before ruling on scope — enumerate this
   type's consumers, then THEIR consumers, before declaring the change
   additive.
2. **Verify any "already fixed" claim against the CURRENT call graph.**

## Commit

One commit: `feat(T4): widen AtomImageResolver to a two-channel union`
