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

## Multiple Layouts
Each page chooses which layout to use. This allows multiple layouts in the same app. Use `<content>` tag insertion points to insert the page into the layout. This is similar to nested routes but completely decouples the page layout from the router.

This is a simple example showing a page and it's layout.

#### home-page.html

```html
<link rel="import" href="/layouts/simple-layout.html">
<polymer-element name="home-page" noscript>
  <template>
    <simple-layout>
      <div class="title">Home</div>
      <p>The home page!</p>
    </simple-layout>
  </template>
</polymer-element>
```

#### simple-layout.html

```html
<polymer-element name="simple-layout" noscript>
  <template>
    <core-toolbar>
      <content select=".title"><!-- content with class 'title' --></content>
    </core-toolbar>
    <content><!-- all other content --></content>
  </template>
</polymer-element>
```

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
Finally, you can in-line a `<template>` like this.

```html
<app-route path="/example">
  <template>
    <p>Inline template FTW!</p>
  </template>
</app-route>
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

## core-animated-pages

> Experimental! The browser may slow to a crawl depending on which animations you use.

Animate transitions using [core-animated-pages](https://www.polymer-project.org/docs/elements/core-elements.html#core-animated-pages). You have to load Polymer and `<core-animated-pages>` to use this feature.

Include the `core-animated-pages` attribute on the `<app-router>` and define the `transitions` you want to use.
```html
<link rel="import" href="/bower_components/polymer/polymer.html">
<link rel="import" href="/bower_components/core-animated-pages/core-animated-pages.html">

<app-router core-animated-pages transitions="hero-transition cross-fade">
  <app-route path="/home" import="/pages/home-page.html"></app-route>
  <app-route path="/demo" import="/pages/demo-page.html"></app-route>
</app-router>
```

Then include the transition attributes on the content you want to animate. This example uses the `cross-fade` transition.

#### home-page.html

```html
<polymer-element name="home-page" noscript>
  <template>
    <core-toolbar cross-fade>Home</core-toolbar>
    <p>Home page!</p>
  </template>
</polymer-element>
```

#### demo-page.html

```html
<polymer-element name="demo-page" noscript>
  <template>
    <core-toolbar cross-fade>Demo</core-toolbar>
    <p>Demo page!</p>
  </template>
</polymer-element>
```

The toolbar will fade out on the home page and fade in on the demo page.

### How it works
The `<app-router>` contains a `<core-animated-pages>` in it's shadow DOM. Each `<app-route>` is a page. When you navigate to a route it's content is loaded inside the `<app-route>` element. The previous example looks like this when it's wired up.

```html
<app-router core-animated-pages transitions="hero-transition cross-fade">
  #shadow-root
  <core-animated-pages transitions="hero-transition cross-fade">
    <!-- light DOM -->
    <app-route path="/home" import="/pages/home-page.html">
      <home-page>
        #shadow-root
        <core-toolbar cross-fade>Home</core-toolbar>
        <p>Home page!</p>
      </home-page>
    </app-route>
    <app-route path="/demo" import="/pages/demo-page.html">
      <!-- empty until you navigate to /demo -->
    </app-route>
  </core-animated-pages>
</app-router>
```

When you navigate from `/home` to `/demo` there will temporarily be both a `<home-page>` and `<demo-page>` in the DOM while the transition is animated. Once the transition is complete, `<core-animated-pages>` fires a `core-animated-pages-transition-end` event and the `<home-page>` is removed from the DOM.

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
