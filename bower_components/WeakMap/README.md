WeakMap
=======

Shim for ES6 WeakMap

## Shim Limitations

As ES5 Javascript does not have the ability to use weak references, the key-value association must be held strongly somwhere.

In order to hold the key "weakly", a key property of WeakMap, the value is added to key as a hidden, randomly named property. This strategy avoids the possible memory leak of having two arrays holding keys and values, but does mean that key cannot be a frozen object.
