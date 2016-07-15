// @license Copyright (C) 2015 Erik Ringsmuth - MIT license
(function(window, document) {
  var utilities = {};
  var importedURIs = {};
  var isIE = 'ActiveXObject' in window;
  var isEdge = (!!window.navigator.userAgent.match(/Edge/));
  var previousUrl = {};

  // <app-router
  //   init="auto|manual"
  //   mode="auto|hash|hashbang|pushstate"
  //   trailingSlash="strict|ignore"
  //   typecast="auto|string"
  //   bindRouter
  //   ></app-router>
  var AppRouter = Object.create(HTMLElement.prototype);
  AppRouter.util = utilities;

  // <app-route
  //   path="/path"
  //   import="/page/cust-el.html"
  //   element[="cust-el"]
  //   template[="template-id"]
  //   regex
  //   redirect="/path"
  //   onUrlChange="reload|updateModel|noop"
  //   bindRouter
  //   ></app-route>
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

    // mode="auto|hash|hashbang|pushstate"
    if (!router.hasAttribute('mode')) {
      router.setAttribute('mode', 'auto');
    }

    // typecast="auto|string"
    if (!router.hasAttribute('typecast')) {
      router.setAttribute('typecast', 'auto');
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
        // with core-animated-pages, navigating to the same route twice quickly will set the new route to both the
        // activeRoute and the previousRoute before the animation finishes. we don't want to delete the route content
        // if it's actually the active route.
        if (router.previousRoute && !router.previousRoute.hasAttribute('active')) {
          deactivateRoute(router.previousRoute);
        }
      });
    }

    // listen for URL change events
    router.stateChangeHandler = stateChange.bind(null, router);
    window.addEventListener('popstate', router.stateChangeHandler, false);
    if (isIE || isEdge) {
      // IE & Edge bug. A hashchange is supposed to trigger a popstate event, making popstate the only event you
      // need to listen to. That's not the case in IE & Edge so we make another event listener for it.
      window.addEventListener('hashchange', router.stateChangeHandler, false);
    }

    // load the web component for the current route
    stateChange(router);
  };

  // clean up global event listeners
  AppRouter.detachedCallback = function() {
    window.removeEventListener('popstate', this.stateChangeHandler, false);
    if (isIE || isEdge) {
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
      // mode == auto, hash or hashbang
      if (this.getAttribute('mode') === 'hashbang') {
        path = '#!' + path;
      } else {
        path = '#' + path;
      }
    }
    var currentState = window.history.state;
    if (options && options.replace === true) {
      window.history.replaceState(currentState, null, path);
    } else {
      window.history.pushState(currentState, null, path);
    }

    // dispatch a popstate event
    try {
      var popstateEvent = new PopStateEvent('popstate', {
        bubbles: false,
        cancelable: false,
        state: currentState
      });

      if ('dispatchEvent_' in window) {
        // FireFox with polyfill
        window.dispatchEvent_(popstateEvent);
      } else {
        // normal
        window.dispatchEvent(popstateEvent);
      }
    } catch(error) {
      // Internet Exploder
      var fallbackEvent = document.createEvent('CustomEvent');
      fallbackEvent.initCustomEvent('popstate', false, false, { state: currentState });
      window.dispatchEvent(fallbackEvent);
    }
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

    // don't load a new route if only the hash fragment changed
    if (url.hash !== previousUrl.hash && url.path === previousUrl.path && url.search === previousUrl.search && url.isHashPath === previousUrl.isHashPath) {
      scrollToHash(url.hash);
      previousUrl = url;
      return;
    }
    previousUrl = url;

    // fire a state-change event on the app-router and return early if the user called event.preventDefault()
    var eventDetail = {
      path: url.path,
      state: window.history.state
    };
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

    // if we're on the same route and `onUrlChange="noop"` then don't reload the route or update the model
    if (route === router.activeRoute && route.getAttribute('onUrlChange') === 'noop') {
      return;
    }

    var eventDetail = {
      path: url.path,
      route: route,
      oldRoute: router.activeRoute,
      state: window.history.state
    };
    if (!fire('activate-route-start', eventDetail, router)) {
      return;
    }
    if (!fire('activate-route-start', eventDetail, route)) {
      return;
    }

    // keep track of the route currently being loaded
    router.loadingRoute = route;

    // if we're on the same route and `onUrlChange="updateModel"` then update the model but don't replace the page content
    if (route === router.activeRoute && route.getAttribute('onUrlChange') === 'updateModel') {
      updateModelAndActivate(router, route, url, eventDetail);
    }
    // import custom element or template
    else if (route.hasAttribute('import')) {
      importAndActivate(router, route.getAttribute('import'), route, url, eventDetail);
    }
    // pre-loaded custom element
    else if (route.hasAttribute('element')) {
      activateCustomElement(router, route.getAttribute('element'), route, url, eventDetail);
    }
    // inline template
    else if (route.firstElementChild && route.firstElementChild.tagName === 'TEMPLATE') {
      // mark the route as an inline template so we know how to clean it up when we remove the route's content
      route.isInlineTemplate = true;
      activateTemplate(router, route.firstElementChild, route, url, eventDetail);
    }
  }

  // If we are only hiding and showing the route, update the model and activate the route
  function updateModelAndActivate(router, route, url, eventDetail) {
    var model = createModel(router, route, url, eventDetail);

    if (route.hasAttribute('template') || route.isInlineTemplate) {
      // update the template model
      setObjectProperties(route.lastElementChild.templateInstance.model, model);
    } else {
      // update the custom element model
      setObjectProperties(route.firstElementChild, model);
    }

    fire('activate-route-end', eventDetail, router);
    fire('activate-route-end', eventDetail, eventDetail.route);
  }

  // Import and activate a custom element or template
  function importAndActivate(router, importUri, route, url, eventDetail) {
    var importLink;
    function importLoadedCallback() {
      importLink.loaded = true;
      activateImport(router, importLink, importUri, route, url, eventDetail);
    }
    function importErrorCallback(event) {
      var errorDetail = {
        errorEvent: event,
        importUri: importUri,
        routeDetail: eventDetail
      };
      fire('import-error', errorDetail, router);
      fire('import-error', errorDetail, route);
    }

    if (!importedURIs.hasOwnProperty(importUri)) {
      // hasn't been imported yet
      importLink = document.createElement('link');
      importLink.setAttribute('rel', 'import');
      importLink.setAttribute('href', importUri);
      importLink.setAttribute('async', 'async');
      importLink.addEventListener('load', importLoadedCallback);
      importLink.addEventListener('error', importErrorCallback);
      importLink.loaded = false;
      document.head.appendChild(importLink);
      importedURIs[importUri] = importLink;
    } else {
      // previously imported. this is an async operation and may not be complete yet.
      importLink = importedURIs[importUri];
      if (!importLink.loaded) {
        importLink.addEventListener('load', importLoadedCallback);
        importLink.addEventListener('error', importErrorCallback);
      } else {
        activateImport(router, importLink, importUri, route, url, eventDetail);
      }
    }
  }

  // Activate the imported custom element or template
  function activateImport(router, importLink, importUri, route, url, eventDetail) {
    // allow referencing the route's import link in the activate-route-end callback
    route.importLink = importLink;

    // make sure the user didn't navigate to a different route while it loaded
    if (route === router.loadingRoute) {
      if (route.hasAttribute('template')) {
        // template
        var templateId = route.getAttribute('template');
        var template;
        if (templateId) {
          template = importLink.import.getElementById(templateId);
        } else {
          template = importLink.import.querySelector('template');
        }
        activateTemplate(router, template, route, url, eventDetail);
      } else {
        // custom element
        activateCustomElement(router, route.getAttribute('element') || importUri.split('/').slice(-1)[0].replace('.html', ''), route, url, eventDetail);
      }
    }
  }

  // Data bind the custom element then activate it
  function activateCustomElement(router, elementName, route, url, eventDetail) {
    var customElement = document.createElement(elementName);
    var model = createModel(router, route, url, eventDetail);
    setObjectProperties(customElement, model);
    activateElement(router, customElement, url, eventDetail);
  }

  // Create an instance of the template
  function activateTemplate(router, template, route, url, eventDetail) {
    var templateInstance;
    if ('createInstance' in template) {
      // template.createInstance(model) is a Polymer method that binds a model to a template and also fixes
      // https://github.com/erikringsmuth/app-router/issues/19
      var model = createModel(router, route, url, eventDetail);
      templateInstance = template.createInstance(model);
    } else {
      templateInstance = document.importNode(template.content, true);
    }
    activateElement(router, templateInstance, url, eventDetail);
  }

  // Create the route's model
  function createModel(router, route, url, eventDetail) {
    var model = utilities.routeArguments(route.getAttribute('path'), url.path, url.search, route.hasAttribute('regex'), router.getAttribute('typecast') === 'auto');
    if (route.hasAttribute('bindRouter') || router.hasAttribute('bindRouter')) {
      model.router = router;
    }
    eventDetail.model = model;
    fire('before-data-binding', eventDetail, router);
    fire('before-data-binding', eventDetail, eventDetail.route);
    return eventDetail.model;
  }

  // Copy properties from one object to another
  function setObjectProperties(object, model) {
    for (var property in model) {
      if (model.hasOwnProperty(property)) {
        object[property] = model[property];
      }
    }
  }

  // Replace the active route's content with the new element
  function activateElement(router, element, url, eventDetail) {
    // when using core-animated-pages, the router doesn't remove the previousRoute's content right away. if you
    // navigate between 3 routes quickly (ex: /a -> /b -> /c) you might set previousRoute to '/b' before '/a' is
    // removed from the DOM. this verifies old content is removed before switching the reference to previousRoute.
    deactivateRoute(router.previousRoute);

    // update references to the activeRoute, previousRoute, and loadingRoute
    router.previousRoute = router.activeRoute;
    router.activeRoute = router.loadingRoute;
    router.loadingRoute = null;
    if (router.previousRoute) {
      router.previousRoute.removeAttribute('active');
    }
    router.activeRoute.setAttribute('active', 'active');

    // remove the old route's content before loading the new route. core-animated-pages temporarily needs the old and
    // new route in the DOM at the same time to animate the transition, otherwise we can remove the old route's content
    // right away. there is one exception for core-animated-pages where the route we're navigating to matches the same
    // route (ex: path="/article/:id" navigating from /article/0 to /article/1). in this case we have to simply replace
    // the route's content instead of animating a transition.
    if (!router.hasAttribute('core-animated-pages') || eventDetail.route === eventDetail.oldRoute) {
      deactivateRoute(router.previousRoute);
    }

    // add the new content
    router.activeRoute.appendChild(element);

    // animate the transition if core-animated-pages are being used
    if (router.hasAttribute('core-animated-pages')) {
      router.coreAnimatedPages.selected = router.activeRoute.getAttribute('path');
      // the 'core-animated-pages-transition-end' event handler in init() will call deactivateRoute() on the previousRoute
    }

    // scroll to the URL hash if it's present
    if (url.hash && !router.hasAttribute('core-animated-pages')) {
      scrollToHash(url.hash);
    }

    fire('activate-route-end', eventDetail, router);
    fire('activate-route-end', eventDetail, eventDetail.route);
  }

  // Remove the route's content
  function deactivateRoute(route) {
    if (route) {
      // remove the route content
      var node = route.firstChild;

      // don't remove an inline <template>
      if (route.isInlineTemplate) {
        node = route.querySelector('template').nextSibling;
      }

      while (node) {
        var nodeToRemove = node;
        node = node.nextSibling;
        route.removeChild(nodeToRemove);
      }
    }
  }

  // scroll to the element with id="hash" or name="hash"
  function scrollToHash(hash) {
    if (!hash) return;

    // wait for the browser's scrolling to finish before we scroll to the hash
    // ex: http://example.com/#/page1#middle
    // the browser will scroll to an element with id or name `/page1#middle` when the page finishes loading. if it doesn't exist
    // it will scroll to the top of the page. let the browser finish the current event loop and scroll to the top of the page
    // before we scroll to the element with id or name `middle`.
    setTimeout(function() {
      var hashElement = document.querySelector('html /deep/ ' + hash) || document.querySelector('html /deep/ [name="' + hash.substring(1) + '"]');
      if (hashElement && hashElement.scrollIntoView) {
        hashElement.scrollIntoView(true);
      }
    }, 0);
  }

  // parseUrl(location, mode) - Augment the native URL() constructor to get info about hash paths
  //
  // Example parseUrl('http://domain.com/other/path?queryParam3=false#/example/path?queryParam1=true&queryParam2=example%20string#middle', 'auto')
  //
  // returns {
  //   path: '/example/path',
  //   hash: '#middle'
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

      if (url.isHashPath) {
        url.hash = '';

        // hash paths might have an additional hash in the hash path for scrolling to a specific part of the page #/hash/path#elementId
        var secondHashIndex = url.path.indexOf('#');
        if (secondHashIndex !== -1) {
          url.hash = url.path.substring(secondHashIndex);
          url.path = url.path.substring(0, secondHashIndex);
        }

        // hash paths get the search from the hash if it exists
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
  // Example routePath: '/user/:userId/**'
  // Example urlPath = '/user/123/bio'
  utilities.testRoute = function(routePath, urlPath, trailingSlashOption, isRegExp) {
    // try to fail or succeed as quickly as possible for the most common cases

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

    // relative routes a/b/c are the same as routes that start with a globstar /**/a/b/c
    if (routePath.charAt(0) !== '/') {
      routePath = '/**/' + routePath;
    }

    // recursively test if the segments match (start at 1 because 0 is always an empty string)
    return segmentsMatch(routePath.split('/'), 1, urlPath.split('/'), 1)
  };

  // segmentsMatch(routeSegments, routeIndex, urlSegments, urlIndex, pathVariables)
  // recursively test the route segments against the url segments in place (without creating copies of the arrays
  // for each recursive call)
  //
  // example routeSegments ['', 'user', ':userId', '**']
  // example urlSegments ['', 'user', '123', 'bio']
  function segmentsMatch(routeSegments, routeIndex, urlSegments, urlIndex, pathVariables) {
    var routeSegment = routeSegments[routeIndex];
    var urlSegment = urlSegments[urlIndex];

    // if we're at the last route segment and it is a globstar, it will match the rest of the url
    if (routeSegment === '**' && routeIndex === routeSegments.length - 1) {
      return true;
    }

    // we hit the end of the route segments or the url segments
    if (typeof routeSegment === 'undefined' || typeof urlSegment === 'undefined') {
      // return true if we hit the end of both at the same time meaning everything else matched, else return false
      return routeSegment === urlSegment;
    }

    // if the current segments match, recursively test the remaining segments
    if (routeSegment === urlSegment || routeSegment === '*' || routeSegment.charAt(0) === ':') {
      // store the path variable if we have a pathVariables object
      if (routeSegment.charAt(0) === ':' && typeof pathVariables !== 'undefined') {
        pathVariables[routeSegment.substring(1)] = urlSegments[urlIndex];
      }
      return segmentsMatch(routeSegments, routeIndex + 1, urlSegments, urlIndex + 1, pathVariables);
    }

    // globstars can match zero to many URL segments
    if (routeSegment === '**') {
      // test if the remaining route segments match any combination of the remaining url segments
      for (var i = urlIndex; i < urlSegments.length; i++) {
        if (segmentsMatch(routeSegments, routeIndex + 1, urlSegments, i, pathVariables)) {
          return true;
        }
      }
    }

    // all tests failed, the route segments do not match the url segments
    return false;
  }

  // routeArguments(routePath, urlPath, search, isRegExp) - Gets the path variables and query parameter values from the URL
  utilities.routeArguments = function(routePath, urlPath, search, isRegExp, typecast) {
    var args = {};

    // regular expressions can't have path variables
    if (!isRegExp) {
      // relative routes a/b/c are the same as routes that start with a globstar /**/a/b/c
      if (routePath.charAt(0) !== '/') {
        routePath = '/**/' + routePath;
      }

      // get path variables
      // urlPath '/customer/123'
      // routePath '/customer/:id'
      // parses id = '123'
      segmentsMatch(routePath.split('/'), 1, urlPath.split('/'), 1, args);
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

    if (typecast) {
      // parse the arguments into unescaped strings, numbers, or booleans
      for (var arg in args) {
        args[arg] = utilities.typecast(args[arg]);
      }
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
