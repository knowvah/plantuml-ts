/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/security/URLCheck.java
 */
import { SecurityProfile } from './SecurityProfile.js';

// URLCheck.java:52-55, verbatim. Java `String#matches` is anchored at both ends.
const IP_HOST_WITH_PATH = /^https?:\/\/[-#.0-9:[\]+]+\/.*$/s;
const DOTLESS_HOST_WITH_PATH = /^https?:\/\/[^.]+\/.*$/s;
const DOTLESS_HOST = /^https?:\/\/[^.]+$/s;
// URLCheck.java:90
const IP_LIKE_HOST = /^[-#.0-9:[\]+]+$/;

/**
 * `URL#getHost` on the RAW string: the authority minus user info and port,
 * brackets kept for an IPv6 literal. Read lexically because WHATWG `URL`
 * percent-decodes and IDNA-maps `hostname`, which would hide exactly what the
 * decode check below looks for.
 */
function rawHost(full: string): string {
  const afterScheme = full.substring(full.indexOf('://') + 3);
  const authority = /^[^/?#]*/.exec(afterScheme)![0];
  const hostPort = authority.substring(authority.lastIndexOf('@') + 1);
  if (hostPort.startsWith('[')) return hostPort.substring(0, hostPort.indexOf(']') + 1);
  const colon = hostPort.indexOf(':');
  return colon === -1 ? hostPort : hostPort.substring(0, colon);
}

/** Java `new URL(full)` succeeding. */
function parses(full: string): boolean {
  try {
    new URL(full);
    return true;
  } catch {
    return false;
  }
}

/**
 * `URLCheck.isURLforbidden(URL)`, on the string form.
 *
 * PLANTUML-TS DIVERGENCE (DIVERGENCES.md, "Security profiles"): upstream also
 * resolves the host through DNS and refuses any-local, loopback, link-local
 * and site-local addresses (`isInnerAddress`, :93-95, :107-112). A browser has
 * no DNS API and `src/` may not use Node's, so only the lexical checks run: a
 * host NAME that resolves to an internal address is not refused here.
 * @see ~/git/plantuml/.../security/URLCheck.java:70-105
 */
function isHostForbidden(full: string, profile: SecurityProfile): boolean {
  if (!parses(full)) return true;
  const host = rawHost(full);
  if (host === '' || !host.includes('.')) return true;
  if (profile !== SecurityProfile.INSECURE && IP_LIKE_HOST.test(host)) return true;
  // `URLDecoder.decode(host)` differs from `host` exactly when it holds a
  // `%` escape or a `+` (decoded to a space); a malformed `%` throws, which
  // the caller (:59-63) also treats as forbidden.
  return host.includes('%') || host.includes('+');
}

/**
 * `URLCheck.isURLforbidden(String)`: `full` is already `SURL#cleanPath`ed.
 * @see ~/git/plantuml/.../security/URLCheck.java:46-68
 */
export function isURLforbidden(full: string, profile: SecurityProfile): boolean {
  // Thanks to Agasthya Kasturi
  if (full.includes('@')) return true;
  if (!full.startsWith('https://') && !full.startsWith('http://')) return true;
  if (IP_HOST_WITH_PATH.test(full)) return true;
  if (DOTLESS_HOST_WITH_PATH.test(full)) return true;
  if (DOTLESS_HOST.test(full)) return true;
  return isHostForbidden(full, profile);
}
