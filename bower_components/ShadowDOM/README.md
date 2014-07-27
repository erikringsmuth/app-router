## Learn the tech

### Basic usage

    var el = document.createElement('div');
    var shadow = el.createShadowRoot();
    shadow.innerHTML = '<content select="h1"></content>';
    document.body.appendChild(el);

### Shadow DOM subtrees

Shadow DOM allows a single node to express three subtrees: _light DOM_, _shadow DOM_, and _composed DOM_.

Together, the light DOM and shadow DOM are referred to as the _logical DOM_. This is the DOM that the developer interacts with. The composed DOM is what the browser sees and uses to render the pixels on the screen.

**Light DOM**

The user of your custom element supplies the light DOM:

    <my-custom-element>
      <q>Hello World</q> <!-- part of my-custom-element's light DOM -->
    </my-custom-element>

The light DOM of `<my-custom-element>` is visible to the end-user of the
element as a normal subtree. They can access `.childNodes`, `.children`, `.innerHTML`, or any other property or method that gives information about a node's subtree.

**Shadow DOM**

`<my-custom-element>` may define shadow DOM by attaching a shadow root to
itself.

    #document-fragment
      <!-- everything in here is my-custom-element's shadow DOM -->
      <span>People say: <content></content></span>
      <footer>sometimes</footer>

Shadow DOM is internal to the element and hidden from the end-user.
Its nodes are not children of `<my-custom-element>`.

**Note:** Shadow roots are represented as a `#document-fragment` in the DevTools.
{: .alert .alert-info }

**Composed (rendered) DOM**

The composed DOM is what the browser actually renders. For rendering, the light
DOM is distributed into the shadow DOM to produce the composed DOM. The final output
looks something like this:

    <my-custom-element>
      <span>People say: <q>Hello World</q></span>
      <footer>sometimes</footer>
    </my-custom-element>

Nodes in light DOM or shadow DOM express parent and sibling relationships that match their respective tree structures; the relationships that exist in the composed tree are not expressed anywhere in DOM. So, while the `<span>` in the final composed tree is a child of `<my-custom-element>` and the parent of `<q>`, it is actually a child of the shadow root and `<q>` is a child of `<my-custom-element>`. The two nodes are unrelated but
Shadow DOM renders them as if they are. In this way, the user can manipulate light DOM or shadow DOM directly as regular DOM subtrees, and let the system take care of keeping the render tree synchronized.

## Polyfill details

A polyfill to provide Shadow DOM functionality in browsers that don't
support it natively. This section explains how a proper (native) implementation
differs from our polyfill implementation.

### Wrappers

The polyfill is implemented using _wrappers_. A wrapper wraps the native DOM node in a wrapper node. The wrapper node looks and behaves identical to the native node (minus bugs and known limitations). For example:

    var div = document.createElement('div');
    div.innerHTML = '<b>Hello world</b>';
    assert(div.firstChild instanceof HTMLElement);

But `div` is actually a wrapper of the element that the browser normally gives you. This wrapper just happen to have the same interface as the browser provided element.

It has an `innerHTML` setter that works just like the native `innerHTML` but it instead of working on the composed tree it works on the local DOM. When you change the logical DOM tree like this it might cause the composed tree to need to be re-rendered. This does not happen immediately, but it is scheduled to happen later as needed.

The wrapper node also have a `firstChild` getter which once again works on the logical DOM.

`instanceof` still works because we have replaced the global `HTMLElement` constructor with our custom one.

#### More Logical DOM

The `wrappers.Node` object keeps track of the logical (light as well as shadow, but not composed) DOM. Internally it has has the 5 fundamental Node pointers, `parentNode`, `firstChild`, `lastChild`, `nextSibling` and `previousSibling`. When the DOM tree is manipulated these pointers are updated to always represent the logical tree. When the shadow DOM renderer needs to render the visual tree, these internal pointers are updated as needed.

#### Wrap all the objects!

The intent is to wrap all the DOM objects that interact with the DOM tree. For this polyfill to be completely transparent we need to wrap a lot of APIs. Any method, accessor or constructor that takes or returns a Node or an object that indirectly touches a node needs to be wrapped. As you can imagine there are a lot of these. At the moment we have done the most common ones but there are sure to be missing ones as soon as you try to use this with your code.

### `wrap` and `unwrap`

There are bound to be cases where we haven't done the wrapping for you. In those cases you can use `wrap` to create a wrapper of a native object, or `unwrap` to get the underlying native object from a wrapper. These two functions are available on the `ShadowDOMPolyfill` object.

#### Event Retargetting

An important aspect of the shadow DOM is that events are retargetted to never expose the shadow DOM to the light DOM. For example.

    var div = document.createElement('div');
    div.innerHTML = 'Click me';
    var shadow = div.createShadowRoot();
    shadow.innerHTML = '<b><content></content></b>';

If the user clicks on the `div` the real `target` of the click event is the `<b>` element. But that element is not visible in the light DOM so the target is therefore retargetted to the `div` element itself. However, if there is an event listener on the `<content>`, `<b>` or the shadow root, the target should be visible to the event listener.

Similar issues occur with `relatedTarget` in `mouseover` and `mouseout` events.

To support this kind of behavior the event dispatching in the browser has to be reimplemented by the polyfill.

#### Known limitations

* CSS encapsulation is limited.
* `Object.prototype.toString` does not return the same string as for native objects.
* No live `NodeList`s. All node lists are snapshotted upon read.
* `document`, `window`, `document.body`, `document.head` and others are non configurable and cannot be overridden. We are trying to make these work as seamlessly as possible but there will doubtlessly be cases where there will be problems; for those cases you can use `wrap` and `unwrap` to get unblocked.
* Cross window/frame access is not implemented.
* CSS `:host()` rules can only have (at most) 1-level of nested parentheses in its argument selector. For example, `:host(.zot)` and `:host(.zot:not(.bar))` both work, but `:host(.zot:not(.bar:nth-child(2)))` does not.
