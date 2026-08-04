# SI13 Decision Journal

| Date | Task | Decision / Finding | Why | Flagged for review? |
|------|------|--------------------|-----|---------------------|
| 2026-08-04 | plan | Planning phases 2–6 auto-confirmed under the user's "start on mission SI13" directive; scope fixed by the SI13 mission-index row. ADRs 1–4 flagged for review. | Autonomous session; SI15 precedent. | yes |
| 2026-08-04 | plan | ADR-2 tightens SI9's drift precedent into a mechanical rule: regressions (dotEqual true→false, verdict downgrades) STOP; improvements proceed with the full breakdown journaled. Drift is EXPECTED — parity-class.json predates SI10/SI14/SI15. | SI9's maintainer ruling generalized to a decidable condition. | yes |
