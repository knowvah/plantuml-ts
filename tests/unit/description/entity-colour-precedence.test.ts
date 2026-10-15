/**
 * codd-T1c -- fill/stroke precedence of description entities.
 *
 * Every expectation is the jar's own SVG for the named corpus fixture
 * (`test-results/dot-cache/component/<slug>/in.svg`, first shape of each
 * `<g class="entity">`); the markup is that fixture's `in.puml`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageDescription.java:152-166
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImagePort.java:61-64,121-140
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:163-167,290-302
 */
import { describe, it, expect } from 'vitest';
import { renderFixture } from '../../helpers/render.js';
import { entityPaints } from '../../helpers/entity-paint.js';

const DEFAULT_FILL = '#F1F1F1';
const DEFAULT_STROKE = '#181818';

function paints(body: string): ReturnType<typeof entityPaints> {
  return entityPaints(renderFixture(`@startuml\n${body}\n@enduml`));
}

describe('dedicated skinparam keys also reach the element bucket (FromSkinparamToStyle addMagic)', () => {
  // cukafa-49-fona812: interfaceBackgroundColor gold -> the `()interface` ellipse
  it('interfaceBackgroundColor fills the interface circle', () => {
    const p = paints('skinparam interfaceBackgroundColor gold\nskinparam interfaceBorderColor orange\n()interface');
    expect(p['interface']).toEqual({ fill: '#FFD700', stroke: '#FFA500' });
  });

  // malado-53-noso561: skinparam actor { bordercolor blue }
  it('actor { bordercolor } strokes the actor, not the component', () => {
    const p = paints('skinparam actor {\n  bordercolor blue\n}\nactor actor1\ncomponent compo1');
    expect(p['actor1']).toEqual({ fill: DEFAULT_FILL, stroke: '#00F' });
    expect(p['compo1']).toEqual({ fill: DEFAULT_FILL, stroke: DEFAULT_STROKE });
  });
});

describe('a bare skinparam borderColor is not a style property (diduxa-76-zimu664)', () => {
  it('leaves entity strokes at the skin default', () => {
    const p = paints(
      'skinparam interfaceBackgroundColor gold\nskinparam componentBackgroundColor gold\n' +
        'skinparam borderColor orange\n"This is my interface" as () interface\n[component1] -> () interface',
    );
    expect(p['interface']).toEqual({ fill: '#FFD700', stroke: DEFAULT_STROKE });
    expect(p['component1']).toEqual({ fill: '#FFD700', stroke: DEFAULT_STROKE });
  });
});

describe('stereotype-qualified skinparam background (lobute/suzemi/somugi/zozutu)', () => {
  it('agent { backgroundColor<<st>> } tints only the stereotyped agent (lobute-63-tizi096)', () => {
    const p = paints(
      '[XX]\nskinparam agent {\n    backgroundColor Yellow\n    backgroundColor<<st>> LightBlue\n}\nagent AA <<st>>\nagent BB',
    );
    expect(p['AA']?.fill).toBe('#ADD8E6');
    expect(p['BB']?.fill).toBe('#FF0');
    expect(p['XX']?.fill).toBe(DEFAULT_FILL);
  });

  it('actor { backgroundColor<<st>> } (suzemi-86-kuma659)', () => {
    const p = paints(
      '[XX]\nskinparam actor {\n    backgroundColor Yellow\n    backgroundColor<<st>> LightBlue\n}\nactor AA <<st>>\nactor BB',
    );
    expect(p['AA']?.fill).toBe('#ADD8E6');
    expect(p['BB']?.fill).toBe('#FF0');
  });

  it('component { BackgroundColor<<external>> } (somugi-21-doli483)', () => {
    const p = paints(
      'skinparam component {\n    Style rectangle\n    BackgroundColor<<external>> #orange\n}\n' +
        'actor User\ncomponent C1\ncomponent "External Service" <<external>> as C2\nUser .> C1\nC1 --> C2',
    );
    expect(p['C2']?.fill).toBe('#FFA500');
    expect(p['C1']?.fill).toBe(DEFAULT_FILL);
  });

  it('survives a newpage (zozutu-82-pupa220)', () => {
    const p = paints(
      'skinparam shadowing false\nskinparam component {\n BackgroundColor<<service>> #D0E0F0\n}\n' +
        '[Factory] as factory\n[Consumer] <<service>> as consumer_service\n[Provider] as provider\n' +
        'factory --> consumer_service\nprovider --> consumer_service\nnewpage\nconsumer_service ..> factory',
    );
    expect(p['consumer_service']?.fill).toBe('#D0E0F0');
    expect(p['factory']?.fill).toBe(DEFAULT_FILL);
  });
});

