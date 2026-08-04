# T2 — delete `atomsWidth` + the `tryRenderUSymbol` atom-label fallback closure

## Context

`plantuml-ts`. SI14 T5 removed the layout-time atom pre-resolution for
usecase/actor labels but kept `ClassGeometry.rows[].atomsWidth` as a
documented-dead field, because its sole reader — the `atoms`/`atomsWidth`/
`renderLabel` closure in `renderer.ts#tryRenderUSymbol` (~lines 101-107) —
was outside that task's write-set. That closure is the pre-SI14-T4 label
path, reachable only when `geo.measurer === undefined` (the real
`layoutSync` and the conformance harness always set the measurer). SI14 T5
named "delete both together" as the follow-up; this is it. ADR-3
(`plans/si15-uimage-raster-dims/decisions.md#adr-3`) is locked.

## Task

1. **Reachability proof first** (Serena `find_referencing_symbols` + grep):
   enumerate every reader/writer of `atomsWidth` and every construction of a
   usecase/actor `ClassifierGeo` in `src/` and `tests/`. Record the proof in
   your final report. If ANY production path can reach the closure, STOP and
   report — do not delete (stop condition 1 shape).
2. Delete the `atomsWidth` field + its doc comment
   (`class-geo-types.ts:78-93`), and the `atoms`/`atomsWidth`/`renderLabel`
   closure in `tryRenderUSymbol` (`renderer.ts:101-107` region).
   `tryRenderUSymbol` itself and the box-path fallback for OTHER usymbol
   kinds stay.
3. If `renderRowAtoms` thereby loses its last caller, delete it too (grep
   for references first — "looks unused" is not "is unused"). Same for any
   `atoms` row field IF AND ONLY IF the shared member-row carrier is not
   affected — SI14 T5 verified `rows[].atoms` is ALSO the member-row
   carrier (fixture `cuzoga-39-tufu259`); deleting the FIELD is out of
   scope, only the closure reading it for usecase/actor labels dies.
4. Update any hand-built test fixtures that constructed geo with
   `atomsWidth` — remove the field from the literals; if a test exercised
   the closure's output, move it to the faithful path (construct geo with a
   measurer) or delete it if it only characterised the dead branch (say
   which in the report).

## Write-set

- `src/diagrams/class/renderer.ts`
- `src/diagrams/class/class-geo-types.ts`
- `tests/**` files whose fixtures reference `atomsWidth` or the closure
  (enumerate in the report)

## Read-set

- `plans/si15-uimage-raster-dims/decisions.md#adr-3`
- `src/diagrams/class/renderer.ts:85-120, 375-405`
- `src/diagrams/class/class-geo-types.ts:70-100`
- `src/diagrams/class/class-layout-leaf-shapes.ts` (verify nothing still
  writes `atomsWidth`)

## Acceptance criteria

1. Given `grep -rn "atomsWidth" src tests`, when run after the change, then
   zero hits.
2. Given `npm test`, when run on the settled tree, then exit 0 with all
   goldens byte-identical (this task must not change any real rendering
   path).
3. Given the final report, when read, then it contains the reachability
   proof (who constructed usecase/actor geo without a measurer, and what
   happened to each).

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint` exit 0. The complexity hook
applies (`// #lizard forgives -- <reason>` near function END if needed;
never edit `complexity-ignore`).

## Boundaries

**Always:** grep before deleting; report what each deleted test covered.
**Ask first:** deleting anything beyond the closure/field/`renderRowAtoms`
chain. **Never:** git mutations; touching `src/core/` or description-engine
files (T1 owns them this batch); deleting `rows[].atoms` itself.

## Observability

N/A.

## Rollback

Reversible — revert the commit.

## Commit

`refactor(T2): delete atomsWidth and the dead pre-SI14 usecase label fallback`
