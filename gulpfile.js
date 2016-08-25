// dependencies
var gulp = require('gulp');
var git = require('gulp-git');
var bump = require('gulp-bump');
var filter = require('gulp-filter');
var tag_version = require('gulp-tag-version');
var eslint = require("gulp-eslint");
var runSequence = require('run-sequence');
var wrap = require("gulp-wrap");
var gutil = require('gulp-util');
var serve = require('gulp-serve');
var karma = require('gulp-karma');
var files = require('./files.conf');
var testFiles = [].concat(files.libs, files.src, files.test);

var port = 8083;

gulp.task('bump-version', function () {
	return gulp.src(['./bower.json', './package.json'])
		.pipe(bump({type: "patch"}).on('error', gutil.log))
		.pipe(gulp.dest('./'));
});

gulp.task('commit-changes', function () {
	return gulp.src('.')
		.pipe(git.commit('[Prerelease] Bumped version number', {args: '-a'}));
});

gulp.task('tag-version', function() {
	return gulp.src('package.json')
		.pipe(tag_version());
});

gulp.task('push-changes', function (cb) {
	git.push('origin', 'master', cb);
});

gulp.task('release', function (callback) {
	runSequence(
		'bump-version',
		'build',
		'commit-changes',
		'tag-version',
		function (error) {
			if (error) {
				console.log(error.message);
			} else {
				console.log('RELEASE FINISHED SUCCESSFULLY');
			}
			callback(error);
		});
});

gulp.task('tag-version', function() {
	return gulp.src('./package.json')
		.pipe(tag_version());
});

gulp.task('build', function() {
	return gulp.src("src/angular-ui-router-default.js")
		.pipe(wrap({ src: './build.txt' }, { info: require('./package.json') }))
		.pipe(gulp.dest('.'));
});

gulp.task('serve', serve({
	root: __dirname,
	port: port,
	middleware: function(req, resp, next) {
		console.log(req.originalUrl);
		if(req.originalUrl == '/') {
			resp.statusCode = 302;
			resp.setHeader('Location', '/sample/');
			resp.setHeader('Content-Length', '0');
			resp.end();
		} else {
			next();
		}
	}
}));

gulp.task('demo', ['serve'], function() {
	require('open')('http://localhost:' + port);
});

gulp.task('test', ['lint'], function() {
	// Be sure to return the stream
	return gulp.src(testFiles)
		.pipe(karma({
			configFile: 'karma.conf.js',
			action: 'run'
		}))
		.on('error', function(err) {
			// Make sure failed tests cause gulp to exit non-zero
			throw err;
		});
});

gulp.task('watch', function() {
	gulp.src(testFiles)
		.pipe(karma({
			configFile: 'karma.conf.js',
			action: 'watch'
		}));
});

gulp.task('lint', function () {
	return gulp.src([
		"./src/**/*.js",
		"./test/**/*.js"
	])
		.pipe(eslint())
		// eslint.format() outputs the lint results to the console.
		// Alternatively use eslint.formatEach() (see Docs).
		.pipe(eslint.format())
		// To have the process exit with an error code (1) on
		// lint error, return the stream and pipe to failAfterError last.
		.pipe(eslint.failAfterError());
});
