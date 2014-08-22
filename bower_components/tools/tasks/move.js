/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

var fs = require('fs');
module.exports = function(grunt) {
  grunt.registerTask('move', 'move a file', function(src, dest) {
    grunt.log.write('moving %s to %s', src, dest);
    fs.renameSync(src, dest);
  });
};
