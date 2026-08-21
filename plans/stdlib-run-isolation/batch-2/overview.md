# Batch 2 — Implement the approved option (SERIAL)

**Do not start this batch until the user has approved T2's ADR.** Batch 1
ends the autonomous run by design (stop 3). The orchestrator resumes here
only with an explicit user decision, and records that decision in the
journal before dispatching anything.

These task files are deliberately written against "the approved option"
rather than a named design. That is the decision boundary (D4), not
vagueness. Whoever resumes the mission fills in the specifics from the
approved ADR — including, if the user chose option C, deleting this batch
entirely and going straight to batch 3.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Implement the approved mechanism, TDD | typescript-pro (sonnet) | per the approved ADR; the orchestrator pins the write-set before dispatch | T2 + user approval | [ ] |
| T4 | Convert the consumers T1 marked seam-eligible | typescript-pro (sonnet) | per the approved ADR; disjoint from T3 or serialised after it | T3 | [ ] |
