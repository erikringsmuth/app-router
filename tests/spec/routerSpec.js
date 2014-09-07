describe('router.parseUrlPath(url, pathType)', function() {
  var router = document.createElement('app-router');

  it('should return the path on a url without a hash or search', function() {
    expect(router.parseUrlPath('http://domain.com/example/path', null)).toEqual('/example/path');
  });

  it('should return the path on a url with a search', function() {
    expect(router.parseUrlPath('http://domain.com/example/path?queryParam=true', null)).toEqual('/example/path');
  });

  it('should return the path on a url with a hash', function() {
    expect(router.parseUrlPath('http://domain.com/example/path#hash', null)).toEqual('/example/path');
  });

  it('should return the hash path if it exists', function() {
    expect(router.parseUrlPath('http://domain.com/#/example/path', null)).toEqual('/example/path');
  });

  it('should correctly ignore the query parameters when a hash path exists', function() {
    expect(router.parseUrlPath('http://domain.com/#/example/path?queryParam=true', null)).toEqual('/example/path');
  });

  it('should return the hashbang path if it exists', function() {
    expect(router.parseUrlPath('http://domain.com/#!/example/path?queryParam=true', null)).toEqual('/example/path');
  });

  it('should correctly ignore the query parameters when a hashbang path exists', function() {
    expect(router.parseUrlPath('http://domain.com/#!/example/path?queryParam=true', null)).toEqual('/example/path');
  });

  it('should correctly ignore the hash and return the path if it\'s not a hash path', function() {
    expect(router.parseUrlPath('http://domain.com/example/path?queryParam2=false#notHashPath', null)).toEqual('/example/path');
  });

  it('should return the hash path when there is both a path and a hash path', function() {
    expect(router.parseUrlPath('http://domain.com/other/path?queryParam2=false#/example/path?queryParam1=true', null)).toEqual('/example/path');
  });

  it('should return the hashbang path when there is both a path and a hashbang path', function() {
    expect(router.parseUrlPath('http://domain.com/other/path?queryParam2=false#!/example/path?queryParam1=true', null)).toEqual('/example/path');
  });

  it('should use the real path when `pathType` is `regular`', function() {
    expect(router.parseUrlPath('http://domain.com/#/hash/path', 'regular')).toEqual('/');
    expect(router.parseUrlPath('http://domain.com/regular/path#/hash/path', 'regular')).toEqual('/regular/path');
  });

  it('should use the hash as the path when `pathType` is `hash` even if it doesn\'t start with #/ or #!/', function() {
    expect(router.parseUrlPath('http://domain.com/regular/path#hash/path', 'hash')).toEqual('hash/path');
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

describe('router.routeArguments(routePath, urlPath, url, isRegExp, pathType)', function() {
  var router = document.createElement('app-router');

  it('should parse string query parameters', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/example/path?queryParam=example%20string', false, null);
    expect(args.queryParam).toEqual('example string');
  });

  it('should parse boolean query parameters', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/example/path?queryParam=true', false, null);
    expect(args.queryParam).toEqual(true);
  });

  it('should parse number query parameters', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/example/path?queryParam=12.34', false, null);
    expect(args.queryParam).toEqual(12.34);
  });

  it('should get the query parameter from the hash path if it exists', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/other/path?queryParam=wrong#!/example/path?queryParam=correct', false, null);
    expect(args.queryParam).toEqual('correct');
  });

  it('should correctly get a query param with an equals sign in the value', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/other/path?queryParam=wrong#!/example/path?queryParam=some=text', false, null);
    expect(args.queryParam).toEqual('some=text');
  });

  it('should get the query param if it\'s followed by a hash', function() {
    var args = router.routeArguments('*', '/example/path', 'http://domain.com/other/path?queryParam=true#hash', false, null);
    expect(args.queryParam).toEqual(true);
  });

  it('should parse string path parameters', function() {
    var args = router.routeArguments('/person/:name', '/person/jon', 'http://domain.com/person/jon?queryParam=true', false, null);
    expect(args.name).toEqual('jon');
  });

  it('should parse number path parameters', function() {
    var args = router.routeArguments('/customer/:id', '/customer/123', 'http://domain.com/customer/123?queryParam=true', false, null);
    expect(args.id).toEqual(123);
  });

  it('should parse complicated URLs', function() {
    var args = router.routeArguments('/customer/:id', '/customer/456', 'http://domain.com/customer/123?queryParam=false#!/customer/456?queryParam=true&queryParam2=some%20string', false, null);
    expect(args.id).toEqual(456);
    expect(args.queryParam).toEqual(true);
    expect(args.queryParam2).toEqual('some string');
  });

  it('should not add an empty string value when the search is empty', function() {
    var args = router.routeArguments('*', '', 'http://domain.com/', false, null);
    expect(args.hasOwnProperty('')).toBeFalsy();
  });

  it('should still parse query parameters on regex paths', function() {
    var args = router.routeArguments('/^\\/\\w+\\/\\d+$/i', '/example/123', 'http://domain.com/word/123?queryParam=correct', false, null);
    expect(args.queryParam).toEqual('correct');
  });

  it('should parse the regular path when `pathType is `regular` even if there\'s a hash path', function() {
    var args = router.routeArguments('/customer/:id', '/customer/123', 'http://domain.com/customer/123#/customer/456', false, 'regular');
    expect(args.id).toEqual(123);
  });

  it('should parse the hash when `pathType is `hash` even if the hash doesn\'t start with #/ or #!/', function() {
    var args = router.routeArguments('customer/:id', 'customer/456', 'http://domain.com/customer/123#customer/456', false, 'hash');
    expect(args.id).toEqual(456);
  });
});
