// recursive module loader
var fs = require('fs');
var path = require('path');

function readJSON(filename) {
  var blob = fs.readFileSync(filename, 'utf8');
  return JSON.parse(blob);
}

function readManifest(filename, modules) {
  modules = modules || [];
  var lines = readJSON(filename);
  var dir = path.dirname(filename);
  lines.forEach(function(line) {
    var fullpath = path.join(dir, line);
    if (line.slice(-5) == '.json') {
      // recurse
      readManifest(fullpath, modules);
    } else {
      modules.push(fullpath);
    }
  });
  return modules;
}

module.exports = readManifest;
