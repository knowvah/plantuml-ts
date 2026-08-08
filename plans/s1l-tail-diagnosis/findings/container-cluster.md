# Findings — `container-cluster` bucket (T1, 9 fixtures)

Records on [SCHEMA.md](SCHEMA.md). Deltas re-measured 2026-08-06 from the
mission baseline run (`scripts/measure-description-size-deltas.ts`,
321/351, widened 0) — every one matches its `size-backlog.json` pin exactly.

**ADR-3 confirmed again: not one of the nine is cluster geometry.** The
classifier's `^\s*(?:<container-kw>)\b[^\n{]*\{|^\s*\{` pattern fired on a
`{{` embedded-diagram opener (kovaxi-11, zidebi-71), on a block-form
`skinparam rectangle {` / `node {` selector (lesori-32, ravodu-50,
tuliba-37), and on genuine `{}` containers whose *leaf* is wrong
(junoxu-15, vixeni-34, kokebo-27, fariba-82). `computeContainerBbox` is not
implicated by any of the nine; `frontier-cluster-bbox.ts` was never reached
in diagnosis.

**Both identical-delta pairs reconciled as ONE shared cause each**, and a
third fixture (tuliba-37) joins one of those causes despite a different
delta. Real mechanism partition of the nine:

| mechanism | fixtures |
|---|---|
| A — `{{ }}` embedded diagram never collapses to an atom | kovaxi-11, zidebi-71 |
| B — `<<$sprite>>` stereotype not resolved / not composed | lesori-32, ravodu-50, tuliba-37 |
| C — stereotype-label regex admits `<`/`>` | junoxu-15 |
| D — `[ … ]` body loses relative indentation | vixeni-34 |
| E — `keyword code <<st>> [` drops the stereotype + tabs unexpanded | fariba-82 |
| F — golden captured without `PLANTUML_DETERMINISTIC_TEXT` | kokebo-27 |

Cross-cutting evidence: I regenerated all nine oracles with
`java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=… -jar
oracle/dist/plantuml-oracle.jar` and diffed against the committed
`svek-*.dot`. **Eight are byte-identical; only `kokebo-27-vafi688` differs**
— that single diff is finding F, and the exercise also proves the other
eight goldens are trustworthy, so nothing below is chasing a stale oracle.

---

### fariba-82-xolu802

- **bucketLabel:** container-cluster (misfire — the `<style>` block's `file {`
  selector matched the container-opener regex; there is no container in the
  fixture)
- **delta:** 0.388889
- **status:** resolved
- **mechanism:** Two independent leaf-body gaps on the `file policy <<policy>>
  [ … ]` node, each worth exactly one 14px text row. (E1) The
  `keyword code <<stereo>> [` multi-line form parses the stereotype into a
  NON-capturing group and then builds the node from keyword+code only, so
  `node.stereotype` is never set and the `«policy»` row is never measured.
  (E2) `\t` is measured as an ordinary (zero-width) character instead of
  advancing to the next tab stop, so under the `skinparam wrapWidth 200` that
  `awslib/AWSCommon.puml:35` sets, the `\t\t"sts:AssumeRole"` line never
  overflows and never wraps to a second row.
