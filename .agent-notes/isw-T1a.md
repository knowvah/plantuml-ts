# isw-T1a report

## Commits
- Fork `~/git/plantuml` branch `dot-output`: **2fd5dac7adf** (on 37c07dce45a; not pushed; untracked `.claude/` untouched).
- Repo (branch isw/T1a): 476216c50 (patch 0004), 0132950f2 (DeterministicMeasurer + tests + fixtures), 83c9a005a (D9 comments), + this note.
- Staged jar: `/private/tmp/claude-501/isw-T1a/plantuml-oracle.jar` (plantuml-1.2026.8beta1, built `./gradlew jar -x test`).
- Patch: `oracle/patches/0004-oracle-space-width.patch`.

## Java -> ours
- Block 0 confirmed (our data port, same as the jar table): zeros at 0x09-0x0D, 0x1D, 0x20, 0xAD; 0x21 = 44, 0xA0 = 44.
- `FileFormat.java#getDefaultStringBounder` seam #4: `calculateDimension` override in seam #3's anonymous subclass: `width = super.width + spaces * 4.4 * font.getSize2D() / 16.0`. Base: `StringBounderFromWidthTable.java` `calculateDimension` (factor = size / REFERENCE_SIZE 16.0), `UnicodeBlock.java:62-68` (`getWidth` = byte/10.0).
- Ours: `src/core/measurer-deterministic.ts` `class DeterministicMeasurer extends WidthTableMeasurer`, overrides `measure` (same arithmetic order as Java). `charWidth` visibility NOT changed (`measure` override; `measurer.ts` untouched). Also exports `SPACE_WIDTH_TENTHS = 44`.

## Fixtures before -> after
- `"a b"` 12pt: jar textLength 16.65 = ours 16.65 (old table: 2 x 'a'=... without space). `" "` 12pt = 3.3 (unit test).
- 7 jar fixtures `tests/fixtures/isw-T1a/*.{puml,svg}` (spaces, lone-space, tab-bearing, 12 and 14 pt): every textLength equals ours at the jar's printed precision (SvgGraphics#format, option decimal 3 -> compare `toFixed(3)`; first attempt at an absolute 5e-5 tolerance was wrong, the jar prints 3 decimals: 22.4875 -> "22.487"). No mismatch.
- Lone-space runs render as `<text> </text>` (NBSP/space) with no textLength attribute; no crash.
- (d) No-property parity: staged jar vs pinned `oracle/dist/plantuml-oracle.jar`, without PLANTUML_DETERMINISTIC_TEXT, spaces-12 and tab-14: `cmp` identical (md5 9d8a31a0... for spaces-12).
- Tests: `tests/unit/core/isw-space-width.test.ts`, `isw-jar-textlength.test.ts`; with `tests/unit/core/measurer*` and `tests/architecture/isw-measurer.test.ts`: 78 passed. typecheck + eslint clean.

## The 4 crash fixtures (staged jar, 2 solo renders each)
kovaxi-11-reti348, zidebi-71-nocu387, runima-82-jigi009, pixisi-38-kixa563: none contains "has crashed"/crash/exception; the single `<image>` in each is the embedded `data:image/svg+xml` of the `{{ }}` diagram (not a PNG sprite). Two solo renders byte-equal for ALL four (md5 5b938353..., 89f140db..., 53112f83..., f176f189...). Mechanism (zero-wide lone space -> Slot start>=end) is gone.

## DIVERGENCES.md (orchestrator)
The lone-space / space = 0 entry should be retired. I did not open DIVERGENCES.md; replacement text if a note is wanted: "U+0020 measures 44 tenths of a 16pt em (4.4px at 16pt), not the table's 0: oracle seam #4 (0004-oracle-space-width.patch) and DeterministicMeasurer agree; WidthTableMeasurer stays the verbatim table."

## Not done / for T1b
- Existing tests that encode space = 0 now fail (expected; out of my write-set): `tests/unit/core/klimt/creole/legacy/AtomText.test.ts` ("the stop is fontSize * 4 (52 at 13pt)", "TAB_STRING measures 0..."), `tests/unit/core/klimt/creole/unwind2-s3-tab-stops.test.ts` (14 tab fixtures conformance vs OLD goldens; need new goldens). tab stops now = 8 x 4.4 x size/16 via the unchanged code.
- D9 sites with no zero-space claim found, left untouched: `creole-text-lines.ts`, `state-sizing-creole.ts`. Possible concern: `state-sizing-creole.ts:285-292` `blankLine` hardcodes `width: 0` for an NBSP run (NBSP is 44 in the table); check against new goldens.
- `tests/unit/core/measurer-deterministic.test.ts` header still says "re-export" (outside write-set).
- No survey run, no full suite (per rules).
