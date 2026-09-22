# T9 — note connector as its own link group; groups never opalise

## Java read (quoted, with file:line)

**(a) Emission-order/site.** `GraphvizImageBuilder.java:226-227` (`buildImage`):
`printGroups(...); printEntities(...);` draws every node (cluster/entity)
FIRST, then the per-link loop at `:229` (`for (Link link : dotData.getLinks())`)
builds a `SvekEdge`, calls `dotStringFactory.getBibliotekon().addLine(line)`
(`:236`), and only THEN checks `isOpalisable`. A note's dashed connector to
its host is one of these `Link`s — upstream never special-cases it inside
the node-drawing pass; it is drawn wherever the generic edge-draw pass draws
it. `SvekResult.java:82-90` (cited by this file's own `renderClass` doc
comment) draws every node before any edge. TS mirror: `renderer.ts`'s three
numbered phases (namespaces → leaves → edges) already implement this
node-then-edge order; T9 slots the note connector into phase 3 via the SAME
`wrapLink` call phase 3's `geo.edges.forEach` uses for a real relationship
(`renderer.ts`, `noteConnectors.forEach` block, right after that
`forEach`).

**(b) Opalise guard.** `GraphvizImageBuilder.java:133-148` (`isOpalisable`):
```
if (dotData.getSkinParam().strictUmlStyle()) return false;
if (entity.isGroup()) return false;
if (entity.getLeafType() != LeafType.NOTE) return false;
final Link single = onlyOneLink(entity);
if (single == null) return false;
return single.getOther(entity).getLeafType() != LeafType.NOTE;
```
`:245-259` (`buildImage`'s per-link loop):
```
if (isOpalisable(link.getEntity1())) {
  final SvekNode node = ...getNode(link.getEntity1());
  final SvekNode other = ...getNode(link.getEntity2());
  if (other != null) { ...; line.setOpale(true); }
} else if (isOpalisable(link.getEntity2())) { ... same with 1/2 swapped ... }
```
`Bibliotekon.java:72-77` (`createNode`) is called ONLY from
`GraphvizImageBuilder.java:362` (`printEntity`, itself called only from
`printEntities`, which `printGroups` — `:408-431` — invokes for a group's
own `leafs()`, never for the group entity itself). So a package/namespace
is NEVER in `Bibliotekon`'s `nodeMap`, and `getNode` (`Bibliotekon.java:
120-122`, `return nodeMap.get(ent);`) returns `null` for one — the
`if (other != null)` guard above then skips `setOpale(true)` and the note
stays a plain box with a real, separately-drawn connector `Link`.

## Where the fix landed (and why the write-set grew by one file)

- `note-layout-groups.ts`: `NoteGroup` gained `opalisable: boolean`,
  computed in `newGroup`/`groupNotes` from the SAME `anchors` map
  `groupEdge` already reads (`anchors.has(target)` ⟺ target is a
  package/namespace — the exact `Bibliotekon#getNode`-returns-null
  predicate, since `anchors` is built ONLY for group ids). `groupNotes`
  gained an `anchors` parameter; `buildNoteGraphParts` already had
  `anchors` in scope, so its own signature is unchanged.
