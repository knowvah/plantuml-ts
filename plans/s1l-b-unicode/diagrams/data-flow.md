# Data flow — display decode/split pipeline

## The bug (today): decode before split → over-split

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[raw display\naaa] as raw
[finalizeDisplay:\nresolveNewlineEscapes\nthen resolveTextEscapes] as fd
[U+000A decoded to '\n'\nBEFORE split] as dec
[node.display =\n'aaa \n bbb'] as disp
[sizer/renderer\nsplit on '\n'] as split
[2 lines ❌\n(oracle: 1 line)] as bad

raw --> fd
fd --> dec
dec --> disp
disp --> split
split --> bad
@enduml
```

## The fix (T1, ADR-1): split first, decode per-line → inline

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[raw display\naaa] as raw
[finalizeDisplay:\nresolveNewlineEscapes ONLY\n(no codepoint decode)] as fd
[node.display =\n'aaa] as disp
[sizer/renderer\nsplit on '\n' (none here)] as split
[1 line:\n'aaa] as line
[per-line decode\n(resolveTextEscapes)] as perline
['aaa \n bbb' measured\nas 1 line ✅\n(inline '\n' ~0 width)] as good

raw --> fd
fd --> disp
disp --> split
split --> line
line --> perline
perline --> good
@enduml
```

## Split rule (Rule 1, confirmed)

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[display line] as d
[LINE BREAK\n(Display.getWithNewlines)] as brk
[INLINE char\n(AtomText.manageSpecialChars,\nper-atom, post-split)] as inl

d --> brk : backslash \n / \r / \l\n%newline()
d --> inl : U+XXXX / &#NNN;
@enduml
```

## Component map (files touched)

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "Batch 1 — decode-ordering" {
  [parse-helpers-strings.ts\nfinalizeDisplay] as phs
  [leaf-sizing.ts\nmaxLineWidth/textBlockHeight] as ls
  [EntityImageDescriptionSupport.ts\nbuildTextBlock] as btb
}

package "Batch 2 — quoted-title" {
  [parser.ts / EntityImageDescription.ts\n(per finding) OR ledger] as parser
}

package "Batch 3 — emoji width" {
  [measurer.ts (per finding)\nOR ledger] as meas
}

phs --> ls
phs --> btb
ls ..> btb : sync invariant
@enduml
```
