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

---

# Amendment — 2026-08-23, mid-mission

Batch 2 halted on two stop conditions. The maintainer ruled: amend the brief
to make the ratchet's measure monotonic **before** anything is re-pinned.
D5 records that ruling. D6 is the second stop, still open.

## D5 — the ratchet scores skipped subtrees, not diff records

**Context.** T3 landed the chrome fix exactly as briefed — 803 of the 1010
plateau fixtures fell to an identical 5-diff path set, the six absent root
attributes and `svg/defs[1][childCount]` gone. But 255 fixtures *rose*, 83 of
them from a baseline other than 12, tripping a stop condition.

The mechanism is not a regression. `compareSvg`'s count is **not monotonic in
wrongness**, because it short-circuits in two places and charges 1 for each:

- `compare.ts:172-183` — tags differ: push one diff, `return`. Attributes and
  children are never examined.
- `compare.ts:347-355` — child counts differ: push one `[childCount]` diff,
  `return`. The entire subtree is never examined.

So a tag *substitution* costs 1 however wrong the subtree is, while a tag
*match* with N differing attributes costs N. Adopting the shell changed the
content group's child list; wherever a positional pair flipped from
substitution to match, the charge went 1 → ~10 on an element equally wrong
before and simply not being measured. The clinching evidence is
`zuluja-50-zore143` (31 → 50), where the comparator reports
`svg/g[1]/text[5]/text()[1] actual="Bob" expected="hello"` — our *participant*
label positionally aligned against the jar's *message* label. The pairing is
coincidental, not semantic.

**Decision.** Charge each short-circuit an **upper bound on what descending
could have cost**, and ratchet on the sum of those weights.

```
units(text)     = 1
units(element)  = 1 + |attrs| + sum(units(children))

weight(tag mismatch)        = units(actual) + units(expected)
weight(childCount mismatch) = sum(units(actual children))
                            + sum(units(expected children))
weight(every other diff)    = 1
```

**Both** short-circuits are weighted, not just the tag one. Chosen by the
maintainer 2026-08-23 over a tag-only variant. Weighting tags alone fixes the
255 rises visible today but leaves the identical defect live in the childCount
path — which governs **803 of 1141** fixtures, whose entire body costs 1 diff.
The next mission that makes body element counts match would trip the same mass
false rise. Fixing one short-circuit and not the other treats the symptom.

**Why this is monotone**, by induction on the tree. When tags match and the
comparator descends, its total charge is at most
`|union(attrs_a, attrs_e)|` plus the charges from the children; both are
bounded by `units(a) + units(e)`, which is exactly what the short-circuit
charges. So descending can never cost more than short-circuiting, and making
the document *more* structurally aligned can never raise the score. That is
the property the ratchet needs and the one it does not currently have.

The weight is a design choice, not a ported constant, so it carries a
rationale rather than an upstream `file:line`. It is deliberately a loose
upper bound (a sum, not a max) because a strict bound is what buys
monotonicity; a tighter formula that can be exceeded buys nothing.

**Blast radius — the binding constraint.** `compareSvg` is consumed by the
class, state, description, dot, object, skin and json-family ratchets, and by
five `scripts/`. Every one of them reads `diffs.length`. So the change is
**additive**: a new optional `weight` field on `Diff`, defaulted to 1, and
`diffs.length` left untouched. No other engine's baseline may move. That is
T6's AC5 and it is the acceptance criterion that matters most.

**Consequences.** Sequence's baselines stop being small readable integers
(~5) and become large ones (~450-670 for the plateau) that honestly read as
"this much of the document is unexplained". They fall as the body is ported.
`diffCount` stays in `diff-baseline.json` as an informational field; the
**gated** quantity becomes `weightedScore`. A rising `diffCount` alongside a
falling `weightedScore` is exactly the artifact diagnosed above, and is no
longer a failure.

## D6 — PROPOSED, NOT RULED: the one non-sequence manifest entry

**Status: open. Needs a maintainer ruling before T5 commits anything.**

`test-results/dot-cache/object/zuvila-56-nuda425/in.puml` moved, tripping the
mission's highest-consequence stop. The evidence says it is **not** the
`assemble-svg.ts` leak that stop was written to catch:

1. Batch 1 — which contains the **entire** `assemble-svg.ts` change — moved
   **0** fixtures.
2. T3's commit touches only `renderer.ts`, the new `renderer-arrowhead.ts`,
   its test and `docs/catalog.md`. No parser, dispatcher, `accepts` or
   `index.ts`, so routing is untouched by this mission.
3. Rendering that fixture produces a document whose **only**
   `data-diagram-type` is `"SEQUENCE"`. The whole fixture is claimed by the
   sequence engine; it is a sequence render filed under an object path.

Symmetrically, **70** fixtures filed under `sequence/` did *not* move; the
three sampled render as `YAML`, `CLASS` and `CLASS`. Corpus classification and
actual routing disagree in both directions, and 1071 + 1 = the 1072 fixtures
the sequence engine actually renders.

**Proposal** (not yet authority to act): amend T5's AC2 to permit exactly this
one enumerated slug, with the three facts above recorded, and file the
routing mismatch as its own tracked issue. T5's own boundary states that
explaining a non-sequence move "does not make it one you may proceed past",
so this stays blocked until ruled on.
