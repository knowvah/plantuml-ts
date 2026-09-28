# T4b: classifier-declaration (13 rows)

Return only the structured report: commit sha, rows moved, and residuals with
mechanisms. No preamble, no trailing summary.

## Prior observations
zolaza is NOT in this task (see T5d). The visibility icon block must reuse `class-visibility-icon.ts` (member icons) — `VisibilityModifier#getUBlock`, one icon source.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` (branch `dot-output`, upstream `97a5992`) is the specification.
Read the project `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value",
"Do not refactor while porting", "Preserve upstream names"). The oracle is the
1.2026.8beta1 jar. The cache is at `test-results/dot-cache/<tree>/<slug>/in.svg`.
Families in this task (from `diagnosis/families.md`; each row's own section in its
shard file has the first diff and any row-specific note):

### entity-visibility-icon-dropped
Mechanism: the parser matches the leading `+` but throws it away, so the classifier AST has no visibility field (instrumented: AST keys = `id,display,kind,typeParams,members,creationIndex,styleGeneration`). The header never gets the icon block, and the name block is 11px narrower.
Upstream: `svek/image/EntityImageClassHeader.java:109-121` — "final VisibilityModifier modifier = entity.getVisibilityModifier(); … final TextBlock uBlock = TextBlockUtils.withMargin(modifier.getUBlock(getSkinParam().classAttributeIconSize(), fore, back, false), 0, 0, 4, 0); name = TextBlockUtils.mergeLR(uBlock, name, VerticalAlignment.CENTER);"; set at `classdiagram/command/CommandCreateClass.java:175,206` — "visibilityModifier = VisibilityModifier.getVisibilityModifier(visibilityString + \"FOO\", false); … entity.setVisibilityModifier(visibilityModifier);"
Port: `src/diagrams/class/class-declaration-parser.ts:156-157` — "group 1 = VISIBILITY_PREFIX's capture (discarded, see its own doc comment)"
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/Class-visibility-0`, confidence HIGH (instrumented).)

### package-header-multi-stereotype-truncated
Mechanism: A catch-all the port added after the stereotype slot lets the lazy stereotype capture end at the first `<<…>>`, so every later label is lost. AST: `ns.stereotype = "A"`/`"Foo"`.
Upstream: `stereo/StereotypePattern.java:66-67`: "new RegexLeaf(1, param, \"(\\\\<\\\\<.+?\\\\>\\\\>)\")". In `CommandPackage.java:88` nothing after STEREOTYPE can absorb a second `<<…>>`, so the lazy group widens to `<<A>><<B>>`.
Port: `src/diagrams/class/class-command-containers.ts:91`: "String.raw`\\s*(?:[#<][^{]*)?\\{(\\s*\\})?\\s*$`". The trailing `[#<]` catch-all swallows `<<B>>`, so the lazy `(<<.+?>>)` stops at `<<A>>`.
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/mupavi-50-fijo192`, confidence HIGH (AST instrumented).)

### parenthesis-element-code-as-display
Mechanism: The port reads every `() X as Y` as display-then-alias, so `theta` becomes the display and the quoted latex becomes the id (AST: `id:"<latex>\\theta</latex>", display:"theta"`). The latex markup therefore never reaches the label. After the fix, the residual is image bytes only: a permanent approved divergence (`DIVERGENCES.md:317-339`, KaTeX vs JLaTeXMath), so the fixed row should become `accept-candidate:latex-image-bytes`, not stay open.
Upstream: `descdiagram/command/CommandCreateElementParenthesis.java:94-104`, the third alternative: "new RegexLeaf(1, \"CODE3\", CommandCreateElementFull.CODE), ... new RegexLeaf(\"as\"), ... new RegexLeaf(1, \"DISPLAY3\", CommandCreateElementFull.DISPLAY)". `() theta as "<latex>…"` means code=`theta`, display=`<latex>\theta</latex>`.
Port: `src/diagrams/class/class-command-containers.ts:176-179`: "pattern: /^\\(\\)\\s+(?:\"([^\"]*)\"|(\\S+))(?:\\s+as\\s+(\\S+))?\\s*$/ ... ensureClassifier(state, match[3] ?? name, 'circle', name)". Only the `DISPLAY as CODE` reading exists.
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/sapofa-97-gizu737`, confidence HIGH (AST instrumented).)

### class-redeclare-mute-guard-missing
Mechanism: `foo <-- .bar` creates `bar` as a CLASS; `struct bar {` then may not mute CLASS→STRUCT upstream and the diagram errors, while the port re-kinds the classifier silently and renders.
Upstream: `classdiagram/command/CommandCreateClassMultilines.java:245-246` — "if (entity.muteToType(type, null) == false) return CommandExecutionResult.error(\"Cannot create \" + idShort + \" because it already exists\");"; `abel/Entity.java:219-223` — newType STRUCT is not in the mutable set, so "return false;"
Port: `src/diagrams/class/class-declaration-parser.ts:268` — "classifier.kind = decl.kind;" (unconditional)
(Diagnosed in `diagnosis/S2-edge.md`, example row `unknown/petiku-70-fogu777`, confidence MEDIUM (read, not instrumented).)

### descriptive-leaf-code-bracket-not-stripped (secondary on `unknown/zasuxe-15-lugo662`)
Mechanism: see the secondary rows (sections) in their shard files
Upstream: `classdiagram/command/CommandCreateElementFull2.java:249`; `StringUtils.java:86-90`
Port: `src/diagrams/class/class-declaration-parser.ts:167`
(Diagnosed in `diagnosis/S1-text.md`.)

### diamond-folded-into-association
Mechanism: `diamond X` was folded onto the `<>` association kind on the claim the two images are identical, but `EntityImageBranch` opens an entity group and `EntityImageAssociation` does not.
Upstream: `abel/LeafType.java:76-77` — "if (type.startsWith(\"DIAMOND\")) return LeafType.STATE_CHOICE;"; `svek/GeneralImageBuilder.java:151-152` → `EntityImageBranch`, whose `svek/image/EntityImageBranch.java:86-94` wraps the polygon: "group.put(UGroupType.CLASS, \"entity\"); … ug.startGroup(group); … ug.closeGroup();"
Port: `src/diagrams/class/class-declaration-parser.ts:147` — "if (rawKind === 'diamond') return { kind: 'association' };" and `renderer.ts:315-318` draws `association` unwrapped (correct only for `EntityImageAssociation`).
(Diagnosed in `diagnosis/S2-edge.md`, example row `unknown/gegosa-79-mini423`, confidence MEDIUM (read, not instrumented).)

### class-business-usecase-dropped
Mechanism: `usecase/` and `usecase` both collapse to `kind:'usecase'` with no business flag (instrumented AST). Sizing (`class-layout-leaf-shapes.ts:65`) and rendering (`renderer-usymbol-entity.ts:100`) therefore use plain `USymbolUsecase(false)` instead of the business variant, which is larger and has the slash line. The core `usecase-business` USymbol already exists (`src/core/descriptive-keywords.ts:44`).
Upstream: `classdiagram/command/CommandCreateElementFull2.java:236-237` — "} else if (symbol.equalsIgnoreCase(\"usecase/\")) { type = LeafType.USECASE_BUSINESS;"; `abel/Entity.java:412-413` — "if (getLeafType() == LeafType.USECASE_BUSINESS) return USymbols.USECASE_BUSINESS;"
Port: `src/diagrams/class/class-declaration-parser.ts:141` — "if (USECASE_LEAF_RE.test(rawKind)) return { kind: 'usecase' };"
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/xisora-84-faca166`, confidence HIGH (instrumented).)

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
- `unknown/Class-visibility-0`
- `unknown/Class-visibility-1`
- `unknown/Class-visibility-2`
- `unknown/Class-visibility-3`
- `unknown/Class-visibility-4`
- `unknown/Class-visibility-5`
- `unknown/gegosa-79-mini423`
- `unknown/mupavi-50-fijo192`
- `unknown/petiku-70-fogu777`
- `unknown/sapofa-97-gizu737`
- `unknown/taboco-79-pire192`
- `unknown/topave-65-ceso890`
- `unknown/xisora-84-faca166`

## Write-set
- `src/diagrams/class/class-classifier-ast.ts`
- `src/diagrams/class/class-cluster-header.ts`
- `src/diagrams/class/class-command-containers.ts`
- `src/diagrams/class/class-declaration-parser.ts`
- `src/diagrams/class/class-layout-header-geo.ts`
- `src/diagrams/class/class-layout-leaf-shapes.ts`
- `src/diagrams/class/class-visibility-icon.ts`
- `src/diagrams/class/renderer-assoc-lollipop.ts`
- `src/diagrams/class/renderer-classifier-box.ts`
- `src/diagrams/class/renderer-classifier-header-split.ts`
- `src/diagrams/class/renderer-usymbol-entity.ts`
- `src/diagrams/class/renderer.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `svek/image/EntityImageClassHeader.java:109-121`; `svek/ClusterHeader.java:130-139`; `classdiagram/command/CommandCreateClass.java:172-206`; `command/CommandPackage.java:189-192`; `stereo/StereotypePattern.java:66-67`; `command/CommandPackage.java:88`; `descdiagram/command/CommandCreateElementParenthesis.java:94-104`; `net/sourceforge/plantuml/classdiagram/command/CommandCreateClassMultilines.java:245-246`; `abel/Entity.java:209-224`; `classdiagram/command/CommandCreateElementFull2.java:249`; `StringUtils.java:86-90`; `net/sourceforge/plantuml/abel/LeafType.java:76-77`; `svek/GeneralImageBuilder.java:151-152`; `svek/image/EntityImageBranch.java:86-94`; `classdiagram/command/CommandCreateElementFull2.java:236-237`; `abel/Entity.java:412-413`
Port: `src/diagrams/class/class-declaration-parser.ts:83,156-157`; `src/diagrams/class/class-command-containers.ts:68-73`; `src/diagrams/class/class-command-containers.ts:91`; `src/diagrams/class/class-command-containers.ts:176-179`; `src/diagrams/class/class-declaration-parser.ts:268`; `src/diagrams/class/class-declaration-parser.ts:167`; `src/diagrams/class/class-declaration-parser.ts:147`; `renderer.ts:315-318`; `src/diagrams/class/class-declaration-parser.ts:141`
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
