/**
 * `License` — the text the `license` page prints (`PSystemLicense`) and the
 * licence name `about`/`version` quote.
 *
 * Upstream's build pre-processes this file per edition (`// ::comment when
 * __MIT__ ...` / `// ::uncomment when __MIT__`). The port mirrors the MIT
 * edition (D13): `toString` is "MIT" (java:66-68), and `end3` drops the GPL
 * paragraph (java:155-168, `::comment when __MIT__`) for `addMit`
 * (java:170-172, :240-264). The oracle jar is the GPL edition, so its
 * `license`/`about` probes print the GPL name and paragraph where this port
 * prints MIT's. The other editions' paragraphs (`addEpl`, `addBsd`,
 * `addApache`, `addLgpl`, `addGplv2`, java:266-371) stay commented out in the
 * MIT edition and are not ported.
 *
 * Long runs of `text.add(...)` are module-level line tables, each cited to its
 * java lines (the complexity hook's 30-NLOC cap); the order of additions is
 * upstream's.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java
 */
import type { LicenseInfo } from './LicenseInfo.js';
import { retrieveQuick } from './LicenseInfo.js';
import { LicenseType } from './LicenseType.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:67 */
const MIT = 'MIT';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:115 */
const RULE = '+=======================================================================';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:116 */
const BAR = '| ';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:132 */
const BLANK = ' ';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:379 */
const BAR_WIDE = '|  ';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:139-143 */
const SUPPORT_US = [
  'If you like this project or if you find it useful, you can support us at:',
  BLANK,
  'https://plantuml.com/patreon (only 1$ per month!)',
  'https://plantuml.com/liberapay (only 1€ per month!)',
  'https://plantuml.com/paypal',
] as const;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:145-146 */
const QRCODES =
  '\t<qrcode:https://plantuml.com/patreon>\t\t<qrcode:https://plantuml.com/lp>\t\t<qrcode:https://plantuml.com/paypal>';

/** `addMit`'s paragraph, the MIT edition's `end3` opening (java:170-172).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:241-263 */
const MIT_TEXT = [
  'PlantUML is free software; you can redistribute it and/or modify it',
  'under the terms of the MIT License.',
  BLANK,
  'See http://opensource.org/licenses/MIT',
  BLANK,
  'Permission is hereby granted, free of charge, to any person obtaining',
  'a copy of this software and associated documentation files (the "Software"),',
  'to deal in the Software without restriction, including without limitation',
  'the rights to use, copy, modify, merge, publish, distribute, sublicense,',
  'and/or sell copies of the Software, and to permit persons to whom the',
  'Software is furnished to do so, subject to the following conditions:',
  BLANK,
  'The above copyright notice and this permission notice shall be included',
  'in all copies or substantial portions of the Software.',
  BLANK,
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS',
  'OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
  'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
  'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,',
  'WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR',
  'IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
] as const;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:191-195 */
const SPONSORED = [
  'PlantUML can occasionally display sponsored or advertising messages. Those',
  'messages are usually generated on welcome or error images and never on',
  'functional diagrams.',
  'See https://plantuml.com/professional if you want to remove them',
  BLANK,
] as const;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:207-209 */
const EXCEPTION = [
  'There is an exception : if the textual description in PlantUML language is also covered',
  'by any license, then the generated images are logically covered',
  'by the very same license.',
] as const;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:212-214 */
const STATS = [
  BLANK,
  'This version of PlantUML records general local statistics about usage.',
  '(more info on https://plantuml.com/statistics-report)',
] as const;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:218-219 */
const ARCHIVE = [
  'This distribution bundles a minimal set of GraphViz files and may install them',
  ' if needed in the local temporary directory.',
] as const;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:221-222 */
const IGY = [
  'This is the IGY distribution (Install GraphViz by Yourself).',
  'You have to install GraphViz and to setup the GRAPHVIZ_DOT environment variable',
] as const;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:224-235 */
const CREDITS = [
  '(see https://plantuml.com/graphviz-dot )',
  BLANK,
  'Icons provided by OpenIconic :  https://useiconic.com/open',
  'Archimate sprites provided by Archi :  http://www.archimatetool.com',
  'Stdlib AWS provided by https://github.com/milo-minderbinder/AWS-PlantUML',
  'Stdlib Icons provided https://github.com/tupadr3/plantuml-icon-font-sprites',
  'ASCIIMathML (c) Peter Jipsen http://www.chapman.edu/~jipsen',
  'ASCIIMathML (c) David Lippman http://www.pierce.ctc.edu/dlippman',
  'CafeUndZopfli ported by Eugene Klyuchnikov https://github.com/eustas/CafeUndZopfli',
  'Brotli (c) by the Brotli Authors https://github.com/google/brotli',
  'Themes (c) by Brett Schwarz https://github.com/bschwarz/puml-themes',
  'Twemoji (c) by Twitter at https://twemoji.twitter.com/',
  BLANK,
] as const;

/**
 * The two build/host switches `end3` reads (java:211, :217). Upstream reads
 * them from process state; the port injects them, defaulting to what the
 * oracle jar answers ({@link ORACLE_BUILD}).
 */
export interface LicenseBuild {
  /** `GlobalConfig.getInstance().boolValue(GlobalConfigKey.ENABLE_STATS)`. */
  readonly enableStats: boolean;
  /** `WindowsDotArchive.getInstance().isThereArchive()`. */
  readonly isThereArchive: boolean;
}

