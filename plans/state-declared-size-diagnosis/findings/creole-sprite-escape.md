# creole-sprite-escape — T9

### papifi-44-caxo706

- **bucketLabel:** creole-sprite-escape
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 0 | 3.339063 | 1.651042 | +121.538 |
  | 1 | width | 1 | 3.771701 | 1.867361 | +137.112 |
- **status:** resolved
- **mechanism:** State display text (`<color:red>this should be red</color>`, `<color:green>...</color>`) is measured as a LITERAL character string by `measureLines`/`measureNormalState` — the creole markup tags are never parsed or stripped before the glyph-width lookup, so the `<color:...>`/`</color>` delimiter characters themselves add to the measured width. Jar builds the box's name `TextBlock` via `Display.create8(..., CreoleMode.FULL, ...)`, which creole-parses the text and measures only the visible glyphs ("this should be red" / "this should be green").
- **originFileLine:** src/diagrams/state/state-sizing.ts:182 (`measureLines`, called from `measureNormalState` at :208 for the name line)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageStateCommon.java:80-81 (`entity.getDisplay().create8(nameFc, ..., CreoleMode.FULL, ...)`) calling ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:625-629 (`create8`→`create0`, the creole-aware `TextBlock` builder)
- **causalChain:** idx0 (s1, red): our literal `measurer.measure('<color:red>this should be red</color>', font).width` = 220.4125px; jar's stripped `measurer.measure('this should be red', font).width` = 98.875px (verified via `scripts_scratch/T9/probe1.ts`, WidthTableMeasurer, size 14). Both add `STATE_MARGIN_DELTA`=20px: ours 240.4125px/72=3.339063in (exact match to measured "ours"); jar 118.875px/72=1.651042in (exact match to measured "jar"). Δpx = (220.4125-98.875) = 121.5375 ≈ reported +121.538. idx1 (s2, green): literal 251.5625px vs stripped 114.45px, same +20 margin → 3.771701in vs 1.867361in, Δ=137.1125≈+137.112.
- **ruledOut:** (1) `splitStateDisplayLines`/T1's `\n`/`\t` port — text has no embedded newline/tab, single line each, so line-splitting is not in play. (2) Margin/MIN-floor formula mismatch — ruled out; both sides apply the identical `STATE_MARGIN_DELTA`=20 and neither hits `STATE_MIN_WIDTH`=50 (36.7/54.2px raw over min already). (3) Font-size resolution (`resolveStateFontSize`) — ruled out; no `skinparam stateFontSize` in this fixture, default theme font size 14 used on both sides (probe reproduces exact numbers with size 14). Positive identification: literal-vs-stripped arithmetic reproduces both "ours" and "jar" numbers to 6 decimal places.
- **pairingRisk:** none — ours/jar orderings agree (red < green on both sides; heights tie at MIN so only width differentiates, and width ordering is unambiguous).
- **sharedCauseWith:** none (no other fixture's row shares this literal-vs-stripped Δpx, since Δ scales with each fixture's own markup length). RELATED but not identical origin: T8's `xeziki-47-zomo866`/`fatupo-62-bemu777` (note-scope creole `<color:...>` text) show the same *family* of symptom (ours ≫ jar on creole-marked-up text) but through `state-note-layout.ts:87`, a different call site — see cross-bucket note below, not claimed as sharedCauseWith per SCHEMA's "exact mechanism" bar.
- **proposedWriteSet:** src/diagrams/state/state-sizing.ts (`measureLines`, `measureTextLines`, `measureBodyTextLines` — route each line through a creole-visible-text step before `measurer.measure`); reuse the EXISTING creole-aware measuring utility already used by the class engine: `src/core/svek/image/leaf-sizing-text.ts:158-165` (`creoleVisibleText(line, fontSpec)`, built on `klimt/creole/legacy/StripeSimple.ts#buildLineAtoms` — creole-lexer-unification ADR-1). No new creole parser needed.
- **sizeEstimate:** small — 1 file changed for the fix (state-sizing.ts), 1 import from an existing, already-tested utility; blast radius is every `kind:'normal'` state whose display/description contains creole markup (color/font/bold/italic/link/sprite tags) — a meaningful slice of the 63-fixture "real" set (this bucket's 3, plus the note bucket's creole rows, plus any composite/attribute-line fixture using inline styling). Verification cost: re-run the harness on the full 272-fixture manifest, diff-review any newly-introduced mismatches (creole stripping changes text metrics for MANY fixtures at once, not just the 3 in this bucket).
- **confidence:** high
- **nextStep:**

