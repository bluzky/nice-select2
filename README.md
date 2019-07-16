# jQuery Nice Select

A lightweight jQuery plugin that replaces native select elements with customizable dropdowns.

## Install
```
npm i nice-select2
```

## Usage

Include nice-select2 script.

```html
<script src="path/to/nice-select2.js"></script>
```

Include the styles, either the compiled CSS...

```html
<link rel="stylesheet" href="path/to/nice-select2.css">
```

Or import nice-select2 using ES6 syntax
```js
import NiceSelect from 'nice-select2';
```

```scss
@import '~nice-select2/dist/css/nice-select2.css';
// or
@import '~nice-select2/src/scss/nice-select2.scss';
```

Finally, initialize the plugin.

```javascript
  NiceSelect.bind(document.getElementById("#a-select"));
```

Full documentation and examples at [https://bluzky.github.io/nice-select2/](https://bluzky.github.io/nice-select2/).
