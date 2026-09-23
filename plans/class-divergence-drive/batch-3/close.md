# Batch 3 close — re-pin, ratchet, after-B5 column

**Agent:** debugger · **Depends on:** T8, T9, T10

## Context

B5 partly moves layout: T9's connector-as-own-link-group inserts a new
`<g class="link">`, shifting positional indices in every fixture with a
plain note (E6's own risk note calls this medium risk to the ratchet).
This close re-pins once (D11) against batch 2's `b2.json`, re-verifies
`lipazi-06-care921` (batch 2's T7 rendered its note against the pre-T8
builder — this close is where it should reach byte-exact or name its
residual), and fills `fixtures.md`'s `after batch 3` column —
unlike batch 2, no new column needs to be appended here.

## Steps

1. Four gates: `npm test`, `npm run typecheck`, `npm run lint`, `npm run
   build` — all green.
2. `npm run svg:survey class`; `npx jiti scripts/svg-conformance-census.ts
   class`; record both.
3. `npx tsx tools/render-all.mts measurements/b3.json`.
4. `npx tsx tools/pin-diff.mts measurements/b2.json measurements/b3.json`.
   Journal one row per riser, `dotEqual` flip, or conformant→non-conformant
   transition with its mechanism (stop 5 if unexplained). Expected movers:
   the 14 GEO2 note fixtures, `fogexa`/`pecabi`/`sanixi`/`zepeki` (E6),
   `sodizo`/`xicipi`/`gujigi`/`kacico`/`fomofi` (E13), `jovigo`; re-verify
   `lipazi-06-care921` moves from batch 2's structural presence to
   byte-exact or names its residual.
5. `npx jiti scripts/dot-sync-report.ts class` — must still read 710/711
   (this batch is render-only plus one new link group, not a DOT-attribute
   change; a drop here is stop 6).
6. Pin every fixture that is survey-conformant AND census 0-diff into
   `oracle/goldens/svg-class/ratchet.json` + `<slug>/golden.svg` (copy
   `in.svg` verbatim; verify with `cmp`).
7. `npm run svg:survey class`; commit the re-surveyed
   `tests/oracle/svg-conformance/parity-class.json`.
8. `npm run parity:dashboard`; commit `docs/parity-report.md`.
9. `fixtures.md`: fill the existing `after batch 3` column for every row whose
   `buckets` column contains `B5`.
10. Tick batch 3's `[ ]` to `[x]` in `README.md`'s batches table.
11. JSON-reporter collected test count == on-disk test file count (stop 7).
12. Commit.

## Write-set

`tests/oracle/svg-conformance/parity-class.json`, `oracle/goldens/svg-class/
ratchet.json`, `oracle/goldens/svg-class/<slug>/golden.svg` (new pins only),
`docs/parity-report.md`, `plans/class-divergence-drive/measurements/
b3.json`, `plans/class-divergence-drive/fixtures.md`,
`plans/class-divergence-drive/decision-journal.md`,
`plans/class-divergence-drive/README.md` (tick only),
`.agent-notes/cdd-close-b3.md`.

## Acceptance criteria

- Given `pin-diff.mts b2.json b3.json`, then every transition has a
  journaled mechanism and none is unexplained
- Given the four gates, then all exit 0
- Given `dot-sync-report.ts class`, then the fraction is still 710/711
- Given `fixtures.md`, then every `B5`-bucket row has a filled `after batch 3`
  cell, including `jovigo`/`ponono`/`sumocu`
- Given the JSON-reporter run, then collected count equals on-disk count

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the close commit; a newly-added golden directory is
removed with it.

## Quality bar

Same four gates, plus the survey/census/pin-diff/dashboard sequence
completing without a `timeout` verdict (stop 7) and without an unexplained
mover (stop 5).

## Boundaries

Always: re-verify `lipazi-06-care921` explicitly — it is the one fixture
whose T7 (batch 2) output depended on this batch's T8 fix. Ask first:
nothing beyond the README stop conditions. Never: rebuild the DOT cache or
repoint the oracle symlink (D12); pin a fixture that is survey-conformant
but census non-0-diff, or vice versa (D3).

## Commit

`chore(cdd-b3): close batch 3 — B5 notes`

Body: counts before/after; names the fixtures pinned this batch; the
`lipazi` re-verification result.
