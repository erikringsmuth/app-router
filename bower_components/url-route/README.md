url-route
================

See the [component page](http://codemix.github.io/url-route) for more information.


# Usage

```html
<url-route pattern="/pages/<page>">
  <template>
    <h1>Showing the {{page}} page!</h1>
  </template>
</url-route>
```

```html
<url-route pattern="/things/<num:\d+>">
  <template>
    <h1>Showing thing #{{num}}</h1>
  </template>
</url-route>
```

```html
<url-route pattern="#info">
  <template>
    <div class="alert alert-info">
      This is an info panel
    </div>
  </template>
</url-route>
```
