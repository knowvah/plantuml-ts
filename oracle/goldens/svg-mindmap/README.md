# svg-mindmap conformance ratchet

Regression-proof gate for the mindmap diagram engine (`src/diagrams/mindmap/`,
not yet built — mission `mindmap-engine-port`), mirroring `oracle/goldens/
svg-class/` in shape and procedure. A fixture ratchets in once it renders
byte-for-byte identical to the jar oracle under a **deterministic** text
measurer; the ratchet test then holds it forever. See
`tests/oracle/svg-conformance/mindmap.golden.ratchet.test.ts`.

## Starts empty (T0b, 2026-09-29)

No mindmap plugin is registered yet (`src/index.ts:108-121` lists eleven
`registry.register(...)` calls; mindmap is absent), so every fixture renders
through `src/core/dispatcher.ts`'s `ERROR_SENTINEL` (`:252-267`) today — a
fixed 300x60 "Error: unknown diagram type" placeholder, never a real
mindmap. There is nothing to ratchet until D6/D7's plugin lands (batch-5 of
`plans/mindmap-engine-port/`). `ratchet.json` starts at `{ "fixtures": [] }`
and `mindmap.golden.ratchet.test.ts` degrades to a documented placeholder
assertion in that state, exactly as `class.golden.ratchet.test.ts` does for
its own empty case.

See `oracle/goldens/svg-mindmap/diff-baseline.json` (and `tests/oracle/
svg-conformance/mindmap.diff-baseline.ratchet.test.ts`) for the companion
weighted-score baseline: every one of the 142 cached fixtures is recorded
`status: "error"` today, not a numeric baseline, because pinning a weighted
score against a fixed, content-free placeholder would measure nothing about
mindmap fidelity.

## No DOT-parity gate (D7)

Unlike class/description, mindmap draws on the klimt substrate directly
(`TextBlock.drawU` → `UGraphicSvg`, D3 of `plans/mindmap-engine-port/
decisions.md`) — it never shells out to Graphviz, so it never emits a
`svek-N.dot` dump and has no DOT oracle to compare against. There is
therefore no `parity-mindmap.json` DOT-eligibility check in
`mindmap.golden.ratchet.test.ts`, unlike `class.golden.ratchet.test.ts`'s
AC3 — the **only** eligibility condition for a pin here is byte-for-byte
conformance under `DeterministicMeasurer`.

## Why a deterministic measurer, not production

Same rationale as `oracle/goldens/svg-class/README.md`: production
(`renderSync`) always measures text with `jarMeasurer` (AWT font metrics via
the cached jar), a pre-existing, already-documented apples-to-oranges gap
(D12), not evidence of a rendering bug. `render-fixture-mindmap.ts
#renderFixtureMindmap` is a thin wrapper around `renderSync` itself (there
is no dedicated mindmap pipeline to call instead — see that file's doc
comment), so `DeterministicMeasurer` is injected as the `measurer` argument
by the ratchet/diff-baseline tests, exactly the way the SVG parity survey
injects `WidthTableMeasurer` (the same underlying class, re-exported under
the `DeterministicMeasurer` name — `src/core/measurer-deterministic.ts`'s
own doc comment).

## Layout

```
oracle/goldens/svg-mindmap/
  ratchet.json                 <- the manifest (source of truth for CI)
  diff-baseline.json           <- weighted-score baseline (see above)
  README.md                    <- this file
  <slug>/
    in.puml                    <- fixture source (committed, offline)
    golden.svg                 <- committed jar SVG, copied verbatim from
                                   test-results/dot-cache/mindmap/<slug>/in.svg
```

No `<type>` subdirectory level (every entry here is type `mindmap`, same as
svg-class) and no `unknown` tree (that is a class-specific router-repair
mechanism, cdd5-T2/D4 — out of scope here).

## Add rule

A fixture may be added to `ratchet.json` only when it is **conformant**:
rendering the fixture's `in.puml` through `renderFixtureMindmap`
(`render-fixture-mindmap.ts`, `renderSync` under the hood) with
`DeterministicMeasurer` produces an SVG that is zero-diff
(`compareSvg(ours, golden, 'deterministic').pass === true`) against the
jar's `in.svg`. There is no second (DOT-parity) condition — see "No
DOT-parity gate" above.

**Pinning is orchestrator-only, at batch closes (D7, D10).** No fixture is
pinned by this task (T0b) — the harness starts at 0 pins by design. A
future close's pin step:

1. Confirm the conformance condition above from a fresh measurement.
2. Copy `test-results/dot-cache/mindmap/<slug>/in.puml` and `in.svg` into
   `oracle/goldens/svg-mindmap/<slug>/` (renaming `in.svg` to `golden.svg`).
3. Append `{ slug, addedAt, source: "dot-cache" }` to `ratchet.json`.

No dedicated `pin-goldens.mts`-style tool exists for mindmap yet (unlike
class's `--tree unknown` variant) — the class/description tools' shape is
the precedent a future pin tool should follow if one is built; until then,
the three steps above are manual, and only the orchestrator runs them.

## Remove rule

Removal is **maintainer-only** — see `oracle/goldens/svg-description/
README.md`'s identical rule; the same rationale applies verbatim.
