# T2f: klimt gaps salt needs (maintainer-approved 2026-10-12, journal row 14)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

Resolves the stop-10 report of journal row 13. Each piece is a klimt/creole static the
Java salt package calls; each is ported 1:1 INTO ITS UPSTREAM HOME (D4), never inside salt.
Runs ahead of T2a–T2e: `ElementTextField` (T2a), `ElementPyramid` (T2c) and every batch-3
factory consume these.

## Task (TDD, one failing test first per piece, jar/Java values)

1. **`Splitter.htmlTag` + `purgeAllTag`** →
   `src/core/klimt/creole/command/Splitter.ts` (new). Port
   `klimt/creole/command/Splitter.java:84-122` (the `htmlTag` alternation, in the Java's
   order: every `FontStyle` activation|deactivation pattern, then `fontPattern`,
   `fontColorPattern`, `fontSizePattern`, `fontSup`, `fontSub`, `endFontPattern`, `endSupSub`,
   `qrcodePattern`, `imgPattern`, `imgPatternNoSrcColon`, `fontFamilyPattern`, `linkPattern`,
   `svgAttributePattern` — `spritePattern` is commented out upstream and stays out) and
   `purgeAllTag` (`:140-142`, `replaceAll(htmlTag, "")` ⇒ a global regex). Reuse the pattern
   source strings already ported in `src/core/klimt/creole/command/CommandCreole*.ts` and
   `src/core/creole-atoms*.ts` where they exist (import, do not duplicate); port the ones
   that do not from their `Splitter.java` lines. Java regex → JS: `\\<` is a literal `<`;
   `Pattern2.cmpile` is case-insensitive (`Pattern2.java:114`, memory from T1a) — but
   `purgeAllTag` uses `String.replaceAll`, i.e. plain `Pattern.compile`, case-SENSITIVE;
   mirror that distinction and test it. Do not port the `tagOrText` splitter/`split`
   machinery unless `purgeAllTag` needs it (it does not).
2. **`FontStyle#getRegexActivationPattern` / `getRegexDeactivationPattern`**
   (`klimt/font/FontStyle.java:88-111,166-189`) → beside the `FontStyle` port in
   `src/core/klimt/shape/UText.ts` (or, if that file would cross 500 lines, a new
   `src/core/klimt/font/FontStyleRegex.ts` — state which, cite the line cap). Note the STRIKE
   activation pattern uses the `【a┇b】` UBREX alternation syntax (`FontStyle.java:102`); port it
   as the equivalent JS alternation and cite the translation. `null` → `undefined`; `htmlTag`
   must skip the `undefined` ones exactly as the Java's `sb.append(null)` would NOT — read
   `Splitter.java:88-93` and the Java `StringBuilder.append(String)` contract ("null"
   literal) before deciding; pin the resulting `htmlTag` string's shape with a test.
3. **`UFontFactory.serif`/`sansSerif`/`monospace`/`byDefault`**
   (`klimt/font/UFontFactory.java:54-68`) → `src/core/klimt/font/UFontFactory.ts`.
   `byDefault(size)` returns `sansSerif(12)` and ignores `size`; pin that. `FontStack.SERIF`
   etc. must come from the existing `FontStack` port; update the file's doc comment.
4. **`FontConfiguration.blackBlueTrue(font)`** (`klimt/font/FontConfiguration.java:63-65`)
   → `src/core/abel/FontConfiguration.ts` as a static, returning what the 5-arg `create`
   returns. Then make `src/diagrams/salt/element/AbstractElement.ts#blackBlueTrue` and
   `ElementText.ts` call it (keeping the `bridgeFontConfiguration` step that turns it into the
   creole `FontConfiguration`), and delete the salt-local `BLUE`/`BLACK_BLUE_TRUE_TAB_SIZE`
   constants — a literal with domain meaning lives once. Other files that mention
   `blackBlueTrue` in comments (`WarningBannerBlock.ts`, `StripeSimple.ts`, `Link.ts`,
   `leaf-sizing-legacy-fallback.ts`, `json/layout.ts`) are OUT of scope: do not edit them,
   list them under residuals.
5. Replace the throwing `purgeAllTag` stub in
   `src/diagrams/salt/element/AbstractElementText.ts:34-39` with the import; un-skip / add
   the `manageLength` tests so `AbstractElementText.ts` reaches ≥90% lines and branches.
   Jar data (T1c probes, `.agent-notes/sep-T1c.md`): `"**Bold** <color:red>red</color> //it//"`
   → 19 chars (152 px / 8); `"MyName   "` → 9 chars (`vizono-80-vipa581`); `<&icon>` counts
   as 2 (`AbstractElementText.java:69`, `replaceAll("<&[-\\w]+>", "00")`).

## Write-set
`src/core/klimt/creole/command/Splitter.ts` (new), `src/core/klimt/shape/UText.ts` (or the
named split file), `src/core/klimt/font/UFontFactory.ts`, `src/core/abel/FontConfiguration.ts`,
`src/diagrams/salt/element/{AbstractElement,AbstractElementText,ElementText}.ts`, their tests
(`tests/unit/core/klimt/**` for klimt pieces — mirror the existing layout — and
`tests/unit/salt/element/**`), `docs/catalog.md`. Any OTHER file is a stop: report, do not edit.

## Interface contracts
`Splitter.purgeAllTag(s: string): string`; `Splitter.htmlTag: string` (exported for tests);
`UFontFactory.byDefault(size: number): UFont` (+ `serif`/`sansSerif`/`monospace`);
`FontConfiguration.blackBlueTrue(font: UFont)` on the abel class;
`FontStyle` regex getters named as upstream. Consumed by T2a (`ElementTextField`), T2c
(`ElementPyramid`), T2b (`ElementMenuEntry`), every T3 factory.

## Acceptance
- Given the strings above, then `getCharNumber` equals the jar's reserved width / 8.
- Given `htmlTag`, then `purgeAllTag` strips every tag class the Java alternation lists and
  nothing else (test one representative per arm: `<b>`, `</i>`, `<u:red>`, `<color:#FF0000>`,
  `<size:12>`, `<sup>`, `</font>`, `<img:x>`, `<font:Arial>`, `[[link]]`, `<svg attribute>`),
  and leaves `**`, `//`, `--`, `<&icon>`, `<$sprite>` alone.
- Given `byDefault(10)`, then the result equals `sansSerif(12)`.
- Given the existing creole/klimt suites (`npx vitest run tests/unit/core/klimt tests/unit/core/creole*`
  or wherever `CommandCreole*` tests live — find them), then nothing changes: `htmlTag` is
  consumed only by `purgeAllTag` today.
- Given `tests/architecture`, then layering holds (`diagrams → core`, never the reverse).

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert).
