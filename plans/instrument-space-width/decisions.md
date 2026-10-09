# Architecture decisions: isw (approved 2026-10-09; D8 user override)

## D1: the space width is 44 (tenths of a 16 pt em)
Upstream's table gives U+0020 width 0 (`klimt/drawing/font/UnicodeFontWidthSansSerif.java`
block 0 index 0x20). The table's own entries for the identical advance are
U+0021 `!` = 44 and U+00A0 NO-BREAK SPACE = 44; in Helvetica (Adobe Core14 AFM:
`C 32 ; WX 278 ; N space`, `C 33 ; WX 278 ; N exclam`) and Arial (569/2048 for
all three) space, `!` and no-break space share one advance. 86/95 printable
ASCII entries equal round(Helvetica WX × 0.16). Space = 44 → 4.4 px at 16 pt,
3.3 px at 12 pt. Cite all three in code.

## D2: only U+0020 changes
Block 0's other zeros stay: 0x09–0x0D (control/whitespace never drawn as a
glyph), 0x1D (control), 0xAD SOFT HYPHEN (invisible unless breaking). A test
enumerates them with these reasons.

## D3: oracle override = seam #4 in `FileFormat.java`
Extend seam #3's anonymous `StringBounderFromWidthTable` subclass (the
`PLANTUML_DETERMINISTIC_TEXT` branch of `getDefaultStringBounder`) to override
`calculateDimension`: width = super.width + (count of U+0020) × 4.4 × size/16.
`StringBounderFromWidthTable` itself is untouched (its LATEX-fallback and TeaVM
callers keep upstream behaviour); the jar is byte-identical to stock without
the property. Patch `oracle/patches/0004-oracle-space-width.patch`;
`pin.json` seamCommit, `seamCommitCount: 4`, `seamHistory` row.

## D4: port override = `DeterministicMeasurer` becomes a real subclass
`WidthTableMeasurer` stays the verbatim port of upstream's table. 
`DeterministicMeasurer extends WidthTableMeasurer` and overrides the U+0020
width — mirroring "upstream class + oracle seam". Every harness, script, test
and plan tool constructs `DeterministicMeasurer`; an architecture test forbids
`new WidthTableMeasurer` outside `src/core`. (Done as a rename while still an
alias — T0c — so the behaviour change in T1a is one line.)

## D5: atomic change
Seam #4, the jar swap, the `DeterministicMeasurer` override and the full
re-capture land in batch 1, measured as one step b0 → b1. No gate ever runs
against a half-changed instrument.

## D6: one JVM per fixture for every re-capture
Batching is proven unsafe for `{{ }}` (JVM static state: zidebi 875 px batched
vs 895 solo) and `@startdot` (5 svg-dot goldens differ batched, equal solo).
`scripts/recapture-oracles.ts` runs one JVM per fixture across workers;
`scripts/rebaseline-svg-goldens.ts` is fixed to the same. A copy of
`oracle-render.sh` must override REPO, not just JAR (Batik path).

## D7: attribution at b1
Every pinned row and survey verdict is classified unchanged / fell / owed.
Owed = a conformant loss or a row whose score rose or whose elements moved
away. Owed rows are grouped into families by diff path; each family needs a
Java-quoted mechanism. Owed rows are NOT re-pinned at their worse value:
losses are unpinned into `measurements/owed.json` (precedent cdd5 D1), rises
are recorded there with their b0 value, and gates read `pinned ∪ owed`.

## D8: fix every family in-mission (user override of the recommendation)
No hand-off. Exit: `owed.json` empty — every b0-conformant fixture conformant,
every owed rise back to ≤ its b0 score with 0 elements away. The only allowed
remainder is a library-forced one proven by a controlled experiment (stop 14).
Fix batches are created per family from the b1 census; stop 13 re-scopes.

## D9: zero-space comments
`AtomText.ts`, `json/tab-stops.ts`, `cluster-title-table.ts`,
`creole-text-lines.ts`, `state-sizing-creole.ts`, `measurer-deterministic.ts`
describe space = 0 as the instrument's behaviour. Rewritten in T1a. The
tab-stop code is unchanged — it already measures `tabString()` and falls back
only on 0 (`AtomText.java:270-275`); new jar fixtures with tabs pin the
measured branch.

## D10: exit bar
Instrument exact; `owed.json` empty; every b0-conformant fixture conformant;
elements b0→final away = 0; production manifest unchanged; the four lgm crash
fixtures (kovaxi-11, zidebi-71, runima-82, pixisi-38) render as real diagrams
on the new jar and `ORACLE_CRASH_FIXTURES` is removed; four gates green;
`DIVERGENCES.md` lone-space entry retired; ADR-001 addendum.

## D10-AMEND (PROPOSED 2026-10-09, journal row 12 — awaiting user)
Finding: the production manifest stays unchanged across the instrument step
(b0→b1: 0 changes), but the revealed families F1 (10 production sites build
their own `WidthTableMeasurer`) and F2 (leading/trailing-space trim and x
shift) are port defects production already has — `jarMeasurer` gives spaces
width — so every fix moves production output toward the jar. "Production
manifest unchanged" (D10, stop 6) contradicts D8. Proposed: stop 6 becomes
"every production manifest change is attributed to a named family fix and
journaled; no change outside a family". F3 (seam-#4-only jar crash pages,
`Direction.java:128` float equality) proposed excluded like lgm's four.

## D10-AMEND — RULED 2026-10-09 (user)
1. Production bar: changes allowed only when every changed fixture is
   attributed to a named family fix and journaled; any unattributed change
   still fires stop 6.
2. F1: inject the render's measurer at every site (upstream
   `ug.getStringBounder()`); production activity text becomes AWT-measured.
3. F3: "If this works without the seam exercised, then we need to fix our
   injection to do better. We shouldn't crash if PlantUML unaltered JAR
   works." Seam #4 must not crash where stock metrics render. Not excluded.

## D2/D3-AMEND (2026-10-09, implements the user's F3 ruling; flagged for review)
Seam #4 as first built (`super.width + spaces*4.4*size/16`) made the jar crash
on activity cemagu-66/nerete-42/rosepa-78 where stock metrics and seam #3
render: `Snake.same` merges points within 0.001 (`Snake.java:299-300`), then
`Direction.fromVector` demands exact H/V equality (`Direction.java:118-128`);
cemagu reached x by two routes, 126.75000000000001 vs 126.75. Seam #4 now:
(a) measures each U+0020 as U+0021 (same table entry 44, summed in-loop —
exactly a table with 44 at 0x20; fixed nerete + rosepa), and (b) rounds the
width to float, as the stock SVG bounder's is (`FileFormat.getJavaDimension`
reads `FontMetrics.getStringBounds`, verified `Rectangle2D$Float` in jshell
2026-10-09; fixed cemagu). (b) touches every width, not only spaces — D2's
"only U+0020 changes" now reads "only U+0020's table entry changes; every
width is float-rounded like stock". Port: `DeterministicMeasurer` mirrors
both (`' '`→`'!'`, `Math.fround`). The 4 lgm + 3 new fixtures all render.
