#!/usr/bin/env node

var fs = require('fs');
var cheerio = require('cheerio');
var path = require('path');

var cheerioOptions = {xmlMode: true};
var files = process.argv.slice(2);

function read(file) {
  var content = fs.readFileSync(file, 'utf8');
  return cheerio.load(content, cheerioOptions);
}

function transmogrify($, name) {
  var node = $('svg');
  // remove spacer rectangles
  node.find('rect[fill], rect[style *= fill]').remove();
  // remove fill colors
  node.find('[fill]').each(function() {
    var e = $(this);
    var color = e.attr('fill');
    // some "white" nodes are extraneous
    if (color === '#FFFFFF') {
      e.remove();
    } else {
      e.removeAttr('fill');
    }
  });
  // remove empty groups
  var innerHTML = $.xml(node.find('*').filter(':not(g)'));
  // remove extraneous whitespace
  innerHTML = innerHTML.replace(/\t|\r|\n/g, '');
  // add parent group with icon name as id
  var output = '<g id="' + name + '">' + innerHTML + '</g>';
  // print icon svg
  console.log(output);
}

function path2IconName(file) {
  parts = path.basename(file).split('_');
  // remove ic_
  parts.shift();
  // remove _24px.svg
  parts.pop();
  return parts.join('-');
}

files.forEach(function(file) {
  var name = path2IconName(file);
  var $ = read(file);
  transmogrify($, name);
});
