/**
 * `CommandExoArrowAny`'s two life-event arms (`:148-166` explicit, `:174-180`
 * `autoactivate`), split out of `command-exo-arrow.ts` to keep it under the
 * 500-line file cap (sdd1 T1b). Bodies unchanged but for the builder each
 * event now carries.
 */
import type { ActivationEvent } from './ast.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import { autoActivationFlags, type ParseState } from './sequence-parse-helpers.js';
import { currentStyleBuilder } from './sequence-skin-param.js';

/**
 * `diagram.activate(p, …)` for the trailing `+`/`-`/`!`, run AFTER the
 * message is added (`:152-166`). `CREATE` (`*`) is NOT here — it fires before
 * `addMessage` and is emitted by the caller. `DESTROY` is the flagged
 * deactivate a `destroy` line emits (`command-lifeline.ts#destroyCommand`):
 * bound to the exo message, it stops the lifeline and draws no cross, since
 * `LiveBoxes#isNextEventADestroy` accepts only a `Message`
 * (`LiveBoxes.java:218-219`). `styleBuilder` is the one current at this
 * command, which `SequenceDiagram#activate` hands the `LifeEvent`
 * (`SequenceDiagram.java:371-372`).
 * @see ~/git/plantuml/.../command/CommandExoArrowAny.java:148-166
 */
export function activationEventOf(
  spec: string | undefined,
  participantId: string,
  color: string | undefined,
  styleBuilder: StyleBuilder,
): ActivationEvent | undefined {
  switch (spec?.charAt(0)) {
    case '+':
      return { kind: 'activate', participantId, ...(color !== undefined ? { color } : {}), styleBuilder };
    case '-':
      return { kind: 'deactivate', participantId, styleBuilder };
    case '!':
      return { kind: 'deactivate', participantId, destroy: true, styleBuilder };
    default:
      return undefined;
  }
}

/**
 * The `autoactivate` arm of the same `if`/`else`
 * (`CommandExoArrowAny.java:174-180`): with no explicit `+`/`-`/`!` written,
 * a solid `NORMAL`/`ASYNC`-headed arrow activates the exo message's ONE
 * participant and a dotted one deactivates it. Both arms name `p` — an exo
 * message has no second participant to hand the event to, which is the only
 * way this differs from `autoActivationFlags`'s p1/p2 split.
 */
export function autoActivationEventOf(
  state: ParseState,
  spec: string | undefined,
  arrow: ArrowConfiguration,
  participant: string,
  color: string | undefined,
): ActivationEvent | undefined {
  const flags = autoActivationFlags(state, spec ?? '', arrow, participant, participant);
  const styleBuilder = currentStyleBuilder(state.style); // `SequenceDiagram.java:371-372`
  if (flags.deactivates !== undefined) return { kind: 'deactivate', participantId: participant, styleBuilder };
  if (flags.activates === undefined) return undefined;
  return { kind: 'activate', participantId: participant, ...(color !== undefined ? { color } : {}), styleBuilder };
}
