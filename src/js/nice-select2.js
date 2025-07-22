import "../scss/nice-select2.scss";

// utility functions
// utility functions
function triggerClick(el) {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: false,
  });
  el.dispatchEvent(event);
}

function triggerChange(el) {
  const event = new Event("change", {
    bubbles: true,
    cancelable: false,
  });
  el.dispatchEvent(event);
}

function triggerFocusIn(el) {
  const event = new FocusEvent("focusin", {
    bubbles: true,
    cancelable: false,
  });
  el.dispatchEvent(event);
}

function triggerFocusOut(el) {
  const event = new FocusEvent("focusout", {
    bubbles: true,
    cancelable: false,
  });
  el.dispatchEvent(event);
}

function triggerModalOpen(el) {
  const event = new UIEvent("modalopen", {
    bubbles: true,
    cancelable: false,
  });
  el.dispatchEvent(event);
}

function triggerModalClose(el) {
  const event = new UIEvent("modalclose", {
    bubbles: true,
    cancelable: false,
  });
  el.dispatchEvent(event);
}

function triggerValidationMessage(el, type) {
  if(type == 'invalid'){
    addClass(this.dropdown, 'invalid');
    removeClass(this.dropdown, 'valid');
  }else{
    addClass(this.dropdown, 'valid');
    removeClass(this.dropdown, 'invalid');
  }
}

function attr(el, key) {
  if(el[key] != undefined){
    return el[key];
  }
  return el.getAttribute(key);
}

function data(el, key) {
  return el.getAttribute("data-" + key);
}

function hasClass(el, className) {
  if (el){
    return el.classList.contains(className);
  }else{
    return false;
  }
}

function addClass(el, className) {
  if (el) return el.classList.add(className);
}

function removeClass(el, className) {
  if (el) return el.classList.remove(className);
}

var defaultOptions = {
  data: null,
  searchable: false,
  showSelectedItems: true
};

export default function NiceSelect(element, options) {
  this.el               = element;
  this.config           = Object.assign({}, defaultOptions, options || {});
  this.data             = this.config.data;
  this.selectedOptions  = [];

  this.placeholder      = attr(this.el, "placeholder") || this.config.placeholder || "Select an option";
  this.searchtext       = attr(this.el, "searchtext") || this.config.searchtext || "Search";
  this.selectedtext     = attr(this.el, "selectedtext") || this.config.selectedtext || "selected";

  this.dropdown         = null;
  this.multiple         = attr(this.el, "multiple");
  this.disabled         = attr(this.el, "disabled");

  this.create();
}

NiceSelect.prototype.create = function() {
  this.el.style.opacity   = "0";
  this.el.style.width     = "0";
  this.el.style.padding   = "0";
  this.el.style.height    = "0";
  this.el.style.fontSize  = "0";
  if (this.data) {
    this.processData(this.data);
  } else {
    this.extractData();
  }

  this.renderDropdown();
  this.bindEvent();
};

NiceSelect.prototype.processData = function(data) {
  var options = [];
  data.forEach(item=> {
    options.push({
      data: item,
      attributes: {
        selected: !!item.selected,
        disabled: !!item.disabled,
		    optgroup: item.value == 'optgroup'
      }
    });
  });
  this.options = options;
};

NiceSelect.prototype.extractData = function() {
  var options         = this.el.querySelectorAll("option,optgroup");
  var data            = [];
  var allOptions      = [];
  var selectedOptions = [];

  options.forEach(item => {
    if(item.tagName == 'OPTGROUP'){
      var itemData = {
        text: item.label,
        value: 'optgroup'
      };
    }else{
      let text  = item.innerText;
      if(item.dataset.display != undefined){
        text  = item.dataset.display;
      }

      var itemData = {
        text:     text,
        value:    item.value,
        extra:    item.dataset.extra,
        selected: item.getAttribute("selected") != null,
        disabled: item.getAttribute("disabled") != null
      };
    }

    var attributes = {
      selected: item.getAttribute("selected") != null,
      disabled: item.getAttribute("disabled") != null,
	    optgroup: item.tagName == 'OPTGROUP'
    };

    data.push(itemData);
    allOptions.push({ data: itemData, attributes: attributes });
  });

  this.data     = data;
  this.options  = allOptions;
  this.options.forEach(item => {
    if (item.attributes.selected){
      selectedOptions.push(item);
    }
  });

  this.selectedOptions = selectedOptions;
};

