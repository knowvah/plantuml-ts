# Data flow — display decode/split pipeline

## The bug (today): decode before split → over-split

```mermaid
flowchart LR
  raw["raw display<br/>aaa &lt;U+000A&gt; bbb"] --> fd["finalizeDisplay:<br/>resolveNewlineEscapes<br/>then resolveTextEscapes"]
  fd --> dec["&lt;U+000A&gt; decoded to '\n'<br/>BEFORE split"]
  dec --> disp["node.display =<br/>'aaa \n bbb'"]
  disp --> split["sizer/renderer<br/>split on '\n'"]
  split --> bad["2 lines ❌<br/>(oracle: 1 line)"]
```

## The fix (T1, ADR-1): split first, decode per-line → inline

```mermaid
flowchart LR
  raw["raw display<br/>aaa &lt;U+000A&gt; bbb"] --> fd["finalizeDisplay:<br/>resolveNewlineEscapes ONLY<br/>(no codepoint decode)"]
  fd --> disp["node.display =<br/>'aaa &lt;U+000A&gt; bbb'<br/>(raw token kept)"]
  disp --> split["sizer/renderer<br/>split on '\n' (none here)"]
  split --> line["1 line:<br/>'aaa &lt;U+000A&gt; bbb'"]
  line --> perline["per-line decode<br/>(resolveTextEscapes)"]
  perline --> good["'aaa \n bbb' measured<br/>as 1 line ✅<br/>(inline '\n' ~0 width)"]
```

## Split rule (Rule 1, confirmed)

```mermaid
flowchart TD
  d["display line"] -->|"backslash \n / \r / \l<br/>%newline()"| brk["LINE BREAK<br/>(Display.getWithNewlines)"]
  d -->|"&lt;U+XXXX&gt; / &amp;#NNN;"| inl["INLINE char<br/>(AtomText.manageSpecialChars,<br/>per-atom, post-split)"]
```

## Component map (files touched)

```mermaid
flowchart LR
  subgraph T1["Batch 1 — decode-ordering"]
    phs["parse-helpers-strings.ts<br/>finalizeDisplay"] --> ls["leaf-sizing.ts<br/>maxLineWidth/textBlockHeight"]
    phs --> btb["EntityImageDescriptionSupport.ts<br/>buildTextBlock"]
  end
  subgraph T2["Batch 2 — quoted-title"]
    parser["parser.ts / EntityImageDescription.ts<br/>(per finding) OR ledger"]
  end
  subgraph T3["Batch 3 — emoji width"]
    meas["measurer.ts (per finding)<br/>OR ledger"]
  end
  ls -. sync invariant .- btb
```
