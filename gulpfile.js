
var gulp = require('gulp');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var minifyCSS = require('gulp-minify-css');
var merge = require('merge-stream');
var inlineCss = require('gulp-inline-css');
var sass = require('gulp-sass');
let uglify = require('gulp-uglify-es').default;

var globs = {
  dist: './dist',
  js: './js/**/*.js',
  css: './css/**/*.css',

  images: './img/**',
  fonts: './fonts/**'
};

gulp.task('clean', function() {
  return gulp.src([globs.dist], {read: false})
    .pipe(clean());
});

gulp.task('assets', ['clean'], function() {
  var images = gulp.src(globs.images).pipe(gulp.dest(globs.dist + '/img'));
  var fonts = gulp.src(globs.fonts).pipe(gulp.dest(globs.dist + '/fonts'));

  return merge(images, fonts);
});

gulp.task('sass', function (){
  return gulp.src('./sass/**/*.scss')
      .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
      .pipe(gulp.dest('./css'));
});

gulp.task('styles', ['clean', 'sass'], function() {
  return gulp.src('./*.html')
          .pipe(inlineCss({ preserveMediaQueries: true }))
          .pipe(gulp.dest('dist/'));
});

gulp.task('scripts', ['clean'], function() {
  return gulp.src(globs.js)
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(gulp.dest(globs.dist + '/js'));
});

gulp.task('build', ['scripts', 'sass', 'styles', 'assets']);

gulp.task('default', ['build']);