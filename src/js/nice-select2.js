import "../scss/nice-select2.scss";

const triggerEvent      = (el, type, init = {}) => {
  let EventConstructor;
  if (type === "click") {
    EventConstructor = MouseEvent;
  } else if (type === "change") {
    EventConstructor = Event;
  } else if (type.includes("focus")) {
    EventConstructor = FocusEvent;
  } else {
    EventConstructor = UIEvent;
  }
  const event = new EventConstructor(type, {
    bubbles: true,
    cancelable: false,
    ...init,
  });
  el.dispatchEvent(event);
};

const triggerClick      = (el) => triggerEvent(el, "click");
const triggerChange     = (el) => triggerEvent(el, "change");
const triggerFocusIn    = (el) => triggerEvent(el, "focusin");
const triggerFocusOut   = (el) => triggerEvent(el, "focusout");
const triggerModalOpen  = (el) => triggerEvent(el, "modalopen");
const triggerModalClose = (el) => triggerEvent(el, "modalclose");

const attr              = (el, key) => el[key] !== undefined ? el[key] : el.getAttribute(key);
const data              = (el, key) => el.getAttribute("data-" + key);
const hasClass          = (el, className) => el?.classList.contains(className);
const addClass          = (el, className) => el?.classList.add(className);
const removeClass       = (el, className) => el?.classList.remove(className);

const defaultOptions = {
  data: null,
  searchable: true,
  showSelectedItems: true,
  placeholder: "Select an option",
  searchtext: "Search",
  selectedtext: "selected",
};

class NiceSelect {
  constructor(element, options = {}) {
    if (!element) {
      throw new Error('No element provided to NiceSelect');
    }

    if (!(element instanceof Element)) {
      throw new Error('Invalid element provided to NiceSelect - must be a valid DOM element');
    }

    this.el               = element;
    this.config           = { ...defaultOptions, ...options };
    this.data             = this.config.data;
    this.selectedOptions  = [];
    this.placeholder      = attr(this.el, "placeholder") || this.config.placeholder;
    this.searchtext       = attr(this.el, "searchtext") || this.config.searchtext;
    this.selectedtext     = attr(this.el, "selectedtext") || this.config.selectedtext;
    this.dropdown         = null;
    this.selectionList    = null;
    this.multiple         = attr(this.el, "multiple");
    this.disabled         = attr(this.el, "disabled");
    this.create();
  }

  create() {
    Object.assign(this.el.style, {
      opacity: "0",
      width: "0",
      padding: "0",
      height: "0",
      fontSize: "0",
      minHeight: "auto",
    });

    this.data ? this.processData(this.data) : this.extractData();
    this.renderDropdown();
    this.bindEvent();
  }

  processData(data) {
    this.options = data.map((item) => ({
      data: item,
      attributes: {
        selected: !!item.selected,
        disabled: !!item.disabled,
        optgroup: item.value === "optgroup",
      },
    }));
  }

  extractData() {
    const options = Array.from(this.el.querySelectorAll("option,optgroup"));
    const allOptions = [];
    const selectedOptions = [];

    this.data = options.map((item) => {
      let itemData;

      if (item.tagName === "OPTGROUP") {
        itemData = { text: item.label, value: "optgroup" };
      } else {
        const text = item.dataset.display ?? item.innerText;
        itemData = {
          text,
          value: item.value,
          extra: item.dataset.extra,
          selected: item.hasAttribute("selected"),
          disabled: item.hasAttribute("disabled"),
        };
      }

      const attributes = {
        selected: item.hasAttribute("selected"),
        disabled: item.hasAttribute("disabled"),
        optgroup: item.tagName === "OPTGROUP",
      };

      const optionObj = { data: itemData, attributes, element: null };

      allOptions.push(optionObj);

      if (attributes.selected) selectedOptions.push(optionObj);

      return itemData;
    });

    this.options          = allOptions;
    this.selectedOptions  = selectedOptions;
  }

