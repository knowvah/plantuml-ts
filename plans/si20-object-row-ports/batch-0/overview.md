# Batch 0 — go/no-go measurement, in parallel with the first split

**T0 is blocking.** Nothing in Batch 2 starts until it resolves
[ADR-1](../decisions.md#adr-1--what-is-the-object-header-translate-unresolved--batch-0)
and [ADR-2](../decisions.md#adr-2--is-the-object-election-input-getdisplayfalse-unresolved--batch-0).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0](T0-band-source-gono-go.md) | Resolve the header translate and the election input by measurement | general-purpose | `../decision-journal.md` | — | [ ] |
| [S1](S1-split-object-sizing.md) | Relocate object geo builders to `class-object-sizing.ts` | typescript-pro | `class-object-map-sizing.ts`, `class-object-sizing.ts` (new), `class-layout-helpers.ts` (import only) | — | [ ] |

## Why these two run in parallel

Their write-sets are disjoint: T0 writes only the decision journal and no
production code; S1 writes only source. Neither reads the other's output.

**The accepted risk, stated plainly:** if T0 returns a STOP, S1's relocation
has already landed. That is fine — the split is a pure relocation, is
independently valuable, and is required by *any* version of this mission. It
is not work thrown away by a T0 stop.

## Why T0 is a batch of its own gate

`rozuxo-44-fudi093` — the only object fixture with the defect — **cannot
separate `H` from `margin`**; it pins only their sum, 22. See ADR-1's table.
An agent that assumes the class margin of 4 transfers will derive `H = 18`,
"verify" it against `rozuxo`, and pass — while being wrong in a way that
surfaces only on a stereotyped object. T0 must author that discriminating
control, exactly as SI17's T0 had to author `fm-both` because no corpus
fixture had both compartments.

T0 writes **no production code**. Its deliverable is a number-bearing
journal entry naming the winner, or a stop.

## Batch exit

- ADR-1 records `H` and `margin` separately, each with the measurement that
  fixed it — not their sum.
- ADR-2 records whether `formatObjectMemberText` equals `getDisplay(false)`,
  asserted on a member that HAS a visibility character.
- `class-object-map-sizing.ts` is under 500 lines and every measured count is
  byte-identical to before S1.
