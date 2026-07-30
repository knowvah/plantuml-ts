# T7 — `drawAtoms` handles the `drawable` variant

## Context

See [`../README.md`](../README.md) for the mission mechanism (jar-verified).

`drawAtoms` (`src/core/svek/image/EntityImageDescriptionSupport.ts:331`,
called at `:440`) draws every non-text atom as ONE opaque `UImage`:

```ts
ug.apply(new UTranslate(x, origin.y)).draw(UImage.build(resolved.width, resolved.height, resolved.href));
x += resolved.width;
```

That single `resolved.width` is both what gets drawn AND what advances the
line cursor — and `SheetBlock1.ts:180-182` reads the same number for
line stacking. **This is the collapse.** One line is fine (only the ellipse
consumes it); two lines stack line 2 on ink height instead of declared
height, which is the 0.029321in widening.

## Task

Teach `drawAtoms` the `drawable` variant T4 added: draw its `primitives`
(each a `UPath`) instead of a `UImage`, while advancing the cursor by the
**declared** `width`.

## Write-set

- `src/core/svek/image/EntityImageDescriptionSupport.ts` (modify)

Tests for this task go in the existing colocated test file for this module if
one exists; if not, create `EntityImageDescriptionSupport.test.ts` in the same
directory (per `~/.claude/rules/naming-conventions.md` colocation).

## Read-set

- `src/core/svek/image/EntityImageDescriptionSupport.ts:320-360` —
  `drawAtoms` and its doc comment
- `src/core/creole-atoms.ts:118-145` — T4's union
- `src/core/klimt/creole/SheetBlock1.ts:170-195` — the line-stacking cursor
  that reads the same dimension. Read-only; understanding it is the point.
- `src/core/svek/image/EntityImageDescriptionDelegates.ts:127-140` —
  `descAtomOps#dimensionOf`, which must keep working unchanged
- `src/core/klimt/drawing/svg/driver-path-svg.ts` — the existing
  `UPath` → SVG `<path>` driver. **This already exists; do not build a new
  emission path.**

## Architecture decisions (locked)

- [ADR-2](../decisions.md#adr-2) — ink lives ONLY in `primitives`;
  `width`/`height` are the DECLARED box in both variants. The cursor advance
  MUST use the declared `width`. If you find yourself wanting ink for the
  cursor, that is the bug reasserting itself.

### Non-goal

Do not add ink/measurement fields to `AtomImageResolver`. See
[ADR-2's non-goal](../decisions.md#adr-2) — proposing it is a STOP.

## Interface contract

Consumes T4's union. Produces no new type.

## Acceptance criteria

1. Given a `drawable` atom, when drawn, then each `UPath` in `primitives` is
   drawn at the atom's origin, translated consistently with how the single
   `UImage` was positioned before.
2. Given a `drawable` atom, when drawn, then `x` advances by the **declared**
   `width` — never by ink extent. Assert this directly; it is the defect.
3. Given an `image` atom (monochrome sprite, `<img>`, LaTeX), when drawn,
   then behavior is byte-identical to before this task.
4. Given the 390 SVG goldens, then byte-identical — nothing emits `drawable`
   until T9, so this batch must change no output.
5. Given a two-line display containing a `drawable` atom, when laid out, then
   line 2's y-offset derives from the declared height (unit test — no fixture
   exercises this until T9).

## Quality bar

All four gates exit 0. SVG goldens 310/23/57 byte-identical.
`npx tsx scripts/measure-description-size-deltas.ts` exits 0.

**Note:** the new branch is unreachable from production paths this batch —
that is expected and is why criteria 1/2/5 are unit tests rather than fixture
assertions.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — revert the commit; the `image` path is untouched.

## Boundaries

**Always:** keep the `image` branch byte-identical. Respect the 5-param
complexity ceiling — `drawAtoms` already bundles `origin` into one param for
this reason; if you exceed it, apply `#lizard forgives` near the function END
rather than restructuring the signature.

**Never:** advance the cursor by ink. Never touch `SheetBlock1.ts` — it is
read-only here and its single-value read is correct once the declared box is
what it receives.

## Method rules

1. **Trace two dependency levels.** `drawAtoms` is private and called only
   from `buildTextBlock#drawU`; `buildTextBlock`'s callers are
   `EntityImageDescription.ts:287`, `EntityImageDescriptionDelegates.ts:254`,
   `renderer-entity.ts:294,351`, `renderer-cluster.ts:92,99`. This is the
   SHARED renderer across description/class/object/state — which is why the
   390 goldens guard it.
2. **Verify any "already fixed" claim against the CURRENT call graph.**

## Commit

One commit: `feat(T7): draw sprite primitives, advance cursor by declared box`
