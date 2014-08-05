describe('router.activateRoute(route, urlPath)', function() {
  var router = document.createElement('app-router');

  it('should remove the `active` attribute from the old active route', function() {
    // arrange
    var oldRoute = document.createElement('app-route');
    oldRoute.setAttribute('active', 'active');
    router.activeRoute = oldRoute;
    var newRoute = document.createElement('app-route');

    // act
    router.activateRoute(newRoute, '/');

    // assert
    expect(oldRoute.hasAttribute('active')).toEqual(false);
  });

  it('should mark the new route as active', function() {
    // arrange
    router.activeRoute = document.createElement('app-route');
    var route = document.createElement('app-route');

    // act
    router.activateRoute(route, '/');

    // assert
    expect(route.getAttribute('active')).toEqual('active');
  });

  it('should import and activate a custom element when the app-route has an `import` attribute and no `template` attribute', function() {
    // arrange
    router.activeRoute = document.createElement('app-route');
    var route = document.createElement('app-route');
    route.setAttribute('path', '/order/:id');
    route.setAttribute('import', 'page/order-page.html');
    spyOn(router, 'importAndActivateCustomElement');
    var eventDetail = {
      path: '/order/123',
      route: route,
      oldRoute: router.activeRoute
    };

    // act
    router.activateRoute(route, '/order/123');

    // assert
    expect(router.importAndActivateCustomElement).toHaveBeenCalledWith('page/order-page.html', null, '/order/:id', '/order/123', false, eventDetail);
  });

  it('should active a pre-registered custom element when the app-route has an `element` attribute and no `import` or `template` attributes', function() {
    // arrange
    router.activeRoute = document.createElement('app-route');
    var route = document.createElement('app-route');
    route.setAttribute('path', '/order/:id');
    route.setAttribute('element', 'order-page');
    spyOn(router, 'activateCustomElement');
    var eventDetail = {
      path: '/order/123',
      route: route,
      oldRoute: router.activeRoute
    };

    // act
    router.activateRoute(route, '/order/123');

    // assert
    expect(router.activateCustomElement).toHaveBeenCalledWith('order-page', '/order/:id', '/order/123', false, eventDetail);
  });

  it('should import and activate a template when the app-route has a `template` and `import` attribute', function() {
    // arrange
    router.activeRoute = document.createElement('app-route');
    var route = document.createElement('app-route');
    route.setAttribute('path', '/order/*');
    route.setAttribute('import', 'page/order-page.html');
    route.setAttribute('template', 'template');
    spyOn(router, 'importAndActivateTemplate');
    var eventDetail = {
      path: '/order/123',
      route: route,
      oldRoute: router.activeRoute
    };

    // act
    router.activateRoute(route, '/order/123');

    // assert
    expect(router.importAndActivateTemplate).toHaveBeenCalledWith('page/order-page.html', route, eventDetail);
  });

  it('should activate an in-line template when the app-route has a `template` attribute but no `import` attribute', function() {
    // arrange
    router.activeRoute = document.createElement('app-route');
    var route = document.createElement('app-route');
    route.setAttribute('path', '/order/*');
    route.setAttribute('template', 'template');
    spyOn(router, 'activateTemplate');
    var eventDetail = {
      path: '/order/123',
      route: route,
      oldRoute: router.activeRoute
    };

    // act
    router.activateRoute(route, '/order/123');

    // assert
    expect(router.activateTemplate).toHaveBeenCalledWith(route, eventDetail);
  });
});

describe('router.parseUrlPath(url)', function() {
  var router = document.createElement('app-router');

  it('should return the path on a url without a hash or search', function() {
    expect(router.parseUrlPath('http://domain.com/example/path')).toEqual('/example/path');
  });

  it('should return the path on a url with a search', function() {
    expect(router.parseUrlPath('http://domain.com/example/path?queryParam=true')).toEqual('/example/path');
  });

  it('should return the path on a url with a hash', function() {
    expect(router.parseUrlPath('http://domain.com/example/path#hash')).toEqual('/example/path');
  });

  it('should return the hash path if it exists', function() {
    expect(router.parseUrlPath('http://domain.com/#/example/path')).toEqual('/example/path');
  });

  it('should correctly ignore the query parameters when a hash path exists', function() {
    expect(router.parseUrlPath('http://domain.com/#/example/path?queryParam=true')).toEqual('/example/path');
  });

  it('should return the hashbang path if it exists', function() {
    expect(router.parseUrlPath('http://domain.com/#!/example/path?queryParam=true')).toEqual('/example/path');
  });

  it('should correctly ignore the query parameters when a hashbang path exists', function() {
    expect(router.parseUrlPath('http://domain.com/#!/example/path?queryParam=true')).toEqual('/example/path');
  });

  it('should correctly ignore the hash and return the path if it\'s not a hash path', function() {
    expect(router.parseUrlPath('http://domain.com/example/path?queryParam2=false#notHashPath')).toEqual('/example/path');
  });

  it('should return the hash path when there is both a path and a hash path', function() {
    expect(router.parseUrlPath('http://domain.com/other/path?queryParam2=false#/example/path?queryParam1=true')).toEqual('/example/path');
  });

  it('should return the hashbang path when there is both a path and a hashbang path', function() {
    expect(router.parseUrlPath('http://domain.com/other/path?queryParam2=false#!/example/path?queryParam1=true')).toEqual('/example/path');
  });

  it('should ignore an additional hash after a hashpath', function() {
    expect(router.parseUrlPath('http://domain.com/other/path?queryParam2=false#!/example/path?queryParam1=true#secondHash')).toEqual('/example/path');
  });
});

