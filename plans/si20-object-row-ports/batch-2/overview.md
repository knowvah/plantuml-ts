# Batch 2 — the mechanism

**Sequential.** Every commit must leave all four gates green, which is what
forces the ordering: T1 is additive and inert, T2 is the atomic behavioral
flip, T3 measures and retires the pin.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1](T1-publish-port-bands.md) | Publish `portMemberSections` for objects, NOT wired | typescript-pro | `class-object-sizing.ts`, unit tests | T0, S1 | [x] `750387f7` |
| [T2](T2-wire-the-flip.md) | Atomic flip: object bands + edge suffix + retire `:P` | typescript-pro | `class-port-rows.ts`, `class-shield-helpers.ts`, unit tests | T1, S2 | [x] `62a356ca` |
| [T3](T3-shrink-backlog.md) | Re-measure, delete the object backlog | general-purpose | `oracle/goldens/object/port-backlog.json`, `tests/oracle/object-dot-parity.test.ts`, `../decision-journal.md` | T2 | [x] `83bc0e98` |

## Why T2 is one commit and not three

Directly inherited from SI17's T2, which was confirmed with the maintainer
and worked. No subset is coherent:

- Dropping the `:P` marking before the bands exist leaves `rozuxo` failing
  *differently* — the pin asserts `portOk` is its only failure, so the suite
  goes red.
- Adding the edge suffix without the shape flip anchors edges to ports no
  node declares.
- Flipping the shape without the suffix moves the edge to `:h` on a node that
  now advertises rows — the exact defect SI17's B1 had to fix.

## The T1/T2 inertness contract

T1 populates `MeasuredClassifier.portMemberSections` for object leaves and
stops. That is **inert by construction**: the field is read only by
`classFamilyPortRows`, which runs only when `portShortNames` is non-empty,
which requires `classPortShortNamesById` to include object — and that is T2's
change. So T1 must move **no** count.

## Note on `class-dot-graph.ts`

It is **not** in any task's write-set and is expected to need no change:
`classPortShortNamesById` returning a larger map requires no signature change
in `buildOneDotNode` or `buildDotEdges` — the map simply gains entries. T2
carries this as an explicit **verification with a STOP**, not an assumption.
The file has **1 line** of headroom to the blocking 500-line cap.

## Batch exit

- Object DOT `portOk` failures strictly shrink; **class DOT stays at 710/711
  with `portOk` 0**; no other check regresses anywhere.
- All five DOT gates and all three censuses re-run in T2's own pass, because
  the shared emitters are in scope.
- Every slug still failing carries a named mechanism.
