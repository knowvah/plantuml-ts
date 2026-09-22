/**
 * CommandCreoleBuilder — builds the `starter prefix -> Command[]` map
 * `StripeSimple#searchCommand` looks up against.
 *
 * Upstream: klimt/creole/legacy/CommandCreoleBuilder.java — two cached
 * singletons (`FULL`, `OTHER`), registering ~25 commands (style, size,
 * color, img, sprite, url, math, latex, ...) via a shared `addCommand`
 * that fans each `Command#starters()` entry out into the map.
 *
 * L1 scope (mission brief: "bold/italic/underline/wave/strikeout at
 * minimum ... the pattern architecture matters more than tag count"):
 * only `CommandCreoleStyle`'s five styles are registered
 * (BOLD/ITALIC/UNDERLINE/STRIKE/WAVE), in upstream's exact declaration
 * order (java :76-95, PLAIN and BACKCOLOR excluded — see below). L2 adds
 * size/color/font/back/code/url/img/sprite/math/latex commands to this
 * same map; this file's `addCommand`/`buildMap` shape does not need to
 * change to accommodate them, only the registration list below grows.
 *
 * A2s/B6 adds `FontStyle.BACKCOLOR` (`<back:color>...</back>`, legacy +
 * legacyEol only — java :96-97) in upstream's ctor position: after the
 * five style triplets, before the size/color commands.
 *
 * cdd-T25 adds `FontStyle.PLAIN` (`<plain>...</plain>`, legacy + legacyEol
 * only — no creole-pure form, `FontStyle#getUbrexCreoleSyntax` throws for
 * it) in upstream's exact ctor position: immediately after ITALIC's
 * triplet, before the FULL-gated UNDERLINE creole-pure registration (java
 * :83-84, `CommandCreoleStyle.createLegacy`/`createLegacyEol(FontStyle
 * .PLAIN)`). Registered in BOTH `FULL`/`OTHER` maps (upstream's own `if
 * (modeSimpleLine == CreoleMode.FULL)` gate at :85 covers ONLY the
 * following UNDERLINE line, not PLAIN) — see `AddStyle.ts` for the
 * "clear all styles" special case its application triggers.
 *
 * Not ported (journaled, deferred to L2/never):
 * - The `CreoleMode.FULL`-only exclusion of the creole-pure `__` underline
 *   command upstream's `OTHER` builder applies: this port has only ONE map
 *   (always FULL), since every L1 call site (`EntityImageDescriptionSupport
 *   .ts#buildTextBlock`, the sole creole entry point) always wants full
 *   creole — no caller ever threads a `CreoleMode.OTHER`-equivalent
 *   (`SIMPLE_LINE`/`NO_CREOLE`/`FULL_BUT_UNDERSCORE`) through. `CreoleMode`
 *   itself is therefore not ported as a type.
 */
import { FontStyle } from '../../shape/UText.js';
import { FontPosition } from '../../font/FontPosition.js';
import type { Command } from '../command/Command.js';
import {
  createStyleCommands,
  createStyleCommandsWithoutCreoleForm,
  createBackcolorCommands,
} from '../command/CommandCreoleStyle.js';
import { createSizeChangeCommands } from '../command/CommandCreoleSizeChange.js';
import { createColorChangeCommands } from '../command/CommandCreoleColorChange.js';
import { createColorAndSizeChangeCommands } from '../command/CommandCreoleColorAndSizeChange.js';
import { createExposantChangeCommand } from '../command/CommandCreoleExposantChange.js';
import { createFontFamilyChangeCommands } from '../command/CommandCreoleFontFamilyChange.js';
import { createEmojiCommand } from '../command/CommandCreoleEmoji.js';
import { createLatexCommand } from '../command/CommandCreoleLatex.js';
import { createMathCommand } from '../command/CommandCreoleMath.js';
import { createMonospacedCommand } from '../command/CommandCreoleMonospaced.js';
import { createUrlCommand } from '../command/CommandCreoleUrl.js';

/** Upstream: `CommandCreoleBuilder#addCommand` — fans one Command's
 *  `starters()` out into the shared map, appending (never replacing) so
 *  multiple Commands sharing a 2-char prefix all remain candidates for
 *  `searchCommand`'s "first non-zero `matchingSize` wins" scan. */
function addCommand(map: Map<string, Command[]>, cmd: Command): void {
  for (const starter of cmd.starters) {
    const list = map.get(starter);
    if (list === undefined) map.set(starter, [cmd]);
    else list.push(cmd);
  }
}

/** Upstream: `CommandCreoleBuilder`'s ctor body, java :76-95 (BOLD, ITALIC,
 *  UNDERLINE, STRIKE, WAVE only — see module doc comment for the rest of
 *  the ctor's commands, all deferred). */
const L1_STYLES: readonly FontStyle[] = [
  FontStyle.BOLD,
  FontStyle.ITALIC,
  FontStyle.UNDERLINE,
  FontStyle.STRIKE,
  FontStyle.WAVE,
];

/** cdd-T25: `FontStyle.PLAIN`'s legacy + legacyEol pair (java :83-84) --
 *  split into its own function purely to keep `buildCommandMap`'s own CCN
 *  under the project's per-function cap (a pure extraction of what would
 *  otherwise be one more `for (const cmd of ...) addCommand(map, cmd);`
 *  line in that function, no behavior change). No creole-pure form
 *  (`FontStyle#getUbrexCreoleSyntax` throws for PLAIN); registered in
 *  BOTH `FULL`/`OTHER` maps (upstream's `if (modeSimpleLine ==
 *  CreoleMode.FULL)` gate at java :85 covers only the FOLLOWING
 *  UNDERLINE line, never PLAIN). */
