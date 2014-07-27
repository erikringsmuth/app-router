mocha.setup({
  ui:'tdd',
  ignoreLeaks: true
});
var assert = chai.assert;

var parserHasNativeTemplate = function() {
	var div = document.createElement('div');
	div.innerHTML = '<table><template>';
	return div.firstChild.firstChild && div.firstChild.firstChild.tagName == 'TEMPLATE';
}();
