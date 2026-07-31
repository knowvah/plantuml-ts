# T5 — `render-fixture.ts` wires an `includeStore`

## Context

`tests/oracle/svg-conformance/render-fixture.ts` says in its own doc comment
that it "Mirrors `scripts/svg-conformance-census.ts#renderFixture` … exactly".
It does not: the census builds `censusIncludeStore()`
(`svg-conformance-census.ts:148-155`) and passes it, while the harness calls
`buildBlockUmls(markup)` with no options at all. So **no golden in any suite can
use `!include`** — which is why the three sprite fixtures inline their sprite
declarations, and why T6 is blocked until this lands.

This is a test-harness task. It may use `node:fs` (via
`buildStdlibAssetsStore()`); it is not `src/`.

## Task

Give `renderFixture` an `includeStore`, built the way the census builds one, and
pass it to `buildBlockUmls`. Prefer reusing the census's construction rather
than writing a second one — a divergence between the two is the exact defect
this task exists to close.

The store should be built once and cached (the census caches it in
`cachedStore`); the golden suite renders 54+ fixtures and rebuilding the assets
store per fixture would be slow.

Then make the doc comment true. If any delta with the census remains after this
change, **say what it is** rather than restating the "exactly" claim — an
inaccurate parity claim is what caused this.

## Write-set — write NOTHING outside these

- `tests/oracle/svg-conformance/render-fixture.ts` (modify)

No fixture, no golden, and no `ratchet.json` change in this task. T6 owns those.

## Read-set

- `tests/oracle/svg-conformance/render-fixture.ts` — the whole file is short;
  `renderFixture` :70 and the doc comment :1-20
- `scripts/svg-conformance-census.ts:145-160` — `censusIncludeStore()`, the
  shape to mirror
- `scripts/stdlib-assets-store.ts` — `buildStdlibAssetsStore()`, and its header
  explaining why it covers every vendored bundle rather than the published subset
- `tests/oracle/svg-conformance/description.golden.ratchet.test.ts:120-135` —
  the caller whose 54 fixtures must not move

## Architecture decisions (locked)

None specific to this task. The relevant constraint is a boundary, not an ADR:
this file is test infrastructure and may use Node built-ins; `src/` may not.

## Interface contract (consumed by T6)

After this task, `renderFixture(markup, measurer)` resolves
`!include <bundle/thing>` for any bundle present under `assets/stdlib/`.
T6 depends on `<bootstrap/bootstrap>` and `<archimate/archimate>` resolving.

## Acceptance criteria

1. Given the 54 fixtures in `ratchet.json`, when the svg-description ratchet
   suite runs, then every one is still zero-diff — this is a pure capability
   add and must change no rendered output.
2. Given a markup string using `!include <bootstrap/bootstrap>`, when
   `renderFixture` runs, then it resolves instead of throwing
   `StdlibNotBundledError`.
3. Given the doc comment's census-parity claim, then it is either true or
   states the remaining delta explicitly.
4. Given the suite renders many fixtures, when it runs, then the assets store is
   constructed once, not per fixture.

## Quality bar

All four gates exit 0. **389 svg-class/object/state goldens byte-identical** and
all 54 svg-description ratchet fixtures zero-diff — criterion 1 is the whole
risk of this task. `npx tsx scripts/measure-description-size-deltas.ts` at
320/351, widened 0.

## Observability

N/A — no new observable operations. The behavioral guarantee is criterion 1
(nothing moved), asserted by the existing ratchet suite.

## Rollback

**Reversible** — revert the commit. No generated state.

## Boundaries

**Always:** verify criterion 1 by running the ratchet suite, not by reasoning
that "adding a store cannot change output". No fixture uses `!include` today, so
the reasoning is sound — but it is exactly the kind of claim this project
requires measured.

**Never:** edit a `golden.svg`, a fixture `in.puml`, or `ratchet.json` here.
Never import `node:fs` into anything under `src/`.

## Method rules

1. **Trace dependency cascades TWO levels.** `renderFixture`'s callers, then
   theirs — `description.golden.ratchet.test.ts` and
   `description.diff-baseline.ratchet.test.ts` both render through it, and the
   second reads the gitignored `test-results/` tree.
2. **Verify the census-parity claim against the CURRENT code** rather than
   trusting either doc comment.

## Commit

One commit: `fix(T5): wire an include store into the golden render harness`
