# Batch 2 — Registry module; golden harness wiring

Two tasks, genuinely parallel. They share no file and neither consumes the
other's output.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Registry of dynamic-`import()` thunks + chunk-load error | typescript-pro | `src/core/tim/StdlibRegistry.ts`, `tests/unit/stdlib-registry.test.ts` | — | [ ] |
| T5 | `render-fixture.ts` wires an `includeStore` | typescript-pro | `tests/oracle/svg-conformance/render-fixture.ts` | — | [ ] |

## Why these two are independent

The golden harness runs in Node under vitest, so it may use
`buildStdlibAssetsStore()` (`node:fs`) exactly as
`scripts/svg-conformance-census.ts` already does. **The fixture work needs no
registry at all** — the registry is for browser consumers. Recognising that is
what turns this mission from a 7-deep chain into five batches.

T2 is `src/` and browser-safe. T5 is a test harness and may use Node built-ins.
Do not let that distinction blur: a Node import reaching `src/` is a STOP.

## Batch exit criteria

- All quality gates green
- T2's module is pure and integration-free — nothing imports it yet
- T5 changes **no** rendered output: all 54 ratcheted fixtures stay zero-diff
- 389 svg-class/object/state goldens byte-identical

## Sequencing note for the orchestrator

Both tasks can move `npm test`. Run gates after both agents return, and attribute
any failure before committing either — commit per task, not per batch.
