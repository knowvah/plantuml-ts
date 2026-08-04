# Batch 3 — docs + close-out (single task)

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|------------|------|
| T3 | svg-class README five-step authoring→registration path; SI13 mission-index row; mission summary; cold-tree gates | orchestrator (inline) | `oracle/goldens/svg-class/README.md`, `planning/mission-index.md`, `plans/si13-class-authored-registration/README.md` (+ journal, checkboxes) | T2 | [x] |

README path mirrors SI9's description-README five steps, adapted to the
flat class layout and `parity-class.json`/`ratchet.json` names, and states
the add rule's two measured conditions (zero-diff AND dotEqual). ADR-4:
only the SI13 index row carries new numbers; dated history stays;
PARITY-SVG.md noted as stale/unasserted, not touched. Cold-tree double
test run + vendor + size-deltas once before close.

Commit: `docs(T3): document the class authored-fixture registration path`
