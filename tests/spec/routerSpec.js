describe('router.urlPath(url)', function() {
  var router = document.createElement('app-router');
  
  it('should return the path on a url without a hash or search', function() {
    var url = 'http://domain.com/example/path';
    var result = router.urlPath(url);
    expect(result).toEqual('/example/path');
  });

  it('should return the path on a url with a search', function() {
    var url = 'http://domain.com/example/path?queryParam=true';
    var result = router.urlPath(url);
    expect(result).toEqual('/example/path');
  });

  it('should return the path on a url with a hash', function() {
    var url = 'http://domain.com/example/path#hash';
    var result = router.urlPath(url);
    expect(result).toEqual('/example/path');
  });

  it('should return the hash path if it exists', function() {
    var url = 'http://domain.com/#/example/path';
    var result = router.urlPath(url);
    expect(result).toEqual('/example/path');
  });

  it('should correctly ignore the query parameters when a hash path exists', function() {
    var url = 'http://domain.com/#/example/path?queryParam=true';
    var result = router.urlPath(url);
    expect(result).toEqual('/example/path');
  });

  it('should return the hashbang path if it exists', function() {
    var url = 'http://domain.com/#!/example/path?queryParam=true';
    var result = router.urlPath(url);
    expect(result).toEqual('/example/path');
  });

  it('should correctly ignore the query parameters when a hashbang path exists', function() {
    var url = 'http://domain.com/#!/example/path?queryParam=true';
    var result = router.urlPath(url);
    expect(result).toEqual('/example/path');
  });

  it('should correctly ignore the hash and return the path if it\'s not a hash path', function() {
    var url = 'http://domain.com/example/path?queryParam2=false#notHashPath';
    var result = router.urlPath(url);
    expect(result).toEqual('/example/path');
  });

  it('should return the hash path when there is both a path and a hash path', function() {
    var url = 'http://domain.com/other/path?queryParam2=false#/example/path?queryParam1=true';
    var result = router.urlPath(url);
    expect(result).toEqual('/example/path');
  });

  it('should return the hashbang path when there is both a path and a hashbang path', function() {
    var url = 'http://domain.com/other/path?queryParam2=false#!/example/path?queryParam1=true';
    var result = router.urlPath(url);
    expect(result).toEqual('/example/path');
  });

  it('should ignore an additional hash after a hashpath', function() {
    var url = 'http://domain.com/other/path?queryParam2=false#!/example/path?queryParam1=true#secondHash';
    var result = router.urlPath(url);
    expect(result).toEqual('/example/path');
  });
});

describe('router.testRoute(routePath, [url])', function() {
  var router = document.createElement('app-router');
  
  it('should return true on an exact match', function() {
    spyOn(router, 'urlPath').and.returnValue('/example/path');
    var result = router.testRoute('/example/path');
    expect(result).toEqual(true);
  });
  
  it('should return true when matching with a wildcard', function() {
    spyOn(router, 'urlPath').and.returnValue('/example/path');
    var result = router.testRoute('/example/*');
    expect(result).toEqual(true);
  });
  
  it('should return true when matching with a path argument', function() {
    spyOn(router, 'urlPath').and.returnValue('/example/path');
    var result = router.testRoute('/:patharg/path');
    expect(result).toEqual(true);
  });
  
  it('should return true when matching on a combination of wildcards and path arguments', function() {
    spyOn(router, 'urlPath').and.returnValue('/example/path');
    var result = router.testRoute('/*/:patharg');
    expect(result).toEqual(true);
  });
  
  it('should always return true when matching on "*"', function() {
    spyOn(router, 'urlPath').and.returnValue('/example/path');
    var result = router.testRoute('*');
    expect(result).toEqual(true);
  });
  
  it('should not match when one path has a trailing \'/\' but the other doesn\'t', function() {
    spyOn(router, 'urlPath').and.returnValue('/example/path');
    var result = router.testRoute('/example/route/');
    expect(result).toEqual(false);
  });
  
  it('should return false if the route path does not have the same number of path segments as the URL path', function() {
    spyOn(router, 'urlPath').and.returnValue('/example/path');
    var result = router.testRoute('/example/route/longer');
    expect(result).toEqual(false);
  });
  
  it('should ignore the real path and use the hash path if it exists', function() {
    spyOn(router, 'urlPath').and.returnValue('/example/path');
    var result = router.testRoute('/other/route');
    expect(result).toEqual(false);
  });
});

describe('router.routeArguments(routePath, url)', function() {
  var router = document.createElement('app-router');
  
  it('should parse string query parameters', function() {
    var url = 'http://domain.com/example/path?queryParam=example%20string';
    var result = router.routeArguments('/example/path', url);
    expect(result.queryParam).toEqual('example string');
  });

  it('should parse boolean query parameters', function() {
    var url = 'http://domain.com/example/path?queryParam=true';
    var result = router.routeArguments('/example/path', url);
    expect(result.queryParam).toEqual(true);
  });

  it('should parse number query parameters', function() {
    var url = 'http://domain.com/example/path?queryParam=12.34';
    var result = router.routeArguments('/example/path', url);
    expect(result.queryParam).toEqual(12.34);
  });

  it('should get the query parameter from the hash path if it exists', function() {
    var url = 'http://domain.com/other/path?queryParam=wrong#!/example/path?queryParam=correct';
    var result = router.routeArguments('/example/path', url);
    expect(result.queryParam).toEqual('correct');
  });

  it('should correctly get a query param with an equals sign in the value', function() {
    var url = 'http://domain.com/other/path?queryParam=wrong#!/example/path?queryParam=some=text';
    var result = router.routeArguments('/example/path', url);
    expect(result.queryParam).toEqual('some=text');
  });

  it('should get the query param if it\'s followed by a hash', function() {
    var url = 'http://domain.com/other/path?queryParam=true#hash';
    var result = router.routeArguments('/example/path', url);
    expect(result.queryParam).toEqual(true);
  });

  it('should parse string path parameters', function() {
    var url = 'http://domain.com/person/jon?queryParam=true';
    var result = router.routeArguments('/person/:name', url);
    expect(result.name).toEqual('jon');
  });

  it('should parse number path parameters', function() {
    var url = 'http://domain.com/customer/123?queryParam=true';
    var result = router.routeArguments('/customer/:id', url);
    expect(result.id).toEqual(123);
  });

  it('should parse complicated URLs', function() {
    var url = 'http://domain.com/customer/123?queryParam=false#!/customer/456?queryParam=true&queryParam2=some%20string';
    var result = router.routeArguments('/customer/:id', url);
    expect(result.id).toEqual(456);
    expect(result.queryParam).toEqual(true);
    expect(result.queryParam2).toEqual('some string');
  });

  it('should not add an empty string value when the search is empty', function() {
    var url = 'http://domain.com/';
    var result = router.routeArguments('', url);
    expect(result.hasOwnProperty('')).toBeFalsy();
  });
});