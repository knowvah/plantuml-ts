## Observation: classifier-level `[[...]]` decoration strip is unanchored, can eat a quoted alias's own bracket text
- **Context**: T5b (batch-5, class-divergence-drive-5) — fixing
  `class-decl-as-case-sensitive` (making the `as` alias regexes in
  `parseIdDisplay` case-insensitive, matching `Pattern2.java:112-114`)
  turned a previously-dormant code path live for
  `unknown/jixipo-21-mefu703` and `unknown/zivenu-37-nace681`
  (`class TRES AS "[[http://www.plantuml.com tres]]" <<otro>> { ... }`).
- **Finding**: `class-declaration-extractors.ts#extractDecorations`
  strips a classifier-level `[[url]]` decoration via
  `rest.replace(/\s*\[\[[^\]]*\]\]/g, '')` — unanchored, so it matches
  ANY `[[...]]` occurrence in the remainder, including one embedded
  inside a QUOTED alias's own display text (`"[[url]]"`). Stripping it
  there empties the display to `""`, which trips
  `parseClassifierDecl`'s `id === '' || display === ''` rejection —
  the WHOLE declaration returns `null`, and every later body line in
  that class becomes an orphaned top-level statement that matches no
  command (`parser.ts#buildSyntaxRefusal`, the "Syntax Error?" page).
  Upstream never has this collision: `NameAndCodeParser.java:47`'s
  `DISPLAY_WITH_GENERIC` lazy `(.+?)` consumes the ENTIRE quoted span
  as one atomic token before `UrlBuilder.OPTIONAL` (which sits AFTER
  TAGS1/STEREO/TAGS2 in the grammar) ever runs — the two groups can
  never overlap. Fixed with an `isInsideQuotedSpan` guard (odd `"`
  count before the match index) on both the `url` extraction and the
  strip regex.
  This bug was reachable even PRE-T5b via a lowercase `class TRES as
  "[[...]]"` (verified: `TRES.replace('AS','as')` crashed on the
  pristine, unmodified codebase too) — the case-insensitivity fix
  only widened which INPUT TEXT reaches it (uppercase `AS` too), it
  did not create the defect.
- **Impact**: any classifier declaration using `CODE as "DISPLAY"`
  (or `"DISPLAY" as CODE`) where DISPLAY itself contains a literal
  `[[...]]` (a creole url the classifier draws in its own display,
  not a real classifier-level url decoration) was silently corrupted
  into a full parse refusal for the whole class body. Worth a
  corpus-wide grep (`class .* as "[^"]*\[\[`) if more rows surface
  this shape in a later batch/survey.
- **Confidence**: High (instrumented — reproduced via `renderSync`
  and `extractDecorations` directly, both before and after the fix,
  and confirmed reproducible on the pristine pre-T5b source).
