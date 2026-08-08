# Findings — bucket `creole-titled-separator` (T4)

Two fixtures. **The recorded S1L-i mechanism is REFUTED for one and
CORRECTED for the other** (ADR-4); neither fixture's delta originates at
`CreoleStripeSimpleParser.ts:95`, the blocker the S1L ledger named. The
bucket does not survive as a partition (ADR-3): its two members belong to
two different, already-populated mechanism groups.

Measured on the mission's fresh baseline run
(`measure-description-size-deltas.ts`, exit 0, 321/351, widened 0) and
re-derived per node with the same pipeline.

---

## Verdict on the recorded S1L-i mechanism

Recorded (`planning/mission-index.md:96`, `plans/s1l-leaf-sizing/ledger.md:58`):

> `--title--` / `==title==` draw a rule CARRYING their title text, so the line
> contributes the TITLE's width and the rule height — not the raw markup
> measured as glyphs (`--title1--` measures 62.5px here vs the jar's `title1`
> 37.6px). Sizer and renderer must move together (`isCreoleHrLine` /
> `classifyStripeLine` already share one classifier — extend it rather than
> special-casing the sizer). … Blocker: `CreoleStripeSimpleParser.ts:95`
> classifies a non-empty separator capture as `LITERAL`.

**Status: the description-LEAF half is already FIXED and the claim is stale;
the remaining two fixtures are governed by other mechanisms.**

### 1. The 62.5px-vs-37.6px measurement no longer reproduces

Today's numbers (`WidthTableMeasurer`, 14px — the deterministic table the
goldens were captured through; probe `scripts_scratch/t4-width.ts`):

| string | measured width |
|---|---|
| `--title1--` (raw markup) | 48.1250 |
| `title1` (title only) | 29.5750 |
| `--averyverylongtitlehere--` | 155.4875 |
| `averyverylongtitlehere` | 136.9375 |

