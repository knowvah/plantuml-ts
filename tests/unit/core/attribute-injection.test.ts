import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { assembleDocumentShell } from '../../../src/core/klimt/document-shell.js';

// An unparseable `skinparam backgroundColor` token is kept verbatim by
// `resolveColorToSvgHex` (g1c decision K1) where upstream's `getColorOrWhite`
// falls back to white. It must therefore never reach an attribute unescaped
// (CodeQL js/html-constructed-from-input on `svgRoot`).
const PAYLOAD = 'x"onload="alert(1)';

describe('attribute injection via skinparam colors', () => {
  it('renderSync never emits the raw quote payload as an attribute', () => {
    const svg = renderSync(`@startuml\nskinparam backgroundColor ${PAYLOAD}\nA -> B\n@enduml`);
    expect(svg).not.toContain('onload');
    // The jar renders this source with `background:#FFFFFF` (oracle-verified):
    // `HColorSet#getColorOrWhite` at the skinparam boundary.
    expect(svg).toContain('background:#FFFFFF');
  });

  it('assembleDocumentShell escapes the background inside the style attribute', () => {
    const svg = assembleDocumentShell({ width: 10, height: 10, body: '', background: PAYLOAD }, 'class');
    expect(svg).not.toContain('onload="alert');
    expect(svg).toContain('background:x&quot;onload=&quot;alert(1);');
  });
});
