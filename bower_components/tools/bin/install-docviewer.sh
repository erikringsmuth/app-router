#!/bin/bash

die() {
  echo $1
  exit 1
}

log() {
  echo -e "\033[1;34m===== $1 \033[1;37m$2 \033[1;34m=====\033[0m"
}

INDEX=
while getopts ":i:" opt; do
  case $opt in
    i)
      INDEX="$OPTARG"
      ;;
    :)
      die "Option -$OPTARG requires an argument"
      ;;
  esac
done

if [ -z $INDEX ]; then
  die "Need index.html to copy, use -i flag to specify"
fi

shift $(($OPTIND - 1))

for repo in $@; do
  name=${repo##*[/\\]};
  log "Installing Doc Viewer to" "$name"
  if [ -e $repo/index.html ] && [ -e $repo/smoke.html ]; then
    continue;
  fi
  if [ -e $repo/index.html ]; then
    echo "moving old index.html to smoke test"
    mv $repo/index.html $repo/smoke.html
  fi
  echo "Copying doc index.html"
  cp $INDEX $repo/index.html
done
