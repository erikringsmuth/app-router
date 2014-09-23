## &lt;a is="pushstate-anchor"&gt;
> Extend the `<a>` tag with `history.pushState()`
>
> Simpified version of the [html5-history-anchor](https://github.com/erikringsmuth/html5-history-anchor)

A link from 1992.
```html
<a href="/home">Home</a>
```

Now using `pushState()`.
```html
<a is="pushstate-anchor" href="/home">Home</a>
```

A complete example.
```html
<a is="pushstate-anchor" href="/home"
   title="Home Page" state='{"message":"New State!"}'>Home</a>
```

Clicking this link calls the HTML5 history API.
```js
window.history.pushState({message:'New State!'}, 'Home Page', '/home');
window.dispatchEvent(new PopStateEvent('popstate', {
  bubbles: false,
  cancelable: false,
  state: {message:'New State!'}
}));
```

## Install
[Download](https://github.com/erikringsmuth/pushstate-anchor/archive/master.zip) or run `bower install pushstate-anchor --save`

## Import
```html
<link rel="import" href="/bower_components/pushstate-anchor/pushstate-anchor.html">
or
<script src="/bower_components/pushstate-anchor/pushstate-anchor.js"></script>
```

## Notes
The [HTML5 history spec](http://www.w3.org/html/wg/drafts/html/master/browsers.html#the-history-interface) is a bit quirky. `history.pushState()` doesn't dispatch a `popstate` event or load a new page by itself. It was only meant to push state into history. This is an "undo" feature for single page applications. This is why you have to manually dispatch a `popstate` event. The `pushstate-anchor` will push the new state into history then dispatch a `popstate` event which you can use to load a new page with a router.

## Build, Test, and Debug [![Build Status](https://travis-ci.org/erikringsmuth/pushstate-anchor.png?branch=master)](https://travis-ci.org/erikringsmuth/pushstate-anchor)
Source files are under the `src` folder. The build process writes to the root directory. The easiest way to debug is to include the source script rather than the minified HTML import.
```html
<script src="/bower_components/pushstate-anchor/src/pushstate-anchor.js"></script>
```

To build:
- Run `bower install` and `npm install` to install dev dependencies
- Lint, build, and minify code changes with `gulp` (watch with `gulp watch`)
- Start a static content server to run tests (node `http-server` or `python -m SimpleHTTPServer`)
- Run unit tests in the browser (PhantomJS doesn't support Web Components) [http://localhost:8080/tests/SpecRunner.html](http://localhost:8080/tests/SpecRunner.html)
- Manually run functional tests in the browser [http://localhost:8080/tests/functional-test-site/](http://localhost:8080/tests/functional-test-site/)
