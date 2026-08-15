# Batch 1 — the inventory, and the classification it enables

Nothing under `src/` changes. This batch makes the duplication countable, so
every later batch has a gate, and classifies it so later batches have a
work-list instead of a grep.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Inventory harness + a classified work-list | typescript-pro | `scripts/constant-inventory.ts`, `.agent-notes/constant-inventory.md` | — | [ ] |

One task, deliberately: the harness and the classification are the same
reading pass, and splitting them would mean reading every declaration twice.

## Batch exit bar

1. `npx tsx scripts/constant-inventory.ts` reports the current counts and
   reproduces the numbers in the mission README (67 / 117 / 61 / 6) or
   explains, per name, why it differs.
2. Every same-value name is classified **share** / **coincidence** /
   **unknown**, each with its evidence.
3. `HACK_X_FOR_POLYGON` is reported as `known-exception`, not as work.
4. Rendered output byte-identical; all four gates green.