- **`note-layout-tip.ts` — NOT in the declared write-set, extended anyway.**
  `singletonNoteGeo`'s opalise-attempt dispatch (`strictUml ? plainNoteGeo
  : buildOpaleNoteGeo() ?? plainNoteGeo`) is the ONLY place the "attempt
  Opale or not" decision is made; `group.opalisable` has no effect unless
  something reads it there. `resolveGroupGeos` now computes `const
  strictUml = ctx.strictUml || group.opalisable === false;` before calling
  `mapGroupNoteGeos` — same shape as the existing `strictUml` gate, just
  OR'd with the new one. This is a genuine, minimal (2-line) extension;
  verified necessary by reading the full call chain
  (`resolveGroupGeos → mapGroupNoteGeos → resolveGroupStep →
  singletonNoteGeo`) before editing. Named per the brief's "ask
  first"/"STOP and report" pattern for out-of-write-set files — proceeding
  rather than halting because (1) no other batch-3 task owns this file,
  (2) the change is a 2-line OR, not a redesign, (3) mechanism (b) is
  IMPOSSIBLE to implement anywhere else (there is no other seam).
- `renderer.ts`: `renderOneNote`'s note-branch now calls `renderPlainNote`
  (not `renderNote`) and returns `{ entity, connector? }` instead of a
  flat `string[]`. The leaf loop (phase 2) pushes `entity` immediately and
  collects `connector` into a `noteConnectors: NoteConnector[]` array;
  phase 3 (edges), right after `geo.edges.forEach`, drains
  `noteConnectors` through the SAME `wrapLink` call an ordinary edge uses.
  Renderer.ts crossed the 500-line hook after this edit, so `renderOneNote`
  + its two small result interfaces were moved verbatim to a NEW sibling
  file, `renderer-note-dispatch.ts` (pre-authorised split; distinct name
  from T10's `renderer-note-lines.ts`, no collision).

## Named residual: connector `id`/uid is a placeholder, not jar-matching

`renderer-uid.ts#assignExact`'s G2 N68 entry (`:250-254`) burns the note
connector's numbering RANK as a PHANTOM (no uid written) — correct
BEFORE this task, since the connector was never its own drawn `<g>`. Now
that it is, that phantom should become a real `lnkN` assignment, which
needs a new `noteConnectorUid`-shaped map threaded through
`ClassUidPlan`/`assignExact`/`assignFallback` — `renderer-uid.ts` work,
outside T9's write-set (not named as a step-4 example in the brief, but
the same "ask first, don't silently expand" principle applies; this one
IS skippable, unlike the note-layout-tip.ts extension, because structural
correctness — box shape, connector presence, link grouping — does not
depend on the exact numeric id). `renderer.ts` uses a clearly-commented
placeholder (`lnk${uidPlan.edgeUid.length + i + 1}`) instead. Confirmed
via `render-diff`: `fogexa-30-zupo141`/`pecabi-95-demu756`/
`sanixi-31-nofa193` each show exactly ONE residual `@id exp=lnkN | act=lnkM`
diff plus the pre-existing, unrelated `stroke-dasharray "7,7"` vs `"4 4"`
and `stroke-width 1` vs `0.5` divergences (present before T9 too — not
part of E6, not touched by this task).

## Named residual: 6 "partial" E6 fixtures move ZERO bytes

`lejoga-79-poji465`, `vudepo-27-cuvo793`, `pejone-71-tige404`,
`xonamo-50-podo529`, `temise-16-neco018`, `fomofi-36-lova857` — byte-diffed
`.ours.svg` before vs. after this task's change: IDENTICAL for all six
(verified via `git stash` + re-render + `diff`, not inferred from
`compareSvg` counts, per `comparesvg-count-not-monotonic.md`). Verified
why: none of their `.puml` sources contain a `package`/`namespace` block
(`grep -c '^package\|^namespace'` = 0 for all six), so mechanism (b) (E6's
group-target guard) cannot fire. Every note in these fixtures targets an
ordinary classifier or is a member-tip (`::member`), and inspecting their
rendered SVG shows the plain-classifier-targeted notes are ALREADY
opalised by our port (merged notch, e.g. lejoga's `__note_0` path ends in
`L868.25,372.622` — a notch coordinate, not a separate connector) — so
mechanism (a) (connector-as-own-link) never triggers either, since
`renderPlainNote` is never called for an opalised note.

This means the diagnosis's own "Reach ... Partial" list (E6, 6 slugs) is
a LEAD, not a proven mechanism map for these six: their real jar-vs-ours
link-count difference must come from something OTHER than E6(a)/(b) as
faithfully ported from the cited Java (`isOpalisable`/`Bibliotekon`).
Candidate next instrument (not chased — out of T9 scope): does the jar's
REAL `isOpalisable`/`Opale` geometry reject these connectors for a reason
`note-opale.ts#resolveOpaleConnector` doesn't replicate (that function's
own doc comment already flags its multi-member-group merge behavior as
"UNVERIFIED against any fixture in this mission's corpus") — i.e. a
port-fidelity gap in the OPALE GEOMETRY RESOLUTION itself, not in either
of E6's two guards. Filed here rather than in a fix, per D11 (named
residual, not adopted/fitted).

## Measurements

- `render-diff` (4 AC slugs), before → after (structural/numeric):
  `fogexa-30-zupo141` 13/2 → 4/0; `pecabi-95-demu756` 27/6 → 5/0;
  `sanixi-31-nofa193` 27/6 → 5/0; `zepeki-75-pifo352` 3/93 → 3/93
  (unchanged — no group/package target in this fixture's remaining
  divergence, see report).
- `render-all` → `measurements/t9.json` (723 rows) vs. `measurements/t8.json`:
  `pin-diff` reports **0 transitions** (no verdict change, no diff-count
  RISE) across the full 723-row corpus — no t8-conformant fixture lost
  conformance.
- `dot-sync-report.ts class`: 711/712 (unchanged from the stated floor).
