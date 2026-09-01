# Batch 2 — the four text kinds

Four tasks, **parallel**. A1 made them write-set-disjoint by adding every
shared type up front.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| A2 | message labels | typescript-pro | `text-block-geo.ts`, `renderer-message.ts`, tests | A1 | [ ] |
| A3 | participant labels and stereotypes | typescript-pro | `sequence-layout-participants.ts`, `renderer-participant-shapes.ts`, tests | A1 | [ ] |
| A4 | frame headers and conditions | typescript-pro | `renderer-frame-header.ts`, `sequence-layout-events.ts`, tests | A1 | [ ] |
| A5 | notes, dividers, newpage titles | typescript-pro | `renderer.ts`, tests | A1 | [ ] |

## The shape every one of these has

Each is a **vertical slice**, not a layer: layout measures and populates the
three metric fields, the renderer routes through `sequenceText`, and the task
re-pins its own tests. A task that changes a renderer without changing its
layout has done half the job and will fail its own criteria.

## Expect goldens to move

Unlike A1, all four of these change output — that is the point. Distance must
FALL; `text@x` and `text@y` are the attributes to watch. The ratchet goes red
here and stays red until C4 (D5); that is not a stop condition.

## Watch the cohort

`descended=714` must hold. These tasks remove attributes and add one, so a
fixture crossing the short-circuit line is possible here for the first time in
this engine's history — stop condition 7.
