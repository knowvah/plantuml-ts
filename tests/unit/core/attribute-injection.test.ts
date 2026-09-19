import { describe, it, expect } from 'vitest';
import { DOMParser } from '@xmldom/xmldom';
import { renderSync } from '../../../src/index.js';
import { assembleDocumentShell } from '../../../src/core/klimt/document-shell.js';

// An unparseable `skinparam backgroundColor` token is kept verbatim by
// `resolveColorToSvgHex` (g1c decision K1) where upstream's `getColorOrWhite`
// falls back to white. It must therefore never reach an attribute unescaped
// (CodeQL js/html-constructed-from-input on `svgRoot`).
const PAYLOAD = 'x"onload="alert(1)';

// Comment-context payload: `-->` closes an XML comment, so anything after it
// is live markup. The jar defangs `--` to `- -` (XmlWriter.java:119).
const COMMENT_PAYLOAD = 'x--><script>evil()</script><!--';

/**
 * Mission decision D7: every probe is gated on well-formedness, not on string
 * matching -- the font-family defect is malformed XML, not XSS, and string
 * matching would not catch the next one. `@xmldom/xmldom` reports every
 * problem through `onError`; a fatal error ALSO throws (`dom-parser.js:493-
 * 496`), so the throw is recorded too rather than escaping the helper.
 */
function parsesAsXml(svg: string): string[] {
  const errors: string[] = [];
  try {
    new DOMParser({
      onError: (level, message) => {
        errors.push(`${level}: ${message}`);
      },
    }).parseFromString(svg, 'image/svg+xml');
  } catch (err) {
    errors.push(`throw: ${(err as Error).message}`);
  }
  return errors;
}

/**
 * Well-formed is not the same as safe: `<!--class x--><script>…</script>
 * <!---->` parses cleanly. Walk the DOM for anything that would execute --
 * a `script` element or an `on*` event-handler attribute on any element.
 */
function liveMarkup(svg: string): string[] {
  const doc = new DOMParser({ onError: () => undefined }).parseFromString(svg, 'image/svg+xml');
  const found: string[] = [];
  const all = doc.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    const el = all.item(i)!;
    if ((el.localName ?? '').toLowerCase() === 'script') found.push(`<script> element #${i}`);
    for (let a = 0; a < el.attributes.length; a++) {
      const name = el.attributes.item(a)!.name;
      if (/^on/i.test(name)) found.push(`${el.localName}@${name}`);
    }
  }
  return found;
}

/** Renders `source` and asserts the two mission-wide invariants. */
function expectSafe(source: string): string {
  const svg = renderSync(source);
  expect(parsesAsXml(svg)).toEqual([]);
  expect(liveMarkup(svg)).toEqual([]);
  return svg;
}

describe('attribute injection via skinparam colors', () => {
  // PR #59 review: `<latex>` labels wrap KaTeX in a foreignObject whose
  // `<div style="…font-family:${theme.fontFamily}…">` interpolated the font
  // name MID-VALUE -- past every `="`-anchored check. Now emitted via attrs().
  it('escapes the font name once inside the latex foreignObject style attribute', () => {
    const svg = expectSafe(
      `@startuml\nskinparam defaultFontName x"onload="alert(1)\nstart\n:a <latex>x^2</latex> b;\nstop\n@enduml`,
    );
    expect(svg).toContain('font-family:x&quot;onload=&quot;alert(1);');
    expect(svg).not.toContain('onload="alert');
  });

  it('renderSync never emits the raw quote payload as an attribute', () => {
    const svg = renderSync(`@startuml\nskinparam backgroundColor ${PAYLOAD}\nA -> B\n@enduml`);
    expect(svg).not.toContain('onload');
    // The jar renders this source with `background:#FFFFFF` (oracle-verified):
    // `HColorSet#getColorOrWhite` at the skinparam boundary.
    expect(svg).toContain('background:#FFFFFF');
  });

  it('assembleDocumentShell escapes the background inside the style attribute', () => {
    const svg = assembleDocumentShell({ width: 10, height: 10, body: '', background: PAYLOAD }, 'class');
    expect(svg).not.toContain('onload="alert');
    expect(svg).toContain('background:x&quot;onload=&quot;alert(1);');
  });
});

