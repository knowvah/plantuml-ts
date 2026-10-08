# add4-T3k -- 4 activity parser gaps (page / link / hide footbox / hide stereotype)

## Commits
- feat(activity): accept page, footbox, hide/show and link common commands
- docs(add4-T3k): report

## Java -> ours
All in `src/diagrams/activity/dispatch-common-commands.ts` (new handlers
`tryIgnoredCommonCommand`, `tryLink3`), registered in `node-dispatch.ts`
LINE_HANDLERS right after `tryScale` (+9 lines incl. import; outside the
stated write-set, minimal hunk -- LINE_HANDLERS is the only registry).
- `page NxM`: CommandPage.java:55-62 regex, :88-93 executeArg. The two setters
  feed only `PSystemUtils.splitPng` (PSystemUtils.java:178, PNG multi-file
  splitter), so SVG output is unaffected: accepted, no state kept. Unported
  drawing effect: none for SVG (PNG-only split). Zero counts -> upstream error
  (:88-89) -> we do not match -> refusal.
- `link #color[;]`: CommandLink3.java:59-63 regex, :76-83 execute ->
  ActivityDiagram3.setColorNextArrow (:470-475) = setNextLink(LinkRendering.
  create(rainbow)) -- identical to CommandArrow3.java:99-103 with no label, so
  lowered to a style-only `arrow-label` node (`style:'#red'`, label ''). Unknown
  color (getColor==null -> no effect upstream) is not validated here.
- `[hide|show] footbox`: CommandFootboxIgnored.java:55-56 (ok, no effect);
  registered ActivityDiagramFactory3.java:105.
- `hide|show [GENDER] [empty] PORTION`: CommandHideShowByGender.java:59-69
  regex; executeArg :154-159 -- for an activity diagram "Just ignored".
  (class/description/sequence engines have their own ports; nothing shareable --
  each is bound to its engine's AST.)

## Per-fixture weighted score (compareSvg deterministic, scratch script)
- bopele-45-bufo031: 0
- cebuci-75-zona564: 0
- fugoko-04-lafo140: 0
- tidoda-12-juxu745: 4 -- group `rectangle outerAction {` ignores
  `skinparam rectangle { BackgroundColor/BorderColor/RoundCorner }`: jar
  rect fill #F00 stroke #00F rx/ry 12.5; ours fill none stroke #000 no rx.
  Mechanism: CommandPartition3.java:89-103,150,161-165 -- the group keyword
  selects a USymbol and `FtileGroup.getStyleSignature(symbol)` merges the
  symbol's SName style (skinparam rectangle). Our group rendering never keys
  style on `groupType`. Owner: activity group style/layout (not parser).

## Gates
- tests/unit/activity/add4-T3k-ignored-common-commands.test.ts: 11 pass.
- typecheck, eslint: clean.
- Targeted run (conformance+activity+unit+architecture): only failures are the
  12 expected `[FIXED]` baseline rows (ratchet/style/text x 4 slugs; orchestrator
  re-pin) and `tests/architecture/catalog.test.ts` -- docs/catalog.md drift from
  the 2 new exports; run `npm run catalog` (docs/catalog.md is outside my
  write-set). 406 pinned goldens unchanged (no pinned row failed).
