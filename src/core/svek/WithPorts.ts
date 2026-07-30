import type { Ports } from './Ports.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';

/**
 * WithPorts — implemented by any `TextBlock`-ish type that can report the
 * `Ports` (named-port y-bands) it contains. Upstream implementors:
 * `TextBlockLineBefore`, `SheetBlock2`, `BodyEnhanced1`, `MethodsOrFieldsArea`,
 * `Body3`, `TextBlockMap`, `TextBlockCucaJSon`, `TextBlockVertical`,
 * `TextBlockMarged` — this task lands the first two; the rest are ported
 * alongside their own owning class (SI1/E2r follow-on scope, not this task).
 *
 * Upstream: svek/WithPorts.java — a one-method functional interface.
 * Ported in full.
 */
export interface WithPorts {
  getPorts(stringBounder: StringBounder): Ports;
}
