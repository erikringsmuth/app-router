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
  var eventHandlers = {
    before: [],
    routeChangeStart: [],
    after: []
  };

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

    // Listen for URL change events. In some modern browsers a hashchange also fires a popstate. There isn't
    // a check to see if the browser will fire one or both. We have to keep track of the previous state to
    // prevent it from loading the active route twice.
    this.previousState = '';
    this.stateChangeHandler = function() {
      if (this.previousState !== window.location.href) {
        this.previousState = window.location.href;
        this.go();
      }
    }.bind(this);
    window.addEventListener('popstate', this.stateChangeHandler, false);
    window.addEventListener('hashchange', this.stateChangeHandler, false);

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
    window.removeEventListener('hashchange', this.stateChangeHandler, false);
  };

  // go() - Find the first <app-route> that matches the current URL and change the active route
  router.go = function() {
    var urlPath = this.urlPath(window.location.href);
    var routes = this.querySelectorAll('app-route');
    this.fire('before', urlPath);
    for (var i = 0; i < routes.length; i++) {
      if (this.testRoute(routes[i].getAttribute('path'), urlPath)) {
        this.activateRoute(routes[i], urlPath);
        break;
      }
    }
  };

  // on(event, handler) - Add an event listener.
  router.on = function(event, handler){
    if(typeof eventHandlers[event] !== 'undefined'){
      eventHandlers[event].push(handler);
    }
    return this;
  };

  // fire(event) - Fire an event
  router.fire = function(event){
    if(eventHandlers[event]){
      var args = Array.prototype.splice.call(arguments, 1);
      for(var i = 0; i < eventHandlers[event].length; i++){
        eventHandlers[event][i].apply(this, args);
      }
    }
    return this;
  };

  // off(event, handler) - Remove an event handler
  router.off = function(event, handler){
    if(eventHandlers[event]){
      var index = eventHandlers[event].indexOf(handler);
      if(index !== -1){
        eventHandlers[event].splice(index, 1);
      }
    }
    return this;
  };

  // activateRoute(route, urlPath) - Activate the route
  router.activateRoute = function(route, urlPath) {
    this.activeRoute.removeAttribute('active');
    route.setAttribute('active', 'active');
    this.activeRoute = route;

    var importUri = route.getAttribute('import');
    var routePath = route.getAttribute('path');
    var elementName = route.getAttribute('element');
    var isTemplate = route.hasAttribute('template');
    var isElement = !isTemplate;

    this.fire('routeChangeStart', route);

    // import custom element
    if (isElement && importUri) {
      this.importAndActivateCustomElement(importUri, elementName, routePath, urlPath);
    }
    // pre-loaded custom element
    else if (isElement && !importUri && elementName) {
      this.activateCustomElement(elementName, routePath, urlPath);
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

  // importAndActivateCustomElement(importUri, elementName, routePath, urlPath) - Import the custom element then replace the active route
  // with a new instance of the custom element
  router.importAndActivateCustomElement = function(importUri, elementName, routePath, urlPath) {
    if (!importedURIs.hasOwnProperty(importUri)) {
      importedURIs[importUri] = true;
      var elementLink = document.createElement('link');
      elementLink.setAttribute('rel', 'import');
      elementLink.setAttribute('href', importUri);
      document.head.appendChild(elementLink);
    }
    this.activateCustomElement(elementName || importUri.split('/').slice(-1)[0].replace('.html', ''), routePath, urlPath);
  };

  // activateCustomElement(elementName, routePath, urlPath) - Replace the active route with a new instance of the custom element
  router.activateCustomElement = function(elementName, routePath, urlPath) {
    var resourceEl = document.createElement(elementName);
    var routeArgs = this.routeArguments(routePath, urlPath, window.location.href);
    for (var arg in routeArgs) {
      if (routeArgs.hasOwnProperty(arg)) {
        resourceEl[arg] = routeArgs[arg];
      }
    }
    this.replaceActiveElement(resourceEl);
  };

  // importAndActivateTemplate(importUri, route) - Import the template then replace the active route with a clone of the template's content
  router.importAndActivateTemplate = function(importUri, route) {
    if (importedURIs.hasOwnProperty(importUri)) {
      // previously imported. this is an async operation and may not be complete yet.
      var previousLink = document.querySelector('link[href="' + importUri + '"]');
      if (previousLink.import) {
        // the import is complete
        this.replaceActiveElement(document.importNode(previousLink.import.querySelector('template').content, true));
      } else {
        // wait for `onload`
        previousLink.onload = function() {
          if (route.hasAttribute('active')) {
            this.replaceActiveElement(document.importNode(previousLink.import.querySelector('template').content, true));
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
          this.replaceActiveElement(document.importNode(templateLink.import.querySelector('template').content, true));
        }
      }.bind(this);
      document.head.appendChild(templateLink);
    }
  };

  // activateTemplate(route) - Replace the active route with a clone of the template's content
  router.activateTemplate = function(route) {
    var clone = document.importNode(route.querySelector('template').content, true);
    this.replaceActiveElement(clone);
  };

  // replaceActiveElement(newElement) - Replace the active route's content with the new element
  router.replaceActiveElement = function(newElement) {
    while (this.activeRouteContent.firstChild) {
      this.activeRouteContent.removeChild(this.activeRouteContent.firstChild);
    }
    this.activeRouteContent.appendChild(newElement);
    this.fire('after', this.activeRouteContent);
  };

  // urlPath(url) - Parses the url to get the path
  //
  // This will return the hash path if it exists or return the real path if no hash path exists.
  //
  // Example URL = 'http://domain.com/other/path?queryParam3=false#/example/path?queryParam1=true&queryParam2=example%20string'
  // path = '/example/path'
  //
  // Note: The URL must contain the protocol like 'http(s)://'
  router.urlPath = function(url) {
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

  // router.testRoute(routePath, urlPath) - Test if the route's path matches the URL's path
  //
  // Example routePath: '/example/*'
  // Example urlPath = '/example/path'
  router.testRoute = function(routePath, urlPath) {
    // This algorithm tries to fail or succeed as quickly as possible for the most common cases.

    // handle trailing slashes (options: strict (default), ignore)
    if (this.getAttribute('trailingSlash') === 'ignore') {
      // remove trailing / from the route path and URL path
      if(urlPath.slice(-1) === '/') {
        urlPath = urlPath.slice(0, -1);
      }
      if(routePath.slice(-1) === '/') {
        routePath = routePath.slice(0, -1);
      }
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

  // router.routeArguments(routePath, urlPath, url) - Gets the path variables and query parameter values from the URL
  router.routeArguments = function routeArguments(routePath, urlPath, url) {
    var args = {};

    // Example urlPathSegments = ['', example', 'path']
    var urlPathSegments = urlPath.split('/');

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
