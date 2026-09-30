/**
 * StyleBuilder — `style/StyleBuilder.java` (163 lines).
 *
 * Jar oracle (1.2026.8beta1):
 * - `fixtures/plantuml-skin-storage.json` — the jar's `StyleBuilder`
 *   storage after `plantuml.skin` alone (`@startmindmap / * r`), dumped
 *   with priorities.
 * - `fixtures/mindmap-idea-styles.json` — for two `<style>` snippets
 *   (below), the jar's full storage and every `Idea.getStyle()`.
 * - `StyleProbe` (T0c, `plans/mindmap-engine-port/tools/probe/`) PName
 *   lines, quoted inline where pinned.
 *
 * `Idea.getStyle()` (Idea.java:95-104) starts at `STEP_BY_PARENT * 1000`
 * in Java `int` arithmetic: `STEP_BY_PARENT` is `1000_1000`
 * (WElement.java:110), and 10001000 * 1000 overflows to 1411065408 — the
 * jar's own priorities confirm it (`:depth(2) *` FontColor stored at 326
 * reads back at 1411065734 = 326 + 1411065408).
 */
import { describe, expect, it } from 'vitest';
import { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { Style } from '../../../../src/core/style/Style.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import { MergeStrategy } from '../../../../src/core/style/MergeStrategy.js';
import { ValueImpl } from '../../../../src/core/style/ValueImpl.js';
import type { PName } from '../../../../src/core/style/PName.js';
import type { SName } from '../../../../src/core/style/SName.js';
import type { Value } from '../../../../src/core/style/Value.js';
import {
  dumpStyle,
  ideaScenarioDump,
  skinStorageDump,
  styleFromDump,
  type DumpedStyle,
} from './helpers/style-fixture.js';

/** WElement.java:110 — `1000_1000`. */
const STEP_BY_PARENT = 10001000;
/** Idea.java:97 `STEP_BY_PARENT * 1000`, as a Java `int` (wraps). */
const IDEA_DELTA0 = Math.imul(STEP_BY_PARENT, 1000);

const NODE: readonly SName[] = ['root', 'element', 'mindmapDiagram', 'node'];

function style(sig: StyleSignatureBasic, values: Record<string, [string, number]>): Style {
  const map = new Map<PName, Value>();
  for (const [k, [v, p]] of Object.entries(values)) map.set(k as PName, ValueImpl.regular(v, p));
  return new Style(sig, map);
}

/** Every stored PName as `asString()`, the shape `StyleProbe` prints. */
function probeLines(s: Style | undefined): Record<string, string | null> {
  if (s === undefined) return {};
  const out: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(dumpStyle(s).values)) out[k] = v[0];
  return out;
}

function skinBuilder(): StyleBuilder {
  return new StyleBuilder().muteStyle(skinStorageDump().map(styleFromDump));
}

/** `<style>` of cejije-94-xibi793, as `StyleParser` builds it (priorities jar-dumped). */
const DEPTH_STYLES: readonly DumpedStyle[] = [
  {
    snames: [],
    level: 2,
    star: true,
    stereotypes: [],
    values: { FontColor: ['red', null, 326], BackGroundColor: ['blue', null, 327] },
  },
];

/**
 * ```
 * mindmapDiagram {
 *   node { BackGroundColor lightGreen }
 *   :depth(1) { LineColor green  Padding 4 8 }
 *   .foo { BackGroundColor red  LineStyle 5-3  MaximumWidth 60 }
 *   .foo * { FontColor #00ff00 }
 *   leafNode { RoundCorner 3 }
 *   rootNode { FontStyle bold  FontWeight 300 }
 * }
 * ```
 * Stereotype styles carry `+ DELTA_PRIORITY_FOR_STEREOTYPE` (StyleLoader.java:178-183).
 */
const STEREO_STYLES: readonly DumpedStyle[] = [
  {
    snames: ['mindmapDiagram', 'node'],
    level: -1,
    star: false,
    stereotypes: [],
    values: { BackGroundColor: ['lightGreen', null, 326] },
  },
  {
    snames: ['mindmapDiagram'],
    level: 1,
    star: false,
    stereotypes: [],
    values: { LineColor: ['green', null, 327], Padding: ['4 8', null, 328] },
  },
  {
    snames: ['mindmapDiagram'],
    level: -1,
    star: false,
    stereotypes: ['foo'],
    values: {
      BackGroundColor: ['red', null, 1329],
      LineStyle: ['5-3', null, 1330],
      MaximumWidth: ['60', null, 1331],
    },
  },
  {
    snames: ['mindmapDiagram'],
    level: -1,
    star: true,
    stereotypes: ['foo'],
    values: { FontColor: ['#00ff00', null, 1332] },
  },
  {
    snames: ['mindmapDiagram', 'leafNode'],
    level: -1,
    star: false,
    stereotypes: [],
    values: { RoundCorner: ['3', null, 333] },
  },
  {
    snames: ['mindmapDiagram', 'rootNode'],
    level: -1,
    star: false,
    stereotypes: [],
    values: { FontStyle: ['bold', null, 334], FontWeight: ['300', null, 335] },
  },
];

