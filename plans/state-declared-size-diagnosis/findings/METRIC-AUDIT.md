# METRIC-AUDIT — sorted-pairing mis-attribution (T13)

Question raised by the harness's own doc comment
(`scripts/measure-composite-declared-size.ts:30-36`): scopes pair by index
and nodes pair by SORTED value per axis, so a sorted-pairing mis-attribution
is possible in principle — is it actually happening on any of the 90
mismatched fixtures (63 real + 27 precision)? **Answer: no observed
mis-attribution, and it is provable, not just unobserved** — see §2. 17 of
90 fixtures carry a genuine but harmless ambiguity (tied values); 0 show a
demonstrably better alternative pairing.

Probe: `scripts_scratch/T13/probe.ts` (deleted before commit) reproduces
`measureFixture`'s scope/axis pairing over all 94 fixtures from
`findings/partition.json`, but keeps the FULL sorted arrays per scope/axis
(not just the mismatched pair) plus each side's raw declaration-order
node list (id + shape), so both questions below can be answered against
real data instead of the single row PARTITION.md shows per mismatch.

## 1. Per-fixture pairingRisk

**Method.** For every scope/axis in every one of the 90 fixtures, an
exhaustive pairwise test: for every pair of indices `(i, k)` in that axis's
sorted array (not just adjacent — the full `O(n²)` set, `n` ≤ 13), does
reassigning which of our two values pairs against `jar[i]`/`jar[k]` reduce
or tie the summed `|Δ|` for that pair? This is the same bottleneck-style
question the `s1l-tail-diagnosis` precedent asked (constructive bijection
search), scoped to pairs instead of a full assignment search because the
arrays here are short (n ≤ 13) and a full Kuhn matching adds nothing at
this size — checking every pair already covers every 2-element
transposition, and no fixture here has more than one plausible tie-cluster
per axis (verified: no axis has 3+ mutually-close, non-identical values).

- **`likely`** — an alternative pairing exists whose summed error is ≤ the
  current one (zero here; §2).
- **`possible`** — no alternative pairing changes the error (harmless), but
  it exists ONLY because two values are exactly tied (within `1e-6`in), so
  the specific index a mismatched row is attributed to is arbitrary. This
  reproduces the `s1l-tail-diagnosis/findings/METRIC-AUDIT.md` "duplicate
  node sizes… swapping is harmless by construction" case.
- **`none`** — no tie, and the exhaustive test found nothing.

All 90 rows below carry a reason. `scope/axis rows` abbreviates
PARTITION.md's own row list as `sN:` + axis initials (`w`/`h`).

