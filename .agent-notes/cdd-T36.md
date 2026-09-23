# cdd-T36 — `Class::member` port-row sizing: premise disproved

Status: **executed as a negative result** on `cdd/t36` (worktree
`.claude/worktrees/cdd-t36`, based on `e7a96725`). No production change:
the instrument the spec mandated shows the emitted HTML-table label is
ALREADY byte-exact against the jar for every fixture in the measured
corpus reach, so nothing in `class-port-rows.ts` /
`class-map-port-rows.ts` can move any residual. One regression test was
added; every open fixture is filed with a mechanism.

## The exact HTML-table attribute that differed: **only `BGCOLOR` hex case**

Instrument (scratch, not committed): for each reach fixture, render
through production with `setLayoutInputObserver`, re-emit with
`src/core/svek-dot-emit.ts#toSvekDot`, and string-compare every
`<TABLE …>` label against the same node's label in
`test-results/dot-cache/class/<slug>/svek-N.dot`.

Result over the 22-fixture row-port family: **37 jar table labels, 10
differing, and every one of the 10 differs ONLY in the hex case of
`BGCOLOR`** (cidepu, kicolo, kuxosa — 3 labels each — and sijisi — 1). `WIDTH`, `HEIGHT`, `PORT`, `BORDER`, `CELLBORDER`,
`CELLSPACING`, `CELLPADDING`, the `<TR>`/`<TD>` count and the row order
are identical characters in every case — including the header row and
the trailer row, i.e. exactly the boundary A5 suspected.

- ours: `src/core/svek-dot-emit-labels.ts:17`
  `const hex = (n) => '#' + (n & 0xffffff).toString(16).padStart(6,'0')`
  — lowercase.
- jar: `net/sourceforge/plantuml/klimt/awt/XColor.java:127-129`
  `toHexRGBColor` = `String.format("#%06X", rgb & 0xFFFFFF)` — UPPERCASE.
  Called at `svek/SvekNode.java:277` inside
  `appendLabelHtmlSpecialForLink` (the `RECTANGLE_HTML_FOR_PORTS`
  branch, `:269-297`), and again at `:255` in `appendLabelHtml`.

It is invisible on `gojofu-46-xaci340` only because that diagram's trace
sentinel colours (`#000006`, `#000007`) contain no hex letter. It is
geometrically inert (DOT colour parsing is case-insensitive; every
affected fixture is `dotEqual: true`), and `svek-dot-emit-labels.ts` is
outside T36's write-set — **filed, not fixed** (stop condition 1).

## The 15px/8px header gap the spec describes is GONE

`gojofu-46-xaci340` renders 0 structural + 0 numeric. Its node labels are
byte-identical to `svek-1.dot`:
`HEIGHT="36"` header / `HEIGHT="14" PORT="pb80bb…"` / `HEIGHT="26"`
trailer (sh0006) and `58` / `14 PORT="pe8701…"` / `18` (sh0007).
`class-port-rows.ts#classPortRows`' formula
(`headerHeight + SECTION_MARGIN + Σ prior member heights`,
`cucadiagram/MethodsOrFieldsArea.java:194-211`) reproduces both, the
`..` separator included as an ordinary 8-high non-electing member. That
composition was closed by CDD B7FU-R2's enhanced-body port election
(`class-body-enhanced-ports.ts`, `MeasuredClassifier.enhancedPortRows`),
which landed after the A5 diagnosis was written. A5 itself rated the
claim LOW and "not investigated further".

## Measured corpus reach — 22, not 53

55 of the 723 cached class fixtures contain `::` at all. Classified by
reading each line, then cross-checked against whether the jar's own
`svek-N.dot` emits a row-port table:

| group | count | in the T36 mechanism? |
|---|---|---|
| `A::member` on a LINK endpoint, jar emits a row-port `<TABLE>` | 22 | YES |
| `note left of A::m` (27 slugs, 1 also a link port) | 26 | no — the jar emits NO port table for a note-on-member |
| `namespace`/`set namespaceSeparator ::` qualified NAMES | 7 | no |
| `::` inside member text / `!define` macro args (C++ types) | ~10 | no |

The spec's "53" and A5's fixture list are both wrong in detail:
`nadono-22-gidu983` and `nagega-30-poso418` use `::` as a NAMESPACE
separator (`namespace Observation { class Role::BadPix }`, quoted
`"cls::new"`) and the jar emits zero table labels for them;
`nugecu-04-tona107` contains no `::` at all. Of the 8 fixtures A5 named,
only 5 are in the family.

The 22: bicabi-42-coto932, cidepu-54-bemo048, dekaba-54-fafi485,
garizu-98-nixo496, gekope-01-ricu859, gojofu-46-xaci340,
juxora-90-fisu720, kicolo-81-sidi387, kidugi-68-noje040,
kuxosa-67-keko885, minuko-19-pobo264, monoda-73-guto455,
mulafo-23-tove961, nenepe-70-keri784, pajoka-72-reju527,
paroxa-83-lofa387, pegeso-72-mana305, pijiju-95-xexi872,
refeku-65-gapu585, rocere-18-faza042, sijisi-94-ripu606,
xefeme-77-fagu709.

15 of the 22 render 0+0. The 7 open ones and their mechanisms are in
`plans/class-divergence-drive/decision-journal.md` rows 220-224 and
`planning/next-missions.md`.

## Method note for the next agent

`grep -l 'PORT=' */svek-*.dot` over-counts by 2x: `PORT="h"` is SI17's
qualifier shield (`SvekNode#appendLabelHtml`, `svek/SvekNode.java:245-267`)
and `PORT="P"` is the entry/exit compass shield
(`#appendLabelHtmlSpecialForPortHtml`, `:189-205`). Only
`PORT="p<32 hex>"` is a member row band
(`Ports#encodePortNameToId`). Grep for that.

Confidence: High (every claim is a string compare against the committed
`test-results/dot-cache` jar output or a quoted Java method body).
