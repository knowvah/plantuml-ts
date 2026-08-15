# T2 port trace — one fold site, one field to widen, 62 fixtures at risk

Mission `plans/transition-label-ink/`, batch-1/T2. Companion to
`transition-label-ink.md`, which carries the upstream mechanism. This note
is the port-side answer: which line changes, who else reads it, and how
big the blast radius measured.

## Observation: `TransitionGeo.label.width/height` has exactly ONE reader

- **Context**: the brief warned the fix site might sit in
  `SvekNode`/`GroupMakerState` — outside `src/diagrams/state/`. It does
  not. Nothing in `SvekNode` is involved; the whole correction is the
  label's own ink contribution.
- **Finding**: `label.width`/`label.height` are read at
  `src/diagrams/state/layout-ink-extent.ts:388-390` and nowhere else. The
  transition renderer (`state-renderer-transitions.ts:164-172`) uses only
  `.x`, `.y` and `.text`.

  ```
  $ grep -rn "label\.width\|label\.height" src/
  ```
  Every other hit is a different `label` object — node label sizing in
  `state-sizing.ts:180-181`, the pseudostate renderer's own text block
  (`renderer-pseudostate.ts:165-170`), and the label⊕note merge in
  `state-dot-graph.ts:155-157` / `state-composite-edge-label.ts:58-60`,
  which consume `computeReservedLabelBox`'s output directly for the DOT
  reservation and must keep the floored value.
- **Impact**: the change is confinable to three files, all inside
  `src/diagrams/state/` plus nothing in `src/core/`. D5 (the
  `labelInk: false` document-level fold must not move) is structurally
  guaranteed, not merely intended.
- **Confidence**: High — every claim is a grep or a read, quoted above.

## The line

`src/diagrams/state/layout-ink-extent.ts:389-390`

```ts
addPoint(box, transition.label.x, transition.label.y - transition.label.height);
addPoint(box, transition.label.x + transition.label.width, transition.label.y);
```

Two errors in two lines:

1. **Wrong width.** `label.width` is `reservedWidth =
   floor(measuredWidth + 2·marginLabel)` — the `(int)`-cast DOT
   reservation (`SvekEdge.java:504-507`, ported at
   `src/core/edge-label-box.ts:102`). Upstream's ink folds the UNfloored
   `TextBlockMarged#calculateDimension` = `measuredWidth + 2·marginLabel`.
2. **Wrong anchor.** `label.x`/`label.y` are the *drawn text* anchor
   (`transitionLabelAnchor`, `state-transition-label.ts:62-63`). Upstream
   anchors the ink at the reserved box's own top-left corner, one
   `marginLabel` further out on x and `ascent + marginLabel` above the
   baseline on y (`SvekEdge.java:745` + `:951-954`).

The port already has the correct primitive:
`src/core/klimt/drawing/LimitFinder.ts:162` ports `drawEmpty` faithfully.
The state ink walk simply never routes through it.

## What the corrected fold is

`LimitFinder#drawEmpty` on the marged box, in `TransitionGeo` terms:

```
inkBox.x      = label.x − marginLabel
inkBox.y      = label.y − ascent − marginLabel
inkBox.width  = measuredWidth  + 2·marginLabel     (NOT floored)
inkBox.height = measuredHeight + 2·marginLabel     ( == reservedHeight)
fold          = [x, x+width] × [y, y+height]
```

`marginLabel`, `measuredWidth` and `measuredHeight` all already exist on
`ReservedLabelBox` (`src/core/edge-label-box.ts:73-80`); `ascent` is
already computed at `state-transition-label.ts:60`. Nothing needs
re-deriving and no new constant appears — D4 is satisfied by construction.

**The y axis is independently jar-verified.** On `bemena-23-zebu249` the
drawn baseline is 258.111 and `ascent = 13 − 2.888889 = 10.111111`, so the
box top is 258.111 − 10.111111 − 1 = **247.0**, and the graphviz label
centre is 247 + 15/2 = **254.5** — a clean half-integer, which only comes
out clean for the BOX, never for the text. The current fold puts the box
at [243.111, 258.111]; the correct one is [247, 262], i.e. 3.888889 lower.
Neither is the vertical extreme on this fixture, but the y move is real
and must be measured across the corpus, not assumed inert.

## Proposed shape of the change (3 files)

1. **`src/diagrams/state/state-geo-types.ts:286`** — widen
   `TransitionGeo.label` with an optional `inkBox: {x, y, width, height}`.
   Keep `width`/`height` untouched: they are the DOT reservation and other
   consumers depend on the floor.
2. **`src/diagrams/state/state-transition-label.ts`** — have
   `transitionLabelAnchor` (`:52-65`) also return the box corner (it
   already computes `ascent` and holds the `ReservedLabelBox`), and have
   `attachTransitionLabel` (`:134`, `:148`, `:153`) populate `inkBox`.
   The legacy perpendicular fallback (`:151-153`) has no graphviz box
   upstream; it should keep whatever it does today rather than gain a
   speculative one.
3. **`src/diagrams/state/layout-ink-extent.ts:387-394`** — fold `inkBox`
   when `labelInk` is on, falling back to the existing point-only branch
   when it is absent.

An alternative that touches two files instead of three — carry
`marginLabel`/`measuredWidth`/`ascent` on the label and do the arithmetic
at the fold site — is worse: it puts label geometry in the ink walk, where
upstream puts a positioned `UEmpty`.

