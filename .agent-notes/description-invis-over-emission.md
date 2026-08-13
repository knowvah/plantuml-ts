# Observation: the description engine emits one `style=invis` edge the jar does not

- **Context**: found while implementing `constraint=false` (2026-08-13). The
  plan folded `style=invis` into the same comparator widening on the grounds
  that it "already matches" — measured at 0 mismatches across 97 class
  fixtures. That measurement was **class-only**, and description does not
  match. Comparing it immediately failed four pinned description fixtures.

- **Finding**: on `component/balopu-66-jagu236`,
  `component/dujodu-23-viba393`, `component/saroje-26-vabi530` and
  `component/tujica-34-tire129`, our DOT carries **one** `style=invis` edge
  where the oracle carries **zero**. Edge counts are otherwise identical (6/6,
  9/9, 6/6, 6/6), so this is one extra invisible edge per fixture, not a
  structural difference in the graph.

  | fixture | ours | oracle | edges |
  |---|---|---|---|
  | `balopu-66-jagu236` | 1 | 0 | 6 / 6 |
  | `dujodu-23-viba393` | 1 | 0 | 9 / 9 |
  | `saroje-26-vabi530` | 1 | 0 | 6 / 6 |
  | `tujica-34-tire129` | 1 | 0 | 6 / 6 |

- **Impact**: `style=invis` is structural, not cosmetic — an invisible edge
  still constrains rank assignment, so an extra one can move nodes. It is
  present on 166 corpus fixtures and compared by **nothing**: the same
  blind spot `sametail` and `constraint` had. Closing it is blocked on this
  divergence, because the check cannot go live while four pinned fixtures fail
  it.

  Two ways forward, neither attempted here: fix the over-emission (find why
  the description engine adds an invisible edge the jar omits — start at
  `link-edge-attrs.ts:227`'s `link.hidden` and at whatever synthesises note or
  layout edges), or backlog the four the way `direction-backlog.json` already
  backlogs known-unequal direction fixtures, so the check goes live everywhere
  else. The backlog precedent is the cheaper first step and keeps 1,379 files
  guarded.

- **Confidence**: High — measured directly by comparing emitted DOT against
  each fixture's cached `svek-1.dot`, and independently confirmed by the
  parity suites failing exactly these four on `flagsOk` when `invis` was
  included in the comparison.
