# T36 — `Class::member` port-row sizing

**Agent:** typescript-pro (opus) · **Depends on:** — · parallel with T35
(worktrees). DOT gate 710/711 (SI17's ceiling — do not regress it).

## Context

**Not the same mechanism SI17 already fixed — read this before
touching either file.** `si17-class-row-ports` (`plans/si17-class-
row-ports/`, merged) closed the DOT-level `portOk` anchor defect for
these EXACT fixtures — `gojofu-46-xaci340`, `nenepe-70-keri784`,
`paroxa-83-lofa387`, `pegeso-72-mana305`, `xefeme-77-fagu709` were all
DELETED from `oracle/goldens/class/port-backlog.json`
(`decision-journal.md:258-263`) because their edges now anchor to the
correct graphviz PORT (`A::member`) instead of the whole node. A5's
Unclassified bucket, run AFTER that merge, still lists the SAME
fixtures for a DIFFERENT reason: the RENDERED node's own vertical size
is wrong — `gojofu`'s whole diagram sits 15 px lower and is 8 px taller
than the jar's. This is a node-sizing/HTML-label gap, not an anchor
gap; 53 corpus fixtures use `Class::member`-style port syntax (the
full reach is wider than the 8 named — measure it).

**Mechanism, to verify not assume.** `EntityImageClass#getPorts`
(`svek/image/EntityImageClass.java:246-257`) returns `((WithPorts)
body).getPorts(stringBounder).translateY(dimHeader.getHeight())` — the
member-body's own port positions, reported to the DOT layer shifted
DOWN by the classifier's HEADER height. The label markup itself is
built by `SvekNode`'s `RECTANGLE_HTML_FOR_PORTS` branch
(`svek/SvekNode.java:130-340`, the `<TABLE BORDER="0" CELLBORDER="0"
CELLSPACING="0" CELLPADDING="0">` emission at `:197,247,278`) — read the
WHOLE branch, not just the header row, to see how the header row and
the ported member rows compose into ONE HTML table graphviz then sizes
itself. This port's DOT-label builder is `class-map-port-rows.ts
#mapPortRows` (`:43-68`) + `class-port-rows.ts#applyShapeAndPorts`
(`:203-...`)/`#classPortRows` (`:372-...`). The 15px/8px gap likely
means our emitted HTML table's header row (or its `CELLPADDING`/border
reservation) does not match upstream's exactly, so dot-engine's own
HTML-table layout sizes the node differently — this is a DOT-INPUT
(the emitted `<TABLE>` markup) discrepancy, not a post-layout TS
arithmetic one. Confirm by diffing the emitted node label string
against `svek-N.dot`'s label for `gojofu-46-xaci340` before writing any
fix.

## Task

1. Instrument first: diff this port's emitted HTML-table label for
   `gojofu-46-xaci340`'s node against `test-results/dot-cache/class/
   gojofu-46-xaci340/svek-1.dot`'s label string, cell by cell (`<TR>`/
   `<TD>` attributes, not just text content).
2. Measure the full 53-fixture corpus reach (grep the corpus for
   `Class::member` port syntax) — the 8 named
   (`gojofu-46-xaci340`, `paroxa-83-lofa387`, `pegeso-72-mana305`,
   `monoda-73-guto455`, `nadono-22-gidu983`, `nenepe-70-keri784`,
   `xefeme-77-fagu709`, `nugecu-04-tona107`) are a sample, not the whole
   set.
3. Tests first per the diagnosed mechanism.
4. Fix the HTML-table emission (header-row reservation, cell
   padding/border, or whichever attribute the diff names) in
   `class-port-rows.ts`/`class-map-port-rows.ts` so the emitted label
   matches upstream's `SvekNode.java` markup byte-for-byte for the
   header/port-row boundary.
5. Re-verify the DOT gate stays at 710/711 (SI17's ceiling) — this task
   changes emitted DOT node labels, so a regression here is a stop-6
   condition (gate drops below 710/711).
6. `.agent-notes/cdd-T36.md`: the exact HTML-table attribute that
   differed; the true corpus reach measured in step 2.

## Read-set

`src/diagrams/class/class-map-port-rows.ts` (whole, 71 lines);
`src/diagrams/class/class-port-rows.ts:1-100,168-330,372-420`.
Java: `svek/image/EntityImageClass.java:240-260`; `svek/
SvekNode.java:120-345`; `svek/ShapeType.java` (`RECTANGLE_HTML_FOR_PORTS`
definition). Prior mission: `plans/si17-class-row-ports/README.md`,
`decisions.md` (six ADRs), `decision-journal.md` (read for context, do
not re-litigate its closed ADRs). Diagnosis: `diagnosis/
A5-geometry.md` Unclassified ("`Class::member` port anchors").

## Write-set

`src/diagrams/class/class-map-port-rows.ts`,
`src/diagrams/class/class-port-rows.ts`, their `*.test.ts` files,
`.agent-notes/cdd-T36.md`, `decision-journal.md` (diagnosis artifact +
fix summary), `planning/next-missions.md` (if the true corpus reach is
too large for this task, file the remainder as a follow-on, append-only).

## Acceptance criteria

- Given the label-diff instrument, then the diagnosis names the exact
  HTML-table attribute/row causing the 15px/8px gap, with `file:line`
  on both sides
- Given `gojofu-46-xaci340`, `paroxa-83-lofa387`, `pegeso-72-mana305`,
  `monoda-73-guto455`, `nadono-22-gidu983`, `nenepe-70-keri784`,
  `xefeme-77-fagu709`, `nugecu-04-tona107`, when re-rendered, then each
  is conformant or its residual is named in `decision-journal.md` with
  a mechanism
- Given `tests/oracle/class-dot-parity.test.ts`, then it stays at
  710/711 (stop 6 if it drops)
- Given the measured 53-fixture corpus reach, then every fixture this
  task did not close is either conformant already or filed in
  `planning/next-missions.md`

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the
code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all
green. `npx tsx tools/render-diff.mts gojofu-46-xaci340 paroxa-83-
lofa387 pegeso-72-mana305 monoda-73-guto455 nadono-22-gidu983
nenepe-70-keri784 xefeme-77-fagu709 nugecu-04-tona107` before/after,
plus `npx tsx scripts/dot-sync-report.ts class` confirming 710/711.
Files ≤500 lines, functions ≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: diff the emitted DOT label against `svek-N.dot` before writing
any TS fix — this is a DOT-input bug, most likely, not a post-layout
one. Ask first: any stop condition in `../README.md`; touching
`si17-class-row-ports`'s already-closed ADRs or its port-ANCHOR logic
(`:h`/`:0` suffix selection) — that half is done and correct. Never:
regress the DOT gate below 710/711; re-open SI17's closed port-anchor
mechanism.

## Commit

`fix(cdd-T36): correct port-row HTML-table sizing above the header`

Body: why — SI17 fixed WHICH port an edge anchors to; this fixes the
node's own rendered SIZE, a distinct HTML-table-emission mechanism that
A5's diagnosis surfaced after SI17 merged. Cite the corpus-reach
measurement and any follow-on filed for fixtures this task did not
close.
