# svg-skin conformance ratchet

Regression-proof, byte-exact SVG gate for **bundled-skin** rendering
(`skin rose`, `skin debug`, ...). A fixture ratchets in once it renders
byte-for-byte identical to the jar oracle under a **deterministic** text
measurer; the ratchet test then holds it forever. See
`tests/oracle/svg-conformance/skin.golden.ratchet.test.ts`.

## Why a separate ratchet from svg-description

The `svg-description` ratchet (sibling directory) gates *corpus* slugs and
enforces a `parity.json` `dotEqual=true` eligibility rule (AC3) — a fixture
must be structurally DOT-EQUAL against the oracle before its SVG is pinned.

Bundled skins are **authored** fixtures, not corpus slugs, so they have no
`parity.json` entry. Per the project's own guidance (CLAUDE.md, "The corpus
is a starting point"): skins change *colors/fonts/shadows* (SVG), not graph
*structure* (DOT), so **byte-exact SVG golden comparison is the right gate
for them, not DOT-parity**. A full-SVG zero-diff is already the strongest
possible check — if every emitted coordinate matches, the layout the DOT
produced necessarily matched too — so the redundant DOT-EQUAL gate is
dropped here rather than faked with a synthetic `parity.json` entry.

## Why a deterministic measurer, not production

Identical to the `svg-description` rationale: production (`renderSync`)
always measures text with `jarMeasurer` (AWT), which cannot reach zero-diff
against a deterministic-text-mode golden. The ratchet renders through the
description engine's low-level pipeline with `DeterministicMeasurer` injected
into both the layout and render stages (`render-fixture.ts`) — the same
system both sides of the comparison use to measure text. See the
`svg-description/README.md` for the full explanation.

## Layout

```
oracle/goldens/svg-skin/
  ratchet.json                 <- the manifest (source of truth for CI)
  README.md                    <- this file
  <skin>/<slug>/
    in.puml                    <- fixture source (committed, offline)
    golden.svg                 <- committed jar SVG, captured via
                                  `oracle/capture.sh` (deterministic text mode)
```

`in.puml` and `golden.svg` are committed copies so the ratchet runs fully
offline. Capture a golden with:

```
oracle/capture.sh <fixture>.puml <out-dir>   # runs the jar with
                                             # -DPLANTUML_DETERMINISTIC_TEXT=true
```

then copy the resulting `in.svg` to `<skin>/<slug>/golden.svg`.

## Add rule

A fixture may be added to `ratchet.json` only when it is **conformant**:
rendering its `in.puml` through the low-level pipeline with
`DeterministicMeasurer` injected into both stages produces an SVG that is
zero-diff (`compareSvg(ours, golden, 'deterministic').pass === true`) against
the jar's deterministic-mode `in.svg`. Do NOT force-add a non-conformant
fixture; close the emission gap first.

## Remove rule

Removal is **maintainer-only** — a locked fixture is a promise this codebase
does not regress on it. See the `svg-description/README.md` remove rule.

## Coverage notes

- `rose/rose-node-shadow` is the seed fixture. It exercises: `skin <name>`
  loading; per-bucket `Shadowing` (a `node`'s 2.0 winning over the universal
  `element` 4.0); the `componentDiagram { node, rectangle { LineColor black;
  LineThickness 1.5 } }` comma-separated nested selector (deployment node
  border black, 1.5-wide); the root `BackGroundColor #FEFECE` entity fill;
  `FontName SansSerif` -> CSS `sans-serif`; and the raw-source
  (directive-inclusive) diagram seed that makes the shadow filter `id` match.
- Known gap (not yet pinned): a `rose` deployment `rectangle` also needs
  `RoundCorner 0` consumption (the port hardcodes `rx/ry=2.5`) and a
  shadow-ink height reconciliation before a `node`+`rectangle` fixture
  reaches zero-diff. Tracked for a follow-on; add such a fixture only once it
  actually renders zero-diff.
