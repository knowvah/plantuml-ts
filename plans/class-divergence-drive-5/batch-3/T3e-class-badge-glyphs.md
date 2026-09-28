# T3e: class-badge-glyphs (13 rows)

Return only the structured report: commit sha, rows moved, and residuals with
mechanisms. No preamble, no trailing summary.

## Prior observations
none beyond the per-row sections in the shard diagnosis files.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` (branch `dot-output`, upstream `97a5992`) is the specification.
Read the project `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value",
"Do not refactor while porting", "Preserve upstream names"). The oracle is the
1.2026.8beta1 jar. The cache is at `test-results/dot-cache/<tree>/<slug>/in.svg`.
Families in this task (from `diagnosis/families.md`; each row's own section in its
shard file has the first diff and any row-specific note):

### badge-glyph-letter-uncaptured
Mechanism: `<< (T,#FFAAAA) >>` asks for a `T` spot; the port's captured-outline table has no `T`, so it falls back to the kind letter `C`.
Upstream: `svek/image/EntityImageClassHeader.java:181-184` — "if (stereotype != null && stereotype.getCharacter() != 0) return new CircledCharacter(stereotype.getCharacter(), …"
Port: `src/diagrams/class/class-badge.ts:430-435` — "if (upper !== undefined && CAPTURED_BADGE_LETTERS.has(upper)) { return upper as BadgeLetter; } return badgeLetter(kind);"; `class-badge-glyph-data.ts:69-70` has no `T`/`H`.
(Diagnosed in `diagnosis/S2-edge.md`, example row `unknown/dedumo-33-paco879`, confidence HIGH (read; the fallback branch is the only path that yields C for a `(T,…)` stereotype).)

### badge-leaftype-spot-unported
Mechanism: The parser ported the dataclass/struct/exception/metaclass/stereotype kinds, but the badge still maps them to the class letter and fill. Upstream gives each LeafType its own circled character and `spot<Kind>` style.
Upstream: `svek/image/EntityImageClassHeader.java:221-222`: "case DATACLASS: return StyleSignatureBasic.of(SName.root, SName.element, SName.spot, SName.spotDataClass);" and `:253-254` "case DATACLASS: return 'D';"; `skin/plantuml.skin:267-269` "spotDataClass { BackgroundColor #7E57C2 }".
Port: `src/diagrams/class/class-badge.ts:309-332`: `badgeLetter` handles interface/abstract/enum/annotation/protocol/entity and otherwise "default: return 'C';". `badgeFill` (`:172`) has no dataclass entry. The AST is `kind:'dataclass'`.
(Diagnosed in `diagnosis/S1-text.md`, example row `unknown/doboco-09-doba683`, confidence MEDIUM (AST instrumented, badge read).)

### sprite-badge-headerlayout-offset
Mechanism: The sprite badge is pinned at the box's (4,5) corner. Upstream offsets the whole circled-character block by HeaderLayout's `xCircle = h1` (spare header width) and `yCircle`. Foo's wide body gives h1 = 28.781. Foo2 (h1=0, yCircle=0) matches by coincidence, as did the rotisi-30 fixture cited in the port comment.
Upstream: `svek/HeaderLayout.java:93-100` — "final double h2 = Math.min(circleDim.getWidth() / 4, suppWith * 0.1); final double h1 = (suppWith - h2) / 2; ... final double xCircle = h1; final double yCircle = (height - circleDim.getHeight()) / 2;" and `EntityImageClassHeader.java:159` "withMargin(getCircledCharacter(...), 4, 0, 5, 5)"
Port: `src/diagrams/class/renderer-classifier-badge-tag.ts:171-177` — "return image(geo.x + BADGE_LEFT_MARGIN * k, geo.y + BADGE_SPRITE_TOP_MARGIN * k, ...)"
(Diagnosed in `diagnosis/S4-style.md`, example row `unknown/jajebe-95-jomo899`, confidence HIGH (reproduced arithmetically against tivezu: h1=1.4755, yCircle=2 → x=12.4755, y=14 exact).)

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
- `unknown/dedumo-33-paco879`
- `unknown/doboco-09-doba683`
- `unknown/fepoko-61-fona364`
- `unknown/girapu-90-pise235`
- `unknown/jajebe-95-jomo899`
- `unknown/jodasa-29-zara935`
- `unknown/kexaba-26-kobu577`
- `unknown/punofe-33-loji825`
- `unknown/regodu-14-peve499`
- `unknown/rexobo-28-rite508`
- `unknown/tivezu-91-bevu722`
- `unknown/xusuxi-66-zaci221`
- `unknown/zelura-55-pasa982`

## Write-set
- `src/core/skinparam-element-buckets.ts`
- `src/diagrams/class/class-badge-glyph-data.ts`
- `src/diagrams/class/class-badge.ts`
- `src/diagrams/class/renderer-classifier-badge-tag.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `net/sourceforge/plantuml/svek/image/EntityImageClassHeader.java:181-184`; `svek/image/EntityImageClassHeader.java:166-195,197-261`; `skin/plantuml.skin:239-273`; `svek/HeaderLayout.java:93-100`; `svek/image/EntityImageClassHeader.java:159`
Port: `src/diagrams/class/class-badge.ts:430-435`, `class-badge-glyph-data.ts:69-70`; `src/diagrams/class/class-badge.ts:309-332` (letter), `:172` (fill); `src/diagrams/class/renderer-classifier-badge-tag.ts:166-177`
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
