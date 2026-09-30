/**
 * FromSkinparamToStyle (mindmap subset) — `style/FromSkinparamToStyle.java`
 * (431 lines), full table ported (see the module's own doc comment for
 * why). Values pinned against `StyleProbe` (T0c) runs on the real jar
 * (1.2026.8beta1), quoted per test, not guessed (D8).
 *
 * `KNOWN_GAP_KEYS` is the exact 20-key list this task's mission brief
 * asked to re-verify (the retry note claimed 21, unconfirmed): every
 * distinct skinparam key the 7 corpus skinparam fixtures
 * (`test-results/dot-cache/mindmap/*\/in.puml`) plus the `aws-orange`
 * theme fixture (`nukose-24-funi267`, expanded through `preprocess()`)
 * yield, for which `convertSkinparam` returns zero `Style`s. Re-derived
 * here from the real fixtures/theme, not copied from the retry note.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { convertSkinparam } from '../../../../src/core/style/FromSkinparamToStyle.js';
import { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { preprocess } from '../../../../src/core/preprocessor.js';

const MINDMAP_CORPUS_DIR = new URL('../../../../test-results/dot-cache/mindmap/', import.meta.url);

/** One `Style`'s signature SNames plus its single `PName=value` pin, read via `.asString()`. */
function pin(styles: readonly ReturnType<typeof convertSkinparam>[number][], index: number, propertyName: string) {
  const style = styles[index];
  if (style === undefined) throw new Error(`no Style at index ${String(index)}`);
  return { names: style.getSignature().names, value: style.value(propertyName as never).asString() };
}

describe('convertSkinparam — mindmap corpus keys', () => {
  it('shadowing false -> root.Shadowing=0 (StyleProbe: Shadowing=0)', () => {
    const styles = convertSkinparam('shadowing', 'false', new StyleBuilder());
    expect(styles).toHaveLength(1);
    expect(pin(styles, 0, 'Shadowing')).toEqual({ names: ['root'], value: '0' });
  });

  it('shadowing true -> root.Shadowing=3', () => {
    const styles = convertSkinparam('shadowing', 'true', new StyleBuilder());
    expect(pin(styles, 0, 'Shadowing')).toEqual({ names: ['root'], value: '3' });
  });

  it('arrowcolor #1ba1e2 -> arrow.LineColor (StyleProbe: LineColor=#1ba1e2)', () => {
    const styles = convertSkinparam('arrowcolor', '#1ba1e2', new StyleBuilder());
    expect(styles).toHaveLength(1);
    expect(pin(styles, 0, 'LineColor')).toEqual({ names: ['arrow'], value: '#1ba1e2' });
  });

  it('backgroundcolor #302934 -> document.BackGroundColor (StyleProbe: BackGroundColor=#302934)', () => {
    const styles = convertSkinparam('backgroundcolor', '#302934', new StyleBuilder());
    expect(styles).toHaveLength(1);
    expect(pin(styles, 0, 'BackGroundColor')).toEqual({ names: ['document'], value: '#302934' });
  });

  it('backgroundcolor #EEEBDC (the other corpus value) -> document.BackGroundColor', () => {
    const styles = convertSkinparam('backgroundcolor', '#EEEBDC', new StyleBuilder());
    expect(pin(styles, 0, 'BackGroundColor')).toEqual({ names: ['document'], value: '#EEEBDC' });
  });

  it('defaulttextalignment center -> root.HorizontalAlignment (StyleProbe on root,...,node,rootNode: HorizontalAlignment=center)', () => {
    const styles = convertSkinparam('defaulttextalignment', 'center', new StyleBuilder());
    expect(styles).toHaveLength(1);
    expect(pin(styles, 0, 'HorizontalAlignment')).toEqual({ names: ['root'], value: 'center' });
  });

  for (const key of ['dpi', 'monochrome', 'handwritten']) {
    it(`${key} produces no Style (SkinParam.java consumes it directly, not through the style system)`, () => {
      expect(convertSkinparam(key, 'true', new StyleBuilder())).toHaveLength(0);
    });
  }
});

