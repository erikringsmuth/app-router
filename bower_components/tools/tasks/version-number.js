/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

module.exports = function(grunt) {
  grunt.registerTask('version', 'Update version number for builds', function() {
    grunt.config.requires('pkg.version');
    var version = grunt.config('pkg.version');
    // spit back pkg.version if "release" is true
    var release = grunt.option('release');
    var done = this.async();

    function getRevision(callback) {
      grunt.util.spawn({
        cmd: 'git',
        args: ['rev-parse', '--short', 'HEAD']
      }, callback);
    }

    if (release) {
      grunt.config('buildversion', version);
      done(null);
    } else {
      getRevision(function(error, ref) {
        if (!error) {
          grunt.config('buildversion', version + '-' + ref);
        }
        done(error);
      });
    }
  });
};
