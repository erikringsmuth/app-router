module.exports = function(karma) {
  var common = require('../../tools/test/karma-common.conf.js');
  karma.set(common.mixin_common_opts(karma, {
    // base path, that will be used to resolve files and exclude
    basePath: '../../',

    // list of files / patterns to load in the browser
    files: [
      'NodeBind/node_modules/chai/chai.js',
      'NodeBind/conf/mocha.conf.js',
      'observe-js/src/observe.js',
      'NodeBind/src/NodeBind.js',
      'NodeBind/tests/*.js',
    ],
  }));
};
