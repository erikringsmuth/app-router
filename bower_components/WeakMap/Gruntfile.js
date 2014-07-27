/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
module.exports = function(grunt) {
  grunt.initConfig({
    karma: {
      options: {
        configFile: 'karma.conf.js',
        keepalive: true
      },
      buildbot: {
        reporters: ['crbot'],
        logLevel: 'OFF'
      },
      WeakMap: {
      }
    },
  });

  // plugins
  grunt.loadNpmTasks('grunt-karma');

  // tasks
  grunt.registerTask('test', ['karma:WeakMap']);
  // grunt.registerTask('test-buildbot', ['karma:buildbot']);
  grunt.registerTask('test-buildbot', function() {
    console.log('nop');
  });
};

