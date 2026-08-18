# T8 — F7: the `clusterPosMap: undefined` fallback (G4)

Return only the structured result — no preamble, no trailing summary. Do not
infer unstated requirements; do not spawn subagents.

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
SI28's largest composite group (300 px). `materializeSpecs(..., clusterPosMap:
undefined, ...)` makes `materializeCluster` fall back to
`boundingBox(children)` (`src/diagrams/state/state-composite-geo.ts:377-382`),
dropping the nested cluster's title bar/frontier ink that jar's `Cluster`
always includes (`svek/Cluster.java:410-436`). TWO call sites:
`buildPlainAutonomSpec` (`state-composite-autonom.ts:195`) and
`regionInkGeometry` (`state-composite-concurrent.ts:129`). SI28 closed
bajelo/lojeju/nuvura (bit-exact), cupesu (width exact, height 14.1 px
unexplained on the buggy side), darime/giniti/lumamo (exact), jetuse (height
exact, width 5 px residual), fotuje (structurally same, numeric closure failed
on the probe). Read `SYNTHESIS.md` §1 G4 + `findings/composite-a.md`,
`concurrent-region.md` records; the correct sibling call at
`state-composite-geo.ts:480`; `decisions.md` D5/D8; CLAUDE.md.

## Task
1. Pass the real `clusterPosMap` at both call sites (mirror `:480`); read
   `Cluster.java:380-450` and `ClusterHeader.java` to confirm the title/frontier
   terms `materializeCluster` already produces are the ones the jar folds.
2. Re-run the harness on the nine fixtures. Journal `jetuse-93` width and
   `fotuje-06` residuals if they survive (push-forward) — do not chase them
   here; do NOT touch `layout-ink-extent.ts` (T9 owns it).
3. Correct the stale comments SI28 flagged: `state-composite-autonom.ts:
   114-118` ("jar-verified byte-exact on bajelo") and `:160-165`
   (fotuje/rovese "jar-verified") — state what is true now, with the harness
   numbers.
4. Ratchets for the closed fixtures. TDD: unit test with bajelo's `in.puml`
   asserting the composite's declared width/height (jar values from
   `svek-N.dot`).

## Write-set
`src/diagrams/state/state-composite-geo.ts`, `state-composite-autonom.ts`,
`state-composite-concurrent.ts`, `tests/unit/state/state-composite-cluster-ink.test.ts`,
ratchet entries.

## Read-set
Records above; `state-composite-geo.ts:340-490`; `state-composite-autonom.ts:
100-220`; `state-composite-concurrent.ts:100-160`; `state-composite-cluster.ts`
(materializeCluster/resolveClusterComposite); Java `svek/Cluster.java:380-450`,
`svek/ClusterHeader.java`, `svek/SvekResult.java:120-140`,
`svek/InnerStateAutonom.java:180-200`.

## Acceptance
- Given a graphviz-cluster child inside an autonom or concurrent pass, then `materializeCluster` receives the real `clusterPosMap` and the title/frontier ink is folded (`Cluster.java:410-436`).
- Given bajelo, cupesu, lojeju, nuvura, darime, giniti, lumamo, then rows exact; jetuse-93 height exact; fotuje-06 re-measured and journaled.
- Given `harness-diff.py`, then 0 rows appeared or grew; `render-manifest --diff` moves are all listed/jar-ward.
- Given the two stale comments, then they are rewritten with current numbers.

## Observability / Rollback
Harness rows; DOT-parity ratchet. Reversible.

## Report (≤600 tokens)
Rows per fixture; the residuals (jetuse width, fotuje, cupesu height) with
numbers; comment rewrites; manifest moves.
