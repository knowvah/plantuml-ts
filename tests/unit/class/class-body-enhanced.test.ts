import { describe, it, expect } from 'vitest';
import {
  isEnhancedBody,
  splitEnhancedBlocks,
  dedentRawLines,
} from '../../../src/diagrams/class/class-body-enhanced.js';
import { measureEnhancedBody, type EnhancedRowsPart } from '../../../src/diagrams/class/class-body-enhanced-layout.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { createSpriteRegistry, addSprite } from '../../../src/core/sprite-commands.js';
import { SpriteMonochrome } from '../../../src/core/klimt/sprite/SpriteMonochrome.js';

// ---------------------------------------------------------------------------
// isEnhancedBody — trigger detection
// ---------------------------------------------------------------------------

describe('isEnhancedBody', () => {
  it('is false for undefined (no rawBodyLines captured)', () => {
    expect(isEnhancedBody(undefined)).toBe(false);
  });

  it('is false for a plain member body with no separator/tree', () => {
    expect(isEnhancedBody(['+field: int', 'method()'])).toBe(false);
  });

  it('is true when any line is a bare `--` block separator', () => {
    expect(isEnhancedBody(['field', '--', 'method()'])).toBe(true);
  });

  it('is true when any line is a labeled `-- Label --` block separator', () => {
    expect(isEnhancedBody(['-- Label --', 'field'])).toBe(true);
  });

  it('is true for `==`/`__` separator variants', () => {
    expect(isEnhancedBody(['==', 'x'])).toBe(true);
    expect(isEnhancedBody(['__', 'x'])).toBe(true);
  });

  it('is true for a `..` separator but not for a bare `...`', () => {
    expect(isEnhancedBody(['..', 'x'])).toBe(true);
    expect(isEnhancedBody(['...'])).toBe(false);
  });

  it('is true when any line is a `|_` tree-start line (indented ok)', () => {
    expect(isEnhancedBody(['  |_ child'])).toBe(true);
  });

  it('is false for a `**bold**` member line (same-char guard, not a separator)', () => {
    expect(isEnhancedBody(['**Bar(Model)**'])).toBe(false);
  });

  // CDD B7FU-R2: `BodierLikeClassOrObject.java:96`'s fourth disjunct
  // (`EmbeddedDiagram.getEmbeddedType(s) != null`) -- a bare `{{ }}` opener
  // with NO separator/tree marker is "enhanced" on its own (moxobo-16-
  // tipo829/zikabo-17-gugi332's exact shape, `.agent-notes/cdd-T27.md`'s
  // "isEnhancedBody's missing disjunct" finding).
  it('is true when any line is a bare `{{` embedded-diagram opener, no separator/tree', () => {
    expect(isEnhancedBody(['{{', 'file f', '}}'])).toBe(true);
  });

  it('is true when a `{{` opener follows a surviving member line', () => {
    expect(isEnhancedBody(['- field', '{{', 'node n', '}}'])).toBe(true);
  });

  it('recognizes a typed `{{json` opener, not just the bare `{{` (uml) case', () => {
    expect(isEnhancedBody(['{{json', '{ "a": 1 }', '}}'])).toBe(true);
  });

  it('is false for a line that merely CONTAINS `{{` without it being a real opener', () => {
    // `getEmbeddedType` requires the line to START with `{{` after
    // whitespace-trim -- "a {{ b" never matches (EmbeddedDiagram.java:257
    // -366's own prefix check), so this stays a plain (non-enhanced) member
    // line, matching the classic-path fallback the module doc comment names.
    expect(isEnhancedBody(['a {{ b'])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// splitEnhancedBlocks — block structure
// ---------------------------------------------------------------------------

describe('splitEnhancedBlocks', () => {
  it('produces a single leading empty rows block (sep=_) for a body with no lines', () => {
    expect(splitEnhancedBlocks([])).toEqual([{ kind: 'rows', separator: { char: '_' }, lines: [] }]);
  });

  it('a plain member body (no separator/tree) is one rows block, initial sep', () => {
    expect(splitEnhancedBlocks(['a', 'b'])).toEqual([{ kind: 'rows', separator: { char: '_' }, lines: ['a', 'b'] }]);
  });

  it('a bare separator splits into a leading block and a trailing sep=char block', () => {
    expect(splitEnhancedBlocks(['coco', '--', 'toto'])).toEqual([
      { kind: 'rows', separator: { char: '_' }, lines: ['coco'] },
      { kind: 'rows', separator: { char: '-' }, lines: ['toto'] },
    ]);
  });

  it('a labeled separator captures its title, trimmed', () => {
    expect(splitEnhancedBlocks(['-- A1 --', 'coco'])).toEqual([
      { kind: 'rows', separator: { char: '_' }, lines: [] },
      { kind: 'rows', separator: { char: '-', title: 'A1' }, lines: ['coco'] },
    ]);
  });

  it('a bare 2-char separator ("--") carries no title (getTitle early return)', () => {
    const blocks = splitEnhancedBlocks(['--']);
    expect(blocks[1]).toEqual({ kind: 'rows', separator: { char: '-' }, lines: [] });
  });

  it('a contiguous |_ run becomes one tree block with level/text per cell', () => {
    // A4 2a: `text` keeps the single leading space `StripeTree#analyzeAndAdd`
    // leaves after stripping only `^\s*\|_` -- no `.trim()` here (the
    // creole/render layer strips it, `class-body-enhanced.ts#buildTreeRun`'s
    // own doc comment).
    const blocks = splitEnhancedBlocks(['|_ A1', '|_ b()', '  |_ b1', '  |_ b2', '    |_ b2.1', '|_ c()']);
    expect(blocks).toEqual([
      { kind: 'rows', separator: { char: '_' }, lines: [] },
      {
        kind: 'tree',
        cells: [
          { level: 1, text: ' A1' },
          { level: 1, text: ' b()' },
          { level: 2, text: ' b1' },
          { level: 2, text: ' b2' },
          { level: 3, text: ' b2.1' },
          { level: 1, text: ' c()' },
        ],
      },
      { kind: 'rows', lines: [] },
    ]);
  });

  it("purges the first tree line's own leading-indent prefix from every consumed line", () => {
    const blocks = splitEnhancedBlocks(['        |_ Tree item 11', '        |_ Tree item 12']);
    expect(blocks[1]).toEqual({
      kind: 'tree',
      cells: [
        { level: 1, text: ' Tree item 11' },
        { level: 1, text: ' Tree item 12' },
      ],
    });
  });

  it("computes tab-indent tree levels (StripeTree#computeLevel's tab branch)", () => {
    const blocks = splitEnhancedBlocks(['|_ a', '\t|_ b']);
    expect(blocks[1]).toEqual({
      kind: 'tree',
      cells: [
        { level: 1, text: ' a' },
        { level: 2, text: ' b' },
      ],
    });
  });

  it('a normal (non-tree) line after a tree run starts a new rows block, sep undefined', () => {
    const blocks = splitEnhancedBlocks(['|_ a', 'after']);
    expect(blocks).toEqual([
      { kind: 'rows', separator: { char: '_' }, lines: [] },
      { kind: 'tree', cells: [{ level: 1, text: ' a' }] },
      { kind: 'rows', lines: ['after'] },
    ]);
  });

  it("fecolo-08-gepu579's exact shape: labeled separator, one field, then a tree", () => {
    const blocks = splitEnhancedBlocks([
      '-- A1 --',
      'coco',
      '|_ A1',
      '|_ b()',
      '  |_ b1',
      '  |_ b2',
      '    |_ b2.1',
      '|_ c()',
    ]);
    expect(blocks).toEqual([
      { kind: 'rows', separator: { char: '_' }, lines: [] },
      { kind: 'rows', separator: { char: '-', title: 'A1' }, lines: ['coco'] },
      {
        kind: 'tree',
        cells: [
          { level: 1, text: ' A1' },
          { level: 1, text: ' b()' },
          { level: 2, text: ' b1' },
          { level: 2, text: ' b2' },
          { level: 3, text: ' b2.1' },
          { level: 1, text: ' c()' },
        ],
      },
      { kind: 'rows', lines: [] },
    ]);
  });
});

// ---------------------------------------------------------------------------
// dedentRawLines — G2 N44: BlocLines#trimSmart(1) port
// ---------------------------------------------------------------------------

describe('dedentRawLines', () => {
  it('returns an empty array for an empty input', () => {
    expect(dedentRawLines([])).toEqual([]);
  });

  it('is a no-op when the first line has no leading whitespace', () => {
    expect(dedentRawLines(['field', '--', 'method()'])).toEqual(['field', '--', 'method()']);
  });

  it("strips the first line's own leading-space count from every line", () => {
    expect(dedentRawLines(['    + public_member', '    --', '    - private_member'])).toEqual([
      '+ public_member',
      '--',
      '- private_member',
    ]);
  });

  it("strips at most the first line's own count, preserving relative indent", () => {
    // A line indented DEEPER than the reference keeps its extra indent
    // (matches BlocLines#trimSmart's per-line `min(nbStartingSpace, ...)`
    // clamp -- needed so `|_` tree-level computation still sees the extra
    // nesting after a body-wide dedent).
    expect(dedentRawLines(['  a', '    b'])).toEqual(['a', '  b']);
  });

  it("clamps to a shorter line's own leading-whitespace count (never goes negative)", () => {
    expect(dedentRawLines(['    a', '  b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('treats tabs the same as spaces (BlocLines#isSpaceOrTab)', () => {
    expect(dedentRawLines(['\t\tfield', '\t\t--'])).toEqual(['field', '--']);
  });

  it('an empty line is left untouched (BlocLines#removeStartingSpaces early return)', () => {
    expect(dedentRawLines(['  field', ''])).toEqual(['field', '']);
  });

  it('un-masks an indented bare separator for isEnhancedBody (benemi-22-dufo622 shape)', () => {
    const raw = ['    + public_member', '    --', '    - private_member'];
    expect(isEnhancedBody(raw)).toBe(false); // pre-dedent: masked by indentation
    expect(isEnhancedBody(dedentRawLines(raw))).toBe(true); // post-dedent: recognized
  });
});

// ---------------------------------------------------------------------------
// measureEnhancedBody -- row baseline bottom-anchor gate (CDD B7FU-R2)
// ---------------------------------------------------------------------------

describe('measureEnhancedBody — row y bottom-anchor is gated on an image atom', () => {
  // Same mechanism/citation as class-member-rows.ts#buildSectionRows's own
  // regression tests (exposant-01-class/sovuxo-25-tepi226): a sup/sub row's
  // Sea-inflated height must NOT shift `y`, only a sprite/img atom's does.
  // No current corpus fixture combines an enhanced body (separator/tree)
  // with a <sup>/<sub> member -- this is a precautionary consistency test
  // for the SAME gate `class-body-enhanced-layout.ts#buildRowsBlockRows`
  // now carries.
  function ctx(sprites?: ReturnType<typeof createSpriteRegistry>) {
    return {
      fontSpec: { family: 'sans-serif', size: 14 },
      measurer: new WidthTableMeasurer(),
      sprites,
      baselineOffset: 11,
      bodyTop: 0,
    };
  }

  function firstRowsPart(
    rawLines: readonly string[],
    sprites?: ReturnType<typeof createSpriteRegistry>,
  ): EnhancedRowsPart {
    const part = measureEnhancedBody(rawLines, ctx(sprites)).parts.find(
      (p): p is EnhancedRowsPart => p.kind === 'rows',
    );
    if (part === undefined) throw new Error('no rows part built');
    return part;
  }

  it('a <sup>/<sub> row (height inflated by Sea, no image atom) does NOT get the bottom-anchor shift', () => {
    const supOnly = firstRowsPart(['x<sup>2</sup>']);
    const flatY = supOnly.rows[0]!.y;
    expect(supOnly.rows[0]!.atoms?.every((a) => a.kind === 'text')).toBe(true);
    // Same block, same content top, but the PLAIN text sibling ("x") has NO
    // height inflation at all -- if the sup row wrongly bottom-anchored, its
    // `y` would differ from a plain row built the same way by exactly
    // `height(17) - fontSize(14) = 3`; asserting equality proves the gate
    // held (both take the flat `contentTop + baselineOffset` formula).
    const plain = firstRowsPart(['x']);
    expect(flatY).toBe(plain.rows[0]!.y);
  });

  it('an image-atom row (sprite) DOES get the bottom-anchor shift, matching class-member-rows.ts', () => {
    const registry = createSpriteRegistry();
    addSprite(registry, 'test', new SpriteMonochrome(50, 100, 16));
    const spritePart = firstRowsPart(['<$test>'], registry);
    expect(spritePart.rows[0]!.atoms?.some((a) => a.kind === 'image')).toBe(true);
    const plainPart = firstRowsPart(['x']);
    // The sprite row's height (100 * 14/13) genuinely differs from the
    // plain row's (14) -- the bottom-anchor gate must NOT collapse them to
    // the same flat `y` the way the sup/sub case above correctly does.
    expect(spritePart.rows[0]!.y).not.toBe(plainPart.rows[0]!.y);
  });
});