The recorded 62.5 / 37.6 pair carries the same ~1.6 ratio, so it was the same
comparison at a larger font — but the divergence it described is gone. Probe
(`component c1 [ x / --averyverylongtitlehere-- / y ]`, one throwaway
`component c2` + edge, per `usymbol-composition.md`'s two traps):

| variant | our node width | decomposition |
|---|---|---|
| `--averyverylongtitlehere--` | **184.937px** | `136.9375 (title) + 8 + 40` |
| plain text `averyverylongtitlehere` | 176.937px | `136.9375 + 40` |
| *(if raw markup were measured)* | *195.49px* | `155.4875 + 40` |

The `+8` is upstream's `TextBlockLineBefore.calculateDimension`'s
`dim.atLeast(dimTitle.getWidth() + 8, dimTitle.getHeight())`
(`J/klimt/shape/TextBlockLineBefore.java:72-79`) — reproduced exactly, not
fitted. Our leaf sizer already measures the TITLE, with upstream's `+8`.
Independently confirmed end-to-end below: with the correct display supplied,
`nixura-77-bina738`'s five nodes — including bodies carrying `--foo--`,
`__foo2__`, `..with text..`, `..`, `--` and `==` — reproduce the jar's DOT
**exactly on all ten dimensions**.

### 2. `classifyStripeLine` IS still shared — and is the wrong classifier

Shared today, as recorded: sizer `leaf-sizing-text.ts:25,54`
(`isCreoleHrLine`) and renderer `StripeSimple.ts:60,352` import the same
`classifyStripeLine` (`CreoleStripeSimpleParser.ts:98`). That half of the
record stands.

But it does not govern block separators in a description body. Upstream splits
a body on **`BodyEnhancedAbstract.isBlockSeparator`**
(`J/cucadiagram/BodyEnhancedAbstract.java:67-82`; ported verbatim at
`src/core/cucadiagram/BodyEnhancedAbstract.ts:84`), a *different and looser*
test — `s.startsWith("--") && s.endsWith("--")`, which accepts the **2-char**
`--` and `==` that `classifyStripeLine`'s ≥4-character patterns
(`^--([^-]*)--$`, `^===*==$`) reject outright. Both fixtures' separators are
resolved by `isBlockSeparator` + `BodyEnhanced2.getArea`/`decorate`, never by
`classifyStripeLine`.

**Consequence: "extend the shared classifier" is the wrong fix shape, and
flipping `CreoleStripeSimpleParser.ts:95` (`LITERAL` → `HORIZONTAL_LINE`)
would move neither fixture's delta by one pixel.** For `xufexu-38-fola855`
that line *is* reached (the note renderer draws `==toto==` literally because
of it), but the note **sizer** never calls it — `measureNote` bills lines by
`lineCount`, so the classification is invisible to the DOT box being measured.
Verified: our note width is byte-identical with and without every separator
line (85.431px both), so nothing that classifier decides is load-bearing for
the measured delta.

### 3. Width half vs height half

- `xufexu-38-fola855`: **height only.** Width is exact against the jar
  (1.186545in) and unchanged when all four separator lines are deleted.
- `nixura-77-bina738`: both halves are wrong, but **neither** comes from a
  separator — see its record.

---

### nixura-77-bina738

- **bucketLabel:** creole-titled-separator
- **delta:** 1.273091
- **status:** resolved
- **mechanism:** The port has no `CommandCreateElementMultilines` **TYPE0**
  (open-quote) phase — only TYPE1 (`[ … ]`) — so `usecase UC1 as "This usecase`
  is rejected as a block opener, the single-line rule takes the whole
  unterminated remainder as both id and display, and the nine continuation
  lines are silently dropped. The `creole-titled-separator` label is a
  first-match classifier misattribution (ADR-3): the fixture's separators
  (`..`, `--foo--`, `__foo2__`, `==`, `--`, `..with text..`) are all measured
  **correctly** once the display reaches the sizer.
- **originFileLine:** `src/diagrams/description/parser.ts:107`
- **causalChain:** `tryElementBlock` tests only `ELEMENT_MULTILINE_OPEN_RE`
  (`parse-helpers.ts:326`, TYPE1-only — a trailing unmatched `[`). A TYPE0
  opener fails it, `:107` returns `null`, and the line falls through to the
  single-line keyword rule. Observed displays (rendered `<text>` content):
  `UC1 as "This usecase`, `UC3 as "This usecase`, `DB2 as "this is long` — one
  line each, the `as "` never consumed.
  Per-node arithmetic (jar oracle `oracle/goldens/description/nixura-77-bina738/svek-1.dot`
  vs ours, in inches):

  | node | jar | ours | error |
  |---|---|---|---|
  | UC1 (10-line display) | 2.651128 × 2.137569 | 2.091639 × 0.484994 | −0.559489 w, −1.652575 h |
  | UC2 (no display) | 0.635024 × 0.358319 | 0.635024 × 0.358319 | exact |
  | UC3 (3-line display) | 2.872279 × 0.835409 | 2.091639 × 0.484994 | −0.780640 w, −0.350415 h |
  | DB1 (no display) | 0.656944 × 0.597222 | 0.656944 × 0.597222 | exact |
  | DB2 (7-line display) | 1.930035 × 1.736111 | 1.743403 × 0.597222 | −0.186632 w, −1.138889 h |

  The three broken nodes are exactly the three TYPE0 declarations; the two
  nodes with no display are exact. **The reported 1.273091 is not any single
  node's error** — `maxSizeDeltaIn` sorts all widths+heights into one multiset
  and pairs positionally, so the max pair is
  `|1.930035 (DB2 width) − 0.656944 (DB1 width)| = 1.273091` ✓. UC1 and UC3
  collapse to the *same* box (2.091639 × 0.484994) because both truncate to
  the same first line, `… as "This usecase`.
- **ruledOut:**
  - *Creole titled separators — the recorded S1L-i mechanism.* Controlled
    experiment: the identical diagram with all three displays supplied through
    a syntax we DO parse (single-line `"…\n…"`), separators untouched, renders
    **2.651128 × 2.137569 / 0.635024 × 0.358319 / 2.872279 × 0.835409 /
    0.656944 × 0.597222 / 1.930035 × 1.736111 — all five nodes, all ten
    dimensions, exact against the jar oracle.** The separator machinery
    downstream of the parse is already correct; delta → 0.
    (Probe caveat, not a size claim: the probe used `\n` escapes, which the
    single-line path expands. It validates the sizer given a correct display,
    not TYPE0's escape semantics — see `multiline-display.md`'s note that
    `finalizeDisplay` must NOT be reused for a TYPE0 body.)
  - *`CreoleStripeSimpleParser.ts:95`'s `LITERAL` classification (the recorded
    blocker).* Not on the path: the exact-matching probe above ran with that
    line unchanged.
  - *Titled-separator WIDTH (`--foo--` measured as glyphs).* Refuted directly —
    see "the 62.5px-vs-37.6px measurement no longer reproduces" above; the
    leaf path measures the title and adds upstream's `+8`.
  - *Structural divergence.* `measure-description-size-deltas.ts` reports a
    numeric delta only when `compareStructural` is EQUAL, so the dropped
    continuation lines create no phantom entities — 5 nodes both sides.
  - *A per-node 1.27in error.* Ruled out by the per-node table: the largest
    single-node error is UC1's 1.652575in height; 1.273091 is a sorted-pairing
    artifact. A fix mission hunting a 1.27in node would be chasing a number
    that does not exist.
