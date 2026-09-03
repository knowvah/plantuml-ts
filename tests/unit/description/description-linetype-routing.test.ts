/**
 * Mission `linetype-ortho-routing` T6: `theme.linetype ?? ast.linetype`
 * forwarded onto the `DotInputGraph` assembled by
 * `description/layout.ts#runLayout` (decisions.md D3).
 *
 * Unlike state/class (T4/T5, which read bare `theme.linetype`), description
 * reads a `??` fallback — the description command table intercepts
 * `skinparam linetype ortho|polyline` into `ast.linetype`
 * (`command-table-directives.ts:105-112`, `RE_SKINPARAM_LINETYPE`) rather
 * than letting it reach the shared skinparam-key-handler that populates
 * `theme.linetype` for the other two engines. In practice `theme.linetype`
 * stays undefined for description fixtures, so every normal
 * `skinparam linetype` diagram already exercises the `ast.linetype` arm of
 * the fallback — the second describe block below proves that explicitly by
 * calling `layoutDescription` directly against `defaultTheme` (confirmed
 * `linetype`-less) and an AST with only `ast.linetype` set.
 *
 * The single description-engine fixture that carries `splines=` in its
 * pinned jar DOT (`.agent-notes/lor-containment.md`): `zosaxo-93-nici652`
 * (component, ortho). The other 7 splines-bearing fixtures belong to
 * state/class and are covered by their own T4/T5 suites.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer, FormulaMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';
import { layoutDescription } from '../../../src/diagrams/description/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { descriptionAst } from './parse-description-ast.js';

const GOLDENS = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../oracle/goldens/description',
);

const measurer = new WidthTableMeasurer();

function captureFirst(puml: string): DotInputGraph {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(puml, { measurer });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured[0]!;
}

/** The single `splines`/`forcelabels` line of a fixture's own pinned jar
 *  DOT (`svek-1.dot`), or `undefined` if it carries none. */
function jarSplinesLine(slug: string): string | undefined {
  const dot = readFileSync(join(GOLDENS, slug, 'svek-1.dot'), 'utf8');
  return dot.split('\n').find((l) => l.includes('splines') || l.includes('forcelabels'));
}

/** The single `splines`/`forcelabels` line our own `toSvekDot` emits for a
 *  fixture's captured `DotInputGraph`, or `undefined` if it carries none. */
function ourSplinesLine(slug: string): string | undefined {
  const puml = readFileSync(join(GOLDENS, slug, 'input.puml'), 'utf8');
  const dot = toSvekDot(captureFirst(puml));
  return dot.split('\n').find((l) => l.includes('splines') || l.includes('forcelabels'));
}

describe('description/layout.ts runLayout — forwards theme.linetype ?? ast.linetype', () => {
  it('carries linetype: "ortho" on the DotInputGraph', () => {
    const puml = [
      '@startuml',
      'skinparam linetype ortho',
      'component A',
      'component B',
      'A --> B',
      '@enduml',
    ].join('\n');
    expect(captureFirst(puml).linetype).toBe('ortho');
  });

  it('carries linetype: "polyline" on the DotInputGraph', () => {
    const puml = [
      '@startuml',
      'skinparam linetype polyline',
      'component A',
      'component B',
      'A --> B',
      '@enduml',
    ].join('\n');
    expect(captureFirst(puml).linetype).toBe('polyline');
  });

  it('leaves linetype absent (not explicit undefined) with no skinparam set', () => {
    const puml = ['@startuml', 'component A', 'component B', 'A --> B', '@enduml'].join('\n');
    expect('linetype' in captureFirst(puml)).toBe(false);
  });
});

describe('D3 fallback — routes ortho from ast.linetype ALONE, theme.linetype unset', () => {
  it('theme.linetype ?? ast.linetype: only ast.linetype is set, and it still wins', () => {
    const source: UmlSource = {
      lines: ['component A', 'component B', 'A --> B'],
      type: 'description',
    };
    const ast = descriptionAst(parseDescription({
      lines: ['skinparam linetype ortho', ...source.lines],
      type: 'description',
    }));
    // Sanity: the fallback is genuinely exercised, not bypassed -- the
    // description command table diverts `skinparam linetype` into
    // `ast.linetype` (command-table-directives.ts:108-111) rather than the
    // shared skinparam-key-handler that would populate `theme.linetype` for
    // state/class. `defaultTheme` carries no `linetype` key at all.
    expect(defaultTheme.linetype).toBeUndefined();
    expect(ast.linetype).toBe('ortho');

    let captured: DotInputGraph | undefined;
    setLayoutInputObserver((g) => { captured = g; });
    try {
      layoutDescription(ast, defaultTheme, new FormulaMeasurer());
    } finally {
      setLayoutInputObserver(undefined);
    }
    expect(captured?.linetype).toBe('ortho');
  });
});

describe('zosaxo-93-nici652 (ortho): emitted splines line matches the pinned jar DOT', () => {
  it('splines=ortho;forcelabels=true; on one line, matching svek-1.dot', () => {
    const jar = jarSplinesLine('zosaxo-93-nici652');
    const ours = ourSplinesLine('zosaxo-93-nici652');
    expect(jar).toBe('splines=ortho;forcelabels=true;');
    expect(ours).toBe(jar);
  });
});
