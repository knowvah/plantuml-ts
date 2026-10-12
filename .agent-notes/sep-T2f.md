# sep-T2f: klimt gaps salt needs

## Observation: FontStyle STRIKE's "regex" activation pattern never matches
- **Context**: porting `Splitter.htmlTag` (Splitter.java:88-93), which appends `FontStyle#getRegexActivationPattern` per style.
- **Finding**: `FontStyle.java:102` returns the UBREX literal (`<【strike┇…】〇?〘:〶$XC=…〙>`) from the REGEX getter. Compiled by `java.util.regex` the `【┇】` are literal text and the mid-pattern `$` can never be followed by `XC`, so the arm matches nothing. Jar probe: `"<s>ab</s>" + 20 spaces` reserves 25 chars (200 px) — `<s>` survives `purgeAllTag`, `</s>` (deactivation arm, java:185) is stripped. Pinned by `tests/unit/salt/element/fixtures/field-length-strike-s.*`.
- **Impact**: any port reading `getRegexActivationPattern(STRIKE)` must keep the verbatim string; translating it to a JS alternation diverges from the jar.
- **Confidence**: High

## Observation: `purgeAllTag` is raw `Pattern.compile`, not `Pattern2`
- **Context**: same.
- **Finding**: `String.replaceAll(htmlTag, "")` (Splitter.java:141) — no `Pattern2.transform` (so `[%s]` is the class `{%, s}`), case-SENSITIVE, and Java `\s` = `[ \t\n\x0B\f\r]`. Jar probes: `<color:red >ab</color>` keeps `<color:red >` (34 chars), `<COLOR:red>ab</COLOR>` keeps everything (41), `<size:` NBSP `12>` keeps the tag (32). The `CommandCreole*.ts` pattern sources are the transformed Pattern2 spellings and module-private, so `Splitter.ts` carries its own raw copies.
- **Impact**: do not "dedupe" Splitter.ts's sources against CommandCreole*.ts; they are different regexes.
- **Confidence**: High
