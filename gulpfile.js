'use strict';
var path = require('path');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var inline = require('gulp-inline');
var karma = require('karma');

var files = ['src/*.js', 'tests/spec/*.js'];

gulp.task('lint', function() {
  return gulp.src(files)
    .pipe(jshint.extract('always'))
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('build', function() {
  return gulp.src('src/app-router.js')
    .pipe(uglify({
      preserveComments: 'some'
    }))
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

gulp.task('test', function(done) {
    new karma.Server({
      configFile:  path.resolve(__dirname, 'tests/karma.conf.js'),
      action: 'run'
    }, done).start();
});

// watch
gulp.task('watch', function() {
  gulp.watch(files, ['lint', 'build', 'minify', 'test'])
    .on('change', function(event) {
      console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});

// default
gulp.task('default', ['lint', 'build', 'minify', 'test']);

// Travis CI
gulp.task('ci', ['default']);
