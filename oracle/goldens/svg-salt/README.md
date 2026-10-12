# svg-salt conformance ratchet

Regression-proof gate for the salt diagram engine (`src/diagrams/salt/`, not
yet built — mission `salt-engine-port`), mirroring `oracle/goldens/
svg-mindmap/` in shape and procedure. A fixture ratchets in once it renders
byte-for-byte identical to the jar oracle under a **deterministic** text
measurer; the ratchet test then holds it forever. See
`tests/oracle/svg-conformance/salt.golden.ratchet.test.ts`.

## Starts empty (T0b, 2026-10-12)

No salt plugin is registered yet (`src/index.ts:111-125` lists fifteen
`registry.register(...)` calls; salt is absent), so every fixture renders
through `src/core/dispatcher.ts`'s `ERROR_SENTINEL` (`:361-375`) today — a
fixed 300x60 "Error: unknown diagram type" placeholder, never a real salt
diagram. There is nothing to ratchet until the salt plugin lands
(`plans/salt-engine-port/`). `ratchet.json` starts at `{ "fixtures": [] }`
and `salt.golden.ratchet.test.ts` degrades to a documented placeholder
assertion in that state, exactly as `mindmap.golden.ratchet.test.ts` did at
its own T0b.

See `oracle/goldens/svg-salt/diff-baseline.json` (and `tests/oracle/
svg-conformance/salt.diff-baseline.ratchet.test.ts`) for the companion
weighted-score baseline: every one of the 51 cached fixtures is recorded
`status: "error"` today, not a numeric baseline, because pinning a weighted
score against a fixed, content-free placeholder would measure nothing about
salt fidelity. One of them, `lakari-33-mone874`, is additionally a jar-side
crash page (`java.lang.IllegalArgumentException` from
`salt/element/ElementMenuBar.java:87`), and its `reason` says so.

## No DOT-parity gate (D6)

Unlike class/description, salt draws its widgets directly
(`PSystemSalt#getTextBlock`, `salt/PSystemSalt.java:112`) — it never shells
out to Graphviz, so it never emits a `svek-N.dot` dump and has no DOT
oracle to compare against. There is therefore no `parity-salt.json`
DOT-eligibility check in `salt.golden.ratchet.test.ts`, unlike
`class.golden.ratchet.test.ts`'s AC3 — the **only** eligibility condition
for a pin here is byte-for-byte conformance under `DeterministicMeasurer`.

## Why a deterministic measurer, not production

Same rationale as `oracle/goldens/svg-class/README.md`: production
(`renderSync`) measures text with `jarMeasurer` (AWT font metrics via the
cached jar) by default, a pre-existing, already-documented apples-to-oranges
gap, not evidence of a rendering bug. `render-fixture-salt.ts
#renderFixtureSalt` is a thin wrapper around `renderSync` itself (there is
no dedicated salt pipeline to call instead — see that file's doc comment),
so `DeterministicMeasurer` is injected as the `measurer` argument by the
ratchet/diff-baseline tests, exactly the way the SVG parity survey does
(`scripts/svg-parity-survey.ts:273-278`).

## Layout

```
oracle/goldens/svg-salt/
  ratchet.json                 <- the manifest (source of truth for CI)
  diff-baseline.json           <- weighted-score baseline (see above)
  README.md                    <- this file
  <slug>/
    in.puml                    <- fixture source (committed, offline)
    golden.svg                 <- committed jar SVG, copied verbatim from
                                   test-results/dot-cache/salt/<slug>/in.svg
```

No `<type>` subdirectory level (every entry here is type `salt`, same as
svg-mindmap) and no `unknown` tree (that is a class-specific router-repair
mechanism, cdd5-T2/D4 — out of scope here).

## Add rule

A fixture may be added to `ratchet.json` only when it is **conformant**:
rendering the fixture's `in.puml` through `renderFixtureSalt`
(`render-fixture-salt.ts`, `renderSync` under the hood) with
`DeterministicMeasurer` produces an SVG that is zero-diff
(`compareSvg(ours, golden, 'deterministic').pass === true`) against the
jar's `in.svg`. There is no second (DOT-parity) condition — see "No
DOT-parity gate" above.

**Pinning is orchestrator-only, at batch closes (D6).** No fixture is pinned
by T0b — the harness starts at 0 pins by design. A close confirms the
conformance condition above from a fresh measurement, then pins with the
tool:

```
npx jiti plans/salt-engine-port/measurements/pin-salt.mts <slug>... \
  [--repo <root>] [--goldens <dir>]
```

`--repo` defaults to the git toplevel, `--goldens` to
`oracle/goldens/svg-salt` (resolved against `--repo`). Per slug the tool
copies `test-results/dot-cache/salt/<slug>/in.puml` and `in.svg` (renamed
`golden.svg`) into `<goldens>/<slug>/`, re-reads both copies and fails
loudly unless they are byte-identical to the cache, then appends
`{ slug, addedAt, source: "dot-cache" }` to `ratchet.json`. A slug already
in `ratchet.json` is reported as already pinned and left alone (no
duplicate entry, no file touched). Every slug's cache files are checked
before anything is written. The same close removes the pinned slug's
`diff-baseline.json` row: the two manifests stay disjoint and together
cover the 51 cached slugs (`salt.diff-baseline.ratchet.test.ts`'s manifest
shape test).

## Remove rule

Removal is **maintainer-only** — see `oracle/goldens/svg-description/
README.md`'s identical rule; the same rationale applies verbatim.
