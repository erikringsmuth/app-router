#!/bin/bash
dir="${0%[/\\]*}"
pushd $dir
git pull
if [ ! -e node_modules/bigstraw ]; then
  # ~/node_modules may be the installation target if local node_modules folder doesn't exist
  mkdir node_modules
fi
npm install bigstraw
popd
node $dir/node_modules/bigstraw/index.js -s $dir/../repo-configs/{core,polymer,paper,labs,misc}.json $@