describe('convertSkinparam — aws-orange theme keys (magic/font/spot rows)', () => {
  it('nodeBackgroundColor -> node.BackGroundColor, reachable by mindmap (shared SName.node; StyleProbe: BackGroundColor=#123456)', () => {
    const styles = convertSkinparam('nodebackgroundcolor', '#123456', new StyleBuilder());
    expect(styles).toHaveLength(1);
    expect(pin(styles, 0, 'BackGroundColor')).toEqual({ names: ['node'], value: '#123456' });
  });

  it('titleFontSize 33 -> document+title.FontSize (StyleProbe on document,title: FontSize=33)', () => {
    const styles = convertSkinparam('titlefontsize', '33', new StyleBuilder());
    expect(styles).toHaveLength(1);
    expect(pin(styles, 0, 'FontSize')).toEqual({ names: ['document', 'title'], value: '33' });
  });

  it('stereotypeCBackgroundColor -> spotClass.BackGroundColor (StyleProbe on spotClass: BackGroundColor=#abcdef)', () => {
    const styles = convertSkinparam('stereotypecbackgroundcolor', '#abcdef', new StyleBuilder());
    expect(styles).toHaveLength(1);
    expect(pin(styles, 0, 'BackGroundColor')).toEqual({ names: ['spotClass'], value: '#abcdef' });
  });

  it('boxpadding and usebetastyle (theme-only, non-style aws-orange keys) produce no Style', () => {
    expect(convertSkinparam('boxpadding', '40', new StyleBuilder())).toHaveLength(0);
    expect(convertSkinparam('usebetastyle', 'false', new StyleBuilder())).toHaveLength(0);
  });
});

/**
 * Every distinct skinparam key the mindmap corpus's 7 skinparam fixtures
 * plus the `aws-orange` theme fixture yield, gathered the same way the
 * mission brief's step 1 describes: `preprocess()` over each `in.puml`
 * that mentions `skinparam`/`!theme`, unioned by first-seen value.
 */
function collectCorpusAndThemeSkinparams(): ReadonlyMap<string, string> {
  const keys = new Map<string, string>();
  for (const slug of readdirSync(MINDMAP_CORPUS_DIR)) {
    let text: string;
    try {
      text = readFileSync(new URL(`${slug}/in.puml`, MINDMAP_CORPUS_DIR), 'utf8');
    } catch {
      continue;
    }
    if (!text.includes('skinparam') && !text.includes('!theme')) continue;
    for (const [key, value] of preprocess(text).skinparam) if (!keys.has(key)) keys.set(key, value);
  }
  return keys;
}

/**
 * The exact 20-key gap list (see the module's own doc comment, and this
 * file's header): re-verifies the retry note's unconfirmed count of 21.
 */
const KNOWN_GAP_KEYS = new Set([
  'dpi',
  'monochrome',
  'handwritten',
  'boxpadding',
  'usebetastyle',
  'classstereotypefontcolor',
  'objectstereotypefontcolor',
  'participantparticipantborderthickness',
  'sequencearrowthickness',
  'sequencebackgroundcolor',
  'sequencebordercolor',
  'sequenceendcolor',
  'sequencegroupbodybackgroundcolor',
  'sequencegroupheaderbackgroundcolor',
  'sequencelifelineborderthickness',
  'sequencereferenceheaderfontcolor',
  'sequencestartcolor',
  'sequencetitlefontcolor',
  'stateendcolor',
  'statestartcolor',
]);

describe('convertSkinparam — full corpus+theme completeness (regression guard)', () => {
  it('produces at least one Style for every key NOT in KNOWN_GAP_KEYS, and exactly the 20 known gaps', () => {
    const allKeys = collectCorpusAndThemeSkinparams();
    const measuredGaps: string[] = [];
    for (const [key, value] of allKeys) {
      const styles = convertSkinparam(key, value, new StyleBuilder());
      if (styles.length === 0) measuredGaps.push(key);
    }
    expect(new Set(measuredGaps)).toEqual(KNOWN_GAP_KEYS);
  });
});