interface IdeaQuery {
  readonly snames: readonly SName[];
  readonly stereotype?: string;
}

/** `Idea.getDefaultStyleDefinitionNode(level)` (Idea.java:65-90) for a given node. */
function nodeSignature(q: IdeaQuery, level: number): StyleSignatureBasic {
  const sig = StyleSignatureBasic.of(...q.snames);
  return (q.stereotype === undefined ? sig : sig.addStereotype(q.stereotype)).addLevel(level);
}

/**
 * `Idea.getStyle()` (Idea.java:95-104): own node special at DELTA0, then
 * each ancestor's definition AT THIS NODE'S LEVEL, starred, one step lower.
 */
function ideaGetStyle(builder: StyleBuilder, chain: readonly IdeaQuery[], level: number): Style | undefined {
  const [self, ...ancestors] = chain;
  let deltaPriority = IDEA_DELTA0;
  let result = builder.getMergedStyleSpecial(nodeSignature(self as IdeaQuery, level), deltaPriority);
  for (const up of ancestors) {
    const ss = nodeSignature(up, level).addStar();
    deltaPriority -= STEP_BY_PARENT;
    result = result?.mergeWith(
      builder.getMergedStyleSpecial(ss, deltaPriority),
      MergeStrategy.OVERWRITE_EXISTING_VALUE,
    );
  }
  return result;
}

describe('StyleBuilder — muteStyle / loadInternal', () => {
  const sig = StyleSignatureBasic.of('root', 'element');

  it('muteStyle merges a second style on the same signature with OVERWRITE_EXISTING_VALUE', () => {
    const first = style(sig, { FontColor: ['black', 4], FontSize: ['14', 5] });
    const second = style(sig, { FontColor: ['red', 9], Padding: ['3', 1] });
    const b = new StyleBuilder().muteStyle([first, second]);
    expect(probeLines(b.getMergedStyle(sig))).toEqual({ FontColor: 'red', FontSize: '14', Padding: '3' });
  });

  it('muteStyle keeps the higher-priority value when the new one is lower', () => {
    const first = style(sig, { FontColor: ['black', 9] });
    const second = style(sig, { FontColor: ['red', 2] });
    const b = new StyleBuilder().muteStyle([first, second]);
    expect(b.getMergedStyle(sig)?.value('FontColor').asString()).toBe('black');
  });

  it('muteStyle returns a new builder and leaves the receiver untouched', () => {
    const base = new StyleBuilder();
    const muted = base.muteStyle([style(sig, { FontColor: ['red', 1] })]);
    expect(muted).not.toBe(base);
    expect(base.getMergedStyle(sig)).toBeUndefined();
    expect(muted.getMergedStyle(sig)?.value('FontColor').asString()).toBe('red');
  });

  it('muteStyle copies the counter', () => {
    const base = new StyleBuilder();
    base.getNextInt();
    base.getNextInt();
    expect(base.muteStyle([]).getNextInt()).toBe(3);
  });

  it('loadInternal stores, then merges into, a style in place', () => {
    const b = new StyleBuilder();
    b.loadInternal(sig, style(sig, { FontColor: ['black', 1] }));
    b.loadInternal(sig, style(sig, { FontColor: ['red', 2], FontSize: ['9', 3] }));
    expect(probeLines(b.getMergedStyle(sig))).toEqual({ FontColor: 'red', FontSize: '9' });
  });

  it('loadInternal rejects a starred signature (IllegalArgumentException)', () => {
    expect(() => new StyleBuilder().loadInternal(sig.addStar(), style(sig, {}))).toThrow('IllegalArgumentException');
  });
});

