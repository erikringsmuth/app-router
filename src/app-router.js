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

  // <active-route></active-route> holds the active route's content
  document.registerElement('active-route', {
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
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;

    // trailingSlash="strict|ignore"
    if (!this.hasAttribute('trailingSlash')) {
      this.setAttribute('trailingSlash', 'strict');
    }

    // mode="auto|hash|pushstate"
    if (!this.hasAttribute('mode')) {
      this.setAttribute('mode', 'auto');
    }

    // listen for URL change events
    this.stateChangeHandler = stateChange.bind(null, this);
    window.addEventListener('popstate', this.stateChangeHandler, false);
    if (isIE) {
      // IE bug. A hashchange is supposed to trigger a popstate event, making popstate the only event you
      // need to listen to. That's not the case in IE so we make another event listener for it.
      window.addEventListener('hashchange', this.stateChangeHandler, false);
    }

    // set up an <active-route> element for the active route's content
    this.activeRouteContent = document.createElement('active-route');
    this.appendChild(this.activeRouteContent);
    if (this.hasAttribute('shadow')) {
      this.activeRouteContent = this.activeRouteContent.createShadowRoot();
    }

    // set a blank active route
    this.activeRoute = document.createElement('app-route');

    // load the web component for the current route
    stateChange(this);
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

    router.activeRoute.removeAttribute('active');
    route.setAttribute('active', 'active');
    router.activeRoute = route;

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
      activeElement(router, document.importNode(route.firstElementChild.content, true), eventDetail);
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
        activeElement(router, document.importNode(importLink.import.querySelector('template').content, true), eventDetail);
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
    while (router.activeRouteContent.firstChild) {
      router.activeRouteContent.removeChild(router.activeRouteContent.firstChild);
    }
    router.activeRouteContent.appendChild(element);
    fire('activate-route-end', eventDetail, router);
    fire('activate-route-end', eventDetail, eventDetail.route);
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
    var nativeUrl = new URL(location);

    var url = {
      path: nativeUrl.pathname,
      hash: nativeUrl.hash,
      search: nativeUrl.search,
      isHashPath: mode === 'hash'
    };

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
