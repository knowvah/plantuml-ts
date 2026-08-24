# Batch 2 — the structural fix

One task. This is the change with the largest reach in the mission: it is one
line per plugin and it re-decides routing for the whole corpus.

Deliberately **not** parallel with batch 3, though the write-sets are
disjoint. Both change routing corpus-wide; landing them together makes a moved
fixture unattributable, which is the whole reason T1 was built first.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T2 | [Registration order](T2-registration-order.md) | typescript-pro | `src/index.ts`, `tests/unit/core/registration-order.test.ts` | T1 | **HALTED** |

## Halted — 2026-08-23

Implemented, measured, **reverted**. Nothing landed; `src/index.ts` is
unchanged from `f66f6abb`.

The reorder moves T1's gate **79 → 469**: 25 fixed, **415 newly misrouted**.
AC3 is unambiguous — *"Given any fixture that newly misroutes, then STOP — do
not re-pin, do not proceed to batch 3."*

Full diagnosis, both mechanisms, and the preserved plugin↔factory↔line
derivation: [`.agent-notes/T2-registration-order-halt.md`](../../../.agent-notes/T2-registration-order-halt.md).
Summary and recommendation: [../README.md](../README.md#mission-halted-at-t2--2026-08-23).