function registerPlain(map: Map<string, Command[]>): void {
  for (const cmd of createStyleCommandsWithoutCreoleForm(FontStyle.PLAIN)) addCommand(map, cmd);
}

/** L2 additions (mission `plans/e2r-creole/`), registered in upstream's own
 *  `CommandCreoleBuilder` ctor order (java :98-117, minus the not-ported
 *  entries -- the img-adjacent commands, see this file's module doc
 *  comment): size, color, font(size/color), exposant (SI30), then
 *  font(family) LAST among
 *  the `<f` starter's two claimants (`CommandCreoleColorAndSizeChange` must
 *  be tried first -- its pattern requires a `size=`/`color=` attr, so a
 *  bare `<font:Name>` correctly falls through to `CommandCreoleFontFamily
 *  Change` only when the stricter pattern fails to match). */
function buildCommandMap(mode: 'FULL' | 'OTHER'): Map<string, Command[]> {
  const map = new Map<string, Command[]>();
  for (const style of L1_STYLES) {
    // A2s R2a: the creole-pure `__` UNDERLINE command is FULL-gated
    // upstream (`if (modeSimpleLine == CreoleMode.FULL)`, java :85-86) —
    // the ONLY difference between the FULL and OTHER maps. Jar reach:
    // class NAME headers (`CreoleMode.FULL_BUT_UNDERSCORE`,
    // EntityImageClassHeader.java:107-108) measure `__Test__` raw
    // (curupe-50-kibu120 golden).
    const cmds =
      style === FontStyle.UNDERLINE && mode === 'OTHER'
        ? createStyleCommandsWithoutCreoleForm(style)
        : createStyleCommands(style);
    for (const cmd of cmds) addCommand(map, cmd);
  }
  // cdd-T25: upstream ctor position (java :83-84) is between ITALIC's
  // triplet and the FULL-gated UNDERLINE creole-pure line above -- kept
  // in the SAME relative window (still before BACKCOLOR), factored into
  // its own function purely to keep `buildCommandMap`'s own CCN under
  // the project's per-function cap; starters `<p`/`<P` share no 2-char
  // prefix with any other L1/L2 command, so this exact position has no
  // observable `searchCommand` tie-break effect.
  registerPlain(map);
  // Upstream ctor position (java :96-97): BACKCOLOR legacy + legacyEol,
  // after the style triplets, before the size/color commands. Ordering
  // matters for the shared `<b` starter: BOLD's commands stay first.
  for (const cmd of createBackcolorCommands()) addCommand(map, cmd);
  for (const cmd of createSizeChangeCommands()) addCommand(map, cmd);
  for (const cmd of createColorChangeCommands()) addCommand(map, cmd);
  for (const cmd of createColorAndSizeChangeCommands()) addCommand(map, cmd);
  // SI30: upstream ctor position (java :104-105) — immediately after the
  // color/size commands, before `CommandCreoleImg` (java :106). Both
  // positions share the `<s` starter with `CommandCreoleSizeChange` and the
  // legacy STRIKE forms, which are registered EARLIER and therefore tried
  // first; neither of their patterns can match a `<sup>`/`<sub>` tag, so the
  // scan falls through to these two. Registered in BOTH maps (upstream has no
  // mode gate here), so member rows and headers parse it too.
  addCommand(map, createExposantChangeCommand(FontPosition.EXPOSANT));
  addCommand(map, createExposantChangeCommand(FontPosition.INDICE));
  // A2s R2i: upstream ctor position (java :109) — after the color commands
  // (relative order preserved: color/colorAndSize claim their starters
  // first), before math/latex. Registered in BOTH maps (no mode gate), so
  // member rows (SIMPLE_LINE) and headers (FULL_BUT_UNDERSCORE) parse it.
  addCommand(map, createEmojiCommand());
  addCommand(map, createLatexCommand());
  addCommand(map, createMathCommand());
  for (const cmd of createFontFamilyChangeCommands()) addCommand(map, cmd);
  // A2s R2a: upstream ctor position (java :118) — after the font-family
  // pair, before url. `""` is a starter no other command claims.
  addCommand(map, createMonospacedCommand());
  addCommand(map, createUrlCommand());
  return map;
}

/** Upstream: `CommandCreoleBuilder.FULL` (java :69) — built once, reused
 *  for every line. */
export const CREOLE_COMMANDS: ReadonlyMap<string, readonly Command[]> = buildCommandMap('FULL');

/** Upstream: `CommandCreoleBuilder.OTHER` (java :70) — the map every
 *  non-FULL `CreoleMode` selects (StripeSimple.java:112-115), differing
 *  from FULL only by the creole-pure `__` underline command (see
 *  {@link buildCommandMap}). A2s R2a: added for the class-name header's
 *  `FULL_BUT_UNDERSCORE` reach; `legacy/StripeSimple.ts#buildStripeAtoms`
 *  selects it via its optional `mode` parameter. */
export const CREOLE_COMMANDS_OTHER: ReadonlyMap<string, readonly Command[]> = buildCommandMap('OTHER');
