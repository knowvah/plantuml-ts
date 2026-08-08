# Findings — `multiline-display` bucket (T5)

Records on the ADR-1 schema (`../findings/SCHEMA.md`). Measured 2026-08-06
against the fresh whole-corpus baseline (exit 0, 321/351, widened 0).

**Headline correction to the recorded S1L-j mechanism (ADR-4).** The recorded
cause is **CONFIRMED verbatim** — including the literal broken id — but it is
**incomplete in two ways** that change the fix mission's plan:

1. The bucket is **3 fixtures, not 2**. `nixura-77-bina738` (currently filed
   under `creole-titled-separator`, T4) is the same mechanism, whole.
2. The size delta is **entirely** parse-side. Given the correct display
   string, our sizer already reproduces the jar **exactly on every node of
   all three fixtures**. No sizer change is required, and the delta must not
   be attributed to leaf sizing.

## Upstream authority (acceptance criterion 3)

`CommandCreateElementMultilines.TYPE0`
(`~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/CommandCreateElementMultilines.java:86`),
registered for description diagrams at
`.../descdiagram/DescriptionDiagramFactory.java:122` **after** the single-line
`CommandCreateElementFull` (`:120`).

- **Opener** (`CommandCreateElementMultilines.java:96-108`):
  `^(ALL_TYPES)\s+ CODE([%pLN_.]+) STEREO? URL? \s* COLOR? \s* "as" \s* [%g] DESC([^%g]*) $`
  — note `COLOR` sits **before** `as`, which the single-line
  `CommandCreateElementFull` grammar does not allow (jar-verified: `usecase
  UC5 #red as "…"` on ONE line is a syntax error, exit 2).
- **Continuation rule** (`command/CommandMultilines2.java:102-107`): while the
  block has one line, or its last line fails the end pattern, `isValid`
  returns `OK_PARTIAL`; `command/PSystemCommandFactory.java:268-286` then
  appends source lines one at a time until `OK`. There is **no line cap** for
  this command (the `nb` cap at `:281` applies only to
  `CommandDecoratorMultine`). If EOF is reached first, `isMultilineCommandOk`
  returns `null` and the command is abandoned entirely.
- **Terminator rule** (`CommandCreateElementMultilines.java:80-81, :90`):
  `END0 = ^(.*)[%g]$` applied to the `Trim.BOTH`-trimmed last line — i.e. the
  block closes on the first line that **ends with a quote character**
  (`"`, `“`, `”`, or `Jaws.BLOCK_E1_INVISIBLE_QUOTE` —
  `regex/Pattern2.java:59`). `MultilinesStrategy.REMOVE_STARTING_QUOTE`
  (`command/MultilinesStrategy.java:52-61`) drops `'`-prefixed comment lines
  from the block first; it has nothing to do with double quotes.
- **Display assembly** (`CommandCreateElementMultilines.java:169, :191-199`):
  `lines.trimSmart(1).expandsNewline(false)`, then `subExtract(1,1).toDisplay()`
  with the first line's `DESC` tail prepended and the last line's pre-quote
  prefix appended — each **only when non-empty**.
  **`expandsNewline(false)` is load-bearing:** jar-verified that a literal
  `\n` inside a TYPE0 body is NOT a line break (`artifact foo2 as "aaaa\nbbbb`
  / `cccc"` measures 2 text lines, height 0.708333in = 51px = 28 + margin 23).

---

### pecupa-75-zote612

- **bucketLabel:** multiline-display
- **delta:** 0.619648
- **status:** resolved
- **mechanism:** The port has no `CommandCreateElementMultilines` **TYPE0**
  (open-quote) phase at all — only TYPE1 (`[ … ]`) — so
  `usecase UC5 #red as "My usecase5` is rejected as a block opener and falls
  through to the single-line `KEYWORD_RE` rule, which takes the whole
  unterminated remainder as both id and display; the two continuation lines
  then match no command and are silently dropped.
