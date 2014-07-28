'use strict';
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var inline = require('gulp-inline');

var files = ['src/*.*', 'tests/spec/*.js'];

gulp.task('lint', function() {
  gulp.src(files)
    .pipe(jshint.extract('always'))
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('build', function() {
  return gulp.src('src/app-router.js')
    .pipe(uglify())
    .pipe(gulp.dest('.'));
});

gulp.task('minify', function() {
  return gulp.src('src/app-router.html')
    .pipe(inline({
      base: 'src',
      js: uglify()
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('watch', function() {
  gulp.run('lint', 'build', 'minify');
  gulp.watch(files, function() {
    gulp.run('lint', 'build', 'minify');
  });
});

gulp.task('default', function() {
  gulp.run('lint', 'build', 'minify');
});

// CI build
gulp.task('ci', function(){
  gulp.run('lint');
});
