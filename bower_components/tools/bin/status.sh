#!/bin/bash

# find all repos
REPOS=`find $PWD -type d -name ".git" -maxdepth 2`

for repo in $REPOS; do
  path=${repo%%/.git}
  name=${path##*[/\\]}
  pushd $path > /dev/null
  # find uncommitted stuff
  status=`git status --porcelain`
  if [[ -n $status ]]; then
    echo "$name"
    echo "$status"
  fi
  # find ahead/behind
  ab=`git rev-list --left-right --count origin/master...HEAD`
  # ahead
  a=`echo $ab | cut -d ' ' -f 2`
  # behind
  b=`echo $ab | cut -d ' ' -f 1`
  if [[ $a > 0 ]]; then
    echo "${name} ahead $a"
  fi
  if [[ $b > 0 ]]; then
    echo "${name} behind $b"
  fi
  popd > /dev/null
done
