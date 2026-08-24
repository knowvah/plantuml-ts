/**
 * `ACTIVITY_ACCEPTS_PATTERNS`'s bare `/^\|.+\|/` swimlane pattern claimed
 * three things that are not swimlanes: sequence's `|||` spacer, sequence's
 * `||0||` parameterised delay, and creole table rows inside a `legend`
 * block (`|= |= Type |`, `| Item1 | 1 | 3 |`). All are `SEQUENCE ->
 * ACTIVITY` misroutes surfaced by the routing-conformance gate (see
 * `plans/routing-heuristic-repair/batch-2/T2-activity-swimlane.md`).
 *
 * The narrowed pattern mirrors upstream's own swimlane grammar:
 * `~/git/plantuml/.../activitydiagram3/command/CommandSwimlane.java:60-67`
 * (the `|name|` form) and `CommandSwimlane2.java:60-75` (the `swimlane
 * name` keyword form). CommandSwimlane's regex requires exactly two pipe
 * characters -- `^\|(?:(#color)\|)?([^|]+)\|([^|]+)?$` -- so any line with
 * a third pipe (the creole rows) or an empty field between two adjacent
 * pipes (`|||`, `||0||`) cannot match it.
 */
import { describe, expect, it } from 'vitest';

import { activityPlugin } from '../../../src/diagrams/activity/index.js';

function accepts(line: string): boolean {
  return activityPlugin.accepts(['@startuml', 'A -> B : hello', line, '@enduml']);
}

describe('activity accepts() no longer claims non-swimlane pipe lines', () => {
  it.each([
    ['|||', 'sequence spacer directive'],
    ['||0||', 'sequence parameterised delay'],
    ['|= |= Type |', 'creole table header row inside legend'],
    ['| Item1 | 1 | 3 |', 'creole table data row inside legend'],
  ])('rejects %s (%s)', (line) => {
    expect(accepts(line)).toBe(false);
  });
});

describe('activity accepts() still claims every real swimlane form', () => {
  // CommandSwimlane.java:60-67 -- `^\|(?:(#color)\|)?([^|]+)\|([^|]+)?$`
  const commandSwimlaneForms: [string, string][] = [
    ['|Alice|', 'bare name, no label'],
    ['|Alice|Alice the swimlane', 'name with trailing label'],
    ['|#red|Alice|', 'name with a leading background color'],
    ['|#red|Alice|Alice the swimlane', 'name, color, and label'],
    ['|#FF0000-CCCCCC|Alice|', 'gradient color name'],
  ];

  // CommandSwimlane2.java:60-75 -- `swimlane <color>? NAME (as LABEL)?`
  const commandSwimlane2Forms: [string, string][] = [
    ['swimlane Alice', 'bare keyword form'],
    ['swimlane Alice as "Alice the swimlane"', 'keyword form with as-label'],
    ['swimlane #red Alice', 'keyword form with a leading color'],
    ['swimlane #red Alice as "Alice the swimlane"', 'keyword form, color and label'],
    ['SWIMLANE Alice', 'keyword is case-insensitive, per Pattern2.java:114'],
  ];

  it.each(commandSwimlaneForms)('accepts %s (%s) -- CommandSwimlane', (line) => {
    expect(accepts(line)).toBe(true);
  });

  it.each(commandSwimlane2Forms)('accepts %s (%s) -- CommandSwimlane2', (line) => {
    expect(accepts(line)).toBe(true);
  });
});
