# T0 — land the in-flight `skinparam <sname>FontSize<<label>>` mechanism

## Prior observations

`.agent-notes/` has no entry bearing on this write-set. Two facts from the
planning session that do:

- The working tree on `fix/object-member-row-height` is dirty with a
  **partially implemented** mechanism, not a scratch experiment: the
  `theme-graph-colors.ts` hunk already carries a `@see`-style citation to
  `EntityImageObject.java:132-134`, and `skinparam-stereo-keys.ts` already
  documents the ordering constraint against `applyElementStereotypeFontSize`.
  Finish it; do not restart it.
- The same diff contains an **unrelated** 8-line `CLAUDE.md` deletion. That is
  not part of this mechanism.

### The in-flight work currently BREAKS 6 tests — diagnosed, not yet fixed

Measured at pre-flight, 2026-08-11. Do not re-derive this; fix it.

**Mechanism.** `applyElementFontSizeByStereo` is called from
`applyStereoOverride` **before** the `STEREO_KEY_MATCHERS` loop. Its regex
`^(\w+)fontsize<<(.+)>>$` matches `statefontsize<<foo>>` with `sname=state`,
and `state ∈ ELEMENT_BUCKET_SNAMES` (verified: `state`, `object`, `map`,
`json` are all members; `class` is not). So it consumes the key, writes
`elements.state.fontSizeByStereo`, and returns `true`.

**Origin.** `src/core/skinparam-stereo-keys.ts` — the new handler and its
call site, versus `STATE_FONT_SIZE_STEREO_RE` (`:64`) whose handler
(`:153-154`) writes `acc.stateFontSizeByStereo`.

**Causal chain.** The state-specific handler never runs →
`acc.stateFontSizeByStereo` stays `undefined` → `laferu-31-tice836` loses its
stereotype-qualified state font size → node sizes shrink →
`maxSizeDeltaIn=0.604166` (state DOT parity) and `svg/@viewBox[2]` 80 vs 123
(state SVG ratchet). `tabaxa-70-pomu341` drifts 0.083in in class DOT parity by
the same route. Plus the 3 direct unit assertions in
`tests/unit/state/state-skinparam-cascade.test.ts`. **6 failures, one cause.**

**Ruled out.** Not the stale oracle cache — these compare against pinned
goldens, not `dot-cache`. Not pre-existing — the in-flight diff is the only
uncommitted change, and `npm run typecheck` and `npm run lint` are both clean.

**Note.** The in-flight comment already anticipates this *class* of collision
("Must be tested AFTER the stereotype variant") — it ordered correctly against
`stereotypefontsize` but missed that the matcher loop also holds
element-specific `fontsize<<…>>` regexes. The fix is an ordering or
exclusion decision, not a new mechanism. Whichever you choose, the
"combines with other `<<X>>` keys" acceptance criterion below must cover
`state` explicitly, since that is the case that broke.

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Object diagrams have no
separate engine — `ClassDiagramFactory` registers the object/map commands
alongside the class ones, so object work lives in `src/diagrams/class/**`.

This task exists because batch-0 needs a clean tree before T1 re-captures the
oracle: an uncommitted mechanism would make T1's baseline unattributable.

## Task

Complete, test and commit the in-flight mechanism: `skinparam
<sname>FontSize<<label>>` — the *element's own* font size when it carries a
stereotype, as distinct from the stereotype TEXT's size handled by
`applyElementStereotypeFontSize`. Both the flat key and the nested
`skinparam <sname> { <<label>> { FontSize N } }` block form normalize to the
same key, exactly as `SkinParam#cleanForKeySlow` does (it moves `<<x>>` to
the END of the key).

Then handle the `CLAUDE.md` hunk **as a separate commit**: either restore the
deleted lines or commit the deletion deliberately with a message saying why.
Do not fold it into the mechanism commit.

## Write-set

- `src/core/preprocessor.ts`
- `src/core/skinparam-stereo-keys.ts`
- `src/core/theme-graph-colors.ts`
- `src/diagrams/class/class-object-map-sizing.ts`
- `tests/unit/**` (new focused unit tests)
- `CLAUDE.md` (separate commit)

## Read-set

- The current uncommitted diff: `git -C . diff` — this is the starting point,
  not a suggestion.
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageObject.java:120-150`
  — the `getStyleHeader().withTOBECHANGED(stereotype)` path the port is
  mirroring. **Read the method body and the constructor that built its
  inputs**, not just these lines.
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java`
  → `cleanForKeySlow` — the key-normalization contract.
- `src/core/skinparam-stereo-keys.ts:85-235` — the matcher ordering the new
  regex must respect.

## Architecture decisions in force

`decisions.md` D1 (exit bar) and the standing no-fitted-constants rule. This
task adds no new decision.

## Interface contracts

None consumed downstream as data. The behavioural contract:

```
skinparam objectFontSize<<x>> 20
skinparam object { <<x>> { FontSize 20 } }
  → both normalize to key `objectfontsize<<x>>`
  → theme.colors.elements.object.fontSizeByStereo = { x: 20 }
```

## Acceptance criteria

- Given the working tree is dirty, when T0 completes, then `git status --short`
  is empty and all four quality gates pass.
- Given `skinparam object { <<x>> { FontSize 20 } }`, when parsed, then the
  object element's own font size resolves to 20 under stereotype `x`,
  asserted by a unit test whose comment cites the upstream `file:line`.
- Given `skinparam objectStereotypeFontSize<<x>> 9` and
  `skinparam objectFontSize<<x>> 20` together, when parsed, then the
  stereotype text sizes at 9 and the element at 20 — proving the matcher
  ordering, which is the one thing the new regex can break.
- Given `skinparam stateFontSize<<foo>> 30`, when parsed, then
  `stateFontSizeByStereo` is `{ foo: 30 }` — the case that currently breaks.
  All 6 pre-flight failures pass, and `laferu-31-tice836` and
  `tabaxa-70-pomu341` are back to zero size drift.
- Given the `CLAUDE.md` hunk, when T0 completes, then it is resolved in its
  own commit, separate from the mechanism.

## Observability requirements

N/A — no new observable operations. The task must **not** move any frozen
count; verify the object DOT gate is still 78/80 and the class SVG census
zero-diff set is intact before committing.

## Rollback

**Reversible** — two independent commits, each `git revert`-able.

## Quality bar

All four gates green, unpiped. TDD: the failing unit test comes before the
completing edit. Any constant introduced carries its upstream `file:line`.

## Boundaries

- **Always:** cite upstream `file:line` for every behavioural constant; run
  all four gates before committing.
- **Ask first:** any change outside the write-set above.
- **Never:** `git checkout/reset/stash/clean`; fit a value to make a fixture
  pass; fold the `CLAUDE.md` hunk into the mechanism commit.

## Commit format

Two commits, per `~/.claude/rules/commits.md`:

```
feat(object): size an element by its own stereotype-qualified FontSize
docs: <deliberate statement about the CLAUDE.md hunk>
```
