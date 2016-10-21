# gulp-google-fonts
### The complete solution for webfonts using [Gulp](http://gulpjs.com/)

Uses [Neon](https://ne-on.org/) for configuration.
Inspired by [gulp-google-fonts-base64-css](https://github.com/luckyraul/gulp-google-fonts-base64-css).

Downloads desired fonts from [Google fonts](https://fonts.google.com/), encodes them to **base64** and saves in format specific css files.
You can then decide which to serve to specific clients. ~~Wonder how? Check out my [Fontloader]().~~


## Example configuration
###### config.neon
```
fonts:
	- #Here starts font declaration
		family:	Roboto
		variants:
			- 300
			- 400
			- 700
		subsets:
			- latin
			- latin-ext
	- #Here starts font declaration
		family: Roboto Condensed
		variants:
			- 400
			- 400i
			- 700
			- 700i
		subsets:
			- latin-ext
	- #Here starts font declaration
		family: Roboto Slab
		variants:
			- 400
			- 700
		subsets:
			- latin-ext

```

## Example gulpfile
###### gulpfile.js
```
var gulp = require('gulp');
var ggf = require('gulp-google-fonts');
gulp.task('getFonts', function () {
  return gulp.src('config.neon')
	.pipe(ggf())
	.pipe(gulp.dest('dist/fonts'));
});
```

##TODO
* Support more configurations, namely JSON.
* Make human readable errors. 
* **??** Support svg fonts **??**