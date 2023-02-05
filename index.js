var PluginError = require('gulp-util').PluginError;
var through     = require('through2');
var fs          = require('fs');

module.exports = function (options) {
  options = options || {};

  var PLUGIN_NAME = '@stomydent/gulp-include-file';
  var regex       = options.regex     || /INCLUDE_FILE\s*\(\s*['"]([^'"]*)['"]\s*\)/m;
  var transform   = options.transform || JSON.stringify;
  var rootDirs    = options.rootDirs  || [] 

  return through.obj(function (file, enc, callback) {
    if(file.isNull()) return callback(null, file);

    if(file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Cannot use streamed files'));
      return callback();
    }

    if(file.isBuffer()) {
      var contents = file.contents.toString(enc);
      var matches;
      while (matches = regex.exec(contents)) {
        var path  = file.base + matches[1];
		    var found = false;

        if(fs.existsSync(path)) {
		          found = true;
              var include_contents = fs.readFileSync(path, {encoding: enc});
              contents = contents.substr(0, matches.index) + transform(include_contents) + contents.substr(matches.index + matches[0].length);
        }
        else{
          for(const checkedDir of rootDirs){
            if(fs.existsSync(checkedDir + matches[1])){
              found = true;
              path  = checkedDir + matches[1];
                var include_contents = fs.readFileSync(path, {encoding: enc});
              contents = contents.substr(0, matches.index) + transform(include_contents) + contents.substr(matches.index + matches[0].length);
            }else{
              found = false;
            }
          }
          if(found === false){
            this.emit('error', new PluginError(PLUGIN_NAME, "File not found: " + path));
            return callback();
          }
        }
      }
      file.contents = Buffer.from(contents, enc);
    }
    callback(null, file);
  });
};
