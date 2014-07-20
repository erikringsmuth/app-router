## Polymer app-router
> Declarative, lazy-loading app router for web components.

> [erikringsmuth.github.io/app-router](http://erikringsmuth.github.io/app-router)

Supports multiple layouts. Binds path variables and query parameters to page element's attributes. Works with `hashchange` and HTML5 `pushState`. One set of routes will match regular paths `/`, hash paths `#/`, and hashbang paths `#!/`.

## Configuration

```html
<!doctype html>
<html>
  <head>
    <title>App Router</title>
    <link rel="import" href="/bower_components/app-router/app-router.html">
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
If you're using `hashchange` you don't need to do anything. Clicking a link `<a href="/#/new/page">New Page</a>` will fire a `hashchange` event and tell the router to load the new route. You don't need to handle the event in your Javascript.

#### pushState
If you're using HTML5 `pushState` you need one extra step. The `pushState()` method was not meant to change the page, it was only meant to push state into history. This is an "undo" feature for single page applications. To use `pushState()` to navigate to another route you need to call it like this.

```js
history.pushState(stateObj, title, '/#/new/page'); // push a new URL into the history stack
history.go(0); // go to the current state in the history stack, this fires a popstate event
```

#### Full page load
Clicking a link `<a href="/new/page">New Page</a>` without a hash path will do a full page load. You need to make sure your server will return `index.html` when looking up the resource at `/new/page`. The simplest set up is to always return `index.html` and let the `app-router` handle the routing including a not found page.

## Install
[Download](https://github.com/erikringsmuth/app-router/archive/master.zip) or run `bower install app-router`.

## Demo Site
Check out the `app-router` in action at [erikringsmuth.github.io/app-router](http://erikringsmuth.github.io/app-router). The <a href="https://github.com/erikringsmuth/app-router/tree/gh-pages">gh-pages branch</a> shows the demo site code.

## Tests
The tests need a specific folder structure to work with HTML imports and the bower dependencies. All paths are relative in HTML imports and the `app-router` imports Polymer like this `<link rel="import" href="../polymer/polymer.html">`. It's imported like this because normally both the `app-router` and `polymer` are sitting in the `bower_components` folder.
1. When you clone `app-router` nest it in a directory like `app-router-dev`. The `.bowerrc` installs files one level up `"directory": "../"` for HTML imports and the bower dependencies.
2. Start a static content server in `app-router-dev` (node `http-server` or `python -m SimpleHTTPServer`).
3. Open http://localhost:8080/app-router/tests/SpecRunner.html and make sure all of the tests pass.