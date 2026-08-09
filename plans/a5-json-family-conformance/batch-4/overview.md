# Batch 4 — close-out

Brings the mission to its exit bar and leaves the record a later reader can act
on. The bar is **100% conformant minus named divergences** (maintainer ruling
2026-07-14): every non-conformant fixture must be carried by a named
`DIVERGENCES.md` or ledger entry. A number without attribution does not meet it.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T9 | per-fixture attribution of every remaining miss | orchestrator (inline) | `plans/a5-json-family-conformance/ledger.md` | T8 | [x] **92/92 named, 5 mechanisms** |
| T10 | divergence records + mission-index close-out | orchestrator (inline) | `DIVERGENCES.md`, `planning/mission-index.md`, `oracle/goldens/svg-{json,yaml,hcl}/README.md` | T9 | [x] |

Sequential — T10 writes up what T9 attributes.

## The attribution standard

Set by G1-I10 and met by G2 (718 fixtures), G3 (80), G4 (271): **every**
fixture is individually named, either pinned in the ratchet or attributed to a
numbered mechanism. Not "the remaining 14 are label-placement issues" —
fourteen rows, each with a mechanism, origin, and evidence.

## Note on T10's agent

`technical-writer` has no `Edit` or `Bash` tool and rewrites whole files. After
it runs, diff with `git diff --numstat` and run the gates yourself — do not
take its completion report as verification.

## Exit — the mission's exit bar

- json, yaml, and hcl each at 100%-minus-named-divergences.
- Every non-conformant fixture carried by a `DIVERGENCES.md` entry or a
  `ledger.md` row.
- Every dot-engine defect found during the mission filed in
  `docs/graphviz-issues/` (issue file **and** TRACKER line) — a finding that
  lives only in a mission ledger is not filed.
- Mission-index A5 flipped to `done` with its measured outcome, in the style of
  the other closed rows.
- Cold tree ×2 green; all four gates green.
