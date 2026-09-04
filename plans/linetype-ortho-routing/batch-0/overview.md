# Batch 0 — pin the floor

One task. **Nothing may change source until this lands.**

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Pin the pre-change state of all 8 fixtures, individually | orchestrator | `oracle/goldens/svg-conformance/splines-baseline.json`, `.agent-notes/lor-T0.md` | — | [x] |

**Orchestrator-executed.** `scripts/repin-sequence-baselines.ts:3-8` reserves
baseline JSON writes to the orchestrator: *"Task agents never write a
baseline JSON."*

**Why individually, and why this gates everything.** The mission's mechanism
is verified end-to-end on `pavuzo-79-zodu430` **only**; the other 7 are
inferred from sharing the identical missing code path. That inference is a
structural certainty about the *code*, but says nothing about each fixture's
*numeric* effect — and ortho routing moves every edge on a fixture. Without a
per-fixture pin, a regression on one of the 7 hides inside an aggregate and
stop condition 1 becomes unfalsifiable.
