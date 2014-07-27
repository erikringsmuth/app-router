#!/bin/bash

# Windows autocloses shell when complete, use `read` to wait for user input
WINDOWS=0
if [[ $OS = "Windows_NT" ]]; then
  WINDOWS=1
fi

# Only pull new versions with -p flag
PULL=false

# If -t flag is given, actually push the tags
PUSHTAGS=false

# test by default, override with -f flag
TEST=true

# Must give a version number with -v
VERSION=

# Don't make builds automatically, override with -b flag
BUILD=false

# Make new tags, override with -n
TAG=true

# directory for tools/bin scripts
PA_PREFIX="$PWD/${0%[/\\]*}"

# node script for mucking with package json
VERSIONSCRIPT="$PA_PREFIX/set-version.js"

while getopts ":bfnptv:" opt; do
  case $opt in
    b)
      BUILD=true
      ;;
    f)
      TEST=false
      ;;
    n)
      TAG=false
      ;;
    p)
      PULL=true
      ;;
    t)
      PUSHTAGS=true
      ;;
    v)
      VERSION="$OPTARG"
      ;;
    :)
      die "Option -$OPTARG requires an argument";
  esac
done

# abort on missing version number
# TODO(dfreed): read the version out of polymer and bump it up one?
if [[ -z "$VERSION" ]]; then
  echo "Need a version number!"
  exit 1
fi

# repos that fail to clone will be put here
FAILED=()

# default branch of clones
DEFAULT_BRANCH="master"


log() {
  echo -e "\033[1;34m===== $1 \033[1;37m$2 \033[1;34m=====\033[0m"
}

ok() {
  echo -e "\033[1;32mOK\033[0m"
}

die() {
  if [ -n "$1" ]; then
    err "$1"
  fi
  [ $WINDOWS -eq 1 ] && read
  exit 1
}

err() {
  echo -e "\033[1;31m$1\033[0m"
}

repo_err() {
  err "${#FAILED[@]} REPOS FAILED TO $1!"
  for f in "${FAILED[@]}"; do
    echo -e "\033[1m$f\033[0m"
  done
  # Wait for user input
  die
}

# Prints errors or says OK
status_report() {
  if [[ ${#FAILED[@]} -gt 0 ]]; then
    repo_err "$1"
  else
    ok
    [ $WINDOWS -eq 1 ] && read
  fi
}

pull() {
  node $PA_PREFIX/node_modules/bigstraw/index.js -s -b master ${PA_PREFIX}/../repo-configs/{core,polymer,paper}.json
}

version() {
  if [ -e "bower.json" ]; then
    node $VERSIONSCRIPT "$PWD/bower.json" ">=0.3.0 <1.0.0"
  fi
}

tag_repos() {
  FAILED=()
  for REPO in "${REPOLIST[@]}"; do
    pushd $REPO >/dev/null
    log "TAGGING" "$REPO"
    git checkout -q --detach
    version "$VERSION"
    git ci -a -m "release $VERSION"
    git tag -f "$VERSION"
    popd >/dev/null
  done
  status_report "TAG"
}

push_tags() {
  FAILED=()
  for REPO in "${REPOLIST[@]}"; do
    pushd $REPO >/dev/null
    log "PUSHING TAG" "$REPO"
    git push --tags
    if [ $? -ne 0 ]; then
      FAILED+=($REPO)
    fi
    popd >/dev/null
  done;
  status_report "PUSH"
}

gen_changelog() {
  echo -n "" > "changelog.md"
  for REPO in ${REPOLIST[@]}; do
    pushd $REPO >/dev/null

    # strip off the leading folders
    RNAME=${REPO##*[/\\]}

    # Changelog format: - commit message ([commit](commit url on github))
    PRETTY="- %s ([commit](https://github.com/Polymer/${RNAME}/commit/%h))"
    log "GEN CHANGELOG" "$REPO"

    # find slightly older tag, sorted semver style
    OLD_VERSION="`git tag -l | sort -t. -k1,1n -k2,2n -k3,3n | tail -n 2 | head -n 1`"
    if [[ -n $OLD_VERSION ]]; then
      echo "#### ${RNAME}" >> "../../changelog.md"
      git log $OLD_VERSION..$VERSION --pretty="$PRETTY" >> "../../changelog.md"
      echo "" >> "../../changelog.md"
    fi
    popd >/dev/null
  done
  ok
}

make_names() {
  log "GENERATING" "release names"
  ${PA_PREFIX}/namer $VERSION > "names"
  ok
}

build() {

  # build platform
  pushd components/platform-dev
  log "INSTALLING" "node modules"
  npm --silent install
  if $TEST; then
    log "TESTING" "platform"
    grunt test
    if [ $? -ne 0 ]; then
      die "platform FAILED TESTING"
    fi
  fi
  log "BUILDING" "platform"
  grunt

  # version number on build file
  mv build/{build.log,platform.js{,.map}} ../platform/
  ok
  popd >/dev/null

  # build polymer
  pushd components/polymer-dev
  log "INSTALLING" "node modules"
  npm --silent install
  if $TEST; then
    log "TESTING" "polymer"
    grunt test
    if [ $? -ne 0 ]; then
      die "polymer FAILED TESTING"
    fi
  fi
  log "BUILDING" "polymer"
  grunt

  # version number on build file
  mv build/{build.log,polymer.js{,.map}} ../polymer/
  ok
  popd >/dev/null
}

release() {
  mkdir -p polymer-$VERSION
  pushd polymer-$VERSION >/dev/null
  if $PULL; then
    pull
  fi
  REPOLIST=(components/* projects/*)
  if $PUSHTAGS; then
    push_tags
  else
    if $BUILD; then
      build
    fi
    if $TAG; then
      tag_repos
    fi
    gen_changelog
    make_names
  fi
  popd >/dev/null
}

release
