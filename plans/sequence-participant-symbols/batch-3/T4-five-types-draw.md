# T4 — Dispatch the five missing types to the seam

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is the spec.
**Open the method body.** Sequence pixels come from `sequencediagram/teoz/`.

`renderer.ts:137-185` special-cases only `actor` and `database`.
`collections`, `queue`, `entity`, `boundary` and `control` fall through to the
default participant box — they are parsed and typed correctly and then drawn
wrong. Upstream dispatches all of them in `skin/rose/Rose.java:137-190`.

Read `../README.md` and `../decisions.md` first; D1 and D2 govern.

## Task

1. Read `Rose.java:137-190` and note which `ComponentRose*` class each
   `*_HEAD` maps to, and which are `ComponentRoseGeneric`-style wrappers over
   a `USymbol` versus their own class.
2. Extend the head and footer dispatch in `renderer.ts` to route all five
   through T1's `renderParticipantSymbol`, passing the correct `head` boolean.
3. Keep the default participant box for `type: 'participant'` — that one is
   correct today (`PARTICIPANT_HEAD` → `ComponentRoseParticipant`).

Do NOT change sizing — that is T5, running in parallel. Do NOT touch `actor`
(D4, T6).

## Write-set (exhaustive)

- `src/diagrams/sequence/renderer.ts`
- `src/diagrams/sequence/renderer-participant-shapes.ts`
- `tests/unit/sequence/renderer.test.ts`

## Read-set

- `src/diagrams/sequence/renderer.ts:137-185`
- `src/diagrams/sequence/renderer-participant-symbol.ts` — T1's contract
- `~/git/plantuml/.../skin/rose/Rose.java:137-190`
- `src/core/decoration/symbol/USymbolCollections.ts`, `USymbolQueue.ts`,
  `USymbolEntityDomain.ts`, `USymbolBoundary.ts`, `USymbolControl.ts`
- `planning/usymbol-composition.md` — the COLLECTIONS / QUEUE / CONTROL /
  BOUNDARY / ENTITY_DOMAIN rows. Note it audits description-leaf SIZING, so
  treat it as prior art, not as this task's answer.

## Interface contract

Consumes T1's `renderParticipantSymbol`. No new exports.

## Acceptance criteria

- Given a `collections` participant, then its head emits the
  `USymbolCollections` geometry, not a plain `<rect>` box.
- Given each of `queue`, `entity`, `boundary`, `control` likewise, then each
  emits its own symbol and no two produce identical output.
- Given a `participant` (plain), then output is byte-identical to before this
  task.
- Given a footer box for any of the five, then it renders with `head: false`.
- 90/90/90 on the changed lines.

## Observability

Moves rendered output on ~43 fixtures. The orchestrator adjudicates at the
batch gate; do not run it yourself and do not read raw `diffCount`.

## Rollback

**Reversible.** Renderer-only.

## Quality bar

The four gates exit 0. `renderer.ts` must stay **under 500 lines**. No
Prettier. `npm test` is RED at baseline with exactly three sequence-ratchet
failures; never re-pin.

## Commit

`feat(T4): draw collections, queue, entity, boundary and control heads`
