import { createAnnotations, matchAnnotationCommand } from '../../core/annotations/index.js';
import type { DiagramAnnotations } from '../../core/annotations/index.js';
import { createSpriteRegistry, matchSpriteCommand } from '../../core/sprite-commands.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { DotDiagramAST } from './ast.js';

// ---------------------------------------------------------------------------
// `@startdot` parsing is the PlantUML pre-step ONLY: strip the PlantUML-only
// directives and hand the remaining DOT body onward untouched. The DOT itself
// is never parsed here — @knowvah/dot-engine both parses and renders it, the
// way upstream hands the accumulated text to the graphviz executable
// (`directdot/PSystemDot.java`). See `ast.ts` for why there is no graph model.
// ---------------------------------------------------------------------------

const EMPTY_AST: Omit<DotDiagramAST, 'annotations' | 'sprites'> = {
  dotContent: '',
  skinparamLines: [],
  rawStyles: [],
};

interface PreprocessResult {
  dotContent: string;
  skinparamLines: string[];
  annotations: DiagramAnnotations;
  sprites: SpriteRegistry;
}

/**
 * Lift the PlantUML-only lines out of an `@startdot` block; everything left is
 * the DOT body.
 *
 * Upstream's equivalent is `PSystemDotFactory#executeLine`, which ignores every
 * line until one matches its graphviz-header pattern and then appends all the
 * rest. This port instead removes known PlantUML directives wherever they
 * appear, which is what lets the chrome commands work at all (the divergence
 * documented on `DotDiagramAST.annotations`).
 */
function preprocess(source: string): PreprocessResult {
  const skinparamLines: string[] = [];
  const keepLines: string[] = [];
  const annotations = createAnnotations();
  const sprites = createSpriteRegistry();
  const withoutBlock = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const rawLines = withoutBlock.split('\n');

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i]!;
    const trimmed = rawLine.trim();
    if (/^@startdot\s*$/i.test(trimmed) || /^@enddot\s*$/i.test(trimmed)) continue;
    const noComment = rawLine.replace(/\/\/.*$/, '');
    const t = noComment.trim();
    if (t === '') { keepLines.push(''); continue; }
    if (/^skinparam\s/i.test(t)) { skinparamLines.push(t); continue; }

    // title/caption/legend/header/footer/mainframe (mission G0b/T8) — title
    // routes through the same shared chrome matcher as the other five.
    const annotationMatch = matchAnnotationCommand(rawLines, i, annotations);
    if (annotationMatch !== null) {
      i += annotationMatch.consumed - 1;
      continue;
    }

    // `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4): tried
    // immediately after the chrome matcher, same pre-DOT-body scope.
    const spriteMatch = matchSpriteCommand(rawLines, i, sprites);
    if (spriteMatch !== null) {
      i += spriteMatch.consumed - 1;
      continue;
    }

    keepLines.push(noComment);
  }
  return { dotContent: keepLines.join('\n'), skinparamLines, annotations, sprites };
}

export function parseDot(source: string): DotDiagramAST {
  if (source.trim() === '') {
    return { ...EMPTY_AST, annotations: createAnnotations(), sprites: createSpriteRegistry() };
  }

  const { dotContent, skinparamLines, annotations, sprites } = preprocess(source);
  return { ...EMPTY_AST, dotContent, skinparamLines, annotations, sprites };
}
