# T2a — notes beside their message; `&` parallel (YGauge)

Agent: `typescript-pro` (opus), worktree `sdd2-T2a`. Commit:
`fix(sequence): mirror teoz parallel gauge and notes on messages`.
Read [../task-contract.md](../task-contract.md) first. Think through the
tile model before writing code; it is the shape later tasks build on.

## Mechanisms (research C: NOTEMSG, PAR — land together, D3)
1. **NOTEMSG.** A `note left/right` attached to a message is drawn beside
   it, at the message tile's top: `teoz/TileBuilder.java:102-119` wraps the
   message tile in `CommunicationTileNoteLeft/Right`
   (`CommunicationTileNoteLeft.java:84-91,124-133,135-139`;
   `CommunicationTileNoteRight.java:97,139,144-147`; self:
   `CommunicationTileSelfNoteLeft/Right.java:87,128-133`). Wrapped height
   = max(message tile, note). The port stacks the note below
   (`sequence-layout-note.ts:184-212` `handleNoteEvent`, `cursor.y +=
   noteH`). metano: jar note at 47+5=52, port 79 (delta = message tile
   height 27).
2. **PAR.** `&`-prefixed messages and notes share one arrow line:
   `teoz/YGauge.java:124-145` (`createParallel`): line at origin + max(cr_i)
   where cr_i is each tile's contact offset from its top
   (`CommunicationTile.java:180-182`, `NoteTile.java:72-74`); each tile's
   top = contact − cr_i; group bottom = max. Parallel flags:
   `CommunicationTile.java:114-117`, `CommunicationTileSelf.java:87-90`,
   `NoteTile.java:94-97`. The port parses `parallel` and ignores it
   (`sequence-layout-events.ts:107-112,145-187`). mepaxe: second arrow
   jar y=66, port 93.
   Not covered by the prototype: parallel *groups* and
   `LiveBoxes.isParallelWith` (`LiveBoxes.java:298,311`) — port them if a
   fixture needs them (the latter belongs to T2b's module: journal it).
3. **Stale premise (D10).** Rewrite the comment at `ast.ts` (now
   `ast-message.ts` after T0d) that says `parallel`/`anchor` are not drawn
   because "the classic renderer reads neither": the jar is always teoz.

Build `sequence-y-gauge.ts` mirroring `YGauge`; publish
`MessageTileGauge` (batch overview) for every message and exo event.
Prototype reference: `prototypes/m_notemsg.patch`, `m_par.patch` (never
apply — D2).

## Targets
`prototypes/expected-zero.json` → `zeroAfterTask.T2a` (35 rows, e.g.
metano, mepaxe, lojore, mizugi, cazipo, telizo, keluvo, texopo). The
other rows listed under `needs_NOTEMSG`/`needs_PAR` fall here and reach
zero after T2b.

## Write-set
`src/diagrams/sequence/sequence-layout-events.ts`, `sequence-layout-
note.ts`, `sequence-layout-message.ts`, `sequence-layout-exo.ts`, new
`sequence-y-gauge.ts`, `ast*.ts` (comment + any field the gauge needs),
their tests.

## Read-set
`research/research-c-vertical.md` (NOTEMSG, PAR); `prototypes/m_notemsg.
patch`, `m_par.patch`; `sequence-layout-events.ts` (whole);
`sequence-layout-note.ts:150-213`; `sequence-layout-message.ts:35-125`;
the Java above.

## Acceptance
- Given `A -> B : m` + `note right : n`, when laid out, then the note top =
  the message tile top + the jar's offset and the tile height =
  max(message, note) (unit test citing `CommunicationTileNoteRight.java`).
- Given `A -> B : 1` + `& B -> C : 2`, then both arrows share one y
  (`YGauge.java:124-145`, unit test).
- Given classify, then all 35 `zeroAfterTask.T2a` rows are zero-diff (or
  each straggler has a journaled mechanism), and no pinned row changes.
- Given the 3-row LOO warning (NOTEMSG without PAR raised 3 rows), then
  both mechanisms land in this one commit.
