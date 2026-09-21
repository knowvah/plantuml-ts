# T17 — role labels

**Agent:** typescript-pro (sonnet) · **Depends on:** T16

## Context

`User "owner"/"1" -- "0..n"/"items" Item` gives upstream both a quantifier
AND a role per end; `SvekEdge` builds `startTailText`/`endHeadText` from the
quantifiers and `startTailRoleText`/`endHeadRoleText` from the roles, and
draws all four (`svek/SvekEdge.java:329-351` builds the four text blocks,
`:1023-1030` + `drawRoleLabel` draws the role on the opposite side of the
line from its quantifier). This port parses `fromRole`/`toRole`
(`class-relationship-parser.ts:303-304`, stored at `class-relationship-
ast.ts:100-101`) and never reads them — `class-layout-edge-labels.ts:
412-425` states the gap in-source ("genuinely UNBUILT feature"), corroborated
at `class-dot-edges.ts:119` ("read nowhere in `src/` yet") (`diagnosis/
A2a-link-groups.md` M8). Upstream's fallback (`SvekEdge.java:447-466`) uses
the role IN PLACE OF the cardinality when that end has no multiplicity — a
role box is not simply additive, it can replace the quantifier box. The
report flags this as a zero-fixture-rise hazard: a new DOT label reservation
moves geometry for any fixture using bare role syntax, not only the two
named ones. The report is a lead: re-read `SvekEdge.java:329-351,447-466`
before editing.

## Task

1. Before editing: grep `test-results/dot-cache/class/*/in.puml` for the
   `"..."/"..."` role syntax to find every fixture that uses bare role
   syntax (not just the 2 named), and check each against
   `measurements/base.json` for conformant status. Journal the list in
   `.agent-notes/cdd-T17.md` — any conformant fixture in that list is a
   geometry-movement risk to watch in step 5.
2. Tests first: `class-layout-edge-labels.test.ts` case reserving a role box
   (both the additive case and the fallback-replaces-cardinality case);
   `class-edge-label-anchor.test.ts` case for the second anchor per end.
3. `class-layout-edge-labels.ts`: reserve the role box. Port the
   `SvekEdge.java:447-466` fallback — when an end has no multiplicity, the
   role occupies the cardinality's position instead of a separate slot.
4. `class-edge-label-anchor.ts` (`attachPortLabels`): compute a second
   anchor per end for the additive case, positioned opposite the quantifier
   per `SvekEdge.java:1023-1030`.
5. `class-geo-types.ts`: add the role-label geometry field(s) needed by the
   anchor/emit steps (minimal — mirror the existing quantifier-label field's
   shape).
6. `renderer-edge.ts`: emit the role `<text>`.
7. Re-render every fixture found in step 1; confirm the only movers are
   fixtures using role syntax, and that `mugobo-34-fede498`/`nenexe-35-
   zere033` (both already `diverged`) are the primary targets.
8. `.agent-notes/cdd-T17.md`: the step-1 fixture list and the step-7 mover
   confirmation.

## Read-set

Java: `svek/SvekEdge.java:329-351` (text-block construction),
`:447-466` (fallback), `:1023-1030` + `drawRoleLabel` (opposite-side
placement). TS: `src/diagrams/class/class-relationship-parser.ts:295-310`;
`src/diagrams/class/class-relationship-ast.ts:95-105`;
`src/diagrams/class/class-layout-edge-labels.ts:400-430` (the self-
documented gap) and its quantifier-reservation logic (for the pattern to
mirror); `src/diagrams/class/class-edge-label-anchor.ts` (whole,
`attachPortLabels`); `src/diagrams/class/class-geo-types.ts` (existing
label-geometry field shapes); `src/diagrams/class/class-dot-edges.ts:
110-125`; `src/diagrams/class/renderer-edge.ts` (label emission call
sites). Diagnosis: `diagnosis/A2a-link-groups.md` M8 (whole section).

## Write-set

`src/diagrams/class/class-layout-edge-labels.ts`,
`src/diagrams/class/class-edge-label-anchor.ts`,
`src/diagrams/class/class-geo-types.ts`,
`src/diagrams/class/renderer-edge.ts`, their `*.test.ts` files,
`.agent-notes/cdd-T17.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Acceptance criteria

- Given `mugobo-34-fede498`, when rendered, then the link group draws four
  `<text>` labels at the jar's positions (2 quantifiers + 2 roles)
- Given `nenexe-35-zere033`, when rendered, then the same holds
- Given an end with a role but no multiplicity, when rendered, then the
  role occupies the cardinality's position (fallback), not a duplicate slot
- Given every fixture found in step 1's grep, when re-rendered, then no
  currently-conformant fixture moves without a journaled mechanism

## Observability

N/A — no new observable operations; render/layout fix only.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`npx tsx tools/render-diff.mts mugobo-34-fede498 nenexe-35-zere033`
before/after, plus every step-1 fixture, structural+numeric counts in the
commit body. Files ≤500 lines, functions ≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: run the step-1 grep before editing (the report names this a
zero-fixture-rise hazard). Ask first: any stop condition in `../README.md`;
a conformant fixture moving because of the new label reservation. Never:
treat the role as purely additive without checking the no-multiplicity
fallback; edit outside the write-set; touch T16's `Neighborhood`/
suppression logic.

## Commit

`feat(cdd-T17): draw role labels on relationship ends`

Body: why — M8, a genuinely unbuilt feature the port already documented in
its own source comment; note the step-1 fixture list and confirm no
unjournaled movers.
