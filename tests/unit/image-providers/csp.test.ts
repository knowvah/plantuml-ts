/**
 * CSP Level 3 source-list matcher, https://www.w3.org/TR/CSP3/ (W3C Working
 * Draft read 2026-10-23). Every expected value below is the outcome the cited
 * algorithm step prescribes; the section number sits on each group.
 */
import { describe, it, expect } from 'vitest';
import { isUrlAllowedByPolicies, parseSourceList, type CspVerdict } from '../../../src/image-providers/csp';

const APP = 'https://app.test';
const IMG = 'https://img.example/a.svg';
const CONNECT = 'connect-src';
const ALLOWED: CspVerdict = { allowed: true };

/** Allowed/blocked for one `connect-src` source list on one page origin. */
function allowedBy(sourceList: string, url: string, pageOrigin: string = APP): boolean {
  return isUrlAllowedByPolicies(url, pageOrigin, [`connect-src ${sourceList}`], CONNECT).allowed;
}

describe('parseSourceList (CSP3 2.3.1 serialized-source-list)', () => {
  it('splits on runs of ASCII whitespace and drops empties', () => {
    expect(parseSourceList("  'self'\t https://a.test \n*.b.test ")).toEqual(["'self'", 'https://a.test', '*.b.test']);
  });

  it('returns an empty list for an empty value', () => {
    expect(parseSourceList('')).toEqual([]);
  });
});

describe('6.7.2.7 url vs source list: empty list and none', () => {
  it('an empty list matches nothing', () => {
    expect(allowedBy('', IMG)).toBe(false);
  });

  it("a lone 'none' (any case) matches nothing", () => {
    expect(allowedBy("'none'", IMG)).toBe(false);
    expect(allowedBy("'NONE'", IMG)).toBe(false);
  });

  it("'none' has no effect beside other expressions", () => {
    expect(allowedBy("'none' https://img.example", IMG)).toBe(true);
  });

  it('an unknown expression (a nonce) matches nothing', () => {
    expect(allowedBy("'nonce-abc'", IMG)).toBe(false);
  });
});

describe('6.7.2.8 url vs expression: *', () => {
  it('matches any http(s) url', () => {
    expect(allowedBy('*', IMG)).toBe(true);
    expect(allowedBy('*', 'http://img.example/a.svg')).toBe(true);
  });

  it('does not match data: from an https page', () => {
    expect(allowedBy('*', 'data:image/png;base64,AAAA')).toBe(false);
  });

  it('matches a url whose scheme is the page scheme', () => {
    expect(allowedBy('*', 'blob:https://app.test/1')).toBe(false);
    expect(allowedBy('*', 'ftp://h.test/a', 'ftp://p.test')).toBe(true);
  });
});

describe("6.7.2.8 url vs expression: 'self'", () => {
  it('matches the page origin', () => {
    expect(allowedBy("'self'", 'https://app.test/x.svg')).toBe(true);
  });

  it('blocks a cross-origin url', () => {
    expect(allowedBy("'self'", IMG)).toBe(false);
  });

  it('blocks the same host on a different port', () => {
    expect(allowedBy("'self'", 'https://app.test:8443/x')).toBe(false);
  });

  it('upgrades http page origin to https on the default ports', () => {
    expect(allowedBy("'self'", 'https://app.test/x', 'http://app.test')).toBe(true);
  });

  it('never downgrades https to http', () => {
    expect(allowedBy("'self'", 'http://app.test/x')).toBe(false);
  });

  it('matches ws from an http page', () => {
    expect(allowedBy("'self'", 'ws://app.test/x', 'http://app.test')).toBe(true);
  });

  it('blocks blob: urls', () => {
    expect(allowedBy("'self'", 'blob:https://app.test/uuid')).toBe(false);
  });

  it('matches nothing when the page origin is opaque', () => {
    expect(allowedBy("'self'", 'https://app.test/x', 'null')).toBe(false);
  });
});

