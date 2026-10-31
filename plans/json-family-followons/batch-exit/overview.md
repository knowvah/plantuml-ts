# Exit — final measurement, DIVERGENCES, docs, memory, PR prep

Agent: orchestrator. Commits: `chore(jff-exit): exit bar — <summary>`, then `docs(jff): close out`.

## Steps
1. **Final measurement** at load < 8: `gates.sh final`; `cmp dist/plantuml-ts.d.ts $M/b0-plantuml-ts.d.ts.txt`;
   chain `final-eng` vs **b0**: 0 conformant losses in all 28 engines (reuse the
   b2 chain if `git rev-parse HEAD:src` is unchanged since).
   `npx tsx $T/residue.mts --all --json $M/final-residue.json`.
2. **Bar (README "Target"):** title + scale authored rows carry no title-related
   diff; every authored row is in the manifest and the positional ceiling;
   positional ceilings ≤ b0 on every corpus row; manifest ceilings ≤ b0; pins
   ≥ 14/7/1; `scale-at-emit.ts` and `NodeStyleJson.scale` gone; T1a's outcome
   (issue file or closing note) exists; every extended mover journaled.
3. **DIVERGENCES.md**, "Smetana-backed diagram types": one sentence for D2 (the
   labelless empty record — Smetana `storeline` (0,16), `labels__c.java:119-122`,
   vs dot-engine's `\N` name + PAD; the explicit `''` label reproduces Smetana's
   outcome; jfp journal row 21); update any sentence that described scale as
   json-local.
4. **Other docs:** `oracle/goldens/svg-json/README.md` (authored count, title ×
   scale); `planning/next-missions.md` — strike jfp follow-ons 1, 3, 4, 5, 6 with
   the commit/close that resolved each (2 stays, ruled), strike the "Authored
   fixtures worth adding" line's items that landed, add any new follow-on;
   `planning/mission-guide.md` open-work line (jff).
5. **Dashboards:** `npm run parity:dashboard`, `npm run catalog` (a module was deleted).
6. **Memory:** `jff-status` memory + MEMORY.md line; `.agent-notes/jff-execution.md` (novel findings only).
7. **README:** final status block (per-batch counts from `fixtures.md`).
8. **PR prep:** PR body in the scratchpad (one line per batch, the three surveys
   and the positional totals before → after, authored rows added, T1a outcome,
   test plan). Then the [squash batch](../batch-squash/overview.md).

## Acceptance
- Given the final diff vs b0, then 0 conformant losses in all 28 engines and the d.ts is byte-identical.
- Given `planning/next-missions.md`, then each jfp follow-on is either struck with its resolving commit or still open with a stated reason.

Observability: N/A. Rollback: Reversible.
