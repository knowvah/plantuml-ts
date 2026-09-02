# Batch 3 — the four text kinds

Four tasks, parallel. C1 made them write-set-disjoint by adding every shared
type up front; the geometry split the parent mission performed gives each task
its own geo module.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| C3 | message labels + autonumber | typescript-pro | `geo-message.ts`, `text-block-geo.ts`, `renderer-message.ts`, tests | C1 C2 | [x] |
| C4 | participant names + stereotypes | typescript-pro | `geo-participant.ts`, `sequence-layout-participants.ts`, `renderer-participant-shapes.ts`, tests | C1 C2 | [x] |
| C5 | frame tab, comment, `ref` body, conditions | typescript-pro | `geo-frame.ts`, `sequence-layout-events.ts` (frame fns), `renderer-frame-header.ts`, `renderer.ts` (ref+condition), tests | C1 C2 | [x] |
| C6 | notes, dividers, box labels | typescript-pro | `geo-annotation.ts`, `sequence-layout-events.ts` (note/divider fns), `renderer.ts`, tests | C1 C2 | [ ] |

## The shape every one of these has

Layout routes the kind's display through C1's producer, stores the resulting
runs on the geo, and the renderer maps them through `sequenceText`. A task that
changes a renderer without changing its layout has done half the job.

## Two shared files, exactly as the parent mission had

`sequence-layout-events.ts` is written by C5 (frame functions) and C6 (note and
divider functions); `renderer.ts` by C5 (`renderRefBody`,
`renderBranchSeparators`) and C6 (the rest). **Serialize C5 and C6 if these run
in parallel** — the parent mission's A4/A5 had the identical contention and it
was fine sequentially.

## Expect content to move, not counts

Unlike C2, these change what text SAYS, not how many elements there are —
except where a markup run splits one string into several, which is the point.
`descended` must not fall.
