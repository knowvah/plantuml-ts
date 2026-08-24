# T9 — prove no conformant fixture was traded away

## Context

This is the highest-consequence check in the mission. Routing changes are
corpus-wide: T2 alone re-decides every fixture's engine. **482 fixtures are
currently byte-exact against the jar**, promoted across ten `ratchet.json`
files. If a routing change moved one of them, the port lost a conformant
fixture — a strictly worse outcome than the 86 misroutes this mission set out
to fix.

| ratchet | promoted |
|---|---|
| `svg-class` | 314 |
| `svg-state` | 60 |
| `svg-description` | 51 |
| `svg-object` | 34 |
| `svg-json` | 10 |
| `svg-yaml` | 6 |
| `svg-dot` | 5 |
| `svg-hcl` | 1 |
| `svg-skin` | 1 |
| `svg-sequence` | 0 |

## Task

1. Assert **zero** de-promotions across all ten lists
2. Regenerate the render manifest and diff it against the previous baseline;
   assert every moved entry is explained by a routing change this mission made
3. Record the diff summary **verbatim**, with counts, in the journal

## Read-set

- `scripts/render-manifest.ts:165-200` — `parseArgs`; the tool has a `--diff`
  mode: `npx jiti scripts/render-manifest.ts --diff <baseline> <current>`
- `plans/sequence-root-chrome/decisions.md` D4 CORRECTION — why the manifest
  baseline produces **no commit**
- `oracle/goldens/svg-*/ratchet.json` — the ten promotion lists

## This task produces no commit — that is expected, not a failure

`test-results/render-manifest-baseline.json` is **gitignored**
(`.gitignore:24`), has never been committed in the repo's history, and is read
by no test, script or CI workflow. It is an operator-driven guard, not a
pinned artifact. Established and verified at the close of
`sequence-root-chrome`; do **not** rediscover it by trying `git add -f`.

The deliverable is **recorded evidence**: both sha256s and the verbatim diff
summary in the decision journal. That is the SI28/SI31 pattern.

## Write-set

**None.** This task writes no file — see "This task produces no commit"
above. Its deliverable is evidence recorded in `../decision-journal.md`,
which the batch close-out commits.

## Acceptance criteria

1. Given the ten `ratchet.json` files, then **zero** of the 482 promoted
   fixtures fails its golden ratchet — a de-promotion is a **stop condition**,
   not something to re-pin
2. Given the regenerated manifest, then it still holds the same entry count as
   the previous baseline (nothing added or dropped)
3. Given the manifest diff, then every moved entry corresponds to a fixture
   whose routing this mission changed — cross-check against T1's
   `routing-baseline.json`, and name any entry that does not
4. Given the journal, then it carries the diff summary verbatim including
   counts, plus both sha256s

## Quality bar

All four gates green.

## Observability

This task carries the mission's most important signal. Record it verbatim —
a summarised diff is not evidence.

## Rollback

Reversible with batches 2–4; produces no committed artifact of its own.

## Boundaries

- **Always:** report counts verbatim, never summarised
- **Never:** `git add -f` the manifest baseline; edit a `ratchet.json` to make
  a de-promotion go away; touch `src/**`
- **Ask first:** if a manifest entry moved that T1's routing baseline does not
  explain. It is a stop condition; explaining it does not make it one you may
  proceed past

## Commit

None — see above. Record the evidence in `decision-journal.md`; the batch
close-out commit carries it.
