#!/bin/bash

# find all repos
REPOS=`find $PWD -type d -name ".git" -maxdepth 2`

for repo in $REPOS; do
  r=${repo%%/.git}
  pushd $r > /dev/null
  echo ${r##*[/\\]}
  git pull -q --rebase
  popd > /dev/null
done
