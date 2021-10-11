import "../scss/nice-select2.scss";

// utility functions
function triggerEvent(el, event) {
  if (!event) {
    event = document.createEvent("MouseEvents");
    event.initEvent("click", true, false);
  }
  el.dispatchEvent(event);
}

function triggerChange(el) {
  var event = document.createEvent("HTMLEvents");
  event.initEvent("change", true, false);
  el.dispatchEvent(event);
}

function attr(el, key) {
  return el.getAttribute(key);
}

function data(el, key) {
  return el.getAttribute("data-" + key);
}

function hasClass(el, className) {
  if (el) return el.classList.contains(className);
  else return false;
}

function addClass(el, className) {
  if (el) return el.classList.add(className);
}

function removeClass(el, className) {
  if (el) return el.classList.remove(className);
}

function isScrolledIntoView(ele, container) {
  const { bottom, height, top } = ele.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return top >= containerRect.top && bottom <= containerRect.bottom;
}

var defaultOptions = {
  data: null,
  searchable: false,
};

function NiceSelect(element, options) {
  this.el = element;
  this.config = Object.assign({}, defaultOptions, options || {});

  this.data = this.config.data;
  this.selectedOptions = [];

  this.placeholder =
    attr(this.el, "placeholder") ||
    this.config.placeholder ||
    "Select an option";

  this.dropdown = null;
  this.multiple = attr(this.el, "multiple");
  this.disabled = attr(this.el, "disabled");

  this.create();
}

NiceSelect.prototype.create = function () {
  this.el.style.display = "none";

  if (this.data) {
    this.processData(this.data);
  } else {
    this.extractData();
  }

  this.renderDropdown();
  this.bindEvent();
};

NiceSelect.prototype.processData = function (data) {
  var options = [];
  data.forEach(function (item) {
    options.push({
      data: item,
      attributes: {
        selected: false,
        disabled: false,
        display: true,
      },
    });
  });
  this.options = options;
};

NiceSelect.prototype.extractData = function () {
  var options = this.el.querySelectorAll("option");
  var data = [];
  var allOptions = [];
  var selectedOptions = [];

  options.forEach((item) => {
    var itemData = {
      text: item.innerText,
      value: item.value,
    };

    var attributes = {
      selected:
        item.getAttribute("selected") != null || item.value == this.el.value,
      disabled: item.getAttribute("disabled") != null,
      display: true,
    };

    data.push(itemData);
    allOptions.push({ data: itemData, attributes: attributes });
  });

  this.data = data;
  this.options = allOptions;
  this.options.forEach(function (item) {
    if (item.attributes.selected) selectedOptions.push(item);
  });

  this.selectedOptions = selectedOptions;
};

NiceSelect.prototype.renderDropdown = function () {
  var classes = [
    "nice-select",
    attr(this.el, "class") || "",
    this.disabled ? "disabled" : "",
    this.multiple ? "has-multiple" : "",
  ];

  let searchHtml = `<div class="nice-select-search-box">
<input type="text" class="nice-select-search" placeholder="Search..."/>
</div>`;

  var html = `<div class="${classes.join(" ")}" tabindex="${
    this.disabled ? null : 0
  }">
  <span class="${this.multiple ? "multiple-options" : "current"}"></span>
  <div class="nice-select-dropdown">
  ${this.config.searchable ? searchHtml : ""}
  <ul class="list"></ul>
  </div></div>
`;

  this.el.insertAdjacentHTML("afterend", html);

  this.dropdown = this.el.nextElementSibling;
  this._renderSelectedItems();
  this._renderItems();
};

NiceSelect.prototype._renderSelectedItems = function () {
  if (this.multiple) {
    var selectedHtml = "";

    this.selectedOptions.forEach(function (item) {
      selectedHtml += `<span class="current">${item.data.text}</span>`;
    });
    selectedHtml = selectedHtml == "" ? this.placeholder : selectedHtml;

    this.dropdown.querySelector(".multiple-options").innerHTML = selectedHtml;
  } else {
    var html =
      this.selectedOptions.length > 0
        ? this.selectedOptions[0].data.text
        : this.placeholder;

    this.dropdown.querySelector(".current").innerHTML = html;
  }
};

