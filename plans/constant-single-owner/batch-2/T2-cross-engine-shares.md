# T2 — give each cited cross-engine constant a single owner

## Context

Read `plans/constant-single-owner/README.md` and `decisions.md` first, and
`src/core/svek/SvekResult.ts` — the worked example this task repeats.

`.agent-notes/constant-inventory.md` (T1) is the work-list. Take its
`share` rows, highest redundant-count first.

## Task

For each `share` row:

1. **Re-verify the origin.** Open the Java at the cited `file:line` and
   confirm it is ONE field that all the listed sites read. T1's citation is
   a strong lead, not a licence to skip the read — this is the step that
   distinguishes a share from a coincidence, and it is the whole mission.
2. Create (or extend) the owner module under `src/core/`, mirroring the
   upstream package and filename (decision D1). Its doc comment carries the
   Java quote or `file:line`, and says which engines read it.
3. Replace each duplicate with an import.
4. Where a module previously EXPORTED the constant, re-export from the owner
   so existing consumers are unaffected — `class-ink-box.ts` did exactly
   that for `INK_DELTA`/`JAR_INK_MARGIN`.
5. If the declaration carried a comment explaining the value, that comment
   moves to the owner. Do not leave the explanation behind at a site that no
   longer declares anything.

**If the re-read shows N upstream fields rather than one, do not
consolidate.** Reclassify the row to `coincidence` in the note, with what
you found. A row that flips from share to coincidence is a good outcome and
must be recorded, not quietly skipped.

Watch for stale cross-references while you work: the `SvekResult` case had
one comment pointing at a file that did not exist. Any comment naming a
sibling copy is dead the moment the copy goes — fix or delete it.

## Read-set

- `.agent-notes/constant-inventory.md` — the work-list.
- `src/core/svek/SvekResult.ts` — the pattern.
- `src/diagrams/class/class-ink-box.ts` — the re-export pattern.
- `~/git/plantuml/src/main/java/net/` — every cited origin. Grep all of
  `net/`, not just `net/sourceforge/plantuml/`.
- `~/git/plantuml/.../net/atmp/CucaDiagram.java` — the shared base for
  class/object/state/component/usecase, and the likely origin of several of
  these.

## Write-set

- New modules under `src/core/**` (one per upstream file)
- The engine modules that currently declare the consolidated constants

`activity/` and `activity/tiles/` are **Batch 3's** — do not touch them here.

## Acceptance criteria

1. Given each consolidated constant, when its owner module is read, then it
   carries a Java `file:line` and names the engines that read it.
2. Given `shape-match-report.ts`, when run, then **776 / 25695 exactly** —
   byte-identical output. This is the acceptance criterion that matters most.
3. Given the inventory harness, when re-run, then the redundant-declaration
   count is strictly lower and no new duplicate name appears.
4. Given any row that could not be verified as one upstream field, when the
   note is read, then it is reclassified with the evidence, not silently
   left alone.
5. Given `grep -rn "const <NAME> = " src/`, for each consolidated name, then
   exactly one declaration remains.
6. Given the whole suite, then no test expectation needed changing. A test
   that has to move means behaviour moved.

## Quality bar

All four gates exit 0. Coverage 90/90/90 holds (these are declarations, so
coverage should be unaffected — if it moves, something else changed).
Complexity hook caps apply to any owner module.

## Boundaries

- **Always:** read the Java before consolidating; one commit per owner.
- **Ask first:** a consolidation that would need an engine-to-engine import
  (decision D6 forbids it — the answer is a `src/core/` owner or nothing);
  anything touching `HACK_X_FOR_POLYGON` (decision D5).
- **Never:** run a git command. Never consolidate on equal values alone.
  Never create `src/core/constants.ts`.
