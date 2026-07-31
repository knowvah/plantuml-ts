# Batch 3 — Registry into the walk; sprite revert

Two tasks, parallel. Disjoint write-sets and no shared output.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Wire the registry into the transitive prefetch walk | typescript-pro | `src/core/include-resolver.ts`, `src/index.ts`, `tests/unit/stdlib-registry-prefetch.test.ts` | T1, T2 | [x] |
| T6 | Revert the three sprite fixtures to `!include`; re-capture goldens | typescript-pro | `oracle/goldens/svg-description/usecase/sprite-svg-*/{in.puml,golden.svg}` | T5 | [x] |

## Batch exit criteria

- All quality gates green
- A registry resolves a bundle whose text contains a further
  `!include <Bundle/Other>` — transitivity proven, not assumed
- With no registry supplied, behavior is identical to post-T1
- Every sprite fixture is either reverted **and** zero-diff, or left inlined
  **with its measurement recorded** — never reverted-and-failing
- 389 svg-class/object/state goldens byte-identical

## The trap in T6

`ratchet.json` pins all three sprite fixtures at zero-diff. An agent that
reverts an `in.puml`, finds a diff, and "fixes" it by editing `golden.svg` has
inverted the oracle — that is stop condition 4. Re-capturing a golden from the
pinned jar **because its input legitimately changed** is correct and required
([ADR-6](../decisions.md#adr-6)); editing one to close a diff is a STOP.

The acceptance criteria are written so that "stays inlined, measured" is an
explicitly allowed outcome. Take it rather than engineer toward the pin.

## Why T3 and T6 can share a batch

They share no file. T3 is `src/` + a new unit test; T6 is fixture inputs and jar
outputs under `oracle/goldens/`. Both can move `npm test`, so the orchestrator
runs gates after both return and attributes any failure before committing
either — commit per task, not per batch.