// One probe per user-text path in `plans/svg-attribute-escaping-audit/
// findings/audit-table.md`. Each renders the payload and asserts
// well-formedness plus no live markup; it does NOT pin where the payload
// lands (text vs attribute) -- that is the table's job. Every entry here is
// green today; the comment-defang fix and its byte-pins are below (T3c).
const GREEN_PROBES: ReadonlyArray<readonly [string, string]> = [
  // Element names and aliases into id/class/data-qualified-name/comments.
  [
    'class quoted name with " (display text)',
    `@startuml\nclass "${PAYLOAD}" as A\nclass "${COMMENT_PAYLOAD}" as B\nA -> B\n@enduml`,
  ],
  [
    'class code as "display" with " (comment + data-qualified-name)',
    `@startuml\nclass N1 as "${PAYLOAD}"\nN1 -> N2\n@enduml`,
  ],
  [
    "class quoted code with < & ' (comment, data-qualified-name, link id)",
    `@startuml\nclass "x<b&c'd"\nclass A\nA -> "x<b&c'd"\n@enduml`,
  ],
  ['class quoted code with a space (D4 record: id="C-to-a b")', `@startuml\nclass "a b"\nclass C\nC -> "a b"\n@enduml`],
  [
    'object quoted name and body value',
    `@startuml\nobject "x<b&c'd" as O1\nobject O2 {\n f = ${PAYLOAD}\n}\nO1 -> O2\n@enduml`,
  ],
  [
    'state quoted name, description and comment payload',
    `@startuml\nstate "x<b&c'd" as S1\nstate S2 : ${PAYLOAD} & <b>\nstate "${COMMENT_PAYLOAD}" as S3\nS1 -> S2\nS2 -> S3\n@enduml`,
  ],
  [
    'state quoted code as link endpoint',
    `@startuml\nstate "${COMMENT_PAYLOAD}"\n[*] --> "${COMMENT_PAYLOAD}"\n"${COMMENT_PAYLOAD}" --> [*]\n@enduml`,
  ],
  [
    'component quoted code with the comment payload (XmlWriter defangs --)',
    `@startuml\ncomponent "${COMMENT_PAYLOAD}"\n[A] -> "${COMMENT_PAYLOAD}"\n@enduml`,
  ],
  [
    'usecase quoted code with the comment payload',
    `@startuml\nusecase "${COMMENT_PAYLOAD}"\n(A) -> "${COMMENT_PAYLOAD}"\n@enduml`,
  ],
  [
    'component and usecase quoted names with "',
    `@startuml\ncomponent "${PAYLOAD}" as C1\nusecase "${COMMENT_PAYLOAD}" as U2\nC1 -> U2\n@enduml`,
  ],
  [
    'participant/actor quoted names (title element + text)',
    `@startuml\nparticipant "${PAYLOAD}" as A\nactor "${COMMENT_PAYLOAD}" as B\nA -> B : hi\n@enduml`,
  ],
  [
    'participant code as "display"',
    `@startuml\nparticipant X as "${PAYLOAD}"\nactor Y as "${COMMENT_PAYLOAD}"\nX -> Y : hi\n@enduml`,
  ],
  [
    'participant quoted code as message endpoint',
    `@startuml\nparticipant "${COMMENT_PAYLOAD}"\n"${COMMENT_PAYLOAD}" -> B : m\n@enduml`,
  ],
  ['sequence box title', `@startuml\nbox "${COMMENT_PAYLOAD}"\nparticipant A\nend box\nA -> B\n@enduml`],
  // [[url]] and [[url{tooltip}]] -> href / xlink:href / title / xlink:title.
  [
    '[[url]] and [[url{tooltip}]] on a class',
    `@startuml\nclass A [[http://e.com/${PAYLOAD}]]\nclass B [[http://e.com/x{${PAYLOAD}} lbl]]\nA -> B\n@enduml`,
  ],
  [
    '[[url]] and [[url{tooltip}]] in a sequence message',
    `@startuml\nA -> B : [[http://e.com/${PAYLOAD}]]\nA -> B : [[http://e.com/x{${PAYLOAD}} lbl]]\n@enduml`,
  ],
  [
    '[[url{tooltip}]] carrying the comment payload',
    `@startuml\nA -> B : [[http://e.com/${COMMENT_PAYLOAD}{${COMMENT_PAYLOAD}} lbl]]\n@enduml`,
  ],
  [
    '[[url{a>b}]] tooltip (D3 gate: jar writes title="a>b" raw)',
    `@startuml\nA -> B : [[http://e.com{a>b} t]]\n@enduml`,
  ],
  [
    '[[url{tooltip}]] in a sequence note',
    `@startuml\nA -> B\nnote right\n[[http://e.com{t<u&v} l]]\nend note\n@enduml`,
  ],
  ['[[url{tooltip}]] on a participant', `@startuml\nparticipant A [[http://e.com/x<b&c{t<u&v}]]\nA -> B\n@enduml`],
  [
    '[[url{tooltip}]] on a participant with " (tail regex rejects it)',
    `@startuml\nparticipant A [[http://e.com/${PAYLOAD}{${PAYLOAD}}]]\nA -> B\n@enduml`,
  ],
  [
    '[[url]] in activity and state labels (not creole-parsed there)',
    `@startuml\nstart\n:act [[http://e.com/${PAYLOAD}{${PAYLOAD}} lbl]];\nstop\n@enduml`,
  ],
  [
    '[[url]] on a state and its transition',
    `@startuml\nstate S [[http://e.com/${PAYLOAD}{${PAYLOAD}}]]\n[*] -> S : [[http://e.com/${PAYLOAD}{${PAYLOAD}} l]]\n@enduml`,
  ],
  [
    '[[url]] on component/usecase and their link',
    `@startuml\ncomponent C [[http://e.com/${PAYLOAD}{${PAYLOAD}}]]\nusecase U [[http://e.com/${PAYLOAD}{${PAYLOAD}}]]\nC -> U : [[http://e.com/${PAYLOAD}{${PAYLOAD}} l]]\n@enduml`,
  ],
  // Creole images and sprites.
  [
    '<img:path> and <img:path{scale=…}> in class body, message and note',
    `@startuml\nclass A {\n<img:${PAYLOAD}>\n<img:${PAYLOAD}{scale=2}>\n}\nA -> B : <img:${PAYLOAD}> <img:${PAYLOAD}{scale=2}>\nnote right of A\n<img:${PAYLOAD}>\n<img:x.png{scale=${PAYLOAD}}>\nend note\n@enduml`,
  ],
  [
    '<$sprite> known, unknown and scaled',
    `@startuml\nsprite $s [4x4/4] {\n0000\n0000\n0000\n0000\n}\nclass A {\n<$s> <$${PAYLOAD}> <$s{scale=2}>\n}\nA -> B : <$s> <$${PAYLOAD}>\n@enduml`,
  ],
  [
    'sprite definition name with < & (grammar rejects)',
    `@startuml\nsprite $x<b&c [4x4/4] {\n0000\n0000\n0000\n0000\n}\nA -> B : <$x<b&c>\n@enduml`,
  ],
  [
    'inline SVG sprite carrying <script> and onload (never drawn)',
    `@startuml\nsprite $evil <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>evil()</script><rect width="10" height="10" onload="alert(1)"/></svg>\nclass C {\n<$evil>\n}\nC -> D : <$evil>\n@enduml`,
  ],
  // Creole style tags.
  [
    '<color:…> <back:…> <size:…> with the payload (regex rejects; literal text)',
    `@startuml\nA -> B : <color:${PAYLOAD}>t</color> <color:#${PAYLOAD}>u</color> <back:${PAYLOAD}>v</back> <size:${PAYLOAD}>w</size>\n@enduml`,
  ],
  [
    '<color:name> <back:name> with an unknown \\w+ name',
    `@startuml\nA -> B : <color:xonloadq>t</color> <back:xonloadq>u</back> <color:#xonloadq>v</color>\nclass A {\n<color:xonloadq>t</color> <back:xonloadq>u</back>\n}\n@enduml`,
  ],
  [
    '<font:…> with " (swapped to \')',
    `@startuml\nA -> B : <font:${PAYLOAD}>t</font>\nclass A {\n<font:${PAYLOAD}>h</font>\n}\n@enduml`,
  ],
  [
    '<font color=… size=…> attribute form with the payload (falls through to font-family, swapped)',
    `@startuml\nA -> B : <font color=${PAYLOAD} size=${PAYLOAD}>t</font> <font color="red" size="20">u</font>\n@enduml`,
  ],
  [
    'valid creole colours, gradients and sizes',
    `@startuml\nA -> B : <color:red>t</color> <color:#FF0000>u</color> <back:red>v</back> <size:20>w</size>\nA -> B : <color:#red/blue>t</color> <back:#?red:blue>u</back> <size:2x>w</size>\n@enduml`,
  ],
  // Inline #color on every command that takes one.
  [
    '#color on class and class links, incl. #red/blue and #?light:dark',
    `@startuml\nclass A #red/blue\nclass B #?red:blue\nclass C #xonloadq\nA -> B #red\nB --> A #line:red;text:blue\n@enduml`,
  ],
  [
    '#color with the payload on class/link (grammar rejects)',
    `@startuml\nclass A #${PAYLOAD}\nA -> B #${PAYLOAD}\n@enduml`,
  ],
  [
    '#color on participant, arrow, note and box',
    `@startuml\nparticipant A #red/blue\nparticipant P #xonloadq\nA -> B #xonloadq : m\nA -[#red]> B : m\nnote right #xonloadq : n\nbox b #red\nparticipant C\nend box\n@enduml`,
  ],
  ['#color on state and transition', `@startuml\nstate S #xonloadq\n[*] -> S #xonloadq\nS --> [*] #red\n@enduml`],
  [
    '#color on component, usecase and their link',
    `@startuml\ncomponent A #xonloadq\nusecase U #xonloadq\nA -> U #xonloadq\n@enduml`,
  ],
  [
    '#color suffix on activity actions',
    `@startuml\nstart\n:act; #red\n:act2; #xonloadq\n:act3; <<x&b>> #blue\nstop\n@enduml`,
  ],
  [
    '#color prefix on activity actions and swimlanes (unparsed today)',
    `@startuml\n|#red|lane|\nstart\n#red:act;\n#${PAYLOAD}:act2;\nstop\n@enduml`,
  ],
  // skinparam string values into non-colour attributes.
  [
    'skinparam defaultFontName / classFontName with " (swapped to \')',
    `@startuml\nskinparam defaultFontName ${PAYLOAD}\nskinparam classFontName ${PAYLOAD}\nclass A\nA -> B\n@enduml`,
  ],
  [
    'skinparam sequence/participant/note font names with "',
    `@startuml\nskinparam sequenceMessageFontName ${PAYLOAD}\nskinparam participantFontName ${PAYLOAD}\nskinparam noteFontName ${PAYLOAD}\nA -> B : m\nnote right : n\n@enduml`,
  ],
  [
    'skinparam title/arrow/attribute font names and boolean-ish keys with "',
    `@startuml\nskinparam style ${PAYLOAD}\nskinparam defaultTextAlignment ${PAYLOAD}\nskinparam arrowFontName ${PAYLOAD}\nskinparam titleFontName ${PAYLOAD}\nskinparam classAttributeFontName ${PAYLOAD}\nskinparam monochrome ${PAYLOAD}\nskinparam shadowing ${PAYLOAD}\nskinparam handwritten ${PAYLOAD}\ntitle t\nclass A {\n f\n}\nA -> B : m\n@enduml`,
  ],
  [
    'skinparam svgLinkTarget with " (not wired; target stays _top)',
    `@startuml\nskinparam svgLinkTarget ${PAYLOAD}\nA -> B : [[http://e.com]]\n@enduml`,
  ],
  [
    'skinparam svgLinkTarget on a class link',
    `@startuml\nskinparam svgLinkTarget ${PAYLOAD}\nclass C [[http://e.com]]\n@enduml`,
  ],
  [
    'skinparam linetype / dpi with " (enum-gated / unported)',
    `@startuml\nskinparam linetype ${PAYLOAD}\nskinparam dpi ${PAYLOAD}\nclass A\nA -> B\n@enduml`,
  ],
  // <style> block, !theme, skin.
  [
    '<style> root/classDiagram values with "',
    `@startuml\n<style>\nroot {\n FontName ${PAYLOAD}\n FontColor ${PAYLOAD}\n BackgroundColor ${PAYLOAD}\n LineColor ${PAYLOAD}\n HyperlinkColor ${PAYLOAD}\n LineStyle ${PAYLOAD}\n}\nclassDiagram {\n class { FontName ${PAYLOAD} }\n}\n</style>\nclass A\nA -> B : m\n@enduml`,
  ],
  [
    '<style> sequenceDiagram values with "',
    `@startuml\n<style>\nsequenceDiagram {\n FontName ${PAYLOAD}\n BackgroundColor ${PAYLOAD}\n LineColor ${PAYLOAD}\n participant { FontName ${PAYLOAD} }\n}\n</style>\nA -> B : m\n@enduml`,
  ],
  ['!theme name with " and with < &', `@startuml\n!theme ${PAYLOAD}\nA -> B\n@enduml`],
  ['!theme name with < &', `@startuml\n!theme x<b&c\nA -> B\n@enduml`],
  ['skin name with " (unported command; syntax-error page)', `@startuml\nskin ${PAYLOAD}\nA -> B\n@enduml`],
  // @startdot labels / ids / tooltips (rendered by the dot engine).
  [
    '@startdot label, id, tooltip and node names',
    `@startdot\ndigraph g {\n a [label="x\\"onload=\\"alert(1)" id="x\\"onload=\\"alert(1)" tooltip="x\\"onload=\\"alert(1)"];\n "x<b&c>d" -> a [label="x<b&c>d"];\n "${COMMENT_PAYLOAD}" -> a;\n}\n@enddot`,
  ],
  // Title / header / footer / caption / legend.
  [
    'title/header/footer/caption/legend on a sequence diagram',
    `@startuml\ntitle ${PAYLOAD}\nheader ${PAYLOAD}\nfooter ${PAYLOAD}\ncaption ${PAYLOAD}\nlegend\n${PAYLOAD}\nendlegend\nA -> B : m\n@enduml`,
  ],
  [
    'title/header/footer/caption/legend on a class diagram',
    `@startuml\ntitle ${PAYLOAD}\nheader ${PAYLOAD}\nfooter ${PAYLOAD}\ncaption ${PAYLOAD}\nlegend\n${PAYLOAD}\nendlegend\nclass A\n@enduml`,
  ],
  [
    'title/header/footer/caption/legend on an activity diagram',
    `@startuml\ntitle ${PAYLOAD}\nheader ${PAYLOAD}\nfooter ${PAYLOAD}\ncaption ${PAYLOAD}\nlegend\n${PAYLOAD}\nendlegend\nstart\n:a;\nstop\n@enduml`,
  ],
  // Note and message text with " < & >.
  [
    'sequence messages and notes with " < & > and the comment payload',
    `@startuml\nA -> B : ${PAYLOAD} ${COMMENT_PAYLOAD}\nnote left : ${PAYLOAD} ${COMMENT_PAYLOAD}\nnote over A,B\n${PAYLOAD}\n${COMMENT_PAYLOAD}\nend note\nA -> B : a "b" <c> & d\n@enduml`,
  ],
  [
    'class notes with the payloads',
    `@startuml\nclass A\nnote left of A : ${PAYLOAD} ${COMMENT_PAYLOAD}\nnote "x<b&c" as N\nA .. N\n@enduml`,
  ],
  ['state notes with the payloads', `@startuml\nstate S\nnote left of S : ${PAYLOAD} ${COMMENT_PAYLOAD}\n@enduml`],
  [
    'activity notes with the payloads',
    `@startuml\nstart\n:a;\nnote right : ${PAYLOAD} ${COMMENT_PAYLOAD}\nstop\n@enduml`,
  ],
  [
    'sequence divider, group, ref and delay text',
    `@startuml\n== ${PAYLOAD} ==\ngroup ${PAYLOAD} [${PAYLOAD}]\nA -> B : m\nend\nref over A : ${PAYLOAD}\n... ${PAYLOAD} ...\nA -> B ++ : ${PAYLOAD}\nreturn ${PAYLOAD}\n@enduml`,
  ],
  [
    'class members and stereotypes with the payloads',
    `@startuml\nclass A <<x&b>> {\n+${PAYLOAD}()\n-${PAYLOAD}\n{static} ${COMMENT_PAYLOAD}\n}\nclass B <<${PAYLOAD}>>\nparticipant P <<x&b>>\nA -> B\n@enduml`,
  ],
  ['sequence participant stereotype', `@startuml\nparticipant P <<x&b>>\nP -> B\n@enduml`],
  // Activity labels and swimlanes.
  [
    'activity action labels with < & > "',
    `@startuml\nstart\n:x<b&c>d "q";\n:say "hi" ${PAYLOAD};\n:${COMMENT_PAYLOAD};\nstop\n@enduml`,
  ],
  [
    'activity swimlane names with < & \' and with "',
    `@startuml\n|x<b&c'd|\nstart\n:a;\n|${PAYLOAD}|\n:b;\n|${COMMENT_PAYLOAD}|\nstop\n@enduml`,
  ],
  [
    'activity if/else branch labels',
    `@startuml\nstart\nif (x<b&c "q") then (y<z&w "q")\n:b;\nelse (${COMMENT_PAYLOAD})\n:c;\nendif\nstop\n@enduml`,
  ],
  [
    'activity while/endwhile labels',
    `@startuml\nstart\nwhile (w<b&c "q") is (i<j&k "q")\n:d;\nendwhile (e<f&g "q")\nstop\n@enduml`,
  ],
  ['activity partition title (unparsed today)', `@startuml\nstart\npartition "p<q&r" {\n:e;\n}\nstop\n@enduml`],
  // @startjson / @startyaml keys and values.
  [
    '@startjson keys and values with the payloads',
    `@startjson\n{"x\\"onload=\\"alert(1)": "x\\"onload=\\"alert(1)", "${COMMENT_PAYLOAD}": ["${COMMENT_PAYLOAD}", 1], "k": {"a<b&c": "d>e\\"f"}}\n@endjson`,
  ],
  [
    '@startjson #highlight with the payload',
    `@startjson\n#highlight "x\\"onload=\\"alert(1)"\n{"x\\"onload=\\"alert(1)": 1}\n@endjson`,
  ],
  [
    '@startyaml keys and values with the payloads',
    `@startyaml\n${PAYLOAD}: ${PAYLOAD}\nk:\n  - ${COMMENT_PAYLOAD}\n@endyaml`,
  ],
];

