## Router for Web Components
> Works with [Polymer](http://www.polymer-project.org/), [X-Tag](http://www.x-tags.org/), and natively with the [platform](https://github.com/Polymer/platform) polyfill.

> [erikringsmuth.github.io/app-router](http://erikringsmuth.github.io/app-router)

Lazy-loads content. Binds path variables and query parameters to the page element's attributes. Supports multiple layouts. Works with `hashchange` and HTML5 `pushState`. One set of routes will match regular paths `/` and hash paths `#/`.

[Download](https://github.com/erikringsmuth/app-router/archive/master.zip) or run `bower install app-router --save`.

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

      <!-- matches a pattern like '/word/number' -->
      <app-route path="/^\/\w+\/\d+$/i" regex import="/pages/regex-page.html"></app-route>

      <!-- matches everything else -->
      <app-route path="*" import="/pages/not-found-page.html"></app-route>
    </app-router>
  </body>
</html>
```

Changing the URL will find the first `app-route` that matches, load the element or template, and replace the current view.

## Data Binding
Path variables and query parameters automatically attach to the element's attributes.

``` html
<!-- url -->
http://www.example.com/order/123?sort=ascending

<!-- route -->
<app-route path="/order/:id" import="/pages/order-page.html"></app-route>

<!-- will bind 123 to the page's `id` attribute and "ascending" to the `sort` attribute -->
<order-page id="123" sort="ascending"></order-page>
```

See it in action [here](http://erikringsmuth.github.io/app-router/#/databinding/1337?queryParam1=Routing%20with%20Web%20Components!).

## Navigation
There are three ways to trigger a route change. `hashchange`, `pushState()`, and a full page load.

#### hashchange
Clicking `<a href="/#/home">Home</a>` will fire a `hashchange` event and tell the router to load the first route that matches `/home`. You don't need to handle the event in your Javascript.

#### pushState
You can use the [pushstate-anchor](https://github.com/erikringsmuth/pushstate-anchor) or [html5-history-anchor](https://github.com/erikringsmuth/html5-history-anchor) to extend `<a>` tags with the HTML5 history API.

```html
<a is="pushstate-anchor" href="/home">Home</a>
```

This will call `pushState()` and dispatch a `popstate` event.

#### Full page load
Clicking a link `<a href="/home">Home</a>` without a hash path will do a full page load. You need to make sure your server will return `index.html` when looking up the resource at `/home`. The simplest set up is to always return `index.html` and let the `app-router` handle the routing including a not found page.

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
<app-route path="/customer/:customerId" import="/pages/customer-page.html"></app-route>
```

When you navigate to `/customer/123` the router will load `/pages/customer-page.html`, replace the active view with a new `customer-page` element, and bind any attributes `element.setAttribute('customerId', 123)`.

You can manually set the element's name with the `element` attribute if it's different from the file name. This is useful when bundling (vulcanizing) custom elements.

```html
<app-route path="/customer/:customerId" import="/pages/page-bundle.html" element="customer-page"></app-route>
```

#### pre-loaded custom element
You can route to a pre-loaded custom element. In this case, load the element normally in the `<head>` and include the `element="element-name"` attribute on the route. This is how you'd bundle and pre-load custom elements.

```html
<head>
  <link rel="import" href="/pages/page-bundle.html">
</head>
<app-router>
  <app-route path="/customer/:customerId" element="customer-page"></app-route>
</app-router>
```

#### import template
You can use a `<template>` instead of a custom element. This doesn't have data binding and is lighter-weight than a custom element. Just include the `template` attribute.

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
Note: The regular expression must start with a `/` and end with a `/` optionally followed by `i`. Options global `g`, multiline `m`, and sticky `y` aren't valid when matching paths.

## &lt;app-router&gt; options

#### Trailing Slashes
By default `/home` and `/home/` are treated as separate routes. You can configure the router to ignore trailing slashes with `trailingSlash="ignore"`.
```html
<app-router trailingSlash="ignore">
  <!-- matches '/home' and '/home/' -->
  <app-route path="/home" import="/pages/home-page.html"></app-route>
</app-router>
```

## Demo Site & Example Setup
Check out the `app-router` in action at [erikringsmuth.github.io/app-router](http://erikringsmuth.github.io/app-router).

You can download an example setup here https://github.com/erikringsmuth/app-router-examples to get running locally.

## Build, Test, and Debug [![Build Status](https://travis-ci.org/erikringsmuth/app-router.png?branch=master)](https://travis-ci.org/erikringsmuth/app-router)
Source files are under the `src` folder. The build process writes to the root directory. The easiest way to debug is to include the source script rather than the minified HTML import.
```html
<script src="/bower_components/app-router/src/app-router.js"></script>
```

To build:
- Run `bower install` and `npm install` to install dev dependencies
- Lint, build, and minify code changes with `gulp` (watch with `gulp watch`)
- Start a static content server to run tests (node `http-server` or `python -m SimpleHTTPServer`)
- Run unit tests in the browser (PhantomJS doesn't support Web Components) [http://localhost:8080/tests/SpecRunner.html](http://localhost:8080/tests/SpecRunner.html)
- Manually run functional tests in the browser [http://localhost:8080/tests/functional-test-site/](http://localhost:8080/tests/functional-test-site/)
