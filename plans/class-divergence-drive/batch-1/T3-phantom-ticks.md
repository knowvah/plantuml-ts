# T3 — phantom uid slots: assoc-couple names, package endpoints, notes

**Agent:** typescript-pro (sonnet) · **Depends on:** T1

## Context

Three separate under-counting mechanisms, two HIGH and two MEDIUM
confidence — instrument the MEDIUM ones before touching code (diagnosis
mode, not a fix-on-sight):

- **SB3 (HIGH, 3 fixtures).** `(A,B) . (C,D)` consumes FOUR counter slots
  upstream: two `getUniqueSequence("apoint")` NAME ticks
  (`objectdiagram/AbstractClassOrObjectDiagram.java:120-121`) then two
  `reallyCreateLeaf` calls. This port models the two entities
  (`Classifier.noUidSlot`, `renderer-uid.ts:344-395`) but never stamps the
  two name ticks, so every uid after a couple is short by exactly 2.
  `pibifa-14-leno075`: jar `apoint6`/`apoint7` → entities 8/9 → `lnk10`;
  ours emits `lnk6`.
- **SB4 (MEDIUM, 2 fixtures).** `p1 -> p2`, both packages: upstream's
  `quarkInContextSafe` (`atmp/CucaDiagram.java:249-286`) returns the
  EXISTING group quark — no `Entity` ctor, no uid. `ensureClassifier`
  (`parser.ts:95-148`) auto-creates a phantom `Classifier` and bumps
  `state.creationCounter` at `:128` regardless. `nijeli-04-ponu844` is
  uid-identical through `lnk32`, then `+1` from the first cluster-endpoint
  link.
- **SB5 (MEDIUM, 3 fixtures).** A free note consumes ≥2 extra slots
  upstream: the generated name (`getUniqueSequence("GMN")`, `command/
  note/CommandFactoryNoteOnEntity.java:327`) and the note→host `Link`
  (`abel/Link.java:135`), atop the note `Entity` itself. This port numbers
  notes as a best-effort tail pass (`renderer-uid.ts:362-367`) accounting
  for none of this. `cejili-77-gepe377`: jar's surviving note is `GMN5` at
  `ent0006`, classifier `b` at `ent0008`; ours is `ent0003`/`ent0005` — a
  constant `+3`.

The report is a lead, not a proof, for SB4/SB5 (MEDIUM = Java read, TS
side traced by offset pattern, not instrumentation-confirmed). Do not
port either fix before instrumenting per step 1.

## Task

1. **Instrument SB4/SB5 before fixing.** Dump `state.creationCounter`
   transitions (temporary log, removed before commit) for
   `mujopi-30-zadi566`'s three `p1 -> p2`-style links; confirm the tick
   occurs inside the package-endpoint dispatch path in `ensureClassifier`,
   i.e. the phantom row is the one consuming the rank. Separately, render a
   minimal `class a / note right of a` fixture and diff the uid sequence
   slot-by-slot against a hand-computed jar expectation (GMN name tick,
   note entity, connector link) to pin down which slots `cejili`'s note
   machinery misses. Journal both results BEFORE writing the fix — a
   contradicted mechanism is stop 3 (halt, amend `decisions.md`).
2. TDD — tests first for all three sub-mechanisms, using the fixtures'
   exact expected uid sequences from the report and your own step-1
   instrumentation.
3. **SB3 fix:** in `class-assoc-couple.ts`, add two `phantomSlot` ranks
   (T1's collector pattern, per `.agent-notes/cdd-T1.md`, or
   `renderer-uid.ts`'s existing `noUidSlot`/phantom machinery if that's the
   better seam — read both before choosing) for the two `apoint` NAME
   ticks, consumed the same way the existing entity phantom slots are.
4. **SB4 fix:** in `ensureClassifier` (`parser.ts:95-148`), suppress the
   counter tick when the resolved reference is an EXISTING namespace/group
   quark rather than a genuinely new classifier (the phantom row is
   already discarded downstream — confirm that discard path still works
   once the tick is suppressed).