- **sharedCauseWith:** `pecupa-75-zote612`, `tajadu-40-juro990` (both bucket
  `multiline-display`; that file's records already name this slug — reached
  independently, same mechanism, same `originFileLine`)
- **proposedWriteSet:** `src/diagrams/description/parse-helpers.ts`,
  `src/diagrams/description/parser.ts`,
  `src/diagrams/description/parse-state.ts`, plus co-located tests. Identical
  to `multiline-display.md`'s write-set — **one fix closes all three
  fixtures.** No `leaf-sizing*.ts` or creole edit is warranted.
- **sizeEstimate:** 3 source files + tests; blast radius = the description
  parser's line-dispatch phase only. This fixture adds **no** work beyond the
  `multiline-display` records — it is the third fixture of that one fix.
  Verification: one `measure-description-size-deltas.ts` run (this fixture
  predicted 1.273091 → 0, conformant, pin deleted) + `npm test`.
- **confidence:** high

---

### xufexu-38-fola855

- **bucketLabel:** creole-titled-separator
- **delta:** 0.152778
- **status:** resolved
- **mechanism:** The description NOTE path never adopted
  `BodyFactory.create3` → `BodyEnhanced2`. Its sizer bills **every** source
  line — including the four `isBlockSeparator` lines — as a full 13px
  note-font text line, where upstream *removes* those lines from the display
  and replaces each with `decorate`'s margins (8px plain, `4 + titleHeight`
  when the separator carries a title).
- **originFileLine:** `src/diagrams/description/leaf-sizing.ts:224`
  (`lineCount(display) * NOTE_FONT_SIZE + NOTE_MARGIN_V` in `measureNote`)
- **causalChain:** Upstream `EntityImageNote` builds its body with
  `BodyFactory.create3` (`J/svek/image/EntityImageNote.java:116-117`) →
  `BodyEnhanced2.getArea` (`J/cucadiagram/BodyEnhanced2.java:88-101`), which
  splits the body at every `isBlockSeparator` line, drops that line, and wraps
  each remaining block with `decorate`
  (`J/cucadiagram/BodyEnhancedAbstract.java:104-118`):
  - `separator == 0` (first block) → `withMargin(block, marginX, 0)` → **+0**
  - untitled separator → `withMargin(block, marginX, 4)` → **+8** (4 top + 4 bottom)
  - titled separator → `withMargin(block, marginX, 6, h/2, 4)` then
    `withMargin(raw, 0, 0, h/2, 0)` → `4 + h` = **+17** for `h = 13`
    (`withMargin(tb, x1, x2, y1, y2)` → `TextBlockMarged(tb, top=y1, right=x2,
    bottom=y2, left=x1)`, `J/klimt/shape/TextBlockUtils.java:75-78`;
    `getTitle` returns `null` for `s.length() <= 4`, so the 2-char `--`/`==`
    are untitled, `BodyEnhancedAbstract.java:95-96`)

  Note 1 has 5 text lines + separators `--`, `==toto==`, `==`, `--`:

  | | jar | ours |
  |---|---|---|
  | text | 5 × 13 = 65 | 9 × 13 = 117 |
  | separator cost | 8 + 17 + 8 + 8 = **41** | *(billed as 4 × 13 = 52 above)* |
  | note margin | 10 | 10 |
  | **total** | **116px = 1.611111in** ✓ | **127px = 1.763889in** ✓ |

  Note 2 (6 text lines, same 4 separators): jar `78 + 41 + 10 = 129px =
  1.791667in` ✓, ours `10 × 13 + 10 = 140px = 1.944444in` ✓. Both jar values
  reproduced **exactly, from the Java expression, with zero free parameters.**
  Delta on both notes: `52 − 41 = 11px = 11/72 = 0.152778in` ✓ — the fixture's
  reported delta, and identical on both notes (consistent with the sorted
  pairing).
