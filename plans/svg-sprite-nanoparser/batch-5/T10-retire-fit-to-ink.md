# T10 — Retire `fitToInk`'s substitution

## Context

See [`../README.md`](../README.md) for the mission mechanism (jar-verified).

`sizingAtomImageResolverFor`'s `fitToInk` branch
(`src/diagrams/description/leaf-sizing.ts:360-376`) returns a sprite's **INK
box as its whole resolved dimension**:

```ts
if (fitToInk && atom.kind === 'sprite') {
  const reg = sprites?.get(atom.name);
  if (reg?.inkWidth !== undefined && reg.inkHeight !== undefined) {
    const s = spriteScale(atom.scale, font.size);
    return { href: '', width: reg.inkWidth * s, height: reg.inkHeight * s };
  }
}
```

Its own doc comment explains why it exists: the shared `drawAtoms` was
"off-limits" and built the drawn `UImage` straight from this box, so shrinking
here was "the only lever this write-set has". **That constraint is now gone** —
T7 taught `drawAtoms` to draw primitives and advance by the declared box, and
T9 supplies them. This substitution is the last ink-in-layout channel.

## Task

Remove the `fitToInk` substitution so a sprite's resolved dimension is its
DECLARED box. Ink now reaches `Footprint` through the drawn primitives, as
upstream does it.

Trace what else `fitToInk` threads through (its parameter, its call site at
`:452`, and any usecase-only gating) and remove what becomes dead — but see
the method rules before declaring anything dead.

## Write-set

- `src/diagrams/description/leaf-sizing.ts` (modify)

Tests colocated.

## Read-set

- `src/diagrams/description/leaf-sizing.ts:340-380` — the resolver factory
  and its doc comment; `:440-460` — the call site
- `src/core/svek/image/EntityImageDescriptionSupport.ts:331-359` — T7's
  `drawAtoms`, which now carries the ink
- `src/diagrams/description/render-atoms.ts:63-92` — T9's producer
- `plans/s1l-leaf-sizing/ledger.md` § "The SVG-sprite ink gap" — the
  third, jar-verified version only
- `src/diagrams/description/usecase-footprint.ts` and
  `src/diagrams/description/leaf-sizing-text.ts#inlineFootprintBox` —
  read-only context for how the footprint consumes dimensions

## Architecture decisions (locked)

- [ADR-3](../decisions.md#adr-3) — this is its own gated commit.
  Acceptance is `bootstrap-0` / `ruziru-69-xixo434` at **widened 0**.

### Out of scope — STOP if you need it

The analytic substitute cannot be retired here: `usecase-footprint.ts` →
`footprintBoxes` → `measureUsecase` is called **unconditionally from the CLASS
engine** (`src/diagrams/class/class-layout-leaf-shapes.ts:14,27`), predating
the guard mechanism. Retiring it is class-engine work for a separate mission.
Touching those files is a STOP.

## Interface contract

`sizingAtomImageResolverFor` loses its `fitToInk` parameter if nothing else
needs it. Verify before removing — see method rule 2.

## Acceptance criteria

1. Given `bootstrap-0`, when measured, then **widened = 0**.
2. Given `ruziru-69-xixo434`, when measured, then **widened = 0**.
3. Given `npx tsx scripts/measure-description-size-deltas.ts`, then it exits
   0 — zero widened across all 112 pinned fixtures.
4. Given `sprite-SVG-fill-management-3` and `tatori-66-kaci883` (the `card`
   fixtures the original `fitToInk` doc names as having widened when
   shrinking was applied unconditionally), then neither regresses.
5. Given the 389 SVG goldens, then byte-identical.

## Quality bar

All four gates exit 0. **This task carries the mission's acceptance
measurement** — if criteria 1–3 do not hold, the mission has not achieved its
objective, and that must be stated plainly rather than worked around.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — revert the commit; `fitToInk` returns. Own gated commit
specifically so this is a clean single revert.

**Never re-pin `size-backlog.json`** to make a measurement pass. That is stop
condition 5 and it silently weakens the guard for every future mission.

## Boundaries

**Always:** keep this as one commit, separate from T11.
**Ask first / STOP:** if removing the substitution widens something the pins
do not cover, or if `measureUsecase`'s class-engine caller blocks the change.
**Never:** re-pin `size-backlog.json`; never touch
`class-layout-leaf-shapes.ts` or `usecase-footprint.ts`.

## Method rules — this task is where they bite hardest

1. **Trace two dependency levels** before declaring `fitToInk`'s parameter or
   any helper dead. The `usecase-footprint.ts` → `measureUsecase` chain was
   traced ONE level in a previous mission and the class-engine caller was
   missed — that miss is why the analytic substitute is still here.
2. **Verify "already fixed / already wired" against the CURRENT call graph.**
   `imgFallbackFont` was correct when it landed and dead by the next task.
   Before removing anything as dead, grep for live callers; before keeping
   anything because "T7 handles it now", confirm T7 actually reaches this
   path.

## Commit

One commit: `fix(T10): retire fitToInk, restoring the declared-box channel`

Body: state the measured before/after widening for both fixtures.
