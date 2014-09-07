(function(window, document) {
  // <app-route path="/path" [import="/page/cust-el.html"] [element="cust-el"] [template]></app-route>
  document.registerElement('app-route', {
    prototype: Object.create(HTMLElement.prototype)
  });

  // <active-route></active-route> holds the active route's content when `shadow` is not enabled
  document.registerElement('active-route', {
    prototype: Object.create(HTMLElement.prototype)
  });

  // <app-router [shadow] [trailingSlash="strict|ignore"] [init="auto|manual"] [pathType="auto|regular|hash"]></app-router>
  var AppRouter = Object.create(HTMLElement.prototype);

  var importedURIs = {};
  var isIE = 'ActiveXObject' in window;

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

  // Initial set up when attached
  AppRouter.attachedCallback = function() {
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
    this.activeRoute = document.createElement('app-route');

    // Listen for URL change events.
    this.stateChangeHandler = this.go.bind(this);
    window.addEventListener('popstate', this.stateChangeHandler, false);
    if (isIE) {
      // IE is truly special! A hashchange is supposed to trigger a popstate, making popstate the only
      // even you should need to listen to. Not the case in IE! Make another event listener for it!
      window.addEventListener('hashchange', this.stateChangeHandler, false);
    }

    // set up an <active-route> element for the active route's content
    this.activeRouteContent = document.createElement('active-route');
    this.appendChild(this.activeRouteContent);
    if (this.hasAttribute('shadow')) {
      this.activeRouteContent = this.activeRouteContent.createShadowRoot();
    }

    // load the web component for the active route
    this.go();
  };

  // clean up global event listeners
  AppRouter.detachedCallback = function() {
    window.removeEventListener('popstate', this.stateChangeHandler, false);
    if (isIE) {
      window.removeEventListener('hashchange', this.stateChangeHandler, false);
    }
  };

  // Find the first <app-route> that matches the current URL and change the active route
  AppRouter.go = function() {
    var urlPath = this.parseUrlPath(window.location.href, this.getAttribute('pathType'));
    var eventDetail = {
      path: urlPath
    };

    // fire a state-change event on the app-router and return early if the user called event.preventDefault()
    if (!fire('state-change', eventDetail, this)) {
      return;
    }

    // find the first matching route
    var route = this.firstElementChild;
    while (route) {
      if (route.tagName === 'APP-ROUTE' && this.testRoute(route.getAttribute('path'), urlPath, this.getAttribute('trailingSlash'), route.hasAttribute('regex'))) {
        activateRoute(this, route, urlPath);
        return;
      }
      route = route.nextSibling;
    }

    fire('not-found', eventDetail, this);
  };

  // Activate the route
  function activateRoute(router, route, urlPath) {
    var eventDetail = {
      path: urlPath,
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
      importAndActivate(router, route.getAttribute('import'), route, urlPath, eventDetail);
    }
    // pre-loaded custom element
    else if (route.hasAttribute('element')) {
      activateCustomElement(router, route.getAttribute('element'), route, urlPath, eventDetail);
    }
    // inline template
    else if (route.firstElementChild && route.firstElementChild.tagName === 'TEMPLATE') {
      activeElement(router, document.importNode(route.firstElementChild.content, true), eventDetail);
    }
  }

  // Import and activate a custom element or template
  function importAndActivate(router, importUri, route, urlPath, eventDetail) {
    var importLink;
    function importLoadedCallback() {
      // make sure the user didn't navigate to a different route while it loaded
      if (route.hasAttribute('active')) {
        activateImport(router, importLink, importUri, route, urlPath, eventDetail);
      }
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
  function activateImport(router, importLink, importUri, route, urlPath, eventDetail) {
    if (route.hasAttribute('active')) {
      if (route.hasAttribute('template')) {
        // template
        activeElement(router, document.importNode(importLink.import.querySelector('template').content, true), eventDetail);
      } else {
        // custom element
        activateCustomElement(router, route.getAttribute('element') || importUri.split('/').slice(-1)[0].replace('.html', ''), route, urlPath, eventDetail);
      }
    }
  }

  // Data bind the custom element then activate it
  function activateCustomElement(router, elementName, route, urlPath, eventDetail) {
    var customElement = document.createElement(elementName);
    var routeArgs = router.routeArguments(route.getAttribute('path'), urlPath, window.location.href, route.hasAttribute('regex'), router.getAttribute('pathType'));
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

  // urlPath(url, pathType) - Parses the url to get the path
  //
  // This will return the hash path if it exists or return the real path if no hash path exists.
  //
  // Example URL = 'http://domain.com/other/path?queryParam3=false#/example/path?queryParam1=true&queryParam2=example%20string'
  // path = '/example/path'
  //
  // Note: The URL must contain the protocol like 'http(s)://'
  AppRouter.parseUrlPath = function(url, pathType) {
    // The relative URI is everything after the third slash including the third slash
    // Example relativeUri = '/other/path?queryParam3=false#/example/path?queryParam1=true&queryParam2=example%20string'
    var splitUrl = url.split('/');
    var relativeUri = '/' + splitUrl.splice(3, splitUrl.length - 3).join('/');

    // The path is everything in the relative URI up to the first ? or #
    // Example path = '/other/path'
    var path = relativeUri.split(/[\?#]/)[0];

    // The hash is everything from the first # up to the the search starting with ? if it exists
    // Example hash = '#/example/path'
    if (pathType !== 'regular') {
      var hashIndex = relativeUri.indexOf('#');
      if (hashIndex !== -1) {
        var hash = relativeUri.substring(hashIndex).split('?')[0];
        if (hash.substring(0, 2) === '#/') {
          // Hash path
          path = hash.substring(1);
        } else if (hash.substring(0, 3) === '#!/') {
          // Hashbang path
          path = hash.substring(2);
        } else if (pathType === 'hash') {
          path = hash.substring(1);
        }
      }
    }

    return path;
  };

  // AppRouter.testRoute(routePath, urlPath, trailingSlashOption, isRegExp) - Test if the route's path matches the URL's path
  //
  // Example routePath: '/example/*'
  // Example urlPath = '/example/path'
  AppRouter.testRoute = function(routePath, urlPath, trailingSlashOption, isRegExp) {
    // This algorithm tries to fail or succeed as quickly as possible for the most common cases.

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

    if (isRegExp) {
      // parse HTML attribute path="/^\/\w+\/\d+$/i" to a regular expression `new RegExp('^\/\w+\/\d+$', 'i')`
      // note that 'i' is the only valid option. global 'g', multiline 'm', and sticky 'y' won't be valid matchers for a path.
      if (routePath.charAt(0) !== '/') {
        // must start with a slash
        return false;
      }
      routePath = routePath.slice(1);
      var options = '';
      if (routePath.slice(-1) === '/') {
        routePath = routePath.slice(0, -1);
      }
      else if (routePath.slice(-2) === '/i') {
        routePath = routePath.slice(0, -2);
        options = 'i';
      }
      else {
        // must end with a slash followed by zero or more options
        return false;
      }
      return new RegExp(routePath, options).test(urlPath);
    }

    // If the urlPath is an exact match or '*' then the route is a match
    if (routePath === urlPath || routePath === '*') {
      return true;
    }

    // Look for wildcards
    if (routePath.indexOf('*') === -1 && routePath.indexOf(':') === -1) {
      // No wildcards and we already made sure it wasn't an exact match so the test fails
      return false;
    }

    // Example urlPathSegments = ['', example', 'path']
    var urlPathSegments = urlPath.split('/');

    // Example routePathSegments = ['', 'example', '*']
    var routePathSegments = routePath.split('/');

    // There must be the same number of path segments or it isn't a match
    if (urlPathSegments.length !== routePathSegments.length) {
      return false;
    }

    // Check equality of each path segment
    for (var i = 0; i < routePathSegments.length; i++) {
      // The path segments must be equal, be a wildcard segment '*', or be a path parameter like ':id'
      var routeSegment = routePathSegments[i];
      if (routeSegment !== urlPathSegments[i] && routeSegment !== '*' && routeSegment.charAt(0) !== ':') {
        // The path segment wasn't the same string and it wasn't a wildcard or parameter
        return false;
      }
    }

    // Nothing failed. The route matches the URL.
    return true;
  };

  // AppRouter.routeArguments(routePath, urlPath, url, isRegExp, pathType) - Gets the path variables and query parameter values from the URL
  AppRouter.routeArguments = function routeArguments(routePath, urlPath, url, isRegExp, pathType) {
    var args = {};

    // Example urlPathSegments = ['', example', 'path']
    var urlPathSegments = urlPath.split('/');

    if (!isRegExp) {
      // Example routePathSegments = ['', 'example', '*']
      var routePathSegments = routePath.split('/');

      // Get path variables
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

    // Get the query parameter values
    // The search is the query parameters including the leading '?'
    var searchIndex = url.indexOf('?');
    var search = '';
    if (searchIndex !== -1) {
      search = url.substring(searchIndex);
      var hashIndex = search.indexOf('#');
      if (hashIndex !== -1) {
        search = search.substring(0, hashIndex);
      }
    }
    // If it's a hash URL we need to get the search from the hash
    if (pathType !== 'regular') {
      var hashPathIndex = url.indexOf('#/');
      var hashBangPathIndex = url.indexOf('#!/');
      if (hashPathIndex !== -1 || hashBangPathIndex !== -1) {
        var hash = '';
        if (hashPathIndex !== -1) {
          hash = url.substring(hashPathIndex);
        } else {
          hash = url.substring(hashBangPathIndex);
        }
        searchIndex = hash.indexOf('?');
        if (searchIndex !== -1) {
          search = hash.substring(searchIndex);
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

    // Parse the arguments into unescaped strings, numbers, or booleans
    for (var arg in args) {
      var value = args[arg];
      if (value === 'true') {
        args[arg] = true;
      } else if (value === 'false') {
        args[arg] = false;
      } else if (!isNaN(value) && value !== '') {
        // numeric
        args[arg] = +value;
      } else {
        // string
        args[arg] = decodeURIComponent(value);
      }
    }

    return args;
  };

  document.registerElement('app-router', {
    prototype: AppRouter
  });
})(window, document);
