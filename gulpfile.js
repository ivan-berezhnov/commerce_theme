// Gulp.js configuration
'use strict';

const
  // Source and build folders.
  sass_paths = ['./sass/*.s+(a|c)ss', './sass/**/*.s+(a|c)ss', './sass/**/**/*.s+(a|c)ss'],

  // Gulp and plugins.
  gulp         = require('gulp'),              // Require gulp.
  concat       = require('gulp-concat'),       // Join all JS files together to save space.
  cssnano      = require('gulp-cssnano'),      // Minify the CSS.
  rename       = require('gulp-rename'),       // Rename file.
  sourcemaps   = require('gulp-sourcemaps'),   // Add source map for files.
  uglify       = require('gulp-uglify'),       // Minify JavaScript.
  autoprefixer = require('gulp-autoprefixer'), // Add prefix for different browsers.
  sass         = require('gulp-sass'),         // Compile Sass into CSS.
  browserSync  = require('browser-sync').create() // Reload the browser on file changes
;

/**
 * @task sass
 */
gulp.task('sass', function () {
  gulp.src('./sass/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded',
      debugInfo   : true,
      lineNumbers : true
    }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 10 versions'],
      cascade: false
    }))
    .pipe(gulp.dest('./dist'))
    .pipe(cssnano({discardComments: {removeAll: true}}))
    .pipe(rename({suffix: '.min'}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist'))
    .pipe(gulp.dest('./prototypes/css'))
    .pipe(browserSync.reload({stream:true}));
});

/**
 * @task watch
 */
gulp.task('watch', function () {
  gulp.watch(sass_paths, ['sass'])
    .on('change', browserSync.reload);
  gulp.watch('./js/*.js', ['js']);  
});

/**
 * @task js
 */
gulp.task('js', function () {
  return gulp.src('./js/*.js')
    .pipe(sourcemaps.init())
    .pipe(concat('commerce.js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist'));
});

/**
 * @task browser-sync
 */
gulp.task('browser', ['watch'], function () {
  browserSync.init({
    server: {
      baseDir: "./prototypes/"
    },
    port: 8080,
    open: true,
    notify: false
  });
});

/**
 * @task default
 */
gulp.task('default', ['sass']);
