import '../../global/js/array-from';
import '../../global/js/object-assign';
import '../../global/js/custom-event';

export default class HeaderNav {
  constructor(element, options = {}) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      throw new TypeError('DOM element should be given to initialize this widget.');
    }

    this.element = element;

    this.options = Object.assign({
      selectorTriggerLabel: '.current-taxonomy',
      selectorActive: 'taxonomy-nav--active',
      selectorMenu: '.taxonomy-menu',
      selectorItem: '.taxonomy-item',
      selectorItemLink: '.taxonomy-item--taxonomy-menu',
      selectorLabel: '.taxonomy-item__label',
    }, options);

    this.menuNode = this.element.querySelector(this.options.selectorMenu);

    this.element.addEventListener('keydown', (event) => this.toggleNav(event));

    [... this.element.querySelectorAll(this.options.selectorItemLink)].forEach((item) => {
      item.addEventListener('click', (e) => this.select(e));
    });
  }

  toggleNav(event) {
    const isActive = this.element.classList.contains(this.options.selectorActive);
    let add;
    if (event.type === 'click' || event.type === 'keydown' && event.which === 40) {
      // Toggle button or ESC key on nav
      add = !isActive;
    } else if (event.type === 'keydown' && event.which === 27) {
      // Down arrow on launch button
      add = false;
    } else {
      return;
    }
    if (event.currentTarget.tagName === 'A' || event.currentTarget.querySelector('a')) {
      event.preventDefault();
    }

    const launchingElement = event.currentTarget;
    const typeSuffix = add ? 'shown' : 'hidden';
    const eventStart = new CustomEvent(`header-being${typeSuffix}`, {
      bubbles: true,
      cancelable: true,
      detail: { launchingElement: launchingElement },
    });
    this.element.dispatchEvent(eventStart);

    if (add) {
      this.triggerNode = event.currentTarget;
      this.triggerLabelNode = this.triggerNode.querySelector(this.options.selectorTriggerLabel);
    }

    if (!eventStart.defaultPrevented) {
      this.element.classList[add ? 'add' : 'remove'](this.options.selectorActive);
      (this.element.classList.contains(this.options.selectorActive) ? this.menuNode : this.triggerNode).focus();
      this.element.dispatchEvent(new CustomEvent(`header-${typeSuffix}`, {
        bubbles: true,
        cancelable: true,
        detail: { launchingElement: launchingElement },
      }));
    }
  }

  select(event) {
    const activatedElement = event.currentTarget;
    const eventStart = new CustomEvent('header-beingselected', {
      bubbles: true,
      cancelable: true,
      detail: {
        initiatingEvent: event,
        itemElement: activatedElement,
      },
    });
    this.element.dispatchEvent(eventStart);

    if (!eventStart.defaultPrevented) {
      [... this.element.querySelectorAll(this.options.selectorItem)].forEach((element) => {
        if (element.contains(activatedElement)) {
          element.classList.add('selected');
        } else if (element.classList.contains('selected')) {
          element.classList.remove('selected');
        }
      });
      activatedElement.classList.add('selected');
      if (this.triggerLabelNode) {
        this.triggerLabelNode.textContent = activatedElement.querySelector(this.options.selectorLabel).textContent;
      }
      this.element.dispatchEvent(new CustomEvent('header-selected', {
        bubbles: true,
        cancelable: true,
        detail: { itemElement: activatedElement },
      }));
    }
  }

  static create(element, options) {
    return HeaderNav.components.get(element) || new HeaderNav(element, options);
  }

  static hook(element, options) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      throw new TypeError('DOM element should be given to initialize this widget.');
    }

    const navs = [... element.ownerDocument.querySelectorAll(element.getAttribute('data-nav-target'))].map((target) => {
      return HeaderNav.create(target, options);
    });

    ['keydown', 'click'].forEach((name) => {
      element.addEventListener(name, (event) => {
        if (event.currentTarget.tagName === 'A' || event.currentTarget.querySelector('a')) {
          event.preventDefault();
        }
        navs.forEach((nav) => nav.toggleNav(event));
      });
    });
  }
}

HeaderNav.components = new WeakMap();