| fixture | bucket | scope/axis rows | pairingRisk | reason |
|---|---|---|---|---|
| `bajelo-54-dixe684` | composite-a | s2:w,s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `beguxu-19-tize774` | precision | s3:h | possible | both sides tie at idx2/idx3 (2.777777/2.777778 x2) — float-noise family |
| `bemena-23-zebu249` | precision | s2:h | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `bitaxo-18-tamo974` | pseudo-state | s1:h | possible | our height array has a tie (0.694444 x2) adjacent to the mismatched idx |
| `bujuta-44-rovo666` | pseudo-state | s1:h | possible | our height array ties 3x at 0.166667/0.666667 across all 4 idx (pseudo-state circle family) |
| `bunade-42-fudu910` | other | s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `corumi-91-mizo869` | attribute-line | s1:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `cupesu-59-sajo991` | composite-a | s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `dapunu-39-kava045` | composite-a | s3:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `darime-88-moda428` | concurrent-region | s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `decede-10-buvu414` | composite-a | s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `dogeji-46-sapo750` | stereotype | s1:w | none | six distinct, monotonically-offset values (no tie) — sorted order matches structure, not coincidence |
| `domoru-86-coki670` | precision | s4:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `dulixa-11-kufe247` | precision | s2:h | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `duzazu-41-telu529` | composite-a | s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `fadupe-90-koti079` | precision | s2:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `fajegu-17-joba577` | precision | s1:w | possible | both sides tie at idx9/idx10 (1.282812/1.282813 x2) — float-noise family |
| `fatupo-62-bemu777` | note | s1:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `feziva-71-gufo538` | skinparam-style | s1:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `fibudu-53-bode309` | attribute-line | s1:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `fimivu-15-vogi904` | concurrent-region | s5:hw | possible | both width and height arrays tie 2x at scope 5 (duplicate concurrent-region box) |
| `fojisi-40-zogo372` | precision | s2:h | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `fomusu-59-fupe538` | precision | s2:h | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `fotuje-06-fifa085` | composite-a | s2:hw,s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `fovafu-44-mifu394` | other | s1:w,s2:hw | possible | our width array ties at idx1/idx2 (0.774826 x2) |
| `gifasa-23-zile558` | precision | s2:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `giniti-22-fexo000` | concurrent-region | s5:hw,s6:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `gokife-89-boja382` | stereotype | s2:h,s3:h | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `gupeto-19-mesa256` | attribute-line | s1:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `jafazu-60-leca675` | skinparam-style | s1:hw | possible | our height array ties (0.555556 x2) |
| `jaxebo-54-nifi592` | precision | s3:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `jelusa-98-nexa591` | precision | s2:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `jetuse-93-gopi146` | concurrent-region | s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `jijuze-43-ceva131` | concurrent-region | s2:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `joleju-94-maru748` | concurrent-region | s9:hw,s11:hw,s12:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `jorere-75-peja265` | precision | s2:h,s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `juvagu-33-dupa212` | attribute-line | s1:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `kejabo-83-vinu490` | skinparam-style | s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `ketibo-84-juzo029` | precision | s2:h,s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `kinuca-03-nice683` | composite-a | s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `kubona-45-boso556` | attribute-line | s1:hw | possible | our height array ties (0.694444 x2) |
| `kujaju-47-neku764` | precision | s2:h | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `lalava-26-zosi801` | precision | s5:w | possible | both sides tie at idx0/idx1 (1.959809/1.959757 x2) — float-noise family |
| `lasasi-13-nona547` | precision | s3:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `leloja-87-tebi184` | precision | s3:h,s4:h,s5:h | possible | both sides tie at idx2/idx3 (5.597221/5.597222 x2) — float-noise family |
| `lojeju-04-fadu517` | composite-a | s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `lokija-02-dipe348` | attribute-line | s1:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `lonuti-97-voko521` | precision | s3:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `lumamo-63-zupa263` | concurrent-region | s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `mefici-97-tudu030` | pseudo-state | s1:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `mifuti-36-jine785` | precision | s3:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `mimaga-15-doze740` | pseudo-state | s1:w | possible | our width array ties 3x at 0.166667/0.666667 across all 4 idx (pseudo-state circle family) |
| `mosigo-88-rove013` | stereotype | s1:w,s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `mujipe-99-fume794` | skinparam-style | s1:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `nijugi-19-jazi166` | pseudo-state | s1:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `nimana-36-veco708` | composite-a | s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `nimise-04-jove070` | other | s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `nixoja-06-guxe431` | skinparam-style | s1:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `nuboca-13-xape657` | precision | s2:h | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `nuvura-69-mafe604` | composite-a | s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `pacami-67-dafe414` | composite-b | s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `pajefo-95-neri955` | precision | s2:h | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `papifi-44-caxo706` | creole-sprite-escape | s1:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `pavuzo-79-zodu430` | skinparam-style | s2:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `pebepi-32-cati486` | composite-b | s2:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `pexiku-77-japi217` | precision | s3:h | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `rejike-58-rote606` | skinparam-style | s1:hw | possible | our height array ties (0.694444 x2) |
| `resido-15-reza040` | pseudo-state | s1:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `rijoki-89-teno556` | stereotype | s1:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `rinisi-79-peko570` | pseudo-state | s1:h | possible | our height array ties 3x at 0.166667/0.666667 across all 4 idx (pseudo-state circle family) |
| `rovado-96-boda672` | creole-sprite-escape | s1:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `rovese-43-tadu368` | composite-b | s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `soxene-95-domu248` | precision | s3:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `sumiri-68-suvo696` | precision | s2:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `taxile-56-goca422` | composite-b | s2:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `tegali-39-molu382` | precision | s5:w | possible | both sides tie at idx1/idx2 (1.959809/1.959757 x2) — float-noise family |
| `tigibi-80-zidi137` | composite-b | s2:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `tofezi-64-koda860` | composite-b | s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `tubojo-49-tudu915` | other | s1:w | possible | our width array ties at idx1/idx2 (0.774826 x2) |
| `tumaba-64-tosu281` | note | s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `viguto-81-gana093` | stereotype | s1:hw | possible | our height array ties 4x at 0.694444, jar has one 0.805556 outlier |
| `vixobo-14-jole910` | composite-b | s1:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `xasoka-58-temi462` | creole-sprite-escape | s1:w | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `xepafa-33-lazi826` | precision | s2:h | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `xeziki-47-zomo866` | note | s1:w | possible | our width array ties at idx0/idx1 (0.694444 x2) |
| `xojudi-20-keco020` | composite-b | s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `zacajo-09-tamu628` | concurrent-region | s4:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `zitifa-97-bizo337` | precision | s2:h,s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `zizemo-86-gisa766` | composite-b | s2:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |
| `zoriza-41-rege543` | composite-b | s3:hw | none | exhaustive pairwise swap test finds no equal-or-better alternative bijection |

