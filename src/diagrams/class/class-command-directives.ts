/**
 * Directive-style commands for the class diagram dispatch table (rules
 * 1-3b of the original class-commands.ts COMMANDS array): comment/no-op
 * lines, rankdir, skinparam/scale/allowmixing no-ops, `set separator`,
 * `!pragma useIntermediatePackages`, `newpage`, `hide`/`show`, and
 * `remove`/`restore`. Split out of class-commands.ts to stay under the
 * line cap; order preserved (spread first in COMMANDS).
 */
import type { Command } from './class-command-types.js';
import { executeHideShow } from './class-hideshow-dispatch.js';
import { startNewPage } from './parser.js';

/**
 * Order matters: patterns are tested top-to-bottom; first match wins.
 */
export const DIRECTIVE_COMMANDS: readonly Command[] = [
  // 1. Ignore: comments starting with '
  { pattern: /^'/, execute() { /* no-op */ } },

  // 1b. `left to right direction` → rankdir LR (upstream CommandRankDir).
  //     `top to bottom direction` is a no-op (TB is the default). Both must
  //     precede the skinparam/title ignore so they are consumed here.
  {
    pattern: /^left\s+to\s+right\s+direction\b/i,
    execute(state) {
      state.ast.rankdir = 'LR';
    },
  },
  { pattern: /^top\s+to\s+bottom\s+direction\b/i, execute() { /* no-op — TB default */ } },

  // 2. Ignore: skinparam, scale lines (scale is global/structurally inert).
  //    `title` is NOT ignored here -- it is claimed by the shared annotation
  //    matcher (matchAnnotationCommand, called before COMMANDS in parser.ts)
  //    so `title ...`/`title\n...\nend title` lands in
  //    `state.ast.annotations.title` instead of being silently dropped.
  {
    pattern: /^(skinparam|scale\b)/i,
    execute() { /* no-op */ },
  },

  // 2a. allow_mixing / allowmixing — upstream `CommandAllowMixing` flips a
  //     flag on the diagram, and `CommandCreateElementFull2`'s
  //     Mode.NORMAL_KEYWORD registration REFUSES a descriptive leaf without
  //     it. This used to be a no-op ("the class parser renders descriptive
  //     elements unconditionally"), which is exactly the permissiveness
  //     divergence SI10's T3 measured: the jar returns an error page for
  //     `class Foo` + `actor Bob`, this port rendered a diagram.
  {
    pattern: /^allow_?mixing\s*$/i,
    execute(state) { state.allowMixing = true; },
  },

  // 2a-bis. `layout_new_line` (CommandLayoutNewLine) — registered right after
  //     CommandAllowMixing upstream (ClassDiagramFactory.java:125, next to
  //     :124's CommandAllowMixing). T14 (dispatch-by-parse-attempt): a corpus
  //     fixture (deboga-81-zuza232) newly refused once unrecognised lines
  //     stopped being silently dropped. `executeArg` calls
  //     `diagram.layoutNewLine()` (ClassDiagram.java:67-70), which increments
  //     an `Entity`-stamped counter (`abel/Entity.java:117`) feeding
  //     `FullLayout`/`RowLayout` — a row-grid layout mode for UNLINKED
  //     entities that this port's svek/dot-engine pipeline has no
  //     counterpart for. Recognised, no modeled effect — same
  //     "recognised, no observable effect" posture as `!pragma`'s general
  //     form below.
  //     @see ~/git/plantuml/.../classdiagram/command/CommandLayoutNewLine.java:55-59,71-74
  {
    pattern: /^layout_new_line\s*$/i,
    execute() { /* recognised, no modeled effect -- see comment above */ },
  },

  // 2b. Namespace separator directive: `set namespaceSeparator ::`,
  //     `set separator .`, or `set separator none` (disables splitting).
  {
    pattern: /^set\s+(?:namespace)?separator\s+(\S+)\s*$/i,
    execute(state, match) {
      const value = match[1]!;
      state.namespaceSeparator = /^none$/i.test(value) ? null : value;
    },
  },

  // 2c. `!pragma useIntermediatePackages false` — collapse a dotted id to a
  //     single namespace instead of a nested chain.
  {
    pattern: /^!pragma\s+useintermediatepackages\s+(true|false)\s*$/i,
    execute(state, match) {
      state.intermediatePackages = !/^false$/i.test(match[1]!);
    },
  },

  // 2c-bis. `!pragma NAME [VALUE]` general form (CommandPragma) — registered
  //     on EVERY factory via CommonCommands.addCommonCommands2 ->
  //     addCommonCommands1 (ClassDiagramFactory.java:169). T14
  //     (dispatch-by-parse-attempt): corpus fixtures using `!pragma
  //     svek_trace on` / `!pragma layout elk` / `!pragma
  //     defaultLabeldistance 2.1` / `!pragma useNewPackage` / `!pragma teoz
  //     true` / `!pragma backToLegacyPackage` newly refused once
  //     unrecognised lines stopped being silently dropped -- upstream
  //     accepts every one of these (a real, universally-registered Command),
  //     so this port must too. Tried AFTER the specific
  //     `useIntermediatePackages` rule above so a `true`/`false` value still
  //     gets that rule's real effect; every other name (and any
  //     `useIntermediatePackages` value that ISN'T literally true/false)
  //     falls through to here. No-op body: `executeArg`'s only non-storage
  //     side effects (svgsize, `layout smetana/elk/vizjs` engine selection)
  //     have no representation in `ClassDiagramAST` -- same precedent as
  //     `state-commands.ts`'s identical port (T8, dobexo-69-zeki749).
  //     `graphviz_dot` is excluded: upstream's `executeArg` returns an
  //     EXECUTION_ERROR for it (CommandPragma.java:118-120), so any fixture
  //     using it is a jar error page too and never reaches this port's
  //     refusal-coverage bucket (jarRendered: false, excluded by
  //     construction).
  //     @see ~/git/plantuml/.../command/CommandPragma.java:60-69,101-134
  //     @see ~/git/plantuml/.../command/CommonCommands.java:63
  {
    pattern: /^!pragma\s+[A-Za-z_][A-Za-z_0-9]*(?:\s+.*)?$/,
    execute() { /* ignored -- see rule 2c-bis's doc comment */ },
  },

  // 2c-ter. `rotate` (CommandRotate) / `!assume transparent (dark|light)`
  //     (CommandAssumeTransparent) / `minwidth <digits>` (CommandMinwidth) /
  //     `page NxM` (CommandPage) -- all four registered via
  //     CommonCommands.addCommonCommands2 alongside CommandPragma above
  //     (CommonCommands.java:64,71-73). T14: each newly refused once
  //     unrecognised lines stopped being silently dropped
  //     (cexibu-81-bize688 `rotate`; lelabe-72-zate295 `!assume transparent
  //     dark`; pisake-59-jugi837 `minwidth 500`; tucesi-19-xato263 `page
  //     1x2`). Every one of the four is a genuine upstream no-op: `rotate`'s
  //     `executeArg` returns `ok()` unconditionally (CommandRotate.java:52-54);
  //     `!assume transparent`'s body is entirely commented out
  //     (CommandAssumeTransparent.java:74-80); `minwidth`'s
  //     `diagram.setMinwidth(minwidth)` call is commented out
  //     (CommandMinwidth.java:74-76); `page NxM` calls
  //     `system.setSplitPagesHorizontal/Vertical` (CommandPage.java:92-93),
  //     which controls how a SINGLE rendered diagram is chopped into
  //     multiple PRINTED/exported image files -- a concern of PlantUML's
  //     multi-file output driver, not of the one in-memory SVG this port's
  //     `renderSync` always produces, so it has no representation here
  //     either.
  //     @see ~/git/plantuml/.../command/CommandRotate.java:56-59,52-54
  //     @see ~/git/plantuml/.../command/CommandAssumeTransparent.java:54-62,74-81
  //     @see ~/git/plantuml/.../command/CommandMinwidth.java:54-59,71-77
  //     @see ~/git/plantuml/.../command/CommandPage.java:54-63,83-95
  {
    pattern: /^rotate\s*$/i,
    execute() { /* upstream no-op -- see rule 2c-ter's doc comment */ },
  },
  {
    pattern: /^!assume\s+transparent\s+(?:dark|light)\s*$/i,
    execute() { /* upstream no-op -- see rule 2c-ter's doc comment */ },
  },
  {
    pattern: /^minwidth\s+\d+\s*$/i,
    execute() { /* upstream no-op -- see rule 2c-ter's doc comment */ },
  },
  {
    pattern: /^page\s+\d+\s*x*\s*\d+\s*$/i,
    execute() { /* no representation in a single-SVG renderer -- see rule 2c-ter's doc comment */ },
  },

  // 2d. `newpage` (CommandNewpage) — finalize the current page and start an
  //     entirely fresh, empty diagram; every subsequent command mutates the
  //     new page. See parser.ts#startNewPage for the field-reset mechanism.
  {
    pattern: /^newpage\s*$/i,
    execute(state) {
      startNewPage(state);
    },
  },

  // 3. hide/show directives, tried in order: (a) global targets (empty
  //    members/members/circle/empty fields/empty methods), (b) entity-
  //    selector forms (`hide $tag`/`*`/name/<<stereotype>>/@unlinked,
  //    upstream hideOrShow2 -> hides2, G2 N7), (c) entity-QUALIFIED compound
  //    forms (`hide C2 circle`/`hide X members`/`hide Dummy2 methods`,
  //    upstream CommandHideShowByGender, entity-id GENDER only, G2 N26 --
  //    the type-keyword/`<<stereotype>>` GENDER forms remain unported, see
  //    `parseHideShowEntityDirective`'s doc comment), (d) visibility-qualified
  //    member forms (`hide private members`/`hide public fields`, upstream
  //    CommandHideShowByVisibility, G2 N12). All four only ever gate SVG
  //    drawing, never the svek DOT export — a hidden entity/member still
  //    occupies its node/row (oracle: doseko-41's `hide *`+`show $z` DOT
  //    equals directive-free sevaxa-72). See class-hideshow-dispatch.ts for
  //    the resolver chain.
  {
    // G2 N21: `-class` is a literal alternate spelling upstream accepts
    // for BOTH keywords (`CommandHideShow2.java`'s own regex: `(hide|hide-
    // class|show|show-class)`) -- `parseHideShowPatternDirective` already
    // matched it, but this dispatch gate (which decides whether the line
    // even reaches that parser) required whitespace immediately after
    // "hide"/"show", so `hide-class Foo` never routed here at all (jar-
    // verified against `nekali-92-loda300`).
    pattern: /^(hide|show)(-class)?\s/i,
    execute: executeHideShow,
  },

  // 3b. remove/restore (CommandRemoveRestore) — unlike hide, excludes the
  //     matched entities from the DOT export entirely. Stored raw; evaluated
  //     lazily at the layout-input boundary (layout.ts → filterRemovedEntities),
  //     mirroring upstream's export-time isRemoved().
  //     @see ~/git/plantuml/.../classdiagram/command/CommandRemoveRestore.java:55-90
  {
    pattern: /^(remove|restore)\s+(\S.*)$/i,
    execute(state, match) {
      (state.ast.removeDirectives ??= []).push({
        kind: 'removerestore',
        action: match[1]!.toLowerCase() === 'restore' ? 'restore' : 'remove',
        what: match[2]!.trim(),
      });
    },
  },
];
