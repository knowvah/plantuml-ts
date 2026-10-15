# T1b — cluster-box diagnosis (read-only, D6)

**Agent:** `debugger`, read-only. Use Read/Grep/Glob/Bash only: no Write/Edit, no Serena edit tools.
Prepend [../task-preamble.md](../task-preamble.md), then disregard its commit and worktree sections.
Do not write to `<worktree>/T1b-report.md`; return the report in your reply instead, and the
orchestrator writes it to `measurements/T1b-diagnosis.md`.

## Context
The drawn package/group box does not match the jar's even when layout is equal.
- bamami (unknown/bamami-10-lava790): the jar's box is 81 tall, which equals cluster6's layout bb
  16.07..97.07. Ours is 62.
- zosuje (component/zosuje-43-zebi775) sits at 20/180 with layout equal.
- juvose (unknown/juvose-99-mopu040) uses `skinparam packagestyle node`, but
  `src/core/theme.ts:169` models `packageStyle?: 'rect'` only.
- Census families: rect x/y/w/h reaches 81/73/53/47 component rows, and path d 84.

Before anything else, read `measurements/tracker-ledger.md` (T0b) and `decisions.md` D8. TRACKER
#14 is the trap: titles draw at `USymbolFolder.java:228` `UTranslate(4, 2)`, never at the engine's
`cluster.label`.

## Task
1. Read the Java that draws a description group:
   - `svek/Cluster.java` `drawU` (from `:298`)
   - the `USymbol*` symbol `drawU`s (folder, node, rectangle, frame, cloud, database)
   - where the cluster's `minX/minY/maxX/maxY` come from (`Cluster.setPosition`, `SvekResult`/
     `GeneralImageBuilder`)
   Quote each with `file:line`.
2. Trace ours: `src/diagrams/description/renderer-cluster.ts` and `layout.ts` (where the drawn
   rect comes from: the layout bb of which wrapper? `p0`? base? `i`?), plus
   `frontier-cluster-bbox.ts` and `layout-geo-post.ts`.
3. Instrument and do not guess. For bamami, zosuje and juvose, plus 3 rows from the census rect
   family that you pick by `--families`, print the jar cluster bb from `svek-1.dot` laid out by
   native `dot -Tdot`, our layout bb for each wrapper level, and the drawn rect in both SVGs.
4. Produce a diagnosis artifact per mechanism: mechanism, origin `file:line` (Java + port), causal
   chain, ruled out. Map each to the census rows it explains: run the census `--per-fixture` and
   name the rows.
5. State whether the origin is in description files or in core (D5), and which files the T2
   fixer's write-set needs.

## Output
1. One artifact block per mechanism.
2. A table `| mechanism | rows explained (count + list) | origin | fixer write-set |`.
3. The D8 check result per fixture: native vs dot-engine, equal or not.

## Acceptance
- Given bamami, then the artifact names which bb the jar draws and which one we draw, with the
  `file:line` where our choice is made.
- Given the rect family, then every row is either assigned to a mechanism or listed as unexplained.

**Observability:** N/A. **Rollback:** Reversible (no code).
