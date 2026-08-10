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
 * A CONTAINER opener, which upstream claims with `CommandPackage` /
 * `CommandPackageWithUSymbol` (`ClassDiagramFactory` lines 127-130) BEFORE
 * the gated `CommandCreateElementFull2` on line 133 — so it is never gated.
 *
 * Jar-verified 2026-08-02: `package foo {`, `package foo {}`, `state A {`,
 * `rectangle R {` and the long-description `package Application [` all render
 * without `allowmixing`, while the LEAF form of every one of the 29
 * descriptive keywords is refused without it.
 */
const CONTAINER_OPENER = /[{[]\s*\}?\s*$/;

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
      // Only RECORDED here, adjudicated in `finalizeParse` — see
      // `gatedLeafSeen`'s doc on ParseState. The declaration is still applied,
      // because whether this is an error depends on the whole block: upstream
      // reaches this command only when `ClassDiagramFactory` owned the block
      // in the first place, and this port's dispatcher is more eager than that
      // factory (a C4 diagram, which has no class construct at all, arrives
      // here). Deciding at the end keeps a macro-expanded descriptive diagram
      // rendering while still refusing a genuine class+leaf mix.
      if (
        !state.allowMixing &&
        !MIX_PREFIX.test(line) &&
        !CONTAINER_OPENER.test(line.trim())
      ) {
        state.gatedLeafSeen = true;
        state.gatedLeafLine ??= state.currentLine;
      }
      const decl = parseClassifierDecl(line);
      if (decl !== null) applyClassifierDecl(state, decl, false);
    },
  },
];
