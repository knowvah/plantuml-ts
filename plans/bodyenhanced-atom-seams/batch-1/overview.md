# Batch 1 — SVG goldens (GATING, ADR-5)

One task, and nothing else may start until it lands. ADR-1 changes
text-block construction for every description diagram's RENDERED output,
and there are only 4 `svg-description` goldens against 352 size goldens.
Without this batch the riskiest change in the mission would be unwatched.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Author SVG goldens + wire their ratchet | general-purpose | `oracle/goldens/svg-description/*`, `tests/oracle/svg-conformance/description.golden.ratchet.test.ts` | — | [ ] |

**This batch must change no behaviour.** All goldens must pass against
today's code. A golden that does not is either mis-generated or has found
a pre-existing bug — investigate before pinning it, and never pin a wrong
value to make the suite green.
