var gulp = require('gulp');
var jshint = require('gulp-jshint');

var files = ['elements/*.html', 'pages/*.html', 'layouts/*.html'];

gulp.task('lint', function() {
  return gulp.src(files)
    .pipe(jshint.extract('always'))
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('default', ['lint']);
