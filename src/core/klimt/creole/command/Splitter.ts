/**
 * Splitter — the creole `htmlTag` alternation and `purgeAllTag`, which
 * strips every tag it matches (salt's `AbstractElementText#getCharNumber`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/Splitter.java:47-142
 */
import { FontStyle, getRegexActivationPattern, getRegexDeactivationPattern } from '../../shape/UText.js';

/*
 * The tag patterns `htmlTag` joins, as the Java literals' runtime values.
 * They are RAW `java.util.regex` sources: `purgeAllTag` is
 * `String.replaceAll`, i.e. plain `Pattern.compile` — no `Pattern2.transform`
 * (so `[%s]`/`[%g]`/`[%q]` are the literal classes `{%, s}`, `{%, g}`,
 * `{%, q, g}`) and no `CASE_INSENSITIVE` (`Pattern2.java:114` applies only to
 * `Pattern2.cmpile`). The `CommandCreole*.ts` sources are the transformed,
 * `Pattern2` spellings and cannot stand in for these.
 */

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/Splitter.java:49 */
const endFontPattern = '\\</font\\>|\\</color\\>|\\</size\\>|\\</text\\>';
/** @see Splitter.java:50 */
const endSupSub = '\\</sup\\>|\\</sub\\>';
/** @see Splitter.java:51 */
const fontPattern =
  '\\<font(\\s+size[%s]*=[%s]*[%g]?\\d+[%g]?|[%s]+color[%s]*=\\s*[%g]?(#[0-9a-fA-F]{1,6}|\\w+)[%g]?)+[%s]*\\>';
/** @see Splitter.java:52 */
const fontColorPattern = '\\<color[\\s:]+(#[0-9a-fA-F]{1,6}|#?\\w+)[%s]*\\>';
/** @see Splitter.java:53 */
const fontSizePattern = '\\<size[\\s:]+(\\d+)[%s]*\\>';
/** @see Splitter.java:54 */
const fontSup = '\\<sup\\>';
/** @see Splitter.java:55 */
const fontSub = '\\<sub\\>';
/** @see Splitter.java:56 */
const qrcodePattern = '\\<qrcode[\\s:]+([^>{}]+)' + '(\\{scale=(?:[0-9.]+)\\})?' + '\\>';
/** @see Splitter.java:57 */
const imgPattern =
  '\\<img\\s+(src[%s]*=[%s]*[%q%g]?[^\\s%g>]+[%q%g]?[%s]*|vspace\\s*=\\s*[%q%g]?\\d+[%q%g]?\\s*|valign[%s]*=[%s]*[%q%g]?(top|middle|bottom)[%q%g]?[%s]*)+\\>';
/** @see Splitter.java:58 */
const imgPatternNoSrcColon = '\\<img[\\s:]+([^>{}]+)' + '(\\{scale=(?:[0-9.]+)\\})?' + '\\>';
/** @see Splitter.java:59 */
const fontFamilyPattern = '\\<font[\\s:]+([^>]+)/?\\>';
/** @see Splitter.java:60 */
const svgAttributePattern = '\\<text[\\s:]+([^>]+)/?\\>';
/** @see Splitter.java:79 */
const linkPattern = '\\[\\[([^\\[\\]]+)\\]\\]';

/**
 * The static initializer's `htmlTag` (Splitter.java:84-122): for each
 * `FontStyle` in `EnumSet.allOf` (ordinal) order, its activation then
 * deactivation pattern, then the thirteen tag patterns; `spritePattern` is
 * commented out upstream (:115-116) and stays out. `sb.append(String)` would
 * write `"null"` for a null pattern; no constant returns one.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/Splitter.java:84-122
 */
function buildHtmlTag(): string {
  const parts: string[] = [];
  for (const style of Object.values(FontStyle)) {
    parts.push(getRegexActivationPattern(style), getRegexDeactivationPattern(style));
  }
  parts.push(
    fontPattern,
    fontColorPattern,
    fontSizePattern,
    fontSup,
    fontSub,
    endFontPattern,
    endSupSub,
    qrcodePattern,
    imgPattern,
    imgPatternNoSrcColon,
    fontFamilyPattern,
    linkPattern,
    svgAttributePattern,
  );
  return parts.join('|');
}

/**
 * `java.util.regex`'s `\s` without `UNICODE_CHARACTER_CLASS` is
 * `[ \t\n\x0B\f\r]` (Pattern javadoc, "Predefined character classes"), narrower
 * than ECMAScript's (which adds U+00A0, U+FEFF and the Unicode spaces) — the
 * jar keeps `<size:\u00A012>` through `purgeAllTag` (field-length-nbsp-size).
 * Every other construct `htmlTag` uses (`\w`, `\d` ASCII; `\<`, `\{`, `\[`
 * identity escapes; non-unicode BMP literals) reads the same in both engines.
 */
const JAVA_WHITESPACE_CLASS_BODY = ' \\t\\n\\x0B\\f\\r';

/** PORT-ONLY: rewrites each `\s` of a `java.util.regex` source as Java's
 *  class (bare inside `[...]`, bracketed outside). `htmlTag` has no nested
 *  classes or `\Q…\E` quoting, so one in-class flag tracks the context. */
function javaRegexToEcmaScript(java: string): string {
  let out = '';
  let inClass = false;
  for (let i = 0; i < java.length; i++) {
    const c = java.charAt(i);
    if (c === '\\') {
      i++;
      const escaped = java.charAt(i);
      if (escaped !== 's') out += c + escaped;
      else out += inClass ? JAVA_WHITESPACE_CLASS_BODY : `[${JAVA_WHITESPACE_CLASS_BODY}]`;
      continue;
    }
    if (c === '[') inClass = true;
    else if (c === ']') inClass = false;
    out += c;
  }
  return out;
}

/** @see Splitter.java:82 */
const htmlTag = buildHtmlTag();

/** `s.replaceAll(htmlTag, "")`: global, case-sensitive. @see Splitter.java:141 */
const HTML_TAG_ALL = new RegExp(javaRegexToEcmaScript(htmlTag), 'g');

/**
 * Splitter — the creole tag alternation and its purge. Ported slice:
 * `htmlTag` (exported for tests; package-private upstream) and
 * `purgeAllTag`. Not ported: the `tagOrText` splitter and its `split`
 * list (`Splitter(String)`, `getSplittedInternal`, :124-138), and the
 * `emoji`/`openicon`/`sprite`/`math`/`latex` pattern constants
 * (:62-80), none of which `htmlTag` reads.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/Splitter.java:47-142
 */
export const Splitter = {
  /** @see Splitter.java:82, 84-122 */
  htmlTag,

  /** @see Splitter.java:140-142 */
  purgeAllTag(s: string): string {
    return s.replace(HTML_TAG_ALL, '');
  },
} as const;
