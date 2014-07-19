## Polymer app-router
> Declarative, lazy-loading app router for web components.

> [erikringsmuth.github.io/app-router](http://erikringsmuth.github.io/app-router)


Supports multiple layouts. Binds path variables and query parameters to page element's attributes. Works with `hashchange` and HTML5 `pushState`. One set of routes will match regular paths `/`, hash paths `#/`, and hashbang paths `#!/`.

## Configuration

```html
<!doctype html>
<html>
  <head>
    <title>Polymer Router</title>
    <link rel="import" href="/elements/app-router.html">
  </head>
  <body>
    <app-router>
      <!-- matches an exact path -->
      <app-route path="/home" import="/pages/home-page.html"></app-route>

      <!-- matches using a wildcard -->
      <app-route path="/customer/*" import="/pages/customer-page.html"></app-route>

      <!-- matches using a path variable -->
      <app-route path="/order/:id" import="/pages/order-page.html"></app-route>

      <!-- matches everything else -->
      <app-route path="*" import="/pages/not-found-page.html"></app-route>
    </app-router>
  </body>
</html>
```

## Navigation
There are three ways to trigger a route change. `hashchange`, `popstate`, and a full page load.

#### hashchange
If you're using `hashchange` you don't need to do anything. Clicking a link `<a href="#/new/page">New Page</a>` will fire a `hashchange` event and tell the router to load the new route. You don't need to handle the event in your Javascript.

#### pushState
If you're using HTML5 `pushState` you need one extra step. The `pushState()` method was not meant to change the page, it was only meant to push state into history. This is an "undo" feature for single page applications. To use `pushState()` to navigate to another route you need to call it like this.

```js
history.pushState(stateObj, title, url); // push a new URL into the history stack
history.go(0); // go to the current state in the history stack, this fires a popstate event
```

#### Full page load
You can also do a full page load. The router will load the first matching route.