- **originFileLine:** src/diagrams/description/parser.ts:111 (E1 —
  `makeNode(code, code, symbol)`; the stereotype captured-away at
  `parse-helpers.ts:334`'s `(?:\s*(?:<<[^>]+>>|…))*`). E2's site is the
  ABSENCE of upstream `AtomText.java:243-249`'s tab-stop advance — grep
  confirms no `AtomText.ts` exists in `src/`, so the creole text-run builder
  `src/core/klimt/creole/legacy/StripeSimple.ts:267` (`buildStripeAtoms`) has
  no tab branch at all.
- **causalChain:** Node `sh0007` oracle 2.434896 × 2.222222in (175.3125 ×
  160px); ours 2.434896 × 1.833333 (175.3125 × 132). Width is EXACT; the
  whole 0.388889in = 28px is height = two 14px rows. `file` margin is
  [20,20]: jar content 140 = 14 (`«policy»`) + 9 body rows × 14 = 126; ours
  112 = 0 + 7 body rows × 14. Jar-isolated with no `!include` at all
  (`skinparam wrapWidth 200` + the same body): jar 2.434896 × 2.222222, ours
  2.434896 × 1.833333 — the fixture reproduces exactly, so the awslib
  includes contribute only the `wrapWidth 200`. Split proven by two further
  jar probes: `file policy <<policy>> [AAAA\nBBBB]` measures 1.020139 ×
  0.861111 vs `file policy [AAAA\nBBBB]` 0.797917 × 0.666667 (stereotype =
  +16px w, +14px h) while OUR port returns 0.797917 × 0.666667 for BOTH →
  E1 = 14px. Body truncated after the `\t\t` line: jar 1.055556 vs ours
  0.861111 → E2 = 14px. 14 + 14 = 28 = 0.388889in exactly.
- **ruledOut:** (a) *Leaf-width bug* — ruled out: both node widths are
  bit-identical to the oracle (1.462500 and 2.434896); this re-confirms
  `plans/s1l-leaf-sizing/ledger.md`'s "NOT a leaf-width bug" verdict per
  ADR-4. (b) *Stale golden* — ruled out: regenerating with
  `-DPLANTUML_DETERMINISTIC_TEXT=true` reproduces the committed
  `svek-1.dot` byte-for-byte. (c) *`<style> file { HorizontalAlignment left
  / FontColor blue }`* — ruled out: dropping the whole `<style>` block from a
  probe leaves both sides' dims unchanged. (d) *awslib sprite sizing* — ruled
  out as the CAUSE of this delta: the sprite-bearing node `sh0006` is a
  separate, much smaller residual (see nextStep). (e) *`skinparam tabSize`* —
  ruled out as a lever: the jar's tab advance is 56px and does not respond to
  `tabSize` (matches `planning/sizer-renderer-parity.md`'s tabSize row), so
  the gap is tab EXPANSION, not the setting.
- **sharedCauseWith:** none for the delta itself. E2 (tab expansion) is a
  shared primitive that will also touch any other fixture with `\t` in a
  body; E1 is specific to the `keyword code <<st>> [` open form — T8 should
  check other buckets for that form before batching.
- **proposedWriteSet:** `src/diagrams/description/parse-helpers.ts`
  (capture the stereotype run in `ELEMENT_MULTILINE_OPEN_RE`),
  `src/diagrams/description/parser.ts` (`tryElementBlock` → set
  `node.stereotype`), plus a new tab-stop advance in the creole text path
  (`src/core/klimt/creole/legacy/StripeSimple.ts` and/or a new
  `src/core/klimt/creole/legacy/AtomText.ts`).
- **sizeEstimate:** 2 files for E1 (small, but blast radius = every
  `keyword code <<st>> [` fixture in the corpus — re-measure the full 351).
  E2 is larger: a real `AtomText` tab branch is a new shared primitive in the
  creole measure path; expect to re-run the class/state/object ratchets too.
- **confidence:** high
- **nextStep:** (not required — status is resolved) A residual remains after
  E1+E2: node `sh0006` (the awslib `User(user, "Trusted user", "")` element)
  is oracle 1.462500 × 1.722222 vs ours 1.462500 × 1.750000 = +2px height
  (0.027778in), reproduced in isolation and INDEPENDENT of label width
  (identical +2 at `"Trusted"`). That alone keeps the fixture above the
  0.01in bar, so the fix mission must diagnose it too: instrument the
  `$User [64x64/16z]` sprite + label stack height in `measureEntityLeaf`.

---

### junoxu-15-gori632

- **bucketLabel:** container-cluster (misfire — the container is real
  (`component MICROSERVICE as MS1 … {`) but it is a CLUSTER and clusters
  contribute no node deltas; the failing node is the leaf inside it)
- **delta:** 0.247743
- **status:** resolved
- **mechanism:** Our stereotype-label extractor uses `/<<\s*(.+?)\s*>>/g`,
  whose `.` matches `<` and `>`. Upstream's `Stereotype.getMultipleLabels`
  uses `<<\s?((?:<&\w+>|[^<>])+?)\s?>>` — angle brackets are EXCLUDED except
  for an OpenIconic `<&name>`. After the preprocessor expands
  `MICRO()` → `<U+00B5>`, the stereotype token is `<<<U+00B5>Service>>`:
  upstream matches nothing → `stereotypeLabels` empty → `stereo =
  TextBlockUtils.empty(0,0)`; we capture `<U+00B5>Service`, decode it, and
  measure a whole extra `«µService»` row.
- **originFileLine:** src/diagrams/description/parse-helpers-strings.ts:268
  (`const tagRe = /<<\s*(.+?)\s*>>/g;` inside `extractNodeStereotype`)
- **causalChain:** Node `sh0010` (leaf `MS2`) oracle 1.312674 × 0.611111in
  (94.5125 × 44px), ours 1.560417 × 0.805556 (112.35 × 58). `component`
  margin [40,30]: jar content = 54.5125 × 14 (label `uService` only, and the
  jar SVG confirms MS2 carries exactly ONE `<text>`); ours = 72.35 × 28
  (`«µService»` row + label). Width delta 112.35 − 94.5125 = 17.8375px =
  **0.247743in exactly**; height delta 14px = 0.194444in (the sorted-pairing
  idx-0 entry). Regex behaviour verified directly: on `<<<U+00B5>Service>>`
  upstream's pattern yields `[]`, ours yields `["<U+00B5>Service"]`; on
  `<<Service>>`, `<<µService>>`, `<<Serv()ice>>` both agree.
- **ruledOut:** (a) *`!define` / macro expansion bug* — ruled out by jar
  probe: `!define MICRO(foo='') zz` + `<<MICRO()Service>>` renders
  `«zzService»` (macro expands, stereotype shown), and the literal
  `<<<U+00B5>Service>>` with NO define reproduces the drop exactly. The
  define is irrelevant; the resulting `<`-bearing text is the cause.
  (b) *`<U+00B5>` decode-ordering* — ruled out as the driver: we decode
  early and upstream late, but upstream discards the label before decoding
  ever matters. (c) *Cluster-title sizing* — ruled out: cluster labels are
  not in `maxSizeDeltaIn`'s node set, and the delta arithmetic closes on the
  leaf alone. (d) *Stale golden* — ruled out (deterministic regen identical).
- **sharedCauseWith:** none confirmed. Any fixture whose stereotype text
  contains `<`/`>` (an `<U+…>` escape, an `<b>`/`<color:…>` creole tag, an
  `<img>`) hits the same site — T8 should grep the other six findings files
  for `<<` + `<` before batching.
- **proposedWriteSet:**
  `src/diagrams/description/parse-helpers-strings.ts` (adopt the exported
  pattern already ported at `src/core/stereo/Stereotype.ts:67`, rather than a
  second hand-written regex).
- **sizeEstimate:** 1 file, ~2 lines; blast radius is every description
  element carrying a stereotype, so re-measure all 351 + the description
  parity ratchet. Low cost, moderate risk of moving other pins.
- **confidence:** high

---

### kokebo-27-vafi688

- **bucketLabel:** container-cluster (misfire — `component a $a {` / `component
  b {` are real container openers, but both are EMPTY and the whole delta is
  in the oracle file, not in our code)
- **delta:** 0.034560
- **status:** resolved
- **mechanism:** The committed golden `svek-1.dot` was captured WITHOUT
  `-DPLANTUML_DETERMINISTIC_TEXT=true`, so it carries real AWT font metrics
  (`b` = 8.8115px wide, 16.4883px line height) while every other description
  golden — and our port — uses the deterministic width table (`b` = 7.7875,
  14). This is a golden-capture artifact, not a port defect.
- **originFileLine:** oracle/goldens/description/kokebo-27-vafi688/svek-1.dot:6
- **causalChain:** Committed golden: `sh0006 … width=0.677938,height=0.645671`
  (48.8115 × 46.4883px). Re-running the pinned jar on the SAME `input.puml`
  **with** the deterministic flag emits
  `width=0.663715,height=0.611111` (47.7875 × 44) — byte-identical to our
  port's output, delta 0. Re-running it **without** the flag reproduces the
  committed 0.677938 × 0.645671 exactly. Controlled experiment isolating one
  variable: the flag. Margins check out either way (`component` [40,30]: jar
  content 8.8115 × 16.4883 vs 7.7875 × 14 = the two metric regimes for the
  single glyph `b`). Delta 46.4883 − 44 = 2.4883px = **0.034560in**.
- **ruledOut:** (a) *Empty-container-as-leaf handling* — ruled out: both
  sides emit exactly one node and zero clusters, and the deterministic regen
  matches us bit-for-bit, so our empty-`{}` treatment is already correct.
  (b) *`remove $a` tag semantics* — ruled out: same regen argument; also the
  surviving node is `b` in both (jar SVG comment `<!--entity b-->`).
  (c) *Engine-selection divergence* — NOT the cause but worth recording for
  T8: the jar renders this fixture as `data-diagram-type="CLASS"` (the only
  one of the nine that is not `DESCRIPTION`; `note right of a` on a component
  is what flips it — a probe without the note stays DESCRIPTION). Our port
  uses the description engine. Ruled out as the cause because the
  deterministic jar and our port agree to the bit despite the different
  engine.
- **sharedCauseWith:** none (fixture-local oracle-capture defect). T8 should
  note the CLASS-vs-DESCRIPTION routing separately — it is a real fidelity
  gap with, today, zero size consequence.
- **proposedWriteSet:** `oracle/goldens/description/kokebo-27-vafi688/svek-1.dot`
  (regenerate with the deterministic flag) and the matching
  `oracle/goldens/description/size-backlog.json` entry (delete — the fixture
  becomes conformant). **Both are oracle mutations: ADR-2 forbids me touching
  the backlog and the task boundary says ASK FIRST before any oracle
  regeneration. Not done; flagged for maintainer approval.**
- **sizeEstimate:** 2 files, no `src/` change; verification = re-run
  `measure-description-size-deltas.ts` (expect 322/351) + the description
  parity ratchet. Also worth a one-off sweep of the other 350 goldens with
  the same regen-and-diff to see whether more were captured non-
  deterministically — I checked only my nine, and the other eight were clean.
- **confidence:** high

---

### kovaxi-11-reti348

- **bucketLabel:** container-cluster (misfire — the `{` the classifier matched
  is the `{{` on the note's first body line; the fixture has no container)
- **delta:** 0.772023
- **status:** resolved
- **mechanism:** A creole `{{ … }}` block inside a note must collapse to a
  single `EmbeddedDiagram` atom, whose measured size in the jar is the fixed
  `XDimension2D(42, 42)` fallback (`EmbeddedDiagram.java:149`, the
  `catch (Exception)` path — the jar's own embedded-render measurement fails
  and it degrades). `measureNote` instead measures the residual `{{`/`}}`
  block as ordinary creole text lines, so the note box is sized from 7 text
  rows.
- **originFileLine:** src/diagrams/description/leaf-sizing.ts:223 (`measureNote`
  — `maxLineWidth(display, …) + NOTE_MARGIN_H`, and `lineCount(display)` on
  the next line; the note display never passes through `CreoleParser`'s
  `{{` dispatch at `src/core/klimt/creole/legacy/CreoleParser.ts:309-311`)
- **causalChain:** Note node oracle 0.875000 × 0.722222in (63 × 52px); ours
  2.277778 × 1.402778 (164 × 101). `EntityImageNote` margins are
  `marginX1=6 + marginX2=15 = 21` and `2*marginY = 10`
  (`EntityImageNote.java:89-91`, ported identically as `NOTE_MARGIN_H=21` /
  `NOTE_MARGIN_V=10`). Solving the oracle: 63 − 21 = **42**, 52 − 10 = **42** —
  two independent equations both landing on the literal 42×42 fallback
  constant. Independently corroborated: the jar's own SVG draws the embedded
  activity diagram as a 754×1118 `<image>` overflowing a 63×52 note box, so
  the measure path and the draw path disagree in the jar exactly as the catch
  block implies. Ours: display collapses to 7 rows (`{{`, `start`,
  `while (count < max?)`, `:count = count + increment;`, `endwhile`, `stop`,
  `}}`) → 7 × 13 + 10 = 101 height, widest row + 21 = 164 width. The reported
  `maxSizeDeltaIn` 0.772023 is |1.027778 − 1.799801| from `sizeDeltas`'
  sorted-order-statistic pairing, not a single node pair; with the note at
  0.875 × 0.722222 the two sorted lists coincide and the delta is 0.
- **ruledOut:** (a) *`skinparam wrap_width 150`* — ruled out: the underscore
  spelling is not a PlantUML key (the classifier's own `\bwrapWidth\b` pattern
  does not match it either), and the three non-note nodes measure EXACTLY
  (0.410764, 1.799801, 1.945625) so no wrap is in play. (b) *Note position /
  `left to right direction` rotation* — ruled out: structure is EQUAL and node
  count/edges match; only the note's own box differs. (c) *Stale golden* —
  ruled out (deterministic regen identical). (d) *A real embedded-diagram
  renderer being required* — ruled out as a prerequisite: the oracle's target
  is the FAILURE fallback, so `src/core/EmbeddedDiagram.ts:415`'s already-
  ported `new XDimension2D(42, 42)` reproduces it without any nested
  pipeline.
- **sharedCauseWith:** zidebi-71-nocu387 (same mechanism, same arithmetic,
  same numbers to 6dp — the two sources differ only by `set
  namespaceSeparator none`, which is size-inert)
- **proposedWriteSet:** `src/diagrams/description/leaf-sizing.ts`
  (`measureNote` must route the display through the `{{` dispatch),
  `src/diagrams/description/renderer-entity.ts` (note draw path, to stay in
  sizer↔renderer lock-step), and the `NestedDiagramRenderer` wiring seam in
  `src/core/klimt/creole/legacy/CreoleParser.ts`.
- **sizeEstimate:** 2–3 files. The atom collapse itself is small (the class,
  the fallback constant and the `createAndSkip` line-consumer are all already
  ported). Blast radius: every note/body creole path, so re-measure all 351
  plus the class/state note ratchets. **Flag for the maintainer:** matching
  the oracle here means reproducing an upstream FAILURE (42×42) rather than a
  real embedded render. If a `NestedDiagramRenderer` is ever supplied that
  succeeds, this fixture will diverge again — that is a deliberate-divergence
  question (ADR-6), not something to decide inside the fix.
- **confidence:** high

---

### lesori-32-zeve057

- **bucketLabel:** container-cluster (misfire — the block-form `skinparam
  rectangle {` / `skinparam node {` selectors matched the container-opener
  regex; the real containers are clusters and contribute no node delta)
- **delta:** 0.242882
- **status:** resolved
- **mechanism:** A `<<$sprite>>` stereotype must be REPLACED by the sprite's
  own TextBlock (`EntityImageDescription.java:194-195`,
  `stereotype.getSprite(skinParam) != null → stereo = that sprite`). Two
  ported gaps stop that: (B1) `getSprite` has no `SpriteImage.fromInternal`
  fallback (`SkinParam.java:805`), so PlantUML's jar-resident
  `/sprites/archimate/interface.svg` is unresolvable — its own doc comment
  says so; and (B2) `buildStereo` has no sprite branch at all and always
  emits `«label»` text. Result: the stereotype measures as the literal string
  `«$archimate/interface»`.
- **originFileLine:** src/core/sprite-commands.ts:132 (`getSprite` — the first
  point of departure; the second is
  `src/core/svek/image/EntityImageDescriptionDelegates.ts:343`, `buildStereo`'s
  `stereotypeLabels.map((label) => '«' + label + '»')`, whose own doc comment
  reads "minus the sprite branch")
- **causalChain:** Node `sh0014` (leaf `TInterface`) oracle 2.038715 ×
  0.736111in (146.7875 × 53px), ours 2.281597 × 0.666667 (164.275 × 48).
  `rectangle` margin [20,20]. Jar content 126.7875 × 33: width is the label
  `Technology Interface` alone (the jar SVG reports exactly that
  `textLength=126.7875`) and height is sprite 19 + label 14; the jar draws the
  sprite as `<path>` data and emits NO stereotype `<text>`. Ours: content
  144.275 × 28 — the literal `«$archimate/interface»` string is WIDER than the
  label, so it drives the box, and it contributes one 14px text row instead of
  the sprite's 19. Width delta 164.275 − 146.7875 = 17.4875px = **0.242882in
  exactly**; height delta 5px = 0.069444in. Isolated three ways: (i) our port
  measures `rectangle "Technology Interface" as X` alone at 2.038715 ×
  0.472222 — the jar's width to the bit, so the label path is already
  correct; (ii) adding `<<$archimate/interface>>` moves us to 2.281597 ×
  0.666667, reproducing the fixture exactly with no cluster present; (iii) with
  a DECLARED 19×19 SVG sprite (which our registry can resolve) the jar returns
  **2.038715 × 0.736111 — the fixture's oracle node exactly** while we return
  2.038715 × 0.666667, isolating B2 as the residual 5px once B1 is closed. The
  19×19 also explains the bundled asset: `archimate/interface.svg` declares
  `19.995mm × 19.928mm`.
- **ruledOut:** (a) *Cluster geometry / `computeContainerBbox`* — ruled out:
  the delta closes entirely on a single LEAF measured in a 3-line probe with
  no container at all. (b) *`Shadowing False` / `StereotypeAlignment right` /
  `RoundCorner 10`* — ruled out: `ravodu-50` differs from this fixture ONLY by
  hoisting `skinparam StereotypeAlignment right` to the top and measures
  identically to 6dp; and the leaf probe reproduces the delta with none of
  the three present. (c) *`#TECHNOLOGY` colour* — ruled out (colour-only, per
  `planning/sizer-renderer-parity.md`'s size-neutral rows; the probe omits it
  and still reproduces). (d) *Stale golden* — ruled out (deterministic regen
  identical). (e) *Text-metric divergence* — ruled out: our sizer reproduces
  the jar's `Technology Interface` width to 4dp.
- **sharedCauseWith:** ravodu-50-siso430 (identical delta, identical source
  modulo one inert skinparam line, identical node table); tuliba-37-liza126
  (same B2 mechanism, different B1 entry point — see its record). Likely
  shared with fixtures in the `sprite` bucket: the historical triage in
  `size-backlog.json#_doc` claims 4 of this bucket's 22 were sprite-caused,
  and 3 of my 9 are.
- **proposedWriteSet:** `src/core/svek/image/EntityImageDescriptionDelegates.ts`
  (`buildStereo` sprite branch, B2 — the sizer-side fix that actually moves
  the number), `src/core/sprite-commands.ts` (`getSprite` internal fallback,
  B1), plus a new vendored `assets/sprites/**` resource root + its manifest
  and loader wiring (mirroring `assets/stdlib/`), since PlantUML's
  `/sprites/**` bundle is not vendored anywhere today (verified: `find` for
  `interface.svg` outside `node_modules` returns nothing).
- **sizeEstimate:** B2 is 1 file, ~10 lines, and is what closes 0.242882 →
  0.069444 → 0 once B1 lands. B1 is the large half: a new asset bundle
  (PlantUML ships hundreds of `/sprites/**` files), a browser-safe loader
  seam (no `fs` in `src/`), and a licensing check on the vendored icons.
  Verification: full 351 re-measure plus the SVG-golden skin ratchet, since
  the renderer changes too.
- **confidence:** high

---

### ravodu-50-siso430

- **bucketLabel:** container-cluster (same misfire as lesori-32)
- **delta:** 0.242882
- **status:** resolved
- **mechanism:** Identical to `lesori-32-zeve057` — the `<<$archimate/…>>`
  sprite stereotype is unresolvable (`getSprite` has no jar-internal
  fallback) and `buildStereo` has no sprite branch, so the stereotype
  measures as the literal `«$archimate/interface»` text row.
- **originFileLine:** src/core/sprite-commands.ts:132 (with
  `src/core/svek/image/EntityImageDescriptionDelegates.ts:343` as the second
  half)
- **causalChain:** Byte-for-byte the same as lesori-32: oracle `sh0014`
  2.038715 × 0.736111, ours 2.281597 × 0.666667, sorted-pairing deltas
  0.069444 / 0.242882 — the two probe outputs are character-identical. The
  sources differ ONLY in that `skinparam StereotypeAlignment right` is stated
  once at the top here and only inside the `skinparam node { }` block in
  lesori-32; alignment moves no box. See lesori-32's record for the full
  arithmetic and the three isolating probes.
- **ruledOut:** (a) *That the identical delta is coincidence* — ruled out
  directly: the two fixtures' full node tables, cluster tables and
  sorted-pairing tables are identical, and their sources diff by one line
  that only reorders a size-neutral alignment setting. (b) Everything ruled
  out for lesori-32 applies unchanged (cluster geometry, Shadowing,
  RoundCorner, `#TECHNOLOGY`, stale golden, text metrics) — the same probes
  were run against this fixture's own golden.
- **sharedCauseWith:** lesori-32-zeve057, tuliba-37-liza126
- **proposedWriteSet:** same as lesori-32 (one fix closes both).
- **sizeEstimate:** none additional — this fixture is carried by lesori-32's
  fix; do not schedule it as separate work.
- **confidence:** high

---

### tuliba-37-liza126

- **bucketLabel:** container-cluster (misfire — the `skinparam <<verb>> {`
  block-form selector and the real `rectangle … {` cluster both match, but the
  delta is entirely in leaves)
- **delta:** 0.521007
- **status:** resolved
- **mechanism:** Same B2 as lesori-32 — `buildStereo` has no
  `stereotype.getSprite(...)` branch, so a `<<$sprite>>` stereotype measures
  as literal `«$name»` text AND its sibling `<<verb>>` label survives, where
  upstream replaces the WHOLE stereo block with the sprite. Here the sprites
  are declared, but via `sprite $bFunction jar:archimate/business-function` —
  the `CommandSpriteFile` `jar:` form (`CommandSpriteFile.java:108-112`, which
  itself calls `SpriteImage.fromInternal`) is not ported, so nothing is
  registered either.
- **originFileLine:** src/core/svek/image/EntityImageDescriptionDelegates.ts:343
  (`buildStereo`'s `«label»` map; the second gap is
  `src/core/sprite-commands.ts:428`, `matchSpriteCommand`, which handles only
  the SVG and encoded-block forms — no `sprite $NAME <file>` / `jar:` form
  exists anywhere in `src/`)
- **causalChain:** Four leaves. `F`/`F1`: oracle 0.970486 × 0.736111in
  (69.875 × 53px) = content 49.875 (`Finance`) × 33 (sprite 19 + label 14);
  ours 1.743229 × 0.666667 (125.5 × 48) = content 105.5
  (`«$aComponent»`, wider than the label, so it drives the box) × 28
  (two text rows). `TP`/`TP1` (`<<$bFunction>><<verb>>`): oracle 2.256250 ×
  0.736111 (162.45 × 53) = 142.45 × 33 — note the height is STILL 19+14, i.e.
  `«verb»` contributes nothing; ours 2.256250 × 0.861111 (162.45 × 62) =
  142.45 × 42, three text rows. The jar's SVG contains no stereotype `<text>`
  at all, only sprite `<path>`s. `maxSizeDeltaIn` 0.521007 =
  |1.222222 − 1.743229| is a sorted-order-statistic pairing (the note's
  height against our `F` width), not a node pair — the note itself
  (2.408681 × 1.222222) is EXACT on both sides. The "sprite replaces the
  whole stereo block" half is jar-proven independently: with a declared 19×19
  SVG sprite, `<<$foo>>` and `<<$foo>><<verb>>` both measure
  2.038715 × 0.736111 in the jar, while ours grows 48 → 62.
- **ruledOut:** (a) *Cluster/nesting geometry* — ruled out: `F` and `F1` are
  the same declaration inside vs outside a cluster and BOTH are wrong by the
  same amount; the cluster contributes no node delta. (b) *`skinparam <<verb>>
  { roundCorner 25 }`* — ruled out: corner radius draws inside the box
  (`sizer-renderer-parity.md`'s roundCorner row) and `F`, which carries no
  `<<verb>>`, is wrong too. (c) *The note* — ruled out: our note node matches
  the oracle exactly (2.408681 × 1.222222), so the multi-line note body and
  its `[[url]]` are already correct. (d) *`0-left->` link decoration* — ruled
  out: the `point` node is 0.010000 × 0.000000 on both sides. (e) *The
  6.735899 → 0.521007 shrink recorded for creole-lexer unification* —
  re-verified per ADR-4: the current delta IS 0.521007, matching the pin, and
  the residual is a different mechanism (sprite stereotypes) from the one
  that produced the shrink (body/bracket display parsing). (f) *Stale
  golden* — ruled out (deterministic regen identical).
- **sharedCauseWith:** lesori-32-zeve057, ravodu-50-siso430 (shared B2); the
  `jar:`-sprite-definition half is unique to this fixture among the nine but
  shares the SAME underlying missing resource (`SpriteImage.fromInternal`)
  with lesori/ravodu, so one vendored `/sprites/**` bundle serves all three.
- **proposedWriteSet:**
  `src/core/svek/image/EntityImageDescriptionDelegates.ts` (`buildStereo`
  sprite branch), `src/core/sprite-commands.ts` (a `CommandSpriteFile` port
  covering at least the `jar:` form), plus the same vendored
  `assets/sprites/**` bundle + loader seam lesori-32 needs.
- **sizeEstimate:** `buildStereo` ~10 lines in 1 file; the `jar:` command form
  ~40 lines in 1 file; the sprite bundle is the same large shared item costed
  under lesori-32 — cost it ONCE, not three times. Verification: full 351
  re-measure + SVG goldens (the renderer changes).
- **confidence:** high

---

### vixeni-34-nici683

- **bucketLabel:** container-cluster (partial hit — `rectangle "Box B" {` is a
  real cluster, but the delta is in the leaf inside it)
- **delta:** 0.203299
- **status:** resolved
- **mechanism:** `processLine` trims every source line before dispatch, so a
  `[ … ]` element body reaches the node with ALL leading whitespace gone.
  `StripeTree#computeLevel` counts leading 2-space groups, so every `|_` line
  is level 1 and `AtomTree#calculateDimensionSlow`'s
  `skeleton.getXEndForLevel(level)` term never grows past 18px. Upstream
  preserves the body's RELATIVE indentation (it removes only the block's
  common base indent), so its deepest cell reaches level 3.
- **originFileLine:** src/diagrams/description/parser.ts:243
  (`const line = lines[i]!.trim();`)
- **causalChain:** Node `sh0010` (leaf `B`) oracle 1.709549 × 2.222222in
  (123.088 × 160px), ours 1.487326 × 2.222222 (107.087 × 160) — heights are
  EXACT, width is short by exactly 16.000px = 0.222222in. `Skeleton2.SIZE_X`
  is 8 and `AtomTree.margin` is 2, so a level-L cell starts at
  `8L + 8 + 2`. Jar: content 83.088 = 34 (level 3) + 49.0875 (`Level 4a`);
  ours: content 67.087 = 18 (level 1) + 49.0875. Two levels × 8px = 16.
  Confirmed by a monotonic jar sweep on a synthetic body of identical text at
  1/2/3/4 nesting levels: the jar returns 2.105903 / 2.217014 / 2.328125 /
  2.439236 (exactly +0.111111in = 8px per level) while our port returns
  2.105903 for ALL FOUR — and agrees exactly at one level, which pins the
  defect to the level computation rather than to `AtomTree`/`Skeleton2`
  (both are faithfully ported). AST dump confirms the input:
  `component B [AAAA\n|_ A\n  |_ A\n    |_ A]` parses to a display whose
  every line has zero leading whitespace. The reported 0.203299 is the
  sorted-pairing statistic (|1.690625 − 1.487326|), not the 16px node gap.
  The `maxSizeDeltaIn` reported drops to 0 once B is 1.709549, since the two
  sorted lists then coincide.
- **ruledOut:** (a) *Cluster `Box B` geometry* — ruled out: the sibling node
  `sh0011` (`Component A`) is EXACT (1.690625 × 0.611111), the cluster's own
  label is not part of the node delta, and the synthetic probe reproduces the
  full 16px with no cluster at all. (b) *`AtomTree`/`Skeleton2` port
  fidelity* — ruled out by reading both against the Java (`AtomTree.java:62-73`,
  `SIZE_X=8`, `margin=2` all match) and by the 1-level agreement. (c) *Tree
  glyph / line-colour drawing* — ruled out: heights are identical, and the
  `Skeleton2` rules draw inside the reserved indent. (d) *Text metrics* —
  ruled out: the `Component A` node matches to 6dp. (e) *Stale golden* —
  ruled out (deterministic regen identical).
- **sharedCauseWith:** none confirmed among these nine. Any fixture with an
  indented `[ … ]` body — creole tree OR any other indentation-sensitive
  construct — shares this site; T8 should scan the other findings files for
  `|_`.
- **proposedWriteSet:** `src/diagrams/description/parser.ts` (stop trimming
  before body accumulation, or accumulate the raw line and trim only for
  command dispatch), likely also
  `src/diagrams/description/parse-state.ts` (`pushElementBody` /
  `closePendingNote`) and a common-base-indent strip to match upstream.
- **sizeEstimate:** 2 files. Blast radius is HIGH and disproportionate to the
  line count: `processLine`'s trim is upstream of every command in the
  description parser, so the change must preserve trimming for dispatch while
  keeping raw text for bodies. Verification: full 351 re-measure, the
  description parity ratchet, and the note-body fixtures (notes accumulate
  through the same trimmed `line`).
- **confidence:** high

---

### zidebi-71-nocu387

- **bucketLabel:** container-cluster (same `{{`-matched misfire as kovaxi-11)
- **delta:** 0.772023
- **status:** resolved
- **mechanism:** Identical to `kovaxi-11-reti348` — the note's `{{ … }}` block
  never collapses to an `EmbeddedDiagram` atom, so `measureNote` sizes the
  note from 7 residual creole text rows instead of the jar's fixed 42×42
  embedded-render fallback.
- **originFileLine:** src/diagrams/description/leaf-sizing.ts:223
- **causalChain:** The probe output is character-identical to kovaxi-11's:
  oracle nodes 0.410764×1.027778, 1.799801×0.426627, 1.945625×0.455792,
  0.875000×0.722222; ours identical on the first three and 2.277778×1.402778
  on the note. 63 − 21 = 42 and 52 − 10 = 42 as before. The only source
  difference is `set namespaceSeparator none`, which changes qualified-name
  formatting and no geometry — and the two fixtures' three shared non-note
  nodes are bit-identical, which is direct evidence that the directive moved
  nothing.
- **ruledOut:** (a) *That `set namespaceSeparator none` contributes* — ruled
  out: it is the ONLY source difference from kovaxi-11 and every measured
  number on both sides is unchanged. (b) *That the identical delta is
  coincidence* — ruled out by the identical full node tables. (c) Everything
  ruled out for kovaxi-11 (`wrap_width`, note rotation, stale golden, the
  need for a real nested renderer) was checked against this fixture's own
  golden and applies unchanged.
- **sharedCauseWith:** kovaxi-11-reti348
- **proposedWriteSet:** same as kovaxi-11 (one fix closes both).
- **sizeEstimate:** none additional — carried by kovaxi-11's fix.
- **confidence:** high
