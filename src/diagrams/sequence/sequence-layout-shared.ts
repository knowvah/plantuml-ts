/**
 * Small shared leaf utilities for sequence diagram layout.
 * No dependencies on sibling layout modules — keeps the module graph a DAG.
 */

import type { FontSpec } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';

/** Derive the font spec used for all sequence-diagram text measurement. */
export function fontSpecOf(theme: Theme): FontSpec {
  return { family: theme.fontFamily, size: theme.fontSize };
}
