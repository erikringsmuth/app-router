'use strict';
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var vulcanize = require('gulp-vulcanize');

var codeFiles = 'app-router.html';
var testFiles = 'tests/spec/*.js';

gulp.task('lint', function() {
  gulp.src([codeFiles, testFiles])
    .pipe(jshint.extract('always'))
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('minify', function() {
  return gulp.src(codeFiles)
    .pipe(vulcanize({
      dest: 'tmp',
      strip: true
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('.'));
});

// The default task (called when you run `gulp`)
gulp.task('default', function(){
  gulp.run('lint', 'minify');
  gulp.watch(codeFiles, function() {
    gulp.run('lint', 'minify');
  });
  gulp.watch(testFiles, function() {
    gulp.run('lint');
  });
});

// CI build
gulp.task('ci', function(){
  gulp.run('lint');
});