describe('router.testRoute(routePath, urlPath, trailingSlashOption, isRegExp)', function() {
  var router = document.createElement('app-router');

  it('should return true on an exact match', function() {
    expect(router.testRoute('/example/path', '/example/path', 'strict', false)).toEqual(true);
  });

  it('should return true on an exact match of the root path', function() {
    expect(router.testRoute('/', '/', 'strict', false)).toEqual(true);
  });

  it('should return true when matching with a wildcard', function() {
    expect(router.testRoute('/example/*', '/example/path', 'strict', false)).toEqual(true);
  });

  it('should return true when matching with a path argument', function() {
    expect(router.testRoute('/:patharg/path', '/example/path', 'strict', false)).toEqual(true);
  });

  it('should return true when matching on a combination of wildcards and path arguments', function() {
    expect(router.testRoute('/*/:patharg', '/example/path', 'strict', false)).toEqual(true);
  });

  it('should always return true when matching on "*"', function() {
    expect(router.testRoute('*', '/example/path', 'strict', false)).toEqual(true);
  });

  it('should not match when one path has a trailing \'/\' but the other doesn\'t', function() {
    expect(router.testRoute('/example/route/', '/example/route', 'strict', false)).toEqual(false);
  });

  it('should return false if the route path does not have the same number of path segments as the URL path', function() {
    expect(router.testRoute('/example/route/longer', '/example/path', 'strict', false)).toEqual(false);
  });

  it('should ignore trailing slashes if `trailingSlash` is "ignore"', function() {
    expect(router.testRoute('/example/path', '/example/path/', 'ignore', false)).toEqual(true);
    expect(router.testRoute('/example/path/', '/example/path', 'ignore', false)).toEqual(true);
  });

  it('should enforce trailing slashes if `trailingSlash` is "strict" (the default)', function() {
    expect(router.testRoute('/example/path', '/example/path/', 'strict', false)).toEqual(false);
    expect(router.testRoute('/example/path/', '/example/path', 'strict', false)).toEqual(false);
  });

  it('should match when the route path is a matching regular expression', function() {
    expect(router.testRoute('/^\\/\\w+\\/\\d+$/', '/word/123', 'strict', true)).toEqual(true);
  });

  it('should match when the route path is a matching regular expression with the \'i\' option', function() {
    expect(router.testRoute('/^\\/\\w+\\/\\d+$/i', '/word/123', 'strict', true)).toEqual(true);
  });

  it('should not match when the route path is a matching regular expression', function() {
    expect(router.testRoute('/^\\/\\w+\\/\\d+$/i', '/word/non-number', 'strict', true)).toEqual(false);
  });

  it('should not match when the route path regular expression does not start with a slash', function() {
    expect(router.testRoute('^\\/\\w+\\/\\d+$/i', '/word/123', 'strict', true)).toEqual(false);
  });

  it('should not match when the route path regular expression does not end with a slash followed by zero or more options', function() {
    expect(router.testRoute('/^\\/\\w+\\/\\d+$', '/word/123', 'strict', true)).toEqual(false);
  });
});

describe('router.routeArguments(routePath, urlPath, url, isRegExp)', function() {
  var router = document.createElement('app-router');

  it('should parse string query parameters', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/example/path?queryParam=example%20string', false);
    expect(args.queryParam).toEqual('example string');
  });

  it('should parse boolean query parameters', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/example/path?queryParam=true', false);
    expect(args.queryParam).toEqual(true);
  });

  it('should parse number query parameters', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/example/path?queryParam=12.34', false);
    expect(args.queryParam).toEqual(12.34);
  });

  it('should get the query parameter from the hash path if it exists', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/other/path?queryParam=wrong#!/example/path?queryParam=correct', false);
    expect(args.queryParam).toEqual('correct');
  });

  it('should correctly get a query param with an equals sign in the value', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/other/path?queryParam=wrong#!/example/path?queryParam=some=text', false);
    expect(args.queryParam).toEqual('some=text');
  });

  it('should get the query param if it\'s followed by a hash', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/other/path?queryParam=true#hash', false);
    expect(args.queryParam).toEqual(true);
  });

  it('should parse string path parameters', function() {
    var args = router.routeArguments('/person/:name', '/person/jon', 'http://domain.com/person/jon?queryParam=true', false);
    expect(args.name).toEqual('jon');
  });

  it('should parse number path parameters', function() {
    var args = router.routeArguments('/customer/:id', '/customer/123', 'http://domain.com/customer/123?queryParam=true', false);
    expect(args.id).toEqual(123);
  });

  it('should parse complicated URLs', function() {
    var args = router.routeArguments('/customer/:id', '/customer/456', 'http://domain.com/customer/123?queryParam=false#!/customer/456?queryParam=true&queryParam2=some%20string', false);
    expect(args.id).toEqual(456);
    expect(args.queryParam).toEqual(true);
    expect(args.queryParam2).toEqual('some string');
  });

  it('should not add an empty string value when the search is empty', function() {
    var args = router.routeArguments('*', '', 'http://domain.com/', false);
    expect(args.hasOwnProperty('')).toBeFalsy();
  });

  it('should still parse query parameters on regex paths', function() {
    var args = router.routeArguments('/^\\/\\w+\\/\\d+$/i', '/example/123', 'http://domain.com/word/123?queryParam=correct', false);
    expect(args.queryParam).toEqual('correct');
  });
});
