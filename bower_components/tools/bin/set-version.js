/*
 * Expected Structure:
 *   {
 *     "name": "foo",
 *     "version: "0.0.1",
 *     "dependencies": {
 *       "foo": "Polymer/foo#master"
 *     }
 *   }
 */
var fs = require('fs');
var VALID_VERSION = /^\d\.\d\.\d$/;

var file = process.argv[2];
var version = process.argv[3];

if (!file) {
  console.error("No file!");
  process.exit(1);
}

if (!version) {
  console.error("No version!");
  process.exit(1);
}

var configBlob = fs.readFileSync(file, 'utf8');
var config = JSON.parse(configBlob);

if (version && VALID_VERSION.test(version)) {
  config.version = version;
}

var deps = config.dependencies;
if (deps) {
  Object.keys(deps).forEach(function(d) {
    if (deps[d].search('Polymer.*/') > -1) {
      deps[d] = deps[d].replace(/#.*$/, '#' + version);
    }
  });
  config.dependencies = deps;
}

fs.writeFileSync(file, JSON.stringify(config, null, 2));
