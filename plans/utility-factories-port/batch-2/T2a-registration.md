# T2a: register the utility plugins in upstream order (D2)

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (opus).

## Task (TDD)
1. Read `PSystemBuilder.java:133-200` and `src/index.ts:84-129` (the order comment and the
   registrations). Register each batch-1 plugin at its upstream position RELATIVE to the plugins
   the port has: `colorsPlugin` BEFORE `sequencePlugin` (java:134); license/version/donors/
   skinparameters/listEmoji/openIconic/listOpenIconic/listArchimateSprites after the UML factories
   and before salt (java:144-153); sudoku after packet (java:163); egg/appleTwo/rip/charlie after
   that (java:175-181); dedication after them (java:186). Extend the order comment with the Java
   line for each. Out-of-scope factories are not registered (README).
2. Test (`tests/unit/utility-registration.test.ts`): the registry order equals the Java order for
   every registered plugin pair (derive the expected order from a table citing java lines); each
   of the 17 corpus sources routes to its utility plugin; a sample of UML sources (one per
   engine) still routes to its engine.
3. Measure: `npm run svg:survey -- unknown --out <worktree>/plans/utility-factories-port/measurements/T2a/parity-unknown.json`;
   `render-diff` on every non-conformant in-scope row; a whole-corpus hash diff over
   `test-results/dot-cache/*/*` before/after (`plans/wbs-engine-port/measurements/T4a/hash-corpus.mts`
   method) proving only the 17 rows' bytes changed (any other changed row: stop and report — stop 7).
4. Fix what shares a mechanism inside the write-set; group the rest into residual families with
   Java + port `file:line` (the close turns them into batch-3 specs).

## Write-set
The registration lines + imports in `src/index.ts`, `tests/unit/utility-registration.test.ts`,
`docs/catalog.md`, `.agent-notes/ufp-T2a.md`, `plans/utility-factories-port/measurements/T2a/**`.
Any OTHER file is a stop; `oracle/goldens/**` and the ratchet/baseline tests are orchestrator-only
(report the rows that would move — the utility diff-baseline and the routing/refusal gates WILL
go red once the rows render; that is expected).

## Acceptance
- Given each of the 17 sources, then it routes to its utility plugin and renders (no sentinel).
- Given the whole-corpus hash diff, then only the 17 rows changed.
- Given every other engine's golden ratchet, then nothing changes.

**Observability:** N/A. **Rollback:** Reversible.
