/**
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
module.exports = function(grunt) {
  var readManifest = require('../tools/loader/readManifest.js');

  grunt.initConfig({
    karma: {
      options: {
        configFile: 'conf/karma.conf.js',
        keepalive: true,
      },
      buildbot: {
        reporters: ['crbot'],
        logLevel: 'OFF'
      },
      platform: {
      }
    },
    concat_sourcemap: {
      Platform: {
        options: {
          sourcesContent: true,
          nonull: true
        },
        files: {
          'build/platform.concat.js': readManifest('build.json')
        }
      }
    },
    concat: {
      lite: {
        files: {
          'build/platform-lite.concat.js': readManifest('build-lite.json')
        }
      }
    },
    uglify: {
      options: {
        nonull: true,
        compress: {
          unsafe: false
        },
        beautify: {
          ascii_only: true
        }
      },
      Platform: {
        options: {
          sourceMap: true,
          sourceMapName: 'build/platform.js.map',
          sourceMapIn: 'build/platform.concat.js.map',
          sourceMapIncludeSources: true,
          banner: grunt.file.read('banner.txt') + '// @version: <%= buildversion %>\n'
        },
        files: {
          'build/platform.js': 'build/platform.concat.js'
        }
      }
    },
    audit: {
      platform: {
        options: {
          repos: [
            '../CustomElements',
            '../HTMLImports',
            '../ShadowDOM',
            '../platform-dev'
          ]
        },
        files: {
          'build/build.log': 'build/platform.js'
        }
      }
    },
    pkg: grunt.file.readJSON('package.json')
  });

  grunt.loadTasks('../tools/tasks');
  // plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-concat-sourcemap');
  grunt.loadNpmTasks('grunt-audit');

  grunt.registerTask('stash', 'prepare for testing build', function() {
    grunt.option('force', true);
    grunt.task.run('move:platform.js:platform.js.bak');
    grunt.task.run('move:build/platform.js:platform.js');
  });
  grunt.registerTask('restore', function() {
    grunt.task.run('move:platform.js:build/platform.js');
    grunt.task.run('move:platform.js.bak:platform.js');
    grunt.option('force', false);
  });

  grunt.registerTask('minify', ['concat_sourcemap', 'version', 'uglify:Platform', 'sourcemap_copy:build/platform.concat.js.map:build/platform.js.map']);
  grunt.registerTask('default', ['minify']);
  grunt.registerTask('test', ['override-chrome-launcher', 'karma:platform']);
  grunt.registerTask('test-build', ['minify', 'stash', 'test', 'restore']);
  grunt.registerTask('test-build-cr', ['minify', 'stash', 'karma:buildbot', 'restore']);
  grunt.registerTask('test-buildbot', ['override-chrome-launcher', 'karma:buildbot', 'test-build-cr']);
  grunt.registerTask('build-lite', ['concat:lite']);
  grunt.registerTask('release', function() {
    grunt.option('release', true);
    grunt.task.run('minify');
    grunt.task.run('audit');
  });
};

