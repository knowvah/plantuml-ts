# T1b — our error-page signal (D7)

## Context
The survey must know whether OUR render is an error page from our own render
path, never by sniffing SVG text. `renderSync` returns a string; the
established seam for harness-only observation is a module-level observer
(`src/core/graph-layout.ts:56-70`, `setLayoutInputObserver`, read by
`scripts/svg-parity-survey.ts:276-292`).

## Task
Add `setErrorPageObserver(fn: (() => void) | undefined): void` to
`src/core/error/error-renderer.ts`. Fire it once from `renderPSystemError`
(`error-renderer.ts:56`) — the single draw point for every `PSystemError`
page (`errorSvg`, `emptySvg`, preprocessor, crash). Never from
`renderPSystemWelcome` (`:81`) or `renderPSystemUnsupported` (`:75`) — those
are not upstream `PSystemError`s. Carry the same concurrency comment as
`graph-layout.ts:56`. Do NOT export it from `src/index.ts` (public API
unchanged — stop 11). TDD first.

## Write-set
`src/core/error/error-renderer.ts`,
`tests/unit/core/error/aepp-T1b-error-page-observer.test.ts`.

## Read-set
`src/core/error/error-renderer.ts`; `src/core/graph-layout.ts:50-75`;
`src/core/error/error-diagrams.ts:60-140`; `src/index.ts:395-490` (the
`errorSvg`/`emptySvg`/`welcomeSvg` call sites).

## Interface (consumed by T2a)
`export function setErrorPageObserver(fn: (() => void) | undefined): void`
from `src/core/error/error-renderer.ts`.

## Acceptance
- Given a syntax-error source, when `renderSync` runs with an observer set,
  then it fires exactly once.
- Given an empty `@startuml/@enduml` with one blank line (Empty description),
  then it fires once; given the two-line Welcome source, then never.
- Given a valid activity diagram, then never; given `undefined` set, then no call.
- Given every engine, then `survey-all.sh` before/after shows 0 movers
  (common rule 10 — this is a `src/core` edit).

## Observability
N/A — the observer IS the instrument; no production behaviour change.

## Rollback
Reversible.