  renderDropdown() {
    const classes = [
      "nice-select",
      attr(this.el, "class") || "",
      this.disabled ? "disabled" : "",
      this.multiple ? "has-multiple" : "",
    ].filter(Boolean);

    const searchHtml = this.config.searchable
      ? `
      <div class="nice-select-search-box">
        <input type="text" class="nice-select-search" placeholder="${this.searchtext}..." title="search"/>
      </div>
    `
      : "";

    const html = `
      <div class="${classes.join(" ")}" tabindex="${this.disabled ? "" : 0}">
        <span class="${this.multiple ? "multiple-options" : "current"}"></span>
        <div class="nice-select-dropdown">
          ${searchHtml}
          <ul class="list"></ul>
        </div>
      </div>
    `;

    this.el.insertAdjacentHTML("afterend", html);

    this.dropdown = this.el.nextElementSibling;

    this._renderSelectedItems();

    this._renderItems();
  }

  _renderSelectedItems() {
    if (this.multiple) {
      let selectedHtml = "";

      if (
        window.getComputedStyle(this.dropdown).width === "auto" ||
        this.selectedOptions.length < 2
      ) {
        this.selectedOptions.forEach( (item, index, array) => {
          let text  = item.data.text;

          if(index !== array.length -1 ){
            text += `, `;
          }

          selectedHtml += `<span class="current">${text}</span>`;
        });

        selectedHtml = selectedHtml || this.placeholder;
      } else {
        selectedHtml = `${this.selectedOptions.length} ${this.selectedtext}`;
      }

      this.dropdown.querySelector(".multiple-options").innerHTML = selectedHtml;
    } else {
      const html =
        this.selectedOptions.length > 0
          ? this.selectedOptions[0].data.text
          : this.placeholder;

      this.dropdown.querySelector(".current").innerHTML = html;
    }
  }

  _renderItems() {
    const ul = this.dropdown.querySelector("ul");

    this.options.forEach((item) => {

      if(this.multiple && this.config.showSelectedItems){
        this._multipleListAdd(item);
      }

      ul.appendChild(this._renderItem(item));
    });
  }

  _renderItem(option) {
    const li      = document.createElement("li");
    li.innerHTML  = option.data.text;

    if (option.data.extra !== undefined) {
      li.appendChild(this._renderItemExtra(option.data.extra));
    }

    if (option.attributes.optgroup) {
      addClass(li, "optgroup");
    } else {
      li.setAttribute("data-value", option.data.value);
      const classList = ["option"];
      if (option.attributes.selected) classList.push("selected");
      if (option.attributes.disabled) classList.push("disabled");
      li.classList.add(...classList);
      li.addEventListener("click", (e) => this._onItemClicked(option, e));
    }

    option.element = li;

    return li;
  }

  _renderItemExtra(content) {
    const span      = document.createElement("span");
    span.innerHTML  = content;
    addClass(span, "extra");

    return span;
  }

  update() {
    this.extractData();

    if (this.dropdown) {
      const open = hasClass(this.dropdown, "open");
      this.dropdown.remove();
      this.create();
      if (open) {
        triggerClick(this.dropdown);
      }
    }

    attr(this.el, "disabled") ? this.disable() : this.enable();
  }

  disable() {
    if (!this.disabled) {
      this.disabled = true;
      addClass(this.dropdown, "disabled");
    }
  }

  enable() {
    if (this.disabled) {
      this.disabled = false;
      removeClass(this.dropdown, "disabled");
    }
  }

  clear() {
    this.resetSelectValue();
    this.selectedOptions = [];
    this._renderSelectedItems();
    this.update();
    triggerChange(this.el);
  }

  destroy() {
    if(this.selectionList){
      this.selectionList.remove();
    }

    if (this.dropdown) {
      this.dropdown.remove();
      this.el.style.display   = "";
      this.el.style.opacity   = '';
      this.el.style.width     = '';
      this.el.style.padding   = '';
      this.el.style.height    = '';
      this.el.style.fontSize  = '';
      this.el.style.minHeight = '';
    }
  }

  focus(target=''){
    const isOpen = hasClass(this.dropdown, "open");

    if (!isOpen) {
      addClass(this.dropdown, "open");
      triggerModalOpen(this.el);
    } else {
      if (this.multiple) {
        if (target === this.dropdown.querySelector(".multiple-options")) {
          removeClass(this.dropdown, "open");
          triggerModalClose(this.el);
        }
      } else {
        removeClass(this.dropdown, "open");
        triggerModalClose(this.el);
      }
    }

    if (hasClass(this.dropdown, "open")) {
      const search = this.dropdown.querySelector(".nice-select-search");

      if (search) {
        search.value = "";
        search.focus();
      }

      const focused = this.dropdown.querySelector(".focus");

      if (focused) removeClass(focused, "focus");

      const selected = this.dropdown.querySelector(".selected");
      if (selected) addClass(selected, "focus");

      this.dropdown
        .querySelectorAll("ul li")
        .forEach((item) => (item.style.display = ""));
    } else {
      this.dropdown.focus();
    }
  }