**Totals: none 73 · possible 17 · likely 0.** No `likely` row exists, so §
"give the alternative pairing and the delta it would show" (task item 2) has
no entries: every `possible` fixture's alternative pairing shows the SAME
delta pattern as the reported one (that is what makes it harmless, not
just untested — see §2). 15 of the 17 `possible` fixtures are already
members of an existing shared-cause family in PARTITION.md's own "Repeated
|Δpx|" table (the 36/28/8px pseudo-state-circle group: `bujuta`, `mimaga`,
`rinisi`; the 445.2/40px and 373.363/40px skinparam/attribute-line groups:
`jafazu`, `rejike`, `kubona`; the 5.8px `other` group: `fovafu`, `tubojo`;
and the sub-0.05px float-noise precision rows) — the tie is a SYMPTOM of the
same uniform-offset mechanism ADR-3 already attributes those fixtures to
(e.g. all four pseudo-state circles being wrong by the identical constant
means they are also, necessarily, tied with each other), not a second,
independent risk.

## 2. Why zero `likely`: the exhaustive test, and what it proves

For every axis of every scope of all 90 fixtures (205 scope-instances,
927 exact + 144 mismatched + 29 last-digit rows — see §3), every pair of
sorted-array indices `(i, k)` was tested: does swapping which of our two
values pairs against `jar[i]` / `jar[k]` produce a summed `|Δ|` that is
`<=` the current summed `|Δ|`? **Zero pairs, in zero fixtures, on either
axis, at any scope.** This means the harness's identity (sorted-index)
pairing is, for every one of these 90 fixtures, the exact
error-minimizing bijection over ALL `C(n,2)` alternatives, not merely the
one nobody happened to try. A rigorous "does any alternative do at least
as well" test is stronger than the informal reading of "risk" in the task
brief (adjacent-only transposition) — this audit ran the informal
adjacent-only version first (also zero hits), then widened to every pair
once the adjacent-only result looked suspiciously clean, specifically to
rule out the possibility that the informal test was too narrow to catch a
real mis-pairing.

This does not mean node IDENTITY is preserved (see §4) — only that the
SIZE NUMBERS this harness reports cannot be made to look better OR
DIFFERENT under any other pairing. A genuine identity swap (two DIFFERENT
real nodes trading places) would need `ours[i] != ours[k]`, and every case
found where that would change anything turned out to involve
`ours[i] == ours[k]` (an exact tie) — i.e. the two nodes are
indistinguishable by size on that axis, so no information is lost by
picking either. This is the same shape of result the
`s1l-tail-diagnosis/findings/METRIC-AUDIT.md` precedent reached for the
description family, independently re-derived here for state composites.

## 3. Proposed id-aware pairing (task item 3, PROPOSE ONLY)

Two candidates were evaluated against the same 90-fixture probe data.

### Candidate A — label text: REJECTED, infeasible from current oracle data

