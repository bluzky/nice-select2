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
  hideSelect: true
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
    this.el._niceSelect   = this;
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

    this.bindElementEvents();
  }

  #create(initial=true) {
    this.data ? this.processData(this.data) : this.extractData(initial);
    this.el.classList.remove('hidden-select');
    this.renderDropdown();

    if(this.config.hideSelect){
      this.el.classList.add('hidden-select');
    }
    this.bindDropdownEvents();
  }

  #processData(data) {
    this.options = data.map((item) => ({
      data: item,
      attributes: {
        selected: !!item.selected,
        disabled: !!item.disabled,
        optgroup: item.value === "optgroup",
      },
    }));
  }

  #extractData(initial) {
    const options = Array.from(this.el.querySelectorAll("option,optgroup"));
    const allOptions = [];
    const selectedOptions = [];

    this.data = options.map((item) => {
      let itemData;

      let selected  = item.selected;

      // First item is marked as selected on default selects
      if(initial && item.selected && !item.defaultSelected){
        selected = false;
      }

      if (item.tagName === "OPTGROUP") {
        itemData = { text: item.label, value: "optgroup" };
      } else {
        const text = item.dataset.display ?? item.innerText;
        itemData = {
          text,
          value: item.value,
          extra: item.dataset.extra,
          selected: selected,
          disabled: item.disabled,
        };
      }

      const attributes = {
        selected: selected,
        disabled: item.disabled,
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

  #renderDropdown() {
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

  /*
    Updates the text shown in the dropdown header
  */
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
      li.addEventListener("click", (e) => this._onDropdownItemClicked(option, e));
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

  update(e='') {
    let $this  = this;
    if(e != ''){
      $this  = e.target._niceSelect; 
    }
    
    $this.syncDropdown();
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
      this.removeSelectionList();
    }

    if (this.dropdown) {
      this.dropdown.remove();
      this.el.classList.remove('hidden-select');
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

  #bindElementEvents(){
    this.el.addEventListener("invalid", () => this._triggerValidationMessage("invalid"));
    window.addEventListener("click", e => this._onClickedOutside(e));
    this.el.addEventListener("change", this.update);
  }

  #bindDropdownEvents() {
    this.dropdown.addEventListener("click", (e) => this._onClicked(e));
    this.dropdown.addEventListener("keydown", (e) => this._onKeyPressed(e));
    this.dropdown.addEventListener("focusin", () => triggerFocusIn(this.el));
    this.dropdown.addEventListener("focusout", () => triggerFocusOut(this.el));

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

  _onDropdownItemClicked(option, e) {
    const optionEl = e.target;

    if (hasClass(optionEl, "disabled")) {
      return;
    }

    if (this.multiple) {
      let selected;

      if (hasClass(optionEl, "selected")) {
        selected  = false;

        removeClass(optionEl, "selected");

        // Update Selected Options
        this.selectedOptions = this.selectedOptions.filter(
          (item) => item.data !== option.data
        );
      } else {
        selected  = true;

        addClass(optionEl, "selected");

        // Update Selected Options
        this.selectedOptions.push(option);      
      }

      // Update option 
      option.data.selected        = selected;
      option.attributes.selected  = selected;
    } else {      
      // Mark all dropdown options as unselected
      this.dropdown.querySelectorAll('li.selected').forEach((li) => removeClass(li, "selected"));

      // add the selected class to the current
      addClass(optionEl, "selected");

      // Update Selected Options Attribute
      this.selectedOptions = [option];

      // Update option properties 
      let prevSelected  = this.options.find(item => item.attributes.selected);
      if(prevSelected){
        prevSelected.data.selected        = false;
        prevSelected.attributes.selected  = false;
      }

      option.data.selected        = true;
      option.attributes.selected  = true;
    }

    this._renderSelectedItems();

    this.syncSelectValue();

    this.syncSelectionList();
  }

  /*
    Syncs the original select element with the dropdown
  */
  #syncSelectValue() {
    const select    = this.el;

    if (this.selectedOptions.length > 0) {
      select.value = this.selectedOptions[0].data.value;
    }else{
      // no value selected
      select.value = '';
      select.selectedIndex = -1;
    }

    this.options.forEach(item =>{
      let matchingOption = Array.from(select.options).find(option => {
        const a = String(option.dataset.display || option.textContent).trim().toLowerCase();
        const b = String(item.data.text).trim().toLowerCase();
        return a === b;
      });

      if(matchingOption == undefined){
        matchingOption = Array.from(select.options).find(option => {
          const a = String(option.value).trim().toLowerCase();
          const b = String(item.data.value).trim().toLowerCase();
          return a === b;
        });
      }

      if (matchingOption == undefined) {
        // no matching option was found, continue
        return;
      }

      if(item.attributes.selected){
        matchingOption.selected = true;
      } else {
        matchingOption.selected = false;
      }
    });

    // Remove the event listener so we don't create a loop
    select.removeEventListener("change", this.update);

    triggerChange(select);

    // Add event listener again
    select.addEventListener("change", this.update);
  }

  #resetSelectValue() {
    if (this.multiple) {
      const select = this.el;
      this.selectedOptions.forEach((item) => {
        const el = select.querySelector(`option[value="${item.data.value}"]`);
        if (el) {
          el.selected = false;
        }
      });
    } else if (this.selectedOptions.length > 0) {
      this.el.selectedIndex = -1;
    }

    triggerChange(this.el);
  }

  /*
    Syncs the dropdown with the select
  */
  #syncDropdown(){
    if (this.dropdown) {
      const open = hasClass(this.dropdown, "open");

      this.removeSelectionList();

      this.dropdown.remove();

      this.data   = null;

      this.create(false);

      if (open) {
        triggerClick(this.dropdown);
      }
    }

    attr(this.el, "disabled") ? this.disable() : this.enable();
  }

  /*
    Syncs the selected list with the dropdown
  */
  #syncSelectionList(){
    if(!this.config.showSelectedItems){
      return;
    }

    this.removeSelectionList();

    // Update multiple list
    this.selectedOptions.forEach( item =>{
      this._multipleListAdd(item);
    });
  }

  _onClickedOutside(e) {
    if (!this.dropdown.contains(e.target)) {
      removeClass(this.dropdown, "open");
      triggerModalClose(this.el);
    }
  }

  _onKeyPressed(e) {
    const focusedOption = this.dropdown.querySelector(".focus");
    const isOpen        = hasClass(this.dropdown, "open");

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

    const focus = this.dropdown.querySelector('.focus');
    if (focus) {
      focus.scrollIntoView({ block: 'center' });
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

  #removeSelectionList(){
    if(this.selectionList != null){
      this.selectionList.remove();
      this.selectionList  = null;
    }
  }

  _multipleListAdd(option) {
    if(!this.multiple || option.data.disabled || option.data.value == "" || !option.attributes.selected){
      return;
    }

    // Create the list
    if(this.selectionList == null){
      this.selectionList	 		= document.createElement('ul');
      this.selectionList.classList.add('select-selection-list');

      this.el.after(this.selectionList);
    }
    
    // Option is already in the list
    else if(this.selectionList.querySelector(`[data-value="${option.data.value}"]`) != null){
      return;
    }

    // Create a list element
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

    // Add listener
    li.querySelectorAll('.remove-select-selection').forEach(el=> el.addEventListener("click", this._multipleListRemove.bind(this)));
  }

  _multipleListRemove(target) {

    if(this.selectionList == null){
      return;
    }

    if(target.target != null){
      target  = target.target;
    }

    // Close button not clicked
    if(target.matches == undefined || !target.matches('.remove-select-selection')){
      return;
    }

    // Find the dropdown item and click it
    let parent  = target.closest('li.select-selection');
    
    let el  = this.options.find(item => item.data.value === parent.dataset.value).element;
  
    // only click when currently selected
    if(el && el.matches('.selected')){
      el.click();
    }
  }
}

export default NiceSelect;
export function bind(el, options) {
  return new NiceSelect(el, options);
}