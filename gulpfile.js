'use strict';

var browserify = require('browserify');
var to5ify = require('6to5ify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var jshint = require('gulp-jshint');
var path = require('path');

var sources = ['build/**/*.js', 'lib/**/*.js'];

gulp.task('build', function() {
  var bundler = browserify({
    debug: true,
    entries: ['./build/index.js']
  }).transform(to5ify.configure({
    sourceMapRelative: path.resolve(__dirname),
    experimental: true
  }));

  console.log(path.resolve(__dirname));

  return bundler
    .bundle()
    .pipe(source('shed.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('test', function () {
    gulp.src(sources.concat('gulpfile.js'))
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch', ['default'], function() {
  gulp.watch(sources, ['default']);
});

gulp.task('default', ['test', 'build']);