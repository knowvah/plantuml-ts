/**
 * Single-selector → single-or-few `Theme.colors.graph` field mappings
 * (actor / usecase / class / interface / enum / statediagram / activitybar /
 * package). Table-ized from `applyStyleMap`'s original sequential if-chain
 * (relocated verbatim from `style-map-theme.ts`, not refactored — see
 * .agent-notes) to keep that module under the project's 500-line cap.
 * {@link computeSimpleSelectorOverrides} iterates {@link
 * SIMPLE_SELECTOR_MAPPINGS} in table order, reproducing the exact
 * selector-lookup and field-assignment order of the original if-chain. Each
 * entry populates disjoint `Theme.colors.graph` fields, so table order has
 * no observable effect on the result — it is preserved anyway, as a direct,
 * literal port of the original sequence.
 */

import type { ThemeGraphColors } from './theme.js';
import type { StyleMap } from './skinparam.js';

type StyleProps = ReadonlyMap<string, string>;

interface SimpleSelectorMapping {
  readonly selector: string;
  readonly apply: (props: StyleProps, override: Partial<ThemeGraphColors>) => void;
}

const SIMPLE_SELECTOR_MAPPINGS: readonly SimpleSelectorMapping[] = [
  {
    selector: 'actor',
    apply: (props, override) => {
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) override.actorFill = bg;
    },
  },
  {
    selector: 'actor.business',
    apply: (props, override) => {
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) override.businessActorFill = bg;
    },
  },
  {
    selector: 'usecase',
    apply: (props, override) => {
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) override.usecaseFill = bg;
    },
  },
  {
    selector: 'usecase.business',
    apply: (props, override) => {
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) override.businessUsecaseFill = bg;
    },
  },
  {
    selector: 'class',
    apply: (props, override) => {
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) override.classBackground = bg;
    },
  },
  {
    selector: 'interface',
    apply: (props, override) => {
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) override.interfaceBackground = bg;
    },
  },
  {
    selector: 'enum',
    apply: (props, override) => {
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) override.enumBackground = bg;
    },
  },
  // mission G4 S16: `<style> stateDiagram { arrow { LineColor HeadColor
  // } } }` -- selector "statediagram.arrow" (`theme.ts
  // #stateArrowLineColor`'s own doc comment for the full derivation and
  // jar evidence).
  {
    selector: 'statediagram.arrow',
    apply: (props, override) => {
      const lc = props.get('linecolor');
      if (lc !== undefined) override.stateArrowLineColor = lc;
      const hc = props.get('headcolor');
      if (hc !== undefined) override.stateArrowHeadColor = hc;
    },
  },
  // mission G6 T4: `<style> stateDiagram { RoundCorner N } }` -- the bare
  // (un-nested) "statediagram" selector's own RoundCorner declaration, see
  // `theme.ts#stateCascadeRoundCorner`'s own doc comment for the full
  // derivation and jar evidence (`decede-10-buvu414`).
  {
    selector: 'statediagram',
    apply: (props, override) => {
      const rc = props.get('roundcorner');
      if (rc === undefined) return;
      const parsed = Number.parseFloat(rc);
      if (Number.isFinite(parsed)) override.stateCascadeRoundCorner = parsed;
    },
  },
  // mission G4 S16: `<style> activityBar { .fork { BackGroundColor }
  // .join { BackGroundColor } } }` -- selectors "activitybar..fork"/
  // "activitybar..join" (`theme.ts#activityBarForkColor`'s own doc
  // comment for the double-dot selector-key derivation).
  {
    selector: 'activitybar..fork',
    apply: (props, override) => {
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) override.activityBarForkColor = bg;
    },
  },
  {
    selector: 'activitybar..join',
    apply: (props, override) => {
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) override.activityBarJoinColor = bg;
    },
  },
  {
    selector: 'package',
    apply: (props, override) => {
      const bg = props.get('backgroundcolor');
      if (bg !== undefined) override.packageBackground = bg;
      const border = props.get('bordercolor');
      if (border !== undefined) override.packageBorder = border;
    },
  },
];

/**
 * Resolve every {@link SIMPLE_SELECTOR_MAPPINGS} entry against `styleMap`,
 * in table order (== original if-chain order).
 */
export function computeSimpleSelectorOverrides(styleMap: StyleMap): Partial<ThemeGraphColors> {
  const override: Partial<ThemeGraphColors> = {};
  for (const { selector, apply } of SIMPLE_SELECTOR_MAPPINGS) {
    const props = styleMap.get(selector);
    if (props !== undefined) apply(props, override);
  }
  return override;
}
