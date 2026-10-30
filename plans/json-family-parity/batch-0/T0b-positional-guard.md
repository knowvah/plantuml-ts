# T0b — positional-residue measure and shrink-only ratchet (D4)

Agent: `typescript-pro` (sonnet, effort high), worktree `jfp-T0b`. Commit:
`test(oracle): json-family positional residue ratchet (T0b)`. Read
[../task-contract.md](../task-contract.md) and [../decisions.md#d4](../decisions.md).

## Why
Every non-conformant json/yaml/hcl row is structurally clean but positionally
off by 0.03–127 px (`../fixtures.md`). The structural gate drops positional
attributes (`isPositionalDiff`), so today nothing stops one of those rows from
getting WORSE. This task builds the measure and the gate; the orchestrator
seeds the pin at the close.

## Task
1. `tests/oracle/svg-conformance/json-family-positional.ts`: `measureResidue`
   per the interface in [overview.md](overview.md). Render with
   `renderFixtureJson(puml, new DeterministicMeasurer())` against
   `test-results/dot-cache/<type>/<slug>/in.svg`. Align elements by document
   order per tag (as `compareSvg` does — read `tests/oracle/svg-conformance/compare.ts`
   first; its diff count is NOT monotonic, memory `comparesvg-count-not-monotonic`,
   so take magnitudes from parsed coordinates, not from diff counts). Path `d`
   and polygon `points`: tokenize to numbers and compare token by token; a
   token-count mismatch sets `aligned: false`. Any structural diff (the
   structural gate's own predicate, `json-family-structural.ts`) ⇒ `aligned: false`.
2. `tests/oracle/svg-conformance/json-family-positional.test.ts`: reads
   `oracle/goldens/json-family-positional.json`
   (`{ rows: { "<type>/<slug>": { nodeMax, pathMax, dw, dh } } }`); for each row
   asserts every measured field ≤ its pinned value + 1e-6 and, for rows absent
   from the pin and not in the golden ratchets' conformant set, fails "unpinned
   residue row <type>/<slug>". A row pinned `{ "aligned": false }` (structural
   diffs; the manifest's ceiling governs it) passes while still unaligned and
   fails "re-seed" once it aligns. A missing pin file fails "unseeded", never passes.
3. `tests/unit/oracle/json-family-positional.test.ts`: unit tests on synthetic
   svg pairs (offset rect, offset path token, extra token, canvas change).
4. `plans/json-family-parity/tools/residue.mts`: CLI over `measureResidue`
   (`<type> <slug>` prints one row; `--all` walks the three dot-cache
   directories; `--json <out>` writes `{ rows }` in the pin's shape plus
   `aligned`). The orchestrator seeds the pin with it.

## Write-set
`tests/oracle/svg-conformance/json-family-positional.ts`,
`tests/oracle/svg-conformance/json-family-positional.test.ts`,
`tests/unit/oracle/json-family-positional.test.ts`,
`plans/json-family-parity/tools/residue.mts`.

## Read-set
`tests/oracle/svg-conformance/{compare.ts,json-family-structural.ts,json-family-structural.test.ts,render-fixture-json.ts,json-family-ratchet.ts}`;
`plans/json-style-engine/tools/diff-one.mts` (rendering pattern).

## Acceptance
- Given json/bavize-88-jumu158, when measured, then `aligned` is true, `nodeMax` = 0.225 ± 1e-3 and `pathMax` within 0.1 of 1.9 (fixtures.md).
- Given any of the 22 conformant rows (fixtures.md), then every field is 0 and `aligned` is true.
- Given json/timafu-94-bixe774 (37 structural diffs), then `aligned` is false.
- Given a pin where row R has `nodeMax` c and R measures c + 0.01, then the ratchet fails naming R; with no pin file it fails "unseeded".
- Given `residue.mts --all --json <out>`, then `<out>` has one entry per non-conformant row (70 at main).

Observability: N/A. Rollback: Reversible.
