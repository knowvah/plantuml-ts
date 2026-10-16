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
5. **Exit commit on the mission branch (USER CHANGE 2026-10-16: land through a PR, not a local merge).**
   Do NOT merge into local main. Record the final gates in a `chore(dur-exit)` commit on
   `feat/description-url-wrappers` whose body ends with a one-line stop summary.
6. **Signing handoff (user decision, journal rows 19-20).** Every mission commit is unsigned. Stop and
   hand the user, for their own terminal (YubiKey PIN + touch per commit), on
   `feat/description-url-wrappers`: `git rebase -r --force-rebase -S c93806188`. Then verify every commit
   after `c93806188` carries a `gpgsig` header (`git cat-file -p`), re-run the four gates, and remove the
   override: `git config --worktree --unset commit.gpgsign` (repo-level `true` remains). Journal the
   old→new sha map (`git range-diff`).
7. **PR (user request 2026-10-16).** After confirming with the user: `git push -u origin
   feat/description-url-wrappers` and `gh pr create --base main` (title in Conventional Commits form; body:
   what/why, counts b0 → final, D1, residuals, flags; >400-line justification; no attribution). Merge
   strategy is a merge commit (mission branch), which keeps the signed branch commits on main.
8. Tick batch 5 and append a mission summary to the bottom of `README.md` (tasks done vs planned, decisions
   flagged for review, gate results, follow-ups).

## Acceptance
- Given the signed mission branch, then all four gates pass and the PR is open against main.
- Given next-missions, then every unmet D1 item has a mechanism and an owner.

**Observability:** final SLI record. **Rollback:** Reversible (`git revert -m 1 <merge>`).
