# Size-conformance ledger — description diagrams (S1L)

Honest-accounting close of mission **S1L** (maintainer-selected 2026-07-27).
Every non-`conformant` description fixture is carried here by a named
root-cause family, each routed to a tracked follow-on sub-mission or a
`DIVERGENCES.md` entry — satisfying the standing rule *"every conformance bar
is 100% minus known divergences."*

Measurement: `scripts/measure-description-size-deltas.ts` over the 351 committed
`oracle/goldens/description/<slug>/` goldens (all structurally EQUAL). Captured
2026-07-27. A fixture is size-`conformant` when its `maxSizeDeltaIn` ≤ 0.01in.

## Result

| | count | share |
|---|---|---|
| structurally EQUAL goldens | 351 | — |
| size-`conformant` (≤0.01in) | **236** | **67.2%** |
| non-conformant (carried below) | 115 | 32.8% |
| — of which inherent-tolerance DIVERGENCE (LaTeX) | 2 | |
| conformant excluding the LaTeX divergence | 236 / 349 | **67.6%** |

**Updated 2026-07-27 (S1L-b close):** +5 conformant vs the initial S1L close
(231→236). The description `[ … ]` display-body expansion (S1L-b) flipped
`dexigu-24`/`kenece-24`/`zifaji-87` (the `node [ foo1 ==== foo2 ]` HR-height
trio) plus `butebe-90`/`zavitu-69` (creole-formatting width), and shrank
`zotiru-33` (scoped `<style> MinimumWidth`, T5). See the min-width /
display-expansion rows below and the fariba-82 residual section.

Every non-conformant fixture is a keyed entry in
`oracle/goldens/description/size-backlog.json`, pinned at its current delta,
shrink-only. The parity ratchet (`tests/oracle/description-parity.ratchet.test.ts`)
asserts `maxSizeDeltaIn ≤ pin + 1e-6` per fixture and ≤0.01in for any fixture
absent from the backlog — so sizes are regression-proof and a fixture flips to
asserted-`conformant` the moment a sub-mission drops it to ≤0.01 (its entry is
then deleted).

## Non-conformant by cause → routing (120)

Families from `detectCause` (`scripts/measure-description-size-deltas.ts`),
which detects containers (a container keyword opening `{`, or a bare `{` line)
BEFORE the leaf checks — so a `package X { … }` is cluster sizing (S1L-e), not a
leaf tab. First-match wins on compounding fixtures. Representative slugs shown;
the full per-fixture set is `size-backlog.json`. (Re-bucketed 2026-07-27 for
accuracy — the first cut over-counted package-tab/display and under-counted
containers.)

| Family | n | Root cause | Routed to |
|---|---|---|---|
| container / cluster | 47 | container box + child-cluster sizing (`computeContainerBbox` subsystem); not a leaf fix. e.g. fepuvo-06-rugi981, tuliba-37-liza126, berufi-69-dara369 | **S1L-e** |
| uncategorized | 37 | small residuals (≤~0.9in) not yet attributed by the heuristic; per-fixture triage folds each into the family a sub-mission's re-run identifies. e.g. nixura-77-bina738, dopova-50-digo290, kokodo-61-dano461 | triage |
| sprite / stdlib-macro / icon | 11 | scaled sprite dims via `<$…>` or `!include <awslib\|c4\|…>` macros mis-sized (kofuca-08-pafi749 → 478in), unknown sprite/icon → 0 dims. e.g. kofuca-08-pafi749, vivido-49-nisu863, bivira-53-boja685 | **S1L-f** |
| interface shield | 11 | shielded `interface` sized as a generic box, not the fixed 0.25in circle; `isInterfaceShielded` gate exists, sizing does not. e.g. turasu-73-zoni468, cojege-69-ruku138, cegale-42-loxa672 | **S1L-c** |
| min-width floor | 1 | **S1L-b/S1L-g DONE.** `skinparam minClassWidth` (S1L-g) + the `[…]` HR-height fix (S1L-b) made dexigu/kenece/zifaji **conformant** (deleted). `zotiru-33`'s scoped `<style> package { MinimumWidth 300 }` is now wired (S1L-b T5, `resolveElementMinimumWidth`): its `not_nested` package is exact at 4.583in, delta 2.655→0.914. Its remaining 0.914 is the `nested` package **cluster** floor. | **S1L-e** (nested-cluster residual) |
| display-text expansion | 4 | **Bracket-body + creole-`====` HR DONE (S1L-b); codepoint decode-ordering DONE (S1L-b-unicode T1).** `[ … ]` bodies reach `measureLeafNode`; creole HR renders + sizes at 8px; `<U+…>`/`&#…;` now decode per-line at measure time (AFTER the `\n` split), so codepoint newlines are inline — heights no longer over-split. The 4 pinned fixtures are now DIAGNOSED, NAMED residuals (not simple bracket cases): **gafico-37-cuma657 (5.68→3.75)** + **nujito-06-neca370 (3.35→3.12)** — both driven by node c's UNPORTED `<code>` block (S1L-b-unicode T2, deferred E2r L2), NOT quoted-title literalness (Rule 2 corrected); **lurupu-11-fubo915 (2.05→CONFORMANT)** — was a sizer↔renderer creole-lexer divergence on `<font Name>`/unclosed-`<b>` (S1L-b-unicode T3), RESOLVED by creole-lexer-unification (2026-07-27, below); **xufexu-38-fola855 (1.46→0.153)** — bracket-body + container (S1L-e). See the three S1L-b-unicode sections + the creole-lexer-unification section below. | `<code>` (E2r L2) / ~~creole-lexer sync~~ DONE / **S1L-e** |
| package / folder tab (leaf) | 3 | form-dependent leaf tab geometry (`package "X"` no braces). e.g. codabo-50-mupa164, tajadu-40-juro990, cobuju-30-paxo591 | **S1L-a** |
| latex (DIVERGENCE) | 2 | KaTeX ≠ JLaTeXMath — see below. gevozu-46-sasu860, sunuju-01-pote718 | DIVERGENCES |
| wrapWidth | 1 | `skinparam wrapWidth` word-wrapping unimplemented. mejoxi-96-cegu294 | **S1L-d** |

