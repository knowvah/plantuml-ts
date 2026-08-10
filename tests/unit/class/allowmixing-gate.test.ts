/**
 * `allowmixing` gate — `CommandCreateElementFull2#executeArg`:
 *
 *   if (mode == Mode.NORMAL_KEYWORD && diagram.isAllowMixing() == false)
 *     return CommandExecutionResult.error(
 *       "Use 'allowmixing' if you want to mix classes and other UML elements.");
 *
 * Upstream registers that command twice (`ClassDiagramFactory` 133/134):
 * `NORMAL_KEYWORD` is gated, the `mix_`-prefixed `WITH_MIX_PREFIX` is not.
 * Container forms never reach it at all — `CommandPackage` /
 * `CommandPackageWithUSymbol` (127-130) claim them first.
 *
 * Every expectation below was measured against the pinned oracle jar on
 * 2026-08-02, one file per case (a multi-file jar invocation returns
 * PlantUML's welcome page and is easy to misread in BOTH directions).
 *
 * The C4 case is the one that matters most. This port's dispatcher is more
 * eager than upstream's factory selection, so a macro-expanded C4 diagram —
 * descriptive leaves, no class construct anywhere — reaches the class engine,
 * where upstream would have routed it to `DescriptionDiagramFactory` and never
 * gated it. A gate that fires on arrival at the command rather than on the
 * presence of a native class construct silently breaks every C4 diagram.
 */
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../src/index.js';

/**
 * The port's own inline error boxes draw with `fontFamily: 'monospace'`, and
 * the SVG emitter applies upstream's monospace rule to any such text —
 * `SvgGraphics.java:727-728` replaces every space with U+00A0 under a
 * `monospace`/`courier` family. So the message IS in the document, spelled
 * with NBSPs. These assertions are about the message being STATED, not about
 * which space character carries it, so they compare against the de-NBSP'd
 * text.
 */
const deNbsp = (svg: string): string => svg.split('\u00a0').join(' ');


const ERR = "Use 'allowmixing' if you want to mix classes and other UML elements.";
const ERROR_BANNER = 'plantuml-ts version';

function render(body: string): string {
  return renderSync(`@startuml\n${body}\n@enduml`);
}

function isRefused(svg: string): boolean {
  // A refusal is now the STANDARD error diagram, not a bespoke box: the class
  // plugin throws a `DiagramRefusal` and `renderSync`'s own catch builds the
  // jar's welcome-plus-source-listing page. So the marker is the error
  // diagram's banner, and the message carries upstream's assumed-type suffix.
  return deNbsp(svg).includes(ERROR_BANNER) && deNbsp(svg).includes(ERR);
}

describe('a descriptive LEAF in a class diagram is refused without allowmixing', () => {
  const GATED: [string, string][] = [
    ['bare actor', 'class Foo\nactor Bob'],
    ['actor with alias', 'class Foo\nactor "Long name" as A1'],
    ['bare package', 'class Foo\npackage com.example.thing'],
    ['package with stereotype', 'class Foo\npackage foo <<Node>>'],
    // These five reached the DESCRIPTION/STATE engines before the routing fix
    // and so escaped the gate entirely, even though the jar refuses every one
    // of them. `classAccepts` now claims a block carrying an unambiguous class
    // construct, mirroring upstream trying ClassDiagramFactory first.
    ['usecase leaf', 'class Foo\nusecase "Do it" as UC1'],
    ['state leaf', 'class Foo\nstate AA2'],
    ['card with stereotype', 'class Foo\ncard focus <<action>>'],
    ['database leaf', 'class Foo\ndatabase DB1'],
    ['portin leaf', 'class Foo\nportin image as Foo.image'],
    // Same shape, reached via the note/legend paths the dispatch tests cover.
    ['component after an inline note', 'class C\nnote left of C : a note\ncomponent X'],
    ['node after a legend', 'class foo\nlegend\n[ok]\nendlegend\nnode Server'],
  ];

  it.each(GATED)('%s', (_label, body) => {
    expect(isRefused(render(body))).toBe(true);
  });

  it('names the offending requirement in upstream\'s own words', () => {
    expect(deNbsp(render('class Foo\nactor Bob'))).toContain(ERR);
  });

  it('does not draw the element it refuses', () => {
    expect(render('class Foo\nactor Bob')).not.toMatch(/>Bob</);
  });
});

describe('the gate does not fire where upstream never reaches it', () => {
  const UNGATED: [string, string][] = [
    ['allowmixing present', 'allowmixing\nclass Foo\nactor Bob'],
    ['allow_mixing spelling', 'allow_mixing\nclass Foo\nactor Bob'],
    ['mix_ prefix (WITH_MIX_PREFIX)', 'class Foo\nmix_actor Bob'],
    ['package container', 'class Foo\npackage foo {\n}'],
    ['package empty braces', 'class Foo\npackage foo {}'],
    ['state container', 'class Foo\nstate A {\n}'],
    ['rectangle container', 'class Foo\nrectangle R {\n}'],
    ['package long-description', 'class Foo\npackage Application [\n  desc\n]'],
    // No native class construct => upstream's DescriptionDiagramFactory owns
    // the block and the gate is unreachable. This is the C4 shape.
    ['descriptive leaves, no class construct', 'actor Bob\nrectangle R1'],
  ];

  it.each(UNGATED)('%s', (_label, body) => {
    expect(isRefused(render(body))).toBe(false);
  });

  it('a C4-shaped diagram (macro-expanded leaves, no class) is never refused', () => {
    // The real C4 path is covered end-to-end by tests/unit/stdlib-packages.ts;
    // this pins the SHAPE that made it break: leaves with no class construct.
    const svg = render('rectangle "Customer" as customer\nrectangle "System" as sys\ncustomer --> sys');
    expect(isRefused(svg)).toBe(false);
    expect(svg).toMatch(/Customer/);
  });
});
