# Data flow — how a size gap appears, and how the audit closes it

## 1. How the recurring bug arises

```mermaid
sequenceDiagram
    participant Theme as theme / skinparam
    participant Rend as RENDERER
    participant Ctx as ClassifyCtx → BoxSizingOpts
    participant Size as SIZER (measureLeafNode)
    participant Gate as ratchet / DOT gate

    Note over Theme,Rend: a feature lands (e.g. wrapWidth, per-element FontSize)
    Theme->>Rend: renderer reads theme DIRECTLY
    Theme--xCtx: nobody threads it into the sizer
    Rend->>Rend: draws at the NEW geometry
    Size->>Size: measures at the OLD geometry
    Gate->>Gate: box ≠ ink → size delta, structure still EQUAL
    Note over Gate: shows up as ONE fixture in a bucket,<br/>not as "a feature is half-wired"
```

That last note is the trap: the failure surfaces as a single mis-sized
fixture in whatever bucket the classifier guessed, so it gets fixed one
fixture at a time instead of once at the seam.

## 2. How this mission closes it

```mermaid
sequenceDiagram
    participant T1 as T1 classifier
    participant T2 as T2 composition audit
    participant T3 as T3 parity audit
    participant T4 as T4 probes
    participant T5 as T5 fitness fn
    participant B4 as Batch 4 fixes

    T1->>T1: buckets stop lying (labels = hypotheses)
    T2->>T2: read upstream symbol package → MISMATCH rows
    T3->>T3: diff renderer vs sizer call sites → GAP rows
    T4->>T3: jar-probe the undecided rows → verdicts + numbers
    T3->>T5: size-neutral verdicts seed the allow-list
    T5->>T5: CI fails on the NEXT resolver-shaped gap
    T2->>B4: MISMATCH rows become tasks
    T3->>B4: GAP rows become tasks
    Note over B4: proven-by-fixture first, probe-backed filed (ADR-4)
```

## 3. The verification loop each Batch-4 task runs

```mermaid
graph LR
  A["read upstream Java<br/>(mechanism)"] --> B["jar probe<br/>(numbers)"]
  B --> C["derive the constant<br/>NEVER fit one"]
  C --> D["change the sizer"]
  D --> E["measure-description-size-deltas<br/>widened MUST be 0"]
  E -->|"a fixture flipped"| F["delete its pin<br/>SAME commit"]
  E -->|"widened > 0"| G["STOP — diagnose,<br/>do not re-baseline"]
```