NiceSelect.prototype._renderItems = function () {
  var ul = this.dropdown.querySelector("ul");
  ul.scrollTop = 0;
  ul.innerHTML = "";
  this.options.forEach((item) => {
    if (item.display) {
      ul.appendChild(this._renderItem(item));
    }
  });
};

NiceSelect.prototype._renderItem = function (option) {
  var el = document.createElement("li");
  el.setAttribute("data-value", option.data.value);

  var classList = [
    "option",
    option.attributes.selected ? "selected" : null,
    option.attributes.disabled ? "disabled" : null,
  ];

  el.classList.add(...classList);
  el.innerHTML = option.data.text;
  el.addEventListener("click", (e) => this._onItemSelected(option, e));
  el.addEventListener("select", (e) => this._onItemSelected(option, e));
  option.element = el;
  return el;
};

NiceSelect.prototype.update = function () {
  this.extractData();
  if (this.dropdown) {
    var open = hasClass(this.dropdown, "open");
    this.dropdown.parentNode.removeChild(this.dropdown);
    this.create();

    if (open) {
      triggerEvent(this.dropdown);
    }
  }
};

NiceSelect.prototype.focus = function () {
  this.dropdown.classList.toggle("open");
  this.dropdown.querySelector("ul").scrollTop = 0;

  if (this.dropdown.classList.contains("open")) {
    var search = this.dropdown.querySelector(".nice-select-search");
    if (search) {
      search.value = "";
      search.focus();
    }

    var t = this.dropdown.querySelector(".focus");
    removeClass(t, "focus");
    t = this.dropdown.querySelector(".selected");
    addClass(t, "focus");
    for (let i = 0; i < this.options.length; i++) {
      this.options[i].display = true;
    }
    this._renderItems();
  } else {
    this.dropdown.focus();
  }
};

NiceSelect.prototype.disable = function () {
  if (!this.disabled) {
    this.disabled = true;
    addClass(this.dropdown, "disabled");
  }
};

NiceSelect.prototype.enable = function () {
  if (this.disabled) {
    this.disabled = false;
    removeClass(this.dropdown, "disabled");
  }
};

NiceSelect.prototype.clear = function () {
  this.selectedOptions = [];
  this._renderSelectedItems();
  this.updateSelectValue();
  triggerChange(this.el);
};

NiceSelect.prototype.destroy = function () {
  if (this.dropdown) {
    this.dropdown.parentNode.removeChild(this.dropdown);
    this.el.style.display = "";
  }
};

NiceSelect.prototype.bindEvent = function () {
  var $this = this;
  this.dropdown.addEventListener("click", this._onClicked.bind(this));
  this.dropdown.addEventListener("keydown", this._onKeyPressed.bind(this));
  window.addEventListener("click", this._onClickedOutside.bind(this));

  if (this.config.searchable) {
    this._bindSearchEvent();
  }
};

NiceSelect.prototype._bindSearchEvent = function () {
  var searchBox = this.dropdown.querySelector(".nice-select-search");
  if (searchBox)
    searchBox.addEventListener("click", function (e) {
      e.stopPropagation();
      return false;
    });

  searchBox.addEventListener("input", this._onSearchChanged.bind(this));
};

NiceSelect.prototype._onClicked = function (e) {
  this.focus();
};

NiceSelect.prototype._onItemSelected = function (option, e) {
  e = e.detail || e;
  var optionEl = e.target;

  if (!hasClass(optionEl, "disabled")) {
    this.dropdown.classList.remove("open");
    if (this.multiple) {
      if (!hasClass(optionEl, "selected")) {
        addClass(optionEl, "selected");
        this.selectedOptions.push(option);
      }
    } else {
      this.selectedOptions.forEach(function (item) {
        removeClass(item.element, "selected");
      });

      addClass(optionEl, "selected");
      this.selectedOptions = [option];
    }

    this.dispatchOnChanged(e);

    this._renderSelectedItems();
    this.updateSelectValue();
  }
};

