#!/bin/bash

# dirname of path to current script
runfrom="${0%[/\\]*}"
FOLDER="$1"

# put these sets into one big "icons" set
DEFAULT=(action alert content file navigation toggle)

header() {
cat > $FILE <<ENDL
<!--
Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
-->

<link rel="import" href="../../core-iconset-svg/core-iconset-svg.html">
<core-iconset-svg id="$NAME" iconSize="24">
<svg><defs>
ENDL
}

footer(){
cat >> $FILE <<ENDL
</defs></svg>
</core-iconset-svg>
ENDL
}

contains() {
  local e
  for e in "${@:2}"; do [[ "$e" == "$1" ]] && return 0; done
  return 1;
}

mkdir -p iconsets

NAME="icons"
FILE="iconsets/icons.html"
header
# find all the default icons, sort by basename (in perl), run concat
find "${DEFAULT[@]/#/$FOLDER}" -name "*24px.svg" | perl -le 'print sort{lc($p=$a)=~s|.*/||; lc($q=$b)=~s|.*/||; $p cmp $q} <>' | xargs $runfrom/concat-svg.js >> $FILE
footer

for dir in $FOLDER/*/; do
  if contains "`basename $dir`" "${DEFAULT[@]}"; then
    continue
  fi
  echo $dir
  NAME=`basename $dir`
  FILE="iconsets/$NAME-icons.html"
  header
  find $dir -name "*24px.svg" | sort | xargs $runfrom/concat-svg.js >> $FILE
  footer
done
