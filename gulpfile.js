var gulp = require('gulp');
var uglify = require('gulp-uglify');
var csso = require('gulp-csso');
var imageMin = require('gulp-imagemin');

gulp.task('comprJS', function() {
	gulp.src('src/app.js')
	.pipe(uglify())
	.pipe(gulp.dest('dist'));
});

gulp.task('comprCSS', function() {
	gulp.src('src/style.css')
	.pipe(csso())
	.pipe(gulp.dest('dist'));
});

gulp.task('comprImg', function() {
    return gulp.src(['src/icon.png', 'src/favicon.ico'])
        .pipe(imageMin())
        .pipe(gulp.dest('dist'));
});


gulp.task('default', ['comprJS', 'comprCSS', 'comprImg']);