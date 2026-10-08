# add4-T3i: arrow label grammar (branch add4/T3i)

## Commits
- `5563daf35` fix(activity): port CommandArrow3 and CommandArrowLong3 label grammar
- (this note)

## Java -> ours
| Java | ours |
|---|---|
| `CommandArrow3.java:61-71` regex: `->` or `STYLE_COLORS_MULTIPLES`, spaces, `(.*);` or empty | `dispatch-support.ts#RE_ARROW_LABEL` (+ `ARROW_HEAD`); group 1 = COLOR, 2 = LABEL |
| `CommandLinkElement.java:77-83` LINE_STYLE / STYLE_COLORS_MULTIPLES | reuses `description/link-grammar-regex.ts#LINE_STYLE` |
| `CommandArrow3.java:99-103` COLOR -> next arrow Rainbow | parsed into new `ActivityArrowLabel.style` (NOT drawn, see below) |
| `CommandArrow3.java:110` `Display.getWithNewlines(pragma, label)` | `dispatch-arrow-long.ts#singleLineArrowLabel` -> core `parseWithNewlines` (`Display.java:262-344`) |
| `CommandArrowLong3.java:56-111` (END `^(.*);$` :58, regex :66-74, executeNow :93-111) | `dispatch-arrow-long.ts#tryArrowLong`, `RE_ARROW_LONG(_END)` |
| `CommandMultilines2.java:98-107` first line never tested vs END | same: scan starts at idx+1 |
| `ActivityDiagramFactory3.java:114-115` order Arrow3 then ArrowLong3 | `LINE_HANDLERS`: `tryArrowLabel`, `tryArrowLong` |

Mechanism of task 1: no `<back:>`/`<color:>` lift remains. The old regex lifted a tag only when it directly followed `->`; renderer.ts#renderEdgeLabel re-emitted it as `<back:>` (so `-><color:red>x;` drew a red flood). Now the whole text goes to the creole Sheet.
Mechanism of task 2: `\n` was never converted for arrow labels; now converted once in the parser.
Found while porting (not in the brief): `parseNodes` stripped a bare trailing `;` from every colon-free line, eating Arrow3's own `(.*);` terminator; the strip now skips lines `RE_ARROW_LABEL` matches. And unterminated `-> x` is CommandArrowLong3 (jar swallows following lines up to a `;` line), not a label; ported.

## Fixtures (tests/fixtures/activity/add4-T3i, jar svg alongside; before -> after score)
| fixture | before | after | residual |
|---|---|---|---|
| arrow-plain-label | 0 | 0 | |
| arrow-trailing-space | 0 | 0 | |
| arrow-color-label (`-> <color:red>`) | 2 | 2 | width/viewBox: layout measures raw `<color:red>` (T3g layout residual) |
| arrow-back-label, arrow-both, arrow-tight-tags | 2 | 2 | same |
| arrow-newline-label | 29 | 17 | height: layout sizes the label as 1 line (edge-label-anchor, T3a/T3c) |
| arrow-long-multiline | n/a | 20 | same height residual |
| arrow-no-semicolon | 52 | 9 | same height residual; text now matches jar (`nosemi` / `:b`) |
| arrow-style-bold | 85 | 1 | stroke-width 2 on the next arrow (renderer) |
| arrow-style-colored, -colored-label | 87 | 3 | stroke/fill colour of the next arrow (renderer) |
Sum over the 12 fixtures: 346+ -> 41-ish after (11 original = 346 -> 41).

## Probe / gates
Probe aggregate 221, risers 0, fallers 0 (every pinned fixture equals its pin). Ratchet (404 byte-equal), harness-parity, style/text/swimlane baselines, routing-conformance, refusal-coverage, tests/unit/activity (683): green. typecheck, eslint clean. Census movers: none.

## Not done (hunks for owners, outside write-set)
- `-[#red]->` / `-[bold]->` line colour/style: needs `PendingInLabel` + `Tile.inLabel`/edge field carrying `style` (`layout/tile-layout-inlabel.ts:49-52,180`) and renderer stroke/arrowhead colour (`renderer.ts`); `consumeArrowLabel` also returns undefined for an empty label, so a style-only arrow is dropped there. Jar draws the NEXT arrow with that colour and width (fixtures above).
- Dead code left: `ActivityArrowLabel.color` is never produced now; `tile-layout-inlabel.ts:51,180` and `renderer.ts:110` still read it (T3h to delete together with the style work).
- Multi-line arrow label height not sized by layout (3 fixtures).
- `Display.getWithNewlines`' `\r`/`\l` natural alignment is dropped (breaks only; AST carries no alignment). `MultilinesStrategy.REMOVE_STARTING_QUOTE` for ArrowLong3 not ported.
