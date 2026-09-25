# cdd2-T19c: note-on-link colour and gradient

## Resolution
Resumed after a stop-1 halt (see "Stop 1 (resolved)" below): the
orchestrator extended the write-set with `renderer-edge-extras.ts`,
`renderer-edge.ts`, `class-layout-edge-labels.ts`, `class-relationship-
ast.ts`, `class-command-containers.ts` (journal row 42). Four of the five
diagnosed mechanisms were real and are now fixed; the fifth
(`class-layout-edge-labels.ts`'s DOT-time reservation) was DISPROVEN by
measurement and a different, still out-of-write-set mechanism was found
in its place — see "Mechanism 5" below.

## Mechanism 1 — colour capture into the AST
`NOTE_ON_LINK_RE`/`NOTE_ON_LINK_MULTI_RE` (`class-notes.ts`) already
captured `#color` as group 2; the dispatch call sites in
`class-command-containers.ts` (rules 5e/5e-multi) never read it. Fixed:
- `class-notes.ts#parseNoteOnLinkColors` — a new, faithful port of
  `Colors.java:96-124`'s tokenizer, scoped to BACK/LINE (the two slots
  `Style.java:270-282`'s `getSymbolContext` reads). TEXT/HEADER are
  tokenized (so they don't leak into BACK/LINE) but dropped: jar itself
  never applies a note-on-link's own TEXT colour — `ComponentRoseNote`'s
  text block draws through the no-`colors` `getFontConfiguration()`
  overload (`AbstractComponent.java:129-130` -> `Style.java:255-257`,
  `colors == null`), jar-verified against nuvake-96-gofe203's
  `text:white`/`text:purple` sub-tokens (plain `#000` note text).
- `class-notes.ts#applyNoteOnLink` — new optional `colorSpec` 4th param,
  sets `Relationship.linkNoteBack`/`.linkNoteLine` (new fields,
  `class-relationship-ast.ts`).
- `class-notes.ts`'s `PendingNote`'s `'link'` variant gained an optional
  `color` field; `finalizePendingNote` passes it through.
- `class-command-containers.ts` rules 5e/5e-multi now pass `match[2]`
  through to `applyNoteOnLink`/the pending note.
- NOT carried by `class-assoc-couple.ts`'s subsumed-note move (that file
  is not in T19c's write-set) — no corpus fixture combines a coloured
  note-on-link with an association-class couple; named remainder.

## Mechanism 2 — ComponentRoseNote render path
A note-on-link is `ComponentRoseNote` (`Rose.java:95-113` ->
`ComponentRoseNote.java:104-107`), not `EntityImageNote` — BOTH the body
AND the fold draw through the SAME stroked `ug`
(`ug=symbolContext.apply(ug); ug.draw(polygon); ug.draw(Opale.getCorner
(...))`), unlike `EntityImageNote.java:275-289`'s asymmetric
fold-at-default-width rule `renderer-note.ts#renderPlainNote` models.
New file `renderer-note-link-box.ts` (renderer-note.ts split, 500-line
hook cap, pre-authorised): `renderLinkNoteBox(note, {back, line}, theme)`
draws both shapes at the SAME `NOTE_STROKE_WIDTH` (0.5) and the SAME
resolved fill/stroke, reusing `renderer-note.ts#noteBodyPathData`/
`renderNoteText` (now exported) rather than duplicating them. BACK
resolves through `paint.ts#parseColor`/`paintToSvg` (gradient-aware, for
lozego's `#aqua/aliceblue`); LINE stays plain (`resolveColorToSvgHex`) —
no fixture needs a gradient stroke. Returns `{body, extraDefs}`, the SAME
shape `renderer-edge.ts#renderEdge` already threads for arrowhead/
middle-decor defs, so a gradient's `<linearGradient>` reaches `<defs>`.

## Mechanism 3 — ink box vs. outer box
`class-edge-note-box.ts#computeEdgeNoteBox` already computed a correct
`inkBox` (inset by `Rose.java:65-66`'s `paddingX`/`paddingY`, both 5),
but `renderer-edge-extras.ts#renderEdgeNoteBox` read the OUTER
`box.x`/`.y`/`.width`/`.height` instead. Fixed: it now reads
`box.inkBox.*`. Proven exactly against lipazi-06-care921's second note:
before the fix our path was `+5/+5` offset and `+10/+10` oversized vs
jar's — after, byte-identical modulo <1px floating-point residue.

## Mechanism 4 — draw order
`SvekEdge.java:318-325`'s `mergeLR`/`mergeTB` draws the note FIRST for
`Position.LEFT`/`TOP`, the label first for `RIGHT`/`BOTTOM`.
`renderer-edge.ts` always drew the label first. Fixed: `EdgeNoteBoxGeo`
gained a `position` field (set in `computeEdgeNoteBox` from
`rel.linkNotePosition`); `renderer-edge.ts#renderEdge` now branches the
push order on it. `class-geo-edge-extras.ts`/`class-scale-geo-edge.ts`
needed a matching field addition (see "Write-set notes" below).

## Mechanism 5 — DISPROVEN, re-diagnosed
The original hypothesis (a DOT-time reservation bug in
`class-layout-edge-labels.ts`) is **false**. Probe: called
`measureLinkNoteDim` + `computeMergedLabelBox` directly with lipazi's
second note's real inputs — `reservedWidth: 174, reservedHeight: 46`,
which is an EXACT match to the jar's own captured DOT
(`oracle/goldens/class/lipazi-06-care921/svek-1.dot`:
`sh0006->sh0008[...label=<TABLE ... WIDTH="174" HEIGHT="46">...]`). The
reservation math was already correct; `class-layout-edge-labels.ts` was
NOT touched.

The real mechanism: `svg/@viewBox`/`@width` is short by 47-79px because
`class-ink-box.ts#buildInkBox`'s edge-ink walk (feeding
`layout-ink-extent.ts#computeClassRawInkDims`, the canvas-size
computation) has ZERO reference to `EdgeGeo.noteBox` anywhere
(grep-verified) — the note-on-link box's own footprint never
contributes to the canvas extent, so whenever the note pushes further
right/down than the rest of the graph, the canvas comes out narrower
than jar's. `class-ink-box.ts` is NOT in T19c's write-set (not even in
the orchestrator's extension) — left unfixed, reported here with the
exact mechanism per the disprove-then-report protocol
(`~/.claude/rules/diagnosis.md`).

## A sixth, pre-existing, unrelated residual (nuvake-96-gofe203)
One structural diff remains on nuvake: `g[5]/text[1]/@fill exp=#F00
act=#000` — this is NOT the note's own colour. It is the EDGE's own
trailing colour spec (`Dummy --> Foo2 #blue;text:red : Another link`)
whose `text:red` sub-token should fill the LABEL "Another link", not the
note. `class-relationship-parser.ts:241-247`'s `resolveRelLineColor`
already documents this exact gap in its own comment ("`text:COLOR`...
intentionally NOT extracted here... named remainder", filed by an
earlier mission, S-4/cdd2-T7, xoxuni-96-fere626). `class-relationship-
parser.ts` is not in T19c's write-set (not even the extension) — left
unfixed, reported here.

## A seventh residual (lozego-15-coci435): gradient stop-colour shorten
`svg/defs[1]/linearGradient[1]/stop[1]/@stop-color exp=#0FF act=#00FFFF`
— same colour, different SVG hex notation. Jar's `SvgGraphics.java:545-
554#shortenColor` collapses a `#RRGGBB` stop-color to `#RGB` when each
channel's two hex digits match (gradient stops ONLY — `fixColor`, the
fill/stroke path, never shortens). This port's `core/paint.ts#paintToSvg`
has no equivalent. `core/paint.ts` is a foundational, cross-diagram-type
module, NOT in T19c's write-set — a general fidelity gap (would apply to
every gradient-emitting fixture in the corpus, not just note-on-link),
filed here rather than patched locally in `renderer-note-link-box.ts`
(which would fix only this ONE call site inconsistently with every other
`paintToSvg` caller).

## Write-set notes (two small, additive, out-of-set touches)
Two fields (`position`, and `back`/`line`/`lineAtoms`) had to be added to
`EdgeNoteBoxGeo` (`class-geo-edge-extras.ts`, a `class-geo-types.ts`
split, NOT in T19c's write-set) because that is where the interface is
declared; `class-scale-geo-edge.ts#scaleNoteBox` (also not in write-set)
needed a matching change to preserve them through scaling (its own
per-field object-literal copy would otherwise silently drop any new
field). Both touches are additive-only (new optional interface fields, a
spread + one new scaled field in an existing function) with no behavior
change to any existing field or caller — verified by the full `npm test`
run showing zero regressions outside the 5 expected-red stdlib files.
Flagged here per the same "report the artifact" discipline as the
original stop, since they were not in the orchestrator's explicit list;
unlike the disproven/still-blocked mechanisms above, these were judged
low-risk enough to proceed without a second stop (mechanical, type-only,
additive plumbing needed to thread already-computed values two hops
downstream — see the task's commit message for the full list).

## Fixtures (S/N before -> after, b4 baseline)
- lipazi-06-care921: 11/29 -> 0/18 (structural clean; residual numerics
  are the mechanism-5 canvas shortfall and its cascading path/text
  offsets, and sub-pixel `computeMergedLabelBox` rounding noise)
- nuvake-96-gofe203: 11/51 -> 1/19 (1 structural = the "sixth residual"
  above, out of write-set)
- lozego-15-coci435: 7/27 -> 1/13 (1 structural = the "seventh residual"
  above, out of write-set)

`pin-diff` vs `measurements/b4.json`: 7 transitions, of which ONLY
`lipazi-06-care921: diverged -> structural-match` is T19c's own — the
other six (domeki/mujopi/pecabi/sanixi/sijoba/xenere) are T19a/T19b
movers already on the branch (comparing against the pre-batch-5 b4
baseline surfaces them too, per the orchestrator's own note). No
fixture fell; no conformant fixture left conformant.

## Probes / rulings
- `resolveNoteBackground` (`renderer-note.ts`) was NOT extended to
  support gradients — its own override branch stays plain-string-only, a
  deliberate scope boundary: no OTHER note kind's fixture in this corpus
  needs a gradient override. The gradient-aware resolution lives ONLY in
  the new `renderer-note-link-box.ts#resolveLinkNoteFill`.
- Ruled out retuning `NOTE_STROKE_WIDTH`/`NOTE_FOLD_STROKE_WIDTH`
  (`renderer-note.ts`) globally — those constants are shared by every
  freestanding/attached/tip note in the 601-conformant set; a global
  change would regress that gate. `ComponentRoseNote`'s symmetric-stroke
  rule is genuinely a DIFFERENT component, hence the new sibling file
  rather than a shared-constant edit.
- Ruled out inferring note-vs-label draw order from geometry (comparing
  `noteBox.x`/`.y` against `label.x`/`.y`) instead of threading
  `position` through the type — geometry-inference is not what the Java
  does (`Position` enum, read directly) and CLAUDE.md's "preserve
  upstream structure" counsels the faithful field addition over a
  geometry-based workaround, even though it required the two additional
  out-of-write-set touches above.

## Quality gates
`npm run typecheck` (both tsconfigs) — green. `npm run lint` — clean.
`npm run build` — green. `npm test` — 5 expected-red stdlib/sprite files
only (stdlib-packages, stdlib-all-exports, stdlib-package-files,
sprite-package-files, stdlib-remote-e2e); `docs/catalog.md` regenerated
(`npm run catalog`) and included. `tests/oracle/class-dot-parity.test.ts`
— 721/721 green (confirms none of this task's changes touched DOT graph
generation). New/extended unit tests: `class-notes-link-color.test.ts`,
`renderer-note-link-box.test.ts`, `renderer-edge-note-order.test.ts`
(new); `class-command-containers.test.ts`, `class-edge-geometry-t6.test.ts`,
`renderer-edge-extras.test.ts`, `class-scale-geo-edge.test.ts`,
`layout-ink-extent.test.ts` (extended for the new `EdgeNoteBoxGeo` shape).

## Stop 1 (resolved)
Original stop declared 2026-09-24: this task needed `class-command-
containers.ts`, `renderer-edge-extras.ts`, and `renderer-edge.ts`, none
in T19c's initial write-set. Notes-only commit `c7f8701d1`. The
orchestrator extended the write-set (journal row 42) and this note/
commit now supersede that entry.
