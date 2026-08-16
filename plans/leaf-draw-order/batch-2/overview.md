# Batch 2 — draw in leaf order, triage the remainder

The batch that moves output. T4 sorts `leaves` by `computeLeafDrawOrder`
and makes the renderer one loop; T5 diagnoses whatever `--vs-jar` still
reports as ORDER-ONLY.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T4 | `leaves` built in draw order; renderer single loop; hidden host draws its notes | typescript-pro | `src/diagrams/class/{layout,class-geo-builders,renderer,renderer-uid}.ts`, `tests/unit/class/renderer*.test.ts` + any test pinning N52 order | T2, T3 | [x] |
| T5 | Remainder triage — every fixture still ORDER-ONLY, and a sample of OTHER | typescript-pro | `plans/leaf-draw-order/decision-journal.md` (+ `src/diagrams/class/class-leaf-order.ts` ONLY for a root-caused, Java-cited ordering bug) | T4 | [x] |

Serial.

## Batch exit bar

1. `--vs-jar`: `same=725 order-only=0 other=77` (or every remaining
   ORDER-ONLY fixture has a T5 journal row stating mechanism / origin /
   causal chain / ruled-out, and the STOP condition on D1 is evaluated).
2. `--check-order` vs `baseline/note-order.txt`: `offenders=0`; the moved
   set equals the set of fixtures that cleared ORDER-ONLY plus any listed
   fallback-uid reassignments.
3. Shape-match / DOT-sync diff-empty; pins hold; four gates green.
4. `hide A` with a member-tip note on `A` draws the tip (jar probe).