Container/cluster (47) is the dominant description-sizing gap. The 37
uncategorized are small and pinned; each is attributed to one of S1L-a..g as
those missions re-measure. Nothing here except LaTeX is excluded — all count
against the bar until conformant.

## Inherent-tolerance divergence (excluded from the conformant denominator)

| Slug | Δ (in) | Cause |
|---|---|---|
| gevozu-46-sasu860 | 4.67 | LaTeX label rendered via KaTeX ≠ upstream JLaTeXMath — different math engine, different glyph metrics. Permanent, maintainer-approved (`DIVERGENCES.md`). |
| sunuju-01-pote718 | 4.67 | same |

These 2 are the **only** exclusion. Sprites, OpenIconic, and `<style>` blocks
are ported subsystems (gaps in coverage, not divergences) and stay in the
denominator, routed to S1L-f/S1L-b above.

## S1L-b T6 — fariba-82 documented residual (diagnosed, pinned)

`fariba-82-xolu802` (`file policy <<policy>> [ JSON body ]` + an awslib `User`
sprite) sits at delta **1.024479in** after S1L-b T1–T3 (it *widened* 0.034in
past its prior 0.990278 pin when T2 first routed the `[ … ]` body to the sizer
— expected, not a regression). Diagnosed (evidence, not guess), pinned at its
true delta per ADR-5; **no cheap in-scope fix exists**. Compound of two factors:

1. **awslib `User` sprite (`user` node) — OUT OF SCOPE (S1L-f).** Our sprite
   node measures ~2.18in vs the oracle ~1.46in. Sprite sizing is the S1L-f
   sub-mission, explicitly excluded by T6's boundaries.
2. **`policy` `file` box over-wide — a body-wrap gap, not a leaf-width bug.**
   Our box is ~3.8in, the jar's ~2.4in. The widest body line
   `"Resource": "arn:aws:iam::1:role/role"` measures 229px via our width table
   (`leaf-sizing.ts#maxLineWidth`) — table-correct and weight-agnostic — but
   the jar's `file` body box is far narrower, i.e. the jar constrains/wraps the
   long un-wrapped JSON line in a way this port does not yet reproduce (a
   word-wrap/MaximumWidth behavior, → **S1L-d** territory, not a one-line fix).

**Ruled out (with evidence):** bold-glyph width — the deterministic measurer is
weight-agnostic, `<b>arn</b>` measures exactly as `arn` (ADR-2); tab width —
`WidthTableMeasurer` gives `\t` **0 width**, so the JSON's leading tabs do NOT
inflate our box; creole formatting tags — stripped by T3's `creoleVisibleText`.
Origin: `src/diagrams/description/leaf-sizing.ts#maxLineWidth` (correct per
table) + sprite sizing (`render-atoms.ts`, S1L-f). Kept pinned at 1.024479.

## S1L-b-unicode T1 — codepoint decode-ordering (DONE)

`<U+XXXX>`/`&#NNN;` escapes now decode per-line at measure/render time, AFTER
the `\n` split (ADR-1), mirroring upstream `AtomText.manageSpecialChars`. A
`<U+000A>` is inline, not a line break, so it no longer over-splits leaf boxes.
Output-neutral (dot-sync 262/262 + 90/90 EQUAL, zero widened). HEIGHT residuals
dropped: **gafico-37-cuma657 5.680208→3.752777**, **nujito-06-neca370
3.350521→3.122049** (size-backlog re-pinned, shrink-only). lurupu-11-fubo915
unchanged (its residual is emoji glyph width → T3).

