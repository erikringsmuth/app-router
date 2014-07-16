highlightjs-element
===================

See the [component page](http://polymerlabs.github.io/highlightjs-element) for more information.

highlightjs-import
==================

Import files are a new invention, so libraries like [`highlightjs`](http://highlightjs.org) do not yet provide them.

`highlightjs-import` is an intermediary that provides an import file for the `highlightjs` component. 
`highlightjs-import` depends on `highlightjs`.

Components that want to use `highlightjs` should depend on `highlightjs-element` and import `highlightjs-import` to be safe from library duplication. 
Such components need not use Polymer or `highlightjs-element`, but we put the import and the element in one package for convenience.
