# Architecture decisions — `svg-attribute-escaping-audit`

All approved 2026-09-19. Amend here first; a contradiction found in
execution is stop condition 3.

## D1 — One escaper implementation, in `svg-format.ts`

**Context.** Two implementations exist: `svg.ts#escapeXml`/`escapeXmlText`
(`:145`, `:161`) and the private `escapeAttribute`/`escapeText` in
`xml-writer.ts` (`:218-240`), the latter a line-for-line port of jar
`XmlWriter.java:244-275`.
**Decision.** Move the two `xml-writer.ts` escapers into
`src/core/svg-format.ts` as exported `escapeAttribute`/`escapeText`;
`xml-writer.ts` imports them; `svg.ts` re-exports them under the existing
names `escapeXml`/`escapeXmlText` (catalog surface unchanged). The
layering test only polices `core → diagrams` edges, so no new edge.
**Consequences.** One implementation, two call seams (T2 then T3a).

## D2 — The template-path seam is `formatAttrValue`

**Context.** `attrs`/`attrsFromRecord` (26 call sites, 9 files) route through
`svg.ts#formatAttrValue` (`:171`), which formats but never escapes. Known
pre-escaping sites that would double-escape: `linkWrap` (`svg.ts:401-402`)
and `paint.ts#escapeAttr` (`:190`). The upstream architecture is the
`XmlWriter` path; migrating every template emitter onto it is a program.
**Decision.** `formatAttrValue` escapes every string value with
`escapeAttribute`; the two pre-escapes are removed in the same batch; the
string-carrying template sinks are rewritten to call `attrs()`. Migration
onto `XmlWriter` is recorded as the direction, not done here.
**Consequences.** Escaping a valid value is a no-op, so the zero-diff bar
is the proof; any diff is a finding (stop 5).

## D3 — `escapeXml` escapes `& < "`, not `>`

**Context.** Jar `XmlWriter.java:264` (comment) and `:265-275`: "Attribute
value (always double-quoted): escape '&', '<' and '"'." The port escapes
`>` too (`svg.ts:139`, `XML_RE = [&<>"]`); no test pins `&gt;` in an
attribute; text content already matches the jar (`& <` only, oracle-
verified per the `svg-primitives.test.ts:208` comment).
**Decision.** Align to the jar via D1's shared `escapeAttribute`. Gate: T1
renders `[[http://e.com{a>b} t]]` through the jar; if the oracle's `title=`
carries `&gt;`, D3 flips and this file is amended (stop 4).
**Consequences.** Byte-identical for every value without `>`; a `>` in a
tooltip stops being over-escaped.

## D4 — `id` attributes: escape only, no charset validation

**Context.** Probes show ids are synthetic (`ent0001`, `lnk3`,
`<alias>-to-<alias>`). Jar sets ids with `setAttribute("id", …)`
(`SvgGraphics.java:395`, `:779`, `:869`) and lets the writer escape.
**Decision.** Escape via the seam; do not validate to an id-safe charset
(that would be a divergence). T1 oracles `class "n" as "a b"` and records
what the jar emits for a quoted alias.
**Consequences.** An id with a space stays an id with a space, as upstream.

## D5 — Fitness gate: ESLint selector, no allowlist

**Context.** `tests/architecture/svg-emission-seam.test.ts` already forbids
shape markup outside the seam; it does not see attribute interpolation.
**Decision.** `no-restricted-syntax` on `TemplateElement` whose raw text
ends in `name="` immediately before an expression, applied to `src/**`.
Numeric and constant sinks are routed through `attrs()` too, so the rule
ships with no allowlist. The seam test gains one assertion: zero
`eslint-disable` for the rule under `src/`. The rule has its own
positive/negative fixture test through the ESLint `Linter` API.
**Consequences.** A new sink fails `npm run lint`, not a later review.
More than two disables needed = stop 7.

## D6 — `sanitizeSvg` stays exported, unwired, with its wiring point named

**Context.** No production caller. The jar splices fetched SVG raw
(`SvgGraphics.java:790-797`); the port does not inline fetched SVG at all
(`svg-graphics.ts:157` throws "deferred per D3-prime").
**Decision.** Keep it. Its doc comment names D3-prime image embedding as the
wiring point; the `:157` deferral comment points back at it.
**Consequences.** No behaviour change; the decision is recorded, not
ambiguous.

## D7 — Well-formedness is a gate

**Context.** The font-family defect is malformed XML, not XSS; string
matching would not catch the next one.
**Decision.** Every probe in `attribute-injection.test.ts` parses its output
with `@xmldom/xmldom` (already a devDependency, already used by
`tests/oracle/svg-conformance/normalize.ts`) and fails on a parse error.
**Consequences.** The `a&b<c` font name becomes a regression test.

## D8 — XML comments from user names use the jar's `--` defang (amendment, 2026-09-19)

**Context.** T1 found a live injection the brief missed: `class
"x--><script>evil()</script><!--"` renders a real `<script>` element
because `src/diagrams/class/renderer-group.ts:83/:93/:123` and
`src/diagrams/state/renderer-group.ts:112` template names into
`<!--…-->`. Jar `XmlWriter.comment` defangs `--` to `- -` and pads a
trailing `-` (oracle `findings/oracles/comment-close/jar.svg`:
`<!--class x- -><script>evil()</script><!- - -->`); the port's
`xml-writer.ts:104-118` already mirrors it. D7's parse gate cannot see
this: the output is well-formed XML.
**Decision.** Extract the defang into `svg-format.ts` as `escapeComment`
(same shape as D1); `xml-writer.ts` calls it; the four comment sinks call
it. T3c owns this (Batch 2, after T3a). D5's ESLint rule gains a second
selector: a template chunk containing an unclosed `<!--` before an
interpolation. The probe file's DOM walk (no `script`, no `on*`) stays on
every probe.
**Consequences.** Byte-identical for every name without `--`; the
comment-close oracles become regression pins. Approved by the user
2026-09-19 after stop 1.

## Rollback

Reversible. Code only; `git revert` of the merge restores prior behaviour.
No irreversible change; no acknowledgement needed.
