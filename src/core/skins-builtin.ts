/**
 * Built-in PlantUML `<style>`-grammar skin stylesheets (`skin <name>`
 * directive) -- skin-file-loading mission, Batch 1 (decisions D1/D2).
 *
 * Verbatim text of `~/git/plantuml/src/main/resources/skin/<name>.skin`
 * (upstream jar resources) -- the SAME `<style>`-block grammar
 * (`parseStyleBlock`, `src/core/skinparam.ts`) an inline `<style>` block
 * uses, so `skin-loader.ts` parses and applies these with NO new parser.
 *
 * Only the three skins that use this grammar are embedded: `rose`,
 * `debug`, `strictuml` (verified by parsing each -- root {}/element {}/
 * <diagramType> {} blocks throughout, no `!`-prefixed preprocessor
 * directive or bare `skinparam` line anywhere). `reddress` and
 * `sonyxperiadev` use a DIFFERENT grammar (TIM preprocessor macros +
 * bare `skinparam` lines) and are deliberately NOT embedded here -- D1,
 * Batch 4. `plantuml.skin` is already the baked-in root default
 * (`resolveTheme`'s own default theme) and is not re-embedded either --
 * a `skin <name>` file layers ON TOP of it (D2), it does not replace it.
 *
 * Keys are the skin name exactly as PlantUML's `skin` directive spells
 * it, lowercased -- `skin-loader.ts` lowercases the captured directive
 * argument before lookup (mirrors `BUILTIN_THEMES`' own case convention,
 * `themes-builtin.ts`).
 */
