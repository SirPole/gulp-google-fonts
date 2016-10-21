var through = require('through2');
var util    = require('gulp-util');
var neon    = require('neon-js');
var request = require('request');
'use strict';

const PLUGIN_NAME   = 'gulp-google-fonts';
const FORMAT_AGENTS = {
  'eot' : 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET4.0C; .NET4.0E)',
  'ttf' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.59.8 (KHTML, like Gecko) Version/5.1.9 Safari/534.59.8',
  'woff' : 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; rv:11.0) like Gecko',
  'woff2' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; ServiceUI 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
};
var self;

function getFontFile (fontsObj) {
  return new Promise((resolve, reject) => {
    var arr = [];
    fontsObj[ 'fonts' ].forEach((key, font) => {
      arr.push(getRequestString({
        font : font,
        agent : fontsObj[ 'agent' ]
      })
        .then(requestFont)
        .then(requestFontFiles));
    });
    Promise.all(arr)
      .then(pushToFile)
      .then(() => resolve())
      .catch(error => reject(error));
  });
}

function getRequestString (fontObj) {
  return new Promise((resolve, reject) => {
    var requestString = '';
    requestString += fontObj[ 'font' ].get('family').replace(/\s/gi, '+') + ':';
    fontObj[ 'font' ].get('variants').forEach((key, variant) => {
      if (key !== 0) {
        requestString += ',';
      }
      requestString += variant;
    });
    requestString += '&subset=';
    fontObj[ 'font' ].get('subsets').forEach((key, subset) => {
      if (key !== 0) {
        requestString += ',';
      }
      requestString += subset;
    });
    if (requestString) {
      resolve({
        request : requestString,
        agent : fontObj[ 'agent' ]
      });
    } else {
      reject(new util.PluginError(PLUGIN_NAME, 'Could not parse fonts configuration.'));
    }
  });
}

function requestFont (requestObj) {
  return new Promise((resolve, reject) => {
    request({
      url : 'https://fonts.googleapis.com/css?family=' + requestObj[ 'request' ],
      headers : {
        'User-Agent' : requestObj[ 'agent' ]
      }
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}

function requestFontFiles (data) {
  return new Promise((resolve, reject) => {
    var fonts = data.match(/url\((.+?)\)/gi);
    var arr   = [];
    fonts.forEach((font) => {
      arr.push(requestFontFile(font));
    });
    Promise.all(arr)
      .then((out) => {
        for (var i = 0; i < out.length; i++) {
          data = data.replace(out[ i ][ 'font' ], out[ i ][ 'encoded' ]);
        }
        resolve(data);
      })
      .catch((error) => reject(error));
  });
}

function requestFontFile (font) {
  return new Promise((resolve, reject) => {
    var ext = '"data:application/x-font-' + font.match(/url\(.*\.(.{3,5})\)/)[ 1 ] + ';base64,';
    font    = font.replace(/url\((.+?)\)/gi, '\$1');
    request({
      url : font
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        var encoded = ext + new Buffer(body).toString('base64') + '"';
        resolve({
          font : font,
          encoded : encoded
        });
      } else {
        reject(error);
      }
    });
  });
}

function pushToFile (data) {
  return new Promise((resolve, reject) => {
    var ext = data[ 0 ].match(/x-font-(.{3,5});/)[ 1 ];
    var out = '';
    data.forEach(item => {
      out += item;
    });
    self.push(new util.File({
      cwd : './',
      base : './',
      path : ext + '.css',
      contents : new Buffer(out)
    }));
    resolve();
  });
}

function main () {
  return through.obj(function (file, enc, cb) {
    self = this;
    if (file.isNull()) {
      return cb(null, file);
    }
    if (file.isStream()) {
      return cb(new util.PluginError(PLUGIN_NAME, 'Streams are not supported!'));
    }
    if (file.isBuffer()) {
      var fonts = neon.decode(file.contents.toString().replace(/\r\n/g, '\n')).get('fonts');
      var arr   = [];
      for (var format in FORMAT_AGENTS) {
        if (!FORMAT_AGENTS.hasOwnProperty(format)) {
          continue;
        }
        arr.push(getFontFile({
          fonts : fonts,
          agent : FORMAT_AGENTS[ format ]
        }));
      }
      Promise.all(arr)
        .then(() => cb())
        .catch(error => cb(new util.PluginError(PLUGIN_NAME, error)));
    }
  });
}
module.exports = main;