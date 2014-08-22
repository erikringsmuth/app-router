## pointer-gestures
Library which gesture events in a mobile-performant way.

_In the next release, polymer-gestures will replace (the now deprecated) [PointerGestures](https://github.com/Polymer/PointerGestures), and [PointerEvents](https://github.com/Polymer/PointerEvents) will be removed from the default build._

Supported events:
* down
* up
    * Same target as down, provides the element under the pointer with the relatedTarget property
* trackstart
* track
    * Same target as down
* trackend
    * Same target as down, provides the element under the pointer with the relatedTarget property
* tap
    * Targets the nearest common ancestor of down and up.relatedTarget
    * Can be prevented by calling any gesture event's preventTap function

Not yet implemented:
* flick
* hold
* holdpulse
* release
* pinchstart
* pinch
* pinchend

More info — https://groups.google.com/forum/#!topic/polymer-dev/ba4aDyOozm8

## How to build

```bash
mkdir gestures
cd gestures
git clone git@github.com:Polymer/tools.git
git clone git@github.com:Polymer/polymer-gestures.git
cd polymer-gestures
npm install
grunt
```

## Hot to run
```bash
cd gestures
python -m SimpleHTTPServer
open http://localhost:8000/polymer-gestures/samples/simple/
```
More info — http://www.polymer-project.org/resources/tooling-strategy.html
