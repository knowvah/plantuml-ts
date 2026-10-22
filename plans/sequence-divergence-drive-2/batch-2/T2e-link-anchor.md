# T2e — LinkAnchor `{a} <-> {b}`

Agent: `typescript-pro` (sonnet), worktree `sdd2-T2e`. Commit:
`feat(sequence): port the link-anchor command and its draw pass`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (research D §2: fojomu, zoturo, nizuzi)
`sequencediagram/command/CommandLinkAnchor.java:55-63` (regex), `:85-90`
(execute); registered `SequenceDiagramFactory.java:155`. Drawn by
`teoz/PlayingSpace.java:129-134` → `LinkAnchor.java:82` (`drawAnchor`)
after the tiles, between the two anchored messages' contact points. The
message `anchor` (`{start}`) is already parsed; use T2a's
`MessageTileGauge.contactY` for each anchor's y. Read `LinkAnchor.java`
whole for the label, arrow heads and x.

## Targets
fojomu-60, zoturo-25, nizuzi-32 (nizuzi inside a group): render with 0
structural sites.

## Write-set
New `src/diagrams/sequence/command-link-anchor.ts`, new
`renderer-link-anchor.ts`, `sequence-command-registry.ts` (registration
only), `renderer.ts` (call the draw pass where `PlayingSpace` does),
`ast.ts` (the anchor-link node), their tests.

## Read-set
`research/research-d-structure.md` §2; `sequence-command-registry.ts`;
`renderer.ts` (draw order); T2a's gauge lookup; the Java above.

## Acceptance
- Given `{s} A -> B` … `{e} B -> A` and `{s} <-> {e} : 5s`, when parsed,
  then a link-anchor node exists (test) and fojomu renders.
- Given the 3 targets, then 0 structural sites; residual numbers journaled.
- Given the draw order, then the anchor is emitted where
  `PlayingSpace.java:129-134` emits it.

## Added at T2a hand-back (journal row 24)
Write-set + `src/diagrams/sequence/layout.ts`: `layoutSequence` must carry T2a's gauge map (`messageTileGauge(source, event)` over `EventProcessingContext.messageTileGauges`, module `sequence-y-gauge.ts`) out to the renderer. A self message's `contactY` is the loop middle.
