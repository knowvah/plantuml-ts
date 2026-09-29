# T3e: link-middle-decor-and-nested-renders

Return only the structured report: commit sha(s), files changed, per-row
render-diff structural/numeric before → after, residuals with mechanisms (Java +
port `file:line`), write-set extensions, test counts. No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(branch `dot-output`, upstream `97a5992`) is the specification. Read `CLAUDE.md`
first ("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting",
"Preserve upstream names"). The oracle is the 1.2026.8beta1 jar; caches at
`test-results/dot-cache/<tree>/<slug>/in.svg`. Row mechanisms: `fixtures.md`
(cdd5 + T0d columns) and `diagnosis/verify.md`.

## Task (TDD)
1. link middle decor (sejube): cdd5 S2 `link-middle-decor-partial`.
2. josebu (a) (amended at T0e from T0d, `diagnosis/verify.md` "nested renders —
   josebu"): the nested sequence image is 107x87 vs the jar's 92x162 because every
   sequence label drops any non-text atom to literal text —
   `src/diagrams/sequence/sequence-creole.ts:347-350` (`if (atoms.some((a) => a.kind
   !== 'text' && a.kind !== 'latex')) return [textAtomRun(literal)]`) — where the
   jar's `display.create0(..., CreoleMode.FULL)` (`AbstractTextualComponent.java:80-92`)
   yields an `AtomSprite` (`StripeSimple.java:228-235`). NOT
   `renderer-participant-symbol.ts` (the queue draws correctly around any block;
   probes: participant/queue/database/actor all fail identically). Port an
   image-carrying run (`latexAtomRun` / `TextRun.image` is the in-repo precedent) so
   the participant head grows to the sprite (jar 162 tall). This is sequence-wide:
   report every sequence-corpus mover with its mechanism (D7). If the change is
   wider than these three files, STOP and report `open -> cdd7` (sequence inline
   image runs) instead of editing further. josebu (b), the 1px degenerate canvas,
   is T2c's. tefeco's nested note (never opale in the description engine,
   `renderer-entity.ts:364-373`) is `open -> cdd7`, not this task's.

3. kexaba (b2 close, journal row 50; T2d's dot-engine attribution was DISPROVED by
   real dot — layout is identical, this is draw-side): a lone `<$sprite>` edge label
   is drawn as an `<image>` at the label box origin + marginLabel (1,1) where the jar
   draws it at +8,+8 (image 59.5,107 vs jar 66.5,114; box 19x14, `lp="68,127"`).
   Read `SvekEdge.java`'s label draw (`getLabelPosition`/`drawU` around :298-330) and
   `AtomSprite.java` / the creole `TextBlock` the label becomes, quote the offset's
   origin, and port it in `renderer-edge-label.ts` (T2d's `labelImage` arm).

## Rows
- `unknown/kexaba-26-kobu577` (edge-label-not-creole; lone-sprite image offset, row 50)
- `unknown/sejube-03-bote542` (link-middle-decor-partial)
- `unknown/josebu-55-seje426` (desc-embed-ink-missing → sequence label sprite atoms; (a) here, (b) T2c)

## Write-set
- `src/diagrams/class/class-layout-edge-labels.ts`
- `src/diagrams/class/class-edge-note-box.ts`
- `src/diagrams/class/renderer-arrowhead-middle.ts`
- `src/diagrams/class/renderer-edge-label.ts` (b2: kexaba)
- `src/diagrams/sequence/sequence-creole.ts` (T0e: replaces renderer-participant-symbol.ts)
- `src/diagrams/sequence/sequence-text.ts` (T0e)
- `src/diagrams/sequence/sequence-layout-participant-sizing.ts` (T0e)
- their unit tests under `tests/`

## Read-set
cdd5 journal row 72; `diagnosis/verify.md`.

## Interface contracts
none.

## Acceptance
- Given sejube, then it is conformant or its residual is stated.
- Given josebu and tefeco, then their nested images match the jar's size (or the residual is stated).
- Given the sequence and description ratchets, then movements are reported with mechanisms.
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D7. dot-engine is off limits.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the tests
covering changed modules plus: `tests/unit/class/`, `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`, `tests/oracle/class-dot-parity.test.ts`, `description.golden.ratchet.test.ts`, `state.golden.ratchet.test.ts`, `object.golden.ratchet.test.ts`, `sequence.diff-baseline.ratchet.test.ts`, `activity.diff-baseline.ratchet.test.ts`, `activity.style-baseline.test.ts`, `activity.text-baseline.test.ts` (non-class movement: report it with the mechanism, never re-pin) (report the collected file count). `npm run
typecheck`; `npx eslint <changed files>`. No full `npm test`. New src module ⇒
`npm run catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per
function, CCN ≤10, ≤5 params, ≤500-line files. Worktree rules: README "Execution
rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; cite `file:line` on every ported
  symbol (`@see`) and constant.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move), or Java that contradicts the stated mechanism.
- Never: fit a value, touch the oracle or dot-engine, push.

## Commit
`fix(<scope>): <what, lowercase, ≤72 chars>`, one per family; body with mechanism,
upstream citation, rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
