'use strict';
const path = require('path');
const gulp = require('gulp');
const babel = require('gulp-babel');
const jshint = require('gulp-jshint');
const uglify = require('gulp-uglify');
const inline = require('gulp-inline');
const karma = require('karma');

const files = ['src/*.js', 'tests/spec/*.js'];

gulp.task('lint', function() {
  return gulp.src(files)
    .pipe(jshint.extract('always'))
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('build', function() {
  return gulp.src('src/app-router.html')
    .pipe(inline({
      base: 'src',
      js: function() {
        return babel({
                comments: false,
                minified: true,
                plugins: ['transform-custom-element-classes'],
                presets: ['babel-preset-env']
              });
      }
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
  gulp.watch(files, ['lint', 'build', 'test'])
    .on('change', function(event) {
      console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});

// default
gulp.task('default', ['lint', 'build', 'test']);

// Travis CI
gulp.task('ci', ['default']);
