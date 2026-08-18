# T1 — Core creole-text seam (`creoleTextLines`)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
SI28 found the state engine measures every text line RAW (`state-sizing.ts`,
`state-note-layout.ts`, `state-composite-sizing.ts`) while the jar routes it
through `Display.create8(..., CreoleMode.FULL, wrapWidth)` → creole atoms
(`EntityImageState.java:86,98-99`, `EntityImageStateCommon.java:80-81`). You
build the ONE core primitive both the state sizer (T6/T7) and renderer will
consume — `decisions.md#D1` (locked). Read `decisions.md`, SI28
`findings/SYNTHESIS.md` §1 G1/G2/G23 (symptom catalogue: `<color>`, `<font>`,
`**`, `<math>`, `<sup>`, `[[url]]`, `[[S1]]`, `|=table|`, tab stops,
`wrapWidth`), CLAUDE.md "READ THE JAVA FIRST" and "Translation".

## Task
Create `src/core/svek/image/creole-text-lines.ts` exporting the interface in
`batch-1/overview.md` (locked shape). Build on what exists — reuse, don't
re-lex: `src/core/klimt/creole/legacy/StripeSimple.ts#buildLineAtoms` (the
unified lexer), `legacy/AtomText.ts` (tab-stop advance, `AtomText.java:183-260`;
`tabSize` from `skinparam tabSize`), `klimt/creole/Fission.ts#getSplitted`
(`wrapWidth`), `leaf-sizing-text.ts#creoleVisibleText`/`inlineAtomWidth` (how
class sizes the same atoms — cite it, do not duplicate its logic; extract a
shared helper if you must, keeping class byte-identical), `DisplayNewlines.ts#
splitDisplayLines` for `\n`. Per line: runs carry visible text + style +
colour + url; width = Σ run widths after tab-stop snapping; height per
`StringBounderFromWidthTable`/`AtomText` line height; `kind` classifies
`----` HR and `|` table rows (T7 consumes table rows). Every numeric rule
cites its Java `file:line` in a comment. TDD: write the tests first.

## Write-set
`src/core/svek/image/creole-text-lines.ts` + its test file. `tests/architecture/
layering.test.ts` must NOT need an ALLOWLIST change (README stop 6).

## Read-set
`decisions.md#D1`; `src/core/svek/image/leaf-sizing-text.ts:1-300`;
`src/core/klimt/creole/legacy/StripeSimple.ts`, `legacy/AtomText.ts`,
`src/core/klimt/creole/Fission.ts`, `DisplayNewlines.ts`;
`src/diagrams/class/class-member-creole.ts:192-260` (shape reference only —
do NOT import it); Java: `Display.java:262-346` (create8/newlines),
`svek/image/EntityImageState.java:80-112`, `klimt/creole/atom/AtomText.java:183-275`,
`klimt/creole/legacy/StripeSimple.java`, `TextBlockUtils`.

## Acceptance
- Given `<color:red>bleh</color>`, then one line, width == `measurer.measure("bleh")`, one run `{color:'red'}`.
- Given `**entry**`, `<math>x</math>`, `<sup>2</sup>`, `[[http://x]]`, `[[S1]]`, then visible text and width match `Display.create8` semantics with the Java line cited per case in the test.
- Given `wrapWidth=150` and a long line, then lines split as `Fission#getSplitted`; given `tabSize=2` and `a\tb`, then the second run starts at the next tab stop (`AtomText.java:239-256`).
- Given `----`, then `kind:'hr'`; given `|= h |= h2 |`, then `kind:'table-row'`.
- Given `npm test`, `npm run typecheck`, `npm run lint`, then green and `layering.test.ts` unchanged.

## Observability / Rollback
N/A — no caller yet; T6/T7 measure the effect. Reversible.

## Report (≤600 tokens)
Final exported names/types (T6/T7 read this); which core helpers were reused;
any Java rule you could NOT map to an existing core primitive (T6/T7 must know).