- **originFileLine:** `src/diagrams/description/parser.ts:107`
- **causalChain:** `tryElementBlock` tests only `ELEMENT_MULTILINE_OPEN_RE`
  (`parse-helpers.ts:326`, TYPE1-only: keyword + code + optional
  stereo/url/colour + a trailing unmatched `[`). A TYPE0 opener fails it, so
  `:107` returns `null` and `processLine` (`:255`) hands the line to
  `dispatchCommand` → `COMMANDS[25]` = `KEYWORD_RE`
  (`parse-helpers.ts:319`, executed at `command-table-containers.ts:129-163`).
  `parseNameSection("UC5 #red as \"My usecase5")` finds no closing quote, so
  its alias/display split does not engage and it returns
  `{id: 'UC5 #red as "My usecase5', display: 'UC5 #red as "My usecase5'}`
  — **the actual parsed value observed today** (probe: AST dump). Lines
  `is on several lines` and `and finished"` match no rule (verified: index
  `-1` against every `COMMANDS` pattern), so node/edge counts stay EQUAL and
  the defect surfaces purely as a size delta.
  Arithmetic: UC5 measures ours 2.438348 × 0.554336in vs oracle
  1.8187 × 0.814014in — one long line instead of three short ones, so too
  wide and too short. `maxSizeDeltaIn` sorts all widths+heights into one
  multiset and pairs positionally, so the reported max is
  `|2.438348 − 1.8187| = 0.619648` ✓ (the second-largest pair,
  `|0.814014 − 0.635024| = 0.178990`, is the height half of the same node).
