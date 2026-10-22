/**
 * `PSystemListEmoji` / `PSystemListEmojiFactory` against the 1.2026.8beta1 jar:
 * the 7 corpus `emoji <block>` rows (`test-results/dot-cache/unknown/<slug>`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { parseRefusalOf } from '../../../src/core/parse-refusal.js';
import { getAll } from '../../../src/core/klimt/creole/Emoji.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { executeLine, listEmojiPlugin } from '../../../src/diagrams/emoji/PSystemListEmojiFactory.js';
import { PSystemListEmoji } from '../../../src/diagrams/emoji/PSystemListEmoji.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { buildEmojiAssetsStore } from '../../helpers/emoji-assets-store.js';
import { CI_RENDER_BUDGET_MS } from '../../helpers/ci-test-budgets.js';

// Renders past half of vitest's 5s default on the CI runner (worst observed:
// rubeku-92-vefi942 rendered three times, 2,760ms);
// derivation in tests/helpers/ci-test-budgets.ts.
vi.setConfig({ testTimeout: CI_RENDER_BUDGET_MS });

const measurer = new DeterministicMeasurer();
const CORPUS_DIR = 'test-results/dot-cache/unknown';

/** slug -> block (fixtures.md rows T1c). */
const ROWS: readonly (readonly [string, string])[] = [
  ['vedine-65-rafo449', '1f6'],
  ['tukimi-92-noxu802', '27'],
  ['rubeku-92-vefi942', '1f9'],
  ['zusibo-75-vate603', '26'],
  ['tomodo-34-bimi231', '1f5'],
  ['ludecu-61-laja912', '1f3'],
  ['xozane-18-becu956', '1f4'],
];

function sourceOf(text: string): UmlSource {
  const block = buildBlockUmls(text)[0];
  if (block?.ok !== true) throw new Error(`no block in ${text}`);
  return { ...block.source, seedSourceLines: block.seedSource };
}

function renderText(text: string): string {
  const assetStore = buildEmojiAssetsStore();
  const ast = listEmojiPlugin.parse(sourceOf(text), { assetStore });
  if (parseRefusalOf(ast) !== undefined) throw new Error('refused');
  const geo = listEmojiPlugin.layoutSync(ast as PSystemListEmoji, defaultTheme, measurer);
  const out = listEmojiPlugin.render(geo, defaultTheme);
  if (!('completeSvg' in out)) throw new Error('no completeSvg');
  return out.completeSvg;
}

describe('PSystemListEmojiFactory.executeLine (java:47-57)', () => {
  const run = (line: string): PSystemListEmoji | undefined =>
    executeLine(sourceOf('@startuml\nx\n@enduml'), line, new PreprocessingArtifact());

  it.each(['emoji', 'EMOJI', 'emoji 1f6', 'Emoji 1F6'])('accepts %s', (line) => {
    expect(run(line)).toBeInstanceOf(PSystemListEmoji);
  });

  it.each(['emojis', 'emoji1f6', ' emoji', 'emoj', 'license'])('refuses %s', (line) => {
    expect(run(line)).toBeUndefined();
  });

  it('a bare `emoji` lists block 26; the code is lowercased and taken after the first space', () => {
    expect(getDescriptionOf(run('emoji'))).toBe('(List Emoji)');
    const svgDefault = renderText('@startuml\nemoji\n@enduml');
    expect(svgDefault).toBe(renderText('@startuml\nemoji 26\n@enduml'));
    expect(svgDefault).toContain('Emoji available on Unicode Block 26');
    expect(renderText('@startuml\nEMOJI 1F6\n@enduml')).toBe(renderText('@startuml\nemoji 1f6\n@enduml'));
  });

  it('refuses a 4-line source and a non-emoji line', () => {
    expect(parseRefusalOf(listEmojiPlugin.parse(sourceOf('@startuml\nemoji\nemoji\n@enduml')))?.commandScore).toBe(
      Number.NEGATIVE_INFINITY,
    );
    expect(parseRefusalOf(listEmojiPlugin.parse(sourceOf('@startuml\nfoo\n@enduml')))?.message).toBe('Syntax Error?');
  });
});

function getDescriptionOf(d: PSystemListEmoji | undefined): string | undefined {
  return d?.getDescription();
}

describe('PSystemListEmoji layout (java:100-136)', () => {
  it('is 1500 wide and lays three columns at dx 0 / 500 / 1000', () => {
    const svg = renderText('@startuml\nemoji 26\n@enduml');
    expect(svg).toContain('width:1501px');
    const n = [...getAll().keys()].filter((k) => k.startsWith('26')).length;
    expect(n).toBeGreaterThan(0);
    const third = Math.trunc((n + 2) / 3);
    expect(third).toBeGreaterThan(0);
    for (const dx of ['x="505', 'x="1005', 'x="5"']) expect(svg).toContain(dx);
  });
});

describe.skipIf(!existsSync(`${CORPUS_DIR}/${ROWS[0]![0]}/in.svg`))('corpus rows vs the jar', () => {
  it.each(ROWS)('%s (emoji %s) has zero compareSvg diffs', (slug) => {
    const puml = readFileSync(`${CORPUS_DIR}/${slug}/in.puml`, 'utf8');
    const jar = readFileSync(`${CORPUS_DIR}/${slug}/in.svg`, 'utf8');
    const { diffs } = compareSvg(renderText(puml), jar, 'deterministic');
    expect(diffs.map((d) => JSON.stringify(d))).toEqual([]);
  });

  it.each(ROWS)('%s renders identically three times', (slug) => {
    const puml = readFileSync(`${CORPUS_DIR}/${slug}/in.puml`, 'utf8');
    const first = renderText(puml);
    expect(renderText(puml)).toBe(first);
    expect(renderText(puml)).toBe(first);
  });
});
