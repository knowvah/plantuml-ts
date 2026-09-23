/**
 * G2 N15 (README item #7): `[[url]]` grammar unit tests -- byte-exact
 * against `url/UrlBuilder.java`'s 5-way STRICT-mode regex, jar-verified
 * via `cokeje-99-gede231`'s three bracket forms.
 */
import { describe, it, expect } from 'vitest';
import { parseUrlBracket, applyTopUrl, applyTopUrlToClassifiers } from '../../../src/diagrams/class/class-url.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';
import { renderSync } from '../../../src/index.js';

describe('parseUrlBracket', () => {
  it(
    'bare link, no tooltip/label -- label and tooltip default to the url ' + '(jar-verified cokeje-99-gede231)',
    () => {
      expect(parseUrlBracket('[[http://plantuml.com]]')).toEqual({
        url: 'http://plantuml.com',
        tooltip: 'http://plantuml.com',
        label: 'http://plantuml.com',
      });
    },
  );

  it('bare link + label, tooltip defaults to the url (jar-verified ' + 'cokeje-99-gede231)', () => {
    expect(parseUrlBracket('[[http://plantuml.com our web site]]')).toEqual({
      url: 'http://plantuml.com',
      tooltip: 'http://plantuml.com',
      label: 'our web site',
    });
  });

  it('bare link + tooltip + label, all three explicit (jar-verified ' + 'cokeje-99-gede231)', () => {
    expect(parseUrlBracket('[[http://plantuml.com{This is a tip} our web site]]')).toEqual({
      url: 'http://plantuml.com',
      tooltip: 'This is a tip',
      label: 'our web site',
    });
  });

  it('quoted link, no tooltip/label', () => {
    expect(parseUrlBracket('[["quoted link"]]')).toEqual({
      url: 'quoted link',
      tooltip: 'quoted link',
      label: 'quoted link',
    });
  });

  it('quoted link + tooltip + label', () => {
    expect(parseUrlBracket('[["quoted link"{tip} label]]')).toEqual({
      url: 'quoted link',
      tooltip: 'tip',
      label: 'label',
    });
  });

  it('tooltip only -- url and label are empty', () => {
    expect(parseUrlBracket('[[{just a tooltip}]]')).toEqual({
      url: '',
      tooltip: 'just a tooltip',
      label: '',
    });
  });

  it('tooltip + label, no url', () => {
    expect(parseUrlBracket('[[{tooltip} label only]]')).toEqual({
      url: '',
      tooltip: 'tooltip',
      label: 'label only',
    });
  });

  it('bare link + tooltip, no label -- label defaults to the url', () => {
    expect(parseUrlBracket('[[http://x.com{a tooltip}]]')).toEqual({
      url: 'http://x.com',
      tooltip: 'a tooltip',
      label: 'http://x.com',
    });
  });

  it('malformed bracket content returns undefined', () => {
    expect(parseUrlBracket('[[]]')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// cdd-T34 (E14 `topurl`)
// ---------------------------------------------------------------------------

describe('applyTopUrl', () => {
  it('prefixes a relative url', () => {
    expect(applyTopUrl('/search', 'http://www.google.com')).toBe('http://www.google.com/search');
  });

  it('leaves an http: url unprefixed (jar-verified laluve-92-raxu863/jinoba-14-firi471)', () => {
    expect(applyTopUrl('http://www.yahoo.com', 'http://www.google.com')).toBe('http://www.yahoo.com');
  });

  it('leaves an https: url unprefixed', () => {
    expect(applyTopUrl('https://x.com', 'http://www.google.com')).toBe('https://x.com');
  });

  it('leaves a file: url unprefixed', () => {
    expect(applyTopUrl('file:///a', 'http://www.google.com')).toBe('file:///a');
  });

  it('is a no-op when topurl is undefined', () => {
    expect(applyTopUrl('/search', undefined)).toBe('/search');
  });
});

describe('parseUrlBracket with topurl', () => {
  it('prefixes a bare relative link', () => {
    expect(parseUrlBracket('[[/search]]', 'http://www.google.com')).toEqual({
      url: 'http://www.google.com/search',
      tooltip: 'http://www.google.com/search',
      label: 'http://www.google.com/search',
    });
  });

  it('does not prefix the empty-url tooltip-only branch', () => {
    expect(parseUrlBracket('[[{just a tooltip}]]', 'http://www.google.com')).toEqual({
      url: '',
      tooltip: 'just a tooltip',
      label: '',
    });
  });

  it('an explicit tooltip is NOT overwritten by the prefixed url', () => {
    expect(parseUrlBracket('[[/search{My Tooltip}]]', 'http://www.google.com')).toEqual({
      url: 'http://www.google.com/search',
      tooltip: 'My Tooltip',
      label: 'http://www.google.com/search',
    });
  });
});

function makeClassifier(id: string, url?: Classifier['url']): Classifier {
  return { id, display: id, kind: 'class', typeParams: [], members: [], ...(url !== undefined ? { url } : {}) };
}

describe('applyTopUrlToClassifiers', () => {
  it('returns the input unchanged (===) when topurl is undefined', () => {
    const classifiers = [makeClassifier('Foo', parseUrlBracket('[[/search]]'))];
    expect(applyTopUrlToClassifiers(classifiers, undefined)).toBe(classifiers);
  });

  it('prefixes url + the defaulted tooltip/label, leaves a classifier with no url untouched', () => {
    const withUrl = makeClassifier('Mamal', parseUrlBracket('[[/search]]'));
    const withoutUrl = makeClassifier('Dog');
    const result = applyTopUrlToClassifiers([withUrl, withoutUrl], 'http://www.google.com');
    expect(result[0]!.url).toEqual({
      url: 'http://www.google.com/search',
      tooltip: 'http://www.google.com/search',
      label: 'http://www.google.com/search',
    });
    expect(result[1]).toBe(withoutUrl);
  });

  it('leaves an already-absolute classifier url unprefixed (jar-verified jinoba-14-firi471 Dog)', () => {
    const dog = makeClassifier('Dog', parseUrlBracket('[[http://www.yahoo.com{This is Dog}]]'));
    const result = applyTopUrlToClassifiers([dog], 'http://www.google.com');
    expect(result[0]!.url).toEqual({
      url: 'http://www.yahoo.com',
      tooltip: 'This is Dog',
      label: 'http://www.yahoo.com',
    });
  });
});

describe('skinparam topurl -- end-to-end (renderSync)', () => {
  it('prefixes a relative classifier [[url]] with the skinparam topurl', () => {
    const svg = renderSync('@startuml\nskinparam topurl http://www.google.com\nclass Mamal [[/search]]\n@enduml\n');
    expect(svg).toContain('href="http://www.google.com/search"');
  });

  it('leaves an already-absolute classifier [[url]] unprefixed', () => {
    const svg = renderSync(
      '@startuml\nskinparam topurl http://www.google.com\nclass Dog [[http://www.yahoo.com{This is Dog}]]\n@enduml\n',
    );
    expect(svg).toContain('href="http://www.yahoo.com"');
    expect(svg).not.toContain('http://www.google.comhttp://www.yahoo.com');
  });

  it('a classifier url is unprefixed with no skinparam topurl declared', () => {
    const svg = renderSync('@startuml\nclass Mamal [[/search]]\n@enduml\n');
    expect(svg).toContain('href="/search"');
  });
});
