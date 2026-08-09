/**
 * Offline SVG-conformance RATCHET for yaml diagrams. Mission A5 / T1.
 *
 * `@startyaml` — parses with `parseYaml`, then shares json's `layoutJson`/`renderJson` verbatim.
 *
 * The suite body is shared with its two siblings — see
 * `json-family-ratchet.ts` for why these three factor where
 * class/object/state duplicate, and for why there is no AC3 here (ADR-3: the
 * jar emits no DOT for this family, so the DOT-equal eligibility gate the
 * siblings use cannot be computed).
 */
import { describeJsonFamilyRatchet } from './json-family-ratchet.js';

describeJsonFamilyRatchet('yaml');
