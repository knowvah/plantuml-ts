/**
 * CommandControl -- the verdict of `Command#isValid`: the line is a valid
 * command (`OK`), is not (`NOT_OK`), or becomes valid once the dispatcher
 * appends the next line's opening bracket (`OK_PARTIAL`). Upstream enum
 * order is `OK, NOT_OK, OK_PARTIAL`; as-const object + string union per
 * project convention (`ParserPass.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandControl.java
 */
export const CommandControl = {
  OK: 'OK',
  NOT_OK: 'NOT_OK',
  OK_PARTIAL: 'OK_PARTIAL',
} as const;
export type CommandControl = (typeof CommandControl)[keyof typeof CommandControl];
