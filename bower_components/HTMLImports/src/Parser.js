/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

var IMPORT_LINK_TYPE = 'import';
var flags = scope.flags;
var isIe = /Trident/.test(navigator.userAgent);
// TODO(sorvell): SD polyfill intrusion
var mainDoc = window.ShadowDOMPolyfill ? 
    window.ShadowDOMPolyfill.wrapIfNeeded(document) : document;

// importParser
// highlander object to manage parsing of imports
// parses import related elements
// and ensures proper parse order
// parse order is enforced by crawling the tree and monitoring which elements
// have been parsed; async parsing is also supported.

// highlander object for parsing a document tree
var importParser = {
  // parse selectors for main document elements
  documentSelectors: 'link[rel=' + IMPORT_LINK_TYPE + ']',
  // parse selectors for import document elements
  importsSelectors: [
    'link[rel=' + IMPORT_LINK_TYPE + ']',
    'link[rel=stylesheet]',
    'style',
    'script:not([type])',
    'script[type="text/javascript"]'
  ].join(','),
  map: {
    link: 'parseLink',
    script: 'parseScript',
    style: 'parseStyle'
  },
  // try to parse the next import in the tree
  parseNext: function() {
    var next = this.nextToParse();
    if (next) {
      this.parse(next);
    }
  },
  parse: function(elt) {
    if (this.isParsed(elt)) {
      flags.parse && console.log('[%s] is already parsed', elt.localName);
      return;
    }
    var fn = this[this.map[elt.localName]];
    if (fn) {
      this.markParsing(elt);
      fn.call(this, elt);
    }
  },
  // only 1 element may be parsed at a time; parsing is async so each
  // parsing implementation must inform the system that parsing is complete
  // via markParsingComplete.
  // To prompt the system to parse the next element, parseNext should then be
  // called.
  // Note, parseNext used to be included at the end of markParsingComplete, but
  // we must not do this so that, for example, we can (1) mark parsing complete 
  // then (2) fire an import load event, and then (3) parse the next resource.
  markParsing: function(elt) {
    flags.parse && console.log('parsing', elt);
    this.parsingElement = elt;
  },
  markParsingComplete: function(elt) {
    elt.__importParsed = true;
    if (elt.__importElement) {
      elt.__importElement.__importParsed = true;
    }
    this.parsingElement = null;
    flags.parse && console.log('completed', elt);
  },
  invalidateParse: function(doc) {
    if (doc && doc.__importLink) {
      doc.__importParsed = doc.__importLink.__importParsed = false;
      this.parseSoon();
    }
  },
  parseSoon: function() {
    if (this._parseSoon) {
      cancelAnimationFrame(this._parseDelay);
    }
    var parser = this;
    this._parseSoon = requestAnimationFrame(function() {
      parser.parseNext();
    });
  },
  parseImport: function(elt) {
    // TODO(sorvell): consider if there's a better way to do this;
    // expose an imports parsing hook; this is needed, for example, by the
    // CustomElements polyfill.
    if (HTMLImports.__importsParsingHook) {
      HTMLImports.__importsParsingHook(elt);
    }
    elt.import.__importParsed = true;
    this.markParsingComplete(elt);
    // fire load event
    if (elt.__resource) {
      elt.dispatchEvent(new CustomEvent('load', {bubbles: false}));    
    } else {
      elt.dispatchEvent(new CustomEvent('error', {bubbles: false}));
    }
    // TODO(sorvell): workaround for Safari addEventListener not working
    // for elements not in the main document.
    if (elt.__pending) {
      var fn;
      while (elt.__pending.length) {
        fn = elt.__pending.shift();
        if (fn) {
          fn({target: elt});
        }
      }
    }
    this.parseNext();
  },
  parseLink: function(linkElt) {
    if (nodeIsImport(linkElt)) {
      this.parseImport(linkElt);
    } else {
      // make href absolute
      linkElt.href = linkElt.href;
      this.parseGeneric(linkElt);
    }
  },
  parseStyle: function(elt) {
    // TODO(sorvell): style element load event can just not fire so clone styles
    var src = elt;
    elt = cloneStyle(elt);
    elt.__importElement = src;
    this.parseGeneric(elt);
  },
  parseGeneric: function(elt) {
    this.trackElement(elt);
    document.head.appendChild(elt);
  },
  // tracks when a loadable element has loaded
  trackElement: function(elt, callback) {
    var self = this;
    var done = function(e) {
      if (callback) {
        callback(e);
      }
      self.markParsingComplete(elt);
      self.parseNext();
    };
    elt.addEventListener('load', done);
    elt.addEventListener('error', done);

    // NOTE: IE does not fire "load" event for styles that have already loaded
    // This is in violation of the spec, so we try our hardest to work around it
    if (isIe && elt.localName === 'style') {
      var fakeLoad = false;
      // If there's not @import in the textContent, assume it has loaded
      if (elt.textContent.indexOf('@import') == -1) {
        fakeLoad = true;
      // if we have a sheet, we have been parsed
      } else if (elt.sheet) {
        fakeLoad = true;
        var csr = elt.sheet.cssRules;
        var len = csr ? csr.length : 0;
        // search the rules for @import's
        for (var i = 0, r; (i < len) && (r = csr[i]); i++) {
          if (r.type === CSSRule.IMPORT_RULE) {
            // if every @import has resolved, fake the load
            fakeLoad = fakeLoad && Boolean(r.styleSheet);
          }
        }
      }
      // dispatch a fake load event and continue parsing
      if (fakeLoad) {
        elt.dispatchEvent(new CustomEvent('load', {bubbles: false}));
      }
    }
  },
  // NOTE: execute scripts by injecting them and watching for the load/error
  // event. Inline scripts are handled via dataURL's because browsers tend to
  // provide correct parsing errors in this case. If this has any compatibility
  // issues, we can switch to injecting the inline script with textContent.
  // Scripts with dataURL's do not appear to generate load events and therefore
  // we assume they execute synchronously.
  parseScript: function(scriptElt) {
    var script = document.createElement('script');
    script.__importElement = scriptElt;
    script.src = scriptElt.src ? scriptElt.src : 
        generateScriptDataUrl(scriptElt);
    scope.currentScript = scriptElt;
    this.trackElement(script, function(e) {
      script.parentNode.removeChild(script);
      scope.currentScript = null;  
    });
    document.head.appendChild(script);
  },
  // determine the next element in the tree which should be parsed
  nextToParse: function() {
    return !this.parsingElement && this.nextToParseInDoc(mainDoc);
  },
  nextToParseInDoc: function(doc, link) {
    var nodes = doc.querySelectorAll(this.parseSelectorsForNode(doc));
    for (var i=0, l=nodes.length, p=0, n; (i<l) && (n=nodes[i]); i++) {
      if (!this.isParsed(n)) {
        if (this.hasResource(n)) {
          return nodeIsImport(n) ? this.nextToParseInDoc(n.import, n) : n;
        } else {
          return;
        }
      }
    }
    // all nodes have been parsed, ready to parse import, if any
    return link;
  },
  // return the set of parse selectors relevant for this node.
  parseSelectorsForNode: function(node) {
    var doc = node.ownerDocument || node;
    return doc === mainDoc ? this.documentSelectors : this.importsSelectors;
  },
  isParsed: function(node) {
    return node.__importParsed;
  },
  hasResource: function(node) {
    if (nodeIsImport(node) && !node.import) {
      return false;
    }
    return true;
  }
};

