# T5 report (group url)
Commit (amended, single): see git log (dur/T5). Files: src/core/svek/Cluster.ts (D7-approved); src/diagrams/description/renderer-cluster.ts; docs/catalog.md; tests/fixtures/description-url/{package,rectangle,frame,nested}-url.{puml,svg}; tests/unit/description/dur-t5-group-url.test.ts (7 tests).

## Target rows (authored; jar svgs from scripts/oracle-render.sh)
package-url, rectangle-url, frame-url, nested-url: before = jar has 1/1/1/2 <a>, ours 0 (no anchor); after = compareSvg diffs [] , pass true, <a> count equals jar.

## Diagnosis artifact
- Mechanism: container geo carries url (T4) but Cluster drawing never opened an anchor; core Cluster.drawU has no url field.
- Origin: Java svek/Cluster.java:339-341 (url = group.getUrl99(); if non-null ug.startUrl(url)) after ug.startGroup(uGroup) :336, and finally :376-379 (closeUrl then closeGroup). Port: src/diagrams/description/renderer-cluster.ts (withGroupUrl, NotedCluster.drawU), core src/core/svek/Cluster.ts:285-306.
- Causal chain: no startUrl -> no <a> inside <g class="cluster"> -> childCount diff on the cluster g. Anchor wraps exactly the ClusterDecoration output (border + title); kermor notes (:302-307) draw before startGroup, outside the anchor and the group.
- Ruled out: anchor around the whole <g> (jar svg shows <g class="cluster"><a>...</a></g>); anchor wrapping the comment (comment is before <g>); LimitFinder pass lacking startUrl (hit as "t.startUrl is not a function" on first attempt; fixed with optional calls, as in UGraphicNo no-op).

## Surveys before -> after (own worktree)
- component: 187/13/66 -> 188/13/65; mover tukipe-82-ziva562 diverged -> conformant (corpus fixture with "url for Foo is [[...]]" on a node group; jar has the cluster <a>). Losses 0.
- usecase: 62/4/27 (+1 oracle-error) unchanged, 0 movers.
- unknown: 486/16/323 unchanged, 0 movers.
- c4: 2/0/9 unchanged, 0 movers.
- class: 723/0/0 unchanged, 0 movers. state: 78/11/184 unchanged, 0 movers. (Class/state before taken by temporarily restoring base src in my worktree.)
- All trees re-run after the final (core) implementation.
(D6 said no corpus fixture has a group url; tukipe has one via "url for X", not inline [[ ]].)

## Tests
Targeted run (tests/unit/description, tests/architecture, description.* conformance, layout-parity ratchet): 87 files collected, 87 passed, 2041 tests passed. typecheck clean, eslint clean, prettier applied. Catalog not regenerated (no exports changed).

## Final implementation (D7 approved)
- src/core/svek/Cluster.ts: new exported ClusterUrl; ClusterGroupInfo.url?; drawU calls startUrl?.(url) after startGroup and closeUrl?.() in finally before closeGroup (Cluster.java:339-341,376-379), optional-guarded for LimitFinder. renderer-cluster.ts passes node.url; the Proxy is removed and NotedCluster is back to its original form.
- Consumers: core Cluster/ClusterGroupInfo are used only by src/diagrams/description/renderer-cluster.ts. Class-engine cluster anchors are drawn by src/diagrams/class/renderer-group.ts / renderer-url.ts, not core Cluster, so no double-wrap; not migrated.
- D7 guards (class/object/state golden ratchets, class/object/state dot-parity, wrapper-parity, layout-parity ratchet, description golden ratchet) plus tests/unit/description, tests/architecture, tests/unit/core/svek: 133 files collected, 132 passed, then catalog.test failed until npm run catalog regenerated docs/catalog.md (new export); re-run architecture + T5 test: 11 files, 73 tests pass. Typecheck and eslint clean.
- tukipe-82-ziva562 (component) shows the corpus has a group url via "url for X is [[...]]".
- Unverified: group url with kermor notes; empty-package url.
