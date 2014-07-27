module.exports = function(karma) {
  var common = require('../../tools/test/karma-common.conf.js');
  karma.set(common.mixin_common_opts(karma, {
    // base path, that will be used to resolve files and exclude
    basePath: '../../',

    // list of files / patterns to load in the browser
    files: [
      'observe-js/src/observe.js',
      'WeakMap/weakmap.js',
      'tools/test/mocha-htmltest.js',
      'ShadowDOM/conf/mocha.conf.js',
      'ShadowDOM/node_modules/chai/chai.js',
      'ShadowDOM/shadowdom.js',
      'ShadowDOM/test/test.main.js',
      {pattern: 'ShadowDOM/build.json', included: false},
      {pattern: 'ShadowDOM/src/**/*.js', included: false},
      {pattern: 'ShadowDOM/test/**/*.js', included: false},
      {pattern: 'ShadowDOM/test/**/*.html', included: false},
      {pattern: 'tools/**/*.js', included: false}
    ]
  }));
};
