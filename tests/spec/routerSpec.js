describe('parseUrl(location, mode)', function() {
  var router = document.createElement('app-router');

  it('should parse a regular path when mode="auto"', function() {
    expect(router.util.parseUrl('http://domain.com/example/path', 'auto')).toEqual({
      path: '/example/path',
      hash: '',
      search: '',
      isHashPath: false
    });
  });

  it('should parse a regular path and search when mode="auto"', function() {
    expect(router.util.parseUrl('http://domain.com/example/path?queryParam=true', 'auto')).toEqual({
      path: '/example/path',
      hash: '',
      search: '?queryParam=true',
      isHashPath: false
    });
  });

  it('should use the regular path on a url with a hash not starting in #/ when mode="auto"', function() {
    expect(router.util.parseUrl('http://domain.com/example/path#hash', 'auto')).toEqual({
      path: '/example/path',
      hash: '#hash',
      search: '',
      isHashPath: false
    });
  });

  it('should parse a hash path when mode="auto"', function() {
    expect(router.util.parseUrl('http://domain.com/#/example/path', 'auto')).toEqual({
      path: '/example/path',
      hash: '',
      search: '',
      isHashPath: true
    });
  });

  it('should parse the search on a hash path', function() {
    expect(router.util.parseUrl('http://domain.com/#/example/path?queryParam=true', 'auto')).toEqual({
      path: '/example/path',
      hash: '',
      search: '?queryParam=true',
      isHashPath: true
    });
  });

  it('should parse a hashbang path when mode="auto"', function() {
    expect(router.util.parseUrl('http://domain.com/#!/example/path?queryParam=true', 'auto')).toEqual({
      path: '/example/path',
      hash: '',
      search: '?queryParam=true',
      isHashPath: true
    });
  });

  it('should use the hash path and hash search when there is both a regular path and a hash path and mode="auto"', function() {
    expect(router.util.parseUrl('http://domain.com/other/path?queryParam2=false#/example/path?queryParam1=true', 'auto')).toEqual({
      path: '/example/path',
      hash: '',
      search: '?queryParam1=true',
      isHashPath: true
    });
  });

  it('should return the hashbang path when there is both a path and a hashbang path', function() {
    expect(router.util.parseUrl('http://domain.com/other/path?queryParam2=false#!/example/path?queryParam1=true', 'auto')).toEqual({
      path: '/example/path',
      hash: '',
      search: '?queryParam1=true',
      isHashPath: true
    });
  });

  it('should use the real path when mode="pushstate"', function() {
    expect(router.util.parseUrl('http://domain.com/#/hash/path', 'pushstate')).toEqual({
      path: '/',
      hash: '#/hash/path',
      search: '',
      isHashPath: false
    });
    expect(router.util.parseUrl('http://domain.com/regular/path#/hash/path', 'pushstate')).toEqual({
      path: '/regular/path',
      hash: '#/hash/path',
      search: '',
      isHashPath: false
    });
  });

  it('should use the hash as the path when mode="hash" even if it doesn\'t start with #/ or #!/', function() {
    expect(router.util.parseUrl('http://domain.com/regular/path#hash/path', 'hash')).toEqual({
      path: 'hash/path',
      hash: '',
      search: '',
      isHashPath: true
    });
  });

  it('should not use the regular path when mode="hash"', function() {
    expect(router.util.parseUrl('http://domain.com/test/', 'hash')).toEqual({
      path: '/',
      hash: '',
      search: '',
      isHashPath: true
    });
    expect(router.util.parseUrl('http://domain.com/test/index.html', 'hash')).toEqual({
      path: '/',
      hash: '',
      search: '',
      isHashPath: true
    });
  });

  it('should parse the hash when mode="pushstate"', function() {
    expect(router.util.parseUrl('http://domain.com/regular/path?queryParam1=true#first', 'pushstate')).toEqual({
      path: '/regular/path',
      hash: '#first',
      search: '?queryParam1=true',
      isHashPath: false
    });
  });

  it('should parse the hash when mode="auto" and the hash does not start with a #/ or #!/', function() {
    expect(router.util.parseUrl('http://domain.com/regular/path?queryParam1=true#first', 'auto')).toEqual({
      path: '/regular/path',
      hash: '#first',
      search: '?queryParam1=true',
      isHashPath: false
    });
  });

  it('should parse the hash when mode="auto" and the hash starts with a #/ or #!/', function() {
    expect(router.util.parseUrl('http://domain.com/#/hash/path#first', 'auto')).toEqual({
      path: '/hash/path',
      hash: '#first',
      search: '',
      isHashPath: true
    });
    expect(router.util.parseUrl('http://domain.com/#/hash/path?queryParam1=true#first', 'auto')).toEqual({
      path: '/hash/path',
      hash: '#first',
      search: '?queryParam1=true',
      isHashPath: true
    });
  });

  it('should parse the hash when mode="hash"', function() {
    expect(router.util.parseUrl('http://domain.com//#/hash/path#first', 'hash')).toEqual({
      path: '/hash/path',
      hash: '#first',
      search: '',
      isHashPath: true
    });
    expect(router.util.parseUrl('http://domain.com//#/hash/path?queryParam1=true#first', 'hash')).toEqual({
      path: '/hash/path',
      hash: '#first',
      search: '?queryParam1=true',
      isHashPath: true
    });
  });
});

