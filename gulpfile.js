// Gulp.js configuration
'use strict';

const
  // Source and build folders.
  directories = [],
  sass_paths = ['./**/sass/*.s+(a|c)ss', './**/**/sass/*.s+(a|c)ss', './**/**/**/sass/*.s+(a|c)ss'],

  // Gulp and plugins.
  fs           = require('fs'),                // Work with file system.
  gulp         = require('gulp'),              // Require gulp.
  concat       = require('gulp-concat'),       // Join all JS files together to save space.
  cssnano      = require('gulp-cssnano'),      // Minify the CSS.
  filter       = require('gulp-filter'),
  rename       = require('gulp-rename'),       // Rename file.
  sourcemaps   = require('gulp-sourcemaps'),   // Add source map for files.
  uglify       = require('gulp-uglify'),       // Minify JavaScript.
  autoprefixer = require('gulp-autoprefixer'), // Add prefix for different browsers.
  sass         = require('gulp-sass'),         // Compile Sass into CSS.
  sassLint     = require('gulp-scss-lint'),    // Debug SCSS files.
  clean        = require('gulp-clean'),        // Remove files from folder.
  gulpif       = require('gulp-if'),           // Allow logic.
  // jslint       = require('gulp-jslint'),       // Debug JS files
  readlineSync = require('readline-sync'),
  stylish      = require('jshint-stylish'),    // More stylish debugging
  fileExists   = require('file-exists'),       // Check if file exist in the filder.
  browserSync  = require('browser-sync').create(), // Reload the browser on file changes
  cp           = require('child_process'),
  files        = fs.readdirSync('.')
;

/**
 * Get all theme directoris (all that have sass/style.scss in them).
 */
var directory         = '',
    sassPath          = '',
    meidanperhe_path  = '';

files.forEach(
  function (file_item) {
    if (fs.lstatSync(file_item).isDirectory()) {
      directory = file_item;
      sassPath = directory + '/sass/style.scss';
      meidanperhe_path = directory + '/sass/meidanperhe.scss';
      if (fileExists(sassPath)) {
        directories.push(directory);
      }
      if (fileExists(meidanperhe_path)) {
        directories.push(directory);
      }
    }
  }
);

/**
 * @task sass:build
 * Compile all scss files.
 * Run: gulp sass:build, gulp sass:build --theme soppa365, gulp sass:build --dev
 */
gulp.task('sass:build', function () {
  var themeName = getThemeName();
  if (themeName) {
    compileSCSS(themeName);
  }
  else {
    directories.forEach(
      function (directory) {
        compileSCSS(directory);
      });
  }
});

/**
 * @task sass:build
 * Compile Sanoma Shiny theme.
 * Run: gulp sass:build:shiny
 */
gulp.task('sass:build:shiny', function () {
    compileSCSS('sanoma_shiny');
});

/**
 * @task sass:watch
 * Watch changes in the scss files.
 * Run: gulp sass:watch, gulp sass:watch --theme soppa365
 */
gulp.task('sass:watch', function () {
  gulp.watch(sass_paths, ['sass:build'])
    .on('change', browserSync.reload);
});

/**
 * @task sass:lint
 * Sass lint for check scss code style.
 * Run: gulp sass:lint
 */
gulp.task('sass:lint', function () {
  directories.forEach(
    function (directory) {
      gulp.src(directory + '/sass/*.scss')
        .pipe(sassLint({'config': '.sass-lint.yml'}));
    });
});

/**
 * @task clean:css
 * The css folder Clean from old .css files.
 * Run: gulp clean:css
 */
gulp.task('clean:css', function () {
  directories.forEach(
    function (directory) {
      console.log('Clean theme:', directory);
      gulp.src(directory + '/css/*.css', {read: false})
        .pipe(clean());
      gulp.src(directory + '/css/*.map', {read: false})
        .pipe(clean());
    });
});

/**
 * @task js:build
 * JS's files concat to one file and minify.
 * Run: gulp js:build
 */
gulp.task('js:build', function () {
  return gulp.src('./sanoma_base/js/*.js')
    .pipe(gulpif(process.argv[3] === '--' + 'dev', sourcemaps.init()))
    .pipe(concat('scripts.js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulpif(process.argv[3] === '--' + 'dev', sourcemaps.write('./')))
    .pipe(gulp.dest('./sanoma_base/js'));
});

/**
 * @task js:watch
 * JS's files concat to one file and minify.
 * Run: gulp js:watch
 */
gulp.task('js:watch', function () {
  gulp.watch('./**/js/*.js', ['js:build']);
});

/**
 * @task eslint
 * JS lint for check js code style.
 * Run: gulp js:lint
 * TODO: Need to improve this task.
 */
// gulp.task('js:lint', function(){
//   gulp.src(['./sanoma_base/js/*.js'])
//     .pipe(jslint())
//     .pipe(jslint.reporter('jshint-stylish'));
// });

/**
 * @task clean:maps
 * Remove all maps for css and js.
 * Run: clean:maps
 */
gulp.task('clean:maps', function () {
  directories.forEach(
    function (directory) {
      console.log('Remove map:', directory);
      gulp.src(directory + '/css/*.map', {read: false})
        .pipe(clean());
    });
  gulp.src('./**/js/*.map', {read: false})
    .pipe(clean());
});

/**
 * @task browser-sync
 * Launch the local server for developing.
 * Run: gulp browser:sync --site=local.kekmama.nl --theme kekmama
 */
gulp.task('browser:sync', ['sass:watch'], function () {
  browserSync.init({
    proxy: (
      process.argv[3] ?
        process.argv[3].split('--')[1] :
        readlineSync.question('Virtual host (e.g. http://local.menaiset.fi): ')
    ),
    socket: {
      // For local development only use the default Browsersync local URL.
      domain: 'localhost:3000'
      // For external development (e.g on a mobile or tablet) use an external
      // URL. You will need to update this to whatever BS tells you is the
      // external URL when you run Gulp. domain: '192.168.0.13:3000'
    }
  });
});

/**
 * @task default
 * Launch the default task for production or build.
 *
 * For build and production run "gulp" or "gulp sass:build".
 * Run: "gulp" for prod or build and "gulp --dev" for dev
 */
gulp.task('default', ['sass:build']);

/**
 * Perform compiling for SCSS for a given theme (directory).
 */
var compileSCSS = function (themeName) {
  console.log('Compiling theme:', themeName);
  gulp.src(themeName + '/sass/*.scss')
    .pipe(gulpif(process.argv[3] === '--' + 'dev', sourcemaps.init()))
    .pipe(sass({
      outputStyle: 'expanded',
      debugInfo   : true,
      lineNumbers : true
    }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 10 versions'],
      cascade: false
    }))
    .pipe(gulp.dest(themeName + '/css'))
    .pipe(filter(themeName + '/css/*.css'))
    .pipe(cssnano({discardComments: {removeAll: true}}))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulpif(process.argv[3] === '--' + 'dev', sourcemaps.write('./')))
    .pipe(gulp.dest(themeName + '/css'))
    .pipe(gulpif(process.argv[3] === '--' + 'dev', browserSync.reload({stream:true})));
};

/**
 * Help function.
 * Get the --theme parameter for the running script.
 */
var getThemeName = function () {
  // Get the themeName if given.
  var themeName;
  try {
    var option, i = process.argv.indexOf("--theme");
    if (i > -1) {
      themeName = process.argv[i + 1];
    }
    return themeName;
  }
  catch (e) {
    return false;
  }
};
