/**
 * `CommandAssumeTransparent`: `!assume transparent dark|light`, a historical
 * directive every command factory registers through
 * `CommonCommands#addCommonCommands2` (`command/CommonCommands.java:65`).
 * Its `executeArg` is a no-op (`CommandAssumeTransparent.java:74-81`: "This
 * is ignored and will be suppressed in some future"), so recognising the line
 * IS the whole port -- but an engine that does not recognise it refuses the
 * diagram, and three bundled themes emit it (`puml-theme-aws-orange.puml:73`,
 * `-cloudscape-design`, `-black-knight`), so every `!theme` of theirs reaches
 * the engine with this line in it (cdd4-T7b).
 *
 * The grammar is `CommandAssumeTransparent.java:54-62`, matched against the
 * TRIMMED line (`SingleLineCommand2(pattern)` -> `doTrim = true`,
 * `SingleLineCommand2.java:55-57,70-73`) and case-insensitively (every
 * command regex compiles through `Pattern2.java:114`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandAssumeTransparent.java
 */
export const RE_ASSUME_TRANSPARENT = /^!assume\s+transparent\s+(?:dark|light)$/i;

/** True when `line` is an `!assume transparent dark|light` directive. */
export function isAssumeTransparent(line: string): boolean {
  return RE_ASSUME_TRANSPARENT.test(line.trim());
}
