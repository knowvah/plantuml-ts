/**
 * The life-event bookkeeping `SequenceDiagram` keeps while it parses: the
 * pending `create`, the last delay, the event a bare life event binds to, and
 * the stack of activating messages `return` and a bare `deactivate` read.
 *
 * Each function below is one method of `SequenceDiagram`, kept to what the
 * port's parser needs -- the drawing half (which bar opens where) stays in
 * layout, where the `ActivationEvent`s and `activates`/`deactivates` flags
 * already carry it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/SequenceDiagram.java:195-216,286-292,352-413
 */

import type { MessageEvent, MessageExoEvent } from './ast.js';

/** An `AbstractMessage` -- `Message` or `MessageExo`. */
export type AbstractMessageEvent = MessageEvent | MessageExoEvent;

export type LifeEventType = 'ACTIVATE' | 'DEACTIVATE' | 'DESTROY' | 'CREATE';

/** `SequenceDiagram.lastEventWithDeactivate`: a message, or a divider / group
 *  `end` (`:275`, `:443`), neither of which `dealWith`s anyone. */
export type LastEventWithDeactivate = AbstractMessageEvent | 'notMessage';

export interface LifeState {
  /** `SequenceDiagram.lastDelay` (`:286-292`), cleared by `addMessage` (`:205`). */
  lastDelay: boolean;
  /** `pendingCreate` (`:361`) -- the participant a `create` is waiting on. */
  pendingCreate: string | null;
  lastEventWithDeactivate: LastEventWithDeactivate | null;
  /** `activationState` (`:352`). */
  readonly activationState: AbstractMessageEvent[];
}

export const AFTER_DELAY_ERROR = 'You cannot Activate/Deactivate just after a ...';

export function newLifeState(): LifeState {
  return { lastDelay: false, pendingCreate: null, lastEventWithDeactivate: null, activationState: [] };
}

/** `Message#dealWith` (`Message.java:73-75`) / `MessageExo#dealWith` (`:90-92`). */
function dealWith(m: LastEventWithDeactivate, p: string): boolean {
  if (m === 'notMessage') return false;
  return m.kind === 'message' ? m.from === p || m.to === p : m.participant === p;
}

/** `Message#compatibleForCreate` (`Message.java:78-80`) / `MessageExo`'s (`:95-97`). */
function compatibleForCreate(m: AbstractMessageEvent, p: string): boolean {
  return m.kind === 'message' ? m.from !== p && m.to === p : m.participant === p;
}

/**
 * `SequenceDiagram#addMessage` (`:195-216`), its life-event half. Returns the
 * `CommandExecutionResult.error` text, or `undefined`. A compatible message
 * takes the pending `CREATE` (`m.addLifeEvent(pendingCreate)`), which is what
 * makes it `isCreate()` (`AbstractMessage.java:169-171`).
 */
export function addMessage(life: LifeState, m: AbstractMessageEvent): string | undefined {
  life.lastEventWithDeactivate = m;
  life.lastDelay = false;
  if (life.pendingCreate === null) return undefined;
  if (!compatibleForCreate(m, life.pendingCreate)) {
    return `After create command, you have to send a message to "${life.pendingCreate}"`;
  }
  m.create = true;
  life.pendingCreate = null;
  return undefined;
}

/**
 * `SequenceDiagram#activate` (`:367-413`), the parts the parser observes:
 * the after-delay refusal (`:368-369`), the pending `CREATE` (`:374-377`)
 * and the `activationState` push/pop (`:395-398`). Returns the error text,
 * or `undefined`.
 */
export function activate(life: LifeState, p: string, type: LifeEventType): string | undefined {
  if (life.lastDelay) return AFTER_DELAY_ERROR;
  if (type === 'CREATE') {
    life.pendingCreate = p;
    return undefined;
  }
  const last = life.lastEventWithDeactivate;
  if (last === null || !dealWith(last, p)) return undefined;
  if (type === 'ACTIVATE' && last !== 'notMessage') life.activationState.push(last);
  else if (type === 'DEACTIVATE') life.activationState.pop();
  return undefined;
}

/** `SequenceDiagram#getActivatingMessage` (`:354-359`). */
export function getActivatingMessage(life: LifeState): AbstractMessageEvent | undefined {
  return life.activationState.at(-1);
}

/**
 * `CommandArrow#manageActivations` (`CommandArrow.java:443-468`) on the life
 * state: `+` activates PART2, `-` deactivates PART1, `!` destroys PART2, and a
 * four-character spec applies its third character too. The errors are
 * ignored there, as here.
 */
export function manageActivations(life: LifeState, spec: string, p1: string, p2: string): void {
  const apply = (c: string | undefined): void => {
    if (c === '+') activate(life, p2, 'ACTIVATE');
    else if (c === '-') activate(life, p1, 'DEACTIVATE');
    else if (c === '!') activate(life, p2, 'DESTROY');
  };
  apply(spec.charAt(0));
  if (spec.length === 4 && spec.charAt(2) !== '!') apply(spec.charAt(2));
}

/** The `autoactivate on` arm (`CommandArrow.java:434-439`): a dotted arrow
 *  deactivates PART1, any other activates PART2. Called only when it fires. */
export function autoActivate(life: LifeState, dotted: boolean, p1: string, p2: string): void {
  if (dotted) activate(life, p1, 'DEACTIVATE');
  else activate(life, p2, 'ACTIVATE');
}

/** The life-state half of `CommandExoArrowAny.java:160-181`: the ACTIVATION
 *  spec's first character, or else the `autoactivate` arm (when it fires),
 *  on the one participant. */
export function exoLifeEvents(
  life: LifeState,
  spec: string | undefined,
  dotted: boolean,
  auto: boolean,
  p: string,
): void {
  if (spec !== undefined) manageActivations(life, spec.charAt(0), p, p);
  else if (auto) autoActivate(life, dotted, p, p);
}
