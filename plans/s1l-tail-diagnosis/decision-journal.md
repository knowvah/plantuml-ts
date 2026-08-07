# Decision Journal — S1L Tail Diagnosis

Append one row per non-trivial judgment call. "Non-trivial" means a reasonable
engineer might have chosen differently. Append during execution; never rewrite
an existing row.

| Date | Task | Decision / observation | Rationale | Needs review? |
|------|------|------------------------|-----------|---------------|
| 2026-08-06 | planning | Mission scoped diagnosis-ONLY; fixes deferred to a separate mission planned from its output. | Batch 2+ task boundaries depend on mechanisms that do not exist yet; batching on classifier labels would assign the wrong files to the wrong agents. Maintainer decision. | no |
| 2026-08-06 | planning | `gafico-37-cuma657` + `nujito-06-neca370` excluded (GH #24, unported `<code>` monospace block). | A creole feature port, not a sizing defect; its blast radius reaches every engine that renders creole. Stays pinned. Maintainer decision. | no |
| 2026-08-06 | planning | `container-cluster` kept whole in T1 rather than split for balance. | The identical-delta pairs (kovaxi/zidebi 0.772, lesori/ravodu 0.2429) are the strongest available shared-cause signal; splitting puts each pair in a separate agent context and destroys it. | no |
