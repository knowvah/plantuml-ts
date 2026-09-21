# T11 — namespace `url`/`color`/`usymbol` AST fields

**Agent:** typescript-pro (sonnet) · **Depends on:** — · Parallel with T13.

## Context

Upstream threads a package's `[[url]]`, inline `#COLOR` and USymbol
stereotype onto the `Entity` at parse time (`command/CommandPackage.java:
179-181` `USymbols.fromString(stereotype, …)` → `gotoGroup(..., usymbol)`;
`net/atmp/CucaDiagram.java:358-359` `ent.setUSymbol(usymbol)`;
`descdiagram/command/CommandPackage.java`/`CommandPackageWithUSymbol.java`
thread parsed `Colors` via `entity.setColors(...)`). This port's USymbol
keyword is already captured into `state.descriptiveContainers`
(`class-container.ts#setNamespaceStereotype`) but never reaches
`Namespace`; the url regex in `class-command-containers.ts:69` matches
`\[\[[^\]]*\]\]` with a **non-capturing** group and discards it
(`diagnosis/A2b-entity-groups.md` E4); the inline colour capture group in
`NAMESPACE_COMMANDS`' regexes (`class-container.ts:382-445`) is likewise
never read by either `execute()` body, and `ast.ts`'s `Namespace` interface
(91-107) has no `color` field at all (`diagnosis/A3-style.md` M3).
`xitobu-41-lame230` additionally proves a `<style> package { BackGroundColor
…; LineThickness …; LineColor … }` cascade must resolve on the theme/AST —
find the description-engine's package style cascade path and name it. The
report is a lead: re-read the cited bodies before editing.

## Task

1. Tests first (`class-container.test.ts` / new `class-command-
   containers.test.ts` cases): a package with `[[url]]`, one with inline
   `#DDD`, one with `<<Node>>`, and `xitobu`'s `<style> package { … }` block —
   assert the parsed `Namespace` carries `url`, `color`, `usymbol`, and that
   the style cascade produces the expected resolved values (read via
   whatever cascade lookup `class-namespace-shape.ts`/`style-cascade-
   class.ts` exposes — do not invent a new lookup path).
2. Add `Namespace.{ url?: UrlInfo; color?: string; usymbol?: string }` to
   `ast.ts` (mirror the `UrlInfo` shape already used for classifiers —
   `class-url.ts`).
3. `class-command-containers.ts:69`: make the `[[...]]` group capturing;
   reuse whatever URL-info builder the classifier path uses
   (`class-url-command.ts`) rather than hand-rolling a second one.
4. `class-container.ts`: give `openNamespaceBlock` a `url`/`color` param (or
   a post-open setter, whichever keeps every existing call site
   compiling without change), wire `setNamespaceStereotype`'s
   `descriptiveContainers` value onto `Namespace.usymbol` too (surface, do
   not duplicate storage — keep `descriptiveContainers` as the source of
   truth and copy at the point `Namespace` is finalised, or read it directly
   in T12 if simpler; pick one and say why in `.agent-notes/cdd-T11.md`).
5. `NAMESPACE_COMMANDS`' `execute()` bodies (`class-container.ts:382-445`):
   read the already-captured `NOTE_COLOR` group with `resolveBareOrBackColor`
   (same helper M3 names for the classifier-declaration path), set
   `Namespace.color`.
6. Instrument `xitobu-41-lame230`'s `<style> package { BackGroundColor
   palegreen; LineThickness 2; LineColor red }` block: find which cascade
   function the description engine already runs for package style (search
   `style-cascade-class.ts` for a `package`/`namespace` selector branch) and
   confirm it reaches `class-namespace-shape.ts`'s fill/stroke resolution;
   if no such branch exists, add the minimal selector match — do not build a
   new cascade engine.
7. `.agent-notes/cdd-T11.md`: which storage choice was made in step 4 and
   why; whether the `<style> package {}` selector pre-existed or was added.

## Read-set

Java: `command/CommandPackage.java:179-181`; `net/atmp/CucaDiagram.java:
358-359`; `descdiagram/command/CommandPackage.java` (whole, colour thread).
TS: `src/diagrams/class/class-command-containers.ts:69`;
`src/diagrams/class/class-container.ts:75-95,180-200,350-406,382-445`;
`src/diagrams/class/ast.ts:91-107`; `src/diagrams/class/class-url.ts`
(UrlInfo shape); `src/diagrams/class/class-namespace-shape.ts:189-192,
257,297` (current global-fallback fill read); `src/core/style-cascade-
class.ts` (whole, for the package/namespace selector search).
Diagnosis: `diagnosis/A2b-entity-groups.md` E4; `diagnosis/A3-style.md` M3.

## Write-set

`src/diagrams/class/class-command-containers.ts`,
`src/diagrams/class/ast.ts`, `src/diagrams/class/class-container.ts`
(parse side only — no render-path edits, those are T12), their `*.test.ts`
files, `.agent-notes/cdd-T11.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface out (consumed by T12)

```ts
interface Namespace {
  // existing fields unchanged
  url?: UrlInfo;
  color?: string;
  usymbol?: string; // keyword form, e.g. 'node' | 'database' | 'cloud' | 'rectangle' | 'component'
}
```

## Acceptance criteria

- Given `package foo [[http://x]] #DDD <<Node>> { }`, when parsed, then
  `Namespace.url`, `.color`, and `.usymbol` are all populated
- Given `xitobu-41-lame230`, when parsed, then the resolved style cascade
  for the package yields `BackGroundColor palegreen`, `LineThickness 2`,
  `LineColor red` (assert on the cascade's resolved value, not on rendered
  SVG — T12 owns the render side)
- Given every fixture without an inline url/color/usymbol on a package,
  when re-rendered, then output is byte-identical (parse-only change, no
  render consumer yet)
- Given `git diff --name-only`, then only the write-set changed

## Observability

N/A — no new observable operations; parse-only AST fields with no consumer
in this task.

## Rollback

Reversible — revert the task's commits; pins are committed with the code
(none move in this task).

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`npx tsx tools/render-diff.mts xitobu-41-lame230 dopuzi-50-muxo994 garumi-
63-vuze973` before and after — expect ZERO change in this task (no render
consumer yet); a change here means step 4/5 leaked into a render path and
must be reverted. Files ≤500 lines, functions ≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: reuse `resolveBareOrBackColor` and `class-url-command.ts`'s
existing builder rather than hand-rolling new ones. Ask first: any stop
condition in `../README.md`; extending the cascade engine beyond a
package/namespace selector. Never: touch `renderer-group.ts` or any render
file (T12's write-set); fit a value; edit outside the write-set (stop 1).

## Commit

`feat(cdd-T11): add url/color/usymbol fields to Namespace AST`

Body: why — E4's url and STY-M3's color were grammar-captured and
discarded; this task makes them structurally reachable so T12 can render
them. No render-path change in this commit.
