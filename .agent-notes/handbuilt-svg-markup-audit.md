# Hand-built SVG markup bypasses every emission rule — full audit

## Observation: the single most productive bug source in the size-reduction mission

- **Context**: audit prompted 2026-08-08 after hand-built markup produced
  its fifth distinct defect in one mission. `src/core/svg.ts#attrs` /
  `attrsFromRecord` are the choke point where rule 1 (3-decimal formatting)
  and rule 2 (`shortenColor`) are applied. **Markup built by string
  concatenation reaches the output with neither.**

- **Defects this pattern caused in this mission alone:**
  1. `class-namespace-shape.ts` emitted `d="M8.5,6 L28.925000000000004,6 …"`
     once its compensating `javaRound4` was removed (fixed, T7b).
  2. `attrs` (tuple form) never applied `shortenColor` while its sibling
     `attrsFromRecord` did — visibility icons emitted `fill="#FFFF44"`
     against the jar's `#FF4` (fixed).
  3. `class-visibility-icon.ts#styleAttr` and
     `class-namespace-folder-outline.ts` built `stroke:<color>;` as raw
     style strings (fixed).
  4. `class-monochrome.ts`'s post-pass regex matched 6-digit hex only, so
     every 3-digit color rule 2 emits was skipped by the inversion — a
     wrong picture, not a formatting nit (fixed).
  5. `usymbol-shapes.ts#filledPath` and `creole-table.ts` built `<path>`,
     `<rect>` and `<text>` by hand in `src/core/`, outside T7b's
     `src/diagrams/**` scope (fixed).
  6. `svg-markers.ts` emitted `fill="#FFFFFF" stroke="#000000"` while the
     same background emitted `#FFF` on `svgRoot`'s rect (fixed).
  7. `usymbol-shapes.ts` used `paintToSvg` directly, whose gradient
     `<stop stop-color>` values are NOT shortened, where the sibling
     `resolvePaint` applies `shortenStopColors` (fixed).

## Current state — 63 unrouted sites remain, none in a goldened engine

Enumeration (`grep -rnE '`<(path|rect|ellipse|polygon|polyline|line|circle|text|image|marker|stop)\b[^`]*\$\{' src --include='*.ts'`, excluding `src/core/klimt/` and sites already routed through `attrs([`):

| area | sites | goldened by a jar ratchet? |
|---|---|---|
| `diagrams/activity` | 20 | no |
| `diagrams/chart/renderers` | 13 | no |
| `diagrams/chart` | 8 | no |
| `diagrams/json` | 3 | no |
| `diagrams/sequence` | 2 | no |
| `diagrams/dot` | 2 | no |
| `core` | remaining are verified-correct (they call `fmt()`/`shortenColor`/`attrs`) or are error-fallback markup (`dispatcher.ts`, `class/index.ts`) | — |

**None of the 45 remaining engine sites regressed in this mission**: they
were never formatted, before or after, because `core/svg.ts` applied no
formatting at all until this work. They are latent, not new.

## Why they still matter

Each one emits raw binary floats (`28.925000000000004`) and 6-digit colors
where the jar emits 3-decimal and `#RGB`. Any of those engines gaining a
jar ratchet will fail on contact, and any user byte-comparing their output
already sees the difference.

## The durable fix, if someone takes this on

Upstream has exactly ONE emission seam — `SvgGraphics`'s
`svgRectangle`/`svgLine`/`svgPolygon`/`svgEllipse`/`svgPath`/`svgImage`,
reached by every diagram through the `Driver*Svg` classes — and no
per-diagram markup anywhere. This port already has the 1:1 equivalents in
`core/svg-shapes.ts`. Routing these 45 sites through them is mechanical and
mirrors upstream; see `.agent-notes/two-svg-emitters-divergence.md` for why
the split exists at all.

A cheap guard worth adding first: a lint rule or fitness test forbidding a
template literal that opens an SVG element tag outside `core/svg*.ts` and
`core/klimt/`. That converts this from a recurring discovery into a
build-time error.

- **Confidence**: High — every site enumerated by grep, and each "already
  correct" claim verified by executing the function and reading its output.

---

## Resolved (2026-08-08)

All 45 sites routed, plus 9 more the guard found in `core/`. The guard
recommended above is `tests/architecture/svg-emission-seam.test.ts`, and it
passes with **no allowlist** — no file outside `core/svg.ts`,
`core/svg-shapes.ts`, `core/svg-markers.ts` and `core/klimt/` opens a shape
element.

Shape vs container is the guard's boundary: `<svg>`, `<g>`, `<defs>`,
`<clipPath>`, `<marker>`, `<filter>`/`<fe*>` are document structure that
upstream also assembles outside `SvgGraphics`, and are not covered.

### Emitters added to close the gaps

`circle`, `polyline`, `tspan`, `multilineText`; `LineStyle.fillOpacity`,
`TextStyle.transform`; `svg-markers.ts#openArrowHeadDef`.

### Two real bugs the routing surfaced

1. **`text()` escaped text content with the ATTRIBUTE escaper** — emitting
   `&quot;` and `&gt;` where the jar emits raw `"` and `>`. Verified on the
   oracle jar: text content entity-encodes `&` and `<` ONLY. Split out
   `escapeXmlText`. The conformance harness could not see this because
   `normalize.ts` parses both forms to the same DOM text node — so it would
   have survived any number of golden re-baselines.
2. **`spansToTspan` emitted its content completely unescaped** — creole text
   containing `&` or `<` produced INVALID XML (`<tspan>a & b <c></tspan>`),
   and its `fill` bypassed `shortenColor`.

### Verification

Four gates green on two cold runs (563 files / 12612 tests);
`rebaseline-svg-goldens.ts` **CHANGED=0 FAILED=0** across 447 goldens, so
none of this moved jar-oracle output.

Test-expectation churn was all of one kind: assertions pinning the
*unrouted* rendering — raw named colors (`fill="red"`), lowercase or
unshortened hex (`#dc2626`, `#AABBCC`), and over-escaped `&gt;`. One of
them, json's `LineColor` test, passed only because the arrowhead marker was
the last site not shortening, while the test beside it already expected
`#ABC`.