/**
 * The oracle jar's answers. `ENABLE_STATS` is `defaultForStats()`, the
 * `PLANTUML_STATS` system property / env var (GlobalConfigKey.java:68-70),
 * false when unset; `src/` reads no environment and this port records no
 * statistics (`UgDiagram.ts`). `isThereArchive` is whether the jar carries the
 * `graphviz.dat` resource (WindowsDotArchive.java:110-118); the oracle jar
 * does — every jar `license` probe prints the "bundles a minimal set of
 * GraphViz files" lines.
 */
export const ORACLE_BUILD: LicenseBuild = { enableStats: false, isThereArchive: true };

/** CLDR `en_US` MEDIUM date (`MMM d, y`), in UTC. */
const MEDIUM_DATE_EN_US = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * `DateFormat.getDateInstance().format(date)`: MEDIUM style in the JVM's
 * default locale and zone. Both are host settings; the oracle host is `en_US`
 * (the jar's `version` page prints `Language: en`, `Country: US`), so the port
 * formats `MMM d, y` in UTC, deterministically.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:378-379
 */
export function formatDateInstance(epochMillis: number): string {
  return MEDIUM_DATE_EN_US.format(new Date(epochMillis));
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:45 */
export class License {
  /** Upstream's implicit no-arg constructor; `build` is port-only (see {@link LicenseBuild}). */
  constructor(private readonly build: LicenseBuild = ORACLE_BUILD) {}

  /** The MIT edition's arm (java:66-68); the GPL arm (java:63-65) is
   *  `// ::comment`ed out in it, the others stay `// ::uncomment`-only.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:61-84 */
  toString(): string {
    return MIT;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:86-88 */
  static getCurrent(): License {
    return new License();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:90-97 */
  getTextFull(): string[] {
    const text: string[] = [];
    const licenseInfo = retrieveQuick();
    this.header1(text, licenseInfo);
    this.header2(text, licenseInfo, false);
    this.end3(licenseInfo, text);
    return text;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:99-103 */
  getText1(licenseInfo: LicenseInfo): string[] {
    const text: string[] = [];
    this.header1(text, licenseInfo);
    return text;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:105-110 */
  getText2(licenseInfo: LicenseInfo): string[] {
    const text: string[] = [];
    this.header2(text, licenseInfo, true);
    this.end3(licenseInfo, text);
    return text;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:112-129 */
  private header1(text: string[], licenseInfo: LicenseInfo): void {
    if (licenseInfo.isNone()) {
      text.push(RULE, BAR, '|      PlantUML : a free UML diagram generator', BAR, RULE);
    } else {
      text.push(RULE, BAR, '|      PlantUML Professional Edition', BAR, RULE);
      License.addLicenseInfo(text, licenseInfo);
      text.push(RULE);
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:131-152 */
  private header2(text: string[], licenseInfo: LicenseInfo, withQrcode: boolean): void {
    text.push(BLANK, '(C) Copyright 2009-2024, Arnaud Roques', BLANK, 'Project Info:  https://plantuml.com', BLANK);
    if (!licenseInfo.isValid()) {
      text.push(...SUPPORT_US);
      if (withQrcode) text.push(QRCODES);
      else text.push('', BLANK);
    }
  }

  /** `addMit(licenseInfo, text)` (java:170-172) in place of the GPL lines.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:154-236 */
  private end3(licenseInfo: LicenseInfo, text: string[]): void {
    this.addMit(licenseInfo, text);
    text.push(BLANK);
    if (!licenseInfo.isValid()) text.push(...SPONSORED);
    text.push(
      'Images (whatever their format : PNG, SVG, EPS...) generated by running PlantUML',
      'are owned by the author of their corresponding sources code (that is, their',
      'textual description in PlantUML language). Those images are not covered by',
      `this ${this.toString()} license.`,
      BLANK,
      `The generated images can then be used without any reference to the ${this.toString()} license.`,
      'It is not even necessary to stipulate that they have been generated with PlantUML,',
      'although this will be appreciated by the PlantUML team.',
      BLANK,
      ...EXCEPTION,
    );
    if (this.build.enableStats) text.push(...STATS);
    text.push(BLANK);
    text.push(...(this.build.isThereArchive ? ARCHIVE : IGY));
    text.push(...CREDITS);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:240-264 */
  private addMit(_licenseInfo: LicenseInfo, text: string[]): void {
    text.push(...MIT_TEXT);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/License.java:373-390 */
  static addLicenseInfo(text: string[], licenseInfo: LicenseInfo): void {
    if (licenseInfo.getLicenseType() === LicenseType.NAMED) {
      text.push(
        BAR,
        `|      LICENSED TO : ${licenseInfo.getOwner() ?? 'null'}`,
        `|      EXPIRATION DATE : ${formatDateInstance(licenseInfo.getExpirationDate())}`,
        BAR_WIDE,
      );
    } else if (licenseInfo.getLicenseType() === LicenseType.DISTRIBUTOR) {
      text.push(BAR_WIDE, `|      DISTRIBUTED BY : ${licenseInfo.getOwner() ?? 'null'}`, BAR_WIDE);
    }
    if (licenseInfo.getLicenseType() !== LicenseType.UNKNOWN && licenseInfo.hasExpired())
      text.push('|      <i>Warning: Your license has expired.', BAR_WIDE);
  }
}
