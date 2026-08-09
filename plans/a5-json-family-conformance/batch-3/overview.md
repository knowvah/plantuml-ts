# Batch 3 — the layout re-mirror (ADR-1)

The mission's core. Replaces this port's `rankDir: 'LR'` + fractional
`tailportY` approximation with upstream's actual structure: default-TB graph,
node width/height deliberately swapped, real `shape=record` labels with `P<n>`
ports, and every coordinate transposed back through a ported `Mirror`.

**Strictly sequential — every task writes `src/diagrams/json/layout.ts` or its
direct output.** No parallelism inside this batch. That is the file-ownership
rule doing its job, not an oversight.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T5 | go/no-go: does the mirrored graph actually move geometry? | orchestrator (inline) | `plans/a5-json-family-conformance/adr1-gonogo.md` | T4 | [x] **GO (weak)** |
| T6 | port `Mirror`, build the TB+swapped-dims graph | orchestrator (inline) | `src/diagrams/json/Mirror.ts`, `src/diagrams/json/layout.ts` | T5 | [x] **dim error 111.88 → 101.83** |
| **T6b** | **port `TextBlockJson`'s node sizing** (added mid-mission on T5's evidence) | orchestrator (inline) | `src/diagrams/json/{TextBlockJson,layout}.ts` | T6 | [x] **dim error 101.83 → 30.28** |
| T7 | real record ports: `P<n>` labels + `tailport` | orchestrator (inline) | seam: `core/graph-layout*.ts`; json side NOT wired | T6b | **[~] PARTIAL** — seam landed, json reverted (7x dim regression, no DOT oracle to diagnose against) |
| T8 | port `JsonCurve` edge routing onto mirrored coords | typescript-pro | `src/diagrams/json/JsonCurve.ts`, `src/diagrams/json/renderer.ts` | T7 | [ ] |

## T6b was added mid-mission, and why that matters

T5 did its job: it authorised T6 **and** falsified the brief's assumption that
ADR-1 was the dimension lever. T6 delivered exactly the improvement T5
predicted (111.88 → 101.83) and left **zero** fixtures at exact dimensions.

Node sizing dominates. `T6b-node-sizing.md` ports `TextBlockJson`'s dimension
calculation and names six specific divergences already identified against the
Java. Without it this batch cannot reach the exit bar, however well T7 and T8
land — they target edge geometry, which the dimension metric does not measure.

## T5 is a real gate, not a formality

ADR-1 is a reading of the Java, and readings have been wrong in this repo
before. T5 spends one task testing it cheaply — build the mirrored graph
behind a flag or in a scratch harness and measure whether the resulting
geometry moves toward the jar — **before** T6–T8 commit to the rewrite.

If T5 shows the mirrored graph lands no closer than `rankDir: 'LR'`:
**STOP.** That is a named stop condition in the README. Log it, report the
measurement, and wait for the maintainer. Do not proceed through T6 on the
grounds that the Java says so — a faithful-looking port that does not move the
number is how a mission burns a week.

## Upstream references

| What | Where |
|---|---|
| graph construction, the dim swap | `jsondiagram/SmetanaForJson.java:236-244` |
| record label with ports | `SmetanaForJson.java:265-297` (`getDotLabelArray`, `getDotLabelMap`) |
| edge attrs, `tailport` | `SmetanaForJson.java:217-230` |
| coordinate transpose | `jsondiagram/Mirror.java#invAndXYSwitch` |
| spline consumption | `jsondiagram/JsonCurve.java:96-120` |

## Exit

- json geometry measurably closer to the jar than the Batch 2 baseline, with the
  delta stated.
- Every fixture that reaches zero diffs pinned.
- yaml and hcl re-measured — they ride `layoutJson` and MUST be re-verified here,
  not assumed.
- Four gates green; no ratchet regression anywhere.
