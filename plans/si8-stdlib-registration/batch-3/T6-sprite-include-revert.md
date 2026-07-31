# T6 — Revert the sprite fixtures to `!include`; re-capture goldens

## Context

See [ADR-6](../decisions.md#adr-6). The three fixtures under
`oracle/goldens/svg-description/usecase/sprite-svg-{bootstrap,archimate,multiline}-0`
inline their sprite declarations. Their own `in.puml` comments say why: *"the
golden harness (renderFixture) runs the preprocessor with no include resolver"*.
T5 fixed that, so they can now use the form a user actually writes.

**This is the riskiest task in the mission.** SI9 ratcheted all three in at
zero-diff, so they are pinned and a regression fails `npm test`.

## Task

For each fixture:

1. Replace the inline `sprite <name> <svg …>` declarations with the bundle
   include — `!include <bootstrap/bootstrap>` for `sprite-svg-bootstrap-0` and
   `sprite-svg-multiline-0`, `!include <archimate/archimate>` for
   `sprite-svg-archimate-0`. Keep every other line (skinparams, the `usecase`
   lines, the explanatory comments) intact, and update the comment that claims
   inlining was necessary.
2. Re-capture `golden.svg` from the **pinned oracle jar**:
   `java -DPLANTUML_DETERMINISTIC_TEXT=true -jar oracle/dist/plantuml-oracle.jar -tsvg -nometadata -o <dir> <in.puml>`
   (match how the existing goldens were captured — check
   `oracle/goldens/svg-description/README.md` § Layout and
   `scripts/oracle-corpus.ts#runOracle` before choosing flags).
3. Measure with `compareSvg(ours, golden, 'deterministic')` through
   `renderFixture` + `DeterministicMeasurer` — the ratchet's own path, **never**
   `===`.

**If a fixture will not come back to zero-diff, revert it to inlined and record
the measurement.** That is an allowed, documented outcome (criterion 3). Do not
engineer toward the pin.

## Write-set — write NOTHING outside these

- `oracle/goldens/svg-description/usecase/sprite-svg-bootstrap-0/{in.puml,golden.svg}`
- `oracle/goldens/svg-description/usecase/sprite-svg-archimate-0/{in.puml,golden.svg}`
- `oracle/goldens/svg-description/usecase/sprite-svg-multiline-0/{in.puml,golden.svg}`

**One commit for all six files.** Per [ADR-6](../decisions.md#rollback-classification)'s
rollback hazard: a partial revert (code without goldens, or goldens without
inputs) fails the suite, so `in.puml` and `golden.svg` must move together.

Do **not** touch `ratchet.json` — all three are already pinned and stay pinned.
Do **not** touch `parity.json` or `diff-baseline.json`.

## Read-set

- `oracle/goldens/svg-description/README.md` — § Layout, § Add rule, and the
  "Authored sprite fixtures — RATCHETED 2026-07-31" section (SI9 rewrote it and
  documents the registration path)
- The three `in.puml` files — note that "multiline" means multi-line **display
  text** (`\n` in the usecase label), not multi-line sprite declarations
- `tests/oracle/svg-conformance/render-fixture.ts` — post-T5, the render path
- `tests/oracle/svg-conformance/compare.ts` — `compareSvg` :355
- `assets/stdlib/bootstrap/`, `assets/stdlib/archimate/` — the bundles being
  included

## Architecture decisions (locked)

- [ADR-6](../decisions.md#adr-6) — re-capture from the jar when `in.puml`
  changes; that is distinct from editing a golden to close a diff

## Interface contract

None produced.

## Acceptance criteria

1. Given each rewritten `in.puml` and its re-captured `golden.svg`, when
   rendered through `renderFixture` + `DeterministicMeasurer` and compared with
   `compareSvg(…, 'deterministic')`, then the result is zero-diff.
2. Given the svg-description ratchet suite, when it runs, then all 54 fixtures
   pass with the three still pinned.
3. Given a fixture that does **not** reach zero-diff after the revert, then its
   `in.puml` and `golden.svg` are restored to the inlined form and the journal
   records the diff count and first differing path. This is a success outcome,
   not a failure.
4. Given the `in.puml` comments that justified inlining, then they no longer
   claim the harness cannot resolve includes.

## Quality bar

All four gates exit 0. **389 svg-class/object/state goldens byte-identical.**
`npx tsx scripts/measure-description-size-deltas.ts` at 320/351, widened 0 —
note this script renders these fixtures too, so a sprite change can move it.

## Observability

N/A — no new observable operations. The guarantee is the ratchet itself.

## Rollback

**Reversible** — revert the single commit, restoring inputs and goldens
together. This is why the six files are one commit.

## Boundaries

**Always:** measure with `compareSvg(…, 'deterministic')`. The comparator strips
`data-*` attributes and rounds numerics under a 0.01 tolerance; raw string
comparison invents blockers that do not exist, and that has already cost this
mission line time.

**Never — this is a STOP:** edit a `golden.svg` to close a diff. Re-capturing
from the jar after a legitimate `in.puml` change is required and is not this.
Never unpin a fixture from `ratchet.json` to make the suite pass. Never
re-pin `oracle/goldens/description/size-backlog.json`.

## Method rules

1. **Trace dependency cascades TWO levels.** These fixtures are read by the
   ratchet suite, the diff-baseline suite and
   `measure-description-size-deltas.ts` — check all three, not just the ratchet.
2. **Verify the "byte-identical jar output" claim against the CURRENT jar.** The
   predecessor verified on 2026-07-30 that `!include` and inlined forms produce
   identical jar output; that claim is now load-bearing behind a gate. Re-run it
   per fixture — do not cite it.

## Commit

One commit: `test(T6): use !include for the sprite fixtures' bundle sprites`
