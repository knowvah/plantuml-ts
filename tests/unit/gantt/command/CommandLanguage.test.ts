import { describe, expect, it } from 'vitest';
import {
  applyCommandLanguage,
  COMMAND_LANGUAGE_RE,
  CommandLanguage,
} from '../../../../src/diagrams/gantt/command/CommandLanguage.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const CMD = 'src/main/java/net/sourceforge/plantuml/gantt/command/CommandLanguage.java';

/** The protected `weekConfig` half, reached through a cast (private to GanttDiagram upstream). */
const localeOf = (d: GanttDiagram): { language: string } =>
  (d as unknown as { weekConfig: { getLocale: () => { language: string } } }).weekConfig.getLocale();

function run(line: string, d: GanttDiagram = newGantt()): { d: GanttDiagram; ok: boolean } {
  const m = COMMAND_LANGUAGE_RE.exec(line);
  if (m === null) throw new Error(`no match: ${line}`);
  return { d, ok: applyCommandLanguage(d, m).isOk() };
}

describe('CommandLanguage', () => {
  // Corpus forms (test-results/dot-cache/gantt/*/in.puml, tests/fixtures/gantt/*.puml).
  it.each(['language de', 'language zh', 'language ru', 'language ko', 'language ja', 'Language JA', 'Language toto'])(
    `matches %s (${CMD}:56-59)`,
    (line) => {
      expect(COMMAND_LANGUAGE_RE.test(line)).toBe(true);
    },
  );

  it.each(['language', 'language ', 'language de fr', 'languages de', 'language d-e', ' language de'])(
    `rejects %j: LANG is \\w+ and the line is anchored (${CMD}:55-59)`,
    (line) => {
      expect(COMMAND_LANGUAGE_RE.test(line)).toBe(false);
    },
  );

  it('captures LANG as written (CommandLanguage.java:58)', () => {
    expect(COMMAND_LANGUAGE_RE.exec('Language JA')?.groups?.['LANG']).toBe('JA');
  });

  it('apply changes the locale, lower-cased by newLocale (CommandLanguage.java:65; GanttDiagram.java:129-132,142)', () => {
    const { d, ok } = run('Language JA');
    expect(ok).toBe(true);
    expect(localeOf(d).language).toBe('ja');
  });

  it('Language toto takes the Java fallback: any word is accepted as a locale, ok result (GanttDiagram.java:129-132)', () => {
    const { d, ok } = run('Language toto');
    expect(ok).toBe(true);
    expect(localeOf(d).language).toBe('toto');
  });

  it('exports { regex, apply } under the Java class name', () => {
    expect(CommandLanguage.regex).toBe(COMMAND_LANGUAGE_RE);
    expect(CommandLanguage.apply).toBe(applyCommandLanguage);
  });
});
