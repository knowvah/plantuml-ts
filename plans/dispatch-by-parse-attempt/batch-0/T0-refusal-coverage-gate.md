# T0 — refusal-coverage gate

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. This mission
([README](../README.md)) replaces regex routing heuristics with upstream's
parse-attempt dispatch. Doing so makes every parser **strict**: an unrecognised
line becomes an error diagram instead of being silently dropped.

That turns all 3158 corpus fixtures into an assertion that our command tables
match upstream's — and nothing in this repo can currently measure that. This
task builds the instrument, **before** the change that needs it.

## Task

Add a conformance gate that answers one question per fixture: **did we produce
an error diagram for a source the jar rendered successfully?**

Pin the baseline at the current answer, which should be 0 — no engine refuses
anything yet. If it is not 0, that is itself a finding: record it, do not
"fix" it here.

## Write-set

- `tests/oracle/svg-conformance/refusal-coverage.test.ts` (create)
- its baseline JSON, colocated, following the naming the sibling routing gate
  uses (read that file to match the convention rather than inventing one)

## Read-set

- `tests/oracle/svg-conformance/routing-conformance.test.ts` — **read the whole
  file.** It already solves fixture collection, golden reading, the two-tree
  (`dot-cache` / `goldens`) layout, and jar-error classification. Reuse its
  approach; do not rebuild it, and do not import private internals if that
  means modifying it — this task's write-set does not include it
- `tests/helpers/fixture-include-store.ts` — the include store is **part of the
  measurement**. Rendering without one makes `renderSync` throw on any
  `!include` and return an error SVG, which would read as a refusal. The
  routing gate's header documents this at length; the same reasoning applies
  here verbatim
- `src/index.ts` — how `renderSync` signals an error diagram today

## Interface contracts

The baseline entry shape is consumed by T13–T20 (the coverage tasks), which
subtract from it per engine. Minimum:

```
{ tree, type, slug, jarRendered: boolean, weErrored: boolean,
  engine: string, status: 'ok' | 'known-gap' }
```

`engine` must record **which** engine produced the error, so a coverage task
can filter to its own bucket without re-running everything.

## Architecture decisions in force

- [D7](../decisions.md#d7) — a newly-erroring fixture is a **defect**, not
  accepted baseline movement. This gate is what makes that enforceable
- The gate must **ratchet down only**, mirroring the routing gate: a fixture
  that starts erroring fails; a fixture that stops erroring passes and is
  logged `[FIXED]`

## Acceptance criteria

1. *Given* a fixture whose golden carries a rendered `data-diagram-type`,
   *when* we render it with the shared include store, *then* the gate asserts
   we did not produce an error diagram
2. *Given* a fixture whose golden is one of the jar's own error pages, *when*
   the gate runs, *then* it is classified and excluded from the defect count —
   the jar failing is not evidence about us
3. *Given* a fixture on disk in no baseline entry, *when* the gate runs, *then*
   it **fails** — an unmeasured corpus is how the original 86 misroutes
   survived
4. *Given* the tree as it stands today, *when* the gate runs, *then* the
   our-error/jar-rendered count is 0 and is pinned as the baseline
5. *Given* a fixture that stops erroring, *when* the gate runs, *then* it
   passes and logs `[FIXED]` — a fall must never fail

## Observability

This task **is** SLI 2's instrument. No other SLI to instrument.

## Rollback

Reversible — a new test file and its baseline; revert the commit.

## Quality bar

All four gates green: `npm test` (coverage ≥ 90/90/90), `npm run typecheck`,
`npm run lint`, `npm run build`. Report the measured baseline count in the
commit body and in `decision-journal.md`.

## Boundaries

- **Always:** reuse the routing gate's fixture-collection approach; treat the
  include store as part of the measurement
- **Ask first:** modifying `routing-conformance.test.ts` — it is outside this
  write-set and is a committed measuring instrument
- **Never:** run Prettier; pin a fixture as `known-gap` at this stage (nothing
  should be gapping yet — a non-zero baseline is a finding to report, not a
  pin to write)

## Commit

`test(T0): add refusal-coverage gate for strict-parse work`
