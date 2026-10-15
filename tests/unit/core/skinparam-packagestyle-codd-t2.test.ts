/**
 * codd-T2 M2 -- `skinparam packagestyle` reaches the cluster's `USymbol`.
 *
 * `SkinParam#packageStyle` (`SkinParam.java:820-826`) is `PackageStyle.fromString(getValue("packageStyle"))`,
 * FOLDER when unknown; `PackageStyle.fromString` (`PackageStyle.java:50-58`) matches the enum names
 * case-insensitively plus `rect` -> RECTANGLE. The `package` keyword's symbol is then
 * `packageStyle().toUSymbol()` (`USymbols.java:103-104`, called from `CommandPackageWithUSymbol.java:194`),
 * which is null for AGENT/STORAGE/COMPONENT1/COMPONENT2/ARTIFACT (`PackageStyle.java:69-92`).
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme, type Theme } from '../../../src/core/theme.js';
import { resolvePackageStyle, resolveSymbol } from '../../../src/core/decoration/symbol/usymbol-resolve.js';
import { PackageStyle } from '../../../src/core/svek/PackageStyle.js';
import { USymbols } from '../../../src/core/decoration/symbol/USymbols.js';

function themeFor(value: string): Theme {
  return resolveSkinparam(new Map([['packagestyle', value]]), defaultTheme).theme;
}

describe('skinparam packagestyle -> Theme.packageStyle', () => {
  it.each([
    ['rect', 'rect'],
    ['Rectangle', 'rect'],
    ['NODE', 'node'],
    ['frame', 'frame'],
    ['Cloud', 'cloud'],
    ['database', 'database'],
    ['card', 'card'],
    ['agent', 'agent'],
    ['storage', 'storage'],
    ['component1', 'component1'],
    ['component2', 'component2'],
    ['artifact', 'artifact'],
    ['folder', 'folder'],
  ])('%s -> %s', (value, expected) => {
    expect(themeFor(value).packageStyle).toBe(expected);
  });

  it('an unknown value leaves the setting unchanged (PackageStyle.fromString -> null -> FOLDER)', () => {
    expect(themeFor('bogus').packageStyle).toBeUndefined();
    expect(resolvePackageStyle(themeFor('bogus'))).toBe(PackageStyle.FOLDER);
  });
});

describe('resolvePackageStyle', () => {
  it('defaults to FOLDER (SkinParam.java:823-824)', () => {
    expect(resolvePackageStyle(defaultTheme)).toBe(PackageStyle.FOLDER);
  });

  it('maps rect to RECTANGLE and node to NODE', () => {
    expect(resolvePackageStyle(themeFor('rect'))).toBe(PackageStyle.RECTANGLE);
    expect(resolvePackageStyle(themeFor('node'))).toBe(PackageStyle.NODE);
  });
});

describe('resolveSymbol for the package keyword', () => {
  it('is the folder PACKAGE by default', () => {
    expect(resolveSymbol('package', defaultTheme)).toBe(USymbols.PACKAGE);
  });

  it('follows packageStyle (USymbols.java:103-104)', () => {
    expect(resolveSymbol('package', themeFor('node'))).toBe(USymbols.NODE);
    expect(resolveSymbol('package', themeFor('rect'))).toBe(USymbols.RECTANGLE);
    expect(resolveSymbol('package', themeFor('frame'))).toBe(USymbols.FRAME);
  });

  it('is null where PackageStyle#toUSymbol is null', () => {
    for (const style of ['agent', 'storage', 'component1', 'component2', 'artifact']) {
      expect(resolveSymbol('package', themeFor(style))).toBeNull();
    }
  });

  it('leaves every other keyword alone', () => {
    expect(resolveSymbol('node', themeFor('rect'))).toBe(USymbols.NODE);
  });
});
