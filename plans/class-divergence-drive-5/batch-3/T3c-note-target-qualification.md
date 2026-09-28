# T3c: note-target-qualification (9 rows)

Return only the structured report: commit sha, rows moved, and residuals with
mechanisms. No preamble, no trailing summary.

## Prior observations
S3 finding: `free-note-alias-not-quark-qualified` and `note-target-not-namespace-qualified` both resolve a note id without the namespace quark; reuse `class-namespace-resolve.ts#resolveReference` rather than a second resolver.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` (branch `dot-output`, upstream `97a5992`) is the specification.
Read the project `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value",
"Do not refactor while porting", "Preserve upstream names"). The oracle is the
1.2026.8beta1 jar. The cache is at `test-results/dot-cache/<tree>/<slug>/in.svg`.
Families in this task (from `diagnosis/families.md`; each row's own section in its
shard file has the first diff and any row-specific note):

### note-target-not-namespace-qualified
Mechanism: a `note … of X` inside a namespace keeps the bare target `X` while the class id is `ns.X`, so the note edge points at a non-node (our DOT: edge `__note_0 -> PragmaStringMultiTest`, dropped; jar 2 edges, ours 1) and the note loses its opale connector (hence also `path[2]@stroke-width` 1 vs 0.5: the non-opale corner is drawn un-stroked).
Upstream: `command/note/CommandFactoryNoteOnEntity.java:304` — "final Quark<Entity> quark = diagram.quarkInContext(true, idShort);"
Port: `src/diagrams/class/class-notes.ts:211-212,254` — "const resolvedHostId = stripQuotes(hostId);" … "target: resolvedHostId," (raw id, never qualified by `opts.namespace`)
(Diagnosed in `diagnosis/S2-edge.md`, example row `unknown/cejegu-93-kobo234`, confidence HIGH (instrumented: qualifying the target against the namespace closed all four rows).)

### free-note-alias-not-quark-qualified
Mechanism: a freestanding note's id is its bare alias, never resolved against the current group. Two `note as _n` in packages `x` and `y` both become id `_n`: one node in DOT (dotEqual false), package `y` ends up empty, and the survivor is drawn twice. Upstream `quarkInContext` makes them `x._n` and `y._n`.
Upstream: `command/note/CommandFactoryNote.java:192-197` — "final Quark<Entity> quark = diagram.quarkInContext(false, diagram.cleanId(idShort)); … return CommandExecutionResult.error(\"Note already created: \" + quark.getName()); … diagram.reallyCreateLeaf(location, quark, display, LeafType.NOTE, null);"
Port: `src/diagrams/class/class-notes.ts:280` — "const id = stripQuotes(alias);"
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/pojeje-60-vata579`, confidence HIGH (instrumented render + DOT).)

### freestanding-note-opale-group-endpoint
Mechanism: the other end of `decoder_core .. monolit` is a package (cluster), which has no SvekNode upstream, so `other == null` and the link is drawn plainly. The port gives the freestanding note that edge's spline as its opale connector anyway (instrumented: note geo `connector` = the 16-point `x=769` spline of the real edge). The renderer then draws both the real `lnk10` and a note-connector link with empty entity-1.
Upstream: `svek/GraphvizImageBuilder.java:245-251` — "if (isOpalisable(link.getEntity2())) { final SvekNode node = …getNode(link.getEntity2()); final SvekNode other = …getNode(link.getEntity1()); if (other != null) { ((EntityImageNote) node.getImage()).setOpaleLine(line, node, other); line.setOpale(true);"
Port: `src/diagrams/class/note-freestanding.ts:127-137` — "return findUniqueTouching(edges, noteIds, (e) => [e.from, e.to], () => false);" (candidate gate `:84` "if (fromIsNote === toIsNote) continue;" — nothing checks that the other end is a leaf)
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/cikifu-97-pasu472`, confidence HIGH (instrumented).)

## Task (TDD)
1. Write a failing unit test that pins the upstream behaviour at the lowest layer
   that shows it (parser, layout, or render helper). Assert specific values.
2. Port the upstream behaviour at the mechanism's origin (`rules/diagnosis.md`
   scope). Add a JSDoc `@see` to the Java `file:line` on every ported symbol, and an
   upstream citation on every constant.
3. Run `npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree/slug...>`
   on this task's rows. Report each row's structural/numeric counts before and
   after.
4. Gates in the worktree: targeted `npx vitest run <your test files>` (check the
   collected count), `npm run typecheck`, `npx eslint <changed files>`. The
   orchestrator runs the full suite after merge.

## Rows
- `unknown/cejegu-93-kobo234`
- `unknown/cikifu-97-pasu472`
- `unknown/muvici-42-dumo371`
- `unknown/pojeje-60-vata579`
- `unknown/rexupa-61-nezi165`
- `unknown/rilere-84-seba785`
- `unknown/tamovu-79-fifo533`
- `unknown/tenule-05-fovi294`
- `unknown/ticemi-41-laze086`

## Write-set
- `src/diagrams/class/class-namespace-resolve.ts`
- `src/diagrams/class/class-notes.ts`
- `src/diagrams/class/note-freestanding.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `net/sourceforge/plantuml/command/note/CommandFactoryNoteOnEntity.java:304`; `command/note/CommandFactoryNote.java:192-197`; `svek/GraphvizImageBuilder.java:245-251`
Port: `src/diagrams/class/class-notes.ts:211-212,254`; `src/diagrams/class/class-notes.ts:280`; `src/diagrams/class/note-freestanding.ts:127-137` (gate in `findUniqueTouching` `:79-94`)
`plans/class-divergence-drive-5/decisions.md#D5`; the shard sections for every row above.

## Architecture decisions (locked)
`plans/class-divergence-drive-5/decisions.md` D1–D9. dot-engine is off limits
(stop 11). Never sign an acceptance (D7).

## Interface contracts
none

## Acceptance
- Given each row above, when rendered via `renderSync`, then the element named in
  its first diff equals the jar's.
- Given the task's rows, then each is conformant, OR its residual is stated with a
  mechanism (Java and port `file:line`).
- Given the full suite (orchestrator), then all four gates are green and no ratchet
  pin is lost.

## Quality bar
90/90/90 coverage on changed files. Hook complexity limits (30 NLOC functions,
CCN 10, 500-line files).

## Boundaries
- Always: quote the Java before claiming parity.
- Ask first (halt): the write-set is insufficient, or the Java contradicts the
  diagnosis.
- Never: fit a value, edit `~/git/knowvah/dot-engine`, touch the oracle, or push.

## Commit
`fix(class): <what, lowercase, ≤72 chars>` (non-class paths: pick the scope that
fits, e.g. `fix(creole): …`). The body gives the mechanism, the upstream citation,
and the rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
