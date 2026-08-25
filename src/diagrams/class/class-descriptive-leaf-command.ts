/**
 * Descriptive-element leaf declaration command (`database X`, `mix_actor Y`).
 *
 * Split out of class-commands.ts purely to keep that file under the repo's
 * 500-line-per-file cap (mirrors class-object-commands.ts / class-map-
 * commands.ts's own "split out of a capped file, behavior unchanged"
 * precedent) — pure move, no behavior change. Was rule 9 in class-commands.ts's
 * numbering: AFTER the member rule so a class NAMED like a keyword with
 * members is a member line, not a descriptive element. Only the leaf form
 * reaches here (no container `{`). `mix_` prefix = CommandCreateElementFull2's
 * unconditional Mode.WITH_MIX_PREFIX registration (no allowmixing gate).
 *
 * @see ~/git/plantuml/.../classdiagram/command/CommandCreateElementFull2.java
 */

import { refuse } from '../../core/parse-refusal.js';
import {
  applyClassifierDecl,
  parseClassifierDecl,
} from './class-declaration-parser.js';
import { ALL_DESCRIPTIVE_LEAF } from './class-descriptive-leaf-keywords.js';
import type { ParseState } from './parser.js';

interface Command {
  pattern: RegExp;
  execute(state: ParseState, match: RegExpExecArray): void;
}

/** Upstream's own wording, verbatim —
 *  `CommandCreateElementFull2#executeArg` line 198. */
export const ALLOW_MIXING_ERROR =
  "Use 'allowmixing' if you want to mix classes and other UML elements.";

/**
 * `CommandPackageWithUSymbol`'s own SYMBOL alternation, verbatim
 * (`CommandPackageWithUSymbol.java:76-77`), plus the three keywords with
 * dedicated container commands on this factory — `package` is already in the
 * list, `namespace` has `CommandNamespace`/`CommandNamespace2`
 * (`ClassDiagramFactory.java:138-140`) and `together` has `CommandTogether`
 * (`:131`).
 *
 * These are the container openers upstream claims BEFORE reaching the gated
 * `CommandCreateElementFull2` on `:133`, so these — and only these — are
 * never gated.
 *
 * `state` IS NOT IN THE LIST, and that omission is the point. An earlier note
 * here read "jar-verified: `state A {` renders without allowmixing", which
 * conflated two different questions: `state A {` does render, because the jar
 * routes such a source to the STATE factory. It says nothing about whether
 * `ClassDiagramFactory` accepts the line, and it does not — no command in its
 * table matches. Exempting it here let the class engine claim 81 state
 * diagrams under parse-attempt dispatch.
 */
const CONTAINER_KEYWORD =
  /^(?:package|rectangle|hexagon|node|artifact|folder|file|frame|cloud|action|process|database|storage|component|card|queue|stack|namespace|together)\b/i;

/** The opener's own shape: a trailing `{`, `{}` or long-description `[`. */
const CONTAINER_OPENER = /[{[]\s*\}?\s*$/;

/** A container opener upstream claims before the gate: the right keyword AND
 *  the opener shape. Either alone is not enough — `state A {` has the shape
 *  and not the keyword; `node Foo` has the keyword and not the shape. */
function isContainerOpener(line: string): boolean {
  return CONTAINER_KEYWORD.test(line) && CONTAINER_OPENER.test(line);
}

/** `mix_` = Mode.WITH_MIX_PREFIX, registered UNGATED on line 134. */
const MIX_PREFIX = /^\s*mix_/i;

/**
 * Native class-diagram constructs. Upstream's `ClassDiagramFactory` only owns
 * a block containing one of these, and `CommandCreateElementFull2`'s
 * `allowmixing` gate is only reachable once that factory owns the block.
 */
const NATIVE_CLASS_KINDS: ReadonlySet<string> = new Set([
  'class',
  'abstract',
  'interface',
  'enum',
  'annotation',
]);

/**
 * Promote a recorded gate violation to a diagram error, at end of parse.
 *
 * The native-construct condition is load-bearing, not defensive: this port's
 * dispatcher is more eager than upstream's factory selection, so a C4 diagram
 * — macro-expanded descriptive leaves with no class construct anywhere —
 * arrives at the class engine, where upstream would have routed it to
 * `DescriptionDiagramFactory` and never gated it. Conditioning on the same
 * signal upstream's factory turns on keeps those rendering while still
 * refusing a genuine class+leaf mix.
 */
export function adjudicateAllowMixing(state: ParseState): void {
  if (!state.gatedLeafSeen) return;
  if (!state.ast.classifiers.some((c) => NATIVE_CLASS_KINDS.has(c.kind))) return;
  (state.ast.errors ??= []).push(ALLOW_MIXING_ERROR);
  state.ast.errorLine = state.gatedLeafLine;
}

export const DESCRIPTIVE_LEAF_COMMANDS: readonly Command[] = [
  {
    pattern: new RegExp('^(?:mix_)?(?:' + ALL_DESCRIPTIVE_LEAF + ')\\s+\\S', 'i'),
    execute(state, match) {
      const line = match.input;
      // `CommandCreateElementFull2#executeArg`:
      //   if (mode == Mode.NORMAL_KEYWORD && diagram.isAllowMixing() == false)
      //     return CommandExecutionResult.error(...)
      //
      // Refused IMMEDIATELY, as upstream refuses it. This used to be merely
      // RECORDED and adjudicated at end of parse, gated on the block also
      // holding a native class construct -- a compensation for this port's
      // dispatcher being more eager than upstream's factory selection, which
      // sent C4 and other macro-expanded descriptive diagrams here when
      // upstream would have given them to `DescriptionDiagramFactory`.
      //
      // T12 removed the reason for that compensation: dispatch now attempts
      // the parse, so refusing here is exactly what hands the block to the
      // next candidate, which is what upstream does. Measured: deferring it
      // cost 200 DESCRIPTION and 150 STATE fixtures, each claimed by the
      // class engine because this gate never fired in time.
      if (
        !state.allowMixing &&
        !MIX_PREFIX.test(line) &&
        !isContainerOpener(line.trim())
      ) {
        // Upstream returns the error BEFORE applying anything, so the
        // declaration below must not run. `error(String)` carries score 0
        // (`CommandExecutionResult.java:81-83`).
        state.executionRefusal = refuse(
          'execution',
          state.currentLine ?? 0,
          state.currentLine ?? 0,
          ALLOW_MIXING_ERROR,
          0,
        );
        return;
      }
      const decl = parseClassifierDecl(line);
      if (decl !== null) applyClassifierDecl(state, decl, false);
    },
  },
];
