# T6 — Family sweep and mission close

## Context

T5 landed with all three targets exact. The entrypoint/exitpoint
family (~20 state fixtures with border-point children, incl. pesita,
bitaxo, kotagu) plus the full 271-fixture census can now re-measure.

## Task

1. Byte-compare the whole state census (`svg-conformance-census.ts
   state`, or the harness T5's sweep used): pin EVERY fixture reaching
   byte-exact zero-diff (existing ratchet convention: golden dir +
   sorted additive `ratchet.json` entry, `source: "dot-cache"`);
   all pre-existing pins must stay byte-identical.
2. `size-backlog.json`: remove entries for newly-pinned fixtures ONLY
   if the DOT-parity harness passes without them; tighten every
   improved entry; widen NONE (widening → full revert + STOP).
3. Library path only: check the issue-09 box in
   `docs/graphviz-issues/TRACKER.md` (fix in pinned .tgz + fixtures
   re-measured clean — both now true).
4. Journal per-fixture family results (pinned / residual with named
   mechanism). Record new censuses (pins before→after, backlog
   before→after).
5. Mission close: mark checkboxes; write the summary section at the
   bottom of `plans/g7-borderpoint-rank/README.md` (tasks completed,
   decisions flagged, gate results, follow-ups); flip Status to
   CLOSED.

## Write-set

`oracle/goldens/svg-state/*`, `oracle/goldens/state/size-backlog.json`,
`docs/graphviz-issues/TRACKER.md` (checkbox only),
`plans/g7-borderpoint-rank/*`.

## Acceptance criteria

- Given the census, when swept, then every zero-diff fixture is
  pinned and no pre-existing pin changed.
- Given the backlog, when written, then tighten-only holds.
- Given `npm test` with new pins active, then all ratchets, floors,
  and the DOT gate are green.

## Quality bar

`npm test && npm run typecheck && npm run lint && npm run build`
green. Pins byte-exact only. No git mutations.
