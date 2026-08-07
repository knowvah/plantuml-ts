# SYNTHESIS — the description size tail re-partitioned by true mechanism

**Input:** 26 fixture records across seven Batch-1 findings files.
**Output:** 13 mechanism groups. 26 in, 26 out, each appearing exactly once.
**Unresolved:** 0 fixtures. **Proposed divergences:** 0 (see §5).
**Slug set verified** against `oracle/goldens/description/size-backlog.json`:
30 pinned entries = these 26 + the 4 deliberately excluded
(`gevozu-46-sasu860`, `sunuju-01-pote718` LaTeX; `gafico-37-cuma657`,
`nujito-06-neca370` GH #24 `<code>`).

## 1. The batching table

`oracle/goldens/description/size-backlog.json` is written by **every** group
(each deletes its own pins). It is a known, universal serialization point and
is named here once rather than in each row.

| Group | Mechanism (1 line) | Origin file:line | Fixtures | proposedWriteSet | Overlaps with |
|---|---|---|---|---|---|
| **G1** TYPE0 openers | `CommandCreateElementMultilines` TYPE0 (open-quote declaration) has no port; the opener falls through to the single-line rule and continuation lines are dropped | `src/diagrams/description/parser.ts:107` | `pecupa-75-zote612`, `tajadu-40-juro990`, `nixura-77-bina738` (3) | `parser.ts`, `parse-helpers.ts`, `parse-state.ts` | **G8, G9** (`parser.ts`, `parse-helpers.ts`); **G6, G8** (`parse-state.ts`) |
| **G2** `measureNote` rebuild | `measureNote` models a note body as flat `lineCount × 13` instead of `BodyFactory.create3`→`BodyEnhanced2`. **One site, four causes** (§3) | `src/diagrams/description/leaf-sizing.ts:215-226` (`:221` font, `:223` `{{`, `:224` height) | `xufexu-38-fola855`, `pivudu-29-pele178`, `tijexo-10-zipo222`, `kovaxi-11-reti348`, `zidebi-71-nocu387` (5) | `leaf-sizing.ts`, `renderer-entity.ts`, `CreoleParser.ts` | **G4** (`leaf-sizing.ts`) |
| **G3** stereotype-as-sprite | `buildStereo` implements only upstream's third branch — no `stereotype.getSprite()` branch and no `buildComplex` empty-label rewrite — so a `<<$sprite>>` measures as literal `«$name»` text | `src/core/svek/image/EntityImageDescriptionDelegates.ts:337` | `nobiza-91-fimo741`, `turasu-73-zoni468`, `lesori-32-zeve057`, `ravodu-50-siso430`, `tuliba-37-liza126` (5) | `EntityImageDescriptionDelegates.ts`, `parse-helpers-strings.ts`, `ast.ts`, `leaf-sizing-entity.ts` | **G7** (`parse-helpers-strings.ts`); **G4, G5, G10** (`leaf-sizing-entity.ts`); **G12** (`EntityImageDescriptionDelegates.ts`) |
| **G3b** internal sprite bundle | `getSprite` has no `SpriteImage.fromInternal` fallback, and the `sprite $N jar:…` command form is unported — so the jar-resident `/sprites/**` set can never resolve | `src/core/sprite-commands.ts:132` (+ `:428`) | *(carries no fixture of its own — prerequisite for 4 of G3)* (0) | `sprite-commands.ts`, NEW `assets/sprites/**` package + loader seam | none (write-set disjoint from G3 — but semantically **downstream** of it) |
| **G4** stereotype font size | The sizer resolves exactly ONE font size per leaf; `fontStereo` is filled from the title font, so a per-element stereotype font size never reaches the measure path | `src/diagrams/description/leaf-sizing-entity.ts:146` | `loroto-06-fano471`, `toxine-81-xofo986`, `kofuca-08-pafi749` (3) | tier 1: `layout.ts`, `layout-dot-tree.ts`, `leaf-sizing-consts.ts`, `leaf-sizing.ts`, `leaf-sizing-entity.ts` · tier 2: `preprocessor.ts`, `skinparam-stereo-keys.ts`, `style-map-element.ts`, `theme-graph-colors.ts`, `theme-element-resolve.ts`, `renderer-symbol.ts` | **G2** (`leaf-sizing.ts`); **G5** (all four tier-1 thread files); **G3, G10** (`leaf-sizing-entity.ts`) |
| **G5** line thickness | `BoxSizingOpts` carries no line thickness, so the sizer builds its params with a hardcoded `UStroke.withThickness(0.5)` while the renderer draws 4 | `src/diagrams/description/leaf-sizing-entity.ts:144` | `revusu-28-pexi248` (1) | `layout.ts`, `layout-dot-tree.ts`, `leaf-sizing-consts.ts`, `leaf-sizing-entity.ts` | **G4** (identical thread, all four files); **G3, G10** (`leaf-sizing-entity.ts`) |
| **G6** command-table gaps | Two `CommandCreateElementFull` alternatives are unported: the no-SYMBOL/unquoted-CODE branch, and `CODE as "quoted DISPLAY"` (which flips the code/display roles) | `src/diagrams/description/element-grammar.ts:170` + `command-table-containers.ts:45` | `gogamo-72-pibo470`, `dopova-50-digo290` (2) | `element-grammar.ts`, `command-table-containers.ts`, `command-table-shorthand.ts`, `parse-state.ts` | **G1, G8** (`parse-state.ts`) |
| **G7** stereotype regex | `extractNodeStereotype`'s hand-written `/<<\s*(.+?)\s*>>/g` lets `.` match `<`/`>`; upstream's pattern excludes them except for `<&icon>` | `src/diagrams/description/parse-helpers-strings.ts:268` | `junoxu-15-gori632` (1) | `parse-helpers-strings.ts` | **G3** (same file, and same function `extractNodeStereotype`) |
| **G8** body-line trim | `processLine` trims every source line before dispatch, so a `[ … ]` body loses its relative indentation and every creole tree cell collapses to level 1 | `src/diagrams/description/parser.ts:243` | `vixeni-34-nici683` (1) | `parser.ts`, `parse-state.ts` | **G1, G9** (`parser.ts`); **G1, G6** (`parse-state.ts`) |
| **G9** multiline-open stereotype + tabs | `keyword code <<st>> [` parses the stereotype into a non-capturing group and drops it (E1); `\t` is measured as zero-width instead of advancing to a tab stop (E2). **Carries an undiagnosed residual — §4** | `src/diagrams/description/parser.ts:111` (E1); absent `AtomText` tab branch → `src/core/klimt/creole/legacy/StripeSimple.ts:267` (E2) | `fariba-82-xolu802` (1) | `parse-helpers.ts`, `parser.ts`, `StripeSimple.ts` (+ new `AtomText.ts`) | **G1, G8** (`parser.ts`); **G1** (`parse-helpers.ts`); **G10** (`StripeSimple.ts`) |
| **G10** url-label sprite scale | A `<$sprite>` inside `[[url label]]` is built through a second upstream constructor that passes the RAW scale; our scanner emits one undifferentiated token so `fontSize/13` is applied unconditionally | `src/core/klimt/creole/legacy/StripeSimple.ts:221` | `bivira-53-boja685` (1) | `creole-atoms.ts`, `StripeSimple.ts`, `creole-atoms-measure.ts`, `render-atoms.ts`, `leaf-sizing-entity.ts` | **G9** (`StripeSimple.ts`); **G3, G4, G5** (`leaf-sizing-entity.ts`) |
| **G11** OpenIconic table | The OpenIconic glyph table holds 6 of upstream's ~223 names; an absent name has its markup consumed and emits no atom, losing the advance | `src/core/creole-atoms-openicon.ts:44` | `vivido-49-nisu863` (1) | `openiconic-glyphs.ts`, `creole-atoms-openicon.ts` | **none** — fully disjoint |
| **G12** emoji artwork | `<:name:>` draws as a platform-glyph `UText` instead of Twemoji SVG artwork, so `Footprint`'s point collector sees the wrong shape and the wrong vertical origin | `src/core/klimt/creole/atom/AtomEmoji.ts:61` | `murava-69-tago286` (1) | `AtomEmoji.ts`, `Emoji.ts`, `EntityImageDescriptionTextBlock.ts`, `EntityImageDescriptionDelegates.ts`, `class-member-atom-resolve.ts`, NEW emoji asset channel | **G3** (`EntityImageDescriptionDelegates.ts`) |
| **G13** non-deterministic golden | The committed golden was captured without `PLANTUML_DETERMINISTIC_TEXT`, so it carries real AWT metrics. **Not a port defect** (maintainer-ruled 2026-08-06) | `oracle/goldens/description/kokebo-27-vafi688/svek-1.dot:6` | `kokebo-27-vafi688` (1) | goldens + backlog only — **no `src/` change** | none (`src/`-disjoint) |

**Count check:** 3+5+5+0+3+1+2+1+1+1+1+1+1+1 = **26** ✓

### Co-requisites (a fixture counted in one group whose conformance needs a second)

| Fixture | Counted in | Also requires | Why |
|---|---|---|---|
| `nobiza-91-fimo741` | G3 (dominant, 0.2769) | **G2** | its note residual (0.0139) is the img-fallback run font billed at the note's 13 |
| `turasu-73`, `lesori-32`, `ravodu-50`, `tuliba-37` | G3 | **G3b** | their sprites are jar-internal; G3's branch has nothing to resolve without the bundle |
| `vivido-49-nisu863` | G11 (dominant, 0.1574) | **G10** | its nodes 0/1 carry the url-label sprite factor |
| `loroto-06`, `toxine-81` | G4 | **G4 tier 2** | tier 1 alone moves `nodebar` from +4px to +10px — ship both or the ratchet widens |
| `kofuca-08` | G4 | — | exercises tier 1 only; closes without tier 2 |

## 2. Ruling on the `xufexu-38` ↔ `pivudu-29` contradiction

**Ruled: ONE mechanism, one origin, one group (G2). T4's link is upheld — but
on source evidence, not on T4's assertion.** The orchestrator's working read
("xufexu is a two-mechanism fixture") and T6's "distinct defect with a
different origin" are both **overridden**.

**There was never an origin disagreement.** T4 and T6 both record
`src/diagrams/description/leaf-sizing.ts:224`. The disagreement is over the
sufficiency of T6's *candidate fix*, not over the mechanism.

- T6 is **correct** that its own candidate — `textBlockHeight(display,
  NOTE_FONT_SIZE)` — moves `xufexu` 0px. That route consults
  `isCreoleHrLine`/`classifyStripeLine`, whose patterns require ≥4 characters
  (so `--` and `==` are missed entirely) and which bills a flat 8 for every
  rule (so `==toto==` would be 8, not 17). Both failures are real.
- T6 **explicitly declined to attribute** the gap: *"I did not locate its
  upstream site (`CreoleStripeSimpleParser.java:66-73`'s patterns require 4
  chars and cannot explain the jar accepting `--`/`---`), so it is recorded as
  measured behaviour, not as an attributed mechanism."* Per
  `~/.claude/rules/diagnosis.md` that is the correct in-progress state — and it
  means T6 never claimed a second *mechanism*, only a second observation.
- T4 located the site. **I verified it independently in source**, which is what
  settles this: `src/core/cucadiagram/BodyEnhancedAbstract.ts:84-90`
  (`isBlockSeparator`, "ported verbatim" from `BodyEnhancedAbstract.java:67-82`)
  accepts `--…--`, `==…==`, `..…..` (except `...`) and `__…__` with **no length
  floor**; `decorate` (`:100-125`) implements the +0 / +8 / `4 + h` geometry.

**Decisive evidence — the ported `isBlockSeparator` predicts T6's jar-probed
truth table exactly, row for row:**

| T6's jar probe | `isBlockSeparator` | `getTitle` (null if len ≤ 4) | predicted | T6 measured |
|---|---|---|---|---|
| `--`, `==`, `..`, `__` | accept | null (len 2) | 8px | 8px ✓ |
| `---`, `___` | accept | null (len 3) | 8px | 8px ✓ |
| `....` | accept | null (len 4) | 8px | 8px ✓ |
| `..x..`, `--X--`, `==toto==` | accept | title (len > 4) | 17px | 17px ✓ |

T6's unattributed observation **is** `isBlockSeparator` + `getTitle`'s ≤4 rule,
seen from the other side. It is not a second defect; it is the *same* missing
`BodyEnhanced2` route, described as the reason a different candidate fix would
fail. The correct fix never consults `classifyStripeLine` at all, so **no
classifier work exists in this group** and `CreoleStripeSimpleParser.ts:95` is
not in any write-set.

**I also re-verified T4's load-bearing "no new porting work" claim**, because
its size estimate depends on it. It stands: `getTitle` IS ported (privately on
`BodyEnhanced2.ts:208` and `BodyEnhanced1.ts:249`; `BodyEnhancedAbstract.ts:57`
documents why it is not on the abstract base), and `BodyFactory.create3` exists
at `BodyFactory.ts:134`, already wired for entity `desc`.

**Residual check:** xufexu's four separators are *all* block separators; none
is an in-block HR. T4's arithmetic closes both notes to the pixel with zero
free parameters (116px and 129px). There is no second-mechanism remainder.

### Other reciprocity audits

| Link | Reciprocal? | Resolution |
|---|---|---|
| `kovaxi-11` ↔ `zidebi-71` | mutual | one group (G2) |
| `lesori-32` ↔ `ravodu-50` ↔ `tuliba-37` | mutual | one group (G3) |
| `nixura-77` ↔ `pecupa-75`/`tajadu-40` | mutual — **diagnosed independently by T4 and T5 to the same `parser.ts:107`** | corroborated; one group (G1) |
| `turasu-73`/`nobiza-91` → `lesori-32`/`ravodu-50`/`tuliba-37` | **one-way** (T1 hypothesised "likely shared with the sprite bucket" without naming; T2 named and evidenced it) | not contradictory — merged into G3. Line discrepancy `:337` (T2) vs `:343` (T1) is the function entry vs the `«label»` map inside it; same function |
| `kofuca-08` → `loroto-06`/`toxine-81` | **one-way** (T2 named it; T3 had no visibility into T2's fixture) | not contradictory — T2 re-derived the arithmetic against the same origin. Merged into G4 |
| `tijexo-10` → *none*, explicitly refusing the `loroto`/`toxine` link | n/a | **T3 is right**: `measureNote` is not on the `measureEntityLeaf` route, so it is not G4's mechanism. It joins G2 by **fix site** (same 12-line function), not by mechanism — see §3 |
| `revusu-28` → *none*, asks T8 to find siblings | n/a | searched all 26: no other fixture carries a `LineThickness` mechanism. Confirmed singleton — but it shares G4's entire tier-1 write-set |
| `murava-69` → *none*, deliberately checked against the sprite bucket | n/a | upheld; G12 is disjoint |

### Identical-delta pairs (SCHEMA rule 3) — all three reconciled as shared cause

| Pair | Delta | Verdict |
|---|---|---|
| `kovaxi-11` / `zidebi-71` | 0.772023 | shared (G2); sole source difference `set namespaceSeparator none` proven size-inert by bit-identical non-note nodes |
| `lesori-32` / `ravodu-50` | 0.242882 | shared (G3); sole source difference is a re-positioned `StereotypeAlignment` |
| `loroto-06` / `toxine-81` | 0.083333 | shared (G4); `<style>` vs `skinparam` spellings converge on identical `theme.colors.elements` |

None required a refutation. `CLAUDE.md`'s "an IDENTICAL delta = ONE shared
cause" holds for a fourth, fifth and sixth time.

## 3. G2 is one fix site serving four causes

`measureNote` (`leaf-sizing.ts:215-226`) is **the highest-value site in the
tail**: 12 lines, 5 fixtures outright, a 6th (`nobiza-91`) partially.

| # | cause | line | fixtures |
|---|---|---|---|
| C1 | block-separator geometry: body never split on `isBlockSeparator`, never `decorate`d | `:224` | `xufexu-38`, `pivudu-29` |
| C2 | `{{ … }}` never collapses to an `EmbeddedDiagram` atom (upstream's 42×42 catch fallback) | `:223` | `kovaxi-11`, `zidebi-71` |
| C3 | `NOTE_FONT_SIZE` hardcoded; `opts.fontSize` delivered and ignored | `:221` | `tijexo-10` |
| C4 | height blind to a line whose RUN font is the img-fallback 14, not the note's 13 | `:224` | `nobiza-91` (residual) |

They are four distinct causes, so they are not merged by the "one change fixes
both" rule — but they occupy one function in one file and **must be one task**.
Routing `measureNote` through `BodyFactory.create3`→`BodyEnhanced2` plausibly
subsumes C3 and C4 as well (the real text-block model takes its font from
config and measures each line from its run fonts), but that is an expectation,
not a measured claim — the task must verify each of the four separately.

**Trap the task must carry (from T3):** `leaf-sizing.ts:109` collapses "no
override" into `baseFont` (14), so by the time `measureNote` runs,
`fontSpec.size` cannot distinguish "no override" (must measure at 13) from
"override 14". Reading `fontSpec.size` directly regresses every plain note by
1px. Read `opts?.fontSize ?? NOTE_FONT_SIZE`, or change line 109.

**Maintainer ruling folded in (2026-08-06):** C2 reproduces
`EmbeddedDiagram.java:149`'s 42×42 catch-block fallback **faithfully. No
divergence is declared.** T1's flagged divergence question is closed.

## 4. Honest gaps — 0 unresolved fixtures, 1 open sub-diagnosis

No record carries `status: unresolved`, so this list is empty by the schema.
One item nonetheless must not be lost, because the fix mission will otherwise
declare a fixture closed that is not:

**`fariba-82-xolu802` (G9) has an undiagnosed residual.** E1 + E2 account for
the *reported* headline delta exactly (14 + 14 = 28px = 0.388889in), but a
different node carries a separate, reproduced, **undiagnosed** error: `sh0006`
(the awslib `User(user, "Trusted user", "")` element) is oracle 1.462500 ×
1.722222 vs ours 1.462500 × 1.750000 — **+2px height (0.027778in)**,
reproduced in isolation and independent of label width. Once E1+E2 land, that
+2px becomes the fixture's headline and it stays above the 0.01in bar.

- **nextStep (T1's, carried forward):** instrument the `$User [64x64/16z]`
  sprite + label stack height in `measureEntityLeaf`.
- **Consequence for planning:** G9 is the one group whose conformance gain is
  **not** guaranteed by its own fix. Schedule the residual as a diagnosis
  sub-task *before* the G9 fix task, not after.

Two further reproduced-but-uncovered defects were recorded by Batch 1 and have
**no golden today**. Per `CLAUDE.md`'s "the corpus is a starting point", each
needs an authored fixture + jar oracle rather than being dropped:

1. **Emoji-only creole line measures 3×`factor` too tall.**
   `EMOJI_LINE_HEIGHT_FACTOR = 39` (`AtomEmoji.ts:38`) is applied
   unconditionally, but upstream's `39*factor` is emergent from `Sea.doAlign`
   when a TEXT atom shares the line. Jar `rectangle "<:rocket:>"` = 41×41px;
   ours 41×42.75. Same file as G12 — fold in there.
2. **A display whose FIRST line is entirely `[[url label]]` measures the url
   text as well as the label.** `rectangle "[[http://www.google.com abc]]"`:
   jar 0.591319, ours 2.663368. `buildLineAtoms` is *not* at fault — start at
   `parse-helpers-strings.ts`'s `RE_URL_TOKEN_G`/`parseNameSection`.

## 5. Proposed divergences (ADR-6) — none

The list is empty. The one candidate raised in Batch 1 —
`kovaxi-11`/`zidebi-71`'s 42×42 embedded-diagram fallback, where matching the
oracle means reproducing an upstream *failure* — was put to the maintainer and
**ruled 2026-08-06: reproduce faithfully, no divergence declared.** It remains
in scope as a normal fix inside G2 (cause C2).

`kokebo-27-vafi688` (G13) is **not** a divergence either. It is an
oracle-capture defect: the golden was taken without
`PLANTUML_DETERMINISTIC_TEXT`. Maintainer-ruled **not a port defect**;
regenerating it under the flag reproduces our output bit-for-bit.

## 6. Measurement-harness assessment — `maxSizeDeltaIn` is an order statistic

Five of the 26 records (`nixura-77`, `kovaxi-11`, `vixeni-34`, `tuliba-37`,
`dopova-50`) independently found that their reported delta is not any node's
error. T4 named it "a sorted-pairing artifact of the measurement harness". It
is harness-wide, and it is worth stating precisely because the fix mission will
read these numbers as targets.

- **Mechanism.** `sizeDeltas` (`tests/oracle/svek-dot.ts:251-253`) builds
  `[...nodes.map(width), ...nodes.map(height)].sort()` **per side**, then pairs
  by index. Node identity is destroyed before comparison.
- **Direction: it DEFLATES, it does not inflate.** Sorting both sequences is
  the minimum-cost 1-D matching under absolute cost, so the reported max is
  taken over an optimistic pairing. Every documented case under-reports:

  | fixture | reported | true worst single-node error |
  |---|---|---|
  | `nixura-77` | 1.273091 | 1.652575 (UC1 height) |
  | `vixeni-34` | 0.203299 | 0.222222 (B width, 16px) |
  | `tuliba-37` | 0.521007 | 0.772 (F width, 55.6px) |

  **So the concern that this inflates other fixtures' headline deltas is not
  supported by the evidence — the risk runs the other way.**
- **The real corpus-wide risk is FALSE CONFORMANCE, on the 321 passing
  fixtures rather than the 30 pinned ones.** Nothing in `sizeDeltas` can detect
  a *permutation*: oracle nodes (1.0, 2.0) against ours (2.0, 1.0) sort to
  identical multisets and report delta 0 — passing the 0.01in bar with every
  node wrong. Two records already lean on exactly this coincidence when
  predicting their post-fix number (`kovaxi-11`: "the two sorted lists coincide
  and the delta is 0"; `vixeni-34`: same). Those two predictions happen to be
  sound because the nodes also become correct — but the metric would report 0
  either way, so it cannot be the thing that confirms them.
- **Recommended (own task, before or alongside the fix mission):** add a
  by-node-id paired metric beside the order statistic. DOT node ids (`sh0006`…)
  are stable and present in both graphs, and 5 of the 26 records already did
  this pairing by hand. Then re-measure all 351 to find fixtures currently
  passing on a permutation. This is an audit of the *gate*, not of the port,
  and its result may change what "321/351" means.

## 7. Provenance — bucket label → mechanism group (the ADR-3 verdict)

**7 buckets scattered into 13 groups. Exactly one bucket survives as a
partition, and even it was under-counted.** ADR-3 was decisively right.

| Bucket (n) | scattered into | groups |
|---|---|---|
| `container-cluster` (9) | G2 (`kovaxi-11`, `zidebi-71`) · G3 (`lesori-32`, `ravodu-50`, `tuliba-37`) · G7 (`junoxu-15`) · G8 (`vixeni-34`) · G9 (`fariba-82`) · G13 (`kokebo-27`) | **6** |
| `sprite` (5) | G3 (`nobiza-91`, `turasu-73`) · G4 (`kofuca-08`) · G10 (`bivira-53`) · G11 (`vivido-49`) | **4** |
| `element-font` (5) | G4 (`loroto-06`, `toxine-81`) · G5 (`revusu-28`) · G6 (`gogamo-72`) · G2 (`tijexo-10`) | **4** |
| `creole-titled-separator` (2) | G1 (`nixura-77`) · G2 (`xufexu-38`) | **2** — bucket does not survive |
| `multiline-display` (2) | G1 (`pecupa-75`, `tajadu-40`) | **1** — the only 1:1 bucket, and it was **short by one**: `nixura-77` belongs to it |
| `other` (2) | G6 (`dopova-50`) · G2 (`pivudu-29`) | **2** (a fallthrough label, so this is expected) |
| `icon` (1) | G12 (`murava-69`) | **1** by count, but the **label is wrong**: `murava-69` is the `<:emoji:>` half of the regex, and the bucket's real OpenIconic fixture (`vivido-49`, G11) sits in `sprite` |

Not one of `container-cluster`'s nine is cluster geometry.
`computeContainerBbox`/`frontier-cluster-bbox.ts` is implicated by **zero** of
the 26 fixtures and was never reached in diagnosis. The classifier fired on
`{{` embedded-diagram openers, on block-form `skinparam <kw> {` selectors, and
on `<style>` selectors.

## 8. Recommended batch structure for the FIX mission

Two files serialize nearly everything and should be treated as ownership hubs:

1. `oracle/goldens/description/size-backlog.json` — written by every group.
2. `src/diagrams/description/leaf-sizing-entity.ts` — in G3, G4, G5 **and**
   G10's write-sets. It is the second hub and the reason the sprite, font and
   creole work cannot all run at once.

`parse-state.ts` is a third, smaller one (G1, G6, G8).

| Batch | Task | Groups | Owns (write-set) | Fixtures closed | Running |
|---|---|---|---|---|---|
| **F1** | F1-a `measureNote` rebuild | G2 | `leaf-sizing.ts`, `renderer-entity.ts`, `CreoleParser.ts` | +5 | 326 |
| | F1-b parser: block openers + body text | G1, G8, G9-E1 | `parser.ts`, `parse-helpers.ts`, `parse-state.ts` | +4 (`fariba` partial) | 330 |
| | F1-c OpenIconic glyph table | G11 | `openiconic-glyphs.ts`, `creole-atoms-openicon.ts` | +0 alone | 330 |
| **F2** | F2-a command table + grammar | G6 | `element-grammar.ts`, `command-table-containers.ts`, `command-table-shorthand.ts`, `parse-state.ts` | +2 | 332 |
| | F2-b stereotype extraction + `buildStereo` M1 | G3 (M1), G7 | `parse-helpers-strings.ts`, `EntityImageDescriptionDelegates.ts`, `ast.ts`, `leaf-sizing-entity.ts` | +2 (`junoxu`; `nobiza-91` via F1-a) | 334 |
| | F2-c url-label sprite factor | G10 | `creole-atoms.ts`, `StripeSimple.ts`, `creole-atoms-measure.ts`, `render-atoms.ts` | +2 (`bivira`; `vivido` via F1-c) | 336 |
| **F3** | F3 `BoxSizingOpts` channel thread (tier 1 **and** tier 2 together) | G4, G5 | `layout.ts`, `layout-dot-tree.ts`, `leaf-sizing-consts.ts`, `leaf-sizing-entity.ts`, `leaf-sizing.ts`, + the 6 tier-2 files | +4 | 340 |
| **F4** | F4-a internal `/sprites/**` bundle + `jar:` form | G3b | `sprite-commands.ts`, NEW asset package | +4 | 344 |
| | F4-b Twemoji emoji artwork | G12 | `AtomEmoji.ts`, `Emoji.ts`, `EntityImageDescriptionTextBlock.ts`, `EntityImageDescriptionDelegates.ts`, `class-member-atom-resolve.ts`, NEW asset channel | +1 | 345 |
| | F4-c tab-stop advance (`AtomText`) | G9-E2 | `StripeSimple.ts`, NEW `AtomText.ts` | +1 **if** the §4 residual is resolved | 346 |
| **F5** | F5 goldens + harness (separate gates) | G13, §6 | goldens, backlog, `tests/oracle/svek-dot.ts` | +1 | **347** |

**347/351 = 98.9%.** The remaining 4 are exactly the deliberately excluded set
(2 LaTeX divergence, 2 GH #24 `<code>`) — i.e. **this tail closes completely**.

### Why these serialize

- **F1-a before F3** — both write `leaf-sizing.ts`.
- **F1-b before F2-a** — both write `parse-state.ts`. F2-a's `stillUnknown`
  requirement must be handed to F1-b as an interface contract, or F2-a waits.
- **F2-b before F3 and before F4-b** — `leaf-sizing-entity.ts` (F3) and
  `EntityImageDescriptionDelegates.ts` (F4-b).
- **F2-c before F4-c** — both write `StripeSimple.ts`.
- **F2-b before F4-a** — F4-a's resolved sprites have no consumer until M1's
  `getSprite()` branch exists. Write-sets are disjoint; the dependency is
  semantic, and F4-a is unverifiable if run first.
- **F3 is a single task, not two** — tier 1 alone moves `nodebar` from +4px to
  +10px error. Splitting it widens the ratchet.
- **F2-b merges G3-M1 and G7** — both rewrite `extractNodeStereotype`. G3-M1
  routes it through the already-ported `StereotypeDecoration#buildComplex`,
  which very likely adopts upstream's `<`/`>`-excluding pattern and closes G7
  as a side effect. One function, one owner.
- **F1-c is fully disjoint** — the only group overlapping nothing. It can run
  in any batch.

### Sequencing notes for the planner

- **Schedule the `fariba-82` residual diagnosis (§4) before F4-c.** It is the
  one task whose stated gain is not guaranteed by its own fix.
- **G3b, G12 and the §6 harness audit each carry a non-code decision** (a
  vendored `/sprites/**` bundle with a licence review; a 1.75 MB Twemoji asset
  payload; what "conformant" means). Surface all three to the maintainer at
  planning time, not mid-batch.
- **Cross-engine blast radius:** G10 and G4's tier 2 touch `creole-atoms*` and
  the theme/skinparam layer, shared with class/state/object. Those two tasks
  re-run all four size ratchets; every other task is description-only.
</content>
</invoke>