NiceSelect.prototype.renderDropdown = function() {
  var classes = [
    "nice-select",
    attr(this.el, "class") || "",
    this.disabled ? "disabled" : "",
    this.multiple ? "has-multiple" : ""
  ];

  let searchHtml = `<div class="nice-select-search-box">`;
    searchHtml  += `<input type="text" class="nice-select-search" placeholder="${this.searchtext}..." title="search"/>`;
  searchHtml  += `</div>`;

  var html = `<div class="${classes.join(" ")}" tabindex="${this.disabled ? null : 0}">`;
      html += `<span class="${this.multiple ? "multiple-options" : "current"}"></span>`;
      html += `<div class="nice-select-dropdown">`;
        html += `${this.config.searchable ? searchHtml : ""}`;
        html += `<ul class="list"></ul>`;
      html += `</div>`;
  html += `</div>`;

  this.el.insertAdjacentHTML("afterend", html);

  this.dropdown = this.el.nextElementSibling;

  this._renderSelectedItems();
  this._renderItems();
};

NiceSelect.prototype._renderSelectedItems = function() { 
  if (this.multiple) {
    let selectedHtml = "";

    if(window.getComputedStyle(this.dropdown).width == 'auto' || this.selectedOptions.length < 2){
      this.selectedOptions.forEach( (item, index, array) => {
        let text  = item.data.text;
        if(index !== array.length -1 ){
          text += `, `;
        }

        selectedHtml += `<span class="current">${text}</span>`;
      });

      selectedHtml = selectedHtml == "" ? this.placeholder : selectedHtml;
    }else{
      selectedHtml = this.selectedOptions.length+' '+this.selectedtext;
    }
	
    this.dropdown.querySelector(".multiple-options").innerHTML = selectedHtml;
  } else {
    let html = this.selectedOptions.length > 0 ? this.selectedOptions[0].data.text : this.placeholder;

    this.dropdown.querySelector(".current").innerHTML = html;
  }
};

NiceSelect.prototype._renderItems = function() {
  var ul = this.dropdown.querySelector("ul");

  this.options.forEach(item => {
    if(this.multiple && this.config.showSelectedItems){
      this._multipleListAdd(item);
    }
    
    ul.appendChild(this._renderItem(item));
  });
};

NiceSelect.prototype._renderItem = function(option) {
  var el        = document.createElement("li");

  el.innerHTML  = option.data.text;

  if(option.data.extra != undefined) {
    el.appendChild(this._renderItemExtra(option.data.extra));
  }

  if(option.attributes.optgroup){
	  addClass(el, 'optgroup');
  }else{
    el.setAttribute("data-value", option.data.value);
    var classList = [
      "option",
      option.attributes.selected ? "selected" : null,
      option.attributes.disabled ? "disabled" : null,
    ];
    
    el.addEventListener("click", this._onItemClicked.bind(this, option));
    el.classList.add(...classList);
  }

  option.element = el;
  return el;
};

NiceSelect.prototype._renderItemExtra = function(content) {
  var el = document.createElement("span");
  el.innerHTML = content;
  addClass(el, "extra");
  return el;
}

NiceSelect.prototype.update = function() {
  this.extractData();
  if (this.dropdown) {
    var open = hasClass(this.dropdown, "open");
    this.dropdown.parentNode.removeChild(this.dropdown);
    this.create();

    if (open) {
      triggerClick(this.dropdown);
    }
  }

  if(attr(this.el, "disabled")) {
    this.disable();
  } else {
    this.enable();
  }
};

NiceSelect.prototype.disable = function() {
  if (!this.disabled) {
    this.disabled = true;
    addClass(this.dropdown, "disabled");
  }
};

NiceSelect.prototype.enable = function() {
  if (this.disabled) {
    this.disabled = false;
    removeClass(this.dropdown, "disabled");
  }
};

NiceSelect.prototype.clear = function() {
  this.resetSelectValue();
  this.selectedOptions = [];

  this._renderSelectedItems();
  this.update();

  triggerChange(this.el);
};

NiceSelect.prototype.destroy = function() {
  if (this.dropdown) {
    this.dropdown.parentNode.removeChild(this.dropdown);
    this.el.style.display = "";
  }
};

NiceSelect.prototype.bindEvent = function() {
  this.dropdown.addEventListener("click", this._onClicked.bind(this));
  this.dropdown.addEventListener("keydown", this._onKeyPressed.bind(this));
  this.dropdown.addEventListener("focusin", triggerFocusIn.bind(this, this.el));
  this.dropdown.addEventListener("focusout", triggerFocusOut.bind(this, this.el));
  this.el.addEventListener("invalid", triggerValidationMessage.bind(this, this.el, 'invalid'));
  window.addEventListener("click", this._onClickedOutside.bind(this));

  if (this.config.searchable) {
    this._bindSearchEvent();
  }
};

