/**
 * `WBSDiagramFactory` (wbs/WBSDiagramFactory.java:6-25): the command order,
 * the common commands before the wbs commands, the standard refusal for a
 * line no command matches, and the parse outcome of the 204 cached wbs
 * sources (`test-results/dot-cache/wbs/`).
 *
 * Observable discriminators (not mocks): `CommandWBSItemOld` (and only it,
 * `CommandWBSItemMultilineOld` for blocks) adds the warning
 * "Please define Direction/Shape before Color/Id." (CommandWBSItemOld.java:66);
 * the `"x" as c` form registers code `c`, which a later link resolves.
 *
 * Corpus outcomes: the 26 stock-error rows of `plans/wbs-engine-port/
 * fixtures.md` (20 "Syntax Error?", 3 "Bad tree structure", 3 "WBS diagram
 * only accepts one root first declared.") refuse at the 0-based document
 * line below (fixtures.md's 1-based `l.N` minus one). The 2 jar crash rows
 * (`ledama-83-xoko366`, `link-URL-tooltip-0`) PARSE: the jar throws at
 * render, `SvgGraphics$LinkData.getXlinkTitle` (SvgGraphics.java:1156).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import { isEmpty } from '../../../src/core/annotations/index.js';
import type { ParseRefusal } from '../../../src/core/parse-refusal.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { parseWbs } from '../../../src/diagrams/wbs/WBSDiagramFactory.js';
import type { WBSDiagram } from '../../../src/diagrams/wbs/WBSDiagram.js';

const CORPUS = 'test-results/dot-cache/wbs';
const OLD_ORDER_WARNING = 'Please define Direction/Shape before Color/Id.';
const SYNTAX = 'Syntax Error?';
const BAD_TREE = 'Bad tree structure';
const ONE_ROOT = 'WBS diagram only accepts one root first declared.';

/** The render pipeline's `UmlSource` for a `.puml` text (`index.ts#umlSourceOfBlock`). */
function parse(text: string): WBSDiagram | ParseRefusal {
  const block = buildBlockUmls(text)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  const source = {
    ...block.source,
    rawStyles: block.preprocessed.styles,
    stylePositions: block.preprocessed.stylePositions,
    styleSource: block.preprocessed,
  };
  return parseWbs(source, new PreprocessingArtifact());
}

function parsed(body: string): WBSDiagram {
  const result = parse(`@startwbs\n${body}\n@endwbs`);
  if ('refused' in result) throw new Error(`refused: ${result.message} @${result.line}`);
  return result;
}

function refusedWith(body: string): ParseRefusal {
  const result = parse(`@startwbs\n${body}\n@endwbs`);
  if (!('refused' in result)) throw new Error('expected a refusal');
  return result;
}

function warnings(d: WBSDiagram): string[] {
  return d.getWarnings().map((w) => w.asSingleLine());
}

describe('WBSDiagramFactory dispatch order (WBSDiagramFactory.java:9-15)', () => {
  it('lets CommandWBSItemNew win a line both forms match', () => {
    expect(warnings(parsed('* root\n**[#red] a'))).toEqual([]);
  });

  it('reaches CommandWBSItemOld for a colour-before-shape line only it matches', () => {
    expect(warnings(parsed('* root\n**[#red]_ a'))).toEqual([OLD_ORDER_WARNING]);
  });

  it('reaches the "x" as c form (mode 1) before the plain label form (mode 0)', () => {
    const d = parsed('* root\n** "x" as c\n**(d) y\nc -> d');
    expect(warnings(d)).toEqual([]);
  });

  it('keeps mode 0 for a plain label: the code is not the label text', () => {
    const r = refusedWith('* root\n** "x" as c\n**(d) y\nx -> d');
    expect(r.kind).toBe('execution');
  });

  it('runs a New multiline block without the Old warning', () => {
    expect(warnings(parsed('* root\n**:a\nb;'))).toEqual([]);
  });

  it('runs an Old-only multiline block with the Old warning', () => {
    expect(warnings(parsed('* root\n**[#red]_:a\nb;'))).toEqual([OLD_ORDER_WARNING]);
  });

  it('resolves a link line through CommandWBSLink last', () => {
    const d = parsed('* root\n**(a) one\n**(b) two\na -> b');
    expect(warnings(d)).toEqual([]);
  });

  it('moves on from an unterminated multiline start to a syntax refusal', () => {
    const r = refusedWith('* root\n**:a');
    expect([r.kind, r.message, r.line]).toEqual(['syntax', SYNTAX, 2]);
  });
});

describe('WBSDiagramFactory common commands run before the wbs commands (CommonCommands.addCommonCommands1)', () => {
  it('stores a title in the diagram annotations before the first item', () => {
    const d = parsed('title My WBS\n* root');
    expect(isEmpty(d.annotations)).toBe(false);
  });

  it('stores a scale spec', () => {
    const d = parsed('scale 2\n* root');
    expect(d.scale).toBeDefined();
  });

  it('skips blank lines and tolerates a hand-built @startwbs/@endwbs line', () => {
    const result = parseWbs(
      { lines: ['@startwbs', '', '* root', '@endwbs'], type: 'wbs' },
      new PreprocessingArtifact(),
    );
    expect('refused' in result).toBe(false);
  });
});

