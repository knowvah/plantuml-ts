# T12 — exit

**Agent:** orchestrator.

## Write-set
- `docs/graphviz-issues/TRACKER.md`, `planning/next-missions.md`, `.agent-notes/codd-*.md`
- `plans/component-divergence-drive/{README.md,fixtures.md,decision-journal.md}`
- auto-memory (`~/.claude/projects/-Users-scottseely-git-knowvah-plantuml-ts/memory/`)
- `docs/parity-report.md`

## Steps
1. **TRACKER.**
   - For every entry in `measurements/tracker-ledger.md` that a codd fix touched, add a dated
     `CONSUMED <date> (codd)` line with the named fixtures' render-diff/layoutParity before → after.
   - Tick a box **only** under the file's own rule: the fix is in the pinned dot-engine AND the
     named fixtures re-measure clean (stop 14).
   - Otherwise state what still differs and whose defect it is.
2. **next-missions.md.**
   - Add a `component-divergence-drive` DONE section with:
     - counts b0 → final per engine
     - census Σ b0 → final, and the D1 result per clause
     - pins: description, layout-parity, census
     - open residuals with mechanisms and owners
   - Mark the dsw residuals that codd closed (with commit shas).
   - Leave the others with their owners.
3. **Notes.** Write `.agent-notes/codd-*.md` for every novel finding: instrument defects, family
   mechanisms, D8 outcomes. Do not restate code.
4. **Memory.**
   - Write a `codd-status` memory and add its `MEMORY.md` line.
   - Update `dsw-status`: its component residuals are now owned or closed by codd.
5. **Final gates** on the mission branch: `bash measurements/gates.sh final`, prettier check, and
   collected = on-disk.
6. **Merge.**
   - Merge `feat/component-divergence-drive` into main as a **merge commit**; the journal references
     per-task shas.
   - Re-run the four gates on main and record them in a `chore(codd-exit)` commit.
   - **Do not push.**
7. Tick batch 6 in the README, and append a mission summary to the bottom of the README.

## Acceptance
- Given main after the merge, then all four gates pass.
- Given TRACKER, then every touched entry has a dated codd line, and only clean ones are ticked.
- Given next-missions, then every unmet D1 gap has a mechanism and an owner.

**Observability:** the final SLI record. **Rollback:** Reversible (`git revert -m 1 <merge>`).
