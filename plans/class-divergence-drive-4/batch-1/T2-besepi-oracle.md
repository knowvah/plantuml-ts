# T2 — besepi oracle re-render (D5)

**Context.** `plans/class-divergence-drive-3/decision-journal.md` rows 29/30/38. Every port fix for
besepi landed in cdd3 T16/T17. What remains is that the committed dot-cache
disagrees with a fresh jar run on couple-edge orientation.

**Task.**
1. Render `tests/corpus/class/besepi-37-rori892.puml` 3× with
   `scripts/oracle-render.sh <tmpN>`, using the pinned jar
   (`oracle/dist/plantuml-oracle.jar`; if it is absent, see memory
   oracle-jar-fallback-path). Require byte-identical SVG and `svek-*.dot`
   across the 3 runs. If they differ, HALT (D5).
2. Find every place the harness reads besepi's oracle from
   (`test-results/dot-cache/class/besepi-37-rori892/`,
   `oracle/goldens/class/besepi-37-rori892/`, the corpus capture script
   `scripts/capture-oracle-cache.ts`). Replace ONLY besepi's files, in the
   same layout.
3. Survey class. Journal the verdict and `dotEqual` before and after. If it is
   not conformant, run `render-diff.mts` and journal the residual's
   mechanism, or leave it `open -> <owner>`.
4. Commit `chore(cdd4-T2): re-render besepi oracle from the pinned jar`,
   with a body stating the determinism proof and the stop-8 waiver (D5).

**Acceptance.**
- Given 3 renders, then `cmp` is identical.
- Given the survey, then besepi is conformant or carries a stated
  mechanism, and no other fixture moved.

**Observability** N/A. **Rollback** Reversible with oracle restore
(`git revert` restores the old oracle files).
