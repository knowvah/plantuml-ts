# T-exit: exit measurement (orchestrator)

Return only: final counts, D9 bar per clause (pass/fail + evidence), movers with mechanisms.

## Task
1. Four gates on the branch (README), collected = on-disk.
2. Survey mindmap and all other engines into `measurements/exit-eng/`, comparing with
   the last close (load < 8 per engine). Survey class and unknown, and re-measure `semutu`.
3. D9 bar:
   - all 142 measured;
   - every non-conformant row in `fixtures.md` has a mechanism (Java + port
     `file:line`) and an owner or `open -> <next>`;
   - 0 conformant losses in any engine;
   - 0 non-mindmap movers without a mechanism;
   - the numeric target set at the b5 close is met, or the miss is journaled with
     mechanisms.
4. Journal a row per clause.

## Write-set
`plans/mindmap-engine-port/{measurements/exit-eng/**,decision-journal.md,fixtures.md}`.

## Acceptance
- Given the exit surveys, then every clause of D9 has a journal row with evidence.

**Observability:** the harness counts above. **Rollback:** Reversible (measurement only).
