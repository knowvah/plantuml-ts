# T5b: `CommandCreoleSpace` port (stop 10, awaiting maintainer approval)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

Residual family from the batch-4 close (journal row 34): `neguge-98-cilu043`, the one salt row
still `diverged` (weightedScore 89, diffCount 62). The cell texts carry `<space:20>`; the port
draws the tag as literal text (4 extra `<text>` elements, +42.75 width per cell). A creole gap
in klimt, ported INTO ITS UPSTREAM HOME (D4) — never special-cased in salt.

## Mechanism (verified against the Java at the b4 close)
- Upstream registers `CommandCreoleSpace.create()` at
  `klimt/creole/legacy/CommandCreoleBuilder.java:115`, between `CommandCreoleSprite` and
  `CommandCreoleFontFamilyChange`. The command (`klimt/creole/command/CommandCreoleSpace.java`)
  matches `<space:N>` / `<space>` (read the pattern and the `AtomSpace` it emits — its width is
  the literal `N`, its height the font's).
- Port: `src/core/klimt/creole/legacy/CommandCreoleBuilder.ts:96-140` registers the sibling
  commands but has no `CommandCreoleSpace` and no `AtomSpace`; the tag falls through to text.
  `neguge` is the only cached row in the whole corpus containing `<space:` (T4a grep), so no
  other engine's pins can move unless they also contain it — assert that with a grep over
  `test-results/dot-cache/*/*/in.puml` and report the count.

## Task (TDD; jar values from `neguge-98-cilu043/in.svg`)
1. Port `CommandCreoleSpace.java` → `src/core/klimt/creole/command/CommandCreoleSpace.ts` and
   its atom (`klimt/creole/atom/AtomSpace.java` → `src/core/klimt/creole/atom/AtomSpace.ts`),
   upstream names, `@see` on every symbol, `file:line` on every constant.
2. Register it in `CommandCreoleBuilder.ts` at the Java's position (`:115`, after Sprite,
   before FontFamilyChange) — order is the matching precedence; cite the line.
3. Pin: the width of `AtomSpace` for `<space:20>` and `<space>` (default — read the Java),
   and that neguge's four cells lose their literal texts.
4. Re-measure neguge and run the creole/klimt suites plus every golden ratchet; report movers.

## Write-set
`src/core/klimt/creole/command/CommandCreoleSpace.ts` (new), `src/core/klimt/creole/atom/AtomSpace.ts`
(new), `src/core/klimt/creole/legacy/CommandCreoleBuilder.ts` (registration line), their tests
under `tests/unit/core/klimt/**`, `docs/catalog.md`, `.agent-notes/sep-T5b.md`. Any OTHER file is a
stop: report, do not edit.

## Acceptance
- Given `neguge-98-cilu043`, then it is byte-conformant (pinnable).
- Given the existing creole/klimt suites and every golden ratchet (class, mindmap, salt, …),
  then nothing else changes (the `<space:` grep proves the reach).

**Observability:** N/A. **Rollback:** Reversible (revert).