### rovado-96-boda672

- **bucketLabel:** creole-sprite-escape
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 1 | 3.999132 | 2.363715 | +117.750 |
- **status:** resolved
- **mechanism:** Same root cause as papifi-44 (state-sizing.ts:182 measures literal, un-creole-stripped text), compounded by the fact this display embeds a literal `\n` INSIDE a `<font color=red>...</font>` span (`state "<font color=red>blah\nbleh</font>" as A`). `splitStateDisplayLines`/jar's `Display.getWithNewlines` (Display.java:262-346) BOTH split on the literal `\n` token before any creole parsing — producing the SAME two malformed fragments on both sides (`<font color=red>blah`, `bleh</font>`) — so the newline-splitting logic itself is faithful (T1, not the bug). The divergence is downstream: jar's per-line creole parser recognizes the valid (if unclosed) `<font color=red>` open tag on line 1 and strips it (measures "blah" only, 56.8125px); it does NOT recognize the orphaned `</font>` on line 2 as a tag (no matching open in that creole unit) and measures it literally (150.1875px) — our port never attempts creole recognition on EITHER line, so line 1 measures its full literal markup (267.9375px, the larger of the two, becomes our box width) while line 2 is coincidentally not the max on either side.
- **originFileLine:** src/diagrams/state/state-sizing.ts:182 (`measureLines`, called from `measureNormalState` at :208 for the name line)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageStateCommon.java:80-81 (`create8`) + ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:262-346 (`getWithNewlines`, the SAME split ours performs) and :625-629 (`create8`, the per-line creole strip ours skips)
- **causalChain:** `scripts_scratch/T9/probe2.ts` (WidthTableMeasurer, font Monospaced/30 — matches this fixture's `skinparam defaultFontName Monospaced` / `defaultFontSize 30`) reproduces both split lines: `'<font color=red>blah'`→267.9375px, `'bleh</font>'`→150.1875px; stripped `'blah'`/`'bleh'`→56.8125px each. Ours: max(267.9375, 150.1875)=267.9375, +20 margin=287.9375px/72=3.999132in — exact match. Jar: max(56.8125 [line1, tag-stripped], 150.1875 [line2, literal-unstripped])=150.1875, +20=170.1875px/72=2.363715277…in — matches reported jar 2.363715 to 6 decimals. Δpx=(267.9375-150.1875)=117.75, matching reported +117.750 exactly.
- **ruledOut:** (1) Line-splitting (`splitStateDisplayLines`/T1's `\n` port) as the cause — ruled out: probe2 shows OUR split matches Java's `getWithNewlines` exactly (same two malformed fragments), confirmed by reading Display.java:262-346's `Jaws.BLOCK_E1_NEWLINE`/backslash-n branch, which is line-splitting logic only, upstream of any creole tag interpretation. (2) `skinparam defaultFontName`/`defaultFontSize` mis-resolution — ruled out; using the fixture's actual values (Monospaced/30) in the probe reproduces the numbers exactly, so font resolution is faithful; the gap is purely the missing creole strip. (3) Height mismatch — none; height matches exactly on both sides (2 lines × 30px + 20 margin = 80px = 1.111111in) because line COUNT (not per-line content) drives height, and the malformed-tag split still yields 2 lines on both sides.
- **pairingRisk:** none — idx0 in this scope ([*] initial pseudostate, fixed CIRCLE_START_SIZE=20px=0.277778in) matches exactly on both axes; idx1 (state A) is the sole mismatched, unambiguous row.
- **sharedCauseWith:** none (Δpx is this fixture's own markup-length-dependent value, not shared numerically with any other row in the partition). Same underlying gap as papifi-44-caxo706 (both originate at state-sizing.ts:182) — flagged together for the fix mission's write-set, not a numeric sharedCauseWith per SCHEMA rule 3.
- **proposedWriteSet:** src/diagrams/state/state-sizing.ts (same as papifi-44-caxo706 — one fix covers both).
- **sizeEstimate:** see papifi-44-caxo706 (same fix, same file) — this fixture additionally exercises the malformed-tag-across-split-lines edge case, so the fix's test coverage should include a `<font>...\n...</font>`-style fixture, not just single-line creole markup.
- **confidence:** high
- **nextStep:**

### xasoka-58-temi462

- **bucketLabel:** creole-sprite-escape
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 1 | 2.681597 | 2.467708 | +15.400 |
- **status:** resolved
- **mechanism:** State S1's body line `foo [[http://plantuml.com]] bar` (a creole hyperlink, `[[url]]` with no explicit label) is measured literally by `measureLines`/`measureNormalState`'s `fields` computation, including the `[[`/`]]` delimiter characters. Jar's creole parser renders a bare `[[url]]` link as its visible label — the url text itself, with the double-bracket delimiters removed, per the SAME `Display.create8`/creole-Sheet path as papifi-44 — so the jar box width reflects `"foo http://plantuml.com bar"`, 4 characters (`[[`, `]]`) shorter than the literal string ours measures.
- **originFileLine:** src/diagrams/state/state-sizing.ts:182 (`measureLines`, called from `measureNormalState` at :210 for the body/`fields` lines)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:98-99 (`this.fields = list.create8(fieldsFontConfiguration, ..., CreoleMode.FULL, ...)`) → ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:625-629 (`create8`, the creole-parsing/link-stripping step ours skips)
- **causalChain:** `scripts_scratch/T9/probe1.ts` (WidthTableMeasurer, default theme font size 14 — this fixture sets no `skinparam` font overrides): literal `'foo [[http://plantuml.com]] bar'`→173.075px; bracket-stripped `'foo http://plantuml.com bar'`→157.675px. Both +`STATE_MARGIN_DELTA`=20: ours (173.075+20)/72=2.681597in — exact match to measured "ours"; jar (157.675+20)/72=2.467708in — exact match to measured "jar". Δpx=(173.075-157.675)=15.4, matching reported +15.400 exactly.
- **ruledOut:** (1) `name` (state id "S1") contributing to the mismatch — ruled out; idx0 (state S2, no body, MIN 50×50=0.694444in both axes) matches exactly on both sides, confirming the fixed-size/name-only path is unaffected and the bug is isolated to the BODY-line creole path. (2) `hide empty description` / `sdlreceive` stereotype branches — ruled out; fixture sets neither, `measureNormalKind` takes the plain `measureNormalState` branch on both S1/S2. (3) A wrapWidth-driven line-wrap difference — ruled out; the literal string has no embedded `\n`/`\t`, single fields-line, `measureLines` never invokes any wrap logic (there is none in this port's `measureLines`).
- **pairingRisk:** none — idx0 (S2) and idx1 (S1) differ enough (S1's body-driven box is nearly 4× S2's MIN-floor box on both ours and jar) that sorted-per-axis pairing cannot have swapped them.
- **sharedCauseWith:** none numerically. Mechanistically related (same missing creole-strip capability) to papifi-44-caxo706/rovado-96-boda672, but this fixture is the ONLY one of the three exercising the `[[url]]` link-stripping sub-case specifically (vs. `<color>`/`<font>` tag-stripping) — worth a distinct test case in the eventual fix, not a separate root cause.
- **proposedWriteSet:** src/diagrams/state/state-sizing.ts (same as the other two records in this bucket — one fix, reusing `leaf-sizing-text.ts#creoleVisibleText`, covers color/font tags AND `[[url]]` links, since `buildLineAtoms`/`classifyStripeLine` already handle link markup for the class engine).
- **sizeEstimate:** see papifi-44-caxo706 — same file, same fix; this fixture's role is a regression-test case for the link-syntax sub-path specifically.
- **confidence:** high
- **nextStep:**