- **ruledOut:**
  - *Leaf sizing / USymbol composition (`measureUsecase`, K4 ellipse fit).*
    Controlled experiment: the same diagram with UC5's display supplied via a
    syntax we DO parse (`usecase UC5 as "My usecase5\nis on several lines\nand
    finished" #red`) — jar-verified to produce the golden's exact DOT
    (1.8187 × 0.814014) — renders in our port as **1.8187 × 0.814014 on all
    five nodes, exact**. So every path downstream of the parse is already
    correct.
  - *The dropped `#red`.* Colour is size-neutral in this engine
    (`planning/sizer-renderer-parity.md`, row 1: "colour only … cannot move a
    DOT box"), and the controlled experiment above **included** `#red` and
    still matched exactly. (Caveat recorded, not a size claim: the probe put
    the colour AFTER the display because TYPE0's colour-before-`as` ordering
    is a jar syntax error on one line; a TYPE0 fix must read the colour from
    the position `ColorParser.exp1()` occupies at
    `CommandCreateElementMultilines.java:102`.)
  - *Structural divergence.* `measure-description-size-deltas.ts` returns a
    numeric delta only when `compareStructural` is EQUAL, so node/edge/shape
    counts already agree — the dropped continuation lines create no phantom
    entities.
  - *Bucket misattribution.* Unlike three prior S1L buckets, the
    `multiline-display` classifier pattern (`measure-description-size-deltas
    .ts` CAUSE_PATTERNS, `/\bas\s+"[^"\n]*$/m`) is correct for this fixture.
- **sharedCauseWith:** `tajadu-40-juro990`, `nixura-77-bina738`
- **proposedWriteSet:** `src/diagrams/description/parse-helpers.ts` (a TYPE0
  opener regex beside `ELEMENT_MULTILINE_OPEN_RE:326`),
  `src/diagrams/description/parser.ts` (`tryElementBlock` gains a
  quote-terminated variant: terminator `/["“”]\s*$/` on the trimmed
  line, and a body join that does **not** expand `\n` —
  `pushElementBody:73`'s `finalizeDisplay` must NOT be reused),
  `src/diagrams/description/parse-state.ts` (the pending-block record at `:38`
  needs a terminator discriminant), plus co-located tests. **Parser change —
  no `leaf-sizing*.ts` edit, and none is warranted.**
- **sizeEstimate:** 3 source files + tests. **Corpus-wide construct count: 17
  of 5694 `~/git/pdiff` fixtures, and exactly 3 of the 351 description
  goldens** (`pecupa-75-zote612`, `tajadu-40-juro990`, `nixura-77-bina738`) —
  all three currently non-conformant, so no ratcheted golden can regress from
  a correctly-scoped opener. Regression-verification set = the 11 further
  goldens carrying a CLOSED `as "…"` (an over-greedy opener would steal them)
  plus the 18 carrying an unclosed `[` (the TYPE1 neighbour). The remaining 14
  pdiff hits route to the class/sequence engines and are outside this
  write-set — but upstream registers the identical TYPE0/TYPE1 pair at
  `ClassDiagramFactory.java:166-167`, so a sibling gap there is likely and
  should be filed, not fixed here. Verification cost: one
  `measure-description-size-deltas.ts` run (predicted **321 → 324/351**, all
  three to ≤0.01in, 3 backlog pins deleted) + `npm test`.
- **confidence:** high

### tajadu-40-juro990

- **bucketLabel:** multiline-display
- **delta:** 0.358507
- **status:** resolved
- **mechanism:** Identical to `pecupa-75-zote612` — no TYPE0 phase exists, so
  `artifact foo2 as "This artifact` is consumed by the single-line
  `KEYWORD_RE` rule and the three continuation lines (`is defined`, `----`,
  `on several lines"`) are dropped.
- **originFileLine:** `src/diagrams/description/parser.ts:107`
- **causalChain:** Same chain as above. **Actual parsed value observed today:**
  `{id: 'foo2 as "This artifact', display: 'foo2 as "This artifact'}` — the
  recorded S1L-j claim reproduced character-for-character.
  Arithmetic: foo2 measures ours 2.019618 × 0.513889in vs oracle
  1.661111 × 1.013889in. Ours = one 22-char line: 145.41px wide = 115.41 text
  + `artifact` margin 30; 37px tall = 14 line + margin 23
  (`planning/usymbol-composition.md`, ARTIFACT K1 `[30,23]`). Oracle = four
  display rows (3 text + one creole HR for `----`): 119.6px wide = 89.6 + 30;
  73px tall = 50 + 23. Sorted-multiset max delta =
  `|2.019618 − 1.661111| = 0.358507` ✓ (the height half of the same node,
  `|1.013889 − 0.513889| = 0.5`, pairs against other nodes and does not
  surface as the max).
- **ruledOut:**
  - *Leaf sizing, `artifact` margin, and the `----` creole horizontal rule.*
    Controlled experiment: the same diagram with the display supplied as
    `artifact foo2 as "This artifact\nis defined\n----\non several lines"` —
    jar-verified byte-identical to the golden DOT — renders in our port as
    **0.794618×0.513889, 1.661111×1.013889, 0.760937×0.611111,
    0.40871×0.343635: all four nodes exact**. The creole HR is therefore
    already sized correctly and is NOT a contributing cause.
  - *Any S1L-i (`creole-titled-separator`) overlap.* Same experiment — `----`
    is an untitled rule and it measures right today.
  - *Structural divergence.* Delta is numeric, so `compareStructural` is
    EQUAL; `----` and the two prose lines match no `COMMANDS` pattern
    (verified index `-1`) and emit nothing.
- **sharedCauseWith:** `pecupa-75-zote612`, `nixura-77-bina738`
- **proposedWriteSet:** identical to `pecupa-75-zote612` — one fix closes all
  three.
- **sizeEstimate:** as above (shared).
- **confidence:** high

---

## Cross-bucket link — `nixura-77-bina738` belongs here (ADR-3)

**Not written up as a record here** (it is T4's fixture and outside this
task's write-set) — recorded so T8's re-partition and T4 can act on it.

`nixura-77-bina738` (delta **1.273091**, filed `creole-titled-separator`) is
mis-bucketed. `CAUSE_PATTERNS` is first-match and the titled-separator entry
precedes `multiline-display`, so its `--foo--` line captured the fixture; but
all **three** of its declarations (`usecase UC1 as "…`, `usecase UC3 as "…`,
`database DB2 as "…`) are TYPE0 openers, and all three collapse to first-line
displays today.

Same controlled experiment, same result — with the correct displays supplied
via `\n` escapes (jar-verified to reproduce the golden's DOT exactly), our
port returns **2.651128×2.137569, 0.635024×0.358319, 2.872279×0.835409,
0.656944×0.597222, 1.930035×1.736111 — all five nodes exact**, despite the
body containing `..`, `--foo--`, `__foo2__`, `==`, and `..with text..`.

**Consequence:** the creole titled separator `--foo--` is *already* sized
correctly, so `nixura-77-bina738` contributes nothing to a titled-separator
fix and everything to this one. The `multiline-display` fix is worth **+3**
conformance (321 → 324/351), not +2, and T4's bucket is one fixture smaller
than its task file states.

## Method note for the fix mission

The `\n`-escaped single-line form was validated as an oracle-equivalent
substitute *before* being used as evidence: for each of the three fixtures the
jar's DOT for the escaped form was compared against the committed golden and
matched exactly. It is a substitute for **measurement only** — upstream's own
TYPE0 path does not expand `\n` (`expandsNewline(false)`,
`CommandCreateElementMultilines.java:169`; jar-verified above), so the fix
must join raw body lines, not route them through `finalizeDisplay`.
