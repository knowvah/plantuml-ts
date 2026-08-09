# T7 — real record ports: `P<n>` labels and `tailport`

**Depends on T6.** Writes the same file, so it never runs beside it.

## Context

Upstream pins each edge to the exact row it leaves from, using graphviz's own
record-port machinery: nodes are `shape=record` whose label is built from
`<P0>|<P1>|…` cells, and each edge carries `tailport="P<num>"`.

This port approximates that with a **fractional** `tailportY`
(`layout.ts:283-296`) — a normalized offset down the parent's edge. An
approximation of a port is not a port: graphviz routes differently when it
knows which record cell an edge originates from.

## Task

Replace the `tailportY` approximation with real record ports.

1. Emit record labels mirroring `getDotLabelArray` / `getDotLabelMap`
   (`SmetanaForJson:265-297`), including the `_dim_<height>_<width>_`
   placeholder cells and the `{…|{…}}` nesting the map form uses.
2. Set the edge attributes upstream sets (`:217-230`): `tailport="P<num>"`,
   `arrowsize=".75"`, `arrowhead="normal"`, `arrowtail="none"`.
3. Retire `tailportY` and its computation once the ports carry the behaviour.

Note the placeholder cells encode geometry as *label text*. That is upstream's
mechanism, and it is load-bearing: the widths are `colAwidth - 8` /
`colBwidth - 8`. Port the arithmetic, do not re-derive it.

## Read-set

- `~/.../jsondiagram/SmetanaForJson.java:217-230` (edges), `:265-297` (labels)
- `src/diagrams/json/layout.ts:276-360` — the current `tailportY` computation
  and edge construction
- `src/diagrams/json/json-layout-prep.ts` — row heights and column widths, the
  inputs to the label
- `src/diagrams/class/class-dot-graph.ts` — **this port already builds record /
  HTML-table nodes with ports for the class engine (mission A2).** Read it
  before writing new port plumbing; the seam may already do what you need.
- `src/core/graph-layout-build.ts#addNodes` — how labels and ports reach the
  engine

## Write-set

- `src/diagrams/json/layout.ts`
- `src/diagrams/json/json-layout-prep.ts`
- `tests/unit/json/**`

## Architecture decisions (locked)

- **ADR-1:** real ports, not a refined approximation. If ports prove
  unreachable through the current seam, **stop and log** — do not reintroduce a
  fractional offset under a new name.
- **ADR-5:** keep upstream's `P<n>` naming in the emitted DOT.

## Interface contracts

The DOT handed to `layoutGraph` per node:

```
shape=record
height=<measured WIDTH / 72>   width=<measured HEIGHT / 72>   (the T6 swap)
label=<P0>_dim_h_w_|<P1>_dim_h_w_|…        (array form)
label={_dim_H_wA_|{<P0>_dim_h_wB_|…}}      (map form)
```

per edge: `tailport="P<n>" arrowsize=".75" arrowhead="normal" arrowtail="none"`.

`JsonGeometry` stays unchanged for consumers, except that `JsonEdgeGeo` loses
`tailportY`. That removal is the one permitted contract change; `renderJson`
consumes it in T8.

## Acceptance criteria

1. **Given** a map-shaped json fixture, **when** the graph is built, **then**
   each node's label matches the `{_dim_…_|{<P0>…}}` form, asserted against a
   literal expected string.
2. **Given** an array-shaped fixture, **then** the label matches the flat
   `<P0>…|<P1>…` form.
3. **Given** any child edge, **when** the graph is built, **then** it carries
   `tailport="P<n>"` naming the row index it leaves from.
4. **Given** the whole corpus, **when** re-measured, **then** edge-spline
   geometry is closer to the jar than after T6; report the delta.
5. **Given** the codebase, **when** the task ends, **then** no `tailportY`
   remains — grep is clean, including its type declaration.
6. **Given** yaml and hcl, **then** both re-measured and reported.

## Observability requirements

N/A.

## Rollback

**Reversible.** Layout-internal change; revert the commit. `JsonEdgeGeo` drops
a field, so T8 must land with or after it — sequenced in the same batch.

## Quality bar

- Four gates green, exit codes captured directly.
- Port the `- 8` column arithmetic from the Java verbatim, with a `@see`. Do not
  substitute a value that "looks right" on one fixture.
- 90/90/90 coverage holds.

## Boundaries

- **Never:** modify `src/core/graph-layout.ts`.
- **Never:** run `git commit` or any state-mutating git command.
- **Ask first:** if real ports require a change to
  `src/core/graph-layout-build.ts` — that file is shared with the class engine
  and a change there has blast radius beyond this mission.
