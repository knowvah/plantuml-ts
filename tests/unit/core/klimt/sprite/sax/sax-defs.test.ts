import { describe, expect, it } from 'vitest';
import { DefsCollector } from '../../../../../../src/core/klimt/sprite/sax/sax-defs.js';
import { parseSaxEvents } from '../../../../../../src/core/klimt/sprite/sax/sax-events.js';

function collect(xml: string): DefsCollector {
  const collector = new DefsCollector();
  parseSaxEvents(xml, collector);
  return collector;
}

describe('DefsCollector (SvgSaxParser.java:186-302)', () => {
  it('collects a gradient with stops from the attribute and style forms (:224-238)', () => {
    const defs = collect(
      '<svg><defs><linearGradient id="g"><stop offset="0" stop-color="#f00"/>' +
        '<stop offset="1" style="stop-color:#00f"/></linearGradient></defs></svg>',
    ).getDefinitions();
    const g = defs.get('g');
    expect(g?.tagName).toBe('linearGradient');
    expect(g?.stops.map((s) => [s.offset, s.color, s.opacity])).toEqual([
      ['0', '#f00', undefined],
      ['1', '#00f', undefined],
    ]);
  });

  it('reads stop-opacity from the attribute, and from style when the attribute is absent', () => {
    const g = collect(
      '<svg><defs><radialGradient id="r"><stop offset="0" stop-color="red" stop-opacity="0.5"/>' +
        '<stop offset="1" style="x; :bad; Stop-Color : blue ; STOP-OPACITY:0.25"/></radialGradient></defs></svg>',
    )
      .getDefinitions()
      .get('r');
    expect(g?.stops.map((s) => [s.color, s.opacity])).toEqual([
      ['red', '0.5'],
      ['blue', '0.25'],
    ]);
  });

  it('prefers the stop-color attribute over the style value (:229-232)', () => {
    const g = collect(
      '<svg><defs><linearGradient id="g"><stop offset="0" stop-color="#111" style="stop-color:#222"/></linearGradient></defs></svg>',
    )
      .getDefinitions()
      .get('g');
    expect(g?.stops[0]?.color).toBe('#111');
  });

  it('drops a stop that has no offset or no colour (:236)', () => {
    const g = collect(
      '<svg><defs><linearGradient id="g"><stop stop-color="#111"/><stop offset="1"/></linearGradient></defs></svg>',
    )
      .getDefinitions()
      .get('g');
    expect(g?.stops).toEqual([]);
  });

  it('buffers an id-d element as re-serialised XML with escaped attributes and text (:241-246, :282)', () => {
    const el = collect(
      '<svg><defs><g id="a" data-x="a&amp;b&lt;&quot;"><text>1 &lt; 2 &amp; &quot;3&quot;</text></g></defs></svg>',
    )
      .getDefinitions()
      .get('a');
    expect(el?.xmlContent).toBe('<g id="a" data-x="a&amp;b&lt;&quot;"><text>1 &lt; 2 &amp; &quot;3&quot;</text></g>');
    expect(el?.attributes.get('data-x')).toBe('a&b<"');
  });

  it('buffers a <symbol> that sits outside <defs> (:209 "symbol".equals)', () => {
    const el = collect('<svg><symbol id="s"><path d="M0 0"/></symbol></svg>').getDefinitions().get('s');
    expect(el?.tagName).toBe('symbol');
    expect(el?.xmlContent).toBe('<symbol id="s"><path d="M0 0"></path></symbol>');
  });

  it('ignores elements without an id, or with an empty id, outside any definition', () => {
    const defs = collect('<svg><rect id="r"/><g id=""/><defs><rect/><rect id=""/></defs></svg>').getDefinitions();
    expect([...defs.keys()]).toEqual([]);
  });

  it('keeps the outer <defs> open through a nested <symbol> and closes it at depth 1 (:269-272)', () => {
    const defs = collect(
      '<svg><defs><symbol id="s"><rect id="inner"/></symbol><rect id="after"/></defs><rect id="outside"/></svg>',
    ).getDefinitions();
    // "s" is never stored: the inner element's end clears currentId first (:262-265), a preserved quirk.
    expect([...defs.keys()].sort()).toEqual(['after', 'inner']);
  });

  it('a nested definition id replaces the current buffer (:210-221)', () => {
    const defs = collect('<svg><defs><g id="outer"><rect id="inner"/></g></defs></svg>').getDefinitions();
    expect(defs.get('inner')?.xmlContent).toBe('<rect id="inner"></rect>');
    // After the inner element ends, currentId is cleared, so "outer" is never stored (:262-265).
    expect(defs.has('outer')).toBe(false);
  });

  it('leaves defs mode off for text outside definitions (:276-279)', () => {
    const defs = collect('<svg><text>hello</text><defs><g id="a">x</g></defs></svg>').getDefinitions();
    expect(defs.get('a')?.xmlContent).toBe('<g id="a">x</g>');
  });
});