describe('StyleBuilder — getMergedStyle (StyleProbe merged)', () => {
  it('root node on plantuml.skin', () => {
    const sig = StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'node', 'rootNode').addLevel(0);
    expect(probeLines(skinBuilder().getMergedStyle(sig))).toEqual({
      Shadowing: '0.0',
      FontName: 'SansSerif',
      FontColor: 'black',
      FontSize: '14',
      FontStyle: 'plain',
      BackGroundColor: '#f1f1f1',
      RoundCorner: '25',
      LineThickness: '1.5',
      DiagonalCorner: '0',
      HyperLinkColor: 'blue',
      HyperlinkUnderlineThickness: '1',
      LineColor: '#181818',
      Padding: '10',
      Margin: '10',
      HorizontalAlignment: 'left',
    });
  });

  it('mindmap arrow on plantuml.skin (Idea.getStyleArrow signature)', () => {
    const sig = StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'arrow').addLevel(0);
    expect(probeLines(skinBuilder().getMergedStyle(sig))).toEqual({
      Shadowing: '0.0',
      FontName: 'SansSerif',
      FontColor: 'black',
      FontSize: '13',
      FontStyle: 'plain',
      BackGroundColor: 'black',
      RoundCorner: '0',
      LineThickness: '1.0',
      DiagonalCorner: '0',
      HyperLinkColor: 'blue',
      HyperlinkUnderlineThickness: '1',
      LineColor: '#181818',
      HorizontalAlignment: 'left',
    });
  });

  it('stereotyped level-1 node: a starred `.foo *` rule matches the unstarred query, no delta', () => {
    const b = skinBuilder().muteStyle(STEREO_STYLES.map(styleFromDump));
    const sig = StyleSignatureBasic.of(...NODE)
      .addLevel(1)
      .addStereotype('foo');
    const merged = b.getMergedStyle(sig);
    expect(probeLines(merged)).toMatchObject({
      FontColor: '#00ff00',
      BackGroundColor: 'red',
      LineColor: 'green',
      LineStyle: '5-3',
      Padding: '4 8',
      MaximumWidth: '60',
      FontStyle: 'plain',
    });
    expect(merged?.value('FontColor').getPriority()).toBe(1332);
  });

  it('caches per signature value: an equal signature returns the same Style instance', () => {
    const b = skinBuilder();
    const a1 = b.getMergedStyle(StyleSignatureBasic.of('root', 'element').addLevel(0));
    const a2 = b.getMergedStyle(StyleSignatureBasic.of('element', 'root').addLevel(0));
    expect(a2).toBe(a1);
    expect(skinBuilder().getMergedStyle(StyleSignatureBasic.of('root', 'element').addLevel(0))).not.toBe(a1);
  });

  it('returns undefined when nothing matches, and does not cache the miss', () => {
    const b = new StyleBuilder();
    const sig = StyleSignatureBasic.of('leafNode').addLevel(0);
    expect(b.getMergedStyle(sig)).toBeUndefined();
    b.loadInternal(StyleSignatureBasic.of('leafNode'), style(StyleSignatureBasic.of('leafNode'), { Margin: ['2', 1] }));
    expect(b.getMergedStyle(sig)?.value('Margin').asString()).toBe('2');
  });

  it('`# no style matched signature [leafNode]  0 []` on plantuml.skin', () => {
    expect(skinBuilder().getMergedStyle(StyleSignatureBasic.of('leafNode').addLevel(0))).toBeUndefined();
  });
});

describe('StyleBuilder — getMergedStyleSpecial (StyleProbe special)', () => {
  it('returns undefined (Java null) when no stored style matches', () => {
    const sig = StyleSignatureBasic.of('leafNode').addLevel(0);
    expect(skinBuilder().getMergedStyleSpecial(sig, IDEA_DELTA0)).toBeUndefined();
  });

  it(':depth(2) * matches a level-2 node and lifts only the starred declaration by the delta', () => {
    const b = skinBuilder().muteStyle(DEPTH_STYLES.map(styleFromDump));
    const merged = b.getMergedStyleSpecial(StyleSignatureBasic.of(...NODE).addLevel(2), IDEA_DELTA0);
    expect(probeLines(merged)).toEqual({
      Shadowing: '0.0',
      FontName: 'SansSerif',
      FontColor: 'red',
      FontSize: '14',
      FontStyle: 'plain',
      BackGroundColor: 'blue',
      RoundCorner: '25',
      LineThickness: '1.5',
      DiagonalCorner: '0',
      HyperLinkColor: 'blue',
      HyperlinkUnderlineThickness: '1',
      LineColor: '#181818',
      Padding: '10',
      Margin: '10',
      HorizontalAlignment: 'left',
    });
    expect(merged?.value('FontColor').getPriority()).toBe(1411065734);
    expect(merged?.value('FontSize').getPriority()).toBe(5);
  });

  it('a starred level-3 query matches only starred declarations', () => {
    const b = skinBuilder().muteStyle(DEPTH_STYLES.map(styleFromDump));
    const sig = StyleSignatureBasic.of(...NODE)
      .addLevel(3)
      .addStar();
    const merged = b.getMergedStyleSpecial(sig, IDEA_DELTA0 - STEP_BY_PARENT);
    expect(probeLines(merged)).toEqual({ FontColor: 'red', BackGroundColor: 'blue' });
    expect(merged?.value('BackGroundColor').getPriority()).toBe(327 + IDEA_DELTA0 - STEP_BY_PARENT);
  });

  it('stereotyped root node', () => {
    const b = skinBuilder().muteStyle(STEREO_STYLES.map(styleFromDump));
    const sig = StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'node', 'rootNode')
      .addStereotype('foo')
      .addLevel(0);
    expect(probeLines(b.getMergedStyleSpecial(sig, IDEA_DELTA0))).toEqual({
      Shadowing: '0.0',
      FontName: 'SansSerif',
      FontColor: '#00ff00',
      FontSize: '14',
      FontStyle: 'bold',
      FontWeight: '300',
      BackGroundColor: 'red',
      RoundCorner: '25',
      LineThickness: '1.5',
      DiagonalCorner: '0',
      HyperLinkColor: 'blue',
      HyperlinkUnderlineThickness: '1',
      LineColor: '#181818',
      LineStyle: '5-3',
      Padding: '10',
      Margin: '10',
      MaximumWidth: '60',
      HorizontalAlignment: 'left',
    });
  });
});

