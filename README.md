# Nice Select

A lightweight Vanilla JavaScript plugin that replaces native select elements with customizable dropdowns.

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
<link rel="stylesheet" href="path/to/nice-select2.css" />
```

Or import nice-select2 using ES6 syntax

```js
import NiceSelect from "nice-select2";
```

```scss
@import "~nice-select2/dist/css/nice-select2.css";
// or
@import "~nice-select2/src/scss/nice-select2.scss";
```

Finally, initialize the plugin.

Using the minimified file directly:
```javascript
NiceSelect.bind(document.getElementById("a-select"), {searchable: true});
```

Using as import in webpack:
```javascript
new NiceSelect(document.getElementById("a-select"), {searchable: true});
```

## Instance method

- `update()` : update nice-select items to match with source select
- `focus()`: open dropdown list and focus on the search box if search is enabled
- `disable()`: disable select
- `enable()`: enable select
- `destroy()`: destroy NiceSelect2 instance
- `clear()`: clear all selected options

Full documentation and examples at [https://bluzky.github.io/nice-select2/](https://bluzky.github.io/nice-select2/).
