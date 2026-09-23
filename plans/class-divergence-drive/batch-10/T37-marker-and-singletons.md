# T37 — mid-path marker offset + the named singletons

**Agent:** debugger · **Depends on:** T35 (shares the canvas/ink-walk
area T35 touches; sequencing avoids two agents in the same math).

## Context

A5 M8 (marker offset, LOW confidence) plus eight independent
Unclassified singletons — each ends this task FIXED or FILED with a
mechanism (push-forward: file a `next-missions.md` follow-on once the
diagnosis artifact names the mechanism and the fix is separable and
larger than this task). Do not chase all nine to a fix if any proves
genuinely large — naming the mechanism correctly is the deliverable,
per `diagnosis.md`.

**M8 marker offset.** `bitove-03-sanu160`'s association-label triangle
has identical y (89.985/91.995/97.075) and a uniform x shift of 0.58;
`class-inheritance-interface-assoc` shows the same signature at 0.804 —
a pure-x shift cannot come from sliding along a diagonal spline (that
would move y too), so the anchor is not a point on the curve.
`gobuco-16-ruke239` (0.23), `lojepe-37-liri985` (0.636),
`lapoma-04-vaga142` (0.23), `dorelu-66-lixu637` (6.545) move the
triangle AND the adjacent `text/@x` together — a different,
label-anchor sub-mechanism. Read `svek/SvekEdge.java`'s `linkArrow`/
`LinkArrow` draw block (~`:900-1000`) and `klimt/shape/
DotPath.java:154-180` (`getMiddle`) against `src/diagrams/class/
class-magic-arrow.ts:172-252` (`magicArrowAngle`/`magicArrowGlyphPoints`/
`arrowPoint`) and `src/diagrams/class/class-edge-label-anchor.ts:
226-320` (`portLabelAnchor`/`attachPortLabels`).

**The eight singletons**, each a distinct mechanism (A5 Unclassified):
- `dorafa-63-soba922` (`skinparam sameClassWidth true` — every node
  keeps its own width; find the upstream key and its `SvekNode`
  width-equalization pass, unported here)
- `pixexi-81-sete111` (`skinparam package BorderThickness 4` shifts the
  cluster outline by 5.389 — a stroke-inset question in the cluster
  path builder)
- `medosa-71-ligu412` (two class separator `<line>`s end at different
  y2 — jar 114.79/114.79, ours 111.549/118.035 — the jar equalises
  them)
- `kupetu-36-kive480` (Δ0.011 on one `@d` coordinate — one hundredth
  over the 0.01 tolerance band; check the retired `bipudo-23` lesson in
  `oracle/accepted-divergences.json` before treating this as a real
  gap rather than a serialization-precision artifact)
- `konomi-00-gico141` (Δ0.315 on one `text/@y`)
- `sacacu-34-dobo091` (Δ0.369, an edge label with `\n` and leading
  spaces — `" Brunette Coleman was a pseudonym \n used by..."`)
- `boseba-99-zopo693` / `majuva-44-luta965` (a single edge takes a
  completely different route — jar draws a straight `M321.99,59
  C…380.67,59`, ours a wide arc; both also carry 681/114 numeric diffs,
  i.e. node placement already differs, so PROVE or DISPROVE this is a
  layout-ordering consequence rather than an edge-drawing bug before
  spending time on the spline itself — if it traces into `@knowvah/
  dot-engine`'s own layout, that is stop 8, file and move on)

## Task

1. Tests first for whatever gets a real fix; a filed item gets a
   `decision-journal.md` row + a `next-missions.md` line instead.
2. Instrument M8 first: dump `bitove`/`class-inheritance-interface-
   assoc`'s full point arrays (curve control points, marker anchor,
   label anchor) and confirm which of the two sub-mechanisms (marker-
   only vs. marker+label) each named fixture belongs to before touching
   either file.
3. For each of the eight singletons: instrument, state
   mechanism/origin/causal chain/ruled-out, then either fix (if narrow)
   or file (if the fix needs a file outside this task's write-set, or
   is genuinely a separate mission-sized item per the push-forward
   rule).
4. `boseba`/`majuva`: determine whether the reroute is DOWNSTREAM of the
   681/114 numeric node-placement diffs (in which case it belongs to
   whichever EARLIER batch's mechanism moved those nodes — journal
   which one, do not re-fix layout here) or is a genuine edge-drawing
   defect in THIS port. If it traces into the dot-engine's own routing,
   stop 8 (file `docs/graphviz-issues/` + `TRACKER.md`, halt only this
   item).
5. `.agent-notes/cdd-T37.md`: which of the nine ended fixed vs. filed,
   and why.

## Read-set

`src/diagrams/class/class-edge-label-anchor.ts` (whole);
`src/diagrams/class/class-magic-arrow.ts` (whole); whichever file each
singleton's diagnosis eventually names (read before editing, cite in
the journal). Java: `svek/SvekEdge.java:900-1000,1015-1077`; `klimt/
shape/DotPath.java:154-180`; `svek/SvekNode.java` (width-equalization,
for `sameClassWidth` — grep `sameClassWidth`/`SameClassWidth` first);
`svek/Cluster.java` (border-thickness inset, for `pixexi`);
`cucadiagram/entity/EntityImageClass.java` or the class separator-line
source (for `medosa` — grep the separator `<line>` emission). Diagnosis:
`diagnosis/A5-geometry.md` M8, Unclassified.

## Write-set

`src/diagrams/class/class-edge-label-anchor.ts`,
`src/diagrams/class/class-magic-arrow.ts`, plus each singleton's actual
file ONLY after its diagnosis names it (journal a stop-1
pre-authorisation request if it lands outside this batch's declared
write-sets — do not silently expand scope), their `*.test.ts` files,
`.agent-notes/cdd-T37.md`, `decision-journal.md` (append-only),
`planning/next-missions.md` (filed items, append-only),
`docs/graphviz-issues/` + `TRACKER.md` (only if `boseba`/`majuva` trace
into the dot-engine, stop 8).

## Acceptance criteria

- Given `bitove-03-sanu160` and `class-inheritance-interface-assoc`,
  when the marker-only mechanism is fixed, then both go conformant
- Given `gobuco-16-ruke239`, `lojepe-37-liri985`, `lapoma-04-vaga142`,
  `dorelu-66-lixu637`, then each is conformant or its residual is
  named with a mechanism distinct from the marker-only case
- Given each of the eight singletons, when this task ends, then
  `fixtures.md`'s row for it either shows `conformant` or names a
  mechanism and a `next-missions.md` filing (never a bare "diverged"
  with no explanation)
- Given `boseba-99-zopo693`/`majuva-44-luta965`, then the journal states
  explicitly whether the reroute is upstream-of/downstream-of the
  681/114 numeric diffs, with evidence

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the
code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all
green. `npx tsx tools/render-diff.mts` on every named fixture
before/after. Files ≤500 lines, functions ≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: produce the diagnosis artifact (mechanism/origin/causal
chain/ruled out) before any fix, for every one of the nine items — this
is diagnosis mode throughout, not a bug-fixing sprint. Ask first: any
file outside the declared write-set (stop 1); any stop condition in
`../README.md`. Never: fit `kupetu`'s 0.011 delta by nudging a constant
without re-deriving it — check the `bipudo-23` precedent first; spend
more than one diagnosis pass chasing `boseba`/`majuva` into the
dot-engine before filing (stop 8 exists exactly for this).

## Commit

`fix(cdd-T37): marker anchor + singleton residuals`

Body: why — nine independently-diagnosed items, list which were fixed
and which were filed with their `next-missions.md` line.
