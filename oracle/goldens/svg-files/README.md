# svg-files conformance ratchet

Regression-proof gate for `@startfiles` (`src/diagrams/files/`), mirroring
`oracle/goldens/svg-wbs/` in shape. A fixture ratchets in once it renders
byte-for-byte identical to the jar oracle under `DeterministicMeasurer`; the
ratchet then holds it forever. See
`tests/oracle/svg-conformance/files.golden.ratchet.test.ts` and
`files.authored.ratchet.test.ts`.

## The bar (D1)

files has no layout engine (`filesdiagram/FilesDiagram.java` lays its tree
out itself, no Graphviz, no Smetana), so the jar's bytes are the target:
byte-exact on every corpus and authored row, no positional residue accepted.
There is no DOT-parity gate.

## Starts empty (T0b, 2026-10-28)

`ratchet.json` and `authored-baseline.json` are both `{ "fixtures": [] }`; the
tests degrade to documented placeholder assertions. `tests/fixtures/files/`
may be absent until T1f.

## Layout

```
oracle/goldens/svg-files/
  ratchet.json            <- pinned byte-conformant corpus rows
  authored-baseline.json  <- tests/fixtures/files/ rows (diffCount never rises)
  README.md
  <slug>/
    in.puml               <- fixture source (committed, offline)
    golden.svg            <- jar SVG, verbatim from test-results/dot-cache/files/<slug>/in.svg
```

## Render helper

`render-fixture-files.ts#renderFixtureFiles` is `renderSync` with
`withJarCompatibleStyleInput`, because the survey renders every row with
`jarCompatibleStyleInput: true` (`scripts/svg-parity-survey.ts`); the ratchet
must measure the same style input.

## Add rule

A corpus fixture may be added to `ratchet.json` only when
`compareSvg(ours, golden, 'deterministic').pass === true` through
`renderFixtureFiles`. **Pinning is orchestrator-only**, at batch closes:

```
npx jiti plans/data-diagram-conformance/measurements/pin-files.mts <slug>...
```

Authored rows (`tests/fixtures/files/<slug>.puml` + the jar's `<slug>.svg`,
rendered by `scripts/oracle-render.sh`) need exactly one row in
`authored-baseline.json`; a fixture with a `.svg` and no row fails the ratchet
naming the slug, and the orchestrator baselines it at the close. A row's
`diffCount` may only shrink; a `status: "error"` row must still error.

## Remove rule

Maintainer-only, as in `oracle/goldens/svg-description/README.md`.