describe('WBSDiagramFactory refusals', () => {
  it('refuses a line no command matches with the standard error, at its document line', () => {
    const r = refusedWith('* root\nnot a command');
    expect([r.kind, r.message, r.line, r.consumed]).toEqual(['syntax', SYNTAX, 2, 1]);
  });

  it('turns a failing command into an execution refusal carrying its message', () => {
    const r = refusedWith('* root\n*** deep');
    expect([r.kind, r.message]).toEqual(['execution', BAD_TREE]);
  });
});

describe('WBSDiagramFactory style and skinparam handling', () => {
  it('adds the skinparam deprecation warning for padding', () => {
    expect(warnings(parsed('skinparam padding 3\n* root'))).toEqual([
      'Please use CSS style instead of skinparam padding',
    ]);
  });

  it('accepts a <style> block and keeps parsing', () => {
    const d = parsed('<style>\nwbsDiagram {\n  node { BackGroundColor red }\n}\n</style>\n* root');
    expect(d.getDescription()).toBe('Work Breakdown Structure');
  });

  it('refuses a <style> block the parser rejects (CommandStyleMultilinesCSS.java:92-93)', () => {
    const result = parseWbs(
      { lines: ['* root'], type: 'wbs', styleSource: { skinparam: new Map(), styles: ['node { { }'] } },
      new PreprocessingArtifact(),
    );
    expect(result).toMatchObject({ refused: true, kind: 'execution', line: 0 });
    expect('refused' in result && result.message.startsWith('Error in style definition: ')).toBe(true);
  });
});

/** slug -> [kind, 0-based document line, message]; fixtures.md "jar error?" column. */
const REFUSED: Readonly<Record<string, readonly [string, number, string]>> = {
  'WBS-monoline-def-0-11': ['syntax', 5, SYNTAX],
  'WBS-monoline-def-0-17': ['syntax', 5, SYNTAX],
  'WBS-monoline-def-0-18': ['syntax', 5, SYNTAX],
  'WBS-monoline-def-0-24': ['syntax', 5, SYNTAX],
  'WBS-monoline-def-0-3': ['execution', 2, BAD_TREE],
  'WBS-monoline-def-0-6': ['syntax', 5, SYNTAX],
  'WBS-multiline-def-1-14': ['syntax', 5, SYNTAX],
  'WBS-multiline-def-1-15': ['syntax', 5, SYNTAX],
  'WBS-multiline-def-1-21': ['syntax', 5, SYNTAX],
  'WBS-multiline-def-1-3': ['syntax', 5, SYNTAX],
  'WBS-multiline-def-1-8': ['syntax', 5, SYNTAX],
  'bujigo-66-zepu613': ['syntax', 5, SYNTAX],
  'cesoke-21-muro498': ['syntax', 5, SYNTAX],
  'cofele-91-sanu676': ['syntax', 5, SYNTAX],
  'cupuri-11-piru303': ['execution', 29, BAD_TREE],
  'fasuti-82-dire353': ['syntax', 5, SYNTAX],
  'kifona-80-bufa102': ['syntax', 5, SYNTAX],
  'konipe-99-jafu307': ['syntax', 5, SYNTAX],
  'lagoda-51-zuna611': ['syntax', 5, SYNTAX],
  'sefoxo-37-zuvo274': ['syntax', 5, SYNTAX],
  'sipuja-30-deto581': ['execution', 2, BAD_TREE],
  'solive-57-nola542': ['syntax', 5, SYNTAX],
  'tojixi-05-lusu056': ['execution', 2, ONE_ROOT],
  'tubeli-58-kadi729': ['execution', 3, ONE_ROOT],
  'vavibi-10-maso573': ['syntax', 5, SYNTAX],
  'zecavo-98-kini554': ['execution', 2, ONE_ROOT],
};

const JAR_CRASH_ROWS = ['ledama-83-xoko366', 'link-URL-tooltip-0'];

describe('WBSDiagramFactory over the 204 cached wbs sources', () => {
  const slugs = readdirSync(CORPUS).sort();

  it('collects the whole corpus', () => {
    expect(slugs).toHaveLength(204);
  });

  it('refuses exactly the stock-error rows, with the jar strings at the jar lines', () => {
    const actual: Record<string, readonly [string, number, string]> = {};
    for (const slug of slugs) {
      const result = parse(readFileSync(`${CORPUS}/${slug}/in.puml`, 'utf8'));
      if ('refused' in result) actual[slug] = [result.kind, result.line, result.message];
    }
    expect(actual).toEqual(REFUSED);
    expect(Object.keys(actual)).toHaveLength(26);
  });

  it.each(JAR_CRASH_ROWS)('parses the jar-crash row %s (the jar throws at render, not parse)', (slug) => {
    const result = parse(readFileSync(`${CORPUS}/${slug}/in.puml`, 'utf8'));
    expect('refused' in result).toBe(false);
  });
});
