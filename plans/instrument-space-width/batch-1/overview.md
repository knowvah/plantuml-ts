# Batch 1 — the atomic instrument change (D5)

Sequential. T1a produces a staged jar and the port override on a task branch;
T1b (orchestrator, NO agents running) swaps the jar in, re-captures everything,
measures b1, classifies every movement and lands it all in one merge so no
gate ever sees a half-changed instrument.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-seam-and-override.md) | fork seam #4 + patch + pin; `DeterministicMeasurer` override; D9 comments; instrument tests | typescript-pro | fork `FileFormat.java` (authorized); `oracle/patches/0004-oracle-space-width.patch`; `src/core/measurer-deterministic.ts`; D9 comment files; `tests/unit/core/isw-*.test.ts`; `tests/fixtures/isw-T1a/` | b0 close | [x] |
| [T1b](T1b-recapture-classify.md) | swap jar, re-capture all, b1 measurement, families, owed.json, re-pin unchanged/fell | orchestrator | `oracle/dist`, `oracle/pin.json`, `test-results/dot-cache/**`, `oracle/goldens/**`, `tests/fixtures/**` jar renders, every pin JSON, `measurements/{b1*,owed.json,families.md}`, `fixtures.md`, `tests/oracle/description-parity.ratchet.test.ts` | T1a | [x] |

Close per [close-procedure.md](../close-procedure.md) is folded into T1b
(prev = b0); step 7 re-pins only unchanged/fell rows — owed rows go to
`owed.json`.
