# T7 — exit

**Agent:** orchestrator.
**Writes:** `planning/next-missions.md`, `.agent-notes/dur-*.md`, this brief's `README.md`/`fixtures.md`/
`decision-journal.md`, auto-memory (`~/.claude/projects/-Users-scottseely-git-knowvah-plantuml-ts/memory/`),
`docs/parity-report.md`.

## Steps
1. **next-missions.md:** add a `description-url-wrappers (dur)` DONE section (counts b0 → final per engine,
   census Σ, D1 per clause, pins, open residuals with mechanisms and owners). Strike the codd residuals dur
   closed (`[[url]]` wrappers, qualified edge `@id`) with their commit shas.
2. **Notes:** `.agent-notes/dur-findings.md` for novel findings only (do not restate code).
3. **Memory:** a `dur-status` memory + its `MEMORY.md` line; update `codd-status` (its url/@id residuals).
4. **Final gates** on the mission branch: `bash measurements/gates.sh final`, prettier check over the mission
   diff, collected = on-disk. Remove all `dur/*` worktrees and branches.
5. **Merge** `feat/description-url-wrappers` into main as a merge commit; re-run the four gates on main and
   record them in a `chore(dur-exit)` commit whose body ends with a one-line stop summary. **Do not push.**
6. Tick batch 5 and append a mission summary to the bottom of `README.md` (tasks done vs planned, decisions
   flagged for review, gate results, follow-ups).

## Acceptance
- Given main after the merge, then all four gates pass.
- Given next-missions, then every unmet D1 item has a mechanism and an owner.

**Observability:** final SLI record. **Rollback:** Reversible (`git revert -m 1 <merge>`).
