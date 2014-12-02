## Router for Web Components
> Works with [Polymer](http://www.polymer-project.org/), [X-Tag](http://www.x-tags.org/), and natively.
>
> [erikringsmuth.github.io/app-router](https://erikringsmuth.github.io/app-router/)

Manage page state. Lazy-load content. Data-bind path variables and query parameters. Use multiple layouts. Navigate with `hashchange` and HTML5 `pushState`. Animate transitions using `core-animated-pages`.

[Download](https://github.com/erikringsmuth/app-router/archive/master.zip) or run `bower install app-router --save`.

## Configuration

Define how URLs map to pages.

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

      <!-- matches a pattern like '/word/number' -->
      <app-route path="/^\/\w+\/\d+$/i" regex import="/pages/regex-page.html"></app-route>

      <!-- matches everything else -->
      <app-route path="*" import="/pages/not-found-page.html"></app-route>
    </app-router>
  </body>
</html>
```

## Navigation

Click links or call `router.go()`.

```html
<!-- hashchange -->
<a href="/#/home">Home</a>

<!-- pushState() -->
<a is="pushstate-anchor" href="/home">Home</a>

<!-- router.go(path, options) -->
<script>
  document.querySelector('app-router').go('/home');
</script>
```

The router listens to `popstate` and `hashchange` events. Changing the URL will find the first `app-route` that matches, load the element or template, and replace the current view.

#### hashchange
Clicking `<a href="/#/home">Home</a>` will fire a `hashchange` event and tell the router to load the first route that matches `/home`. You don't need to handle the event in your Javascript. Hash paths `/#/home` match routes without the hash `<app-route path="/home">`.

#### pushState
You can use the [pushstate-anchor](https://github.com/erikringsmuth/pushstate-anchor) or [html5-history-anchor](https://github.com/erikringsmuth/html5-history-anchor) to extend `<a>` tags with the HTML5 history API.

```html
<a is="pushstate-anchor" href="/home">Home</a>
```

This will call `pushState()` and dispatch a `popstate` event.

#### go(path, options)
You can call the router from Javascript to navigate imperatively.

```js
document.querySelector('app-router').go('/home');
// or
document.querySelector('app-router').go('/home', {replace: true});
```

If you use `go(path, options)` you should also set the mode to `hash` or `pushstate` on the router.

```html
<app-router mode="auto|pushstate|hash">
  <!-- app-routes -->
</app-router>
```

## Data Binding
Path variables and query parameters automatically attach to the element's attributes.

``` html
<!-- url -->
<a is="pushstate-anchor" href="/order/123?sort=ascending">Order 123</a>

<!-- route -->
<app-route path="/order/:id" import="/pages/order-page.html"></app-route>

<!-- will bind 123 to the page's `id` attribute and "ascending" to the `sort` attribute -->
<order-page id="123" sort="ascending"></order-page>
```

See it in action [here](https://erikringsmuth.github.io/app-router/#/databinding/1337?queryParam1=Routing%20with%20Web%20Components!).

## &lt;app-route&gt; options

#### import a custom element
Lazy-load a custom element.

```html
<app-route path="/customer/:customerId" import="/pages/customer-page.html" [element="customer-page"]></app-route>
```

You only need to set the `element` attribute if the element's name is different than the file name.

#### pre-loaded custom element
Include the `element="element-name"` attribute on the route to use a pre-loaded custom element. This is how you use bundled (vulcanized) custom elements.

```html
<head>
  <link rel="import" href="/pages/page-bundle.html">
</head>
<app-router>
  <app-route path="/customer/:customerId" element="customer-page"></app-route>
</app-router>
```

#### import template
You can import a `<template>` instead of a custom element. This doesn't have data binding and is lighter-weight than a custom element. Just include the `template` attribute.

```html
<app-route path="/example" import="/pages/template-page.html" template></app-route>
```

#### inline template
You can in-line a `<template>` like this.

```html
<app-route path="/example">
  <template>
    <p>Inline template FTW!</p>
  </template>
</app-route>
```

#### inline polymer template
Finally, it's possible to encapsulate the router in a Polymer element, and bind global values template app pages.
```html
<link rel="import" href="app-router.html">
<link rel="import" href="auth-provider.html">
<link rel="import" href="app-login.html">
<link rel="import" href="app-user.html">
<polymer-element name="app-main" >
  <template>
    <auth-provider id="auth"></auth-provider>
    <app-router>
      <app-route path="/login" >
        <template>
          <app-login auth="{{auth}}" ></app-login>
          <!-- app-login accepts the auth attribute 
             and can make use of its variables/functions -->
        </template>
      </app-route>
      <app-route path="/user/:uid" >
        <template>
          <app-user auth="{{auth}}" uid="{{uid}}"></app-user>
          <!-- note that uid is now available in this scope as well
             when this page is accessed-->
        </template>
      </app-route>
    </app-router>
  </template>
  <script>
    Polymer({
      ready:function() {
        this.auth = this.$.auth;
      }
    });
  </script>
</polymer-element>
```

#### regular expressions
Include the `regex` attribute to match on a regular expression. The format is the same as a JavaScript regular expression.

```html
<!-- matches a pattern like '/word/number' -->
<app-route path="/^\/\w+\/\d+$/i" regex import="/pages/regex-page.html"></app-route>
```

#### redirect
A route can redirect to another path.

```html
<app-router mode="pushstate">
  <app-route path="/home" import="/pages/home-page.html"></app-route>
  <app-route path="*" redirect="/home"></app-route>
</app-router>
```

When you use `redirect` you should also set `mode="hash|pushstate"` on the `app-router`.

## &lt;app-router&gt; options

#### mode
One set of routes will match regular paths `/` and hash paths `#/`. You can force a specific mode with `mode="auto|hash|pushstate"`.

```html
<app-router mode="pushstate">
  <!-- always ignore the hash and match on the path -->
</app-router>
```

When left in `auto`, redirects and `go(path, options)` will use hash paths.

#### trailing slashes
By default `/home` and `/home/` are treated as separate routes. You can configure the router to ignore trailing slashes with `trailingSlash="ignore"`.
```html
<app-router trailingSlash="ignore">
  <!-- matches '/home' and '/home/' -->
  <app-route path="/home" import="/pages/home-page.html"></app-route>
</app-router>
```

## Demo Site & Example Setup
Check out the `app-router` in action at [erikringsmuth.github.io/app-router](https://erikringsmuth.github.io/app-router).

You can download an example setup here https://github.com/erikringsmuth/app-router-examples to get running locally.

Examples showing `app-router` and `flatiron-director` versus no router https://github.com/erikringsmuth/polymer-router-demos.

## Breaking Changes
Check the [change log](https://github.com/erikringsmuth/app-router/blob/master/changelog.md) for breaking changes in major versions.

## Build, Test, and Debug [![Build Status](https://travis-ci.org/erikringsmuth/app-router.png?branch=master)](https://travis-ci.org/erikringsmuth/app-router)
Source files are under the `src` folder. The build process writes to the root directory. The easiest way to debug is to include the source script rather than the minified HTML import.
```html
<script src="/bower_components/app-router/src/app-router.js"></script>
```

To build:
- Run `bower install` and `npm install` to install dev dependencies
- Lint, test, build, and minify code with `gulp`
- Manually run functional tests in the browser by starting a static content server (node `http-server` or `python -m SimpleHTTPServer`) and open [http://localhost:8080/tests/functional-test-site/](http://localhost:8080/tests/functional-test-site/)
