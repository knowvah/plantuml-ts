# T5e: class ink and layout residuals (9 rows; generated at close-b4)

Return only the structured report: commit sha, rows moved, and residuals with
mechanisms. No preamble, no trailing summary.

## Prior observations
Residuals left by batch 4, each with a measured mechanism (journal rows 72–76, 78;
`.agent-notes/cdd5-T4a-circle-interface-ink-gap.md`, `.agent-notes/cdd5-T4d.md`,
`.agent-notes/cdd5-T4b.md`).

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` (branch `dot-output`, upstream `97a5992`) is the specification.
Read the project `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value",
"Do not refactor while porting", "Preserve upstream names"). The oracle is the
1.2026.8beta1 jar. The cache is at `test-results/dot-cache/<tree>/<slug>/in.svg`.

### desc-embed-ink-missing (gubeca, josebu, rojida, tefeco)
Mechanism: T4d draws a description label's `{{ }}` embed, but the canvas ignores it.
Upstream: `klimt/drawing/svg/SvgGraphics.java:981-982` — `svgImage` calls `ensureVisible(x + width, y + height)`.
Port: `src/diagrams/class/class-ink-box.ts:161-168` adds embed ink only for class-body embeds (`drawnEnhancedBodyEmbeds`); the analog is `addEmbedImageInk` (`class-ink-shapes.ts:242`). Each row keeps a further residual after this (see fixtures.md); report them.

### circle-interface-ink-y (rupigu, vabobu)
Mechanism: `measureCircleInterfaceInk` (`src/diagrams/class/class-layout-leaf-shapes.ts:273-286`) overshoots the drawn text baseline's maxY by ~1.5px (height 46 vs 44); X is exact. Ruled out: stroke, roundCorner, font, HIDE_TEXT_SPACE, buildDesc. Instrument the sizing call vs the draw call; suspected `BodyFactory.create3` line-height math.

### class-line-merge-bracket (jixibu)
Upstream: `BlocLines.java:358-369` `eventuallyMoveBracket` merges ONLY line 2 into line 1 (called from `CommandMultilines2.java:92,115`).
Port: `src/diagrams/class/class-line-merge.ts:62-70` merges every standalone `{` into the previous line, so `{{json` + `{` becomes `{{json {`.

### redeclare-refusal-line (petiku)
Upstream: `PSystemError.java:102-104` `getLineLocation() { return getLastLine().getLocation(); }` — the block's closing `}`.
Port: the refusal is raised at the opener (`class-declaration-parser.ts#refuseFailedMute`); `parser.ts#handlePendingBodyLine` consumes the `}`. Raise the refusal deferred, when the body closes.

### classAttributeIconSize in the header (no row)
`class-layout-generic-classifier.ts#buildHeaderAndStereoGeo` has `options.classAttributeIconSize` but does not pass it to `computeHeaderNameGeo` (T4b note), so `skinparam classAttributeIconSize N` with `+class A` mis-sizes the header. Upstream: `EntityImageClassHeader.java:109-121` uses `getSkinParam().classAttributeIconSize()`. Add a test with an oracle render.

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

## Added at close-b3 (journal row 66)
- `free-note-alias-not-quark-qualified` (moved from T3c, 4 rows): `unknown/pojeje-60-vata579`, `unknown/rexupa-61-nezi165`, `unknown/tamovu-79-fifo533`, `unknown/ticemi-41-laze086`. Upstream `CommandFactoryNote.java:192-197` resolves the alias with `quarkInContext(false, cleanId(idShort))`. T3c measured that qualifying ONLY the note id (class-notes.ts#addFreestandingNote) breaks 8 ratchet pins: the relationship-endpoint matcher (`class-command-relationships.ts` isNoteId callers, `class-assoc-couple.ts`) compares raw strings, misses the note, and auto-creates a phantom classifier that shifts every later uid. Fix both sides together through `class-namespace-resolve.ts#resolveReference`. See `.agent-notes/cdd5-T3c-note-alias-qualification-blocked.md`.

## Rows
- `unknown/gubeca-19-lemu434`
- `unknown/josebu-55-seje426`
- `unknown/rojida-14-fuli428`
- `unknown/tefeco-12-rato895`
- `unknown/rupigu-89-xabo757`
- `unknown/vabobu-24-temi990`
- `unknown/jixibu-01-xave465`
- `unknown/petiku-70-fogu777`

## Write-set
- `src/diagrams/class/class-ink-box.ts`
- `src/diagrams/class/class-ink-shapes.ts`
- `src/diagrams/class/class-layout-leaf-shapes.ts`
- `src/diagrams/class/class-line-merge.ts`
- `src/diagrams/class/parser.ts`
- `src/diagrams/class/class-declaration-parser.ts`
- `src/diagrams/class/class-layout-generic-classifier.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
The Java and port lines above; `fixtures.md` rows; `decisions.md#D5`.

## Architecture decisions (locked)
`plans/class-divergence-drive-5/decisions.md` D1–D9. dot-engine is off limits
(stop 11). Never sign an acceptance (D7).

## Interface contracts
none

## Acceptance
- Given each row, when rendered via `renderSync`, then the element named in its
  first diff equals the jar's, or its residual is stated with a mechanism.
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
`fix(class): <what, lowercase, ≤72 chars>` per family. The body gives the
mechanism, the upstream citation, and the rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