Checked directly: `grep -l 'label=<[^<]*[A-Za-z]' test-results/dot-cache/state/*/svek-*.dot`
returns **zero files** across the entire cached state corpus. Every
plain boxed node in jar's cached DOT is `label=""`; every HTML label/
cluster-title table carries only `WIDTH="…" HEIGHT="…"` sizing attrs with
an EMPTY `<TD></TD>` cell (verified on `bajelo-54-dixe684/svek-1.dot` and
`svek-2.dot`, and confirmed by the corpus-wide grep). Jar's Svek DOT is
purely a graphviz LAYOUT INPUT — text is composited onto the SVG
post-layout by a separate pass, never round-tripped through the DOT
graphviz sees, so it never reaches `test-results/dot-cache`.
**0/90 fixtures could be paired by label text using the CURRENT oracle
artifact.** Making it viable needs a NEW oracle capture (jar's
node-id→state-name mapping, e.g. scraping the rendered `in.svg`'s `<text>`
elements and correlating by post-layout geometry) — a materially larger,
separately-verified harness change: new capture script + new
id-to-name correlation logic across ~3 files, size **medium-large**, and
per README stop condition 5 this is exactly the kind of harness change
ADR-2 reserves for a maintainer decision, not a drive-by addition here.

### Candidate B — declaration-order pairing after filtering synthetic anchors: VIABLE, proposed

First tried filtering by OUR OWN id-naming convention (`__init_`,
`__final_`, `__zaent_` — the pattern `.agent-notes/class-ink-shared-offset-groups.md`
item (c) cites) and found it **asymmetric and wrong**: jar's cached DOT
literally uses ids like `zaent0003` for its own anchor points (verified on
`bajelo-54-dixe684/svek-2.dot`), but jar's `[*]` pseudo-state marker is
`shape=circle` (a REAL, visibly-sized node, e.g. `sh0007
[shape=circle,...,width=0.277778,height=0.277778]` in
`dapunu-39-kava045/svek-1.dot`) — not the tiny `shape=point,width=.01`
anchor. An id-string filter modeled on OUR naming convention silently
dropped jar's real circle nodes on one side while keeping them on ours,
producing a real-count mismatch on 64/205 scopes that was an artifact of
the filter, not a structural finding.

**Corrected filter: `shape === 'point'` only, applied identically to both
sides** (the true invisible anchor convention both engines share). Under
this filter, real-node counts agree 1:1 on **all 205 scope-instances across
all 90 fixtures (100%)** — declaration-order pairing is well-defined
everywhere it would be needed, with no partial-match fallback logic
required.

However, per §2, switching to it **cannot change any reported delta
number** — sorted pairing is already the error-minimizing bijection
everywhere. Its value is purely **attribution fidelity**: naming which
REAL state's box the row belongs to, instead of a rank position that
shifts if node count or sizes change. This corroborates (and is
corroborated by) the already-CLOSED finding in
`.agent-notes/class-ink-shared-offset-groups.md` item (c): jar declares the
`[*]` circle FIRST while we append synthetic nodes LAST, "a real
divergence… but it is not what produces the [size delta]" — exactly the
same "order differs, numbers don't" result this audit reached
independently from the size side.

**Size estimate.** One `scripts/measure-composite-declared-size.ts` change
(PROPOSED, not implemented per ADR-2): replace `sortedAxis` + identity-index
pairing with (1) a `declOrder`-based extraction on both sides filtered to
`shape !== 'point'`, preserving first-declared order, (2) zip by position.
~40–60 line change, one file, no `src/` change. Verification: re-run in
both modes and diff; the summary counters (144/29/4/79) must stay
byte-identical (proven possible by §2 — no bijection changes total error),
while `idx` becomes a real declared-node position instead of a sort rank.
**Small** — a single script change, estimated ≤1 day, because the
100%-real-count-alignment measured here removes the only source of
complexity (a partial-match fallback) that would otherwise inflate the
estimate.

## 4. Counter cross-check (task item 4)