describe('attribute injection probe matrix (audit-table.md, one probe per path)', () => {
  it.each(GREEN_PROBES)('%s', (_name, source) => {
    expectSafe(source);
  });

  it('description-diagram comments defang -- like the jar (XmlWriter.comment)', () => {
    const svg = expectSafe(`@startuml\ncomponent "${COMMENT_PAYLOAD}"\n[A] -> "${COMMENT_PAYLOAD}"\n@enduml`);
    // Oracle `findings/oracles/comment-close-desc/jar.svg`:
    // `<!--entity c- -><script>evil()</script><!- - -->`.
    expect(svg).toContain('<!--entity x- -><script>evil()</script><!- - -->');
    expect(svg).toContain('<!--link A to x- -><script>evil()</script><!- - -->');
  });

  it('font-family with " is swapped to \' the way the jar does', () => {
    const svg = expectSafe(`@startuml\nskinparam defaultFontName ${PAYLOAD}\nA -> B\n@enduml`);
    expect(svg).toContain(`font-family="x'onload='alert(1)"`);
  });

  // SI-saea T3a/D2: `class/renderer-group.ts`'s local `escAttr` pre-escape
  // was removed -- `group()`'s `attrsFromRecord` now escapes `data-
  // qualified-name` exactly once. Before the fix this doubled to
  // `&amp;quot;` (still well-formed XML, so `expectSafe` alone never
  // caught it); this pin asserts the exact bytes.
  it('data-qualified-name escapes a quote exactly once, never &amp;quot;', () => {
    const svg = expectSafe(`@startuml\nclass N1 as "x\\"y"\nN1 -> N2\n@enduml`);
    expect(svg).toContain('data-qualified-name="x\\&quot;y"');
    expect(svg).not.toContain('&amp;quot;');
  });

  // Formerly a `raw` defect (audit-table.md): the string-based font-family
  // swap site (`svg-text-font.ts:31`) replaced `"` with `'` but left `&` and
  // `<` untouched, producing malformed XML. T3a's `formatAttrValue` seam
  // (`svg.ts`) now escapes every string attribute after the swap. Oracle
  // `findings/oracles/font-name-chars/jar.svg` emits
  // `font-family="a'b&amp;c&lt;d"`.
  //
  // `classFontName` was audited as reaching the separate klimt path
  // (`svg-graphics-elements.ts:83`); measured directly, class diagrams draw
  // text through the same `core/svg.js#text` string path as `defaultFontName`
  // (`src/diagrams/class/class-namespace-shape.ts:41` imports `text` from
  // `../../core/svg.js`), so both skinparams close through this one seam.
  // The klimt path (`svg-graphics-elements.ts:83`) was checked separately:
  // its value is set via `XmlNode#setAttribute` and serialized by
  // `XmlWriter#attribute` (`xml-writer.ts:87`), which already calls
  // `escapeAttribute` (D1/T2) -- confirmed by rendering a component diagram
  // with `skinparam defaultFontName a"b&c<d`, which already emitted
  // `font-family="a'b&amp;c&lt;d"` before this task. No fix needed there.
  it('skinparam defaultFontName a"b&c<d emits font-family="a\'b&amp;c&lt;d" and parsesAsXml', () => {
    const svg = expectSafe(`@startuml\nskinparam defaultFontName a"b&c<d\nA -> B\n@enduml`);
    expect(svg).toContain(`font-family="a'b&amp;c&lt;d"`);
  });

  it('skinparam classFontName a"b&c<d emits font-family="a\'b&amp;c&lt;d" and parsesAsXml', () => {
    const svg = expectSafe(`@startuml\nskinparam classFontName a"b&c<d\nclass A\nA -> B\n@enduml`);
    expect(svg).toContain(`font-family="a'b&amp;c&lt;d"`);
  });

  it('creole <font:a"b&c<d>t</font> emits font-family="a\'b&amp;c&lt;d" and parsesAsXml', () => {
    const svg = expectSafe(`@startuml\nA -> B : <font:a"b&c<d>t</font>\n@enduml`);
    expect(svg).toContain(`font-family="a'b&amp;c&lt;d"`);
  });

  // D3 gate (decisions.md#d3): the jar writes `title="a>b"` RAW in an
  // attribute -- oracle `findings/oracles/tooltip-gt/jar.svg`.
  it('[[url{a>b}]] tooltip renders title="a>b" raw, matching the jar (D3)', () => {
    const svg = expectSafe(`@startuml\nA -> B : [[http://e.com{a>b} t]]\n@enduml`);
    expect(svg).toContain('title="a>b" xlink:title="a>b"');
  });

  // Fixed by SI-saea T3c (D8): the class-diagram renderer interpolates the
  // entity/cluster/link name into `<!--class …-->`, `<!--cluster …-->` and
  // `<!--link … to …-->` via `escapeComment` (`class/renderer-group.ts`),
  // which defangs `--` the way the jar's `XmlWriter.comment` does
  // (`XmlWriter.java:117-119`). Before the fix `x-->` closed the comment
  // early and `<script>evil()</script>` became a live element --
  // well-formed XML, which is why `parsesAsXml` alone did not catch it and
  // `liveMarkup` exists. Byte-for-byte pins against the two oracles below.
  it('class "x--><script>evil()</script><!--" emits the jar\'s defanged comment (class/renderer-group.ts wrapEntity) and liveMarkup is empty', () => {
    const svg = expectSafe(`@startuml\nclass "${COMMENT_PAYLOAD}"\nclass A\nA -> "${COMMENT_PAYLOAD}"\n@enduml`);
    // Oracle `findings/oracles/comment-close/jar.svg`.
    expect(svg).toContain('<!--class x- -><script>evil()</script><!- - -->');
  });

  it('package "p--><script>…<!--" { class B } emits the jar\'s defanged cluster comment (class/renderer-group.ts wrapCluster) and liveMarkup is empty', () => {
    const svg = expectSafe(`@startuml\npackage "p${COMMENT_PAYLOAD}" {\nclass B\n}\n@enduml`);
    // Oracle `findings/oracles/comment-close/jar.svg`'s cluster comment is
    // `<!--cluster p- -><script>evil()</script><!- - -->` for the payload
    // `p<COMMENT_PAYLOAD>` there; this probe's own payload is `p` prefixed
    // onto `COMMENT_PAYLOAD`, producing the same defang shape.
    expect(svg).toContain('<!--cluster px- -><script>evil()</script><!- - -->');
  });

  it('A -> "x--><script>…<!--" emits the jar\'s defanged link comment (class/renderer-group.ts wrapLink) and liveMarkup is empty', () => {
    const svg = expectSafe(`@startuml\nclass "${COMMENT_PAYLOAD}"\nclass A\nA -> "${COMMENT_PAYLOAD}"\n@enduml`);
    // Oracle `findings/oracles/comment-close/jar.svg`.
    expect(svg).toContain('<!--link A to x- -><script>evil()</script><!- - -->');
  });

  it('object "x--><script>…<!--" (class renderer, wrapEntity) emits a defanged comment and liveMarkup is empty', () => {
    const svg = expectSafe(`@startuml\nobject "${COMMENT_PAYLOAD}"\n@enduml`);
    // `object` shares `class/renderer-group.ts#wrapEntity` with `class`, so
    // it emits the same `<!--class …-->` tag (not `<!--object …-->`).
    expect(svg).toContain('<!--class x- -><script>evil()</script><!- - -->');
  });

  // `state/renderer-group.ts#wrapLink` also got `escapeComment` (D8), but
  // this port's state-transition grammar drops quoted endpoint names today
  // (T1 finding), so `[*] --> "COMMENT_PAYLOAD"` never reaches a transition
  // at all -- measured directly: the rendered SVG has no `<g class="link">`
  // and no `<!--link …-->` comment of any kind. The sink is routed anyway
  // (D8's "route it anyway") for when the grammar gap closes; this probe
  // pins today's actual, narrower observable: no live `<script>` and no
  // link comment to defang.
  it('state [*] --> "x--><script>…<!--" emits no link (transition grammar drops the quoted endpoint) and liveMarkup is empty', () => {
    const svg = expectSafe(
      `@startuml\nstate "${COMMENT_PAYLOAD}"\n[*] --> "${COMMENT_PAYLOAD}"\n"${COMMENT_PAYLOAD}" --> [*]\n@enduml`,
    );
    expect(svg).not.toContain('<!--link');
    expect(svg).not.toContain('<g class="link"');
  });
});
