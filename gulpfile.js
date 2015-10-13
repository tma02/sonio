var gulp = require('gulp');
var react = require('gulp-react');
var exec = require('child_process').exec;
 
gulp.task('jsx', function() {
  return gulp.src('app/browser/jsx/**/*.js')
    .pipe(react())
    .pipe(gulp.dest('app/browser/dist'));
});

gulp.task('electron', function(cb) {
  var electronProc = exec('./node_modules/.bin/electron .', function (err, stdout, stderr) {
    cb(err);
  });
  electronProc.stdout.pipe(process.stdout);
  electronProc.stderr.pipe(process.stderr);
});

gulp.task('default', ['jsx', 'electron']);
gulp.watch('app/browser/jsx/**/*.js', ['jsx']);