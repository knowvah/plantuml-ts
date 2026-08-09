# Observation: sequence-diagram grouping constructs render the WHOLE diagram empty

> **FIXED 2026-08-01.** Root cause was routing, not the sequence engine:
> `/^end\s*$/i` was in `ACTIVITY_ACCEPTS_PATTERNS`, and `activityPlugin` is
> registered before `sequencePlugin`, so the activity engine claimed any
> sequence diagram containing a group. Pattern removed; a second defect it
> had been hiding (the `else` handler capturing its condition and discarding
> it) fixed alongside. Guard: `tests/unit/sequence/group-routing.test.ts`.
> The diagnosis below is retained as the authoritative mechanism.
>
> **Filed as https://github.com/sseely/plantuml-ts/issues/25** (2026-08-03) —
> that issue is now the durable home; this file is gitignored and local.
> The still-open part is the MISSING sequence oracle corpus, not the bug.
> `par`/`critical`/`break`, listed below as unmeasured, were measured on
> 2026-08-03 and are covered by the same root cause — all seven constructs
> plus nesting render.

- **Context**: Converting the SI10 mission brief's diagrams from Mermaid to
  PlantUML (CLAUDE.md § Diagrams, added 2026-08-01). Found by dogfooding —
  rendering our own brief through our own library.

- **Finding**: Any sequence-diagram grouping construct — `alt`/`else`, `opt`,
  `loop`, `group` — causes the ENTIRE diagram to render with **zero text
  content**. Not just the group: participants, unrelated messages and notes
  outside the group all disappear too. There is **no error card and no
  throw** — `renderSync` returns a well-formed, contentless SVG (~2,667 bytes
  vs ~4,003 for the same diagram with the group removed).

  Minimal repro:

  ```
  @startuml
  participant A
  participant B
  A -> B : ask
  alt first case
    B --> A : yes
  else other case
    B --> A : no
  end
  @enduml
  ```

  | source | plantuml-ts text runs | jar |
  |---|---|---|
  | plain sequence, no group | 6 | renders |
  | `alt`/`else` | **0** | **renders, 5,134 B** |
  | `opt` | **0** | — |
  | `loop` | **0** | — |
  | `group` | **0** | — |

  The pinned oracle jar renders the identical `alt` source correctly:
  `java -DPLANTUML_DETERMINISTIC_TEXT=true -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> v-b.puml`
  yields `A | A | B | B | ask | alt | [first case] | yes | [other case] | no`.
  So this is a **port gap, not invalid syntax**.

- **Impact**: Sequence diagrams are one of the most-used PlantUML diagram
  types and `alt`/`else` is among its most-used constructs, so this is likely
  to be hit early by any real user. The silence is the dangerous part —
  same shape as the `svg-sprite-nanoparser` regression where sprites rendered
  as nothing while `npm test`, all goldens and the size-delta script stayed
  green. **Any check that only asks "did it error?" will pass this.** When
  verifying rendered output, assert on CONTENT (text-run count against
  declared participants), never on absence of an error card.

  Practical consequence for docs: diagrams in this repo must avoid grouping
  constructs until this is fixed. `plans/si10-usecase-actor-routing/diagrams/
  data-flow.md` carries an authoring note and an `alt`-free rewrite to
  restore once it is.

- **Not yet investigated**: whether the parser drops the group or the
  renderer drops the diagram; whether `par`/`critical`/`break` behave the
  same (only `alt`/`opt`/`loop`/`group` were measured); whether any existing
  corpus fixture covers this (no sequence golden was checked).

- **Confidence**: High — bisected from a 5-participant diagram down to a
  4-line minimal repro, and cross-checked against the pinned jar in both
  directions.
