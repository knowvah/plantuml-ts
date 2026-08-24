# T8 — re-pin what the repairs moved

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.

Batches 2–5 re-route **75 fixtures** across five engines. A fixture that
changes engine changes every byte it renders, so the baselines that pin those
bytes are now stale for exactly those fixtures — and for no others.

This is the first task permitted to touch a baseline (D5). Everything before
it was measured against pins that deliberately did not move, which is what
made each batch's effect attributable.

## Task

Re-pin, from fresh measurements, every baseline entry the repairs moved —
and **only** those.

## Read-set

- `plans/routing-heuristic-repair/decision-journal.md` — the per-batch
  records of which fixtures moved and to which engine. This is the authority
  for what may be re-pinned; a fixture that moved without a journal entry is
  a finding, not a re-pin
- `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts` — the
  re-pin contract in its header, particularly **which quantity is gated**
  (`weightedScore`, not `diffCount`) and why `diffCount` may legitimately rise
  beside a falling `weightedScore`
- `oracle/goldens/svg-conformance/routing-baseline.json` — T1's manifest;
  every fixture that now agrees moves to `status: "agree"`
- `.agent-notes/comparesvg-count-not-monotonic.md` if present, and the D5
  note in `plans/sequence-root-chrome/decisions.md`

## Write-set

- `oracle/goldens/svg-conformance/routing-baseline.json`
- the `ratchet.json` / `diff-baseline.json` files under `oracle/goldens/`
  that the journal records as moved

Nothing else. **Enumerate the exact file list in the journal before writing
any of them** — an unenumerated re-pin is indistinguishable from silencing a
regression.

## Acceptance criteria

1. Given the routing gate, then **0** entries are `known-misroute`, 4 are
   `jar-error`, and the rest are `agree`
2. Given every re-pinned entry, then its numbers come from a fresh
   measurement and its `measuredAt` / `measuredAgainstCommit` are updated —
   never a hand-edit chosen to make a gate pass
3. Given the 482 promoted zero-diff fixtures across the 10 `ratchet.json`
   files, then **none is de-promoted**. This is the mission's
   highest-consequence check: a de-promotion means a routing change moved a
   fixture that was byte-exact against the jar
4. Given any baseline entry **not** named in the journal, then it is
   unchanged — asserted by `git diff`, not by inspection
5. Given a `weightedScore` that rose anywhere, then it is **not** re-pinned;
   it is diagnosed. A rise has no benign reading (D5,
   `plans/sequence-root-chrome/decisions.md`)

## Quality bar

All four gates green.

## Observability

The mission's SLI reaches its target here: routing misroutes **75 → 0**.

## Rollback

This task is what makes batches 2–5 revertible as a range; on its own it is a
data change and trivially revertible.

## Boundaries

- **Always:** re-pin from a fresh measurement, and enumerate the file list
  first
- **Never:** re-pin a risen `weightedScore`; de-promote a zero-diff fixture
  to make a gate pass; touch any `src/**` file
- **Ask first:** if a fixture moved that no journal entry predicted — that is
  an unattributed routing change and it must be explained before it is pinned

## Commit

One commit: `chore(T8): re-pin the baselines the routing repairs moved`
