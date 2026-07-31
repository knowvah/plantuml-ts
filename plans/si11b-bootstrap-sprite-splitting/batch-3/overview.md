# Batch 3 — End-to-end verification and the measured win

One task. Every prior task tested its own layer against fabricated inputs;
this one runs the whole path and produces the number the mission is judged on.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6 | End-to-end against the REAL fragments; record the measured payload | typescript-pro | `tests/integration/sprite-split-e2e.test.ts` | T4, T5 | [ ] |

## Batch exit criteria

- All quality gates green
- A 3-sprite diagram fetches only those sprites and **draws** them
- The measured payload is **logged plainly**, not buried in an assertion
- 389 svg goldens byte-identical; the 54-fixture ratchet zero-diff

## What "measure and state" means here

[ADR-6](../decisions.md#adr-6) projects **~98.7%** for a 3-sprite diagram
(~8.8 KB against 1,085,342 B) — deliberately NOT SI11a's 99.7%, because the
7,289 B manifest floor dominates at small N.

**If the real figure lands materially below that, report it and STOP** (stop
condition 15). Do not relax an assertion to make the number look better. A
disappointing honest number is a valid and valuable outcome; a flattering
adjusted one is a mission failure.
