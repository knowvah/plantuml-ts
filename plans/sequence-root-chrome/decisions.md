# Architecture decisions — `sequence-root-chrome`

All four were settled during planning on 2026-08-23. D2 was a maintainer
choice; D1, D3 and D4 were settled by measurement and are recorded with the
evidence so nobody re-litigates them from memory.

## D1 — content `<g>` wrap and background rect mirror `finalizeStateBody`

**Context.** `svgRoot` (`src/core/svg.ts:487-514`) supplies sequence's content
`<g>`, its arrow markers and its background rect today. `assembleDocumentShell`
supplies none of those, and `withRootGroupAttributes`
(`document-shell.ts:103-107`) only upgrades a body that is *already* a bare
`<g>`. Without a finalize step a sequence document would ship with no content
group at all.

**Decision.** Add `DIAGRAM_TYPE_SEQUENCE` + `finalizeSequenceBody` to
`src/core/assemble-svg.ts`, mirroring `finalizeStateBody` (`:196-199`) and
`maybeStateBackgroundRect` (`:186-194`) with a sequence-local default
constant. Approved by the maintainer 2026-08-23 (touching the shared file is
explicitly fine).

**Evidence** — the jar's three-way behaviour on sequence goldens, measured
this session, is identical to state's:

| Fixture | source | root `style` | content `<g>` first child |
|---|---|---|---|
| `dakake-85-nemi992` | `BackgroundColor #FF0000` | `background:#FF0000;` | `<rect x="0" y="0" width="114" height="313" fill="#F00" style="stroke:none;"/>` |
| `bakire-18-peku988` | scoped `BackgroundColor Green` | `background:#FFFFFF;` | none |
| `badoba-13-cuba151` | `backgroundcolor transparent` | *(no `background:`)* | none |

**Consequences.** Five engines now share one finalize switch, so a mistake
here is a cross-engine mistake — hence the manifest guard in T5 and the
corresponding stop condition.

## D2 — port the arrow model; adapt from `MessageStyle` at one named seam

**Context.** The spike carries a flat six-value `MessageStyle`
(`src/diagrams/sequence/ast.ts:32-38`). Upstream's model is orthogonal:
`ArrowConfiguration` = `dressing1` x `dressing2`, each `ArrowHead`
{NORMAL, CROSSX, ASYNC, NONE} x `ArrowPart` {FULL, TOP_PART, BOTTOM_PART},
plus `ArrowDecoration` {NONE, CIRCLE} per side.

**Decision.** Port `ArrowHead`/`ArrowPart`/`ArrowDecoration`/`ArrowDressing`/
`ArrowConfiguration` as the drawing model. Derive it from the existing
`MessageStyle` at **one** adapter function, `arrowConfigurationFor`. Parser
and AST are untouched this mission. Chosen by the maintainer over
"keep MessageStyle, swap the drawing only" and over a full parser port.

**Consequences.** CROSSX, TOP_PART and BOTTOM_PART shapes ship correct but
unreachable until a parser batch wires the syntaxes that produce them —
accepted, because `CLAUDE.md`'s "a structural divergence IS the bug;
re-mirror rather than patch with special cases" applies to the drawing layer
now, and the adapter is one documented divergence a later batch deletes
rather than a model it must replace. Coverage of the unreachable branches
comes from T1's unit tests, not from corpus fixtures.

## D3 — self-message arrowheads are in scope, and all three builders stay separate

**Context.** `renderMessage`'s self branch (`renderer.ts:213-224`) also emits
`markerEnd`. Dropping the marker defs without porting leaves self-messages
headless — a visible regression, not a deferral.

**Decision.** Port all three upstream builders verbatim and keep them
separate: `getPolygonNormal` (`ComponentRoseArrow.java:272-291`),
`getPolygonReverse` (`:293-311`), and `ComponentRoseSelfArrow#getPolygon`
(`:275-292`).

**Consequences.** They look near-duplicate — the self variant differs only by
a sign convention and a `-1` nudge on the part variants. Collapsing them is
forbidden by "do not refactor while porting": redundant-looking branches
handle cases the corpus surfaces months later.

## D4 — baselines are re-pinned in-mission; nothing is promoted

**Context.** `sequence.diff-baseline.ratchet.test.ts` fails only on a *rise*.
A mass fall passes silently and would leave 1140 stale pins that no longer
bound anything.

**Decision.** `diff-baseline.json`, `diff-census.json` and the 1141
`render-manifest-baseline.json` entries are deliberate mission outputs, each
re-pinned from a fresh measurement with updated `measuredAt` and
`measuredAgainstCommit`. `ratchet.json` stays `{"fixtures": []}` — no
sequence fixture reaches zero diffs, so there is nothing to promote and
promotion is not this mission's to grant.

**Consequences.** Rollback is Reversible, with one constraint: the three
artifact files must revert *together with* the `src/` change. Reverting
`src/` alone leaves baselines pinned to output that no longer exists, and the
ratchet would then read as a mass regression.