NiceSelect.prototype._bindSearchEvent = function() {
  var searchBox = this.dropdown.querySelector(".nice-select-search");
  if (searchBox){
    searchBox.addEventListener("click", function(e) {
      e.stopPropagation();
      return false;
    });
  }

  searchBox.addEventListener("input", this._onSearchChanged.bind(this));
};

NiceSelect.prototype._onClicked = function(e) {
  e.preventDefault();
	if (!hasClass(this.dropdown, "open") ) {
		addClass(this.dropdown, "open");
    triggerModalOpen(this.el);
	} else {
		if (this.multiple) {
		  if (e.target == this.dropdown.querySelector('.multiple-options')) {
			 removeClass(this.dropdown, "open");
			 triggerModalClose(this.el);
		  }

		} else {
		   removeClass(this.dropdown, "open");
		   triggerModalClose(this.el);
		}
	}

  if (hasClass(this.dropdown, "open")) {
    var search = this.dropdown.querySelector(".nice-select-search");
    if (search) {
      search.value = "";
      search.focus();
    }

    var t = this.dropdown.querySelector(".focus");
    removeClass(t, "focus");
    t = this.dropdown.querySelector(".selected");
    addClass(t, "focus");
    this.dropdown.querySelectorAll("ul li").forEach(function(item) {
      item.style.display = "";
    });
  } else {
    this.dropdown.focus();
  }
};

NiceSelect.prototype._onItemClicked = function(option, e) {
  var optionEl = e.target;

  if (!hasClass(optionEl, "disabled")) {
    if (this.multiple) {
      if (hasClass(optionEl, "selected")) {
        removeClass(optionEl, "selected");
        this.selectedOptions.splice(this.selectedOptions.indexOf(option), 1);
        var opt = this.el.querySelector(`option[value="${optionEl.dataset.value}"]`);
        opt.removeAttribute('selected');
        opt.selected = false;

        this._multipleListRemove(option);
	    }else{
        addClass(optionEl, "selected");
        this.selectedOptions.push(option);

        if(this.config.showSelectedItems){
          option.attributes.selected = true;
          this._multipleListAdd(option);
        }
      }
    } else {
      this.options.forEach(function (item) {
        removeClass(item.element, "selected");
      });
      this.selectedOptions.forEach(function (item) {
        removeClass(item.element, "selected");
      });

      addClass(optionEl, "selected");
      this.selectedOptions = [option];
    }

    this._renderSelectedItems();
    this.updateSelectValue();
  }
};

NiceSelect.prototype.setValue = function(value){

    var select = this.el,noSelected = true,currentValue;
    if(select.multiple){
        for(var i = 0; i < value.length; i++){
            value[i] = String(value[i]);
        }
    }    
    
    for(var opt of select.options){
        if(select.multiple){
            if(value.indexOf(opt.value) > -1){ //-- expect Array like [1,2,3]
                currentValue = opt.value;
            }else{
                currentValue = null;
            }
        }else{
            currentValue = value;
        }
            
        if(opt.value == currentValue && !opt.disabled){
            if(noSelected){
                select.value = currentValue;
                noSelected = false;
            }
            opt.setAttribute('selected',true);
            opt.selected = true;
        }else{
            opt.removeAttribute('selected');
            delete(opt.selected);
        }
    }
    if(noSelected && !select.multiple){
        select.options[0].setAttribute('selected',true);
        select.options[0].selected = true;
        select.value = select.options[0].value;
    }
    
    this.update();
}

NiceSelect.prototype.getValue = function(){
    var select = this.el;
    if(!select.multiple){
        return select.value;
    }
    
    //-- multiple
    var values = [];
    for(var opt of select.options){
        if(opt.selected){
            values.push(opt.value);
        }
    }
    return values;
}

NiceSelect.prototype.updateSelectValue = function() {
  if (this.multiple) {
    let select = this.el;
    this.selectedOptions.forEach( item => {
      let el = select.querySelector(`option[value="${item.data.value}"]`);
      if (el){
        el.setAttribute("selected", true);
      }else{
        console.error("Option not found, does it have a value?");
      }
    });
  } else if (this.selectedOptions.length > 0) {
    this.el.value = this.selectedOptions[0].data.value;
  }
  triggerChange(this.el);
};

NiceSelect.prototype.resetSelectValue = function() {
  if (this.multiple) {
    var select = this.el;
    this.selectedOptions.forEach(function(item) {
      var el = select.querySelector(`option[value="${item.data.value}"]`);
      if (el){
        el.removeAttribute("selected");
        delete(el.selected);
      }
    });
  } else if (this.selectedOptions.length > 0) {
    this.el.selectedIndex = -1;
  }

  triggerChange(this.el);
};

