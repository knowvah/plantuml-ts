# Exit — final measurement, docs, memory, PR prep

Agent: orchestrator. Runs after the batch 2 close. Commits:
`chore(gdd-exit): exit bar — gantt <c>/265 conformant, 0 losses`, then
`docs(gdd): close out`.

## Steps
1. **Final measurement** at load < 8: `gates.sh final`; `cmp dist/plantuml-ts.d.ts
   $M/b0-plantuml-ts.d.ts` (or the journaled `RenderFragment` / `AssembledSvg`
   diff only — stop 6 amendment 2026-10-27); chain into `$M/final-eng/` diffed against **b0**:
   0 conformant losses in the 27 other engines; every mover journaled with its
   mechanism (T1a rows moving toward the jar are expected movers).
2. **D8 exit bar:** gantt 265/265, `errored` 0, goldens 254, the five authored
   fixtures jar-equal in `authored-baseline.json`; every open row (if any)
   has a mechanism and an owner in `fixtures.md`.
3. **Docs:** `fixtures.md` family table closed; `plans/gantt-engine-port/
   fixtures.md` "Open families" pointed here; `planning/next-missions.md`:
   gep section's "Open → gantt-divergence-drive" replaced by a gdd DONE block,
   plus two filings — (a) D1 option A, the `NONE_PAINT` representation mirror
   with the 10-file inventory from `decisions.md`, (b) D9, the `data-*`
   comparator blind spot (`normalize.ts:16`, `DiagramChromeFactory.java:373-374`);
   `planning/mission-guide.md` Phase 4d "Open work" line updated.
   `DIVERGENCES.md`: untouched (a needed entry is stop 9).
4. **Dashboards:** `npm run parity:dashboard`, `npm run catalog`.
5. **Memory:** write `gdd-status` (outcome, merge state, follow-ons) and add
   the MEMORY.md line; `.agent-notes/gdd-execution.md` observations (only
   novel findings; the corrected mechanisms of this drive qualify).
6. **README:** final status block (per-batch counts, gantt 263 → 265).
7. **PR prep:** PR body in the scratchpad (one line per batch, gantt counts,
   "Output changes: transparent-link paths drop `style=\"stroke:none;\"` in
   every engine; titled gantt with hidden footbox is 8 px taller; emoji in
   gantt separators/notes draws", test plan). Then the
   [squash batch](../batch-squash/overview.md).

## Acceptance
- Given the final diff vs b0, then 0 conformant losses outside gantt.
- Given the D8 checks, then every clause holds or the halt names the clause.

Observability: N/A. Rollback: Reversible.
