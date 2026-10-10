# T1c — swimlane-after-start refusal + kedozi crash (D2)

## Context
Under the error-page rule we need not match the jar's error text, but we
must ERROR where the jar errors (stock-verified). Two rows draw instead, and
one errors only by crashing:
- nakavu-98-pela661 (jar: line 5) and velodu-59-sada437 (jar: line 3) — a
  swimlane declared after the first instruction.
- kedozi-45-begu156 — `switch (any2)` followed by `:Charged;` before any
  `case`; ours throws `TypeError: Cannot read properties of undefined
  (reading 'kind')`.

Upstream (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/`):
- `activitydiagram3/ActivityDiagram3.java:80-95` — `manageSwimlaneStrategy()`
  sets `SWIMLANE_FORBIDDEN` when an instruction is added while the strategy is
  still null; `swimlane(...)` then returns
  `CommandExecutionResult.error("This swimlane must be defined at the start of the diagram.")`.
  Find every caller of `manageSwimlaneStrategy` and quote them — that list is
  the set of "first instruction" events to mirror.
- `activitydiagram3/InstructionSwitch.java:97-101` — `add(ins)` with
  `current == null` returns `error("No 'case' in this switch")`.

## Task
TDD. Return an `'execution'` `ParseRefusal` (`src/core/parse-refusal.ts`) at
the offending line in both cases. Find the kedozi `TypeError`'s origin and
replace the crash with the refusal at that origin (diagnosis artifact in the
report: mechanism, origin `file:line`, causal chain, ruled out). The
swimlane strategy state lives on `ParseContext` (`dispatch-support.ts:420`,
initialised in `parser.ts:98-112`), set where upstream calls
`manageSwimlaneStrategy`, checked at `setCurrentSwimlane`'s caller
(`node-dispatch.ts:74`).

## Write-set
`src/diagrams/activity/node-dispatch.ts`, `src/diagrams/activity/dispatch-support.ts`,
`src/diagrams/activity/parser.ts`, `src/diagrams/activity/switch-dispatch.ts`,
`tests/unit/activity/aepp-T1c-refusals.test.ts`.

## Read-set
`src/core/parse-refusal.ts:1-110`; `src/diagrams/activity/parser.ts:84-125`;
`src/diagrams/activity/dispatch-support.ts:400-518`;
`src/diagrams/activity/node-dispatch.ts:60-80,430-480`;
`src/diagrams/activity/switch-dispatch.ts:27-120`; the three `in.puml`
under `test-results/dot-cache/activity/<slug>/`.

## Acceptance
- Given nakavu or velodu, when rendered, then we draw an error page (not a diagram).
- Given kedozi, when parsed, then a `ParseRefusal` returns and nothing throws.
- Given a diagram whose swimlanes are all declared before the first
  instruction (e.g. zezaju's lines 1-5), then no refusal.
- Given the 433 conformant + all pinned activity fixtures, when
  `activity.golden.ratchet.test.ts` and the diff-baseline test run, then all
  are byte-identical (stop 7 otherwise).
- Given the routing/refusal baselines, then green (a refusal can move routing;
  if it does, report the slugs — the orchestrator re-pins).

## Observability
N/A — no new observable operations.

## Rollback
Reversible.