describe('StyleBuilder — Idea.getStyle() walk equals the jar (star + level + deltaPriority)', () => {
  const ROOT: IdeaQuery = { snames: [...NODE, 'rootNode'] };
  const NODE_Q: IdeaQuery = { snames: NODE };
  const LEAF: IdeaQuery = { snames: [...NODE, 'leafNode'] };
  const foo = (q: IdeaQuery): IdeaQuery => ({ ...q, stereotype: 'foo' });

  const depthChains: Record<string, readonly IdeaQuery[]> = {
    r0: [ROOT],
    a: [NODE_Q, ROOT],
    a1: [NODE_Q, NODE_Q, ROOT],
    a11: [LEAF, NODE_Q, NODE_Q, ROOT],
  };
  const stereoChains: Record<string, readonly IdeaQuery[]> = {
    'r ': [foo(ROOT)],
    a: [NODE_Q, foo(ROOT)],
    a1: [LEAF, NODE_Q, foo(ROOT)],
    'b ': [foo(NODE_Q), foo(ROOT)],
    b1: [LEAF, foo(NODE_Q), foo(ROOT)],
  };

  it.each([
    ['depth', DEPTH_STYLES, depthChains],
    ['stereo', STEREO_STYLES, stereoChains],
  ] as const)('%s: every idea (values, priorities, merged signature)', (name, styles, chains) => {
    const b = skinBuilder().muteStyle(styles.map(styleFromDump));
    const { ideas } = ideaScenarioDump(name);
    expect(ideas.length).toBeGreaterThan(3);
    for (const idea of ideas) {
      const chain = chains[idea.label];
      if (chain === undefined) throw new Error(`no chain for ${idea.label}`);
      const got = ideaGetStyle(b, chain, idea.level);
      expect({ label: idea.label, style: got === undefined ? undefined : dumpStyle(got) }).toEqual({
        label: idea.label,
        style: idea.style,
      });
    }
  });
});

describe('StyleBuilder — cloneMe / createStyleStereotype / getNextInt', () => {
  it('getNextInt counts from 1 (AutomaticCounter)', () => {
    const b = new StyleBuilder();
    expect([b.getNextInt(), b.getNextInt(), b.getNextInt()]).toEqual([1, 2, 3]);
  });

  it('cloneMe copies storage and counter into an independent builder', () => {
    const sig = StyleSignatureBasic.of('root');
    const b = new StyleBuilder();
    b.loadInternal(sig, style(sig, { FontColor: ['red', 1] }));
    b.getNextInt();
    const c = b.cloneMe();
    expect(c.getNextInt()).toBe(2);
    expect(b.getNextInt()).toBe(2);
    c.loadInternal(sig, style(sig, { FontColor: ['blue', 5] }));
    expect(c.getMergedStyle(sig)?.value('FontColor').asString()).toBe('blue');
    expect(b.getMergedStyle(sig)?.value('FontColor').asString()).toBe('red');
  });

  it('createStyleStereotype returns the stored stereotype style, lowercasing the name', () => {
    const sig = StyleSignatureBasic.createStereotype('foo');
    const b = new StyleBuilder().muteStyle([style(sig, { BackGroundColor: ['red', 1] })]);
    const got = b.createStyleStereotype('FOO');
    expect(got.value('BackGroundColor').asString()).toBe('red');
    expect(got.getSignature().equals(sig)).toBe(true);
  });

  it('createStyleStereotype returns an empty style when none is stored', () => {
    const got = new StyleBuilder().createStyleStereotype('Bar');
    expect(got.hasValue('BackGroundColor')).toBe(false);
    expect([...got.getSignature().getStereotypes()]).toEqual(['bar']);
  });

  it('createStyleStereotype rejects a name containing the star', () => {
    expect(() => new StyleBuilder().createStyleStereotype('a*')).toThrow('IllegalArgumentException');
  });
});
