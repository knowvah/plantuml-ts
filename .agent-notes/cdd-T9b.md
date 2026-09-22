# T9b — style and number the note connector as a real link

## Java read (quoted, with file:line)

**(1) Style.** `command/note/CommandFactoryNoteOnEntity.java:342`:
`final LinkType type = new LinkType(LinkDecor.NONE, LinkDecor.NONE).goDashed();`
— the note<->host connector is an ORDINARY dashed `Link`, drawn by
`SvekEdge#drawU` like any other edge (`strokeWidth: 1`, `strokeDasharray:
'7,7'`, the SAME default this port's `renderer-edge.ts#renderEdge` already
gives every other dashed relationship, G2 N8). NEVER the note's own
`NOTE_STROKE_WIDTH`/`'4 4'` (that style is `EntityImageNote.java:275-289`'s
BOX outline only).

**(2) Id form.** `abel/Link.java:106-113` `idCommentForSvg()`:
```
if (type.looksLikeRevertedForSvg()) return e1.getName() + "-backto-" + e2.getName();
if (type.looksLikeNoDecorAtAllSvg()) return e1.getName() + "-" + e2.getName();
return e1.getName() + "-to-" + e2.getName();
```
`LinkType(NONE, NONE)` always satisfies `looksLikeNoDecorAtAllSvg()` ⇒
bare `entity1-entity2`. `entity1`'s name for the note side is
`diagram.getUniqueSequence("GMN")`'s value — the SAME shared `cpt1`
counter `class-notes.ts#addNote`'s `phantomSlot` burn already tracks (one
tick BEFORE the note's own `Entity` ctor tick), so `GMN<n> = creationIndex
- 1`. Jar-verified: `fogexa-30-zupo141`'s note has `creationIndex=3` (rank
1=`class dummy`, rank 2=discarded GMN phantom, rank 3=note ctor) ⇒
`GMN2-dummy`; `pecabi-95-demu756`'s note (target a package) ⇒
`GMN3-oft_openflow_types` (the host's OWN bare id, never the `zaent-*` DOT
point-anchor).

**(3) Entity order.** `CommandFactoryNoteOnEntity.java:342-357`:
`Position.RIGHT`/`BOTTOM` ⇒ `new Link(location, ..., cl1, note, type,
...)` (host, note — host is entity1); `Position.LEFT`/`TOP` ⇒ `new
Link(location, ..., note, cl1, type, ...)` (note, host — note is
entity1). `note-layout-groups.ts#groupEdge` (T9, pre-existing, NOT edited
this task) already builds its synthetic DOT edge with `from`/`to` in this
exact order (`NOTE_EDGE[position].fromNote`), so the routed spline's OWN
endpoints already encode the answer — `renderer-note-connector.ts
#noteIsConnectorSource` recovers it without touching that file (outside
this task's write-set) by comparing each endpoint's squared distance to
the note's own bounding-box center.

## Where the fix landed

- **New file `renderer-note-connector.ts`** (500-line-cap split of
  `renderer-note.ts`, pre-authorised): owns everything the connector
  `Link` needs that the note's own `EntityImageNote`-mirroring code must
  NOT — `buildConnectorPathData` (moved verbatim), `renderNoteConnectorPath`
  (new style), `noteIsConnectorSource`/`noteGmnName`/
  `resolveNoteConnectorEndpoints` (order + names), and
  `renderNoteConnectorLink` (the full `<g class="link">` assembly, called
  from `renderer.ts`'s edges phase AFTER `linkIds` is populated by real
  edges — same dedup-ordering requirement `linkIdForSvg` already
  documents for a real edge).
- `renderer-note.ts`: `renderPlainNote` no longer builds/returns a
  connector at all — box+text only. `renderNote` (used only by
  `renderEdgeNoteBox`'s "note on link" boxes, which always pass
  `connector: []`) simplifies to `renderPlainNote(...).entityParts.join('')`.
- `renderer-note-dispatch.ts`: `NoteConnector` drops its `.body` field —
  it now carries just `{ note }`; the leaf loop can no longer build the
  styled connector string at all (the dedup'd id isn't knowable until the
  edges phase), so it only decides WHETHER to defer one
  (`note.connector.length > 0`).
- `renderer.ts`: the `noteConnectors.forEach` loop shrinks to one call:
  `renderNoteConnectorLink(connector, theme, uidPlan, linkIds)`.
- `renderer-uid.ts` (pre-flagged batch-1 file, extension kept to the
  connector promotion only, per the orchestrator's own scoping):
  - `ClassUidPlanInput.notes[]` gained an optional `connector?:
    ReadonlyArray<unknown>` field — `NoteGeo`'s real `connector: Array<{x,y}>`
    satisfies it structurally (no adapter needed at `renderer.ts`'s
    `buildClassUidPlan({ ...geo, notes })` call site); the AST-derived
    plan (`classUidPlanInputFromAst`) never has it, so it stays
    `undefined` there — a behavior-preserving default for the ONE
    consumer of that path (`sametail`, zero note-connector reach today).
  - The `Ranked` union (moved to module scope so a new top-level
    `noteRankedEntries` helper could own the note-entry branch — the
    complexity hook blocked the original inline version at CCN 9/NLOC 52)
    gained a `'connector'` case. `assignExact`'s G2 N68 phantom at
    `creationIndex + 1` is now REAL (`{ type: 'connector', noteId,
    creationIndex }`) exactly when `note.connector.length > 0`; still a
    uid-less phantom otherwise (opalised note, member-tip note).
  - `ClassUidPlan.noteConnectorUid: ReadonlyMap<string, string>` — new,
    exposed the same way `edgeUid` is. Populated by the exact path's
    dense merge; the fallback (non-exact) path gets a dedicated pass
    (`assignFallbackConnectorUids`, also hook-extracted) that continues
    from `edgeUid.length` — the SAME approximation the pre-T9b
    `renderer.ts` placeholder (`lnk${edgeUid.length + i + 1}`) already
    used, now centralized on the plan instead of computed inline. Named
    caveat: this continuation is `edgeUid.length` (array LENGTH), not the
    true post-edges counter value — identical when nothing but edges
    precede the connectors in the fallback numbering, drifts when a
    classifier/namespace consumed ranks first (pre-existing imprecision,
    not introduced or fixed by this task — see the `renderer-uid.test.ts`
    test documenting it).

## Complexity-hook note

Three functions needed splitting to stay under the hook's NLOC 30/CCN 10
caps after this change: `assignExact` (inline note-entry building moved
to module-level `noteRankedEntries`) and `buildClassUidPlan` (its
fallback-connector pass and its note-fallback-continuation loop both
moved to their own named functions, `assignFallbackConnectorUids`/
`assignNoteFallbackUids`). All four are pure extractions — no behavior
change beyond what the diff already describes above.

## Measurements

- `render-diff` (4 AC slugs), before → after (structural/numeric):
  `fogexa-30-zupo141` 4/0 → **0/0 (now byte-conformant)**;
  `pecabi-95-demu756` 5/0 → 1/0 (residual is `<path>@d` geometry — batch 4
  T13's cluster-edge clipping, explicitly out of this task's scope, NOT
  chased); `sanixi-31-nofa193` 5/0 → 1/0 (same residual); `zepeki-75-pifo352`
  3/93 → 3/93 (unchanged — no group/package target in its remaining
  divergence, confirmed unrelated).
- `render-all` → `measurements/t9b.json` (723 rows) vs `measurements/t9.json`:
  `pin-diff` reports exactly 1 transition (`fogexa-30-zupo141: verdict
  diverged -> conformant`) and 0 diff-count RISES across the full corpus.
  A direct structural+numeric sum diff (pin-diff only surfaces rises, not
  falls) confirms only 3 rows changed at all: fogexa (4→0), pecabi (5→1),
  sanixi (5→1) — zero other movers. This is consistent with T9's own
  agent-notes finding that mechanism (a)'s reach (a note actually drawing
  its own separate connector, i.e. `note.connector.length > 0`) is narrow
  in this corpus — every fixture where the note is instead opalised
  (folded into the host) never reaches this task's changed code at all,
  since `renderOneNote` only pushes a `NoteConnector` when that field is
  non-empty. No `t9.json`-conformant fixture lost conformance.
- `dot-sync-report.ts class`: 711/712 (unchanged from the stated floor).
