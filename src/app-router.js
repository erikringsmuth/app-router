(function(window, document) {
  var utilities = {};
  var importedURIs = {};
  var isIE = 'ActiveXObject' in window;

  // <app-router [init="auto|manual"] [mode="auto|hash|pushstate"] [trailingSlash="strict|ignore"] [shadow]></app-router>
  var AppRouter = Object.create(HTMLElement.prototype);
  AppRouter.util = utilities;

  // <app-route path="/path" [import="/page/cust-el.html"] [element="cust-el"] [template]></app-route>
  document.registerElement('app-route', {
    prototype: Object.create(HTMLElement.prototype)
  });

  // Initial set up when attached
  AppRouter.attachedCallback = function() {
    // init="auto|manual"
    if(this.getAttribute('init') !== 'manual') {
      this.init();
    }
  };

  // Initialize the router
  AppRouter.init = function() {
    var router = this;
    if (router.isInitialized) {
      return;
    }
    router.isInitialized = true;

    // trailingSlash="strict|ignore"
    if (!router.hasAttribute('trailingSlash')) {
      router.setAttribute('trailingSlash', 'strict');
    }

    // mode="auto|hash|pushstate"
    if (!router.hasAttribute('mode')) {
      router.setAttribute('mode', 'auto');
    }

    // <app-router core-animated-pages transitions="hero-transition cross-fade">
    if (router.hasAttribute('core-animated-pages')) {
      // use shadow DOM to wrap the <app-route> elements in a <core-animated-pages> element
      // <app-router>
      //   # shadowRoot
      //   <core-animated-pages>
      //     # content in the light DOM
      //     <app-route element="home-page">
      //       <home-page>
      //       </home-page>
      //     </app-route>
      //   </core-animated-pages>
      // </app-router>
      router.createShadowRoot();
      router.coreAnimatedPages = document.createElement('core-animated-pages');
      router.coreAnimatedPages.appendChild(document.createElement('content'));

      // don't know why it needs to be static, but absolute doesn't display the page
      router.coreAnimatedPages.style.position = 'static';

      // toggle the selected page using selected="path" instead of selected="integer"
      router.coreAnimatedPages.setAttribute('valueattr', 'path');

      // pass the transitions attribute from <app-router core-animated-pages transitions="hero-transition cross-fade">
      // to <core-animated-pages transitions="hero-transition cross-fade">
      router.coreAnimatedPages.setAttribute('transitions', router.getAttribute('transitions'));

      // set the shadow DOM's content
      router.shadowRoot.appendChild(router.coreAnimatedPages);

      // when a transition finishes, remove the previous route's content. there is a temporary overlap where both
      // the new and old route's content is in the DOM to animate the transition.
      router.coreAnimatedPages.addEventListener('core-animated-pages-transition-end', function() {
        transitionAnimationEnd(router.previousRoute);
      });
    }

    // listen for URL change events
    router.stateChangeHandler = stateChange.bind(null, router);
    window.addEventListener('popstate', router.stateChangeHandler, false);
    if (isIE) {
      // IE bug. A hashchange is supposed to trigger a popstate event, making popstate the only event you
      // need to listen to. That's not the case in IE so we make another event listener for it.
      window.addEventListener('hashchange', router.stateChangeHandler, false);
    }

    // load the web component for the current route
    stateChange(router);
  };

  // clean up global event listeners
  AppRouter.detachedCallback = function() {
    window.removeEventListener('popstate', this.stateChangeHandler, false);
    if (isIE) {
      window.removeEventListener('hashchange', this.stateChangeHandler, false);
    }
  };

  // go(path, options) Navigate to the path
  //
  // options = {
  //   replace: true
  // }
  AppRouter.go = function(path, options) {
    if (this.getAttribute('mode') !== 'pushstate') {
      // mode = auto or hash
      path = '#' + path;
    }
    if (options && options.replace !== true) {
      window.history.pushState(null, null, path);
    } else {
      window.history.replaceState(null, null, path);
    }
    stateChange(this);
  };

  // fire(type, detail, node) - Fire a new CustomEvent(type, detail) on the node
  //
  // listen with document.querySelector('app-router').addEventListener(type, function(event) {
  //   event.detail, event.preventDefault()
  // })
  function fire(type, detail, node) {
    // create a CustomEvent the old way for IE9/10 support
    var event = document.createEvent('CustomEvent');

    // initCustomEvent(type, bubbles, cancelable, detail)
    event.initCustomEvent(type, false, true, detail);

    // returns false when event.preventDefault() is called, true otherwise
    return node.dispatchEvent(event);
  }

  // Find the first <app-route> that matches the current URL and change the active route
  function stateChange(router) {
    var url = utilities.parseUrl(window.location.href, router.getAttribute('mode'));
    var eventDetail = {
      path: url.path
    };

    // fire a state-change event on the app-router and return early if the user called event.preventDefault()
    if (!fire('state-change', eventDetail, router)) {
      return;
    }

    // find the first matching route
    var route = router.firstElementChild;
    while (route) {
      if (route.tagName === 'APP-ROUTE' && utilities.testRoute(route.getAttribute('path'), url.path, router.getAttribute('trailingSlash'), route.hasAttribute('regex'))) {
        activateRoute(router, route, url);
        return;
      }
      route = route.nextSibling;
    }

    fire('not-found', eventDetail, router);
  }

  // Activate the route
  function activateRoute(router, route, url) {
    if (route.hasAttribute('redirect')) {
      router.go(route.getAttribute('redirect'), {replace: true});
      return;
    }

    var eventDetail = {
      path: url.path,
      route: route,
      oldRoute: router.activeRoute
    };
    if (!fire('activate-route-start', eventDetail, router)) {
      return;
    }
    if (!fire('activate-route-start', eventDetail, route)) {
      return;
    }

    // update the references to the activeRoute and previousRoute. if you switch between routes quickly you may go to a
    // new route before the previous route's transition animation has completed. if that's the case we need to remove
    // the previous route's content before we replace the reference to the previous route.
    if (router.previousRoute && router.previousRoute.transitionAnimationInProgress) {
      transitionAnimationEnd(router.previousRoute);
    }
    if (router.activeRoute) {
      router.activeRoute.removeAttribute('active');
    }
    router.previousRoute = router.activeRoute;
    router.activeRoute = route;
    router.activeRoute.setAttribute('active', 'active');

    // import custom element or template
    if (route.hasAttribute('import')) {
      importAndActivate(router, route.getAttribute('import'), route, url, eventDetail);
    }
    // pre-loaded custom element
    else if (route.hasAttribute('element')) {
      activateCustomElement(router, route.getAttribute('element'), route, url, eventDetail);
    }
    // inline template
    else if (route.firstElementChild && route.firstElementChild.tagName === 'TEMPLATE') {
      activeElement(router, stampTemplate(route.firstElementChild, route, url), eventDetail);
    }
  }

  // Create an instance of the template
  function stampTemplate(template, route, url) {
    if ('createInstance' in template) {
      var routeArgs = utilities.routeArguments(route.getAttribute('path'), url.path, url.search, route.hasAttribute('regex'));
      for (var arg in routeArgs) {
        if (routeArgs.hasOwnProperty(arg)) {
          template.templateInstance.model[arg] = routeArgs[arg];
        }
      }
      // the Polymer way (see issue https://github.com/erikringsmuth/app-router/issues/19)
      return template.createInstance(template.templateInstance.model, template.bindingDelegate);
    } else {
      return document.importNode(template.content, true);
    }
  }

  // Import and activate a custom element or template
  function importAndActivate(router, importUri, route, url, eventDetail) {
    var importLink;
    function importLoadedCallback() {
      activateImport(router, importLink, importUri, route, url, eventDetail);
    }

    if (!importedURIs.hasOwnProperty(importUri)) {
      // hasn't been imported yet
      importedURIs[importUri] = true;
      importLink = document.createElement('link');
      importLink.setAttribute('rel', 'import');
      importLink.setAttribute('href', importUri);
      importLink.addEventListener('load', importLoadedCallback);
      document.head.appendChild(importLink);
    } else {
      // previously imported. this is an async operation and may not be complete yet.
      importLink = document.querySelector('link[href="' + importUri + '"]');
      if (importLink.import) {
        // import complete
        importLoadedCallback();
      } else {
        // wait for `onload`
        importLink.addEventListener('load', importLoadedCallback);
      }
    }
  }

  // Activate the imported custom element or template
  function activateImport(router, importLink, importUri, route, url, eventDetail) {
    // make sure the user didn't navigate to a different route while it loaded
    if (route.hasAttribute('active')) {
      if (route.hasAttribute('template')) {
        // template
        activeElement(router, stampTemplate(importLink.import.querySelector('template'), route, url), eventDetail);
      } else {
        // custom element
        activateCustomElement(router, route.getAttribute('element') || importUri.split('/').slice(-1)[0].replace('.html', ''), route, url, eventDetail);
      }
    }
  }

  // Data bind the custom element then activate it
  function activateCustomElement(router, elementName, route, url, eventDetail) {
    var customElement = document.createElement(elementName);
    var routeArgs = utilities.routeArguments(route.getAttribute('path'), url.path, url.search, route.hasAttribute('regex'));
    for (var arg in routeArgs) {
      if (routeArgs.hasOwnProperty(arg)) {
        customElement[arg] = routeArgs[arg];
      }
    }
    activeElement(router, customElement, eventDetail);
  }

  // Replace the active route's content with the new element
  function activeElement(router, element, eventDetail) {
    // core-animated-pages temporarily needs the old and new route in the DOM at the same time to animate the transition,
    // otherwise we can remove the old route's content right away.
    if (!router.hasAttribute('core-animated-pages')) {
      removeRouteContent(router.previousRoute);
    }

    // add the new content
    router.activeRoute.appendChild(element);

    // animate the transition if core-animated-pages are being used
    if (router.hasAttribute('core-animated-pages')) {
      router.coreAnimatedPages.selected = router.activeRoute.getAttribute('path');

      // we already wired up transitionAnimationEnd() in init()

      // use to check if the previous route has finished animating before being removed
      if (router.previousRoute) {
        router.previousRoute.transitionAnimationInProgress = true;
      }
    }

    fire('activate-route-end', eventDetail, router);
    fire('activate-route-end', eventDetail, eventDetail.route);
  }

  // Call when the previousRoute has finished the transition animation out
  function transitionAnimationEnd(previousRoute) {
    if (previousRoute) {
      previousRoute.transitionAnimationInProgress = false;
      removeRouteContent(previousRoute);
    }
  }

  // Remove the route's content (but not the <template> if it exists)
  function removeRouteContent(route) {
    if (route) {
      var node = route.firstChild;
      while (node) {
        var nodeToRemove = node;
        node = node.nextSibling;
        if (nodeToRemove.tagName !== 'TEMPLATE') {
          route.removeChild(nodeToRemove);
        }
      }
    }
  }

  // parseUrl(location, mode) - Augment the native URL() constructor to get info about hash paths
  //
  // Example parseUrl('http://domain.com/other/path?queryParam3=false#/example/path?queryParam1=true&queryParam2=example%20string', 'auto')
  //
  // returns {
  //   path: '/example/path',
  //   hash: '#/example/path?queryParam1=true&queryParam2=example%20string'
  //   search: '?queryParam1=true&queryParam2=example%20string',
  //   isHashPath: true
  // }
  //
  // Note: The location must be a fully qualified URL with a protocol like 'http(s)://'
  utilities.parseUrl = function(location, mode) {
    var url = {
      isHashPath: mode === 'hash'
    };

    if (typeof URL === 'function') {
      // browsers that support `new URL()`
      var nativeUrl = new URL(location);
      url.path = nativeUrl.pathname;
      url.hash = nativeUrl.hash;
      url.search = nativeUrl.search;
    } else {
      // IE
      var anchor = document.createElement('a');
      anchor.href = location;
      url.path = anchor.pathname;
      if (url.path.charAt(0) !== '/') {
        url.path = '/' + url.path;
      }
      url.hash = anchor.hash;
      url.search = anchor.search;
    }

    if (mode !== 'pushstate') {
      // auto or hash

      // check for a hash path
      if (url.hash.substring(0, 2) === '#/') {
        // hash path
        url.isHashPath = true;
        url.path = url.hash.substring(1);
      } else if (url.hash.substring(0, 3) === '#!/') {
        // hashbang path
        url.isHashPath = true;
        url.path = url.hash.substring(2);
      } else if (url.isHashPath) {
        // still use the hash if mode="hash"
        if (url.hash.length === 0) {
          url.path = '/';
        } else {
          url.path = url.hash.substring(1);
        }
      }

      // hash paths get the search from the hash if it exists
      if (url.isHashPath) {
        var searchIndex = url.path.indexOf('?');
        if (searchIndex !== -1) {
          url.search = url.path.substring(searchIndex);
          url.path = url.path.substring(0, searchIndex);
        }
      }
    }

    return url;
  };

  // testRoute(routePath, urlPath, trailingSlashOption, isRegExp) - Test if the route's path matches the URL's path
  //
  // Example routePath: '/example/*'
  // Example urlPath = '/example/path'
  utilities.testRoute = function(routePath, urlPath, trailingSlashOption, isRegExp) {
    // this algorithm tries to fail or succeed as quickly as possible for the most common cases

    // handle trailing slashes (options: strict (default), ignore)
    if (trailingSlashOption === 'ignore') {
      // remove trailing / from the route path and URL path
      if(urlPath.slice(-1) === '/') {
        urlPath = urlPath.slice(0, -1);
      }
      if(routePath.slice(-1) === '/' && !isRegExp) {
        routePath = routePath.slice(0, -1);
      }
    }

    // test regular expressions
    if (isRegExp) {
      return utilities.testRegExString(routePath, urlPath);
    }

    // if the urlPath is an exact match or '*' then the route is a match
    if (routePath === urlPath || routePath === '*') {
      return true;
    }

    // look for wildcards
    if (routePath.indexOf('*') === -1 && routePath.indexOf(':') === -1) {
      // no wildcards and we already made sure it wasn't an exact match so the test fails
      return false;
    }

    // example urlPathSegments = ['', example', 'path']
    var urlPathSegments = urlPath.split('/');

    // example routePathSegments = ['', 'example', '*']
    var routePathSegments = routePath.split('/');

    // there must be the same number of path segments or it isn't a match
    if (urlPathSegments.length !== routePathSegments.length) {
      return false;
    }

    // check equality of each path segment
    for (var i = 0; i < routePathSegments.length; i++) {
      // the path segments must be equal, be a wildcard segment '*', or be a path parameter like ':id'
      var routeSegment = routePathSegments[i];
      if (routeSegment !== urlPathSegments[i] && routeSegment !== '*' && routeSegment.charAt(0) !== ':') {
        // the path segment wasn't the same string and it wasn't a wildcard or parameter
        return false;
      }
    }

    // nothing failed. the route matches the URL.
    return true;
  };

  // routeArguments(routePath, urlPath, search, isRegExp) - Gets the path variables and query parameter values from the URL
  utilities.routeArguments = function(routePath, urlPath, search, isRegExp) {
    var args = {};

    // regular expressions can't have path variables
    if (!isRegExp) {
      // example urlPathSegments = ['', example', 'path']
      var urlPathSegments = urlPath.split('/');

      // example routePathSegments = ['', 'example', '*']
      var routePathSegments = routePath.split('/');

      // get path variables
      // urlPath '/customer/123'
      // routePath '/customer/:id'
      // parses id = '123'
      for (var index = 0; index < routePathSegments.length; index++) {
        var routeSegment = routePathSegments[index];
        if (routeSegment.charAt(0) === ':') {
          args[routeSegment.substring(1)] = urlPathSegments[index];
        }
      }
    }

    var queryParameters = search.substring(1).split('&');
    // split() on an empty string has a strange behavior of returning [''] instead of []
    if (queryParameters.length === 1 && queryParameters[0] === '') {
      queryParameters = [];
    }
    for (var i = 0; i < queryParameters.length; i++) {
      var queryParameter = queryParameters[i];
      var queryParameterParts = queryParameter.split('=');
      args[queryParameterParts[0]] = queryParameterParts.splice(1, queryParameterParts.length - 1).join('=');
    }

    // parse the arguments into unescaped strings, numbers, or booleans
    for (var arg in args) {
      args[arg] = utilities.typecast(args[arg]);
    }

    return args;
  };

  // typecast(value) - Typecast the string value to an unescaped string, number, or boolean
  utilities.typecast = function(value) {
    // bool
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }

    // number
    if (!isNaN(value) && value !== '' && value.charAt(0) !== '0') {
      return +value;
    }

    // string
    return decodeURIComponent(value);
  };

  // testRegExString(pattern, value) - Parse HTML attribute path="/^\/\w+\/\d+$/i" to a regular
  // expression `new RegExp('^\/\w+\/\d+$', 'i')` and test against it.
  //
  // note that 'i' is the only valid option. global 'g', multiline 'm', and sticky 'y' won't be valid matchers for a path.
  utilities.testRegExString = function(pattern, value) {
    if (pattern.charAt(0) !== '/') {
      // must start with a slash
      return false;
    }
    pattern = pattern.slice(1);
    var options = '';
    if (pattern.slice(-1) === '/') {
      pattern = pattern.slice(0, -1);
    }
    else if (pattern.slice(-2) === '/i') {
      pattern = pattern.slice(0, -2);
      options = 'i';
    }
    else {
      // must end with a slash followed by zero or more options
      return false;
    }
    return new RegExp(pattern, options).test(value);
  };

  document.registerElement('app-router', {
    prototype: AppRouter
  });

})(window, document);
