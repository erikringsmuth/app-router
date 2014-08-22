module.exports = function(grunt) {
  grunt.registerTask('sourcemap_copy', 'Copy sourcesContent between sourcemaps', function(source, dest) {
    var sourceMap = grunt.file.readJSON(source);
    var destMap = grunt.file.readJSON(dest);
    destMap.sourcesContent = [];
    var ssources = sourceMap.sources;
    // uglify may reorder sources, make sure sourcesContent matches new order
    destMap.sources.forEach(function(source) {
      var j = ssources.indexOf(source);
      destMap.sourcesContent.push(sourceMap.sourcesContent[j]);
    });
    grunt.file.write(dest, JSON.stringify(destMap));
  });
};
