(function(window, document) {
  // <app-route path="/path" [import="/page/cust-el.html"] [element="cust-el"] [template]></app-route>
  document.registerElement('app-route', {
    prototype: Object.create(HTMLElement.prototype)
  });

  // <active-route></active-route> holds the active route's content when `shadow` is not enabled
  document.registerElement('active-route', {
    prototype: Object.create(HTMLElement.prototype)
  });

  // <app-router [shadow] [trailingSlash="strict|ignore"] [init="auto|manual"]></app-router>
  var router = Object.create(HTMLElement.prototype);

  var importedURIs = {};
  var isIE = 'ActiveXObject' in window;

  // Initial set up when attached
  router.attachedCallback = function() {
    if(this.getAttribute('init') !== 'manual') {
      this.init();
    }
  };

  // Initialize the router
  router.init = function() {
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

    // set up a shadow root or <active-route> element for the active route's content
    if (this.hasAttribute('shadow')) {
      this.activeRouteContent = this.createShadowRoot();
    } else {
      this.activeRouteContent = document.createElement('active-route');
      this.appendChild(this.activeRouteContent);
    }

    // load the web component for the active route
    this.go();
  };

  // clean up global event listeners
  router.detachedCallback = function() {
    window.removeEventListener('popstate', this.stateChangeHandler, false);
    if (isIE) {
      window.removeEventListener('hashchange', this.stateChangeHandler, false);
    }
  };

  // go() - Find the first <app-route> that matches the current URL and change the active route
  router.go = function() {
    var urlPath = this.parseUrlPath(window.location.href);
    var routes = this.querySelectorAll('app-route');
    for (var i = 0; i < routes.length; i++) {
      if (this.testRoute(routes[i].getAttribute('path'), urlPath, this.getAttribute('trailingSlash'), routes[i].hasAttribute('regex'))) {
        this.activateRoute(routes[i], urlPath);
        break;
      }
    }
  };

  // activateRoute(route, urlPath) - Activate the route
  router.activateRoute = function(route, urlPath) {
    this.activeRoute.removeAttribute('active');
    route.setAttribute('active', 'active');
    this.activeRoute = route;

    var importUri = route.getAttribute('import');
    var routePath = route.getAttribute('path');
    var isRegExp = route.hasAttribute('regex');
    var elementName = route.getAttribute('element');
    var isTemplate = route.hasAttribute('template');
    var isElement = !isTemplate;

    // import custom element
    if (isElement && importUri) {
      this.importAndActivateCustomElement(importUri, elementName, routePath, urlPath, isRegExp);
    }
    // pre-loaded custom element
    else if (isElement && !importUri && elementName) {
      this.activateCustomElement(elementName, routePath, urlPath, isRegExp);
    }
    // import template
    else if (isTemplate && importUri) {
      this.importAndActivateTemplate(importUri, route);
    }
    // pre-loaded template
    else if (isTemplate && !importUri) {
      this.activateTemplate(route);
    }
  };

  // importAndActivateCustomElement(importUri, elementName, routePath, urlPath, isRegExp) - Import the custom element then replace the active route
  // with a new instance of the custom element
  router.importAndActivateCustomElement = function(importUri, elementName, routePath, urlPath, isRegExp) {
    if (!importedURIs.hasOwnProperty(importUri)) {
      importedURIs[importUri] = true;
      var elementLink = document.createElement('link');
      elementLink.setAttribute('rel', 'import');
      elementLink.setAttribute('href', importUri);
      document.head.appendChild(elementLink);
    }
    this.activateCustomElement(elementName || importUri.split('/').slice(-1)[0].replace('.html', ''), routePath, urlPath, isRegExp);
  };

  // activateCustomElement(elementName, routePath, urlPath, isRegExp) - Replace the active route with a new instance of the custom element
  router.activateCustomElement = function(elementName, routePath, urlPath, isRegExp) {
    var resourceEl = document.createElement(elementName);
    var routeArgs = this.routeArguments(routePath, urlPath, window.location.href, isRegExp);
    for (var arg in routeArgs) {
      if (routeArgs.hasOwnProperty(arg)) {
        resourceEl[arg] = routeArgs[arg];
      }
    }
    this.activeElement(resourceEl);
  };

  // importAndActivateTemplate(importUri, route) - Import the template then replace the active route with a clone of the template's content
  router.importAndActivateTemplate = function(importUri, route) {
    if (importedURIs.hasOwnProperty(importUri)) {
      // previously imported. this is an async operation and may not be complete yet.
      var previousLink = document.querySelector('link[href="' + importUri + '"]');
      if (previousLink.import) {
        // the import is complete
        this.activeElement(document.importNode(previousLink.import.querySelector('template').content, true));
      } else {
        // wait for `onload`
        previousLink.onload = function() {
          if (route.hasAttribute('active')) {
            this.activeElement(document.importNode(previousLink.import.querySelector('template').content, true));
          }
        }.bind(this);
      }
    } else {
      // template hasn't been loaded yet
      importedURIs[importUri] = true;
      var templateLink = document.createElement('link');
      templateLink.setAttribute('rel', 'import');
      templateLink.setAttribute('href', importUri);
      templateLink.onload = function() {
        if (route.hasAttribute('active')) {
          this.activeElement(document.importNode(templateLink.import.querySelector('template').content, true));
        }
      }.bind(this);
      document.head.appendChild(templateLink);
    }
  };

  // activateTemplate(route) - Replace the active route with a clone of the template's content
  router.activateTemplate = function(route) {
    var clone = document.importNode(route.querySelector('template').content, true);
    this.activeElement(clone);
  };

  // activeElement(element) - Replace the active route's content with the new element
  router.activeElement = function(element) {
    while (this.activeRouteContent.firstChild) {
      this.activeRouteContent.removeChild(this.activeRouteContent.firstChild);
    }
    this.activeRouteContent.appendChild(element);
  };

  // urlPath(url) - Parses the url to get the path
  //
  // This will return the hash path if it exists or return the real path if no hash path exists.
  //
  // Example URL = 'http://domain.com/other/path?queryParam3=false#/example/path?queryParam1=true&queryParam2=example%20string'
  // path = '/example/path'
  //
  // Note: The URL must contain the protocol like 'http(s)://'
  router.parseUrlPath = function(url) {
    // The relative URI is everything after the third slash including the third slash
    // Example relativeUri = '/other/path?queryParam3=false#/example/path?queryParam1=true&queryParam2=example%20string'
    var splitUrl = url.split('/');
    var relativeUri = '/' + splitUrl.splice(3, splitUrl.length - 3).join('/');

    // The path is everything in the relative URI up to the first ? or #
    // Example path = '/other/path'
    var path = relativeUri.split(/[\?#]/)[0];

    // The hash is everything from the first # up to the the search starting with ? if it exists
    // Example hash = '#/example/path'
    var hashIndex = relativeUri.indexOf('#');
    if (hashIndex !== -1) {
      var hash = relativeUri.substring(hashIndex).split('?')[0];
      if (hash.substring(0, 2) === '#/') {
        // Hash path
        path = hash.substring(1);
      } else if (hash.substring(0, 3) === '#!/') {
        // Hashbang path
        path = hash.substring(2);
      }
    }

    return path;
  };

  // router.testRoute(routePath, urlPath, trailingSlashOption, isRegExp) - Test if the route's path matches the URL's path
  //
  // Example routePath: '/example/*'
  // Example urlPath = '/example/path'
  router.testRoute = function(routePath, urlPath, trailingSlashOption, isRegExp) {
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

  // router.routeArguments(routePath, urlPath, url, isRegExp) - Gets the path variables and query parameter values from the URL
  router.routeArguments = function routeArguments(routePath, urlPath, url, isRegExp) {
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
    prototype: router
  });
})(window, document);
