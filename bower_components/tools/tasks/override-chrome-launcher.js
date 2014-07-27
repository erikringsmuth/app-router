module.exports = function(grunt) {
	/**
	 * Install a fork of karma-chrome-launcher if on a Mac to launch
	 * Chrome Canary with Harmony.
	 */
	grunt.registerTask('override-chrome-launcher', 'Enable Harmony for Chrome Canary', function() {
		var os = require('os').type();
		if (os === 'Darwin') {
			var exec = require('child_process').exec;
			var cb = this.async();
			exec('npm install --tmp ../.tmp git://github.com/morethanreal/karma-chrome-launcher',
					null, function(err, stdout, stderr) {
						console.log(stdout);
						console.log(stderr);
						cb();
					});
		}
	});
};