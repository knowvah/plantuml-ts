## Observation: `@startdot` is NOT a `TitledDiagram` upstream — D10's premise
is wrong for the `dot` engine specifically

- **Context**: T8 (mission G0b), jar-verifying the title migration for
  json/dot/chart per the task spec ("Jar-verify one titled fixture per
  engine... capture `java -jar oracle/dist/plantuml-oracle.jar -tsvg -pipe`
  output").
- **Finding**: `net.sourceforge.plantuml.directdot.PSystemDot` extends
  `DirectOsDiagram` (`~/git/plantuml/.../directdot/PSystemDot.java`): it
  shells out to the real `dot`/GraphViz binary via
  `GraphvizRuntimeEnvironment` and streams the raw SVG through, entirely
  bypassing `DiagramChromeFactory`/`UmlDiagram`'s title-chrome machinery.
  `PSystemDotFactory.executeLine` additionally requires the FIRST content
  line after `@startdot` to itself match the bare GraphViz header regex
  (`(strict\s+)?(di)?graph\s+<ident>?\s*\{\s*`, matched via `.matches()` —
  i.e. the WHOLE line, so `digraph { a -> b }` on one line also fails; the
  header must end right after `{`). A `title ...` line before that header
  is simply unparseable — reproduced with the oracle jar:
  `printf '@startdot\ntitle My Graph\ndigraph {\n  a -> b\n}\n@enddot' |
  java -jar oracle/dist/plantuml-oracle.jar -tsvg -pipe` → `Syntax Error?
  (Assumed diagram type: dot)`. Removing the `title` line renders fine.
  By contrast, `@startjson` and `@startchart` DO render `<g class="title">`
  through the jar (verified same session) — decisions.md D10's claim holds
  for those two, just not `dot`.
- **Impact**: plantuml-ts's `@startdot` title support (pre-dates mission
  G0b) is a plantuml-ts-only addition with NO upstream reference behavior
  to preserve or jar-verify — there is no oracle output to diff against for
  dot titles specifically. T8 still migrated it onto the shared
  `applyChrome` mechanism (consolidation: one chrome implementation, not
  three, and no double-draw), but its geometry correctness rests entirely
  on `applyChrome`'s own jar-verified math (verified independently via
  json/sequence/class), not a dot-specific jar probe. Documented inline in
  `src/diagrams/dot/ast.ts`'s `annotations` field doc comment. Flag for the
  maintainer: decisions.md D10 should be amended/footnoted for `dot`, and a
  `DIVERGENCES.md` entry may be warranted (not added here — outside T8's
  declared write-set; another agent had `DIVERGENCES.md` open concurrently
  in the same working tree this session).
- **Confidence**: High (jar-reproduced with and without the title line;
  Java source read directly at the cited path).
