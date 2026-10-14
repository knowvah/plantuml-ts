# description-svek-wrappers (dsw) — findings (2026-10-14)

## Observation: three measurement instruments disagreed about the same fixtures
- **Context**: closing batch 3. The survey and the tightened description-parity ratchet read
  lesori, ravodu, ruciga and tuliba as `dotEqual`, but `dot-parity.json` read them unequal.
- **Finding**: `scripts/dot-sync-report.ts` rendered component/usecase with the stdlib store only.
  It had no sprite/emoji/utility asset stores, so `<<$archimate/…>>` stereotypes measured as text
  and the title TABLE under-sized. It now wires the survey's stores, for component/usecase only;
  class/object/state stay frozen per its own doc comment. Separately, the dashboard's
  `loadSurveyByType` let the stale legacy `parity.json` (2026-09-21) override the per-type
  `parity-<type>.json`. That is why the dashboard showed component 0/13/253 while the real survey
  said 67/66/133.
- **Impact**: when two instruments disagree, diff their render options (asset stores, include
  stores, measurer) before chasing the fixture.
- **Confidence**: High

## Observation: the description golden ratchet's eligibility still reads the legacy parity.json
- **Context**: re-pinning at T6.
- **Finding**: `description.golden.ratchet.test.ts` AC3 requires `dotEqual: true` in
  `tests/oracle/svg-conformance/parity.json`. That file is the stale legacy one and covers only
  component/usecase. bootstrap-0 and ruziru are zero-diff but read `dotEqual: false` there, so
  they cannot be pinned. Unknown DESCRIPTION rows (56 conformant) and c4 rows have no ratchet home
  at all.
- **Impact**: the eligibility source should move to the per-type survey files before the next
  description re-pin.
- **Confidence**: High

## Observation: compareSvg re-aligns a whole page when its element count changes
- **Context**: appending one credit line to `about` raised its score 8 → 138. At T6, fidati,
  kofovu and tojitu became layout-exact and their census counts rose.
- **Finding**: with a different element count, or a pre-existing entity-order mismatch
  (fidati/tojitu carry identical `@id` diffs at b0 and b4), the diff pairs elements with unrelated
  ones. A correct geometry change then moves the count either way.
- **Impact**: for a riser, first check whether the `@id`/childCount diffs predate the change. If
  they do, the rise is pairing, not geometry. This is the same family as
  memory comparesvg-count-not-monotonic.
- **Confidence**: High

## Observation: what the jar's kermor path actually prints
- **Context**: T4c (`ClusterDotStringKermor.java`).
- **Finding**:
  - `alpha` is printed only when the group has a TOP or BOTTOM note (`useAlphaAndBeta`,
    :167-174), labelled with the TOP note's TABLE.
  - `beta` is always printed (labelloc=b, BOTTOM note TABLE, rank=source inside).
  - `gamma` is always printed (labelloc=t, title TABLE, members; it is the drawn cluster, whose
    rect is gamma's bb clipped at the port centres).
  - `protection0/1` are defined but never called.
  - The root `empty` point must be created after the edge endpoints and before the cluster
    members (rank tie order).
- **Impact**: kermor group notes are parsed and sized now but still not DRAWN. The jar draws the
  note before the cluster (Cluster.java:300-307). That is open work.
- **Confidence**: High

## Observation: description LEFT/UP links change graphviz node creation order
- **Context**: T8/T9 deroxu.
- **Finding**: the jar inverts `-left->`/`-up->` links (CommandLinkElement.java:325-326) and
  declares the inverted link's start node ahead of other shapes (Cluster.java:195-212,
  DotStringFactory.java:188-190). Description never set `DotInputEdge.inverted`, so graphviz
  ranked and mincrossed from a different order: deroxu's canvas was 4958 wide against the jar's
  3757. The core already honoured the flag (class used it).
- **Impact**: any engine that builds `getInv()` links must carry `inverted`. Check state and
  others before blaming dot-engine for ordering differences.
- **Confidence**: High
