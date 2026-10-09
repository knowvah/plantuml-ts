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
