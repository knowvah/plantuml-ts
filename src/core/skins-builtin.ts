/**
 * Built-in PlantUML skin stylesheets (`skin <name>` directive) --
 * skin-file-loading mission, Batches 1 (D1/D2) and 4.
 *
 * Verbatim text of `~/git/plantuml/src/main/resources/skin/<name>.skin`
 * (upstream jar resources). Two grammars (D1), both routed by
 * `skin-loader.ts` to the SAME machinery an inline document already uses
 * for that grammar -- no new parser either way:
 *
 *  - `rose`, `debug`, `strictuml`: `<style>`-block grammar (`root {}`/
 *    `element {}`/`<diagramType> {}`) -- `parseStyleBlock`.
 *  - `reddress`, `sonyxperiadev`: TIM preprocessor macros (`!ifndef`/
 *    `!define`/`!ifdef`) and/or bare `skinparam`/`SkinParam` lines, NOT
 *    `<style>` blocks -- `preprocess()` + `resolveSkinparam` (Batch 4).
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
  reddress: `!ifndef FONTNAME
!define FONTNAME "Verdana"
!endif

!ifndef FONTSIZE
!define FONTSIZE 11
!endif

!ifdef DARKBLUE
skinparam backgroundColor 777
!define ACCENT 1a66c2
!define ACCENTDARK 002642
skinparam stereotypeCBackgroundColor ACCENT
!define DARKSTYLE
!endif
!ifdef LIGHTBLUE
!define ACCENT 2a86e2
!define ACCENTDARK 1a66c2
skinparam stereotypeCBackgroundColor ACCENTDARK
!define LIGHTSTYLE
!endif

!ifdef DARKRED
!define ACCENT 880000
!define ACCENTDARK 330000
skinparam stereotypeCBackgroundColor ACCENT
!define DARKSTYLE
!endif
!ifdef LIGHTRED
!define ACCENT CC0033
!define ACCENTDARK AA0033
skinparam stereotypeCBackgroundColor ACCENTDARK
!define LIGHTSTYLE
!endif

!ifdef DARKGREEN
!define ACCENT 228811
!define ACCENTDARK 113300
skinparam stereotypeCBackgroundColor ACCENT
!define DARKSTYLE
!endif
!ifdef LIGHTGREEN
!define ACCENT 55BB33
!define ACCENTDARK 338822
skinparam stereotypeCBackgroundColor ACCENTDARK
!define LIGHTSTYLE
!endif

!ifdef DARKORANGE
!define ACCENT BB6600
!define ACCENTDARK 662200
skinparam stereotypeCBackgroundColor ACCENT
!define DARKSTYLE
!endif
!ifdef LIGHTORANGE
!define ACCENT FF8800
!define ACCENTDARK BB6600
skinparam stereotypeCBackgroundColor ACCENT
!define LIGHTSTYLE
!endif

!ifdef LIGHTSTYLE
!define PRIMARY 000
!define SECONDARY 333
!define ARROWCOLOR 000
!define ARROWFONTCOLOR 333
!define BORDERCOLOR aaa
!define BOXBG ccc
skinparam backgroundColor fff
!endif

!ifdef DARKSTYLE
!define PRIMARY fff
!define SECONDARY aaa
!define ARROWCOLOR fff
!define ARROWFONTCOLOR bbb
!define BORDERCOLOR 1b1b1b
!define BOXBG 2e2e2e
skinparam backgroundColor 777
!endif


skinparam circledCharacter {
  radius 8
  fontSize FONTSIZE
  fontName FONTNAME
}

skinparam class {
  backgroundColor BOXBG
  borderColor BORDERCOLOR

  fontColor PRIMARY
  fontName FONTNAME
  fontSize FONTSIZE

	arrowColor ARROWCOLOR
	arrowFontName FONTNAME
	arrowFontColor ARROWFONTCOLOR
	arrowFontSize FONTSIZE

  attributeFontColor SECONDARY
  attributeFontSize FONTSIZE
  attributeIconSize FONTSIZE
  stereotypeFontColor SECONDARY
  stereotypeFontSize FONTSIZE
}

skinparam note {
  backgroundColor ACCENT
  borderColor ACCENTDARK

  fontColor PRIMARY
  fontName FONTNAME
  fontSize FONTSIZE
}`,
  sonyxperiadev: `SkinParam BackgroundColor #white
SkinParam Shadowing false
SkinParam SequenceMessageAlign center
SkinParam DefaultFontName Arial
SkinParam DefaultFontStyle bold
SkinParam DefaultFontColor #333333

SkinParam NoteBackgroundColor #fbfb77
SkinParam NoteBorderColor #cbcb47

SkinParam NoteBackgroundColor #ffffcd
SkinParam NoteBorderColor #a9a980
SkinParam NoteFontColor #676735
SkinParam NoteFontStyle italic

SkinParam SequenceArrowColor #555555
SkinParam SequenceArrowFontColor #555555
SkinParam SequenceArrowFontStyle none

SkinParam SequenceBoxBackgroundColor #fafafa
SkinParam SequenceBoxBorderColor #eeeeee
SkinParam SequenceBoxFontColor #666666
SkinParam SequenceBoxFontSize 12
SkinParam SequenceBoxFontStyle italic

SkinParam ParticipantBackgroundColor #dde5ff
SkinParam ParticipantBorderColor #cccccc
SkinParam ParticipantFontColor #333333
SkinParam ParticipantFontStyle bold

SkinParam DatabaseBackgroundColor #df4646
SkinParam DatabaseFontColor #red
SkinParam DatabaseFontStyle bold

SkinParam EntityBackgroundColor #999999

SkinParam SequenceLifeLineBorderColor #bbbbbb
`,
};