## Blast radius, measured

**Callers of the `labelInk: true` path** — `computeSvekResultGeometry` is
the only `labelInk: true` caller, and it has exactly two callers:

```
$ grep -rn "computeSvekResultGeometry" src/ scripts/ tests/
src/diagrams/state/state-composite-autonom.ts:198     ← composite autonom sizing
src/diagrams/state/state-composite-concurrent.ts:131  ← concurrent-region sizing
```

`state-composite-concurrent.ts` builds its transitions through an
accumulator with no font/measurer, so `attachTransitionLabel` attaches no
box at all there (`state-transition-label.ts:123-133`) and that caller is
inert for this change. `computeStateDocumentDims` and
`computeStateInkShift` pass `labelInk: false` and are untouched — D5.

**Fixtures at risk** — state fixtures that have a composite AND at least
one labelled transition, an upper bound (the label must also set the
extent to move anything):

```
$ cd test-results/dot-cache/state && for d in */; do \
    grep -qE '^\s*state\b.*\{|\bbegin\s*$' "$d/in.puml" && \
    grep -qE '\-+\s*(\[|\w|>).*:\s*\S' "$d/in.puml" && echo "$d"; done | wc -l
62        (of 271 state fixtures)
```

**Gates, and what each will see**

| gate | effect | why |
|---|---|---|
| `measure-composite-declared-size.ts` | deltas shrink ~99.7%; `exact` likely FLAT | residual 2dp quantization is 0.0008–0.003 px against a 3.6e-5 px epsilon — see `transition-label-ink.md` |
| state DOT-parity | passes | `oracle/goldens/state/size-backlog.json` is tighten-only (`delta <= pinned + 1e-6`); `bemena-23-zebu249` is pinned at 0.007315 in = 0.5267 px and would fall to ~2.3e-5 in |
| svg-state ratchet (59 pins) | expected to hold | band is 0.01 px (`tests/oracle/svg-conformance/compare.ts:27-29`). A pinned fixture is zero-diff *within that band today*, so its composite width cannot currently be moved by ≥0.01 by a label; the four pinned fixtures that DO appear in the mismatch list (`lalava-26-zosi801`, `lasasi-13-nona547`, `soxene-95-domu248`, `tegali-39-molu382`) sit at 0.0025–0.0037 px, i.e. pure quantization, not this mechanism |
| `shape-match-report.ts` | should rise or hold | composite boxes move toward jar |
| non-state diagram types | untouched | the fold is state-only; `core/edge-label-box.ts` is NOT modified |

## Observation (en route, unrelated): a named `@startuml` drops out of both oracle caches

- **Context**: running `scripts/dot-sync-report.ts state` as a Batch 1 gate
  reported **267**, not the brief's 268, and self-healed by re-invoking the
  jar — which did not fix it.
- **Finding**: `somuke-94-buzi673`'s source begins `@startuml Test`. The
  jar names its output after the DIAGRAM, not the source file, so
  `generateCanonical` (`scripts/dot-sync-fixtures.ts:177-189`) writes
  `canonical/state/Test.svg` while `missingCanonicalSlugs` (`:225-231`)
  looks for `somuke-94-buzi673.svg`. The fixture is therefore permanently
  "missing", never gets a `data-diagram-type` tag, and is dropped from the
  STATE set — silently, except for the skip line `reportSkips` prints. The
  same naming applies in `dot-sync-report.ts#plantumlDots:105-125`, whose
  `-o dir` output lands as `Test.svg` rather than `in.svg`.
- **Impact**: two coupled denominators. Renaming `Test.svg` to the slug
  restores DOT-parity to **268/268 (100% structurally equal)**, and that
  is what this batch left in place — `test-results/visual-qa-svg/` is
  gitignored, so nothing was committed. But the newly-STATE-tagged fixture
  then also earns a `test-results/dot-cache/state/somuke-94-buzi673/`
  entry, and that directory IS tracked: with it present,
  `measure-composite-declared-size.ts` reads **272 fixtures / 2654
  declarations / 2466 exact** instead of the brief's 271 / 2642 / 2454.
  All 12 new declarations are exact, so the mismatch count is unmoved at
  160. **The directory was deleted to keep the brief's baseline
  comparable; any `dot-sync-report.ts` run recreates it.** Whoever runs
  Batch 2 must either delete it again before measuring, or re-baseline
  against 2466 — not compare 272-fixture output to a 271-fixture baseline.
- **A durable fix belongs in `scripts/dot-sync-fixtures.ts`**, not here:
  render per-fixture and rename to the slug, or strip the diagram name
  alongside `stripLayoutPragma`. Out of this mission's write-set.
- **Confidence**: High — reproduced directly (`java -jar … -o <dir>
  somuke-94-buzi673.puml` writes `Test.svg`), and both denominators were
  measured before and after.

## The scope question this batch cannot decide

Closing the last 0.0008–0.003 px needs the 2-decimal read-seam
quantization, which is a different, already-filed mechanism
(`class-edge-spline-2dp-quantization.md`) whose own note ends: *"Do not
apply quantization anywhere until that is answered; the measurement above
shows it costs more than it buys"* — blanket quantization at
`graph-layout.ts:81` took the oracle suites from 1969/1969 to 1961/1969.
Whether a narrower quantization of `labelX`/`labelY` only is in scope is a
maintainer call, not an inference. See the mission's checkpoint report.
