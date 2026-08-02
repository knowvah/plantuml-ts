# Data flow — how a size gap appears, and how the audit closes it

## 1. How the recurring bug arises

```plantuml
@startuml
participant "theme / skinparam" as Theme
participant "RENDERER" as Rend
participant "ClassifyCtx → BoxSizingOpts" as Ctx
participant "SIZER (measureLeafNode)" as Size
participant "ratchet / DOT gate" as Gate
note over Theme,Rend : a feature lands (e.g. wrapWidth, per-element FontSize)
Theme -> Rend : renderer reads theme DIRECTLY
Theme ->x Ctx : nobody threads it into the sizer
Rend -> Rend : draws at the NEW geometry
Size -> Size : measures at the OLD geometry
Gate -> Gate : box ≠ ink → size delta, structure still EQUAL
note over Gate : shows up as ONE fixture in a bucket,\nnot as 'a feature is half-wired'
@enduml
```

That last note is the trap: the failure surfaces as a single mis-sized
fixture in whatever bucket the classifier guessed, so it gets fixed one
fixture at a time instead of once at the seam.

## 2. How this mission closes it

```plantuml
@startuml
participant "T1 classifier" as T1
participant "T2 composition audit" as T2
participant "T3 parity audit" as T3
participant "T4 probes" as T4
participant "T5 fitness fn" as T5
participant "Batch 4 fixes" as B4
T1 -> T1 : buckets stop lying (labels = hypotheses)
T2 -> T2 : read upstream symbol package → MISMATCH rows
T3 -> T3 : diff renderer vs sizer call sites → GAP rows
T4 -> T3 : jar-probe the undecided rows → verdicts + numbers
T3 -> T5 : size-neutral verdicts seed the allow-list
T5 -> T5 : CI fails on the NEXT resolver-shaped gap
T2 -> B4 : MISMATCH rows become tasks
T3 -> B4 : GAP rows become tasks
note over B4 : proven-by-fixture first, probe-backed filed (ADR-4)
@enduml
```

## 3. The verification loop each Batch-4 task runs

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[read upstream Java\n(mechanism)] as A
[jar probe\n(numbers)] as B
[derive the constant\nNEVER fit one] as C
[change the sizer] as D
[measure-description-size-deltas\nwidened MUST be 0] as E
[delete its pin\nSAME commit] as F
[STOP — diagnose,\ndo not re-baseline] as G

A --> B
B --> C
C --> D
D --> E
E --> F : a fixture flipped
E --> G : widened > 0
@enduml
```
