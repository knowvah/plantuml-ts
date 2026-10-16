# T4 report — node URL into the geo; entity <a> at render

## Commit
5f54d9748 feat(description): draw entity url as <a> around the entity (branch dur/T4, base 0a365070a)
Files: src/diagrams/description/{layout-helpers,layout-helpers-types,layout-dot-tree,renderer-entity}.ts;
WRITE-SET EXTENSION: src/diagrams/description/layout.ts (+2 lines); docs/catalog.md (regenerated, new export);
tests/unit/description/dur-t4-entity-url.test.ts (new, 8 tests).
(layout-types.ts untouched: DescriptionNodeGeo lives in layout-helpers-types.ts; layout-types.ts holds ContainerDesc.)

## Render-diff (after; before = survey verdict diverged at childCount for all four)
component/gacida-77-joku810 pass=true structural=0 numeric=0 (before: diverged svg/g[1]/g[1][childCount])
usecase/lizutu-99-mapa855   pass=true 0/0 (before: diverged g[3][childCount])
usecase/sadeja-25-tina867   pass=true 0/0 (before: diverged g[1][childCount]); title="This is Dog" matches
usecase/kolibo-58-rata251   pass=true 0/0 (before: diverged g[1][childCount])

## Diagnosis artifact
- Mechanism: renderer-entity.ts passed entity.url = null to EntityImageDescription, so core's startUrl/closeUrl
  (EntityImageDescription.ts:413-419) never ran; the geo carried no url, and the topurl needed to resolve a
  relative [[token]] exists only on the Theme.
- Origin: Java EntityImageDescription.java:139 (this.url = entity.getUrl99()), :304-305 startUrl, :327-328 closeUrl;
  CommandCreateElementFull.java:333-337 (UrlBuilder(skinParam topurl, STRICT).getUrl(urlString)).
  Port: renderer-entity.ts (was :155 url: null), layout-dot-tree.ts buildGeoNode, layout-helpers.ts degenerateSingleLeaf.
- Causal chain: no url -> no <a> -> jar's extra <a> child counts as a childCount diff on the entity <g>.
- Ruled out: renderer drawing (core already draws <a> from entity.url, proven by tests going green with only the
  plumbing change); Url private fields (copied to plain {url,tooltip} via getUrl()/getTooltip()).
- Seam: resolveNodeUrl(token, topurl) in layout-helpers.ts, called at leaf + container branches of buildGeoNode and in
  degenerateSingleLeaf (single-leaf diagrams such as kolibo/topurl probe take that path and bypass buildGeoTree).
- topurl transport: PortClusterCtx.topurl? (layout-dot-tree.ts) and, for the degenerate path, boxOpts typed
  BoxSizingOpts & { topurl?: string } (avoids editing core leaf-sizing-consts.ts). layout.ts sets both from theme.topurl.
- Jar probes (scripts/oracle-render.sh, /private/tmp/claude-501/dur-T4/p1,p2): `skinparam topurl http://base/` +
  `component a [[page]]` -> href/title "http://base/page"; port with [[pp]] -> jar emits no <a>.

## Other leaf drawers (getUrl99 users)
Java images with getUrl99: Class, Object, Map, Json, Activity, State*, Chen*, Lollipop*, EmptyPackage, UseCase, Note.
In this port keyword leaves, actors and usecases all route through EntityImageDescription (covered). EntityImageNote
(EntityImageNote.java:194-205, startUrl) is NOT covered: note drawing is renderer-note.ts / renderer-note-opale.ts
(outside write-set) and notes carry no url from T1a. EntityImageEmptyPackage (:102,149) is the demoted empty-container
leaf; it goes through the same buildGeoNode leaf branch and renderer-entity here, so it is covered by the same url field.
Not verified against a corpus fixture: no empty-package url fixture checked.

## ELK
description-elk-adapter.ts structuralGeoTree calls buildGeoTree with a ctx lacking topurl: ELK-path geo gets the url
resolved WITHOUT topurl prefix. Needs `...(theme.topurl ...)` in that ctx (not my file; theme not in scope there
without threading). Report to lead.

## Surveys (before = clean base in this worktree with src reverted; after = commit)
component 184/13/69 -> 185/13/68   mover: gacida-77-joku810 diverged -> conformant
usecase   59/4/30 (+1 oracle-error) -> 62/4/27   movers: kolibo-58-rata251, lizutu-99-mapa855, sadeja-25-tina867
unknown   486/16/323 -> 486/16/323  no movers
c4        2/0/9 -> 2/0/9            no movers
Losses: 0. (conformant/structural/diverged counts.)
Method note: a first "before" taken from a separate `git worktree` of the base was INVALID (gitignored assets/stdlib,
oracle/dist absent -> C4 includes unresolved -> gikaju-64-bari602 showed conformant->diverged error-page). Redone by
reverting src in this worktree. Do the same when measuring a base: ignored dirs are not in a fresh worktree.

## Tests
Full targeted run: `npx vitest run --maxWorkers=4 tests/unit/description tests/architecture
tests/oracle/svg-conformance/description.*.test.ts tests/oracle/svg-conformance/layout-parity.ratchet.test.ts`:
84 files, 2022 tests; only failure was catalog drift, fixed by `npm run catalog`. Re-run of dur-t4 test +
tests/architecture + description.golden.ratchet + layout-parity.ratchet: 13 files, 920 tests, all pass.
typecheck clean; eslint/prettier clean (lint-staged ran on commit).

## Residuals / flags
- layout-dot-tree.ts is 633 lines (626 before; >500 cap, pre-existing); +7 lines mine; the complexity hook flagged it.
  Needs a split by whoever owns the file.
- buildGeoNode now has 8 params (unchanged count; topurl rode on PortClusterCtx).
- Flagged deviation (D4): Java resolves url at parse time; we resolve at the layout seam.
- Container url is set on geo (T5 contract) but not yet drawn (cluster <a> is T5).
- No givape/tukipe/jazabe measurement (batch close).
