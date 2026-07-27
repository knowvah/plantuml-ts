# Data flow — spike-gated unification

## Execution sequence (T1 gates T2 gates T3)

```mermaid
flowchart TD
  T1["T1 spike:<br/>current vs stripe width,<br/>all 351 goldens"]
  gate{"shrinks + neutral<br/>dominate?<br/>(ADR-4)"}
  T2["T2 unify:<br/>shared helper +<br/>rewire sizer/renderer"]
  T3["T3 close:<br/>re-baseline pins +<br/>ledger + mission-index"]
  stop["STOP + log:<br/>widespread widening —<br/>reconsider"]
  T1 --> gate
  gate -- yes --> T2 --> T3
  gate -- "no" --> stop
```

## Per-line width, before vs after (node `bar`)

```mermaid
flowchart LR
  raw["'&lt;b&gt;this is also &lt;U+221E&gt; &lt;font Segoe UI Emoji&gt;&lt;U+1F680&gt;&lt;U+263A&gt;&lt;/font&gt; long'"]
  raw --> before["BEFORE (parseCreole):<br/>53 cps literal → ~333px ❌"]
  raw --> after["AFTER (buildStripeAtoms):<br/>'this is also ∞ 🚀☺ long'<br/>22 cps → ~147px == oracle ✅"]
```