## S1L-b-unicode T2 — gafico-37 documented residual (diagnosed, pinned)

`gafico-37-cuma657` sits at delta **3.752777in** after T1. Diagnosed (oracle
SVG + DOT evidence, not guess); pinned at its true delta; **no in-scope fix
exists**. The pin is driven by node **c** (`node c [ <code> $var </code> ]`) —
NOT the quoted-title node a.

- **Driver — unported `<code>` block (OUT OF SCOPE, E2r L2).** Upstream renders
  `<code>…</code>` as ONE verbatim monospace line: content neither
  creole-parsed nor codepoint-decoded (the oracle SVG shows
  `aaa <U+000A> bbb <U+000A> <u:blue>ccc …` literal, `font-family="monospace"`,
  `textLength=640.582`) → node c box **7.857×0.611in**. The port has not ported
  the `<code>` creole command (no code-block command in
  `src/core/klimt/creole/`; explicitly deferred —
  `EntityImageDescriptionSupport.ts:393` NOT-in-E2r-scope list), so it treats
  the three bracket lines `<code>` / `$var`(expanded) / `</code>` as three
  ordinary lines, creole-stripping and codepoint-decoding the `$var` line →
  **4.104×1.000in** (3 narrow lines). Width delta 3.753 (too narrow) is the max.

- **Rule 2 CORRECTION — the quoted title is NOT rendered literally.**
  `decisions.md` Rule 2 stated node a (`node "$var"`) renders as a single
  literal 77-char `<text>` (7.857in). That is FALSE: the 7.857in literal
  monospace `<text>` is node **c**'s `<code>` block (above), which planning
  mis-attributed to node a. The oracle SVG for node a (y=47.77, one line)
  CREOLE-PROCESSES it — three colored runs (`<u:blue>ccc` underlined blue,
  `<color:green>ddd` green, `<U+000A>` decoded to inline whitespace) — box
  **2.145×0.611in**, identical creole treatment to node b's first line. So
  ADR-2's "scoped quoted-title literal fix" premise does not apply; there is no
  literal-quoted-title behavior to reproduce.

- **Ruled out:** node a and node b are secondary residuals (~1.96 / ~1.93in),
  BELOW node c's 3.753 — a `$var`-content width matter shared by the bracket
  body (the port measures the decoded one-line `$var` ~2× the oracle's run
  layout), NOT quoted-title-specific and unable to move gafico's pin (node c
  dominates the MAX). No cheap in-scope fix; even a perfect node-a fix leaves
  the pin gated by the `<code>` node.

Origin: unported `<code>` creole block (`src/core/klimt/creole/`, deferred E2r
L2) surfaced through `EntityImageDescriptionSupport.ts#buildLine` /
`leaf-sizing.ts` measuring the un-blocked content. Kept pinned at 3.752777;
closing it requires porting `<code>` (a separate deferred feature), not a
quoted-title change.

## S1L-b-unicode T3 — lurupu-11 documented residual (diagnosed, pinned)