  updateSelect(){
    console.log('test');
    this.update();
  }

  bindEvent() {
    this.dropdown.addEventListener("click", (e) => this._onClicked(e));
    this.dropdown.addEventListener("keydown", (e) => this._onKeyPressed(e));
    this.dropdown.addEventListener("focusin", () => triggerFocusIn(this.el));
    this.dropdown.addEventListener("focusout", () => triggerFocusOut(this.el));
    this.el.addEventListener("invalid", () => this._triggerValidationMessage("invalid"));
    this.el.addEventListener("change", () => this.updateSelect());
    window.addEventListener("click", (e) => this._onClickedOutside(e));

    if (this.config.searchable) this._bindSearchEvent();
  }

  _bindSearchEvent() {
    const searchBox = this.dropdown.querySelector(".nice-select-search");
    if (searchBox) {
      searchBox.addEventListener("click", (e) => e.stopPropagation());
      searchBox.addEventListener("input", (e) => this._onSearchChanged(e));
    }
  }

  _onClicked(e) {
    e.preventDefault();

    this.focus(e.target);
  }

  _onItemClicked(option, e) {
    const optionEl = e.target;
    if (!hasClass(optionEl, "disabled")) {
      if (this.multiple) {
        if (hasClass(optionEl, "selected")) {
          removeClass(optionEl, "selected");
          this.selectedOptions = this.selectedOptions.filter(
            (item) => item !== option
          );
          const opt = this.el.querySelector(
            `option[value="${optionEl.dataset.value}"]`
          );
          if (opt) {
            opt.removeAttribute("selected");
            opt.selected = false;
          }

          this._multipleListRemove(option);
        } else {
          addClass(optionEl, "selected");
          this.selectedOptions.push(option);

          if(this.config.showSelectedItems){
            option.attributes.selected = true;
            this._multipleListAdd(option);
          }
        }
      } else {
        this.options.forEach((item) => removeClass(item.element, "selected"));

        addClass(optionEl, "selected");

        this.selectedOptions = [option];
      }

      this._renderSelectedItems();

      this.updateSelectValue();
    }
  }

  setValue(value) {
    const select = this.el;
    let noSelected = true;

    // Validate input type
    if (select.multiple) {
      if (!Array.isArray(value)) {
        throw new Error('setValue expects an array for multiple select elements');
      }

      value = value.map(String);
    } else {
      if (Array.isArray(value)) {
        throw new Error('setValue expects a single value for non-multiple select elements');
      }

      if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') {
        throw new Error('setValue expects a string or number for non-multiple select elements');
      }

      value = String(value);
    }

    for (const opt of select.options) {
      const currentValue = select.multiple
        ? value.includes(opt.value)
          ? opt.value
          : null
        : value;
      if (opt.value === currentValue && !opt.disabled) {
        if (noSelected) {
          select.value = currentValue;
          noSelected = false;
        }

        opt.setAttribute("selected", true);
        opt.selected = true;
      } else {
        opt.removeAttribute("selected");
        opt.selected = false;
      }
    }

    if (noSelected && !select.multiple && select.options.length) {
      select.options[0].setAttribute("selected", true);
      select.options[0].selected = true;
      select.value = select.options[0].value;
    }

