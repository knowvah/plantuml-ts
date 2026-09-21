# T16 — `groupInheritance` sametail suppression + shared triangle

**Agent:** typescript-pro (sonnet) · **Depends on:** T15

## Context

With `skinparam groupInheritance N` and N-or-more extends-like links sharing
a tail, `DotData#removeIrrelevantSametail` keeps their `sametail` and
attaches a `Neighborhood` to the parent leaf (`dot/DotData.java:122-161`).
Two consequences follow and this port implements NEITHER:
1. `Link#getType()` returns `new LinkType(LinkDecor.NONE, LinkDecor.NONE)`
   whenever `getSametail() != null` (`abel/Link.java:238-239`), using
   `LinkStyle.NORMAL()` (`decoration/LinkType.java:71-72`) — every grouped
   edge in the jar is a bare, solid `<path>`, no polygon, no dash.
2. `GeneralImageBuilder` wraps the parent in `EntityImageProtected(…, 20,
   neighborhood, …)` (`svek/GeneralImageBuilder.java:110-114`,
   `EntityImageProtected.java:87-90`), whose `drawUntranslated` calls
   `Neighborhood#drawU` — ONE shared triangle (`drawExtends`: `UPolygon`
   (0,0),(7,20),(-7,20) rotated to each contact) plus a connecting stub line
   per child (`dot/Neighborhood.java:69-121`), drawn in the ENTITY group,
   not the link group.
This port emits the `sametail` DOT attribute and inflates the parent node by
the 20px border (`class-dot-graph.ts:226-252` `protectedIds`/
`sametailByRelIndex`, `:260-261` `protectedPad` — the only consumer) but
still draws a per-edge triangle and never draws the shared one
(`diagnosis/A2a-link-groups.md` M7; `diagnosis/A2b-entity-groups.md` E11).
The report is a lead: re-read `Link.java:238-239` and `Neighborhood.java`
before editing — this is the exact line that makes the jar's grouped edges
bare.

## Task

1. Tests first: `class-edge-geo.test.ts` case asserting a grouped link's
   decor is suppressed (`sourceDecor`/`targetDecor = 'none'`, `dashed =
   false`) when `sametailByRelIndex` marks it; `renderer-group.test.ts` case
   asserting exactly one shared triangle + stub lines appear in the parent
   entity group for `lazeju-60-boki114`.
2. **Piece (a) — suppression.** Thread `sametailByRelIndex`
   (`class-dot-graph.ts:226-252`) into `class-edge-geo.ts`; force
   `sourceDecor`/`targetDecor = 'none'` and `dashed = false` for a grouped
   link, mirroring `Link.java:238-239`. This alone closes every link-group
   child-count diff in the reach list. Do not touch T15's `kalBox` field —
   a qualified end and a grouped-inheritance end are independent.
3. **Piece (b) — shared triangle.** New `Neighborhood`-equivalent drawable
   (new function in `renderer-group.ts`, or a small new module if it stays
   under the 500-line cap on `renderer-group.ts` — check current line count
   first) that:
   - Runs AFTER edge geo (needs each grouped edge's start contact point).
   - Draws one `UPolygon`-equivalent triangle `(0,0),(7,20),(-7,20)` rotated
     to the parent's contact angle, plus one stub line per child, emitted
     into the parent's `<g class="entity">`.
4. Verify `pijiju-95-xexi872`'s dotted `implements` links: confirm their
   dasharray diffs vanish once decor/dash suppression lands (the report
   attributes this fixture's dasharray diffs to the SAME mechanism as its
   child-count diffs).
5. `.agent-notes/cdd-T16.md`: whether piece (a) and (b) landed as one commit
   or needed splitting; the triangle's rotation-angle formula source.

## Read-set

Java: `dot/DotData.java:122-161`; `abel/Link.java:238-239`;
`decoration/LinkType.java:71-72`; `svek/GeneralImageBuilder.java:110-114`;
`svek/EntityImageProtected.java:87-90`; `dot/Neighborhood.java:69-121`
(`drawU` + `drawExtends`). TS: `src/diagrams/class/class-dot-graph.ts:
226-261`; `src/diagrams/class/class-dot-edges.ts:160-170`;
`src/core/graph-layout-build-edges.ts:90-105`;
`src/diagrams/class/class-edge-geo.ts` (whole, insertion point for
suppression); `src/diagrams/class/renderer-edge.ts`,
`src/diagrams/class/renderer-arrowhead.ts` (current per-edge triangle
emission, to confirm it must NOT fire for a grouped edge);
`src/diagrams/class/renderer-group.ts` (entity-group emission, insertion
point for the shared triangle). Diagnosis: `diagnosis/A2a-link-groups.md`
M7 (whole section); `diagnosis/A2b-entity-groups.md` E11 (whole section).

## Write-set

`src/diagrams/class/class-edge-geo.ts`, `src/diagrams/class/renderer-
edge.ts`, `src/diagrams/class/renderer-group.ts`, their `*.test.ts` files,
`.agent-notes/cdd-T16.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface in (from T15)

`class-edge-geo.ts`'s per-edge geo record's `kalBox` field — read-only,
must not be cleared by the sametail suppression path.

## Acceptance criteria

- Given `lazeju-60-boki114`, when rendered, then every one of its 7 grouped
  links is a bare solid `<path>` with no polygon, and exactly one shared
  triangle + stub lines exist in the parent entity group
- Given `mefike-75-vova900` / `xifuza-00-paze682`, when rendered, then each
  is conformant or its residual is named with a mechanism
- Given `pijiju-95-xexi872`, when rendered, then its dasharray diffs are
  gone (suppression covers dash, not only decor)
- Given `jakapi-64-tine258`, when rendered, then it is conformant or its
  residual is named with a mechanism

## Observability

N/A — no new observable operations; render/layout fix only.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`npx tsx tools/render-diff.mts lazeju-60-boki114 mefike-75-vova900 xifuza-
00-paze682 pijiju-95-xexi872 jakapi-64-tine258` before/after with
structural+numeric counts in the commit body. Files ≤500 lines, functions
≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: verify the triangle lands in the ENTITY group, not the link group
(E11's explicit distinction). Ask first: any stop condition in
`../README.md`; if `renderer-group.ts` would exceed 500 lines, ask whether
to split into a new module before writing past the cap. Never: touch T15's
`class-kal.ts` or its qualifier-box logic; fit a rotation-angle constant
without the `Neighborhood.java` citation; edit outside the write-set.

## Commit

`feat(cdd-T16): suppress grouped-link decor/dash and draw the shared triangle`

Body: why — M7/E11 are two consequences of one upstream mechanism
(`sametail`), split across the link group (decor/dash) and the entity group
(triangle); note which of `mefike`/`xifuza`/`jakapi` landed exact vs.
residual.