export const BUILTIN_SKINS: Readonly<Record<string, string>> = {
  rose: `root {
  FontName SansSerif
  HyperLinkColor blue
  HyperLinkUnderlineThickness 1
  FontColor black
  FontSize 14
  FontStyle plain
  HorizontalAlignment left
  RoundCorner 0
  DiagonalCorner 0
  LineThickness 1.0
  LineColor #A80036
  BackGroundColor #FEFECE
  Shadowing 0.0
}

document {
  BackGroundColor white
  header {
    HorizontalAlignment right
    FontSize 10
    FontColor #8
    BackGroundColor transparent
    LineColor transparent
  }
  title {
    HorizontalAlignment center
    FontSize 14
    FontStyle bold
    Padding 5
    Margin 5
    LineColor transparent
    BackGroundColor transparent
  }
  footer {
    HorizontalAlignment center
    FontSize 10
    FontColor #8
    BackGroundColor transparent
    LineColor transparent
  }
  legend {
    LineColor black
    BackGroundColor #d
    FontSize 14
    RoundCorner 15
    Padding 6
    Margin 8
  }
  caption {
    HorizontalAlignment center
    FontSize 14
    Padding 0
    Margin 1
    LineColor transparent
    BackGroundColor transparent
  }
  frame {
    LineColor black
    LineThickness 1.5
  }
}

stereotype {
  FontStyle italic
}



element {
  Shadowing 4.0
  composite {
    title {
      FontStyle bold
    }
  }
}

artifact {
  Shadowing 4.0
}
node {
  Shadowing 2.0
}
person {
  Shadowing 2.0
}
queue {
  Shadowing 2.0
}
rectangle {
  Shadowing 3.0
}
stack {
  Shadowing 3.0
}
storage {
  Shadowing 3.0
}
boundary {
  Shadowing 4.0
}
card {
  Shadowing 3.0
}
cloud {
  Shadowing 3.0
}
collections {
  Shadowing 3.0
}
component {
  Shadowing 4.0
}
database {
  Shadowing 3.0
}
file {
  Shadowing 3.0
}
frame {
  Shadowing 3.0
}
folder {
  Shadowing 3.0
}
group {
  package {
    LineThickness 1.5
    LineColor black
  }
  folder {
    LineThickness 1.5
    LineColor black
  }
}

group {
    BackGroundColor transparent
}

componentDiagram {
  node, rectangle {
    LineColor black
    LineThickness 1.5
  }
}


sequenceDiagram {
  group {
    LineColor black
    LineThickness 2.0
    FontSize 11
    FontStyle bold
  }

  groupHeader {
    BackGroundColor #e
    LineColor black
    FontSize 13
    FontStyle bold
  }

  lifeLine {
    LineStyle 5
  }

  activationBox {
    BackGroundColor white
  }


	destroy {
	}

	reference {
	  FontSize 12
	  LineColor black
	  BackGroundColor white
	  LineThickness 2.0
	  HorizontalAlignment center
	}

	referenceHeader {
	  LineColor black
	  BackGroundColor #e
	  FontColor black
	  FontSize 13
	  FontStyle bold
	  LineThickness 2.0
	}

	box {
	  BackGroundColor #d

	  FontSize 13
	  FontStyle bold
	}

	separator {
	  LineColor black
	  LineThickness 2.0
	  BackGroundColor #e

	  FontSize 13
	  FontStyle bold
	  Padding 4
	}

	participant,actor,boundary,control,entity,queue,database,collections {
	  Padding 7
	}

}

classDiagram {
}

visibilityIcon {
  public {
    LineColor #038048
    BackgroundColor #84BE84
  }
  private {
    LineColor #C82930
    BackgroundColor #F24D5C
  }
  protected {
    LineColor #B38D22
    BackgroundColor #FFFF44
  }
  package {
    LineColor #1963A0
    BackgroundColor #4177AF
  }
  IEMandatory {
    LineColor black
    BackgroundColor black
  }
}

spot {
  spotAnnotation {
    BackgroundColor #E3664A
  }
  spotAbstractClass {
    BackgroundColor #A9DCDF
  }
  spotClass {
    BackgroundColor #ADD1B2
  }
  spotInterface {
    BackgroundColor #B4A7E5
  }
  spotEnum {
    BackgroundColor #EB937F
  }
  spotEntity {
    BackgroundColor #ADD1B2
  }
}


stateDiagram {
  state {
    RoundCorner 25
  }
  element {
	title {
	  FontStyle plain
	}
  }
  circle {
    start, stop, end {
	    LineColor black
	    BackgroundColor black
    }
  }
}


delay {
  FontSize 11
  FontStyle plain
  HorizontalAlignment center
}

participant {
  LineThickness 1.5
  HorizontalAlignment center
}

actor {
  LineThickness 2.0
  HorizontalAlignment center
}

boundary {
  LineThickness 2.0
  HorizontalAlignment center
}

control {
  LineThickness 2.0
  HorizontalAlignment center
}

entity {
  LineThickness 2.0
  HorizontalAlignment center
}

queue {
  LineThickness 2.0
  HorizontalAlignment center
}

database {
  HorizontalAlignment center
}

collections {
  LineThickness 1.5
  HorizontalAlignment center
}

swimlane {
  BackGroundColor transparent
  LineColor black
  LineThickness 2
  FontSize 18
}

diamond {
  Shadowing 3.0
}

arrow {
  FontSize 13
  BackGroundColor black
}

note {
  FontSize 13
  BackGroundColor #FBFB77
}

partition {
}

circle {
}

mindmapDiagram {
}

mindmapDiagram {
	node {
	    Padding 10
	    Margin 10
	    RoundCorner 25
	    LineThickness 1.5
	}
	arrow {
	    LineThickness 1.0
	}
}


wbsDiagram {
    Padding 10
    Margin 15
    RoundCorner 0
    LineThickness 1.5
    FontSize 12
}

activityDiagram {
  Shadowing 3.0
}

activityDiagram {
	activity {
	    LineThickness 1.5
	    Padding 10
	    FontSize 12
	    RoundCorner 25
	}
	composite {
	    LineColor black
	    BackgroundColor transparent
	}
	diamond {
	    FontSize 11
	}
	arrow {
	    FontSize 11
	}
	circle {
	    start, stop, end {
		    LineColor black
		    BackgroundColor black
	    }
	}
	activityBar {
	  Shadowing 3.0
	  BackgroundColor black
	}
}


task {
    FontSize 11
}

milestone {
    FontSize 11
	BackGroundColor black
	LineColor black
}

ganttDiagram {
	arrow {
	  LineThickness 1.5
	}
	note {
	  FontSize 9
      Shadowing 0.0
	}
	separator {
	  FontSize 11
	  FontStyle plain
	  BackGroundColor transparent
	  Margin 5
	  Padding 5
	}
	timeline {
	    BackgroundColor transparent
	    LineColor #C0C0C0
	}
	closed {
        BackGroundColor #E0E8E8
        FontColor #909898
    }
	task {
		RoundCorner 0
        Margin 2 2 2 2
        Padding 0
	}
	undone {
        BackGroundColor white
	}
	milestone {
        Margin 2
        Padding 3
	}
}


usecase {
  HorizontalAlignment center
}

yamlDiagram,jsonDiagram {
  BackGroundColor white
  FontColor black
  LineColor black
  arrow {
    LineThickness 1
    LineStyle 3-3
  }
  node {
    LineThickness 1.5
  	RoundCorner 10
  	separator {
      LineThickness 1
  	}
  	header {
  	  FontStyle bold
  	}
    highlight {
	  BackGroundColor #ccff02
    }
  }
}


timingDiagram {
	LineColor #3
	FontColor #3
	FontStyle bold
    LineThickness 1.5
    timeline {
	  FontStyle plain
	  FontSize 11
    }
	arrow {
	    FontName Serif
	    FontSize 14
	    FontStyle plain
	    FontColor darkblue
	    LineColor darkblue
	    LineThickness 1.5
	}
	constraintArrow {
	    FontSize 12
		FontStyle plain
	    FontColor darkred
	    LineColor darkred
	    LineThickness 1.5
	}
	clock {
	  LineColor darkgreen
	}
	concise {
	  FontSize 12
	  LineColor darkgreen
	  BackgroundColor #c
      LineThickness 1.5
	}
	robust {
	  FontStyle plain
	  FontSize 12
	  LineColor darkgreen
      LineThickness 2
	  BackgroundColor #c
	}
	highlight {
	  BackgroundColor #e
	  LineThickness 2
	  LineStyle 4-4
	}
}

nwdiagDiagram {
	network {
		FontSize 12
		Shadowing 1.0
	}
	server {
		FontSize 12
	}
	group {
		FontSize 12
		BackGroundColor #ddd
	}
	arrow {
		FontSize 11
	}
}
`,
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
};
