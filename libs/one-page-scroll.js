class OnePageScroll {
    /**
     * Constructor for the OnePageScroll class.
     * @param {string} rootSelector - The selector for the root element containing sections.
     * @param {Object} options - Options for configuring the scrolling behavior (not used in this version).
     */
    constructor(rootSelector, options = { navigation: true }) {
        /** @type {HTMLElement} */
        this.rootElement = rootSelector;

        /** @type {object} */
        this.options = options;

        /** @type {HTMLCollection} */
        this.sections = this.rootElement.children;

        /** @type {?number} */
        this.initialY = null;

        /** @type {?number} */
        this.initialX = null;

        this.init();
    }

    /**
     * Initialize the OnePageScroll library.
     */
    init() {
        /** @type {HTMLElement[]} */
        const sectionsArr = [...this.sections];

        this.beforeScroll(sectionsArr);

        // Add mouse wheel event listener
        window.addEventListener('wheel', event => {
            let scrollDirection = event.deltaY > 0 ? 1 : -1;
            this.flexibleCheck(event, sectionsArr, scrollDirection);
            this.listenScroll(event);
        }, { passive: false });

        // Add touch event listeners
        window.addEventListener('touchstart', event => {
            this.initialX = event.touches[0].clientX;
            this.initialY = event.touches[0].clientY;
        }, { passive: false });

        window.addEventListener('touchmove', event => {
            if (!this.initialX || !this.initialY) return;
            const currentY = event.touches[0].clientY;
            const diffY = this.initialY - currentY;
            let swipeDirection = diffY > 0 ? 1 : -1;
            this.flexibleCheck(event, sectionsArr, swipeDirection);
            this.scroll(swipeDirection, event.target);
            this.clientX = null;
            this.clientY = null;
        }, { passive: false });

        document.addEventListener('DOMContentLoaded', () => {
            sectionsArr.forEach((section, index) => {
                window.addEventListener('keydown', event => {
                    this.listenKeydown(section, event);
                })
            })
        });

        this.isThrottled = false;
    }

    /**
    * Check scroll boundaries and handle navigation visibility.
    * @param {Event} event - The scroll or touch event.
    * @param {HTMLElement[]} sectionsArr - Array of section elements.
    * @param {number} scrollDirection - The scroll direction (1 for down, -1 for up).
    * @returns {boolean} - Returns true if inside the container, otherwise false.
    */
    flexibleCheck(event, sectionsArr, scrollDirection) {
        let isInsideContainer = this.rootElement.contains(event.target);
        let isFirstElement = sectionsArr[0] === event.target || sectionsArr[0].contains(event.target);
        let isLastElement = sectionsArr[sectionsArr.length - 1] === event.target || sectionsArr[sectionsArr.length - 1].contains(event.target);
        const hasNavigation = document.querySelector('.ops-navigation-container');
        if (isInsideContainer) {
            if ((isFirstElement && scrollDirection === -1)) {
                if (hasNavigation) document.body.removeChild(document.querySelector('.ops-navigation-container'));
                return true;
            }

            if ((isLastElement && scrollDirection === 1)) {
                if (hasNavigation) document.body.removeChild(document.querySelector('.ops-navigation-container'));
                return true;
            }

            event.preventDefault();
            if (!hasNavigation && this.options.navigation) this.drawNavigation();
        }
    }

    /**
     * Set attributes for sections before scrolling.
     * @param {HTMLElement[]} sectionsArr - Array of section elements.
     */
    beforeScroll(sectionsArr) {
        window.onload = () => {
            Array.from(sectionsArr).forEach((section, index, sections) => {
                section.setAttribute('data-section-index', index);
                index === 0 ? section.setAttribute('data-first-section', true) : section.removeAttribute('data-first-section');
                index === sections.length - 1 ? section.setAttribute('data-last-section', true) : section.removeAttribute('data-last-section');
            })
        }
    }

    /**
     * Checks if an element is visible within the viewport.
     * @param {HTMLElement} el - The element to be checked for visibility. 
     * @returns  {boolean} True if the element is visible in the viewport, otherwise false.
     */
    elementIsVisibleInViewport(el) {
        const { top, bottom } = el.getBoundingClientRect();
        const { innerHeight } = window;

        const threshold = el.hasAttribute('data-first-section') || el.hasAttribute('data-last-section') ? 0.5 : 1.0;

        if (el.hasAttribute('data-first-section')) {
            return bottom >= innerHeight * threshold && top <= innerHeight * threshold;
        } else if (el.hasAttribute('data-last-section')) {
            return top <= innerHeight * (1 - threshold) && bottom >= innerHeight * (1 - threshold);
        } else {
            return top >= 0 && bottom <= innerHeight;
        }
    }


    /**
    * Handle scroll events.
    * @param {Event} event - The scroll event.
    */
    listenScroll(e) {
        if (this.isThrottled) return;
        this.isThrottled = true;

        setTimeout(() => {
            this.isThrottled = false;
        }, 200);

        const direction = e.deltaY > 0 ? 1 : -1;
        this.scroll(direction, e.target);
    }

    /**
     * Handle keydown events.
     * @param {HTMLElement} section - The section element.
     * @param {Event} event - The keydown event.
     */
    listenKeydown(section, event) {
        let isVisible = this.elementIsVisibleInViewport(section);
        let isFirstSection = section.hasAttribute('data-first-section');
        let isLastSection = section.hasAttribute('data-last-section');
        const hasNavigation = document.querySelector('.ops-navigation-container');
        if (isVisible) {
            let timer;
            switch (event.key) {
                case 'ArrowDown':
                    if (isLastSection) {
                        if (hasNavigation) document.body.removeChild(document.querySelector('.ops-navigation-container'));
                        return true;
                    }
                    event.preventDefault();
                    if (timer) clearTimeout(timer);
                    timer = setTimeout(() => {
                        if (!hasNavigation && this.options.navigation) this.drawNavigation();
                        this.scroll(1, section);
                    }, 500);
                    break;
                case 'ArrowUp':
                    if (isFirstSection) {
                        if (hasNavigation) document.body.removeChild(document.querySelector('.ops-navigation-container'));
                        return true;
                    }
                    event.preventDefault();
                    if (timer) clearTimeout(timer);
                    timer = setTimeout(() => {
                        if (!hasNavigation && this.options.navigation) this.drawNavigation();
                        this.scroll(-1, section);
                    }, 500);
                    break;
                default: return;
            }
        }
    }

    /**
     * Scroll to the next or previous section.
     * @param {number} direction - The scroll direction (1 for down, -1 for up).
     * @param {HTMLElement} element - The target element or its parent with a data-section-index attribute.
     */
    scroll(direction, element) {
        let item = element.hasAttribute('data-section-index') ? element : element.closest('[data-section-index]');
        if (item) {
            if (direction === 1) {
                const isLastSection = item.hasAttribute('data-last-section');
                if (isLastSection) return;
            } else if (direction === -1) {
                const firstSection = item.hasAttribute('data-first-section');
                if (firstSection) return;
            }

            this.currentSectionIndex = Number(item.getAttribute('data-section-index')) + direction;
            this.scrollToCurrentSection();
        }
    }

    /**
     * Scroll to the current section.
     * @returns {void}
     */
    scrollToCurrentSection() {
        if (this.sections[this.currentSectionIndex]) {
            this.activateNavigation(this.currentSectionIndex);
            let section = this.sections[this.currentSectionIndex];
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * Draw navigation for sections.
     * @return {void}
     */
    drawNavigation() {
        this.navigationContainer = document.createElement('div');
        this.navigationContainer.setAttribute('class', 'ops-navigation-container');
        const list = document.createElement('ul');
        list.setAttribute('class', 'ops-navigation');
        Array.from(this.sections).forEach((section, index) => {
            const listItem = document.createElement('li');
            listItem.setAttribute('class', 'ops-navigation-item');
            listItem.setAttribute('data-target', index);
            list.appendChild(listItem);
        })

        this.navigationContainer.appendChild(list);
        document.body.appendChild(this.navigationContainer);
    }

    /**
    * Activate navigation items based on the current section.
    * @return {void}
    */
    activateNavigation(currentIndexInViewport) {
        const opsNavigationItems = document.querySelectorAll('.ops-navigation-item');
        opsNavigationItems.forEach((item, index, arr) => {
            item.classList.remove('ops-navigation-item-active');
            if (Number(item.getAttribute('data-target')) === currentIndexInViewport) {
                item.classList.add('ops-navigation-item-active');
            }

            item.addEventListener('click', (event) => {
                let goThisIndex = event.target.getAttribute('data-target');
                this.currentSectionIndex = goThisIndex;
                this.scrollToCurrentSection();
                arr.forEach(item => {
                    item.classList.remove('ops-navigation-item-active');
                })
                event.target.classList.add('ops-navigation-item-active');
            })
        })
    }
}

// Expose OnePageScroll class globally
window.OnePageScroll = OnePageScroll;