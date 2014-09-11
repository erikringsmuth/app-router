## app-router change log

#### v0.8.1
- add `defaultRoute` attribute to <app-router> to define a default route when no hash is defined. This can be combined with `trailingSlash` attribute.

#### v0.8.0
- `template` no longer required on inline template routes.
- Only use `app-route`s that are direct children of the router by replacing `querySelector()` with `firstElementChild` and iterating with `nextSibling`.
- Took internal functions off the public API and simplified parameters.

#### v0.7.0
- Added the `pathType` attribute to the router. The options are `auto`, `hash`, and `regular`
