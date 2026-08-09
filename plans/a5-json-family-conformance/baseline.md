# A5 baseline — json / yaml / hcl

T3 (measurement + attribution) and T4 (document shell). Measured through
`renderFixtureJson` + `compareSvg(…, 'deterministic')` over all 92 cached
fixtures.

## The finding that shaped the batch

**At baseline, every one of the 92 fixtures had a root `childCount` diff — so
every interior was UNCOMPARED.** `compare.ts:325` returns on a structural
mismatch ("stop recursing into children"), so the reported 11–30 diffs were a
floor covering the root element alone. Nothing below it had ever been measured
in this family.

That is why T3 could not produce a per-fixture mechanism table in the shape G4's
ledger has: with one mechanism masking the whole document, there was exactly one
thing to attribute. Attribution of the *interior* only becomes possible after
the shell is closed, which is what T4 did.

## Outcome

| | conformant | 1–3 | 4–10 | 11–30 | 31+ | errors |
|---|---|---|---|---|---|---|
| **T3 baseline** | 0 | 0 | 1 | 91 | 0 | 0 |
| **after T4 (shell)** | 0 | 1 | 86 | 0 | 5 | 0 |

The five fixtures that moved *up* into 31+ did not regress — their interiors
became visible for the first time. This is the expected shape of closing a
structural mask, and it is why "total diffs" is the wrong success metric here.

## Mechanism 1 — the document shell (CLOSED, T4)

**Mechanism.** json/yaml/hcl fell through `assembleSvg` to the generic
`svgRoot` (`core/svg.ts`) instead of the shared jar-faithful
`assembleDocumentShell` that class, state and description already use. Two
consequences: every jar root attribute was missing, and `svgRoot` auto-embedded
13 arrowhead `<marker>` defs the jar does not emit — which is what produced the
root `childCount` mismatch that masked everything else.

**Origin.** `src/index.ts#assembleSvg` (pre-split), which dispatched on
`klimtShell`/`classShell`/`stateShell` and had no arm for this family.

**Causal chain.** No shell arm → generic `svgRoot` → (a) root missing
`xmlns:xlink`, `version`, `data-diagram-type`, `style`, `px` units,
`zoomAndPan`, `preserveAspectRatio`, `contentStyleType`, and the `<?plantuml?>`
prolog; (b) a 13-child `<defs>` against the jar's empty one; (c) root
`childCount` 2 vs 1 → comparator stops → 92 interiors unmeasured.

**Ruled out.** Text metrics: the census reports byte-identical bucket counts
under `DeterministicMeasurer` and `jarMeasurer`, so the gap was measurer-
independent from the start. Also ruled out as *json-specific*: mission D14 hit
the identical `svgRoot`-defs symptom on `@startdot`, confirming the cause is the
shared shell path, not this engine.

**Evidence.** 6 root-attribute signatures × 92 fixtures = 552 diffs eliminated;
`defs[childCount]` 92 → 22; every fixture moved out of the 11–30 bucket.

**Fix.** `RenderFragment.jsonShell` — a STRING, not a boolean, carrying the
jar's `data-diagram-type`, because one renderer serves three types. Set by the
three PLUGINS (each knows its own type), dispatched in `assembleSvg`.

## Remaining mechanisms, by fixture reach

Ranked by the aggregate signature count after T4. These are the input to
Batch 3.

| # | signature | count | reading | ADR-1-sensitive? |
|---|---|---|---|---|
| 2 | `@viewBox` (×2), `@width` 92, `@height` 91 | ~366 | **document dimensions wrong on every fixture** (e.g. babico: ours 82.512×79, jar 103×75) | **yes** — this is layout output |
| 3 | `[childCount]` (non-root) | 70 | interior element counts differ — missing or extra elements | **yes** |
| 4 | `defs[childCount]` | 22 | our `jsonArrowMarkerDef` extraDefs vs the jar's inline arrowheads | no — emission, not layout |
| 5 | `g/@transform`, `g/@font-family`, `g/@lengthAdjust` | 20 each | per-group attributes on nested `<g>` | no |
| 6 | `g/text/@{x,y,textLength,fill,font-weight,text-anchor,dominant-baseline}`, `text()` | ~15 each | text placement and styling inside nodes | partly |

**Mechanism 2 is the mission's centre of gravity** and is exactly what ADR-1
predicts: the document dimensions are the layout's output, and our layout is
built on a different graph than upstream's (`rankDir: 'LR'` + fractional
`tailportY` vs TB + swapped dims + real record ports + `Mirror`). T5's go/no-go
should use document dimensions as its primary metric — it is the highest-reach
signal and is present on every fixture.

## Note for Batch 3 — a rule violation found in passing

`src/diagrams/json/renderer.ts:346` calls `Math.random()` to build a per-render
salt for clip-path and marker ids. CLAUDE.md's architecture notes forbid this
outright: *"No `Date.now()` / `Math.random()` in rendering paths — every
non-determinism (uid counters, gradient/shadow ids) is seeded so output is
reproducible."*

It does not currently show up as a diff (the comparator's normaliser does not
compare generated ids), so it is not on the critical path — but it makes json
output non-reproducible run-to-run, and any future byte-exact comparison would
be defeated by it. Not fixed here: `renderer.ts` carries four pre-existing
complexity-hook violations (`renderNode` alone is 136 NLOC / 71 CCN), so any
edit to it is blocked until those are addressed. Tracked, not silently dropped.
