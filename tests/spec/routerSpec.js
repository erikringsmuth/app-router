describe('router.urlPath(url)', function() {
  var router = document.createElement('app-router');

  it('should return the path on a url without a hash or search', function() {
    expect(router.urlPath('http://domain.com/example/path')).toEqual('/example/path');
  });

  it('should return the path on a url with a search', function() {
    expect(router.urlPath('http://domain.com/example/path?queryParam=true')).toEqual('/example/path');
  });

  it('should return the path on a url with a hash', function() {
    expect(router.urlPath('http://domain.com/example/path#hash')).toEqual('/example/path');
  });

  it('should return the hash path if it exists', function() {
    expect(router.urlPath('http://domain.com/#/example/path')).toEqual('/example/path');
  });

  it('should correctly ignore the query parameters when a hash path exists', function() {
    expect(router.urlPath('http://domain.com/#/example/path?queryParam=true')).toEqual('/example/path');
  });

  it('should return the hashbang path if it exists', function() {
    expect(router.urlPath('http://domain.com/#!/example/path?queryParam=true')).toEqual('/example/path');
  });

  it('should correctly ignore the query parameters when a hashbang path exists', function() {
    expect(router.urlPath('http://domain.com/#!/example/path?queryParam=true')).toEqual('/example/path');
  });

  it('should correctly ignore the hash and return the path if it\'s not a hash path', function() {
    expect(router.urlPath('http://domain.com/example/path?queryParam2=false#notHashPath')).toEqual('/example/path');
  });

  it('should return the hash path when there is both a path and a hash path', function() {
    expect(router.urlPath('http://domain.com/other/path?queryParam2=false#/example/path?queryParam1=true')).toEqual('/example/path');
  });

  it('should return the hashbang path when there is both a path and a hashbang path', function() {
    expect(router.urlPath('http://domain.com/other/path?queryParam2=false#!/example/path?queryParam1=true')).toEqual('/example/path');
  });

  it('should ignore an additional hash after a hashpath', function() {
    expect(router.urlPath('http://domain.com/other/path?queryParam2=false#!/example/path?queryParam1=true#secondHash')).toEqual('/example/path');
  });
});

describe('router.testRoute(routePath, urlPath)', function() {
  var router = document.createElement('app-router');

  it('should return true on an exact match', function() {
    expect(router.testRoute('/example/path', '/example/path')).toEqual(true);
  });

  it('should return true when matching with a wildcard', function() {
    expect(router.testRoute('/example/*', '/example/path')).toEqual(true);
  });

  it('should return true when matching with a path argument', function() {
    expect(router.testRoute('/:patharg/path', '/example/path')).toEqual(true);
  });

  it('should return true when matching on a combination of wildcards and path arguments', function() {
    expect(router.testRoute('/*/:patharg', '/example/path')).toEqual(true);
  });

  it('should always return true when matching on "*"', function() {
    expect(router.testRoute('*', '/example/path')).toEqual(true);
  });

  it('should not match when one path has a trailing \'/\' but the other doesn\'t', function() {
    expect(router.testRoute('/example/route/', '/example/route')).toEqual(false);
  });

  it('should return false if the route path does not have the same number of path segments as the URL path', function() {
    expect(router.testRoute('/example/route/longer', '/example/path')).toEqual(false);
  });

  it('should ignore trailing slashes if app-router has attribute `trailingSlash="ignore"`', function() {
    var router = document.createElement('app-router');
    router.setAttribute('trailingSlash', 'ignore');
    expect(router.testRoute('/example/path', '/example/path/')).toEqual(true);
    expect(router.testRoute('/example/path/', '/example/path')).toEqual(true);
  });

  it('should enforce trailing slashes if app-router has attribute `trailingSlash="strict"` (the default)', function() {
    var router = document.createElement('app-router');
    router.setAttribute('trailingSlash', 'strict');
    expect(router.testRoute('/example/path', '/example/path/')).toEqual(false);
    expect(router.testRoute('/example/path/', '/example/path')).toEqual(false);
  });
});

describe('router.routeArguments(routePath, urlPath, url)', function() {
  var router = document.createElement('app-router');

  it('should parse string query parameters', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/example/path?queryParam=example%20string');
    expect(args.queryParam).toEqual('example string');
  });

  it('should parse boolean query parameters', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/example/path?queryParam=true');
    expect(args.queryParam).toEqual(true);
  });

  it('should parse number query parameters', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/example/path?queryParam=12.34');
    expect(args.queryParam).toEqual(12.34);
  });

  it('should get the query parameter from the hash path if it exists', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/other/path?queryParam=wrong#!/example/path?queryParam=correct');
    expect(args.queryParam).toEqual('correct');
  });

  it('should correctly get a query param with an equals sign in the value', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/other/path?queryParam=wrong#!/example/path?queryParam=some=text');
    expect(args.queryParam).toEqual('some=text');
  });

  it('should get the query param if it\'s followed by a hash', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/other/path?queryParam=true#hash');
    expect(args.queryParam).toEqual(true);
  });

  it('should parse string path parameters', function() {
    var args = router.routeArguments('/person/:name', '/person/jon', 'http://domain.com/person/jon?queryParam=true');
    expect(args.name).toEqual('jon');
  });

  it('should parse number path parameters', function() {
    var args = router.routeArguments('/customer/:id', '/customer/123', 'http://domain.com/customer/123?queryParam=true');
    expect(args.id).toEqual(123);
  });

  it('should parse complicated URLs', function() {
    var args = router.routeArguments('/customer/:id', '/customer/456', 'http://domain.com/customer/123?queryParam=false#!/customer/456?queryParam=true&queryParam2=some%20string');
    expect(args.id).toEqual(456);
    expect(args.queryParam).toEqual(true);
    expect(args.queryParam2).toEqual('some string');
  });

  it('should not add an empty string value when the search is empty', function() {
    var args = router.routeArguments('*', '', 'http://domain.com/');
    expect(args.hasOwnProperty('')).toBeFalsy();
  });
});
