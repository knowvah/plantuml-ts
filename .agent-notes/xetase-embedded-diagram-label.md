# `xetase-70-zaza808` — an embedded diagram in an edge label

Diagnosed 2026-09-08. **No `src/` changed, deliberately** — the mechanism is
understood and the fix is disproportionate. Recommendation at the bottom.

## The fixture

```
@startuml
[*] --> LexTop
LexTop --> LexTop: {{
@enduml
```

The transition label is `{{` — `EmbeddedDiagram.EMBEDDED_START`
(`EmbeddedDiagram.java:77`), unterminated.

## Mechanism, with the arithmetic

| | box |
|---|---|
| jar (`svek-1.dot`) | **54x54** |
| ours | **20x25** |

Ours is the literal two characters: `≈8 + 2*6` wide, `13 + 2*6` tall, where 6
is the self-loop `marginLabel`.

The jar's decomposes exactly: `EmbeddedDiagram#calculateDimensionSlow`
(`EmbeddedDiagram.java:126-152`) tries to build and render the nested
diagram, throws on the unterminated input, and returns
`new XDimension2D(42, 42)` (`:152`). Then `42 + 2*6 = 54` on **both** axes.

**Every engine has this gap, not just state** — measured on synthetic
repros: a `{{` edge label reserves `10x15` in class, component and
non-self-loop state (`8 + 2*1`, `13 + 2*1`), and `20x25` on the self-loop.
The jar would reserve `44x44` and `54x54` respectively.

## Why this is NOT a small fix

`core/EmbeddedDiagram.ts:419` **already carries the 42x42 fallback**,
faithfully ported with its citation. The gap is not the constant — it is
that edge-label measurement never constructs an `EmbeddedDiagram` at all.

Constructing one needs `NestedDiagramRenderer`, this port's documented
callback seam (`EmbeddedDiagram.ts`, T10f). It is wired into
`CreoleParser` and `MethodsOrFieldsArea` — the paths that size element
BODIES, which is why the 25 corpus fixtures with well-formed `{{ … }}` in a
body are fine. Edge labels are measured as strings and never reach
`CreoleParser`, so the seam is not available there.

So a faithful fix means routing edge-label measurement through the creole
parser with a nested-diagram renderer — an architectural change across four
engines.

**The tempting shortcut is wrong.** Special-casing "label starts with `{{`
-> reserve 42x42" fits this fixture rather than porting the rule: 42x42 is
the EXCEPTION arm. A well-formed `{{ … }}` edge label should render an
actual sub-diagram and be sized from it, and the shortcut would silently
give it 42x42 too.

## Blast radius: one fixture

`xetase-70-zaza808` is the **only** fixture in the corpus with `{{` in an
edge-label position (`grep -rlE ":\s*\{\{"`). The other 24 use it in element
bodies, already handled.

## Recommendation: defer, tracked

One fixture, on an error path, against an architectural change to four
engines' label measurement. That is the "genuinely large AND separable"
deferral CLAUDE.md permits — and this note is the measurement that proves
it, rather than an effort excuse.

Take it as part of any future work that routes edge labels through a real
creole `TextBlock` (the Phase 4h creole track `edge-label-box.ts`'s own
header already names). At that point `xetase` should fall out for free, and
well-formed embedded diagrams in edge labels start working as a side effect.

Until then it stays `dotEqual: false` and in
`oracle/goldens/state/label-size-backlog.json`, which is honest: it does
fail `labelSizeOk`, and for a reason now written down.
