# Data flow — the registration chain

## Today: authored fixtures cannot reach the ratchet

```mermaid
flowchart TD
  M["tests/visual/data/&lt;type&gt;.json<br/>committed · 351 usecase"] --> LF["loadFixtures(type)"]
  A["oracle/goldens/svg-description/&lt;type&gt;/&lt;slug&gt;/<br/>in.puml + golden.svg"] -. "never enters" .-> LF
  LF --> CAN["ensureCanonical → generateCanonical<br/>test-results/visual-qa-svg/canonical/"]
  CAN --> TAG["taggedSlugs(type, tag)"]
  LF --> BA["buildAgg"]
  TAG --> BA
  BA -->|"!slugs.has(slug) → continue<br/><b>silently</b>"| DROP(["dropped"])
  BA --> CACHE["test-results/dot-cache/&lt;type&gt;/&lt;slug&gt;/<br/>.done · in.puml · in.svg · svek-N.dot"]
  CACHE --> SUR["svg-parity-survey.ts"]
  SUR --> PJ["parity.json<br/>committed · 355 rows"]
  PJ --> AC3{"ratchet AC3<br/>dotEqual === true?"}
  AC3 -->|"no row exists"| BLOCK(["BLOCKED forever"])

  style DROP fill:#fdd,stroke:#c00
  style BLOCK fill:#fdd,stroke:#c00
```

Two independent failures, and the second is the reason this mission is not a
one-line change:

1. **`loadFixtures` never sees authored fixtures** — no cache entry, no
   parity row, AC3 blocks them permanently.
2. **Even once enumerated, `buildAgg` drops them silently** — they have no
   canonical SVG, so `taggedSlugs` omits them, so
   `if (!slugs.has(f.slug)) continue` discards them with no output at all.

## After: enumeration plus per-slug canonical freshness

```mermaid
flowchart TD
  M["tests/visual/data/&lt;type&gt;.json"] --> LF["loadFixtures(type)<br/><b>T1: merge + dedup by slug</b>"]
  A["oracle/goldens/svg-description/&lt;type&gt;/*/in.puml<br/><b>single source of truth</b>"] --> LF
  LF --> CAN["ensureCanonical<br/><b>T1: regenerate if ANY fixture<br/>lacks a canonical</b>"]
  CAN --> TAG["taggedSlugs(type, tag)<br/>usecase → DESCRIPTION"]
  LF --> BA["buildAgg<br/><b>T1: skips reported on stderr</b>"]
  TAG --> BA
  BA --> CACHE["dot-cache gains<br/>sprite-svg-{bootstrap,archimate,multiline}-0"]
  CACHE --> SUR["svg-parity-survey.ts<br/><b>T2: usecase only</b>"]
  SUR --> PJ["parity.json<br/><b>+3 rows, dotEqual: true</b>"]
  PJ --> AC3{"ratchet AC3"}
  AC3 -->|"eligible"| RJ["<b>T3: ratchet.json</b><br/>measured, then pinned"]

  style RJ fill:#dfd,stroke:#0a0
```

## The measurement contract — read this before comparing anything

The ratchet does **not** compare raw bytes.

```mermaid
flowchart LR
  O["ours (renderFixture<br/>+ DeterministicMeasurer)"] --> N1["normalizeSvg"]
  J["jar golden.svg"] --> N2["normalizeSvg"]
  N1 --> C["compareSvg(…, 'deterministic')<br/>tolerance 0.01"]
  N2 --> C
  C --> V{"diffs.length === 0"}

  N1 -. "strips every data-* attribute<br/>rounds numerics" .-> N1
```

Measuring with `===` reports differences the gate does not care about —
`data-source-line`, 4th-decimal coordinates — and invents blockers that do
not exist. This cost the predecessor mission real time. Always
`compareSvg(ours, jar, 'deterministic')`.
