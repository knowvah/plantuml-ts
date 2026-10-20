# T1d — port `Style#mergeNestedChildOver`; drop the header throws

Agent: `typescript-pro`, worktree `sdd1-T1d`. Commit:
`feat(style): port Style#mergeNestedChildOver`.

## Context
plantuml-ts ports PlantUML faithfully; the Java at `~/git/plantuml` is the
spec. Read the Java method bodies before writing anything, and cite
`file:line` for everything you port. T1a built the sequence style module
(`src/diagrams/sequence/sequence-skin-param.ts`). Two of its functions
throw today because one upstream `Style` method was never ported:
`groupingStyle(b, 'START'|'ELSE', true)` and `referenceStyle(b, true)`
(`sequence-skin-param.ts:294-327`), with a test pinning the throw
(`tests/unit/sequence/sequence-skin-param.test.ts:335-338`).

User ruling 2026-10-20 (decisions.md D4 Amendment 2): additive ports of
unported upstream `core/style` members are allowed, with a Java `file:line`
and their own test. Additive means a NEW member on `Style`. Changing the
behaviour of any existing member of `Style.ts` is still forbidden (mindmap,
wbs, salt and others read it, and their pinned goldens must not move).

The oracle jar has the method (`javap` on `oracle/dist/plantuml-oracle.jar`;
upstream commit `8dd75d2e4d1`, #2679).

## Task
1. Tests first, in `tests/unit/core/style/Style.test.ts`:
   - `nested` undefined returns `this` (same instance);
   - a nested value equal (by `asString()`) to the parent's value is dropped,
     so the receiver's own value survives;
   - a nested value that differs from the parent's, or that the parent lacks,
     is merged on top with the given strategy;
   - `nestedParent` undefined keeps every nested value;
   - every nested value filtered out returns `this` (same instance);
   - the result's signature is `this.signature.mergeWith(nested.signature)`,
     as `mergeWith` builds it.
2. Port `mergeNestedChildOver(nested, nestedParent, strategy)` into
   `src/core/style/Style.ts` from `Style.java:158-173` (javadoc at
   `:137-157`). Mirror the Java: build the divergent-only map in `nested`'s
   iteration order, compare with `Value#asString()`, return `this` when
   empty, else `this.mergeWith(new Style(nested.signature, divergentOnly),
   strategy)`. Java `null` → `undefined`. JSDoc `@see Style.java:137-173`.
   Remove `mergeNestedChildOver` from the "Not ported" list in the class
   comment (`Style.ts:113-117`) and touch nothing else in the file.
3. In `sequence-skin-param.ts`, replace the throwing stub with the Java:
   - group header: `Grouping.java:83-96` (`computeStyleHeader`), with the
     nested signature from `getNestedHeaderStyleDefinition` (`:79-81`:
     `root, element, sequenceDiagram, group, header`) and `nestedParent` =
     the plain group style (`this.style`, `:58-63`). Then keep T1a's
     `BackGroundColor` override where `Grouping.java:98-112` (`getUsedStyles`)
     applies it to the header — read it to confirm which colour applies.
   - reference header: `Reference.java:85-97`, nested signature
     `root, element, sequenceDiagram, reference, header` (`:82-84`),
     `nestedParent` = the plain reference style.
   - `MergeStrategy.OVERWRITE_EXISTING_VALUE` in both.
   - Keep the Java's `if (flat == null) return nested;` only if the port's
     merged-style helper can return `undefined`. If it cannot, say so in a
     one-line comment citing the helper.
   - Update the module doc comment (`:20`) and the two function JSDocs.
4. Replace the throw test with value tests:
   - default skin: `groupingStyle(DEFAULT, 'START', true)` resolves the
     `groupHeader` values from `plantuml.skin:123-129`;
   - default skin: `referenceStyle(DEFAULT, true)` resolves the
     `referenceHeader` values from `plantuml.skin:163-170`;
   - a `<style>` with `sequenceDiagram { group { header { FontSize 20 } } }`
     overrides the group header's font size;
   - a property set only on plain `group { }` does NOT overwrite the
     `groupHeader` value (this is the method's whole purpose; javadoc
     `Style.java:137-157`).
   Build these with the dispatch/builder helpers the existing test file
   already uses.

## Write-set
`src/core/style/Style.ts`, `tests/unit/core/style/Style.test.ts`,
`src/diagrams/sequence/sequence-skin-param.ts`,
`tests/unit/sequence/sequence-skin-param.test.ts`. Nothing else.

## Read-set
Java: `style/Style.java:62-200`, `style/MergeStrategy.java`,
`sequencediagram/Grouping.java:50-115`, `sequencediagram/Reference.java:
55-115`, `~/git/plantuml/src/main/resources/skin/plantuml.skin:110-175`.
Port: `src/core/style/Style.ts` (whole, 310 lines), `ValueImpl.ts`
(`asString`, `mergeWith`), `sequence-skin-param.ts:1-60,280-330`, the two
test files.

## Quality bar
`npx vitest run tests/unit/core/style tests/unit/sequence/sequence-skin-param.test.ts`
+ `npm run typecheck` + `npx eslint` on the four files. Coverage of the new
method: every branch.

## Boundaries
- No other edit under `src/core/style/**`. If you find another `Style`
  member you need, stop and report it; do not port it.
- No geo/renderer/parser/layout file (T1b and T1c own those and run in
  parallel with you).
- No Serena edit tools: they write the MAIN checkout, not your worktree. Use
  Read/Edit/Write only. No `git stash`. No push.
- Rendered output must not change: nothing calls these header styles yet.

## Commit
Conventional Commits, subject ≤72 chars, lowercase, all lines ≤80 chars, no
attribution or Co-Authored-By lines. Body states the Java lines ported and
that `Style.ts` gained one member and changed no existing one.

Return only the structured result — no preamble, no trailing summary:
commit hash; files changed; test counts; any Java/port mismatch found.