5. **SB5 fix:** thread `creationIndex` through `class-notes.ts`'s note
   construction and add phantom ranks for the `GMN` name tick and the
   note→host connector link, consumed by `renderer-uid.ts`'s tail pass
   (`:362-367`). Interacts with A1 SB6's note-connector ELEMENT gap
   (missing `<g class="link">`, bucket B9/ENT5) — fix uid consumption
   only, don't draw the missing connector; journal the interaction for
   whichever batch owns ENT5.
6. Re-run `render-all.mts`; every verdict change must be one of the 8 named
   slugs (`begico-70-guva302, besepi-37-rori892, pibifa-14-leno075` for
   SB3; `mujopi-30-zadi566, nijeli-04-ponu844` for SB4; `cejili-77-gepe377,
   labele-71-gudo044, zuxoxu-54-pejo512` for SB5).

## Read-set

`diagnosis/A1-order.md` SB3 (149-183), SB4 (186-212), SB5 (215-241)
sections, whole. Java: `~/git/plantuml/src/main/java/net/sourceforge/
plantuml/objectdiagram/AbstractClassOrObjectDiagram.java:118-131,226`;
`~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:249-286`;
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/note/
CommandFactoryNoteOnEntity.java:320-335`; `~/git/plantuml/src/main/java/
net/sourceforge/plantuml/abel/Link.java:130-140`. TS: `src/diagrams/
class/class-assoc-couple.ts` (whole doc comment + the two-entity
construction site); `src/diagrams/class/parser.ts:95-148`
(`ensureClassifier`, post-T1); `src/diagrams/class/class-notes.ts:1-40`
(note construction entry points); `src/diagrams/class/renderer-uid.ts:
320-395` (phantom/`noUidSlot` machinery, tail-pass note numbering).

## Write-set

`src/diagrams/class/class-assoc-couple.ts`, `src/diagrams/class/
parser.ts`, `src/diagrams/class/class-notes.ts`, `src/diagrams/class/
renderer-uid.ts`, their existing test files under `tests/unit/class/`,
`plans/class-divergence-drive/measurements/t3.json`,
`plans/class-divergence-drive/decision-journal.md` (instrumentation
findings AND the fix rows), `.agent-notes/cdd-T3.md`.

## Interface in (from T1)

T1's implicit-namespace-segment collector pattern
(`.agent-notes/cdd-T1.md`) — reuse its phantom-rank shape for SB3/SB5's
name/link ticks rather than inventing a second mechanism.

## Acceptance criteria

- Given the SB4/SB5 instrumentation step, when it completes, then the
  journal states which mechanism was CONFIRMED (matches the report) or
  DISPROVED (contradicts it) with the actual counter-transition evidence,
  before any fix code is written
- Given `pibifa-14-leno075`, when rendered, then the couple's first link is
  `lnk10` (was `lnk6`)
- Given `begico-70-guva302`, then its couple links are `lnk16..lnk20`
- Given `nijeli-04-ponu844`, then the offset is 0 after `lnk32` (was `+1`)
- Given `cejili-77-gepe377`, then the surviving note is `ent0006` and `b`
  is `ent0008`
- Given `render-all.mts`, then every verdict mover is one of the 8 named
  slugs

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the task's commit; no persisted state.

## Quality bar

Four gates green. `npx tsx ../tools/render-diff.mts pibifa-14-leno075
begico-70-guva302 nijeli-04-ponu844 cejili-77-gepe377 labele-71-gudo044
zuxoxu-54-pejo512` before/after pasted into the commit body. Complexity
hooks apply to every touched file.

## Boundaries

Always: instrument SB4/SB5 before writing their fix; journal the
instrumentation artifact even if it confirms the report exactly. Ask
first: any change to the ENT5 note-connector-element bucket (B9, out of
scope). Never: draw the missing note-connector element here (uid-only
fix); fit a uid offset without re-deriving it; rebuild the oracle cache
(D12).

## Commit

`fix(cdd-T3): add phantom uid slots for couples, package links, notes`

Body: names which of SB3/SB4/SB5 were confirmed vs. required a corrected
mechanism after instrumentation, with the `file:line` evidence.
