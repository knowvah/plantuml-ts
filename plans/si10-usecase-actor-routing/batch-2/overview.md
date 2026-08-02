# Batch 2 — The class engine stops reimplementing the decision

One task. Depends on T1's exported entry point.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Route class-engine usecase/actor to the faithful entry point; thread `sprites` | typescript-pro | `src/diagrams/class/class-layout-leaf-shapes.ts`, `src/diagrams/class/class-layout-helpers.ts`, `tests/unit/class/class-usecase-actor-routing.test.ts` | T1 | [x] |

## The two changes, and why the second is not scope creep

1. `measureUsecaseOrActor` calls T1's entry point instead of
   `measureUsecase`/`measureActor`.
2. **`sprites` is threaded in.** It is already in scope at
   `class-layout-helpers.ts:286` — the line immediately above passes it to
   `measureObjectClassifier` — and simply is not forwarded. Class-diagram
   usecases are therefore sized today with no sprite awareness at all.
   Maintainer-approved as scope item 3 on 2026-08-01.

Zero of the 310 class goldens contain a sprite, so threading it cannot move
an existing golden — which is exactly why T3 has to author one.

## Batch exit criteria

- All quality gates green, **`widened` still 0**
- 395 svg goldens byte-identical — including all 312 class goldens
- `measureUsecaseOrActor` no longer imports `measureUsecase`/`measureActor`
- The new unit test pins routing for BOTH reachable entries (`actor` in a
  plain class diagram, and `usecase` under `allowmixing`)
