/**
 * `rose` built-in `<style>`-grammar skin, part 2 of 2 -- see
 * {@link ROSE_SKIN_PART1}'s doc comment for why this split exists and how
 * the two halves recombine.
 */
export const ROSE_SKIN_PART2 = `

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
`;
