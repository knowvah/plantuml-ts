# T11 — exit

**Agent:** orchestrator.

## Write-set
`docs/graphviz-issues/TRACKER.md`, `planning/next-missions.md`, `.agent-notes/dsw-*.md`,
`plans/description-svek-wrappers/{README.md,fixtures.md,decision-journal.md}`, auto-memory
(`~/.claude/projects/-Users-scottseely-git-knowvah-plantuml-ts/memory/`), `docs/parity-report.md`.

## Steps
1. **TRACKER.**
   - For 28 (deroxu), 29 (xagonu), 30 (repoge, sokevu), 32 (bamami, bobixe, pugodi, rufopi, zosuje)
     and 35 (bamami), add a dated `CONSUMED <date> (dsw)` line with layoutParity + render-diff before → after.
   - Tick a box **only** under the file's own rule: the fix landed in the pinned `.tgz` AND the named
     fixtures re-measure clean.
   - Otherwise state what still differs and whether it is ours.
2. **next-missions.md**, section "dot-engine 2.4.0 bump":
   - Mark follow-ons 1–3 closed with commit shas.
   - Move follow-on 4 (xenusu, pavuzo, rubebe, zuduxu) into its own entry. Note that rubebe and zuduxu
     are `jarErrored` in the routing baseline, so the 2026-10-10 error-page rule must be applied before
     any drawing work.
   - Add a `description-svek-wrappers` DONE section: counts b0 → final, pins, `layoutEqual`, T7's
     histogram headline, and open residuals with owners.
3. **Notes.** `.agent-notes/dsw-*.md` for every novel finding (the T7 histogram, kermor behaviour,
   any gate defect). No restating of code.
4. **Memory.** Write a `dsw-status` memory, add its `MEMORY.md` line, and update the
   `dot-engine-2-4-0-status` memory: its follow-ons are now owned by dsw.
5. **Final gates** on the mission branch: all four, plus prettier check, collected = on-disk.
6. **Merge** `feat/description-svek-wrappers` into main as a **merge commit** (mission branch; the
   journal references per-task shas). Re-run the four gates on main. **Do not push.**
7. Tick batch 6 in README.

## Acceptance
- Given main after the merge, then all four gates pass.
- Given TRACKER, then every 28–35 entry named above has a dated dsw line, and only clean ones are ticked.
- Given next-missions, then follow-on 4 exists as its own entry with the jar-error caveat.

**Observability:** final SLI record. **Rollback:** Reversible (`git revert -m 1 <merge>`).