describe('<style> stereotype selectors', () => {
  // kagapo-72-cofe085: `.foo` nested under `component` only
  it('component { .foo { BackgroundColor } } reaches a component, not a rectangle', () => {
    const p = paints(
      'skinparam component {\n    Style rectangle\n}\n<style>\nrectangle {\n    BackgroundColor #orange\n}\n' +
        'component {\n    BackgroundColor #red\n    .foo { BackgroundColor #blue }\n}\n</style>\n' +
        'component C1\ncomponent C2 <<foo>>\nrectangle R1 <<foo>>',
    );
    expect(p['C1']?.fill).toBe('#F00');
    expect(p['C2']?.fill).toBe('#00F');
    expect(p['R1']?.fill).toBe('#FFA500');
  });

  // kucabo-74-cora635 / lovapo-83-xilo457: a bare `.tag` selector; the stereotype
  // token keeps its space (`StyleSignatureBasic#clean` drops only `_` and `.`)
  it('a bare `.static lib` selector matches <<static lib>> but not <<static_lib>>', () => {
    const p = paints(
      '<style>\n.static lib {\n    backgroundColor DarkKhaki\n}\n.shared lib {\n    backgroundColor Green\n}\n</style>\n' +
        '[AA] <<static lib>>\n[BB] <<shared lib>>\n[CC] <<static_lib>>',
    );
    expect(p['AA']?.fill).toBe('#BDB76B');
    expect(p['BB']?.fill).toBe('#008000');
    expect(p['CC']?.fill).toBe(DEFAULT_FILL);
  });
});

describe('port colours (EntityImagePort.drawU)', () => {
  const PORTS =
    'component comp {\n  port "8000" as p80\n  port "8010" as p81 <<magenta>>\n' +
    '  port "8020" as p82 #orange\n  port "8030" as p83 #green;line:blue\n}';

  // rapaji-98-xato067: a `boundary` style does not reach ports; inline colours do
  it('inline fill and line colours paint the port (rapaji-98-xato067)', () => {
    const p = paints(`<style>\nboundary {\n  LineColor #greenyellow\n  BackgroundColor #red\n}\n</style>\n${PORTS}`);
    expect(p['p80']).toEqual({ fill: DEFAULT_FILL, stroke: DEFAULT_STROKE });
    expect(p['p82']).toEqual({ fill: '#FFA500', stroke: DEFAULT_STROKE });
    expect(p['p83']).toEqual({ fill: '#008000', stroke: '#00F' });
  });

  // gocexi-61-biso565: skinparam boundary { ... } does not reach ports either; `#line:blue` strokes
  it('an inline line colour alone strokes the port (gocexi-61-biso565)', () => {
    const p = paints(
      'skinparam boundary {\n  BorderColor #greenyellow\n  BackgroundColor #red\n  BorderColor<<magenta>> #magenta\n}\n' +
        'component comp {\n  port "8000" as p80\n  port "8010" as p81 <<magenta>>\n' +
        '  port "8020" as p82 #orange\n  port "8030" as p83 #line:blue\n}',
    );
    expect(p['p82']).toEqual({ fill: '#FFA500', stroke: DEFAULT_STROKE });
    expect(p['p83']).toEqual({ fill: DEFAULT_FILL, stroke: '#00F' });
    expect(p['p81']).toEqual({ fill: DEFAULT_FILL, stroke: DEFAULT_STROKE });
  });

  // gafegu-06-nito976: `<style> port { ... .magenta { ... } }`, inline colours on top
  it('<style> port and port { .tag } resolve under the inline colours (gafegu-06-nito976)', () => {
    const p = paints(
      '<style>\nport {\n  LineColor #greenyellow\n  BackgroundColor #red\n  .magenta {\n\t  LineColor #magenta\n' +
        `\t  BackgroundColor #magenta\n  }\n}\n</style>\n${PORTS}`,
    );
    expect(p['p80']).toEqual({ fill: '#F00', stroke: '#ADFF2F' });
    expect(p['p81']).toEqual({ fill: '#F0F', stroke: '#F0F' });
    expect(p['p82']).toEqual({ fill: '#FFA500', stroke: '#ADFF2F' });
    expect(p['p83']).toEqual({ fill: '#008000', stroke: '#00F' });
  });
});
