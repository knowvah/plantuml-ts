# T1 — klimt core: `FontPosition` + `CommandCreoleExposantChange`

Return only the structured result — no preamble, no trailing summary. Do not
infer unstated requirements; implement the Java as cited; do not spawn subagents.

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `feat/creole-exposant-port`.
`<sup>`/`<sub>` are unported anywhere: `CommandCreoleBuilder.java:104-105`
registers `CommandCreoleExposantChange.create(FontPosition.EXPOSANT|INDICE)`;
our `CommandCreoleBuilder.ts` lists them under "not ported" (module doc
`:23-77`). The command sets `FontPosition` on `FontConfiguration`
(`CommandCreoleExposantChange.java:81-95`, `changeFontPosition`
`FontConfiguration.java:277-280`); the font is muted at READ time
(`FontConfiguration.java:98-104` → `FontPosition.java:51-60`) and the atom's
starting altitude is `getSpace()` (`AtomText.java:321-323`,
`FontPosition.java:41-49`); `AtomText.drawU`'s own space line is commented out
(`AtomText.java:212-215`) — baseline = `height − descent`. Read `decisions.md`
D1/D2/D4/D7 (locked), the batch overview's interface contract, CLAUDE.md
("READ THE JAVA FIRST"; every constant cites `file:line`; preserve names).

## Task
1. `src/core/klimt/font/FontPosition.ts` — port `FontPosition.java` (36-70)
   as the interface-contract functions.
2. `src/core/klimt/shape/UText.ts` — `fontPosition?` on `FontConfiguration`;
   `getFont(fc)`, `getSpace(fc)`; `UText`'s own drawing font goes through
   `getFont`.
3. `src/core/klimt/creole/command/CommandCreoleExposantChange.ts` — port per
   D4: `starters()` `<s` (`:56-58`), `create(position)` (`:65-70`, htmlTag from
   `FontPosition`), `matchingSize` (`:72-79`, the inner value's length),
   `executeAndAdvance` (`:81-95`: save fc, set position, `analyzeAndAdd`
   inner, restore, advance by the accepted match). Mirror how
   `CommandCreoleColorChange.ts` ported its ubrex pattern to a regex.
4. `CommandCreoleBuilder.ts` — register both at `java:104-105`'s slot; fix the
   module doc.
5. `src/core/klimt/creole/legacy/AtomText.ts` — every width/height helper that
   takes a font size takes the MUTED size (callers pass `getFont(fc).size`;
   add an overload/helper only if needed); export a
   `atomTextStartingAltitude(fc)` = `getSpace(fc)` (`AtomText.java:321-323`).
6. `driver-text-svg.ts:128,133,155` — measure/emit with `getFont(font)`.
TDD first (`tests/unit/core/klimt/creole/command/CommandCreoleExposantChange.test.ts`,
`tests/unit/core/klimt/font/FontPosition.test.ts`, extend UText/driver tests).

## Write-set
As in the batch overview. If any other file needs to change (an engine sizer
reading `.font.size`, `Sea.ts`, `StripeSimple.ts`), STOP and report — T2/T3
own those.

## Read-set
`decisions.md#D1,#D2,#D4`; `src/core/klimt/shape/UText.ts` (whole);
`src/core/klimt/creole/command/CommandCreoleColorChange.ts`,
`CommandCreoleSizeChange.ts`, `Command.ts:1-60`;
`src/core/klimt/creole/legacy/StripeSimple.ts:140-200` (builder API);
`src/core/klimt/creole/legacy/AtomText.ts` (whole); `driver-text-svg.ts:100-170`;
Java: `klimt/creole/command/CommandCreoleExposantChange.java`,
`klimt/font/FontPosition.java`, `klimt/font/FontConfiguration.java:80-110,
270-285,365-375`, `klimt/creole/legacy/AtomText.java:170-235,315-325`,
`klimt/creole/legacy/CommandCreoleBuilder.java:95-125`.

## Acceptance
- Given `<sup>x</sup>`, when lexed by `buildLineAtoms`, then one text atom `x` with `fontPosition: 'EXPOSANT'` (`<sub>` → INDICE); given `<sup>` with no closing tag, then literal text (no match — `matchingSize` 0).
- Given fc `{size:12, EXPOSANT}`, then `getFont(fc).size === 9`; `{size:4}` → 2 (clamp); `getSpace` −6/+3/0 — cite `FontPosition.java` lines in the tests.
- Given `<sup><size:20>x</size></sup>`, then the atom's `getFont(...).size === 17` (lazy mute, D1); given `<size:20><sup>x</sup></size>`, also 17.
- Given a NORMAL fc, then `getFont` returns the same family/size and every existing creole/UText/driver test passes unchanged (README stop 9).
- Given `driver-text-svg`, when it draws a UText with EXPOSANT, then `font-size` equals the muted size and the width used for alignment/underline is measured with it.
- Given `npm test`, `npm run typecheck`, `npm run lint`, then green; `layering.test.ts` unchanged.

## Observability / Rollback
N/A beyond the gates (T2/T3 measure the geometry effect). Reversible.

## Report (≤600 tokens)
Final exported names/signatures (T2–T5 read this); regex chosen for the ubrex
pattern with a note on any Java rule not expressible; which `AtomText`
helpers changed signature; files written.