`lurupu-11-fubo915` sits at delta **2.045912in** (unchanged by T1). Diagnosed
(port-vs-oracle per-node dims + sizer/renderer visible-text probes); pinned at
its true delta. The driver is **NOT emoji glyph width** (ADR-3's premise) — it
is a **sizer↔renderer creole-lexer divergence** on one node.

- **Emoji width is already correct.** Two of the three usecase nodes match the
  oracle EXACTLY: `Implement` (`<U+1F601>`😁 `<U+1F680>`🚀) 185.8×42.0px ==
  oracle, and `foo` (`&#8734;`∞) 102.8×25.8px == oracle. `WidthTableMeasurer
  .charWidth` already returns the jar-verified fixed 16-pt fallback for astral
  code points (`cp >= 0xFFFF`, `measurer.ts:180`) — so a decoded emoji measures
  at the deterministic oracle's own width. No measurer change is warranted.

- **Driver — node `bar` sizer over-measures unstripped creole tags.**
  `bar` = `"<b>this is also <U+221E> <font Segoe UI Emoji><U+1F680><U+263A>
  </font> long"`. The RENDERER (`buildStripeAtoms`, E2r StripeSimple) strips
  the UNCLOSED `<b>` and the space-form `<font Segoe UI Emoji>`/`</font>` →
  visible `"this is also ∞ 🚀☺ long"` (22 cps) → ~147px, matching the oracle
  (2.042in). The SIZER (`leaf-sizing.ts#maxLineWidth` → `creoleVisibleText` →
  `parseCreole`, `src/core/creole.ts`) strips NEITHER (`parseCreole` leaves an
  unclosed `<b>` and any `<font Name>` tag literal — verified) → 53 cps →
  ~333px box. The DOT box is sizer-driven, so it is oversized by the literal
  tag text the renderer never draws.

- **Ruled out:** emoji/astral width (Implement + foo match exactly); codepoint
  decode (T1 correct — the `<U+…>` decode identically in both paths). The gap
  is purely the two creole lexers disagreeing on unclosed-`<b>` and
  space-form-`<font>`.

Origin: `src/core/creole.ts#parseCreole` (the sizer's lexer) lags the
renderer's `src/core/klimt/creole/legacy/StripeSimple.ts#buildStripeAtoms` for
unclosed `<b>` and `<font Name>`. **Out of T3 scope** (the fix is a
sizer↔renderer creole-lexer sync in `leaf-sizing.ts`/`creole.ts`, not an
emoji-width measurer change) and **high blast radius** (routing the sizer's
visible-text through `buildStripeAtoms` would re-measure every description leaf
— it must be measured, not assumed). **Flagged as a scoped follow-on:
"sizer↔renderer creole visible-text unification."** Kept pinned at 2.045912.
**RESOLVED — see creole-lexer-unification below; lurupu-11 now conformant.**

## creole-lexer-unification (2026-07-27) — the follow-on, DONE

The "sizer↔renderer creole visible-text unification" follow-on (flagged in
S1L-b-unicode T3 above) landed. `plans/creole-lexer-unification/`.

- **T1 (spike, GATE):** `scripts/measure-creole-lexer-delta.ts` measured the
  corpus impact of switching the sizer's visible-text lexer from `parseCreole`
  to the renderer's stripe engine — 28 shrink / 319 neutral / 1 widen across
  348 goldens. It **DISPROVED the brief's premise** that gafico-37/nujito-06
  would shrink: their `<color:green>`/`<u:blue>` tags sit adjacent to a decoded
  `<U+000A>` where `buildStripeAtoms`'s command scanner ALSO leaves them
  literal — both lexers agree, so the unification is a no-op for them. They
  stay pinned, driven by node c's `<code>` block (deferred, unchanged).
- **T2 (unify):** extracted one shared `StripeSimple.ts#buildLineAtoms` helper;
  `EntityImageDescriptionSupport.ts#buildLine` delegates to it (renderer output
  byte-identical) and `leaf-sizing.ts#creoleVisibleText` now calls it (dropped
  `parseCreole`). The sizer strips exactly what the renderer strips. **lurupu-11
  → conformant.**
- **T3 (scope-expanded, user-approved):** T2 un-masked a pre-existing gap on the
  URL-`<img>` cannot-decode fixtures (the old sizer accidentally measured the
  long raw `<img:URL>` markup ≈ the jar's `(Cannot decode: URL)`). Fixed
  faithfully in `creole-atoms.ts#cannotDecodeText`: http/https raster →
  `(Cannot decode: <url>)`, `.svg` URL → `(Cannot decode SVG: <url>)`
  (`AtomImg.java:214/218/226/230`); data-URI/file stay short (megabyte /
  security-profile reasons). That exposed a SECOND pre-existing bug: the
  description parser leaked the `[body] as alias` wrapper into `node.display`
  for the keyword+bracket form (`component [X] as Y`) — fixed in
  `command-table-containers.ts` KEYWORD_RE by routing a leading `[...] as ...`
  through the existing `parseBracketDeclaration`. Together these made
  **pebace-74 and togeke-15 conformant**.

Net (measure re-baseline): **236/351 (67.2%) → 239/351 (68.1%)** conformant,
zero widened, dot-sync 262/262 + 90/90 unchanged. Deleted pins: lurupu-11,
pebace-74, zotiru-33. Shrunk: nobiza-91 1.460→0.669, tuliba-37 6.736→0.521,
gevozu-46/sunuju-01 4.670→0.612, vivido-49 2.520→0.157, jecici-56 3.183→0.315,
xufexu-38 1.458→0.153, nenedo-78 0.865→0.169.

**Residuals still named (separate pre-existing gaps, NOT this mission's):**
nobiza-91 (0.669) — its note cannot-decode text measures at NOTE font 13 vs the
jar's 14 (note-font gap, **tracked: GH #23**); gafico-37/nujito-06 — node c `<code>` block (**tracked: GH #24**; deferred
E2r L2); per-atom font-SIZE width parity (ADR-2, `<size:N>`/`==` headings).

## Size backlog

`oracle/goldens/description/size-backlog.json` — 112 shrink-only per-fixture
pins (incl. the 2 LaTeX fixtures, tracked for non-regression even though
excluded from the reported denominator; 115 → 112 after creole-lexer-unification
deleted lurupu-11/pebace-74/zotiru-33). Its `_doc` records the capture
provenance. Re-measure with `npx tsx scripts/measure-description-size-deltas.ts`
(exit 0 iff zero widened).
