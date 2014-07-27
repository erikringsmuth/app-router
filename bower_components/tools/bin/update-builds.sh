#!/bin/bash -e

RELEASE=0
while getopts ":r" opt; do
  case $opt in
    r)
      RELEASE=1
      ;;
  esac
done

dir=`pwd -P`
TMP="$dir/builds-temp"
mkdir -p $TMP
pushd $TMP

if [ -d components/platform ]; then
  pushd components/platform
  git reset --hard origin/master
  popd
fi

if [ -d components/polymer ]; then
  pushd components/polymer
  git reset --hard origin/master
  popd
fi

node $dir/node_modules/bigstraw/index.js -s $dir/../repo-configs/polymer.json

pushd components/platform-dev
npm install
if [ $RELEASE -eq 1 ]; then
  grunt release
else
  grunt minify audit
fi
cp build/build.log build/platform.js build/platform.js.map ../platform/
popd

pushd components/platform
if [ $RELEASE -eq 1 ]; then
  git commit . -m 'update build for release'
else
  git commit . -m 'update build'
fi
git push origin master
popd

pushd components/polymer-dev
npm install
if [ $RELEASE -eq 1 ]; then
  grunt release
else
  grunt minify audit
fi
cp build/build.log build/polymer.js build/polymer.js.map ../polymer/
popd

pushd components/polymer
if [ $RELEASE -eq 1 ]; then
  git commit . -m 'update build for release'
else
  git commit . -m 'update build'
fi
git push origin master
popd

popd
