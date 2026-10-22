/**
 * Shared builders for tests of the sequence creole seam
 * (`src/diagrams/sequence/sequence-creole-sheet.ts`).
 */
import type { FontConfiguration } from '../../src/core/klimt/shape/UText.js';
import { FontStyle } from '../../src/core/klimt/shape/UText.js';
import { DeterministicMeasurer } from '../../src/core/measurer-deterministic.js';
import {
  sequenceLabelBlock,
  type LabelBlock,
  type LabelOptions,
} from '../../src/diagrams/sequence/sequence-creole-sheet.js';

/** The default sequence family. */
export const SANS = 'sans-serif';

/** A `FontConfiguration` literal: `size` at `family`, black, with `styles`. */
export function labelFont(size: number, styles: readonly FontStyle[] = [], family = SANS): FontConfiguration {
  return { family, size, color: '#000000', styles: new Set(styles) };
}

/** A bold {@link labelFont}. */
export function boldFont(size: number): FontConfiguration {
  return labelFont(size, [FontStyle.BOLD]);
}

/** `lines` through the seam with a fresh deterministic measurer. */
export function labelBlockOf(lines: readonly string[], font: FontConfiguration, opts: LabelOptions = {}): LabelBlock {
  return sequenceLabelBlock(lines, font, opts, new DeterministicMeasurer());
}