NiceSelect.prototype.dispatchOnChanged = function (e) {
  if (this.config.onChanged) {
    let values = this.selectedOptions.map((e) => e.data.value);
    this.config.onChanged(values, e);
  }
};

NiceSelect.prototype.updateSelectValue = function () {
  if (this.multiple) {
    this.selectedOptions.each(function (item) {
      var el = this.el.querySelector('option[value="' + item.data.value + '"]');
      if (el) el.setAttribute("selected", true);
    });
  } else if (this.selectedOptions.length > 0) {
    this.el.value = this.selectedOptions[0].data.value;
  }
  triggerChange(this.el);
};

NiceSelect.prototype._onClickedOutside = function (e) {
  if (!this.dropdown.contains(e.target)) {
    this.dropdown.classList.remove("open");
  }
};

NiceSelect.prototype._onKeyPressed = function (e) {
  e.preventDefault();
  // Keyboard events
  var focusedOption = this.dropdown.querySelector(".focus");

  var open = this.dropdown.classList.contains("open");

  // Space or Enter
  if (e.keyCode == 13) {
    if (open) {
      let event = new CustomEvent("select", {
        detail: e,
      });
      triggerEvent(focusedOption, event);
    } else {
      triggerEvent(this.dropdown);
    }
  } else if (e.keyCode == 40) {
    // Down
    if (!open) {
      triggerEvent(this.dropdown);
    } else {
      var next = this._findNext(focusedOption);
      if (next) {
        var t = this.dropdown.querySelector(".focus");
        removeClass(t, "focus");
        addClass(next, "focus");
        if (!isScrolledIntoView(next, next.parentElement)) {
          next.parentElement.scrollTop += next.offsetHeight;
        }
      }
    }
    e.preventDefault();
  } else if (e.keyCode == 38) {
    // Up
    if (!open) {
      triggerEvent(this.dropdown);
    } else {
      var prev = this._findPrev(focusedOption);
      if (prev) {
        var t = this.dropdown.querySelector(".focus");
        removeClass(t, "focus");
        addClass(prev, "focus");
        if (!isScrolledIntoView(prev, prev.parentElement)) {
          prev.parentElement.scrollTop -= prev.offsetHeight;
        }
      }
    }
    e.preventDefault();
  } else if (e.keyCode == 27 && open) {
    // Esc
    triggerEvent(this.dropdown);
  }
  return false;
};

NiceSelect.prototype._findNext = function (el) {
  if (el) {
    el = el.nextElementSibling;
  } else {
    el = this.dropdown.querySelector(".list .option");
  }

  while (el) {
    if (!hasClass(el, "disabled") && el.style.display != "none") {
      return el;
    }
    el = el.nextElementSibling;
  }

  return null;
};

NiceSelect.prototype._findPrev = function (el) {
  if (el) {
    el = el.previousElementSibling;
  } else {
    el = this.dropdown.querySelector(".list .option:last-child");
  }

  while (el) {
    if (!hasClass(el, "disabled") && el.style.display != "none") {
      return el;
    }
    el = el.previousElementSibling;
  }

  return null;
};

NiceSelect.prototype._onSearchChanged = function (e) {
  e.preventDefault();
  var open = this.dropdown.classList.contains("open");
  var text = e.target.value;
  text = text.toLowerCase();

  if (text == "") {
    this.options.forEach(function (item) {
      item.display = true;
    });
    this._renderItems();
  } else if (open) {
    var matchReg = new RegExp(text);
    this.options.forEach(function (item) {
      var optionText = item.data.text.toLowerCase();
      var matched = matchReg.test(optionText);
      item.display = matched;
    });
    this._renderItems();
  }

  this.dropdown.querySelectorAll(".focus").forEach(function (item) {
    removeClass(item, "focus");
  });

  var firstEl = this._findNext(null);
  addClass(firstEl, "focus");
};

export function bind(el, options) {
  return new NiceSelect(el, options);
}