function nodeIsImport(elt) {
  return (elt.localName === 'link') && (elt.rel === IMPORT_LINK_TYPE);
}

function generateScriptDataUrl(script) {
  var scriptContent = generateScriptContent(script);
  var b64 = 'data:text/javascript';
  // base64 may be smaller, but does not handle unicode characters
  // attempt base64 first, fall back to escaped text
  try {
    b64 += (';base64,' + btoa(scriptContent));
  } catch(e) {
    b64 += (';charset=utf-8,' + encodeURIComponent(scriptContent));
  }
  return b64;
}

function generateScriptContent(script) {
  return script.textContent + generateSourceMapHint(script);
}

// calculate source map hint
function generateSourceMapHint(script) {
  var moniker = script.__nodeUrl;
  if (!moniker) {
    moniker = script.ownerDocument.baseURI;
    // there could be more than one script this url
    var tag = '[' + Math.floor((Math.random()+1)*1000) + ']';
    // TODO(sjmiles): Polymer hack, should be pluggable if we need to allow 
    // this sort of thing
    var matches = script.textContent.match(/Polymer\(['"]([^'"]*)/);
    tag = matches && matches[1] || tag;
    // tag the moniker
    moniker += '/' + tag + '.js';
  }
  return '\n//# sourceURL=' + moniker + '\n';
}

// style/stylesheet handling

// clone style with proper path resolution for main document
// NOTE: styles are the only elements that require direct path fixup.
function cloneStyle(style) {
  var clone = style.ownerDocument.createElement('style');
  clone.textContent = style.textContent;
  path.resolveUrlsInStyle(clone);
  return clone;
}

// path fixup: style elements in imports must be made relative to the main 
// document. We fixup url's in url() and @import.
var CSS_URL_REGEXP = /(url\()([^)]*)(\))/g;
var CSS_IMPORT_REGEXP = /(@import[\s]+(?!url\())([^;]*)(;)/g;

var path = {
  resolveUrlsInStyle: function(style) {
    var doc = style.ownerDocument;
    var resolver = doc.createElement('a');
    style.textContent = this.resolveUrlsInCssText(style.textContent, resolver);
    return style;  
  },
  resolveUrlsInCssText: function(cssText, urlObj) {
    var r = this.replaceUrls(cssText, urlObj, CSS_URL_REGEXP);
    r = this.replaceUrls(r, urlObj, CSS_IMPORT_REGEXP);
    return r;
  },
  replaceUrls: function(text, urlObj, regexp) {
    return text.replace(regexp, function(m, pre, url, post) {
      var urlPath = url.replace(/["']/g, '');
      urlObj.href = urlPath;
      urlPath = urlObj.href;
      return pre + '\'' + urlPath + '\'' + post;
    });    
  }
}

// exports
scope.parser = importParser;
scope.path = path;
scope.isIE = isIe;

})(HTMLImports);
