# T1 — Extract the line components, then emit the lifeline `<g><title>` + hover rect

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` is the canonical specification; read the **method body**, not
a filename or a remembered summary. Sequence pixels come from
`net/sourceforge/plantuml/sequencediagram/teoz/` — the `graphic/` package is
dead for rendering and reading it produces confidently wrong answers.

The sequence SVG comparator aligns children **by index** and stops descending
at the first tag mismatch. Ours emits a bare `<line>` where the jar emits
`<g><title>A</title><rect/><line/></g>`, so index 0 under the root `<g>`
mismatches by tag and every arrow below it is invisible to the gate. This task
closes the first of three such divergences.

## Task

**Step 1 — extract (blocking).** `src/diagrams/sequence/renderer.ts` is 512
lines; the complexity hook blocks writes at 500. Move `renderLifeline`
(`renderer.ts:192-202`) and `renderActivation` (`:208-216`) into a new
`src/diagrams/sequence/renderer-lifeline.ts` and import them back. Behaviour
must not change in this step — commit it or not as you prefer, but verify the
suite is green before step 2 so any later movement is attributable.

This mirrors upstream, where both are their own classes
(`skin/rose/ComponentRoseLine.java`, `skin/rose/ComponentRoseActiveLine.java`).
Carry a JSDoc `@see` to each Java origin, as ported symbols in this repo do.

**Step 2 — emit the group.** Replace the bare `<line>` with, in order:

```
<g><title>{TITLE}</title>{RECT}{LINE}</g>
```

- `{TITLE}` — the participant display's **first line**, XML-escaped; empty
  string if the display is empty (D2, `Display.java:601-605`).
- `{RECT}` — `x = centreX − 3.5`, `y` = the line's start Y, `width = 8`,
  `height` = the line's height, `fill="#000"`, `fill-opacity="0"`, **no
  stroke attribute** (D1).
- `{LINE}` — unchanged from today: same coordinates, same stroke, same
  dash array.

**The rect is suppressed entirely when height is 0** —
`ComponentRoseLine.java:100` guards `if (dimensionToUse.getHeight() > 0)`.
The `<g>` and `<title>` are still emitted in that case; only the rect is not.
Confirm that reading before relying on it.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseLine.java`
  — the whole file; `drawInternalU` at `:74-88` and `drawTitleHoverTargetRect`
  at `:99-108` are the spec.
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/MutingLine.java:94-113`
  — how the component is constructed and where its `Display` comes from.
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:601-605`
  — `toTooltipText`.
- `test-results/dot-cache/sequence/celego-19-laji937/in.svg` — the golden.
- `src/diagrams/sequence/renderer.ts:160-220, 465-512` — current emission and
  draw order.
- `src/core/svg.ts` — the existing `rect`/`line`/`text` primitives. **Check
  whether a group/title primitive already exists before writing one**
  (`docs/catalog.md`; agents in this repo routinely rebuild what exists).

## Write-set

- `src/diagrams/sequence/renderer-lifeline.ts` (new)
- `src/diagrams/sequence/renderer.ts`
- a unit test for the new module under `tests/unit/sequence/`
- `docs/catalog.md` (regenerate with `npm run catalog` — drift-gated)

## Architecture decisions — locked

D1, D2, D6 in [`../decisions.md`](../decisions.md). Read them; they carry the
quoted Java that fixes the `8` and the `−3.5`. **Those two numbers are
upstream's, and no other new constant is permitted.** If a value seems needed
that is not in a Java method body you can quote, stop and log it.

Do **not** add head/tail wrappers (D3) — the jar emits those bare, and adding
them would break the alignment this mission establishes.

## Quality bar

- TDD: the test asserts the emitted child sequence for a two-participant
  fixture is `g/title`, `g/rect`, `g/line` — not merely that a `<g>` appears.
- Assert on specific values (`width="8"`, `fill-opacity="0"`, the computed
  `x`), never `toBeTruthy`.
- All four gates green: `npm test`, `npm run typecheck`, `npm run lint`,
  `npm run build`.
- Measure per the batch protocol and **read the diff records**, do not report
  Σ weightedScore alone.

## Boundaries

**Always**: cite `file:line` for every constant; re-read the Java before
stating why something differs.
**Ask first**: any change outside the write-set.
**Never**: change a coordinate to make a score fall (D6). Never run Prettier.

## Commit

`feat(T1): wrap sequence lifelines in the g/title hover group`

Body explains why the extraction came first (the 500-line hook cap) and cites
`ComponentRoseLine.java:74-108`.
