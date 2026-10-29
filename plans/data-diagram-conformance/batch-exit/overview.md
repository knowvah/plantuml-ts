# Exit — final measurement, docs, memory, PR prep

Agent: orchestrator. Runs after the last close (batch 2, or batch 3 if it
ran). Commits: `chore(ddc-exit): exit bar — json/yaml/hcl structural clean, files <n>/<n> byte-exact, 0 losses`,
then `docs(ddc): close out`.

## Steps
1. **Final measurement** at load < 8: `gates.sh final`; `cmp dist/plantuml-ts.d.ts
   $M/b0-plantuml-ts.d.ts` (or the journaled plugin-seam diff only — stop 6);
   chain into `$M/final-eng/` diffed against **b0**: 0 conformant losses in
   the 28 other engines; every mover journaled with its mechanism.
2. **D1 exit bar:** json/yaml/hcl surveys show 0 `diverged` rows outside
   timafu-94, najoba-05, tadari-70 (the only `divergent` manifest entries);
   every `conformant` row of the three is in its `ratchet.json`; every
   authored json-family row is in the manifest `clean` list or named in
   `fixtures.md` with mechanism + owner; files survey `conformant` = all
   rows, `oracle/goldens/svg-files/ratchet.json` holds every corpus slug,
   `authored-baseline.json` rows all `diffCount 0`; `errored` 0 everywhere.
3. **Docs:** `fixtures.md` family table closed; `planning/next-missions.md`:
   S2b items closed or re-filed with the artifact's verdict, the lad
   follow-on lines for `defaultFontColor` / files font (167-176) resolved
   or re-filed, the A5 row (4922-4927) replaced by a ddc DONE block;
   `DIVERGENCES.md` Extensions table: files rows re-measured (T2e), batch-3
   rows added if it ran — no new divergence entry (stop 9);
   `oracle/goldens/svg-json/README.md` "Current state" counts;
   `planning/mission-guide.md` "Open work" line.
4. **Dashboards:** `npm run parity:dashboard`, `npm run catalog`.
5. **Memory:** write `ddc-status` (outcome, merge state, follow-ons) and the
   MEMORY.md line; `.agent-notes/ddc-execution.md` observations (novel
   findings only: the edge-order mechanism and the files port's klimt
   seams qualify if they surprised).
6. **README:** final status block (per-batch counts).
7. **PR prep:** PR body in the scratchpad (one line per batch, the four
   surveys before → after, "Output changes: json/yaml/hcl edges drawn in the
   jar's order; @startfiles rendered through creole (Twemoji icons, Opale
   notes, textLength); files corpus bucket", test plan). Then the
   [squash batch](../batch-squash/overview.md).

## Acceptance
- Given the final diff vs b0, then 0 conformant losses outside the four engines.
- Given the D1 checks, then every clause holds or the halt names the clause.

Observability: N/A. Rollback: Reversible.
