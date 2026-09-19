# T3c — Comment sinks use the jar's `--` defang (D8)

## Context
T1 proved a live injection: `class "x--><script>evil()</script><!--"`
renders a real `<script>` element. Four sinks template user names into
XML comments: `src/diagrams/class/renderer-group.ts:83` (`<!--class
NAME-->`), `:93` (`<!--cluster NAME-->`), `:123` (`<!--link X to Y-->` /
`<!--reverse link …-->`; object and package share these) and
`src/diagrams/state/renderer-group.ts:112` (`<!--link X to Y-->`; state's
transition grammar drops quoted endpoints today, so its probe emits no
link — route it anyway). The jar's `XmlWriter.comment` splits `--` into
`- -` and pads a trailing `-` with a space; the port's
`xml-writer.ts:104-118` mirrors it exactly. Oracles:
`findings/oracles/comment-close/jar.svg` (class) and
`comment-close-desc/jar.svg` (component). T1 left four `it.todo`s in
`tests/unit/core/attribute-injection.test.ts` for this.

## Task
1. `svg-format.ts`: export `escapeComment(value: string): string` — the
   defang body from `xml-writer.ts:109-111` (split `--` → `- -`; if the
   result ends with `-`, append one space), JSDoc citing jar
   `XmlWriter.java` `comment(...)` (find the line; cite it) and D8.
2. `xml-writer.ts#comment`: call `escapeComment`; no other change.
3. Both `renderer-group.ts` files: wrap every interpolated name in the
   four comment templates with `escapeComment(...)`. Nothing else in
   those files changes (no renames, no reordering).
4. Tests: `svg-format.test.ts` rows for `escapeComment` (`--`, `---`,
   trailing `-`, `-->`, empty, plain); turn on T1's four todos and make
   them assert the jar's bytes from the oracles (quote them); the DOM walk
   already on every probe must stay green.

## Write-set
- `src/core/svg-format.ts`
- `src/core/klimt/drawing/svg/xml-writer.ts`
- `src/diagrams/class/renderer-group.ts`
- `src/diagrams/state/renderer-group.ts`
- `tests/unit/core/svg-format.test.ts`
- `tests/unit/core/attribute-injection.test.ts`
- the existing unit tests for the two renderer-group files, ONLY if an
  expectation must change (say which and why in the commit body)
- `docs/catalog.md` (regenerated: new export)

## Read-set
- `decisions.md#d8`, `#d1`
- `src/core/klimt/drawing/svg/xml-writer.ts:98-120`
- `src/diagrams/class/renderer-group.ts:55-130`
- `src/diagrams/state/renderer-group.ts:100-120`
- `findings/oracles/comment-close/jar.svg`, `comment-close-desc/jar.svg`
- `findings/audit-table.md` section "NEW finding"
- `tests/unit/core/attribute-injection.test.ts` (the four todos and the `liveMarkup` helper)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/XmlWriter.java` (the `comment` method)

## Architecture decisions
D8 (locked). Escaping a name without `--` is a no-op: zero comparator diffs.

## Interface contracts
```ts
export function escapeComment(value: string): string; // '--' → '- -'; trailing '-' → '- '
```

## Acceptance criteria
- Given the class payload, when rendered, then the comment bytes equal
  the jar's `<!--class x- -><script>evil()</script><!- - -->` and the DOM
  walk finds no `script` element
- Given `--` anywhere in a class/cluster/link name, when rendered, then
  no `-->` appears before the comment's own close
- Given `npx vitest run svg-conformance` and the full suite, when run,
  then zero diffs
- Given `xml-writer.ts`, when grepped, then the defang body appears once,
  in `svg-format.ts`

## Quality bar
All four gates; conformance unmoved; `npm run catalog` committed.

## Boundaries
- Never: change comment wording or order; touch `svg.ts` or `paint.ts`;
  `git add -A`

## Observability
N/A.

## Rollback
Reversible.

## Commit
`fix(saea-T3c): comment sinks apply the jar's -- defang`
Body: the live injection, the four sinks, the jar method mirrored.
