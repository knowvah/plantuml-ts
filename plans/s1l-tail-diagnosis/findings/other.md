# Findings — `other` bucket (T6)

`other` is `detectCause`'s fallthrough (no `CAUSE_PATTERNS` entry matched), so
the two fixtures share nothing but the absence of a label. They were diagnosed
independently and have two unrelated mechanisms: a **parser** gap
(`dopova-50-digo290`) and a **note sizer** gap (`pivudu-29-pele178`).

Measurement note that shaped both diagnoses: `maxSizeDeltaIn`
(`tests/oracle/svek-dot.ts:251-261`) pools every node width AND height into one
sorted multiset and pairs by index, so the reported max is an order statistic,
not a per-node delta. Both fixtures were therefore re-measured per node with a
paired dump before any hypothesis was formed.

---

### dopova-50-digo290

- **bucketLabel:** other
- **delta:** 0.8827319999999999
- **status:** resolved
- **mechanism:** The declaration `(Use) as "Use the application"` matches no
  command in the description dispatch table, so the line is silently dropped and
  `Use` is auto-created later at its first link reference with display = code
  (`Use`). Upstream matches it on `CommandCreateElementFull`'s third
  alternative, `CODE3 as DISPLAY3`
  (`~/git/plantuml/.../descdiagram/command/CommandCreateElementFull.java:95-100`),
  where `DISPLAY` admits a double-quoted string (`DISPLAY_CORE`, java:130) but
  `CODE` does not (`CODE_CORE`, java:126) — so a quoted right-hand side flips the
  roles: the paren token is the CODE and the quoted token is the DISPLAY.
- **originFileLine:** `src/diagrams/description/command-table-containers.ts:45`
- **causalChain:** Rule 11's alias alternation is
  `(?:\([^)]+\)|:[^:]+:|\S+)` — paren, colon, or one bare token. `"Use the
  application"` contains spaces, so `\S+` consumes only `"Use` and the remaining
  ` the application"` cannot be absorbed by `SHORTHAND_TRAILER`
  (`$tag|<<stereo>>|#color|[[url]]` only); the whole pattern fails. No later rule
  claims the line either (probed: rule index −1 = NO MATCH). The node therefore
  measures `Use` (ellipse 0.573152 × 0.358319 in = 41.267 × 25.799 px) instead of
  `Use the application` (jar `sh0007`, 1.910510 × 0.448769 in = 137.557 × 32.311
  px; jar SVG `textLength="111.3875"`). Pooling all 8 dimensions and pairing by
  index, the top order statistic is oracle 1.910510 vs ours 1.027778 (the actor
  height, which becomes our largest value once the wide ellipse is gone):
  1.910510 − 1.027778 = **0.882732** = the pinned delta exactly.
  Rule 11 also treats its LHS as the DISPLAY and the alias as the CODE
  (upstream's alternative 2, `DISPLAY2 as CODE2`, java:89-94 — verified: `(Use)
  as UC1` yields id `UC1`, display `Use`), so simply widening the alternation to
  admit a quoted token would produce id `Use the application`, display `Use`. The
  fix needs a separate branch that flips the roles.
- **ruledOut:**
  - *Use-case ellipse (K4) fit / `measureUsecase` / footprint math* — eliminated
    by substituting the correct display (`usecase "Use the application" as Use`,
    everything else byte-identical) and re-rendering through the real pipeline:
    all four nodes then match the oracle exactly — 0.973438×1.027778,
    **1.910510×0.448769**, 0.410764×1.027778, 0.662523×0.358319. Nothing in the
    sizer is wrong for this fixture.
  - *Actor sizing (`:Main Admin:`, `User`)* — both rects already match the oracle
    to 6 dp before any change (70.088×74, 29.575×74).
  - *`\n` handling in the link labels* — edge labels are not in the node set
    `sizeDeltas` pools, and they are size-identical to the oracle's HTML-table
    `WIDTH`/`HEIGHT` anyway (68×15, 63×41).
  - *A keyword-form regression* — `usecase UC4 as "My usecase4"` and `artifact
    foo2 as "This artifact"` both parse correctly today (id/display in the right
    slots), so the gap is confined to the NO-leading-keyword forms.
  - *An I3b/I4 stale record* — the ledgered claim ("matches no command in
    `command-table.ts`") was re-derived from scratch per ADR-4, not inherited: the
    command-index probe and the AST dump were re-run against current code.
- **sharedCauseWith:** none. `pecupa-75-zote612` and `tajadu-40-juro990`
  (`multiline-display`) look adjacent — they also carry `CODE as "DISPLAY"` —
  but both have a leading SYMBOL keyword and their deltas come from the
  unported `CommandCreateElementMultilines` line-joining, a different command.
  Two related-but-unmeasured shapes found while probing, both currently NO
  MATCH and both fixed by the same new branch: `Admin as "Main Admin"` (bare
  CODE) and `:A: as "Actor name"` (colon CODE); `[Comp] as "Big component"`
  additionally *mis*-parses today (rule 10's `(.*)` trailer yields id `"Big`,
  display `Comp`, plus a spurious node).
- **proposedWriteSet:**
  `src/diagrams/description/command-table-containers.ts` (rule 11 + a new
  `CODE as quoted-DISPLAY` rule, ordered AFTER rule 11b so a quoted LHS stays
  `DISPLAY2 as CODE2`), `src/diagrams/description/element-grammar.ts` (the
  regex + a role-flipping helper beside `RE_BARE_AS_DECORATED`),
  `src/diagrams/description/command-table-shorthand.ts` (rule 8b, bare CODE +
  quoted DISPLAY).
