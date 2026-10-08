/**
 * `sonyxperiadev` built-in `<style>`-grammar skin, part 2 of 2 -- the oracle
 * jar's `skin/sonyxperiadev.skin` verbatim (`unzip -p
 * oracle/dist/plantuml-oracle.jar skin/sonyxperiadev.skin` is byte-identical
 * to `~/git/plantuml/src/main/resources/skin/sonyxperiadev.skin`). Upstream
 * converted it from the legacy skinparam file to a complete style sheet when
 * fixing plantuml/plantuml#2797 (commit 11ed6720). Split only to keep each
 * module under the 500-line cap, at a section boundary (part 2 starts at
 * `usecase {`); `skins-builtin.ts` concatenates the two parts.
 */
export const SONYXPERIADEV_SKIN_PART2 = `usecase {
  HorizontalAlignment center
}

yamlDiagram,jsonDiagram {
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
    LineThickness 0.5
    timeline {
	  FontStyle plain
	  FontSize 11
      LineThickness 2
    }
    note {
      LineThickness 0.5
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
      LineThickness 1.5
	}
	concise {
	  FontSize 12
	  LineColor darkgreen
	  BackgroundColor: var(--grey-blue);
      LineThickness 1.5
	}
	robust {
	  FontStyle plain
	  FontSize 12
	  LineColor darkgreen
      LineThickness 2
	  BackgroundColor: var(--grey-blue);
	}
	binary {
	  FontStyle plain
	  FontSize 12
	  LineColor darkgreen
      LineThickness 2
	}
	highlight {
	  BackgroundColor #e
	  LineThickness 2
	  LineStyle 4-4
	}
}

nwdiagDiagram {
	network {
	    BackgroundColor: var(--grey-blue);
		FontSize 12
	}
	server {
		FontSize 12
	}
	group {
		FontSize 12
		BackGroundColor #e7e7e7
		LineColor #e7e7e7
	}
	arrow {
		FontSize 11
	}
}


/*
 * ---------------------------------------------------------------------------
 * sonyxperiadev specifics
 * (translated one-to-one from the former skinparam definitions)
 * ---------------------------------------------------------------------------
 */

root {
  FontName Arial
  FontStyle bold
  FontColor #333333
  Shadowing 0.0
}

document {
  BackGroundColor white
}

note {
  BackGroundColor #ffffcd
  LineColor #a9a980
  FontColor #676735
  FontStyle italic
}

participant {
  BackGroundColor #dde5ff
  LineColor #cccccc
  FontColor #333333
  FontStyle bold
}

database {
  BackGroundColor #df4646
  FontColor red
  FontStyle bold
}

entity {
  BackGroundColor #999999
}

sequenceDiagram {
  arrow {
    LineColor #555555
    FontColor #555555
    FontStyle plain
    HorizontalAlignment center
  }

  box {
    BackGroundColor #fafafa
    LineColor #eeeeee
    FontColor #666666
    FontSize 12
    FontStyle italic
  }

  lifeLine {
    LineColor #bbbbbb
  }

  participant {
    BackGroundColor #dde5ff
    LineColor #cccccc
    FontColor #333333
    FontStyle bold
  }

  database {
    BackGroundColor #df4646
    FontColor red
    FontStyle bold
  }

  entity {
    BackGroundColor #999999
  }
}

/*
 ____             _                            _
|  _ \\  __ _ _ __| | __    _ __ ___   ___   __| | ___
| | | |/ _\` | '__| |/ /   | '_ \` _ \\ / _ \\ / _\` |/ _ \\
| |_| | (_| | |  |   <    | | | | | | (_) | (_| |  __/
|____/ \\__,_|_|  |_|\\_\\   |_| |_| |_|\\___/ \\__,_|\\___|

*/
@media (prefers-color-scheme:dark) {
root {
  HyperLinkColor blue
  FontColor white
  LineColor #e7e7e7
  BackGroundColor #313139
}

document {
  BackGroundColor #1B1B1B
  header {
    FontColor #7
  }
  footer {
    FontColor #7
  }
  legend {
    LineColor white
    BackGroundColor #2
  }
  frame {
    LineColor white
  }
}

group {
  package {
    LineColor white
  }
  folder {
    LineColor white
  }
}

sequenceDiagram {
  group {
    LineColor white
  }

  groupHeader {
    BackGroundColor #5
    LineColor white
  }

  lifeLine {
    BackGroundColor black
  }
	reference {
	  LineColor #d
	}

	referenceHeader {
	  LineColor #d
	  FontColor white
	  BackGroundColor #4
	}

	box {
	  BackGroundColor #2
	}

	separator {
	  LineColor white
	  BackGroundColor #1
	}

	participant,actor,boundary,control,entity,queue,database,collections {
	  BackgroundColor: #2;
	  HorizontalAlignment center
	}

}

//dark theme
spot {
  spotAnnotation {
    BackgroundColor #4A0000
  }
  spotAbstractClass {
    BackgroundColor #2A5D60
  }
  spotClass {
    BackgroundColor #2E5233
  }
  spotInterface {
    BackgroundColor #352866
  }
  spotEnum {
    BackgroundColor #852D19
  }
  spotEntity {
    BackgroundColor #2E5233
  }
  spotException {
	BackgroundColor #7D0000
  }
  spotMetaClass {
    BackgroundColor #7C7C7C
  }
  spotStereotype {
    BackgroundColor #890089
  }
	spotDataClass {
		BackgroundColor #B39DDB
	}
	spotRecord {
		BackgroundColor #FFB74D
	}
}


swimlane {
  LineColor white
}

note {
  BackGroundColor #714137
}


activityDiagram {
	partition {
	    LineColor white
	}
	circle {
	    start, stop, end {
		    LineColor #d
		    BackgroundColor #d
	    }
	}
	activityBar {
	  BackgroundColor #a
	}
}

stateDiagram {
  circle {
    start, stop, end {
      LineColor #d
      BackgroundColor #d
    }
  }
}

milestone {
	BackGroundColor white
	LineColor white
}

timingDiagram {
	LineColor #d
	FontColor #d
	arrow {
	    LineColor lightblue
	}
	constraintArrow {
	    LineColor tomato
	    FontColor tomato
	}
	clock {
	  LineColor lightgreen
	}
	concise {
	  LineColor lightgreen
	  BackgroundColor #6
	}
	robust {
	  LineColor lightgreen
	  BackgroundColor #3
	}
	highlight {
	  BackgroundColor #1
	}
}



ganttDiagram {
	task {
	    BackGroundColor #555
	}
	timeline {
	    LineColor #3f3f3f
	}
	closed {
        BackGroundColor #1f1f1f
        FontColor #676767
    }
	undone {
        BackGroundColor black
	}
}


yamlDiagram,jsonDiagram {
  FontColor white
  LineColor white
  node {
    highlight {
	  BackGroundColor #ccff02
    }
  }
}

nwdiagDiagram {
	network {
	    BackGroundColor #555
	}
	group {
		BackGroundColor #2
	}
}

}

`;
