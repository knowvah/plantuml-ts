/**
 * `PSystemDedicationFactory` (dedication/PSystemDedicationFactory.java)
 * through its plugin, against the corpus oracle `unknown/kavama-92-noro949`
 * (`Write your own dedication!`), the PNG bytes served through
 * `ParseOptions.assetStore` (ADR-2, D4).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseRefusalOf } from '../../../src/core/parse-refusal.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import {
  dedicationPlugin,
  PSystemDedicationFactory,
} from '../../../src/diagrams/dedication/PSystemDedicationFactory.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { renderWith, sourceOf } from '../eggs/plugin-harness.js';
import { dedicationAssetStore } from './dedication-store.js';

const ROW = join(import.meta.dirname, '..', '..', '..', 'test-results/dot-cache/unknown/kavama-92-noro949');
const PUML = readFileSync(join(ROW, 'in.puml'), 'utf8');
const ORACLE = readFileSync(join(ROW, 'in.svg'), 'utf8');
const OPTIONS = { assetStore: dedicationAssetStore() };

describe('PSystemDedicationFactory.executeLine (java:46-53)', () => {
  const factory = new PSystemDedicationFactory();
  const source = sourceOf('@startuml\nx\n@enduml');

  it('builds the page for a dedication sentence', () => {
    const page = factory.executeLine(source, 'Write your own dedication!', new PreprocessingArtifact(), OPTIONS);
    expect(page?.getDescription()).toBe('(Dedication)');
  });

  it('is undefined for any other line, or with no store', () => {
    expect(factory.executeLine(source, 'charlie', new PreprocessingArtifact(), OPTIONS)).toBe(undefined);
    expect(factory.executeLine(source, 'Write your own dedication!', new PreprocessingArtifact())).toBe(undefined);
  });
});

describe('dedicationPlugin against the jar (kavama-92-noro949)', () => {
  it('renders with zero diffs', () => {
    expect(compareSvg(renderWith(dedicationPlugin, PUML, OPTIONS), ORACLE, 'deterministic').diffs).toEqual([]);
  });

  it('embeds the vendored bytes the jar embeds', () => {
    const embedded = /xlink:href="([^"]+)"/.exec(ORACLE)?.[1];
    expect(renderWith(dedicationPlugin, PUML, OPTIONS)).toContain(`xlink:href="${embedded}"`);
  });

  it('renders identically three times', () => {
    const runs = [0, 1, 2].map(() => renderWith(dedicationPlugin, PUML, OPTIONS));
    expect(new Set(runs).size).toBe(1);
  });

  it('refuses with "Syntax Error?" when no store serves the image', () => {
    expect(parseRefusalOf(dedicationPlugin.parse(sourceOf(PUML)))?.message).toBe('Syntax Error?');
  });

  it('refuses a 4-line source at the single-line gate', () => {
    const text = '@startuml\nWrite your own dedication!\nWrite your own dedication!\n@enduml';
    expect(parseRefusalOf(dedicationPlugin.parse(sourceOf(text), OPTIONS))?.commandScore).toBe(
      Number.NEGATIVE_INFINITY,
    );
  });
});
