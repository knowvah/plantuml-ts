## Observation: closing a mission after another has merged to main
- **Context**: cdd6 batch 4 ran after mindmap-engine-port had merged to main (107 cdd6 commits behind).
- **Finding**: merging main INTO the mission branch before its exit measurement gave 8 conflicts, all mechanical: the two routing/refusal baselines (row-level three-way union by (tree,type,slug) — no row changed on both sides), the gate count constants (re-derive from the merged manifest, comment the derivation), `docs/catalog.md` and `docs/parity-report.md` (regenerate), plus one file both missions had ported independently (`preprocessor-collector.ts` `{{ }}` nesting — keep one, run both missions' tests).
- **Impact**: the exit measurement then describes the tree main actually receives, and the merge to main is conflict-free. Prefer this over merging the stale branch to main and repairing after.
- **Confidence**: High