describe('6.7.2.9 scheme-part matching', () => {
  it('scheme-source https: matches https and not http', () => {
    expect(allowedBy('https:', IMG)).toBe(true);
    expect(allowedBy('https:', 'http://img.example/a.svg')).toBe(false);
  });

  it('http: also allows the https upgrade', () => {
    expect(allowedBy('http:', IMG)).toBe(true);
  });

  it('ws: allows wss, http and https; wss: allows https', () => {
    expect(allowedBy('ws:', 'wss://h.test/')).toBe(true);
    expect(allowedBy('ws:', 'http://h.test/')).toBe(true);
    expect(allowedBy('ws:', 'https://h.test/')).toBe(true);
    expect(allowedBy('wss:', 'https://h.test/')).toBe(true);
    expect(allowedBy('wss:', 'http://h.test/')).toBe(false);
  });

  it('compares schemes case-insensitively', () => {
    expect(allowedBy('HTTPS:', IMG)).toBe(true);
  });

  it('a host-source with an explicit scheme must scheme-part match', () => {
    expect(allowedBy('http://img.example', IMG)).toBe(true);
    expect(allowedBy('https://img.example', 'http://img.example/a')).toBe(false);
  });

  it('a schemeless host-source follows the page scheme with upgrade', () => {
    expect(allowedBy('img.example', IMG, 'http://app.test')).toBe(true);
    expect(allowedBy('img.example', 'http://img.example/a')).toBe(false);
  });

  it('a schemeless host-source needs a page origin', () => {
    expect(allowedBy('img.example', IMG, 'null')).toBe(false);
  });
});

describe('6.7.2.10 host-part matching', () => {
  it('matches the exact host case-insensitively', () => {
    expect(allowedBy('https://IMG.example', IMG)).toBe(true);
    expect(allowedBy('https://other.example', IMG)).toBe(false);
  });

  it('*.example.com matches subdomains at any depth', () => {
    expect(allowedBy('*.example.com', 'https://a.b.example.com/x')).toBe(true);
    expect(allowedBy('*.example.com', 'https://a.example.com/x')).toBe(true);
  });

  it('*.example.com does not match the bare host or a sibling suffix', () => {
    expect(allowedBy('*.example.com', 'https://example.com/x')).toBe(false);
    expect(allowedBy('*.example.com', 'https://notexample.com/x')).toBe(false);
  });

  it('a lone * host with a scheme matches any domain', () => {
    expect(allowedBy('https://*', IMG)).toBe(true);
  });

  it('never matches an IP literal', () => {
    expect(allowedBy('https://*', 'https://10.0.0.1/a')).toBe(false);
    expect(allowedBy('https://10.0.0.1', 'https://10.0.0.1/a')).toBe(false);
    expect(allowedBy('https://*', 'https://[::1]/a')).toBe(false);
  });

  it('never matches a url without a host', () => {
    expect(allowedBy('data:', 'data:text/plain,x')).toBe(true);
    expect(allowedBy('https://*', 'data:text/plain,x')).toBe(false);
  });
});

describe('6.7.2.11 port-part matching', () => {
  it('an explicit port matches only that port', () => {
    expect(allowedBy('https://img.example:8443', 'https://img.example:8443/a')).toBe(true);
    expect(allowedBy('https://img.example:8443', IMG)).toBe(false);
  });

  it('no port in the expression matches only the default port', () => {
    expect(allowedBy('https://img.example', 'https://img.example:8443/a')).toBe(false);
  });

  it('the default port number matches a url without a port', () => {
    expect(allowedBy('https://img.example:443', IMG)).toBe(true);
    expect(allowedBy('http://img.example:80', 'http://img.example/a')).toBe(true);
  });

  it(':* matches every port', () => {
    expect(allowedBy('https://img.example:*', 'https://img.example:9/a')).toBe(true);
  });
});

