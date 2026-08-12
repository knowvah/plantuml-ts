# T2 — wire it: object bands + edge suffix + retire `:P` for objects

**One commit. Deliberately.** See
[the batch overview](overview.md#why-t2-is-one-commit-and-not-three) for why
no subset is coherent.

## Prior observations — established, do NOT re-derive

- SI17's T2 did exactly this for the class family and is the model. Read
  `plans/si17-class-row-ports/ledger.md` and the T2 entry in that mission's
  `decision-journal.md`.
- `memberPortIsP` returns `true` (keep `:P`) for every non-`LIKE_CLASS_KINDS`
  leaf. That was SI17's deliberate narrow scoping, not an oversight — object
  was left because it needed its own producer, which is now T1.
- SI17's B1 fixed `edgeRef` so `:h` is gated on the qualifier test rather
  than on `shape === 'plaintext'`, but **only for `portRows`-bearing nodes**.
  An object node that gains `portRows` therefore takes the already-correct
  path. Do not re-open `edgeRef`.

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is canonical. The emission half already exists
(`DotInputNode.portRows`, `rowPortTable`, `edgeRef`); the object path simply
never feeds it.

The shared emitters are IN scope for this mission, so if you change `edgeRef`
or `rowPortTable` the change is cross-type — but you should not need to.

## Task — three coupled changes, one commit

1. **Bands.** `classPortShortNamesById` (`class-port-rows.ts`) stops skipping
   object leaves, and `applyShapeAndPorts` routes an object leaf to
   `classFamilyPortRows` — ADR-4's gate is the **count** of declared port
   names, identical to `EntityImageObject.java:249-253`, which is
   character-for-character the class test at `EntityImageClass.java:255-259`.
2. **Edge suffix.** Falls out of (1): the id map gains object entries, and
   `buildDotEdges` already unions `classPortShortNames.keys()` into
   `portRowIds`. Verify it does; do not add a second mechanism.
3. **Retire `:P` for objects.** `memberPortIsP` (now in
   `class-shield-helpers.ts` after S2) stops returning `true` for `object`.
   **`map`, `json` and `descriptive` keep their current behavior** — ADR-5.

## Write-set

- `src/diagrams/class/class-port-rows.ts`
- `src/diagrams/class/class-shield-helpers.ts`
- `tests/unit/class/` — the object band + `:P`-retirement tests

**`class-dot-graph.ts` is NOT in the write-set and is expected to need no
change.** Verify that explicitly. If it does need one, **STOP and report** —
it has 1 line of headroom to the blocking 500-line cap and needs its own
split task first.

## Read-set

- `~/git/plantuml/.../svek/image/EntityImageObject.java:245-270` — the shape
  gate and `getPorts`. **Method bodies.**
- `~/git/plantuml/.../abel/Link.java:219-231` — `getEntityPort`, the
  `usePortP()` branch.
- `~/git/plantuml/.../cucadiagram/EntityPort.java:50-62`
- `src/core/svek-dot-emit.ts:120-160` — `edgeRef` and its branch precedence,
  post-B1. Read it; do not change it.
- `src/diagrams/class/class-port-rows.ts` — `applyShapeAndPorts`,
  `classFamilyPortRows`, `classPortShortNamesById`.
- `src/diagrams/class/class-shield-helpers.ts` — `memberPortIsP`.
- `test-results/dot-cache/object/rozuxo-44-fudi093/svek-1.dot`

## Architecture decisions in force

ADR-3 (reuse `classPortRows`), ADR-4 (`map`/`json` OUT of scope — any
movement there is a stop), ADR-5 (`memberPortIsP` narrows to `object` only),
plus SI17's ADR-3 (the md5 suffix is emitted **unconditionally**; do not add
a "only if a matching row exists" guard) and ADR-4 (the flip is gated on port
name **count**, not election success).

## Interface contracts

Consumes `portMemberSections` from [T1](T1-publish-port-bands.md). Produces
no new contract; it fills `DotInputNode.portRows` and the existing
`tailport`/`headport`.

## Acceptance criteria

- Given `CC::USA --> users::3` (`rozuxo-44-fudi093`), then both endpoints are
  `sh:p<md5>` and both nodes are `shape=plaintext` carrying member `PORT=`
  rows matching the oracle's `(int)`-truncated geometry.
- Given ADR-5, then `map`, `json` and `descriptive` marking is **untouched**,
  and a PORTIN/PORTOUT leaf still emits `:P`.
- Given class DOT, then it stays at **710/711 with `portOk` 0**. This is the
  regression this task is most likely to cause and the highest-priority stop.
- Given `class-dot-graph.ts`, then it needs **no** change; if it does, STOP.
- Given all five DOT gates and all three censuses, then nothing moves except
  object `portOk` shrinking.

## Measurement obligation — the heaviest in this mission

Run in this task's own pass and report **every** number, including the ones
that did not move:

```sh
npx tsx scripts/dot-sync-report.ts class      # 710/711, portOk 0 -- WATCH THIS ONE
npx tsx scripts/dot-sync-report.ts object     # 77/80 -> only portOk may shrink
npx tsx scripts/dot-sync-report.ts component  # 262/262
npx tsx scripts/dot-sync-report.ts usecase    # 93/93
npx tsx scripts/dot-sync-report.ts state      # 267/267
npx tsx scripts/svg-conformance-census.ts class             # 343/722, non-dropping
npx tsx scripts/svg-conformance-census.ts object            # 35/80, non-dropping
npx tsx scripts/svg-conformance-census.ts component usecase # 26/358, non-dropping
```

Read each census from its `DeterministicMeasurer` section, **never** with
`tail`.

A fixture that improves for a reason you cannot name is not a win to bank —
find the mechanism first.

## Observability requirements

N/A as instrumentation. This task's *measurement* obligation is above and is
non-negotiable.

## Rollback

**Reversible.** Single commit, no data migration. Note in the commit body
that reverting restores the `:P` mechanism for objects.

## Quality bar

TDD. Four gates green, unpiped. Every constant cites upstream `file:line`.
Complexity caps are hook-enforced and will BLOCK the write: file ≤500 lines,
function ≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

- **Always:** run the cross-type gates in this pass; keep the md5 suffix
  unconditional.
- **Ask first (STOP and report):** touching `class-dot-graph.ts`; changing
  `edgeRef`'s branch order or behavior; any file outside the write-set.
- **Never:** guard the suffix on row existence; invent a port predicate
  instead of the `usePortP()` derivation; touch `map`/`json`/`descriptive`
  marking; run any state-mutating git command.

## Commit format

```
fix(T2): anchor object ::member edges to the member row
```
