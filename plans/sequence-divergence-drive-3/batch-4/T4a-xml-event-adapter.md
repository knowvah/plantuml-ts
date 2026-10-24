# T4a — XML event adapter over xmldom

Agent: `typescript-pro` (sonnet), worktree `sdd3-T4a`. Commit:
`feat(sprite): add strict SAX-style event adapter over xmldom`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
Upstream drives `javax.xml.parsers.SAXParser` with a `DefaultHandler`
(`SvgSaxParser.java:159-175` `parseSvg`): namespace-aware factory; DOCTYPE
refused via `disallow-doctype-decl` (`:163`), external entities off (`:164-165`);
the document is parsed twice over the same string (`:169-174`). SAX is strict:
a malformed document throws, and `drawU` rethrows it as `RuntimeException`
(`:112-120`). The port needs the same event stream without a JVM parser:
`@xmldom/xmldom` (already in the tree as a devDependency, `package.json:90`)
parses to a DOM; this module walks it in document order and emits
`startElement(qName, attrs)`, `characters(text)`, `endElement(qName)`.
`qName` is the prefixed name as written (namespace-aware SAX reports `qName`
unchanged). Attributes keep source order. `AttributesAdapter`
(`SvgSaxParser.java:1355-1429`) is the persisted copy used by `handleText`;
`SaxAttributes` here is already persistent, so no second class is needed
(journal this). Adjacent text nodes and CDATA arrive as `characters` calls;
comments and processing instructions emit nothing.

## Targets
None directly (infrastructure). Unblocks T4b.

## Write-set
`src/core/klimt/sprite/sax/sax-events.ts`,
`tests/unit/core/klimt/sprite/sax/sax-events.test.ts`, `package.json`
(move `@xmldom/xmldom` from `devDependencies` to `dependencies`),
`package-lock.json` (`npm install --package-lock-only`; only the `dev` flag
of that package may change), `vite.config.ts` (add `/^@xmldom\/xmldom/` to
`rollupOptions.external`, as the file's comment requires for runtime deps).

## Read-set
`SvgSaxParser.java:159-185,1355-1429`; `package.json:80-100`;
`vite.config.ts:22-37`; `node_modules/@xmldom/xmldom/index.d.ts`.

## Interface contracts (T4b depends on these exact exports)
```ts
export interface SaxAttributes {
  readonly length: number;
  qName(index: number): string;
  value(index: number): string;
  get(qName: string): string | undefined; // Attributes.getValue(String)
}
export interface SaxHandler {
  startElement?(qName: string, attrs: SaxAttributes): void;
  endElement?(qName: string): void;
  characters?(text: string): void;
}
export class SaxParseError extends Error {}
export function parseSaxEvents(xml: string, handler: SaxHandler): void;
```
Parse errors AND warnings from xmldom's `onError` throw `SaxParseError`
(`errorHandler` set so nothing is logged to the console). Input containing
`<!DOCTYPE` throws `SaxParseError` before xmldom sees it. Pure: no DOM
globals, no Node built-ins (xmldom is plain JS).

## Acceptance
- Given `<svg><g id="a"><text>x<![CDATA[y]]></text></g></svg>`, when parsed,
  then events are start svg, start g(id=a), start text, characters "x" and
  "y", end text, end g, end svg, in that order.
- Given `<svg><g></svg>` or a `<!DOCTYPE svg [<!ENTITY x "y">]>` prefix, then
  `parseSaxEvents` throws `SaxParseError`.
- Given attributes `b="1" a="2"`, then index order is b, a and `get('a')` is "2".
- Given the 1042 pins, then all stay byte-equal; no conformant loss in any
  engine (this task adds a dependency and one unused module; the build output
  of every engine is unchanged).

## Observability
N/A.

## Rollback
Reversible.
