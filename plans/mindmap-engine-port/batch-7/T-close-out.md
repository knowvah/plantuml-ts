# T-close-out: close-out and merge (orchestrator)

Return only: merge sha, final counts, follow-ons filed, memory updated (y/n).

## Task
1. Ledger `fixtures.md`: every row has a `final`.
2. `npm run parity:dashboard`; `npm run catalog`; commit.
3. `DIVERGENCES.md`: a "two style paths" entry. Mindmap resolves styles through the
   ported upstream style engine (`src/core/style/`); every other engine still uses the
   flat `StyleMap`. Record why (D1) and the migration path.
4. Next-missions follow-ons:
   - WBS reuses `FtileBoxOld.createWbs`, `IdeaShape` and the style engine
     (`WElement` shares `STEP_BY_PARENT`);
   - migrate other engines to the style engine;
   - embedded mindmap in engines other than class;
   - residual rows open at exit.
5. `npx prettier --check` over every file changed on the branch; four gates green.
6. `git checkout main && git merge --no-ff feat/mindmap-engine-port` (merge commit;
   the journal cites per-task commits). **Do not push.**
7. Memory: a `mindmap-engine-port-status` file + a MEMORY.md line.

## Write-set
`plans/mindmap-engine-port/**`, `docs/parity-report.md`, `docs/catalog.md`,
`DIVERGENCES.md`, the next-missions file, memory files.

## Acceptance
- Given main after the merge, then the four gates are green and the dashboard shows the
  mindmap counts.
- Given the ledger, then no row has an empty `final`.

**Observability:** dashboard updated. **Rollback:** Reversible (revert the merge commit).
