# T1 — Split `renderer.ts` to make headroom

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. This mission adds exo-arrow rendering
and decorated arrow heads to the sequence renderer, both of which grow
`src/diagrams/sequence/renderer.ts` — currently **595 lines**, already over the
project's 500-line cap. The complexity hook is a directional ratchet: over-cap
files may stay, but may not grow. Any later task that adds to `renderer.ts`
will be **blocked mid-flight** unless this lands first.

## Task

Split `renderer.ts` into `renderer.ts` and a new
`src/diagrams/sequence/renderer-message.ts` carrying the message-drawing path
(the `case 'message'` arm at `:489` and the functions it reaches, including the
`arrowConfigurationFor` / `applyMessageDecorations` call at `:279`).

This is a **pure move**. Do not rename anything, do not simplify a branch, do
not "tidy" a function on the way past. Redundant-looking branches handle corpus
cases that surface months later.

Aim for both files comfortably under 500 lines — not 499.

## Write-set

- `src/diagrams/sequence/renderer.ts`
- `src/diagrams/sequence/renderer-message.ts` (new)

Do **not** write `docs/catalog.md` — the orchestrator regenerates it at batch
close.

## Read-set

- `src/diagrams/sequence/renderer.ts` — whole file
- `src/diagrams/sequence/renderer-arrowhead.ts:420-460` — the two comments
  about `MessageStyle` and CIRCLE; leave them alone here, T6 deletes them
- `../decisions.md#d1` — why the message path is the natural seam

## Architecture decisions in force

D1 (locked): `MessageStyle` is being replaced by `ArrowConfiguration` in T6.
Cut the file so the message path — the only reader of `msg.style` in this
file — lands whole in `renderer-message.ts`. That makes T6 a single-file edit
rather than a two-file one.

## Interface contracts

Consumed by T6, T16, T17. `renderer-message.ts` must export the message-drawing
entry point the `case 'message':` dispatch calls, named as it was named before
the move. Do not introduce a new abstraction boundary — the export list is the
seam.

## Acceptance criteria

- Given the sequence corpus, when the ratchet runs, then **zero fixtures rise
  and zero fall**.
- Given `refusal-coverage.test.ts` and `routing-conformance.test.ts`, when run,
  then the SLI counts are unchanged (163 and 195).
- Given `wc -l` on both files, when measured, then each is under 500.
- Given `git diff`, when reviewed, then every moved line is byte-identical to
  its original except for import statements.

## Observability

N/A — no new observable operations. The batch gate is the ratchet's
zero-movement assertion.

## Rollback

**Reversible.** Pure code move; revert the commit.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` — all four
green before finishing. Read the ratchet output with `--reporter=verbose`;
vitest hides `console.log` from passing tests in redirected output, so a silent
run is not evidence of a silent gate.

## Boundaries

- **Always**: preserve upstream-derived names exactly; keep every branch.
- **Never**: change behavior, change an export's name, touch `ast.ts`, or edit
  `docs/catalog.md`.
- **Ask first**: if the file cannot be cut below 500 without splitting a
  function, journal the proposed cut before making it.

## Commit

`refactor(T1): split renderer.ts to make headroom for exo rendering`

Body required (>3 files is not the trigger here — the trigger is that a
reviewer needs to know this is a pure move gated on zero ratchet movement).
