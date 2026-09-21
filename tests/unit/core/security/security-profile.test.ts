/**
 * Upstream's network gate: `SecurityProfile` (timeouts), `SURL#isUrlOk`
 * (per-profile decision + allowlist) and `URLCheck#isURLforbidden`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/security/
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SECURITY_PROFILE,
  SecurityProfile,
  getTimeout,
} from '../../../../src/core/security/SecurityProfile.js';
import { isURLforbidden } from '../../../../src/core/security/URLCheck.js';
import { isUrlOk } from '../../../../src/core/security/SURL.js';

const { SANDBOX, ALLOWLIST, INTERNET, INTERNET_WITH_DOTSVG, LEGACY, INSECURE } = SecurityProfile;
const PUBLIC = 'https://example.com/lib/x.puml';

describe('SecurityProfile', () => {
  it('defaults to LEGACY, as SecurityProfile.init does with no env var (SecurityProfile.java:136)', () => {
    expect(DEFAULT_SECURITY_PROFILE).toBe(LEGACY);
  });

  it.each([
    [SANDBOX, 1000],
    [ALLOWLIST, 300000],
    [INTERNET, 10000],
    [INTERNET_WITH_DOTSVG, 10000],
    [LEGACY, 60000],
    [INSECURE, 300000],
  ])('getTimeout(%s) is %i ms (SecurityProfile.java:161-176)', (profile, ms) => {
    expect(getTimeout(profile)).toBe(ms);
  });
});

describe('URLCheck.isURLforbidden', () => {
  it.each([
    [PUBLIC, false],
    ['http://example.com', false],
    ['http://user@example.com/x', true],
    ['http://user:pw@example.com/x', true],
    ['ftp://example.com/x', true],
    ['file:///etc/passwd', true],
    ['http://127.0.0.1/x', true],
    ['http://10.0.0.1:8080/x', true],
    ['http://[::1]/x', true],
    ['http://169.254.169.254', true],
    ['http://localhost/x', true],
    ['http://intranet', true],
    ['http://ex%61mple.com/x', true],
    ['http://a+b.com/x', true],
    ['http://a.com:notaport/x', true],
  ])('%s -> %s under LEGACY', (url, forbidden) => {
    expect(isURLforbidden(url, LEGACY)).toBe(forbidden);
  });

  it('INSECURE skips only the address check -- a bare IP host still fails the string checks', () => {
    expect(isURLforbidden('http://127.0.0.1/x', INSECURE)).toBe(true);
    expect(isURLforbidden('http://127.0.0.1', INSECURE)).toBe(false);
    expect(isURLforbidden('http://127.0.0.1', LEGACY)).toBe(true);
  });
});

describe('SURL.isUrlOk', () => {
  it('SANDBOX refuses everything, allowlisted or not', () => {
    expect(isUrlOk(PUBLIC, SANDBOX, [PUBLIC])).toBe(false);
  });

  it('ALLOWLIST accepts only allowlisted prefixes', () => {
    expect(isUrlOk(PUBLIC, ALLOWLIST, ['https://example.com/lib/'])).toBe(true);
    expect(isUrlOk(PUBLIC, ALLOWLIST, ['https://example.com/other/'])).toBe(false);
    expect(isUrlOk(PUBLIC, ALLOWLIST, [])).toBe(false);
  });

  it('allowlist matching is case-insensitive and ignores default ports (SURL.cleanPath)', () => {
    expect(isUrlOk('HTTPS://EXAMPLE.COM/lib/x.puml', ALLOWLIST, ['https://example.com/lib'])).toBe(true);
  });

  it('a url containing @ is never allowlisted', () => {
    expect(isUrlOk('https://example.com/lib/@x', ALLOWLIST, ['https://example.com/lib/'])).toBe(false);
  });

  it('LEGACY accepts public urls and refuses internal ones', () => {
    expect(isUrlOk(PUBLIC, LEGACY, [])).toBe(true);
    expect(isUrlOk('http://192.168.1.1/x', LEGACY, [])).toBe(false);
    expect(isUrlOk('http://localhost:8080/x', LEGACY, [])).toBe(false);
  });

  it('the allowlist overrides LEGACY and INTERNET refusals', () => {
    expect(isUrlOk('http://10.0.0.5/x', LEGACY, ['http://10.0.0.5/'])).toBe(true);
    expect(isUrlOk('http://intranet/x', INTERNET, ['http://intranet/'])).toBe(true);
  });

  it('INSECURE accepts anything', () => {
    expect(isUrlOk('http://127.0.0.1/x', INSECURE, [])).toBe(true);
  });

  it.each([INTERNET, INTERNET_WITH_DOTSVG])('%s accepts only ports 80/443/default', (profile) => {
    expect(isUrlOk(PUBLIC, profile, [])).toBe(true);
    expect(isUrlOk('https://example.com:443/x', profile, [])).toBe(true);
    expect(isUrlOk('http://example.com:80/x', profile, [])).toBe(true);
    expect(isUrlOk('https://example.com:80/x', profile, [])).toBe(true);
    expect(isUrlOk('https://example.com:8443/x', profile, [])).toBe(false);
    expect(isUrlOk('http://10.1.2.3/x', profile, [])).toBe(false);
  });
});
