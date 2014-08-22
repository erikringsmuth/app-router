#!/bin/bash

# find all repos
REPOS=`find $PWD -type d -name ".git" -maxdepth 2`

for repo in $REPOS; do
  path=${repo%%/.git}
  name=${path##*[/\\]}
  pushd $path > /dev/null
  
  git remote set-url origin git@github.com:polymer-elements/$name.git

  popd > /dev/null
done
