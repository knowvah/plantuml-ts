# Batch 1 — re-audit every non-conformant object fixture

**This batch writes no production code.** Its deliverable is an
evidence-backed attribution for all 80 fixtures, replacing G3's falsified
residue table (`decisions.md` D1, D5).

T3, T4 and T5 are genuinely parallel: each is read-only on `src/` and writes
its own audit file. T6 merges them.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3](T3-audit-size-cluster.md) | Audit the 8 DOT size-backlog slugs | Explore | `plans/object-close/audit-size.md` | T1 | [ ] |
| [T4](T4-audit-nonnumeric-cluster.md) | Audit the 19 fixtures carrying non-numeric diffs | Explore | `plans/object-close/audit-nonnumeric.md` | T1 | [ ] |
| [T5](T5-audit-geometry-cluster.md) | Audit the remaining ~30 purely-geometric fixtures | Explore | `plans/object-close/audit-geometry.md` | T1 | [ ] |
| [T6](T6-merge-ledger.md) | Merge the three audits into the authoritative ledger + prioritized queue | general-purpose | `plans/object-close/ledger.md` | T3, T4, T5 | [ ] |

## Cluster boundaries

Assigned from the planning measurement; **T1's fresh numbers are
authoritative** if they disagree. Reclassifying a fixture between clusters is
a push-forward condition — record the move in the journal and make sure the
receiving audit picks it up.

- **T3 (8):** `tobuka-93-jale775`, `fonulu-92-libi014`, `lisepi-64-mudo307`,
  `togixe-65-bepo490`, `lunike-70-xipi897`, `pikuba-31-faxo766`,
  `tenalu-53-meri239`, `fafozi-27-reja300`
- **T4 (19):** every fixture with ≥1 non-numeric diff, minus those already in
  T3 — includes the `181818`/`8000`/`7121` "max delta" rows, which are
  **colours parsed as numbers**, not geometry.
- **T5 (~30):** the purely-numeric remainder.

## Why the audit precedes the fixes

G3 closed with 46 fixtures filed as sub-pixel graphviz noise. Zero of them are
under 0.5px. Working the queue before correcting the attribution would repeat
that: the fix order in `decisions.md` D3 is only correct if the clusters are
real.

## Batch exit

- Every one of the 80 slugs appears in exactly one audit file, then in
  `ledger.md`.
- Every non-conformant row names a mechanism with a
  `~/git/plantuml/src/main/java/net/**` `file:line`, **or** carries a
  measured `gvts-blocked` verdict with the delta that justifies it.
- `ledger.md` ends with a queue ordered by shared-mechanism reach, ready to
  seed batch-2.
- No production file changed in this batch.
