# Close — what wiring creole into sequence bought

Measured 2026-09-02 at `a26f1e1f`, against the mission base `ebf50d6f`. Every
figure below was produced by re-running an instrument, not carried forward from
planning. Where a number disagrees with `starting-census.md`, this file says so
rather than quietly adopting the newer one.

## The gated quantity

```
base   fixtures=1141 measured=1124 errored=17 descended=797 shortCircuited=327
close  fixtures=1141 measured=1124 errored=17 descended=889 shortCircuited=235
```

**`descended` 797 → 889, +92.** Split by cause, because the brief asked for C2's
share to be stated separately:

| step | descended | delta |
|---|---:|---:|
| base `ebf50d6f` | 797 | — |
| C1 (the seam; gate was that nothing moves) | 797 | 0 |
| C2 (escaped `\n`) | 860 | **+63** |
| C3 (message labels) | 867 | +7 |
| tile-escape fix | 868 | +1 |
| undrawable-atom literal fallback | 874 | +6 |
| C4 (participants) | 875 | +1 |
| C5 (frame text) + `else` condition | 878 | +3 |
| C6 (notes, dividers) | 889 | +11 |
| box labels | 889 | 0 (zero measured reach, as predicted) |

One fixture LOST descent across the whole mission — `gucare-93-petu502`,
diagnosed in [`c2-residuals.md`](c2-residuals.md) as a pre-existing
case-sensitive `as` that the split unmasked, not as damage this mission did.

## Total distance is not quotable, and this is why

Concentration is **27.7% on `vofupo-09-gafe466`**, above the 20% alarm; the
heaviest ten hold 56.7%. The corpus total rose 3 855 017 → 6 262 624 and that
movement is not a fidelity statement: 92 fixtures that previously
short-circuited above their geometry now descend into it and contribute their
real per-attribute diffs for the first time. `compareSvg` charges a
short-circuit an upper bound on what descending could have cost
(`compare.ts:396-406`), so a document that gains correct elements while still
short-circuiting always scores higher. Quote `descended`, or quote a named
fixture; do not quote the corpus total.

## Content census

Our `<text>` bodies against the jar's, in document order, over the fixtures
whose text COUNT matches — where counts differ the pairing is meaningless.

| class | base | close |
|---|---:|---:|
| monospace `""` | 341 | **0** |
| HTML-ish tags (`<b>`, `<color:>`, `<font>`) | 42 | 17 |
| other angle-bracket markup | 32 | 28 |
| escaped `\n` (content-visible) | 19 | **0** |
| creole `[[url]]` | 4 | **0** |
| bold `**` | 4 | **0** |
| guillemet `<<x>>` → `«x»` | 3 | **0** |
| **total** | **445** | **45** |
| fixtures carrying them | 72 | 16 |

Fixtures whose `<text>` count matches the jar: **862 → 956**.

**Two corrections to `starting-census.md`, both about its denominators.** That
file reports 440 mismatches across 71 fixtures over "the 1123 fixtures whose
`<text>` count already matches". Re-measuring at the base with a committed
instrument gives **445 across 72**, over **862** count-matching fixtures — the
mismatch counts agree closely enough to trust the classification, but the 1123
denominator does not reproduce and cannot: 327 fixtures short-circuit at the
root child count, which is where a count mismatch lives. The planning figure
appears to be "measured minus one". Use 862 → 956.

Neither figure needs the `SequenceArrows_0001_Test` / `_0002_Test` exclusion any
more: those two fixtures held 72.8% of the monospace row, and that row is zero.

## Links

**`<a>` 42 → 87**, against the jar's 98, corpus-wide. 42 is the parent
mission's B3 declaration-url figure, re-measured at `ebf50d6f` to confirm it.
The 45 added are creole urls inside label text — the B3 leftovers this mission
owned. Of the 11 still missing, the known share is `cedeti-10-bufu072`'s frame
anchors, which are emitted but with a broken href (below).

**0 `text-anchor` and 0 `dominant-baseline`** across all 1124 rendered fixtures,
so the parent mission's D1 convention held through every cutover.

## Adjudication

`npx jiti scripts/sequence-ratchet-adjudicate.ts --base ebf50d6f`:

```
artefact=32  substructure=12  regression=0  inconclusive=18  improved=139  unchanged=940
```

**`regression=0`.** No fixture's weighted score rose with its top-level
child-count distance rising or holding. 139 improved outright.

The inherited ratchet went 93 → 78 red and was **not re-pinned** — it belongs to
`sequence-text-and-y-convergence`, and this mission ran it only as an
instrument. `.agent-notes/C6-annotation-creole.md` records the eight rise/fall
pairs C6 measured so the parent mission can re-pin without re-deriving them.

## What creole did NOT reach — as follow-ons, not prose

**1. `CommandCreoleUrl`'s link class admits `[`.** Filed in full, with the
verified one-character fix and its jar evidence, in
[`creole-url-bracket-defect.md`](creole-url-bracket-defect.md). Refused here
under stop condition 8: it is shared creole and moving it needs a corpus
measurement across class, description, state and object. `cedeti-10-bufu072`'s
`alt` comment and `else` condition both emit an `<a>` with a broken href because
of it.

