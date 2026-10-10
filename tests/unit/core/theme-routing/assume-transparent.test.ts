/**
 * cdd4-T7b: `!assume transparent dark|light` is a common command every
 * command factory registers (`CommonCommands.java:65`) and a no-op
 * (`CommandAssumeTransparent.java:74-81`). Three bundled themes emit it
 * (`puml-theme-aws-orange.puml:73` indented), so every engine they reach
 * must accept it rather than refuse the diagram.
 */
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../../src/index.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { isAssumeTransparent } from '../../../../src/core/assume-transparent.js';
import { expectNoErrorDiagram } from '../../../helpers/error-diagram.js';

const SOURCES: Readonly<Record<string, readonly [string, string]>> = {
  class: ['@startuml\n{A}\nclass A\n@enduml', 'CLASS'],
  sequence: ['@startuml\n{A}\nA -> B\n@enduml', 'SEQUENCE'],
  activity: ['@startuml\n{A}\nstart\n:a;\nstop\n@enduml', 'ACTIVITY'],
  usecase: ['@startuml\n{A}\nactor U\nusecase C\nU --> C\n@enduml', 'DESCRIPTION'],
  component: ['@startuml\n{A}\ncomponent C\n@enduml', 'DESCRIPTION'],
  state: ['@startuml\n{A}\n[*] --> S\n@enduml', 'STATE'],
};

describe('isAssumeTransparent (CommandAssumeTransparent.java:54-62)', () => {
  it('matches the trimmed directive, case-insensitively, dark or light', () => {
    expect(isAssumeTransparent('    !assume transparent light')).toBe(true);
    expect(isAssumeTransparent('!ASSUME Transparent DARK')).toBe(true);
    expect(isAssumeTransparent('!assume transparent grey')).toBe(false);
    expect(isAssumeTransparent('!assume transparent light x')).toBe(false);
  });
});

describe('every engine accepts !assume transparent', () => {
  for (const [engine, [source, type]] of Object.entries(SOURCES)) {
    it(`${engine}: indented, as a theme emits it`, () => {
      const svg = renderSync(source.replace('{A}', '    !assume transparent light'), {
        measurer: new DeterministicMeasurer(),
      });
      expectNoErrorDiagram(svg, engine);
      expect(svg).toContain(`data-diagram-type="${type}"`);
    });
  }

  it('chart and packet too', () => {
    const measurer = new DeterministicMeasurer();
    for (const source of [
      '@startchart\n!assume transparent dark\nbar "s" [1, 2]\n@endchart',
      '@startpacket\n!assume transparent dark\n0-7: a\n@endpacket',
    ]) {
      expectNoErrorDiagram(renderSync(source, { measurer }), source);
    }
  });
});
