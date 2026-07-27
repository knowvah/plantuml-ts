# Component map — two lexers → one

## Today (the bug): two independent creole lexers

```mermaid
flowchart LR
  raw["raw display line"]
  subgraph SIZER["sizer (leaf-sizing.ts)"]
    cvt["creoleVisibleText"] --> pc["parseCreole<br/>(core/creole.ts)"]
    pc --> mlw["measureLineWithAtoms<br/>→ DOT box width"]
  end
  subgraph RENDER["renderer (EntityImageDescriptionSupport.ts)"]
    bl["buildLine"] --> bsa["buildStripeAtoms<br/>(StripeSimple.ts)"]
    bsa --> draw["drawn ink width"]
  end
  raw --> cvt
  raw --> bl
  pc -. "leaves &lt;b&gt;/&lt;u:blue&gt;/&lt;font Name&gt; LITERAL" .-> bad["box &gt; ink ❌"]
  bsa -. "STRIPS them" .-> draw
```

## After (T2): one shared helper, both paths agree

```mermaid
flowchart LR
  raw["raw display line"]
  helper["shared line→visible-atoms helper<br/>(StripeSimple.ts, ADR-1)"]
  raw --> helper
  helper --> cvt["creoleVisibleText<br/>(sizer) → measureLineWithAtoms"]
  helper --> bl["buildLine<br/>(renderer) → draw"]
  cvt --> box["DOT box width"]
  bl --> ink["drawn ink width"]
  box == "match ✅" === ink
```

## Untouched (do not disturb)

```mermaid
flowchart TD
  pc["parseCreole (core/creole.ts)"]
  pc --> ann["annotations/blocks.ts"]
  pc --> err["error-renderer.ts (parseCreoleSubset)"]
  note["Only leaf-sizing.ts#creoleVisibleText stops calling parseCreole.<br/>These callers keep it — STOP if the fix needs parseCreole changed."]
```