- **sizeEstimate:** 3 files, ~40 lines. Blast radius: description parser only —
  but it adds a rule to a first-match table, so precedence against rules 10/11/11b
  is the whole risk; every new shape must be pinned in `parser.test.ts` first.
  Verification: description DOT-parity ratchet (351), the size measure, and the
  description SVG goldens (this fixture also carries si9-recorded SVG diffs that
  will move).
- **confidence:** high

---

### pivudu-29-pele178

- **bucketLabel:** other
- **delta:** 0.06944500000000009
- **status:** resolved
- **mechanism:** `measureNote` models a note body as `lineCount × NOTE_FONT_SIZE`
  — a flat 13 px for every line — instead of calling `textBlockHeight`, the
  HR-aware height function that already exists in this module and is already used
  by the folder and box paths. A creole horizontal rule (`----`) is 8 px upstream,
  not a text line, so each rule in a note over-measures by 5 px.
- **originFileLine:** `src/diagrams/description/leaf-sizing.ts:224`
- **causalChain:** Body is `C` / `----` / `D`. Ours: `3 × 13 + NOTE_MARGIN_V 10 =
  49 px = 0.680556 in`. Oracle `sh0007`: `0.611111 in = 44 px`. 0.680556 −
  0.611111 = **0.069445** = the pinned delta (it is also the pooled-multiset max,
  since every other dimension matches to 6 dp). Jar-probed contribution of one
  untitled rule, isolated: note bodies `C` = 23 px, `C/D` = 36 px, `C/----/D` =
  44 px, `----` alone = 18 px, `C/----/----/D` = 52 px — i.e. margins 10, text
  line 13, rule **8**, additive. Ours returns 23 / 36 / **49** / **23** / **62**
  for the same five: identical wherever there is no rule, +5 per rule. Simulating
  the corrected expression against the real function — `textBlockHeight('C\n----\nD',
  13) + 10` — returns exactly **44 px = 0.611111 in**, the oracle value.
  `CREOLE_HR_HEIGHT = 8` (`leaf-sizing-text.ts:45`) is already the right constant,
  independently measured by S1L-b; `measureNote` simply never consults it.
- **ruledOut:**
  - *The use-case leaf* — `sh0006` matches the oracle exactly (0.375225 ×
    0.316847), so the fixture's only defective node is the note.
  - *Note width / `maxLineWidth`* — 0.422569 in on both sides, and 21 px on both
    sides for a rule-only note; the rule contributes no width in either
    implementation. Height only.
  - *`NOTE_MARGIN_V` (10) and `NOTE_FONT_SIZE` (13)* — jar-confirmed by the 1-line
    (23) and 2-line (36) probes matching us exactly; neither constant is wrong.
  - *`atomHeightBonus`* — contributes 0 here (49 = 3×13+10 exactly), so it is not
    in the causal path.
  - *The `legend` block, which also contains `----`* — legends are chrome, not DOT
    nodes; the graph has exactly 2 nodes and both are accounted for.
  - *`isCreoleHrLine` misclassifying this fixture's rule* — probed: `'----'` →
    `true`. The classifier is correct here; the caller never asks it.
- **sharedCauseWith:** `xufexu-38-fola855` (bucket `creole-titled-separator`) —
  measured, same origin: two note rects, widths exact, both **+11 px** tall.
  Its 9-line note decomposes on the jar side as `5×13 + 3×8 + 17 = 106` (+10
  margin = 116), ours as `9×13 = 117` (+10 = 127). **It needs two fixes, not
  one, and this fix alone moves it 0 px**, because our `isCreoleHrLine` returns
  `false` for its rules: jar-probed, `--`, `==`, `..`, `__`, `---`, `___`, `....`
  are all 8 px rules and `..x..` / `--X--` / `==toto==` are 17 px titled rules,
  while ours classifies only `----` and `....` as rules at a flat 8. That
  classifier/titled-height gap is a **distinct defect with a different origin**
  (`src/core/klimt/creole/CreoleStripeSimpleParser.ts#classifyStripeLine` and
  `leaf-sizing-text.ts:45`) and belongs to whoever owns that bucket; I did not
  locate its upstream site (`CreoleStripeSimpleParser.java:66-73`'s patterns
  require 4 chars and cannot explain the jar accepting `--`/`---`), so it is
  recorded as measured behaviour, not as an attributed mechanism.
  `nixura-77-bina738` carries rules too but inside a `usecase "..."` display
  (the `measureEntityLeaf`/footprint path), so it does NOT share this origin.
  Checked and excluded: the other five note-bearing non-conformant fixtures
  (`kokebo-27-vafi688`, `kovaxi-11-reti348`, `nobiza-91-fimo741`,
  `tijexo-10-zipo222`, `tuliba-37-liza126`, `zidebi-71-nocu387`) contain no
  HR-shaped line at all.
- **proposedWriteSet:** `src/diagrams/description/leaf-sizing.ts` (`measureNote`
  height term → `textBlockHeight(display, NOTE_FONT_SIZE)`).
- **sizeEstimate:** 1 file, 1 expression. Blast radius: every description note
  leaf, but strictly narrowing — a line only changes height if `isCreoleHrLine`
  is `true`, and no other golden's note contains such a line. Verification:
  description DOT-parity ratchet (351) + the size measure + note-bearing SVG
  goldens. Consider passing `fontSpec`/`measurer` too, so note lines pick up the
  per-line heading/`<size:N>` heights the folder path already gets — that is the
  same one-caller `measureTextBlock` seam `sizer-renderer-parity.md` documents
  for `wrapWidth`/`guillemet`, and `measureNote` is one of its five listed paths.
- **confidence:** high