- **ruledOut:**
  - *The recorded S1L-i mechanism (titled separators contributing title width
    + rule height), and its named blocker `CreoleStripeSimpleParser.ts:95`.*
    Both refuted by measurement: (a) **width is exact** (1.186545in) and
    **unchanged when all four separator lines are deleted** — probe
    `t4-note-nosep.puml`, 85.431px in both states — so no width mechanism is
    in play; (b) `measureNote` never calls `classifyStripeLine` at all, so
    that line's `LITERAL` verdict cannot affect the measured box. It *is*
    reached by the note RENDERER (`renderer-entity.ts:294` →
    `buildTextBlock`), which is why `==toto==` draws as literal text — a real
    ink divergence, but not this delta.
  - *`classifyStripeLine` being the right classifier to extend.* It cannot
    reach these separators: `--` and `==` are 2 characters, and every one of
    its four patterns needs ≥4 (`^--([^-]*)--$`, `^===*==$`). Upstream's
    `isBlockSeparator` accepts them via bare `startsWith`/`endsWith`.
  - *`CREOLE_HR_HEIGHT = 8` / `textBlockHeight` (`leaf-sizing-text.ts:117`)
    being wrong.* Not on this path — `measureNote` uses `lineCount`, not
    `textBlockHeight`. Even routed through it, the four separators would still
    be mis-classified (see previous item) and its flat 8px is not upstream's
    `decorate` geometry.
  - *A leaf-sizing (`USymbol` composition) cause.* The only non-exact nodes
    are the two notes; the `usecase foo` leaf is exact (0.464876 × 0.358319).
  - *Bucket co-membership with `nixura-77-bina738`.* Different mechanism,
    different file, different fix. The two share only the classifier label.
- **sharedCauseWith:** `pivudu-29-pele178` (bucket `other`) — **cross-bucket,
  verified numerically, not assumed.** Its note is `C / ---- / D`: jar
  0.611111in = `13 + (13+8) + 10 = 44px`; ours `3 × 13 + 10 = 49px`; delta
  `5px = 13 − 8 = 0.069445in` — its exact reported delta, from the same
  formula with a different separator count. Whoever owns that fixture should
  fold it in rather than diagnose it twice.
- **proposedWriteSet:** `src/diagrams/description/leaf-sizing.ts`
  (`measureNote:215-226` routes through the existing `BodyEnhanced2` port
  instead of `lineCount`), `src/diagrams/description/renderer-entity.ts`
  (`drawNoteFallback:294` swaps its `buildTextBlock` scoped substitute for
  `BodyFactory.create3`, exactly as `EntityImageDescriptionDelegates.ts:327`
  already does for entity `desc`), plus co-located tests. Sizer and renderer
  **must** move together — today they disagree three ways (flat 13px lines /
  creole heading + literal text / upstream's block model).
- **sizeEstimate:** 2 source files + tests. **No new porting work:**
  `BodyEnhanced2.ts`, `BodyEnhancedAbstract.ts` (`isBlockSeparator`,
  `decorate`, `getTitle`) and `BodyFactory.create3` all exist and are already
  wired for entity `desc` — this is the same "faithful port exists, the note
  path consults a lossy parallel model" shape `usymbol-composition.md`
  documents for the leaf sizer. Main risk is the measurer seam
  (`StringBounder` vs `StringMeasurer`), already crossed once at
  `EntityImageDescriptionDelegates.ts:327`. Regression set: every golden with
  a note (7 of the current non-conformant 30 carry one) plus the SVG ratchet,
  since the note renderer's ink changes. Verification: one
  `measure-description-size-deltas.ts` run (predicted +2: this fixture
  0.152778 → 0 and `pivudu-29-pele178` 0.069445 → 0) + `npm test`.
- **confidence:** high

---

## Bucket disposition (ADR-3)

`creole-titled-separator` should **not** survive as a group. Its members
re-partition as:

| fixture | true group |
|---|---|
| `nixura-77-bina738` | `CommandCreateElementMultilines` TYPE0 — with `pecupa-75-zote612`, `tajadu-40-juro990` |
| `xufexu-38-fola855` | note body ↛ `BodyEnhanced2` — with `pivudu-29-pele178` (bucket `other`) |

Net effect if both groups are fixed: **321 → 326/351 (91.5% → 92.9%)**,
5 backlog pins deleted, 0 widened.
