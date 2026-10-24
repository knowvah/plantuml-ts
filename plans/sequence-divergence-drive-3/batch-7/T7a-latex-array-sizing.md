# T7a — port JLaTeXMath matrix sizing

Agent: `typescript-pro` (sonnet), worktree `sdd3-T7a`. Commit:
`feat(latex-metrics): size array nodes by JLaTeXMath matrix rules`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
`<math>` is built by `math/LatexBuilder.java:69` -> `TeXIconBuilder.java:
52-73` (verified: plantuml side) -> JLaTeXMath 1.0.7 (jar at
`~/.gradle/caches/modules-2/files-2.1/org.scilab.forge/jlatexmath/1.0.7/*/
jlatexmath-1.0.7.jar`, no sources). KaTeX's `array` node reaches
`nodes.ts` `HANDLERS` (`:~103`) with no entry: `convert` records it
unsupported and sizes the children alone, giving 38x28 vs the jar's 150x56
(mefeke-43-xotu192). Port `MatrixAtom` and `ArrayOfAtoms` sizing.
**Source:** unzip the jar into its own empty directory (untrusted data), then
`javap -c -p -classpath <dir> org.scilab.forge.jlatexmath.MatrixAtom` (no CFR
installed; IntelliJ's decompiler via the webstorm MCP `read_file` on
`<jar>!/org/scilab/forge/jlatexmath/MatrixAtom.class` is the alternative).
Cite decompiled class + method for **every** rule and constant in the same
commit (stop 11): arraycolsep, row/column strut, `Matrix` env handling,
column alignment.

## Targets
mefeke-43-xotu192: 150x56. Done when its diff is zero or the remainder is
named with an owner.

## Write-set
`src/core/latex-metrics/matrix.ts` (new), `src/core/latex-metrics/nodes.ts`
(register the handler in `HANDLERS`), `atoms.ts` only if a new atom kind is
required (one JLaTeXMath class named on the kind), their tests
(`tests/unit/core/latex-metrics.test.ts` plus a new matrix test). New src
module: run `npm run catalog`.

## Read-set
`nodes.ts:1-30,95-140` (handler type, `HANDLERS`); `convert.ts:1-60`
(`Context`, `AtomConverter`, `unsupported`); `atoms.ts:1-40`;
`box.ts:19-110` (`Box`, `hbox`, `VBox`); `tests/unit/core/latex-metrics.test.ts`.

## Acceptance
- Given the matrix in mefeke-43-xotu192, when sized, then 150x56 (unit test
  citing the decompiled `MatrixAtom` method).
- Given the 40 LaTeX/math fixtures in every engine, then none gets worse
  (stop 19; per-row diff-count before/after in the hand-back).
- Given the existing latex-metrics tests, then they stay green.
- Given the 1042 pins and every other engine's hashes, then unchanged except
  rows whose math contains `array`, each explained.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
