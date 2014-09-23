(function() {
  // Extend the <a> tag with history.pushState()
  //
  // <a is="pushstate-anchor" href="/path" [title="New Page Title"] [state="{'message':'New State!'}"]>title</a>

  var HTMLPushStateAnchorElement = Object.create(HTMLAnchorElement.prototype);

  function pushStateAnchorEventListener(event) {
    // open in new tab
    if (event.ctrlKey || event.metaKey || event.which === 2) {
      return;
    }

    window.history.pushState(JSON.parse(this.getAttribute('state')), this.getAttribute('title'), this.getAttribute('href'));

    window.dispatchEvent(new PopStateEvent('popstate', {
      bubbles: false,
      cancelable: false,
      state: window.history.state
    }));

    event.preventDefault();
  }

  HTMLPushStateAnchorElement.createdCallback = function() {
    this.addEventListener('click', pushStateAnchorEventListener, false);
  };

  document.registerElement('pushstate-anchor', {
    prototype: HTMLPushStateAnchorElement,
    extends: 'a'
  });
})();
