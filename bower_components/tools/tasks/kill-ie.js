module.exports = function(grunt) {
	/**
	 * Kill all leftover iexplore.exe processes.
	 */
	grunt.registerTask('kill-ie', 'Kill all leftover iexplore.exe processes', function() {
		var os = require('os').type();
		if (os === 'Windows_NT') {
			var exec = require('child_process').exec;
			exec(process.env.comspec + ' /c taskkill.exe /F /IM iexplore.exe /T');
		}
	});
};