NiceSelect.prototype._onClickedOutside = function(e) {
  if (!this.dropdown.contains(e.target)) {
    removeClass(this.dropdown, "open");
    triggerModalClose(this.el);
  }
};

NiceSelect.prototype._onKeyPressed = function(e) {
  // Keyboard events

  var focusedOption = this.dropdown.querySelector(".focus");

  var open = hasClass(this.dropdown, "open");

  // Enter
  if (e.keyCode == 13) {
    if (open) {
      triggerClick(focusedOption);
    } else {
      triggerClick(this.dropdown);
    }
  } else if (e.keyCode == 40) {
    // Down
    if (!open) {
      triggerClick(this.dropdown);
    } else {
      var next = this._findNext(focusedOption);
      if (next) {
        var t = this.dropdown.querySelector(".focus");
        removeClass(t, "focus");
        addClass(next, "focus");
      }
    }
    e.preventDefault();
  } else if (e.keyCode == 38) {
    // Up
    if (!open) {
      triggerClick(this.dropdown);
    } else {
      var prev = this._findPrev(focusedOption);
      if (prev) {
        var t = this.dropdown.querySelector(".focus");
        removeClass(t, "focus");
        addClass(prev, "focus");
      }
    }
    e.preventDefault();
  } else if (e.keyCode == 27 && open) {
    // Esc
    triggerClick(this.dropdown);
  } else if(e.keyCode === 32 && open) {
    // Space
    return false; 
  }
  return false;
};

NiceSelect.prototype._findNext = function(el) {
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

NiceSelect.prototype._findPrev = function(el) {
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

NiceSelect.prototype._onSearchChanged = function(e) {
  var open = hasClass(this.dropdown, "open");
  var text = e.target.value;
  text = text.toLowerCase();

  if (text == "") {
    this.options.forEach(function(item) {
      item.element.style.display = "";
    });
  } else if (open) {
    var matchReg = new RegExp(text);
    this.options.forEach(function(item) {
      var optionText              = item.data.text.toLowerCase();
      var matched                 = matchReg.test(optionText);
      item.element.style.display  = matched ? "" : "none";
    });
  }

  this.dropdown.querySelectorAll(".focus").forEach(function(item) {
    removeClass(item, "focus");
  });

  var firstEl = this._findNext(null);
  addClass(firstEl, "focus");
};

NiceSelect.prototype._multipleListAdd = function (option) {
  
  if(option.data.disabled || option.data.value == "" || !option.attributes.selected){
    return;
  }

  let ul      = this.el.parentElement.querySelector('.select-selection-list');

  if(ul == null){
    ul	 		= document.createElement('ul');
	  ul.classList.add('select-selection-list');

    this.el.after(ul);
  }else if(ul.querySelector(`[data-value="${option.data.value}"]`) != null){
    return;
  }

	let li	 		= document.createElement('li');
	li.classList.add('select-selection');

  li.dataset.value = option.data.value;

	let html	  = `
    <button type="button" class="small remove-select-selection">
      <span class='remove-select-selection'>×</span>
    </button>
  `;

	// Add
	html   += `<span class='selected-name'>${option.data.text}</span>`

	li.innerHTML	= html;

	ul.appendChild(li);

  li.querySelectorAll('.remove-select-selection').forEach(el=> el.addEventListener("click", this._multipleListRemove.bind(this)));
}

NiceSelect.prototype._multipleListRemove = function (target) {

  if(target.target != null){
    target  = target.target;
  }

  if(target.data == undefined){
    target.closest('li.select-selection').remove();

    let parent  = target.closest('li.select-selection');

    this.selectedOptions.forEach(option => {
      if(option.data.value == parent.dataset.value){
        removeClass(option.element, "selected");
        this.selectedOptions.splice(this.selectedOptions.indexOf(option), 1);
        var opt = this.el.querySelector(`option[value="${option.data.value}"]`);
        opt.removeAttribute('selected');
        opt.selected = false;
      }

      this._renderSelectedItems();
    })

    return;
  }

  if(target.element.classList.contains('selected')){
    console.log(target);
    return;
  }

  let parent  = this.el.parentElement;
  
  let ul      = parent.querySelector('.select-selection-list');
  
  target  = ul.querySelector(`[data-value="${target.data.value}"]`);

  if(ul != null && target != null){
    target.remove();
  }

}

export function bind(el, options) {
  return new NiceSelect(el, options);
}