describe('testRoute(routePath, urlPath, trailingSlashOption, isRegExp)', function() {
  var router = document.createElement('app-router');

  it('should return true on an exact match', function() {
    expect(router.util.testRoute('/example/path', '/example/path', 'strict', false)).toEqual(true);
  });

  it('should return true on an exact match of the root path', function() {
    expect(router.util.testRoute('/', '/', 'strict', false)).toEqual(true);
  });

  it('should return true when matching with a wildcard', function() {
    expect(router.util.testRoute('/example/*', '/example/path', 'strict', false)).toEqual(true);
  });

  it('should return true when matching with a path argument', function() {
    expect(router.util.testRoute('/:patharg/path', '/example/path', 'strict', false)).toEqual(true);
  });

  it('should return true when matching on a combination of wildcards and path arguments', function() {
    expect(router.util.testRoute('/*/:patharg', '/example/path', 'strict', false)).toEqual(true);
  });

  it('should always return true when matching on "*"', function() {
    expect(router.util.testRoute('*', '/example/path', 'strict', false)).toEqual(true);
  });

  it('should not match when one path has a trailing \'/\' but the other doesn\'t', function() {
    expect(router.util.testRoute('/example/route/', '/example/route', 'strict', false)).toEqual(false);
  });

  it('should return false if the route path does not have the same number of path segments as the URL path', function() {
    expect(router.util.testRoute('/example/route/longer', '/example/path', 'strict', false)).toEqual(false);
  });

  it('should ignore trailing slashes if `trailingSlash` is "ignore"', function() {
    expect(router.util.testRoute('/example/path', '/example/path/', 'ignore', false)).toEqual(true);
    expect(router.util.testRoute('/example/path/', '/example/path', 'ignore', false)).toEqual(true);
  });

  it('should enforce trailing slashes if `trailingSlash` is "strict" (the default)', function() {
    expect(router.util.testRoute('/example/path', '/example/path/', 'strict', false)).toEqual(false);
    expect(router.util.testRoute('/example/path/', '/example/path', 'strict', false)).toEqual(false);
  });

  it('should match when the route path is a matching regular expression', function() {
    expect(router.util.testRoute('/^\\/\\w+\\/\\d+$/', '/word/123', 'strict', true)).toEqual(true);
  });

  it('should not match when the route path is a matching regular expression', function() {
    expect(router.util.testRoute('/^\\/\\w+\\/\\d+$/i', '/word/non-number', 'strict', true)).toEqual(false);
  });

  it('should match globstars **', function() {
    expect(router.util.testRoute('/**/e', '/a/b/c/d/e', 'strict', false)).toEqual(true);
    expect(router.util.testRoute('/a/b/**', '/a/b/c/d/e', 'strict', false)).toEqual(true);
    expect(router.util.testRoute('/*/b/**/e', '/a/b/c/d/e', 'strict', false)).toEqual(true);
    expect(router.util.testRoute('/a/b/**/e', '/a/b/c/d/e', 'strict', false)).toEqual(true);
  });

  it('should match zero segment globstars ** in the middle of the route', function() {
    expect(router.util.testRoute('/a/b/**/c/d/e', '/a/b/c/d/e', 'strict', false)).toEqual(true);
  });

  it('should match zero segment globstars ** at the begining of the route', function() {
    expect(router.util.testRoute('/**/a/b/c/d/e', '/a/b/c/d/e', 'strict', false)).toEqual(true);
  });

  it('should match zero segment globstars ** at the end of the route', function() {
    expect(router.util.testRoute('/a/b/c/d/e/**', '/a/b/c/d/e', 'strict', false)).toEqual(true);
  });

  it('should ignore trailing slash when using globstars ** in the last segment of the route', function() {
    expect(router.util.testRoute('/a/b/**', '/a/b', 'strict', false)).toEqual(true);
    expect(router.util.testRoute('/a/b/**', '/a/b/', 'strict', false)).toEqual(true);
    expect(router.util.testRoute('/a/b/**', '/a/b', 'ignore', false)).toEqual(true);
    expect(router.util.testRoute('/a/b/**', '/a/b/', 'ignore', false)).toEqual(true);
  });

  it('should not match invalid globstars **', function() {
    expect(router.util.testRoute('/a/b/**/c', '/a/b/c/d/e', 'strict', false)).toEqual(false);
    expect(router.util.testRoute('/**/a/b/e', '/a/b/c/d/e', 'strict', false)).toEqual(false);
    expect(router.util.testRoute('/a/b/e/**', '/a/b/c/d/e', 'strict', false)).toEqual(false);
    expect(router.util.testRoute('/a/b/**/c/e/**', '/a/b/c/d/e', 'strict', false)).toEqual(false);
  });

  it('should match relative routes when they match the end of the URL', function() {
    expect(router.util.testRoute('e', '/a/b/c/d/e', 'strict', false)).toEqual(true);
    expect(router.util.testRoute('b/c/d/e', '/a/b/c/d/e', 'strict', false)).toEqual(true);
    expect(router.util.testRoute('a/b/c/d/e', '/a/b/c/d/e', 'strict', false)).toEqual(true);
    expect(router.util.testRoute('a/**/e', '/a/b/c/d/e', 'strict', false)).toEqual(true);
    expect(router.util.testRoute('/b/c/d/e', '/a/b/c/d/e', 'strict', false)).toEqual(false);
    expect(router.util.testRoute('**', '/a/b/c/d/e', 'strict', false)).toEqual(true);
    expect(router.util.testRoute('**/', '/a/b/c/d/e/', 'strict', false)).toEqual(true);
  });
});

