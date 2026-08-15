# Batch 1 — emit the wrapper subgraphs

Emitter-only, and **expected to move zero pixels**. The layout builder already
models this nesting; only the DOT text lacks it. See
[decisions.md](../decisions.md) ADR-2.

## The gap

Jar wraps each logical cluster in nested protection subgraphs. We emit only the
base. Measured directly:

| fixture | delta | jar | ours |
|---|---|---|---|
| `bupani-17-puxi938` | -4 | `cluster6a cluster6p0 cluster6 cluster6i cluster6p1` | `cluster0` |
| `butigu-57-tobi481` | -2 | `cluster6p0 cluster6 cluster6p1` | `cluster0` |

Corpus-wide: **56 fixtures**, deltas always negative and always even
(-2:17, -4:28, -6:2, -8:6, -12:1, -18:1, -24:1). Even because the wrappers come
in PAIRS.

## Mechanism (`svek/ClusterDotString.java`)

- `"a"` (`:99`) and `"i"` (`:152`) — both gated on `thereALinkFromOrToGroup1`
- `"p0"` (`:115`) and `"p1"` (`:155`) — gated on `protection0/1(type)`
- base `cluster<color>` between them
- **`:109-113`** — if the cluster has ANY border point
  (`entityPositionsExceptNormal.size() > 0`), `protection0`/`protection1` are
  forced false. This is why the wrapper population and the pin population are
  disjoint, and why `temuxi` (all clusters pin-bearing) is correctly not in the 56.

## Tasks

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Emit `a`/`p0`/`i`/`p1` wrappers | typescript-pro | `src/core/svek-dot-emit.ts`, `tests/unit/core/svek-dot-emit.test.ts` | — | [x] |
| T2 | Cross-path wrapper-count fitness test | typescript-pro | `tests/oracle/wrapper-parity.test.ts` (new) | T1 | [x] |

## Exit bar

`bupani-17-puxi938` emits 5 cluster subgraphs in jar's order, and the census is
**neutral on all five diagram types**. A non-neutral census falsifies ADR-2 —
STOP and reopen it rather than patching the census back.

Also record the census **wall-clock** on T1's first run: no baseline exists, and
nested subgraphs are the one plausible cost regression here.
