/**
 * Built-in PlantUML skin stylesheets (`skin <name>` directive) --
 * skin-file-loading mission, Batches 1 (D1/D2) and 4; unwind2-S8.
 *
 * Verbatim text of the oracle jar's `skin/<name>.skin` resources -- every one
 * a `<style>`-block grammar sheet (`root {}`/`element {}`/`<diagramType> {}`),
 * parsed by `parseStyleBlock` in `skin-loader.ts`. The jar bundles exactly
 * `debug`, `plantuml`, `rose`, `sonyxperiadev` and `strictuml`
 * (`src/main/resources/skin/`); there is no `reddress.skin` (removed upstream
 * by commit 11ed6720, plantuml/plantuml#2797), so `skin reddress` is upstream's
 * "Cannot find style" command error (`TitledDiagram.java:168-169`).
 *
 * `plantuml.skin` is already the baked-in root default (`resolveTheme`'s
 * own default theme) and is not re-embedded either -- a `skin <name>`
 * file layers ON TOP of it (D2), it does not replace it.
 *
 * Keys are the skin name exactly as PlantUML's `skin` directive spells
 * it, lowercased -- `skin-loader.ts` lowercases the captured directive
 * argument before lookup (mirrors `BUILTIN_THEMES`' own case convention,
 * `themes-builtin.ts`).
 */
import { ROSE_SKIN_PART1 } from './skins-builtin-rose-1.js';
import { ROSE_SKIN_PART2 } from './skins-builtin-rose-2.js';
import { SONYXPERIADEV_SKIN_PART1 } from './skins-builtin-sonyxperiadev-1.js';
import { SONYXPERIADEV_SKIN_PART2 } from './skins-builtin-sonyxperiadev-2.js';

export const BUILTIN_SKINS: Readonly<Record<string, string>> = {
  rose: ROSE_SKIN_PART1 + ROSE_SKIN_PART2,
  debug: `root {
  FontName SansSerif
  HyperLinkColor red
  FontColor green
  FontSize 19
  FontStyle plain
  HorizontalAlignment left
  RoundCorner 15
  DiagonalCorner 0
  LineColor #3600A8
  LineThickness 4
  BackGroundColor #AAA
  Shadowing 0.0
}

stereotype {
  FontColor blue
  FontSize 8
  FontStyle bold
}

title {
  HorizontalAlignment right
  FontSize 24
  FontColor blue
}

header {
  HorizontalAlignment center
  FontSize 26
  FontColor purple
}

footer {
  HorizontalAlignment left
  FontSize 28
  FontColor red
}

legend {
  FontSize 30
  BackGroundColor yellow
  Margin 30
  Padding 50
}

caption {
  FontSize 32
}


element {
  BackGroundColor #CEFEFE
}

sequenceDiagram {
}

classDiagram {
}

activityDiagram {
}


group {
  LineThickness 3.5
  BackGroundColor MistyRose
  LineColor DarkOrange
  
  FontSize 12
  FontStyle italic
  FontColor red
}

groupHeader {
  BackGroundColor tan
  LineThickness 0.5
  LineColor yellow

  FontSize 18
  FontStyle bold
  FontColor blue
}

lifeLine {
  BackGroundColor gold
}

destroy {
  LineColor red
}

reference {
  LineColor red
  FontSize 10
  FontStyle bold
  FontColor blue
  BackGroundColor gold
  HorizontalAlignment right
}

box {
  LineThickness 4
  LineColor FireBrick
  BackGroundColor PowderBlue

  FontSize 12
  FontStyle italic
  FontColor Maroon
}

separator {
  LineColor red
  BackGroundColor green
  
  FontSize 16
  FontStyle bold
  FontColor white
}

delay {
  FontSize 22
  FontStyle italic
}

newpage {
  Linecolor fuchsia
}

participant {
  LineThickness 4
}

actor {
  LineThickness 4
}

boundary {
  LineThickness 4
}

control {
  LineThickness 4
}

entity {
  LineThickness 4
}

queue {
  LineThickness 4
}

database {
  LineThickness 4
}

collections {
  LineThickness 4
}

arrow {
  FontSize 13
  LineColor Lime
}

note {
  BackGroundColor GoldenRod
}

diamond {
}

swimlane {
}

activity {
  BackgroundColor #33668E
  BorderColor #33668E
  FontColor #888
  FontName arial
}


activityDiagram {
	diamond {
	  BackgroundColor #dae4f1
	  BorderColor #33668E
	  FontColor red
	  FontName arial
	  FontSize 5
	}
	arrow {
	  FontColor gold
	  FontName arial
	  FontSize 15
	}
	partition {
	  LineColor red
	  FontColor green
	  RoundCorner 30
	  BackColor PeachPuff
	}
	note {
	  FontColor Blue
	  LineColor yellow
	}
}

circle {
  LineColor yellow
}

activityBar {
  LineColor lightGreen
}

mindmapDiagram {
    Padding 10
    Margin 10
}

node {
}
`,
  strictuml: `root {
  Shadowing 0.0
}
element {
  Shadowing 0.0
}
`,
  sonyxperiadev: SONYXPERIADEV_SKIN_PART1 + SONYXPERIADEV_SKIN_PART2,
};