describe('routeArguments(routePath, urlPath, search, isRegExp, typecast)', function() {
  var router = document.createElement('app-router');

  it('should parse query parameters', function() {
    var args = router.util.routeArguments('*', '/example/path', '?stringQueryParam=example%20string&numQueryParam=12.34', false, true);
    expect(args).toEqual({
      stringQueryParam: 'example string',
      numQueryParam: 12.34
    });
  });

  it('should correctly get a query parameter with an equals sign in the value', function() {
    var args = router.util.routeArguments('*', '/example/path', '?queryParam=some=text&otherParam=123', false, true);
    expect(args.queryParam).toEqual('some=text');
  });

  it('should parse string path parameters', function() {
    var args = router.util.routeArguments('/person/:name', '/person/jon', '?queryParam=true', false, true);
    expect(args.name).toEqual('jon');
  });

  it('should parse number path parameters', function() {
    var args = router.util.routeArguments('/customer/:id', '/customer/123', '?queryParam=true', false, true);
    expect(args.id).toEqual(123);
  });

  it('should not add an empty string value when the search is empty', function() {
    var args = router.util.routeArguments('*', '/example/path', '', false, true);
    expect(args.hasOwnProperty('')).toBeFalsy();
    expect(args).toEqual({});
  });

  it('should still parse query parameters on regex paths', function() {
    var args = router.util.routeArguments('/^\\/\\w+\\/\\d+$/i', '/example/123', '?queryParam=correct', true, true);
    expect(args.queryParam).toEqual('correct');
  });

  it('should not typecast when typecast="string"', function() {
    var args = router.util.routeArguments('*', '/example/path', '?stringQueryParam=example%20string&numQueryParam=12.34', false, false);
    expect(args).toEqual({
      stringQueryParam: 'example%20string',
      numQueryParam: '12.34'
    });
  });

  it('should parse routes with globstars', function() {
    var args = router.util.routeArguments('/a/**/:d/:e/*', '/a/b/c/d/e/f', '', false, true);
    expect(args).toEqual({
      d: 'd',
      e: 'e'
    });
  });

  it('should parse relative routes', function() {
    var args = router.util.routeArguments('c/:d/:e/*', '/a/b/c/d/e/f', '', false, true);
    expect(args).toEqual({
      d: 'd',
      e: 'e'
    });
  });

  it('should parse relative routes with globstars', function() {
    var args = router.util.routeArguments('b/:c/**/g', '/a/b/c/d/e/f/g', '', false, true);
    expect(args).toEqual({
      c: 'c'
    });
  });

  it('should parse relative routes with globstars lazily (non-greedy, take the smallest amount that matches)', function() {
    var args = router.util.routeArguments('/a/**/:middle/**/f', '/a/b/c/d/e/f', '', false, true);
    expect(args).toEqual({
      middle: 'b'
    });
  });
});

