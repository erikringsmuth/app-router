#!/bin/bash

# find all repos
REPOS=(
  CustomElements
  HTMLImports
  MutationObservers
  NodeBind
  PointerEvents
  PointerGestures
  ShadowDOM
  TemplateBinding
  WeakMap
  observe-js
  platform
  polymer
  polymer-expressions
  tools
)

for path in ${REPOS[@]}; do
  pushd $path > /dev/null
  git remote set-url origin git@github.com:Polymer/$path.git
  popd > /dev/null
done