    this.update();
  }

  getValue() {
    const select = this.el;
    if (!select.multiple) return select.value;

    return Array.from(select.options)
      .filter((opt) => opt.selected)
      .map((opt) => opt.value);
  }

  updateSelectValue() {
    if (this.selectedOptions.length > 0) {
      this.el.value = this.selectedOptions[0].data.value;
    }

    const select = this.el;

    // FIrst mark all options as not selected
    select.querySelectorAll("option").forEach(function (item) {
      item.removeAttribute("selected");
    });

    // Mark the selected options as selected in the select element
    this.selectedOptions.forEach( item => {
      let el = select.querySelector(`option[value="${item.data.value}"]`);

      if (el){
        //Change it, cause it works more correctly.
        el.setAttribute("selected", "selected");
        el.selected = true;
      }
    });

    triggerChange(this.el);
  }

  resetSelectValue() {
    if (this.multiple) {
      const select = this.el;
      this.selectedOptions.forEach((item) => {
        const el = select.querySelector(`option[value="${item.data.value}"]`);
        if (el) {
          el.removeAttribute("selected");
          el.selected = false;
        }
      });
    } else if (this.selectedOptions.length > 0) {
      this.el.selectedIndex = -1;
    }

    triggerChange(this.el);
  }

  _onClickedOutside(e) {
    if (!this.dropdown.contains(e.target)) {
      removeClass(this.dropdown, "open");
      triggerModalClose(this.el);
    }
  }

  _onKeyPressed(e) {
    const focusedOption = this.dropdown.querySelector(".focus");
    const isOpen = hasClass(this.dropdown, "open");

    if (e.keyCode === 13) {
      isOpen ? triggerClick(focusedOption) : triggerClick(this.dropdown);
    } else if (e.keyCode === 40) {
      if (!isOpen) {
        triggerClick(this.dropdown);
      } else {
        const next = this._findNext(focusedOption);
        if (next) {
          if (focusedOption) removeClass(focusedOption, "focus");
          addClass(next, "focus");
        }
      }
      e.preventDefault();
    } else if (e.keyCode === 38) {
      if (!isOpen) {
        triggerClick(this.dropdown);
      } else {
        const prev = this._findPrev(focusedOption);
        if (prev) {
          if (focusedOption) removeClass(focusedOption, "focus");
          addClass(prev, "focus");
        }
      }
      e.preventDefault();
    } else if (e.keyCode === 27 && isOpen) {
      triggerClick(this.dropdown);
    } else if (e.keyCode === 32 && isOpen) {
      return false;
    }

    return false;
  }

  _findNext(el) {
    let nextEl = el
      ? el.nextElementSibling
      : this.dropdown.querySelector(".list .option");
    while (nextEl) {
      if (!hasClass(nextEl, "disabled") && nextEl.style.display !== "none")
        return nextEl;
      nextEl = nextEl.nextElementSibling;
    }

    return null;
  }

  _findPrev(el) {
    let prevEl = el
      ? el.previousElementSibling
      : this.dropdown.querySelector(".list .option:last-child");
    while (prevEl) {
      if (!hasClass(prevEl, "disabled") && prevEl.style.display !== "none")
        return prevEl;
      prevEl = prevEl.previousElementSibling;
    }

    return null;
  }

  _onSearchChanged(e) {
    const text = e.target.value.toLowerCase();

    if (text === "") {
      this.options.forEach((item) => (item.element.style.display = ""));
    } else if (hasClass(this.dropdown, "open")) {
      const matchReg = new RegExp(text);
      this.options.forEach((item) => {
        item.element.style.display = matchReg.test(item.data.text.toLowerCase())
          ? ""
          : "none";
      });
    }

    this.dropdown
      .querySelectorAll(".focus")
      .forEach((item) => removeClass(item, "focus"));

    const firstEl = this._findNext(null);

    if (firstEl) addClass(firstEl, "focus");
  }

  _triggerValidationMessage(type) {
    if (type === "invalid") {
      addClass(this.dropdown, "invalid");
      removeClass(this.dropdown, "valid");
    } else {
      addClass(this.dropdown, "valid");
      removeClass(this.dropdown, "invalid");
    }
  }

  _multipleListAdd(option) {
  
    if(option.data.disabled || option.data.value == "" || !option.attributes.selected){
      return;
    }

    if(this.selectionList == null){
      this.selectionList	 		= document.createElement('ul');
      this.selectionList.classList.add('select-selection-list');

      this.el.after(this.selectionList);
    }else if(this.selectionList.querySelector(`[data-value="${option.data.value}"]`) != null){
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

    this.selectionList.appendChild(li);

    li.querySelectorAll('.remove-select-selection').forEach(el=> el.addEventListener("click", this._multipleListRemove.bind(this)));
  }

  _multipleListRemove(target) {

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
}

export default NiceSelect;
export function bind(el, options) {
  return new NiceSelect(el, options);
}