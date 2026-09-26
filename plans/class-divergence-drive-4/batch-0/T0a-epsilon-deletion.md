# T0a — commit the `absorbLayoutEpsilon` deletion

**Context.** cdd3 T-D3 (journal 56) measured that making `absorbLayoutEpsilon`
the identity moves 0 rows once the 2-dp read is in. The working tree already
deletes `src/core/layout-epsilon.ts` and its two call sites
(`TextBlockExporter.ts:67-68`, `svg-graphics-core.ts:229-232`), and updates
`docs/catalog.md`. Dead code is deleted, not kept (memory: delete archived code).

**Task.** Confirm there are no other references (`ast-grep`/Serena on
`absorbLayoutEpsilon`, including tests). Delete any test that only exercised
it. Run the four gates. Then run the class survey and confirm it is still
689/16/18. Commit `refactor(cdd3-T-D3): delete absorbLayoutEpsilon` with a
body citing journal 56.

**Acceptance.** Given the gates, when run, then all green. Given the class
survey, then it is 689/16/18 with no `dotEqual` change against the pre-deletion
survey.

**Observability** N/A. **Rollback** Reversible (revert).