describe('6.7.2.12 path-part matching', () => {
  it('a trailing-slash path matches everything below it', () => {
    expect(allowedBy('https://img.example/dir/', 'https://img.example/dir/a')).toBe(true);
    expect(allowedBy('https://img.example/dir/', 'https://img.example/dir/')).toBe(true);
    expect(allowedBy('https://img.example/dir/', 'https://img.example/dir')).toBe(false);
    expect(allowedBy('https://img.example/dir/', 'https://img.example/o/a')).toBe(false);
  });

  it('a path without a trailing slash is an exact match', () => {
    expect(allowedBy('https://img.example/a.svg', IMG)).toBe(true);
    expect(allowedBy('https://img.example/a.svg', 'https://img.example/a.svgx')).toBe(false);
    expect(allowedBy('https://img.example/a.svg', 'https://img.example/a.svg/b')).toBe(false);
  });

  it('a path A deeper than path B does not match', () => {
    expect(allowedBy('https://img.example/a/b/', 'https://img.example/a/')).toBe(false);
  });

  it('a lone / matches every path', () => {
    expect(allowedBy('https://img.example/', IMG)).toBe(true);
    expect(allowedBy('https://img.example/', 'https://img.example/')).toBe(true);
  });

  it('compares percent-decoded pieces', () => {
    expect(allowedBy('https://img.example/a%20b.svg', 'https://img.example/a b.svg')).toBe(true);
    expect(allowedBy('https://img.example/%41.svg', 'https://img.example/A.svg')).toBe(true);
  });

  it('keeps an undecodable piece literal', () => {
    expect(allowedBy('https://img.example/%E0%A4.svg', 'https://img.example/%E0%A4.svg')).toBe(true);
  });
});

describe('6.8.3 fallback list and 6.1.2.1 pre-request check', () => {
  it('connect-src governs when present', () => {
    expect(isUrlAllowedByPolicies(IMG, APP, ["default-src https://img.example; connect-src 'self'"], CONNECT)).toEqual({
      allowed: false,
      directive: 'connect-src',
    });
  });

  it('default-src governs when there is no connect-src', () => {
    expect(isUrlAllowedByPolicies(IMG, APP, ['default-src https://img.example'], CONNECT)).toEqual(ALLOWED);
    expect(isUrlAllowedByPolicies(IMG, APP, ["default-src 'self'"], CONNECT)).toEqual({
      allowed: false,
      directive: 'default-src',
    });
  });

  it('a policy with neither directive allows', () => {
    expect(isUrlAllowedByPolicies(IMG, APP, ["script-src 'self'"], CONNECT)).toEqual(ALLOWED);
  });

  it('no policies allows', () => {
    expect(isUrlAllowedByPolicies(IMG, APP, [], CONNECT)).toEqual(ALLOWED);
  });

  it('the first duplicate directive wins and names are case-insensitive', () => {
    expect(isUrlAllowedByPolicies(IMG, APP, ["Connect-SRC 'self'; connect-src *"], CONNECT)).toEqual({
      allowed: false,
      directive: 'connect-src',
    });
  });

  it('ignores empty directive slots', () => {
    expect(isUrlAllowedByPolicies(IMG, APP, [' ; ;connect-src *;'], CONNECT)).toEqual(ALLOWED);
  });

  it('every policy must allow (8.1)', () => {
    const policies = ['connect-src *', "connect-src 'self'"];
    expect(isUrlAllowedByPolicies(IMG, APP, policies, CONNECT)).toEqual({
      allowed: false,
      directive: 'connect-src',
    });
    expect(isUrlAllowedByPolicies('https://app.test/a', APP, policies, CONNECT)).toEqual(ALLOWED);
  });

  it('an unrelated directive with no fallback list passes through', () => {
    expect(isUrlAllowedByPolicies(IMG, APP, ["img-src 'none'"], 'img-src')).toEqual({
      allowed: false,
      directive: 'img-src',
    });
  });
});