describe('typecast(value)', function() {
  var router = document.createElement('app-router');

  it('should leave unescaped strings alone', function() {
    expect(router.util.typecast('hello world!')).toEqual('hello world!');
  });

  it('should unescape (url decode) strings', function() {
    expect(router.util.typecast('example%20string')).toEqual('example string');
  });

  it('should convert "true" to `true`', function() {
    expect(router.util.typecast('true')).toEqual(true);
  });

  it('should convert "false" to `false`', function() {
    expect(router.util.typecast('false')).toEqual(false);
  });

  it('should convert integers', function() {
    expect(router.util.typecast('123')).toEqual(123);
  });

  it('should convert numbers with decimal points', function() {
    expect(router.util.typecast('123.456')).toEqual(123.456);
  });

  it('should not convert an empty string to zero', function() {
    expect(router.util.typecast('')).toEqual('');
  });

  it('should not convert a number with leading zeros to a number', function() {
    expect(router.util.typecast('00123')).toEqual('00123');
  });
});

describe('testRegExString(pattern, value)', function() {
  var router = document.createElement('app-router');

  it('should match a simple regular expression', function() {
    expect(router.util.testRegExString('/^\\/\\w+\\/\\d+$/', '/word/123')).toEqual(true);
  });

  it('should match a regular expression with the \'i\' option', function() {
    expect(router.util.testRegExString('/^\\/\\w+\\/\\d+$/i', '/Word/123')).toEqual(true);
  });

  it('should not match when the regular expressions shouldn\'t match', function() {
    expect(router.util.testRegExString('/^\\/\\w+\\/\\d+$/i', '/word/non-number')).toEqual(false);
  });

  it('should not match when the regular expression does not start with a slash', function() {
    expect(router.util.testRegExString('^\\/\\w+\\/\\d+$/i', '/word/123')).toEqual(false);
  });

  it('should not match when the regular expression does not end with a slash followed by zero or more options', function() {
    expect(router.util.testRegExString('/^\\/\\w+\\/\\d+$', '/word/123')).toEqual(false);
  });
});
