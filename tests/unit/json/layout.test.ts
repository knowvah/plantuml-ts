import { describe, expect, it } from 'vitest';
import { layoutJson } from '../../../src/diagrams/json/layout.js';
import type { JsonDiagramAST, HighlightDirective } from '../../../src/diagrams/json/ast.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import type { FontSpec, StringMeasurer } from '../../../src/core/measurer.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * FixedMeasurer with charWidth=8, lineHeight=14 gives deterministic geometry
 * without any dependency on font rendering.
 */
const measurer = new FixedMeasurer(8, 14);

function makeAst(root: unknown, highlights: ReadonlyArray<readonly string[]> = [], parseError = false): JsonDiagramAST {
  // Convert plain string[][] to HighlightDirective[] with styleClass: ''
  const directives: HighlightDirective[] = highlights.map((path) => ({ path, styleClass: '' }));
  return { root, parseError, highlights: directives };
}

// ---------------------------------------------------------------------------
// Acceptance criteria tests
// ---------------------------------------------------------------------------

describe('layoutJson', () => {
  // 1. Flat object → 1 node, 2 rows
  it('flat object produces exactly 1 node with 2 rows', () => {
    const ast = makeAst({ a: 1, b: 'hello' });
    const geo = layoutJson(ast, defaultTheme, measurer);

    expect(geo.nodes).toHaveLength(1);
    expect(geo.nodes[0]!.rows).toHaveLength(2);
  });

  // 2. Object with nested child → 2 nodes, 1 edge
  it('nested object produces 2 nodes and 1 edge', () => {
    const ast = makeAst({ child: { x: 1 } });
    const geo = layoutJson(ast, defaultTheme, measurer);

    expect(geo.nodes).toHaveLength(2);
    expect(geo.edges).toHaveLength(1);
  });

  // 3. All nodes have positive dimensions and non-negative coordinates
  it('all nodes have width > 0, height > 0, x >= 0, y >= 0 for any valid JSON', () => {
    const ast = makeAst({ alpha: 'first', beta: 42, gamma: true, nested: { deep: 'value' } });
    const geo = layoutJson(ast, defaultTheme, measurer);

    expect(geo.nodes.length).toBeGreaterThan(0);
    for (const node of geo.nodes) {
      expect(node.width).toBeGreaterThan(0);
      expect(node.height).toBeGreaterThan(0);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
    }
  });

  // 4. Array root → rows keyed '0', '1', '2'
  it("array root produces rows with keys '0', '1', '2'", () => {
    const ast = makeAst([1, 2, 3]);
    const geo = layoutJson(ast, defaultTheme, measurer);

    expect(geo.nodes).toHaveLength(1);
    const keys = geo.nodes[0]!.rows.map((r) => r.key);
    expect(keys).toEqual(['0', '1', '2']);
  });

  // 5. Empty object → 1 node with 0 rows, height >= MIN_HEIGHT (15)
  // A5/T6b, `JsonDiagram.java:78-88`: an empty object is replaced by a
  // JsonArray holding ONE EMPTY STRING before measurement, so it produces one
  // real row -- not the zero-row/MIN_HEIGHT shape this used to assert.
  it('empty object produces 1 node with one empty-string row', () => {
    const ast = makeAst({});
    const geo = layoutJson(ast, defaultTheme, measurer);

    expect(geo.nodes).toHaveLength(1);
    expect(geo.nodes[0]!.rows).toHaveLength(1);
    expect(geo.nodes[0]!.rows[0]!.value).toBe('');
  });

  // 6. Parse error → empty geometry
  it('parse error returns empty geometry', () => {
    const ast = makeAst(null, [], true);
    const geo = layoutJson(ast, defaultTheme, measurer);

    expect(geo.nodes).toHaveLength(0);
    expect(geo.edges).toHaveLength(0);
    expect(geo.width).toBe(0);
    expect(geo.height).toBe(0);
  });

  // 7. boolean true value → '☑ true'
  it("boolean true produces row value '☑ true'", () => {
    const ast = makeAst({ flag: true });
    const geo = layoutJson(ast, defaultTheme, measurer);

    const row = geo.nodes[0]!.rows.find((r) => r.key === 'flag');
    expect(row).toBeDefined();
    expect(row!.value).toBe('☑ true');
    expect(row!.valueType).toBe('boolean');
  });

  // 8. boolean false value → '☐ false'
  it("boolean false produces row value '☐ false'", () => {
    const ast = makeAst({ flag: false });
    const geo = layoutJson(ast, defaultTheme, measurer);

    const row = geo.nodes[0]!.rows.find((r) => r.key === 'flag');
    expect(row).toBeDefined();
    expect(row!.value).toBe('☐ false');
    expect(row!.valueType).toBe('boolean');
  });

  // 9. null value → '␀'
  it("null value produces row value '␀'", () => {
    const ast = makeAst({ n: null });
    const geo = layoutJson(ast, defaultTheme, measurer);

    const row = geo.nodes[0]!.rows.find((r) => r.key === 'n');
    expect(row).toBeDefined();
    expect(row!.value).toBe('␀');
    expect(row!.valueType).toBe('null');
  });

  // 10. Highlight path [["key"]] → row has highlight !== false
  it('highlight path marks matching row as highlighted', () => {
    const ast = makeAst({ key: 'hello' }, [['key']]);
    const geo = layoutJson(ast, defaultTheme, measurer);

    const row = geo.nodes[0]!.rows.find((r) => r.key === 'key');
    expect(row).toBeDefined();
    expect(row!.highlight).not.toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Additional structural tests
  // ---------------------------------------------------------------------------

  // 10b. Multi-segment highlight path navigates into child node
  it('two-segment highlight path highlights key in child node, not in root', () => {
    // #highlight "address" / "city" → "city" highlighted in address node,
    // "address" row in root should NOT be highlighted
    const ast = makeAst(
      { address: { city: 'NY', state: 'New York' } },
      [['address', 'city']],
    );
    const geo = layoutJson(ast, defaultTheme, measurer);

    // Root node: "address" row must NOT be highlighted
    const rootAddressRow = geo.nodes[0]!.rows.find((r) => r.key === 'address');
    expect(rootAddressRow).toBeDefined();
    expect(rootAddressRow!.highlight).toBe(false);

    // Child node (address): "city" row MUST be highlighted, "state" must not
    const childNode = geo.nodes.find((n) => n.id !== geo.nodes[0]!.id);
    expect(childNode).toBeDefined();
    const cityRow = childNode!.rows.find((r) => r.key === 'city');
    const stateRow = childNode!.rows.find((r) => r.key === 'state');
    expect(cityRow!.highlight).not.toBe(false);
    expect(stateRow!.highlight).toBe(false);
  });

  it('non-highlighted rows have highlight=false', () => {
    const ast = makeAst({ key: 'hello', other: 'world' }, [['key']]);
    const geo = layoutJson(ast, defaultTheme, measurer);

    const otherRow = geo.nodes[0]!.rows.find((r) => r.key === 'other');
    expect(otherRow).toBeDefined();
    expect(otherRow!.highlight).toBe(false);
  });

  it('nested value row has valueType "nested" and empty value string', () => {
    const ast = makeAst({ child: { x: 1 } });
    const geo = layoutJson(ast, defaultTheme, measurer);

    const nestedRow = geo.nodes[0]!.rows.find((r) => r.key === 'child');
    expect(nestedRow).toBeDefined();
    expect(nestedRow!.valueType).toBe('nested');
    expect(nestedRow!.value).toBe('');
  });

  it('string value row has valueType "string"', () => {
    const ast = makeAst({ name: 'Alice' });
    const geo = layoutJson(ast, defaultTheme, measurer);

    const row = geo.nodes[0]!.rows.find((r) => r.key === 'name');
    expect(row).toBeDefined();
    expect(row!.valueType).toBe('string');
    expect(row!.value).toBe('Alice');
  });

  it('number value row has valueType "number" and stringified value', () => {
    const ast = makeAst({ count: 42 });
    const geo = layoutJson(ast, defaultTheme, measurer);

    const row = geo.nodes[0]!.rows.find((r) => r.key === 'count');
    expect(row).toBeDefined();
    expect(row!.valueType).toBe('number');
    expect(row!.value).toBe('42');
  });

  it('canvas width and height are positive for non-empty diagrams', () => {
    const ast = makeAst({ a: 1 });
    const geo = layoutJson(ast, defaultTheme, measurer);

    expect(geo.width).toBeGreaterThan(0);
    expect(geo.height).toBeGreaterThan(0);
  });

  it('deeply nested tree produces correct node count', () => {
    // { a: { b: { c: 1 } } } → 3 nodes, 2 edges
    const ast = makeAst({ a: { b: { c: 1 } } });
    const geo = layoutJson(ast, defaultTheme, measurer);

    expect(geo.nodes).toHaveLength(3);
    expect(geo.edges).toHaveLength(2);
  });

  // A5/T6b: there is NO per-column floor. `getWidthColA`/`getWidthColB`
  // (`TextBlockJson.java:243-259`) are plain `max` folds starting at zero; the
  // 30 in that file is `MIN_WIDTH`, applied once to the WHOLE node and only
  // when it would otherwise be zero. This test used to assert a 30 floor on
  // each column, which made every node at least 60 wide before any text.
  it('columns are sized to their content, with no per-column floor', () => {
    const ast = makeAst({ x: 1, y: 2 });
    const geo = layoutJson(ast, defaultTheme, measurer);

    for (const node of geo.nodes) {
      // FixedMeasurer(8, 14): 'x' is 8 wide, + 2 * CELL_MARGIN_X (5) = 18.
      expect(node.keyColWidth).toBe(18);
      expect(node.valueColWidth).toBe(18);
      expect(node.keyColWidth).toBeLessThan(30);
    }
  });

  // `JsonDiagram.java:78-88`: an empty object or array is replaced by a
  // JsonArray holding one EMPTY STRING before anything measures it -- so the
  // node is one real row, NOT the MIN_WIDTH/MIN_HEIGHT fallback (those stay as
  // upstream's defensive branch for a line-less block, unreachable from the
  // diagram root). Jar-verified: `{}` draws a rect 18 tall.
  it('an empty object becomes one row holding the empty string', () => {
    const geo = layoutJson(makeAst({}), defaultTheme, measurer);
    const node = geo.nodes[0];
    expect(node).toBeDefined();
    expect(node!.rows).toHaveLength(1);
    // FixedMeasurer(8, 14): row height = 14 + 2 * CELL_MARGIN_Y = 18.
    expect(node!.height).toBe(18);
  });

  // A5/T6b: rows start at the node's top edge. Upstream's `drawU` walks
  // `y = 0; for (line) y += heightOfRow` (`TextBlockJson.java:267-275`) -- no
  // leading pad. This used to assert a 4px `V_PAD` offset with no upstream source.
  it('row y offsets are non-decreasing and the first row starts at 0', () => {
    const ast = makeAst({ a: 1, b: 2, c: 3 });
    const geo = layoutJson(ast, defaultTheme, measurer);

    const rows = geo.nodes[0]!.rows;
    expect(rows[0]!.y).toBe(0);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.y).toBeGreaterThan(rows[i - 1]!.y);
    }
  });

  // A5/T6b: DIVERGENCES.md's "Array index keys" is RETIRED. Upstream builds an
  // array line with the one-arg `Line` constructor, putting the VALUE in `b1`
  // and leaving `b2` null (`TextBlockJson.java:127-134`) -- so the index is
  // used only to resolve highlights, never drawn, and column B stays empty.
  it('array rows carry the value in column A, leaving column B empty', () => {
    const geo = layoutJson(makeAst([10, 20]), defaultTheme, measurer);
    const node = geo.nodes[0];
    expect(node).toBeDefined();
    expect(node!.rows.every((r) => r.arrayEntry)).toBe(true);
    // `getWidthColB` skips lines whose b2 is null, so a pure array node has none.
    expect(node!.valueColWidth).toBe(0);
    expect(node!.keyColWidth).toBe(node!.width);
  });

  it('object rows keep both cells', () => {
    const geo = layoutJson(makeAst({ a: 1 }), defaultTheme, measurer);
    const node = geo.nodes[0];
    expect(node!.rows.every((r) => r.arrayEntry)).toBe(false);
    expect(node!.valueColWidth).toBeGreaterThan(0);
  });

  // A5/T6b, `JsonDiagram.java:78-82`: a primitive root is wrapped in a
  // JsonArray holding that value -- NOT, as this port previously did, a
  // synthetic object keyed by the empty string. The key is therefore the array
  // index, which this port shows and upstream does not (a named divergence:
  // DIVERGENCES.md, "Array index keys").
  it('primitive root (number) is wrapped in an array, giving one indexed row', () => {
    const ast = makeAst(42);
    const geo = layoutJson(ast, defaultTheme, measurer);

    expect(geo.nodes).toHaveLength(1);
    expect(geo.nodes[0]!.rows).toHaveLength(1);
    expect(geo.nodes[0]!.rows[0]!.key).toBe('0');
    expect(geo.nodes[0]!.rows[0]!.value).toBe('42');
  });

  // ---------------------------------------------------------------------------
  // Multi-line string values (\n escape)
  // ---------------------------------------------------------------------------

  it('string value with \\n produces multiple valueLines', () => {
    // The JSON value "a\\nb\\nc" parses to the JS string 'a\\nb\\nc' (backslash-n pairs)
    const ast = makeAst({ desc: 'a\\nb\\nc' });
    const geo = layoutJson(ast, defaultTheme, measurer);

    const row = geo.nodes[0]!.rows.find((r) => r.key === 'desc');
    expect(row).toBeDefined();
    expect(row!.valueLines).toEqual(['a', 'b', 'c']);
  });

  // A5/T6b: `Line#getHeightOfRow` is `max(b1.height, b2.height)` where each
  // cell carries `withMargin(_, 5, 2)`'s vertical 2 per side ONCE -- not once
  // per wrapped line, and with no 20px floor. This used to assert
  // `numLines * max(20, textHeight + 4)`.
  it('multi-line row height is the value cell: lines × textHeight + one cell margin', () => {
    // FixedMeasurer(8, 14): 6 * 14 + 2 * CELL_MARGIN_Y (2) = 88.
    const ast = makeAst({ desc: 'a\\nb\\nc\\nd\\ne\\nf' });
    const geo = layoutJson(ast, defaultTheme, measurer);

    const row = geo.nodes[0]!.rows.find((r) => r.key === 'desc');
    expect(row).toBeDefined();
    expect(row!.height).toBe(6 * 14 + 4);
  });

  it('a single-line row is the key cell height, with no floor applied', () => {
    const geo = layoutJson(makeAst({ a: 1 }), defaultTheme, measurer);
    const row = geo.nodes[0]!.rows[0];
    expect(row).toBeDefined();
    // 14 + 2 * CELL_MARGIN_Y = 18, NOT the old max(20, ...) = 20.
    expect(row!.height).toBe(18);
  });

  it('multi-line value column width uses the widest line, not the whole string', () => {
    // 'aa' is 2 chars wide; 'b' is 1 char wide → value col fits 'aa', not 'aa\nb'
    const ast = makeAst({ x: 'aa\\nb' });
    const geo = layoutJson(ast, defaultTheme, measurer);

    // FixedMeasurer: 'aa' → 2×8=16; 'aa\nb' (5 chars if unsplit) would be 5×8=40
    // With split, widest line is 'aa' = 16 + 2×H_PAD(8) = 32
    const node = geo.nodes[0]!;
    // valueColWidth should be based on 'aa' width (16px + 16px padding = 32),
    // not the full joined string 'aa\nb' (5 chars = 56px)
    expect(node.valueColWidth).toBeLessThan(measurer.measure('aa\\nb', { family: '', size: 14 }).width + 16 + 1);
  });

  it('non-string values always have single-element valueLines', () => {
    const ast = makeAst({ n: 42, b: true, nl: null });
    const geo = layoutJson(ast, defaultTheme, measurer);

    for (const row of geo.nodes[0]!.rows) {
      expect(row.valueLines).toHaveLength(1);
    }
  });

  // ---------------------------------------------------------------------------
  // Whitespace escape sequences (PlantUML second-level interpretation)
  // ---------------------------------------------------------------------------

  it('double-backslash in string value renders as single backslash', () => {
    // JS string 'a\\\\b' represents the four-character literal a\\b
    // After processStringDisplay: \\ → \ → final display 'a\b'
    const ast = makeAst({ k: 'a\\\\b' });
    const geo = layoutJson(ast, defaultTheme, measurer);
    const row = geo.nodes[0]!.rows.find((r) => r.key === 'k');
    expect(row).toBeDefined();
    expect(row!.value).toBe('a\\b');
    expect(row!.valueLines).toEqual(['a\\b']);
  });

  it('\\r in string value produces a blank row (empty processed value)', () => {
    const ast = makeAst({ k: '\\r' });
    const geo = layoutJson(ast, defaultTheme, measurer);
    const row = geo.nodes[0]!.rows.find((r) => r.key === 'k');
    expect(row).toBeDefined();
    expect(row!.value).toBe('');
  });

  it('\\t in string value produces a tab character', () => {
    const ast = makeAst({ k: '\\t' });
    const geo = layoutJson(ast, defaultTheme, measurer);
    const row = geo.nodes[0]!.rows.find((r) => r.key === 'k');
    expect(row).toBeDefined();
    expect(row!.value).toBe('\t');
  });

  it('double-backslash followed by n renders as backslash+n, not newline', () => {
    // Source JSON: "\\\\n" — literal four chars: \\ n
    // processStringDisplay: \\ → protect, then \n substitution skips, → 'a\n' (literal backslash-n)
    // Actually: "\\\\n" in JS is a two-char string: \ followed by n — wait, let me think...
    // JS: '\\\\n' = four chars \, \, n? No: '\\\\' = two backslashes, then 'n' = '\\n' escaped backslash+n
    // processStringDisplay on '\\n': protect \\ is no-op (only two-backslash matches), so \n → newline
    // For '\\\\n': protect \\ → \x00 n; \n check: no \n sequence; restore \x00 → \; result = '\n' (backslash+n? no — '\' + 'n')
    // Hmm. Let me test actual value expected. '\\\\n' as a JS string is: char(\), char(\), char(n) → 3 chars
    // replace /\\\\/g (matches \\) → '\x00n'; no \n; restore → '\n' (backslash+n literal? no — \x00 → '\', so '\' + 'n' = two chars).
    // That means it becomes a backslash followed by 'n' in the string, which is NOT a newline.
    // So valueLines should be ['\\n'] (one line, not split).
    const ast = makeAst({ k: '\\\\n' });
    const geo = layoutJson(ast, defaultTheme, measurer);
    const row = geo.nodes[0]!.rows.find((r) => r.key === 'k');
    expect(row).toBeDefined();
    expect(row!.valueLines).toHaveLength(1);
    expect(row!.value).toBe('\\n');
  });

  it('nodeFontBold=true causes value column to be measured with bold weight', () => {
    // A measurer that returns 20% wider widths for bold text.
    const boldMeasurer: StringMeasurer = {
      measure(text: string, font: FontSpec) {
        const base = text.length * 8;
        return { width: font.weight === 'bold' ? base * 1.2 : base, height: 14 };
      },
      getDescent(_font: FontSpec, _text: string) { return 3; },
    };

    const ast = makeAst({ label: 'hello' });
    const boldTheme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        graph: {
          ...defaultTheme.colors.graph,
          json: { ...defaultTheme.colors.graph.json, nodeFontBold: true },
        },
      },
    };

    const geoNormal = layoutJson(ast, defaultTheme, boldMeasurer);
    const geoBold   = layoutJson(ast, boldTheme,   boldMeasurer);

    // Bold measurement must produce a wider value column
    expect(geoBold.nodes[0]!.valueColWidth).toBeGreaterThan(geoNormal.nodes[0]!.valueColWidth);
  });

  // ---------------------------------------------------------------------------
  // Wildcard highlight support
  // ---------------------------------------------------------------------------

  // * wildcard: matches all direct children
  it('single-star wildcard highlights key in all direct children', () => {
    const root = { a: { count: '1' }, b: { count: '2' } };
    const ast = makeAst(root, [['*', 'count']]);
    const geo = layoutJson(ast, defaultTheme, measurer);
    // Both child nodes (a and b) should have 'count' highlighted
    const countHighlights = geo.nodes
      .flatMap(n => n.rows)
      .filter(r => r.key === 'count')
      .map(r => r.highlight);
    expect(countHighlights).toHaveLength(2);
    expect(countHighlights.every(h => h !== false)).toBe(true);
  });

  // ** wildcard: marks key at any depth
  it('double-star wildcard highlights key at any depth', () => {
    const root = { a: { location: 'NYC' }, b: { c: { location: 'LA' } } };
    const ast = makeAst(root, [['**', 'location']]);
    const geo = layoutJson(ast, defaultTheme, measurer);
    const locationRows = geo.nodes
      .flatMap(n => n.rows)
      .filter(r => r.key === 'location');
    expect(locationRows.length).toBeGreaterThanOrEqual(1);
    expect(locationRows.every(r => r.highlight !== false)).toBe(true);
  });

  // exact path unchanged
  it('exact multi-segment path unchanged with new implementation', () => {
    const root = { address: { city: 'NYC', state: 'NY' } };
    const ast = makeAst(root, [['address', 'city']]);
    const geo = layoutJson(ast, defaultTheme, measurer);
    const rootNode = geo.nodes[0]!;
    const addrRow = rootNode.rows.find(r => r.key === 'address');
    expect(addrRow?.highlight).toBe(false);
    const addrNode = geo.nodes.find(n => n !== rootNode && n.rows.some(r => r.key === 'city'));
    expect(addrNode?.rows.find(r => r.key === 'city')?.highlight).not.toBe(false);
    expect(addrNode?.rows.find(r => r.key === 'state')?.highlight).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Named style class on highlight
  // ---------------------------------------------------------------------------

  it('highlight directive with styleClass "h1" produces row.highlight === "h1"', () => {
    const ast: JsonDiagramAST = {
      root: { fruit: 'Apple', size: 'Large' },
      parseError: false,
      highlights: [{ path: ['fruit'], styleClass: 'h1' }],
    };
    const geo = layoutJson(ast, defaultTheme, measurer);
    const row = geo.nodes[0]!.rows.find((r) => r.key === 'fruit');
    expect(row?.highlight).toBe('h1');
  });

  it('highlight directive with no styleClass produces row.highlight === ""', () => {
    const ast: JsonDiagramAST = {
      root: { fruit: 'Apple' },
      parseError: false,
      highlights: [{ path: ['fruit'], styleClass: '' }],
    };
    const geo = layoutJson(ast, defaultTheme, measurer);
    const row = geo.nodes[0]!.rows.find((r) => r.key === 'fruit');
    expect(row?.highlight).toBe('');
  });
});
