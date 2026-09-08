# The 7 label-size residuals — five defects, two that cannot be fixed

Diagnosis artifact, 2026-09-08. **No `src/` changed.** Each of the seven
fixtures failing `labelSizeOk` was measured (jar box vs ours) and reduced to
a mechanism with minimal repros. They are **not one defect**. They are five,
across four subsystems, plus two that are permanently out of reach.

## Measured: jar box vs ours

| fixture | jar | ours | mechanism |
|---|---|---|---|
| `sunuju-01-pote718` | `95x30` | `185x15` | **`<latex>` — PERMANENT** |
| `gevozu-46-sasu860` | `95x30` | `185x15` | **`<latex>` — PERMANENT** |
| `kafexo-72-xupa679` | `90x41` | `231x15` | `skinparam maxMessageSize` ignored |
| `vonago-16-zime449` | `126x33` | `224x15` | note-on-link body not wrapped |
| `nagega-30-poso418` | `43x15` | `157x15` | `<U+XXXX>` escape not expanded |
| `xamule-03-jeda376` | `91x32` | `104x15` | `<size:N>` not applied to HEIGHT |
| `berelu-46-namo819` | `108x15` | `126x15` | creole markers in the measured width |

## Two cannot be fixed, and should stop being counted as residuals

`sunuju-01-pote718` and `gevozu-46-sasu860` carry `<latex>` labels
(`<latex>\mbox{Loss}(f,g)</latex>`). `DIVERGENCES.md:317-339` records
"LaTeX rendering engine — KaTeX, not JLaTeXMath (permanent)",
maintainer-approved 2026-07-15: element structure is conformant, glyph
metrics never will be. **Any fixture carrying `<latex>` or `<math>` keeps a
permanent conformance floor.** Closing these would mean adopting
JLaTeXMath's metrics, which the divergence explicitly declines.

They belong in the backlog permanently, not as work items. Worth marking so
in `label-size-backlog.json` so the next reader does not re-derive this.

## The five real defects, with upstream read

**1. `skinparam maxMessageSize` is never parsed** (`kafexo-72-xupa679`).
The fixture sets `skinparam maxMessageSize 100`; the jar wraps the label to
3 lines (90x41), we render one 231px line. Upstream:
`SvekEdge.java:288-300` picks the wrap width —
`arrowStyle.wrapWidth() > 0 ? that : skinParam.maxMessageSize()` — and
`SkinParam.java:972-978` resolves `maxMessageSize()` from the
`wrapmessagewidth` skinparam, falling back to `maxmessagesize`.
Our `skinparam-key-handlers` table has **no entry for either key**, so the
value is dropped at parse time. Note the machinery downstream already
exists: `Display.create0` takes a `LineBreakStrategy` and
`core/klimt/LineBreakStrategy.ts` is ported. This is a parse + plumb gap,
the same half-ported shape `linetype` had — parsed one side, never
consumed on the other.
**Verified default:** no skin file defines `MaximumWidth`, and
`maxMessageSize()` with both keys unset is no-wrap, so this does NOT wrap
labels corpus-wide. Blast radius is fixtures that ask for it.

**2. `<U+XXXX>` escapes are not expanded** (`nagega-30-poso418`).
Repro: `<U+00AB>typedef<U+00BB>` measures **172x15**; the literal
`«typedef»` measures **59x15**. We measure the escape text itself.
Upstream has `StringUtils.manageUnicodeNotationUplus`
(`StringUtils.java:477-493`, pattern `\<U\+([0-9a-fA-F]{4,5})\>`) and a
second copy of the pattern in `SvgGraphics.java:1145`. Note upstream calls
the `StringUtils` one only from `SkinParam.java:1245` — **where the
measurement path picks it up needs one more read** before porting; do not
assume it is the creole parser.

**3. `<size:N>` scales width but not height** (`xamule-03-jeda376`).
Repro: `<size:30>to Foo` measures **91x15**; the jar's box is 91x**32**.
Width is already computed at the tag's size — only the height stays at the
base font size. A narrow fix in the edge-label height accumulation, not a
creole-parsing gap.

**4. Note-on-link bodies are not wrapped** (`vonago-16-zime449`).
`note on link: …` — jar 126x33 (2 lines), ours 224x15. No `maxMessageSize`
in this fixture, so the wrap comes from the note's own style cascade
(`EntityImageNote`'s `Style#wrapWidth`, already referenced in
`theme-graph-colors-b.ts`). Different path from defect 1 — do not assume
one fix closes both.

**5. Creole markers reach the measured width** (`berelu-46-namo819`).
Small deltas only (108 vs 126, 112 vs 129) on labels like
`> up arrow **missing**`. Two candidates not yet separated: the `**bold**`
markers being measured as literal characters, and the leading `>`
arrow-direction marker upstream strips. **Least diagnosed of the five** —
needs its own repro before anyone writes code.

## Recommendation

These are four unrelated subsystems (skinparam parse, unicode escapes,
creole size, note wrapping) plus one undiagnosed. Taking them as one "fix
the 7" change would produce a diff nobody can review against a single
mechanism. Suggest one scoped piece each, in this order — cheapest and
best-understood first:

1. `<size:N>` height (defect 3) — narrowest, mechanism fully understood.
2. `maxMessageSize` (defect 1) — exact upstream rule, machinery exists.
3. `<U+XXXX>` (defect 2) — needs one more upstream read first.
4. note-on-link wrap (defect 4).
5. `berelu` (defect 5) — diagnose before scoping.

And re-classify the two `<latex>` fixtures as permanent rather than
outstanding, so the residual count reads 5, not 7.
