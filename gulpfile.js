var gulp = require('gulp'); 
var changed = require('gulp-changed');
var imagemin = require('gulp-imagemin');
var minifyHTML = require('gulp-minify-html');
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var minify = require('gulp-babel-minify');
var autoprefix = require('gulp-autoprefixer');
var minifyCSS = require('gulp-clean-css');

gulp.task('imagemin', function() {
  var imgSrc = './img/**/*',
      imgDst = './dist/img';

  gulp.src(['./img/*.jpg'])
    .pipe(changed(imgDst))
    .pipe(imagemin({verbose: true}))
    .pipe(gulp.dest(imgDst));
  gulp.src(['./img/*.mp4', './img/*.ico'])
    .pipe(changed(imgDst))
    .pipe(gulp.dest(imgDst));
});

gulp.task('htmlpage', function() {
  var htmlSrc = './*.html',
      htmlDst = './dist';

  gulp.src(htmlSrc)
    .pipe(changed(htmlDst))
    .pipe(minifyHTML())
    .pipe(gulp.dest(htmlDst));
});

// JS concat, strip debugging and minify
gulp.task('scripts', function() {
  gulp.src(['./js/tingle.js', './js/zenscroll-min.js', './js/index.js'])
    .pipe(concat('script.js'))
    .pipe(stripDebug())
    .pipe(minify())
    .pipe(gulp.dest('./dist/js/'));
});

// CSS concat, auto-prefix and minify
gulp.task('styles', function() {
  gulp.src(['./css/*.css'])
    .pipe(concat('style.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./dist/css/'));
});


// default gulp task
gulp.task('default', ['imagemin', 'htmlpage', 'scripts', 'styles'], function() {
  // watch for HTML changes
  gulp.watch('./*.html', function() {
    gulp.run('htmlpage');
  });

  // watch for JS changes
  gulp.watch('./js/*.js', function() {
    gulp.run('jshint', 'scripts');
  });

  // watch for CSS changes
  gulp.watch('./css/*.css', function() {
    gulp.run('styles');
  });
});