**2. Sequence has no geometry for a non-text creole atom**, so a line holding
`<$sprite>`/`<&icon>`/`<:emoji:>`/`<latex>` stays wholly literal. This was a
deliberate reversal of C1's first design after measurement — see decision
journal 17 — and it bought +6 `descended`, but it has a content cost: on
`rapoto-38-neca900`, `<color:blue>circle <$circle>` keeps its `<color:blue>`
literal too, because the fallback suppresses creole for the whole line. **That
is most of the surviving `other angle-bracket` row and part of `HTML-ish tag`.**
Retires when sequence geometry gains an image kind; that one change closes both
the element gap and this content residue.

**Sequence is the outlier on `<latex>` specifically, and that is sharper than
"needs an image kind".** `core/latex.ts#renderLatexAsImage` already exists and
is already called — from `core/svek/image/*`, i.e. by class, object, state and
description. Nothing under `src/diagrams/sequence/` references it, so a real
`<latex>` atom that the cuca families draw as an image is swallowed by the
literal fallback here. Wiring sequence to the EXISTING renderer is the task;
building new image geometry is not.

**`<math>` is a different gap and must not be folded into this one.** Upstream
has `CommandCreoleMath.java` beside `CommandCreoleLatex.java`; this port ported
only the latex half, so `<math>` yields no atom in ANY family. And per
`DIVERGENCES.md:317-339` the whole latex/math rendering is a permanent,
maintainer-approved KaTeX-not-JLaTeXMath divergence: structure conformant,
bytes and metrics never. Any fixture carrying `<math>` or `<latex>` keeps a
permanent conformance floor.

**3. The remaining `HTML-ish tag` mismatches are CHROME, not the engine.**
`funado-58-dene546` and `gupaki-93-vupa807` are `footer <back:red>some footer`.
`header`/`footer`/`caption`/`title` route through `annotations/blocks.ts`, whose
creole parser does not handle `<back:>`. The census cannot reach zero from the
sequence engine alone.

**4. `textBlockRuns` in `text-block-geo.ts` is callerless.** C5 replaced its last
caller; its own doc still claims three. C6 measured that its note and divider
blocks wanted ~80% of it and could not use it, because it re-splits on
`displayLines` while notes and dividers arrive pre-split. Recommendation on
record: move the creole loop into it AND change its signature to take pre-split
`readonly string[]` plus a `FontConfiguration`, giving four call sites
(`refBodyRuns`, `buildTabRuns#block`, `noteBodyRuns`, `dividerLabelRuns`) one
shared five-line body instead of four copies.

**5. `refBodyWidth`/`refBodyHeight` still size the `ref` box from the RAW line**,
so a markup-bearing body gets a box measured for its markup. C6 fixed exactly
this defect for notes and dividers; the `ref` arm is the last instance, in a file
no batch-3 task could reach.

**6. `renderer-lifeline.ts#toTooltipText` does not split.** A lifeline `<title>`
reads `Bob\non 2 lines` where the jar reads `Bob`. Not a root child, so no
instrument in this mission sees it.

**7. A bare `----` has no rule geometry.** `classifyStripeLine` reports
HORIZONTAL_LINE and yields no atoms; the jar draws `<line>` in a 10-tall row and
this port keeps the literal text in a 14-tall row, so `jozomu-87-tajo507`'s body
sits 4px low below the rule.

**8. `\t` in a note body now becomes a real tab** (`resolveTextEscapes`, per
atom). The jar draws tab STOPS — three `<text>` 52px apart on
`midipu-78-meva271`; this port draws one run holding real tabs. Content closer
to the jar, placement not.

**9. `as` is case-sensitive here and case-insensitive upstream.** Full mechanism
in [`c2-residuals.md`](c2-residuals.md). The honest fix is an audit of the whole
sequence keyword set against `Pattern2.CASE_INSENSITIVE`, not a one-off.

**10. Two fixtures are one background `<rect>` from a matching root child
count.** `kenilu-88-javu563` and `xiceso-64-pelu456` are text-exact; the only
surplus is a full-canvas rect the jar never emits. Root chrome; see
[`c2-residuals.md`](c2-residuals.md).

**11. Document draw ORDER, the mission's stated non-goal, is now the largest
single content bucket: 394 mismatches across 91 fixtures**, up from 348/82 at
base — it grew because more fixtures became comparable, not because anything
regressed. Our text multiset equals the jar's; the order differs. Separate
mechanism, separate fix.

**12. Process, not code: `scale-geo.ts` blocked two of batch 3's four tasks.**
C5's `branchSeparators[].run` and C6's `BoxGeo.labelRun` each needed a one-line
companion edit there, and neither task's write-set included it. Any future brief
that widens a `TextRun`-bearing geo field must put `scale-geo.ts` in the same
write-set — which is stop condition 7 restated as a planning rule rather than a
runtime check.

## What the mission did not have to do

The charter was REUSE, and it held: nothing under `core/klimt/creole/` or
`core/creole*.ts` was modified, forked or re-ported. The three seam-level gaps
found (`~` tile escape, guillemet rewrite, and the url character class) were all
cases where the shared engine expects its CALLER to do something — two were
fixed in the sequence adapter, and the third was refused and filed because it is
a genuine engine bug with four other families downstream.
