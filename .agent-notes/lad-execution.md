# lad (lengthadjust-document-wide) execution notes — 2026-10-23/24

## Observation: three sonnet agents returned a literal "placeholder" hand-back
- **Context**: lad T1a, T2c, T2e (typescript-pro, sonnet, background, worktrees).
- **Finding**: each committed correct, tested-looking work but its SubagentHandback body was the single word "placeholder". The commits were found only by reading the worktree (`git log <base>..HEAD`).
- **Impact**: never treat a hand-back as the record; read each worktree's log/diff, and rerun the task's tests at merge when the agent reported none.
- **Confidence**: High (3 of 15 agents in one mission).

## Observation: npm-pack package tests fail inside a mission worktree, pass on the main checkout
- **Context**: T1e ran the full suite in `.claude/worktrees/lad-T1e`.
- **Finding**: `sprite-package-files`, `stdlib-package-files` ×2, `stdlib-packages` failed there; the same tree's `gates.sh b0` on the main checkout passed all 1577 files. The worktree symlinks `packages/*/assets|generated` (mkwt.sh), which `npm pack` treats differently.
- **Impact**: package-test reds in a worktree are an environment artefact; gate on the main checkout.
- **Confidence**: Medium (inferred from the symlinks; not bisected).

## Observation: a worktree agent can leave a hung shell behind
- **Context**: after T1e finished, a `zsh -c 'cd …/lad-T1e && cd tests/fixtures; cat'` (pid 717/719) sat idle for 85 min.
- **Finding**: `cat` waiting on stdin from a backgrounded agent command; harmless but keeps the worktree busy.
- **Impact**: `ps … | grep worktrees/lad-` before removing worktrees; kill leftovers.
- **Confidence**: High.

## Observation: FilesDiagram drops every skinparam, even handwritten
- **Context**: T1e files cut.
- **Finding**: `FilesDiagram.java:62-67` calls `styleExtractor.applyStyles(skinParam)` and never reads `handwritten`; so the files jar-compatible cut is "all skinparam dropped, `<style>`/`skin` kept" (`src/diagrams/files/files-style-input.ts`), not `jsonFamilyStyleInput`.
- **Impact**: files cannot reuse the json-family cut; layering also forbids files → json imports.
- **Confidence**: High.

## Observation: PR #92 CodeQL alerts 34-37 were deliberate single replacements
- **Context**: `js/incomplete-sanitization` on line 11 of `tests/unit/{board,chart,files,packetdiag}/lengthadjust-lad-t2f.test.ts`.
- **Finding**: `SOURCE.replace(/\n/, ...)` inserts one `skinparam` line after the `@start` line of a fixed test string; a global replace would be wrong. No escaping, no untrusted input. Dismissed as false positive 2026-10-24 (user-approved), comment kept under the 280-char API cap.
- **Impact**: build multi-line test sources from a line array instead of a first-newline `replace` to avoid the rule in future tests.
- **Confidence**: High.
