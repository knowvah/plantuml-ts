# T2 — wire it: bands + edge suffix + retire the `:P` mechanism

**One commit. Four files. Deliberately.** See
[the batch overview](overview.md#why-t2-is-one-commit-and-not-three) for why
no subset is coherent; confirmed with the maintainer 2026-08-12.

## Prior observations

- `.agent-notes/T8-member-ports-wrong-mechanism.md` — the mechanism you are
  retiring, with its detection site and the test that asserts it.
- `tests/unit/class/layout.test.ts:168-179` asserts `isPort === true` for a
  `::member` target. That assertion encodes the **wrong** behavior; it is in
  your write-set and must be replaced, with a comment saying why.
- Upstream emits the port suffix on an edge whose target declares **no**
  matching row — `bicabi-42-coto932`, three edges, zero `PORT=` in the file
  (ADR-3). Do not add a guard against it.

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is canonical. The emission half already exists from
object-close B1 (`DotInputNode.portRows`, `rowPortTable`, `edgeRef`); the
class engine simply never feeds it.

The maintainer ruled the **shared emitters IN scope** for this mission. If
you change `edgeRef` or `rowPortTable`, the change is cross-type — run all
five DOT gates and all three censuses in the same pass.

## Task

Three coupled changes, one commit:

1. **Bands.** `applyShapeAndPorts` sets `node.portRows = classPortRows(...)`
   for a class-family leaf when `getPortShortNames().size() > 0` — ADR-4's
   gate, identical to `EntityImageObject`'s
   (`svek/image/EntityImageClass.java:255-259`).
2. **Edge suffix.** Populate the edge's port endpoint with
   `Ports.encodePortNameToId(shortName)` for `::member` relationships,
   unconditionally (ADR-3), except where ADR-2's
   `getEntityPosition().usePortP()` says `:P`.
3. **Retire `:P` for member ports.** `shieldedClassifierIds` must stop
   marking `isPort: true` for `fromPort`/`toPort` on a class-family leaf.
   Qualifiers keep their existing `false` marking — do not disturb them.

Mind the precedence in `edgeRef` (`src/core/svek-dot-emit.ts:132-147`): the
`isPort` branch is tested **before** the `portRows` branch, so a node still
carrying `isPort` will keep winning `:P` no matter what bands you attach.
That ordering is why change 3 is not optional.

## Write-set

- `src/diagrams/class/class-port-rows.ts` (`applyShapeAndPorts` only)
- `src/diagrams/class/class-dot-graph.ts`
- `src/diagrams/class/class-layout-helpers.ts`
- `tests/unit/class/layout.test.ts`

## Read-set

- `~/git/plantuml/.../abel/Link.java:219-231` — `getEntityPort`, the
  `usePortP()` branch.
- `~/git/plantuml/.../cucadiagram/EntityPort.java:50-62`
- `~/git/plantuml/.../svek/image/EntityImageClass.java:255-259`
- `src/core/svek-dot-emit.ts:126-147` — `edgeRef` and its precedence.
- `src/core/abel/EntityBase.ts:332-340` — the ported `getEntityPosition`.
- `src/diagrams/class/class-layout-helpers.ts:113-127` —
  `shieldedClassifierIds`.
- `src/diagrams/class/class-dot-graph.ts:159-210` — the edge builder.
- `test-results/dot-cache/class/bicabi-42-coto932/svek-1.dot` — the
  dangling-port control.

## Architecture decisions in force

ADR-2, ADR-3, ADR-4 — all three are load-bearing here, and all three
forbid a "tidier" implementation.

## Interface contracts

Consumes `classPortRows` from [T1](T1-class-port-band-producer.md).
Produces no new contract; it fills `DotInputNode.portRows` and the edge's
existing `tailport`/`headport`, both already defined in
`src/core/graph-layout.types.ts`.

## Acceptance criteria

- Given a `::member` relationship on a leaf whose `usePortP()` is false,
  when DOT is emitted, then the endpoint is `sh:p<md5>` and the node is
  `shape=plaintext` carrying member `<TR PORT=…>` rows.
- Given a PORTIN/PORTOUT leaf, then its endpoint is still `:P` — ADR-2's
  discriminator, and description's entry/exit points must not regress.
- Given `bicabi-42-coto932`, then three edges carry `:p<md5>` while the node
  emits a single filler `<TR>` and **no** `PORT=` (ADR-3 + ADR-4).
- Given `tests/unit/class/layout.test.ts`, then the `::member` case asserts
  the new mechanism and carries a comment citing why the old assertion was
  wrong.
- Given all five DOT gates and all three SVG censuses, then nothing moves
  **except** class `portOk` failures shrinking.

## Observability requirements

N/A as instrumentation — but this task's *measurement* obligation is the
heaviest in the mission: five DOT gates plus three censuses, in this task's
own pass, because the shared emitters are in scope. Record every number in
the journal, including the ones that did not move.

## Rollback

**Reversible.** Single commit, no data migration. Note in the commit body
that reverting restores the `:P` mechanism wholesale.

## Quality bar

TDD. Four gates green, unpiped. Every constant cites upstream
`file:line`. If a fixture improves for a reason you cannot name, that is
not a win to bank — find the mechanism first.

## Boundaries

- **Always:** run the cross-type gates in this pass; keep ADR-3's
  unconditional suffix.
- **Ask first:** changing `edgeRef`'s branch ORDER (as opposed to its
  behavior) — it serves object/map/json and description too.
- **Never:** guard the suffix on row existence; invent a port predicate
  instead of `usePortP()`; touch qualifier marking; `git checkout/reset/
  stash/clean`.

## Commit format

```
fix(T2): anchor class ::member edges to the member row
```
