# T2 — `Slot`, `SlotSet`, `CompressionTransform`

**Agent:** `typescript-pro` · **Depends on:** —

## Context

Read [`../decisions.md#d2`](../decisions.md) and `#d5` (locked). A pure
port with no consumer; the aggregate must stay EXACTLY 42511 (stop 6).
Java, `klimt/compress/`: `Slot.java` (constructor throws on `start >= end`,
`:48`; `contains` is inclusive; `intersect(Slot)` is any-endpoint-inside;
`merge` is min/max; `intersect(start, end)` is the clipped slot or null;
`compareTo` by start), `SlotSet.java` (`addSlot` removes every colliding
slot and merges into the new one; `smaller(margin)` skips slots of size
`<= 2 * margin` and shrinks the rest by `margin` each side; `reverse()`
sorts and emits the gaps between consecutive slots; `filter`, `addAll`),
`CompressionTransform.java` (`transform(v) = v − Σ` over slots with
`start <= v` of `min(size, v − start)`), `PiecewiseAffineTransform.java`,
`CompressionMode.java`.

## Read-set

The five Java files above (whole); `src/diagrams/activity/layout/` for the
module conventions (`@see` on every symbol).

## Write-set

See the batch table. `docs/catalog.md` only on drift.

## Task

Tests first. Port the three classes and the two types under
`src/diagrams/activity/layout/compress/`, `int/double → number`,
`Comparable → a sort comparator`, the `IllegalArgumentException` → a thrown
`Error` with the same message. `Slot` may be an interface + functions or a
class; preserve the method names.

## Interface contract (consumed by T3, T4)

```ts
type CompressionMode = 'x' | 'y';
interface PiecewiseAffineTransform { transform(v: number): number }
class Slot { constructor(start, end); start; end; size(); contains(v); intersects(other); merge(other); intersect(start, end): Slot | undefined }
class SlotSet { addSlot(start, end); addAll(other); filter(start, end): SlotSet; reverse(): SlotSet; smaller(margin): SlotSet; slots(): readonly Slot[] }
class CompressionTransform implements PiecewiseAffineTransform { constructor(slotSet: SlotSet) }
```

## Acceptance criteria

- Given slots (0,10) then (5,20) added, then one slot (0,20)
- Given sorted slots (0,10), (30,40), when reversed, then (10,30)
- Given a 28-wide slot, when `smaller(5)`, then an 18-wide slot; a 10-wide
  slot vanishes
- Given removed slots before `v`, when `transform(v)`, then `v` minus their
  total length; inside a slot, `v − (v − start)` of that slot
- Given `start >= end`, then the constructor throws
- Given the probe, then EXACTLY 42511

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

All four gates green; full `npm test`.

## Commit

`feat(akc-T2): port klimt/compress Slot, SlotSet and CompressionTransform`