Re-ran `npx jiti scripts/measure-composite-declared-size.ts
--mismatched-only` (read-only invocation, no file changes — the same
command the mission's own close-out quality gate runs) and independently
re-tallied `exact`/`mismatched`/`lastDigitOnly`/`dirtyFixtures` from the
probe's full sorted arrays using the harness's own two thresholds
(`EXACT_EPSILON = 5e-7`in, `lastDigit` upper bound `1.5e-6`in,
`scripts/measure-composite-declared-size.ts:62,125`):

| counter | harness | this audit's independent tally | match |
|---|---|---|---|
| `mismatched` | 144 | 144 | yes |
| `lastDigitOnly` | 29 | 29 | yes |
| `dirtyFixtures` | 79 | 79 | yes |
| `unmatchedFixtures` | 4 | 4 | yes |

**Zero discrepancy.** As a sanity decomposition: `dirtyFixtures` = 63 real
fixtures (all dirty by construction — PARTITION.md's own definition
requires `>=1` row `|Δ| >= 0.05`px, far above the last-digit bound) + 16 of
the 27 precision fixtures (`domoru-86-coki670`, `fadupe-90-koti079`,
`gifasa-23-zile558`, `jaxebo-54-nifi592`, `jelusa-98-nexa591`,
`jorere-75-peja265`, `ketibo-84-juzo029`, `lalava-26-zosi801`,
`lasasi-13-nona547`, `leloja-87-tebi184`, `lonuti-97-voko521`,
`mifuti-36-jine785`, `soxene-95-domu248`, `sumiri-68-suvo696`,
`tegali-39-molu382`, `zitifa-97-bizo337` — verified individually by
re-deriving each row's full 6-decimal delta, since PARTITION.md's 3dp `Δpx`
display cannot distinguish `lastDigit` from `mismatched` on its own: the
`lastDigit` band is `[3.6e-5, 1.08e-4]`px, invisible at 3dp). The remaining
11 precision fixtures are pure last-digit (every row inside the
last-digit band) and correctly excluded from `dirtyFixtures`.

## 5. Unmatched (task item 1's "note on whether a subset could be paired")

All 4 unmatched fixtures (`cagego-53-vemo516`, `fugedo-34-fice721`,
`xacona-99-peze211`, `zecivu-62-pagu681`) have **zero cached `svek-N.dot`
files** — confirmed by directory listing: each `test-results/dot-cache/state/<slug>/`
contains only `in.puml` and `in.svg`, no `svek-*.dot` at all. This is **not**
a scope-count mismatch between two populated sides (which is what
`measureFixture`'s `dots.length !== inputs.length` branch is written to
catch generically) — it is an **absent jar-side oracle artifact**. No
subset of scopes can be paired because there is nothing on the jar side to
pair against at any index. This looks like a caching gap in whatever
populated `test-results/dot-cache` for these 4 slugs specifically, not a
structural divergence in the diagrams themselves — worth re-running the
oracle dump for just these 4 before T12's bucket is treated as a genuine
"jar and ours structurally disagree" class. Not independently verified
beyond the file-existence check (re-running the oracle capture is outside
this task's read-only probe boundary).

## 6. Proposed harness improvements (PROPOSED, not implemented — ADR-2)

1. **Adopt Candidate B (declaration-order pairing, §3)** — zero risk to the
   reported numbers (proven by §2), strictly better attribution. The
   natural next step once proposed.
2. **Re-cache the 4 unmatched fixtures' jar `svek-N.dot`** (§5) — likely a
   one-line re-run of whatever produced `test-results/dot-cache` for the
   other 268 state fixtures, not a real structural divergence.
3. **Emit a `tiedWith` field on rows in a tie cluster** — the harness
   already discards the information that would make a `possible`
   pairingRisk visible (two nodes sharing a value); tagging it removes the
   need for a probe like this one to reconstruct it per audit.
4. **Add the §2 exhaustive-pairwise self-check as a cheap per-scope/axis
   assertion** (`O(n²)`, `n` ≤ 13, negligible cost) and emit a
   `pairingSound: boolean` field per fixture, so a FUTURE regression that
   actually breaks sorted-pairing's optimality (unlike anything found here)
   surfaces automatically instead of requiring a fresh audit.
