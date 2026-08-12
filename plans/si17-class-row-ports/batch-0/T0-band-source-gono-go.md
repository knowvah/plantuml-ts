# T0 — which band source reproduces the oracle?

## Prior observations — established 2026-08-12, do NOT re-derive

- `.agent-notes/T8-member-ports-wrong-mechanism.md` — class `::member` ports
  currently reuse the **wrong** upstream mechanism (the PORTIN/PORTOUT
  `isPort`/`:P`/`portTable` path). Read it before starting; it names the
  detection site (`class-layout-helpers.ts`) and the test that asserts the
  wrong behavior today.
- The election + geometry algorithm is **already ported and faithful**:
  `src/core/cucadiagram/MethodsOrFieldsArea.ts:215-275`,
  `src/core/cucadiagram/BodyEnhanced1.ts:268`,
  `src/core/cucadiagram/Elected.ts`, `src/core/svek/Ports.ts`. It has zero
  callers from the class engine. **You are choosing how to feed it, not
  writing it.**
- `oracle-render.sh`'s out-dir **must be absolute** — PlantUML resolves a
  relative `-o` against the input file's directory and silently writes
  nowhere useful, exiting 0
  (`.agent-notes/si16-oracle-cache-recapture.md`).

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Object diagrams have no
separate engine — object/map/json commands are registered alongside the
class ones, so all of this lives in `src/diagrams/class/**`.

## Task

Decide [ADR-1](../decisions.md) by measurement. For each of the three
controls below, compute the port bands **both ways** and compare each
against the jar's own oracle DOT:

- **A — block tree:** drive `BodyEnhanced1#getPorts` →
  `MethodsOrFieldsArea#getPorts` and apply `EntityImageClass#getPorts`'s
  `.translateY(header height)`.
- **B — flat sizer:** derive bands from `MeasuredClassifier.rows` /
  `dividerYs` / `headerRowCount`, the way `mapPortRows` does.

Compare against the **`(int)`-truncated** values the jar actually emits —
`appendLabelHtmlSpecialForLink` truncates the filler height, the row height
and the trailer independently (`svek/SvekNode.java:269-296`), and
`appendTr` drops any row of height `<= 0` (`:298-311`). Comparing against
untruncated doubles will make both look wrong.

### Controls

| Slug | Why |
|---|---|
| `dekaba-54-fafi485` | Single port, one compartment. Oracle emits `PORT="pb718adec73e04ce3ec720dd11a06a308"`. The baseline. |
| a class with BOTH fields and methods | **The discriminating case.** Option B's frame and upstream's per-compartment `y` are not obviously the same once two `MethodsOrFieldsArea`s stack. Pick one from the backlog; `xefeme-77-fagu709` is a candidate. |
| `bicabi-42-coto932` | Zero-election control. Both sources must yield **no** bands. |

## Write-set

- `plans/si17-class-row-ports/decision-journal.md`

Throwaway probe scripts go in the session scratchpad, **not** the repo.
No production code changes in this task.

## Read-set

- `~/git/plantuml/.../svek/SvekNode.java:269-311` — read the method bodies.
- `~/git/plantuml/.../svek/image/EntityImageClass.java:247-259`
- `~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java:194-236`
- `src/core/cucadiagram/MethodsOrFieldsArea.ts:215-275`
- `src/diagrams/class/class-port-rows.ts:1-60` — `mapPortRows` and its doc
  comment, which explains why maps went the flat-sizer way.
- `src/diagrams/class/class-layout-helpers.ts:185-225` — `MeasuredClassifier`.
- `test-results/dot-cache/class/<slug>/svek-1.dot` for the three controls.

## Architecture decisions in force

[ADR-1](../decisions.md) (this task resolves it), ADR-3, ADR-4, ADR-5.

## Interface contract — consumed by T1

```jsonc
{
  "source": "block-tree",        // or "flat-sizer"
  "headerTranslate": 0.0,        // number: the y offset applied to body bands
  "bands": [                     // one entry per control fixture band
    { "slug": "string", "portId": "p<md5>", "position": 0, "height": 0 }
  ],
  "oracleBands": [ /* same shape, read from the .dot */ ],
  "multiCompartmentVerified": true
}
```

## Acceptance criteria

- Given `dekaba-54-fafi485`, when both sources are computed, then **exactly
  one** reproduces the oracle's `PORT="pb718adec73e04ce3ec720dd11a06a308"`
  row at its `(int)`-truncated position and height.
- Given a class with both fields and methods, when both are computed, then
  the winner from the previous criterion still matches.
- Given `bicabi-42-coto932`, when both are computed, then both yield zero
  elected bands, and the table is one filler row of the full node height.
- Given neither source reproduces the oracle on any control, then the task
  **STOPS** with both sets of numbers journalled. Picking the closer one is
  forbidden — that is fitting.

## Observability requirements

N/A — no new observable operations. This task *is* a measurement; its
output is the journal entry.

## Rollback

**Reversible.** Documentation only.

## Quality bar

Four gates green (they should be untouched — this task changes no code).
Every number in the journal is reproducible from a command recorded
alongside it.

## Boundaries

- **Always:** render oracles via `scripts/oracle-render.sh` with an
  ABSOLUTE out-dir; compare against `(int)`-truncated values.
- **Ask first:** anything that would change production code.
- **Never:** `git checkout/reset/stash/clean`; fit a value; pick the closer
  source when neither matches.

## Commit format

```
docs(T0): measure both class port-band sources against the jar
```
