(function(factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        window.Rangeslider = factory();
    }
}(function() {
    'use strict';

    /**
     * Polyfill Number.isNaN(value)
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
     */
    Number.isNaN = Number.isNaN || function(value) {
        return typeof value === 'number' && value !== value;
    };

    /**
     * Range feature detection
     *
     * @return {Boolean}
     */
    function supportsRange() {
        var input = document.createElement('input');

        input.setAttribute('type', 'range');
        return input.type !== 'text';
    }

    var hasInputRangeSupport = supportsRange(),
        defaults = {
            polyfill: true,
            orientation: 'horizontal',
            rangeClass: 'rangeslider',
            disabledClass: 'rangeslider--disabled',
            horizontalClass: 'rangeslider--horizontal',
            verticalClass: 'rangeslider--vertical',
            fillClass: 'rangeslider__fill',
            handleClass: 'rangeslider__handle',
            startEvent: ['mousedown', 'touchstart', 'pointerdown'],
            moveEvent: ['mousemove', 'touchmove', 'pointermove'],
            endEvent: ['mouseup', 'touchend', 'pointerup']
        },
        constants = {
            orientation: {
                horizontal: {
                    dimension: 'width',
                    direction: 'left',
                    directionStyle: 'left',
                    coordinate: 'x'
                },
                vertical: {
                    dimension: 'height',
                    direction: 'top',
                    directionStyle: 'bottom',
                    coordinate: 'y'
                }
            }
        };

    /**
     * @param  {...Object} [out]
     * @return {Object}
     */
    function extend(out) {
        out = out === undefined ? {} : out;

        for (var i = 1; i < arguments.length; i++) {
            if (!arguments[i]) {
                continue;
            }

            for (var key in arguments[i]) {
                if (arguments[i].hasOwnProperty(key)) {
                    out[key] = arguments[i][key];
                }
            }
        }
        return out;
	}

    /**
     * Trigger a custom event, IE9+
     *
     * @param  {Element} el
     * @param  {String}  eventName
     * @param  {Object}  options
     * @return {void}
     */
    function triggerEvent(el, eventName, options) {
        var event;
        if (window.CustomEvent) {
            event = new CustomEvent(eventName, options);
        } else {
            event = document.createEvent('CustomEvent');
            event.initCustomEvent(eventName, true, true, options);
        }
        el.dispatchEvent(event);
    }

    /**
     * Add class to an `element`
     *
     * @param  {Element} el
     * @param  {String}  className
     * @return {void}
     */
    function addClass(el, className) {
        if (el.classList) {
            el.classList.add(className);
        } else {
            el.className += ' ' + className;
        }
    }

    /**
     * Remove class from an `element`
     *
     * @param  {Element} el
     * @param  {String}  className
     * @return {void}
     */
    function removeClass(el, className) {
        if (el.classList) {
            el.classList.remove(className);
        } else {
            el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    /**
     * Check if an `element` has a `className`
     *
     * @param  {Element} el
     * @param  {String}  className
     * @return {Boolean}
     */
    function hasClass(el, className) {
        if (el.classList) {
            return el.classList.contains(className);
        } else {
            return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
        }
    }

    /**
     * Returns a debounced function that will make sure the given
     * function is not triggered too much.
     *
     * @param  {Function} fn
     * @param  {Number}   [wait=100] Function will be called after it stops being called for x milliseconds
     * @return {Function}
     */
    function debounce(fn, wait) {
        wait = wait === undefined ? 100 : wait;

        var timeout;
        return function() {
            var context = this,
                args = arguments,
                later;

            later = function() {
                timeout = null;
                fn.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Check if a `element` is visible in the DOM
     *
     * @param  {Element}  element
     * @return {Boolean}
     */
    function isHidden(element) {
        return (
            element && (
                element.offsetWidth === 0 ||
                element.offsetHeight === 0 ||
                // Also consider native `<details>` elements.
                element.open === false
            )
        );
    }

    /**
     * Get hidden parentNodes of an `element`
     *
     * @param  {Element} element
     * @return {Array}
     */
    function getHiddenParentNodes(element) {
        var parents = [],
            node    = element.parentNode;

        while (isHidden(node)) {
            parents.push(node);
            node = node.parentNode;
        }
        return parents;
    }

    /**
     * Returns dimensions for an `element` even if it is not visible in the DOM.
     *
     * @param  {Element} element
     * @param  {String}  key     (e.g. offsetWidth …)
     * @return {Number}
     */
    function getDimension(element, key) {
        var hiddenParentNodes       = getHiddenParentNodes(element),
            hiddenParentNodesLength = hiddenParentNodes.length,
            inlineStyle             = [],
            dimension               = element[key];

        // Used for native `<details>` elements
        function toggleOpenProperty(element) {
            if (typeof element.open !== 'undefined') {
                element.open = (element.open) ? false : true;
            }
        }

        if (hiddenParentNodesLength) {
            for (var i = 0; i < hiddenParentNodesLength; i++) {

                // Cache style attribute to restore it later.
                inlineStyle[i] = hiddenParentNodes[i].style.cssText;

                // visually hide
                if (hiddenParentNodes[i].style.setProperty) {
                    hiddenParentNodes[i].style.setProperty('display', 'block', 'important');
                } else {
                    hiddenParentNodes[i].style.cssText += ';display: block !important';
                }
                hiddenParentNodes[i].style.height = '0';
                hiddenParentNodes[i].style.overflow = 'hidden';
                hiddenParentNodes[i].style.visibility = 'hidden';
                toggleOpenProperty(hiddenParentNodes[i]);
            }

            // Update dimension
            dimension = element[key];

            for (var j = 0; j < hiddenParentNodesLength; j++) {

                // Restore the style attribute
                hiddenParentNodes[j].style.cssText = inlineStyle[j];
                toggleOpenProperty(hiddenParentNodes[j]);
            }
        }
        return dimension;
    }

    /**
     * Returns the parsed float or the default if it failed.
     *
     * @param  {String}  str
     * @param  {Number}  defaultValue
     * @return {Number}
     */
    function tryParseFloat(str, defaultValue) {
        var value = parseFloat(str);
        return Number.isNaN(value) ? defaultValue : value;
    }

    /**
     * Capitalize the first letter of string
     *
     * @param  {String} str
     * @return {String}
     */
    function ucfirst(str) {
        return str.charAt(0).toUpperCase() + str.substr(1);
    }

    /**
     * Rangeslider constructor
     *
     * @param {Element} el
     * @param {Object}  [options]
     * @constructor
     */
    function Rangeslider(el, options) {
        options = options === undefined ? {} : options;

        this.dom = {
            el: el,
            range: null,
            handle: null,
            fill: null
        };

        this.options = extend({}, defaults, options);
        if (this.dom.el.getAttribute('data-orientation')) {
            this.options.orientation = this.dom.el.getAttribute('data-orientation');
        }

        // Plugin should only be used as a polyfill
        if (this.options.polyfill && hasInputRangeSupport) {
            return this;
        }

        this.DIMENSION          = constants.orientation[this.options.orientation].dimension;
        this.DIRECTION          = constants.orientation[this.options.orientation].direction;
        this.DIRECTION_STYLE    = constants.orientation[this.options.orientation].directionStyle;
        this.COORDINATE         = constants.orientation[this.options.orientation].coordinate;

        this.toFixed            = (this.step + '').replace('.', '').length - 1;
        this.isDown             = false;

        // Store context
        this.bind = {
            start: this.handleDown.bind(this),
            move: this.handleMove.bind(this),
            end: this.handleEnd.bind(this),
            resize: this.handleResize.bind(this)
        };

        this.init();

        return this;
    }

    /**
     * Initialize `Rangeslider` instance
     *
     * @return {void}
     */
    Rangeslider.prototype.init = function() {
        this.setup();
        this.addEventListeners();
        this.update(true, false);

        if (this.options.onInit && typeof this.options.onInit === 'function') {
            this.options.onInit.call(this);
        }
    };

    /**
     * @return {void}
     */
    Rangeslider.prototype.setup = function() {
        // Create HTML structure and insert after input
        var elRange = document.createElement('div'),
            elFill = document.createElement('div'),
            elHandle = document.createElement('div');

        elRange.className =
            this.options.rangeClass + ' ' + this.options[this.options.orientation + 'Class'];
        elFill.className = this.options.fillClass;
        elHandle.className = this.options.handleClass;

        elRange.appendChild(elFill);
        elRange.appendChild(elHandle);

        this.dom.el.parentNode.insertBefore(elRange, this.dom.el.nextSibling);

        this.dom.range = elRange;
        this.dom.fill = elFill;
        this.dom.handle = elHandle;

        // Hide the input element visually
        this.dom.el.style.position = 'absolute';
        this.dom.el.style.width = '1px';
        this.dom.el.style.height = '1px';
        this.dom.el.style.overflow = 'hidden';
        this.dom.el.style.opacity = 0;
    };

    /**
     * @return {void}
     */
    Rangeslider.prototype.addEventListeners = function() {
        var i;

        for (i = 0; i < this.options.startEvent.length; i++) {
            this.dom.range.addEventListener(
                this.options.startEvent[i], this.bind.start
            );
        }

        for (i = 0; i < this.options.moveEvent.length; i++) {
            document.documentElement.addEventListener(
                this.options.moveEvent[i], this.bind.move
            );
        }

        for (i = 0; i < this.options.endEvent.length; i++) {
            document.documentElement.addEventListener(
                this.options.endEvent[i], this.bind.end
            );
        }

        window.addEventListener('resize', debounce(this.bind.resize, 50));
    };

    /**
     * Update properties, attributes and/or position
     *
     * @param  {Boolean} [updateAttributes=false]
     * @param  {Boolean} [triggerSlide=false]
     * @return {void}
     */
    Rangeslider.prototype.update = function(updateAttributes, triggerSlide) {
        updateAttributes = updateAttributes === undefined ? false : updateAttributes;
        triggerSlide = triggerSlide === undefined ? false : triggerSlide;

        if (updateAttributes) {
            this.min   = tryParseFloat(this.dom.el.getAttribute('min'), 0);
            this.max   = tryParseFloat(this.dom.el.getAttribute('max'), 100);
            this.value =
                tryParseFloat(this.dom.el.value, Math.round(this.min + (this.max - this.min) / 2));
            this.step  = tryParseFloat(this.dom.el.getAttribute('step'), 1);
        }

        this.handleDimension    = getDimension(this.dom.handle, 'offset' + ucfirst(this.DIMENSION));
        this.rangeDimension     = getDimension(this.dom.range, 'offset' + ucfirst(this.DIMENSION));
        this.maxHandlePos       = this.rangeDimension - this.handleDimension;
        this.grabPos            = this.handleDimension / 2;
        this.position           = this.getPositionFromValue(this.value);

        // Check disabled state
        if (this.dom.el.disabled) {
            addClass(this.dom.range, this.options.disabledClass);
        } else {
            removeClass(this.dom.range, this.options.disabledClass);
        }

        this.setPosition(this.position, triggerSlide);
    };

    /**
     * Fired when window is resized
     *
     * @return {void}
     */
    Rangeslider.prototype.handleResize = function() {
        this.update(false, false);
    };

    /**
     * Fired when mouse/pointer is down
     *
     * @param  {Object} e
     * @return {void}
     */
    Rangeslider.prototype.handleDown = function(e) {
        // Check if element is disabled and the correct mouse button is pressed
        if (this.dom.el.disabled ||
            (e.type === 'mousedown' && e.which !== 1)) {
            return;
        }

        this.isDown = true;

        // If we click on the handle don't set the new position
        if (hasClass(e.target, this.options.handleClass)) {
            return;
        }

        var pos         = this.getRelativePosition(e),
            rangePos    = this.dom.range.getBoundingClientRect()[this.DIRECTION],
            handlePos   = this.getPositionFromNode(this.dom.handle) - rangePos,
            setPos      = (this.options.orientation === 'vertical') ? (this.maxHandlePos - (pos - this.grabPos)) : (pos - this.grabPos);

        this.setPosition(setPos);

        if (pos >= handlePos && pos < handlePos + this.handleDimension) {
            this.grabPos = pos - handlePos;
        }
    };

    /**
     * Fired when mouse/pointer is moving
     *
     * @param  {Object} e
     * @return {void}
     */
    Rangeslider.prototype.handleMove = function(e) {
        if (this.isDown) {
            e.preventDefault();
            var pos = this.getRelativePosition(e);
            var setPos = (this.options.orientation === 'vertical') ? (this.maxHandlePos - (pos - this.grabPos)) : (pos - this.grabPos);
            this.setPosition(setPos);
        }
    };

    /**
     * Fired when mouse/pointer is up
     *
     * @param  {Object} e
     * @return {void}
     */
    Rangeslider.prototype.handleEnd = function(e) {
        if (this.isDown) {
            e.preventDefault();

            this.isDown = false;

            // Ok we're done, fire the change event
            triggerEvent(this.dom.el, 'change');

            if (this.options.onSlideEnd && typeof this.options.onSlideEnd === 'function') {
                this.options.onSlideEnd.call(this, this.position, this.value);
            }
        }
    };

    /**
     * @param  {Number} pos
     * @param  {Number} min
     * @param  {Number} max
     * @return {Number}
     */
    Rangeslider.prototype.cap = function(pos, min, max) {
        if (pos < min) { return min; }
        if (pos > max) { return max; }
        return pos;
    };

    /**
     * @param  {Number}  pos
     * @param  {Boolean} [triggerSlide=true]
     * @return {void}
     */
    Rangeslider.prototype.setPosition = function(pos, triggerSlide) {
        triggerSlide = triggerSlide === undefined ? true : triggerSlide;

        var value, newPos;

        // Snapping steps
        value = this.getValueFromPosition(this.cap(pos, 0, this.maxHandlePos));
        newPos = this.getPositionFromValue(value);

        // Update ui
        this.dom.fill.style[this.DIMENSION] = (newPos + this.grabPos) + 'px';
        this.dom.handle.style[this.DIRECTION_STYLE] = newPos + 'px';
        this.setValue(value);

        // Update globals
        this.position = newPos;
        this.value = value;

        if (triggerSlide && this.options.onSlide && typeof this.options.onSlide === 'function') {
            this.options.onSlide.call(this, newPos, value);
        }
    };

    /**
     * Returns element position relative to the parent node
     *
     * @param  {Element} node
     * @return {Number}
     */
    Rangeslider.prototype.getPositionFromNode = function(node) {
        var i = 0;
        while (node !== null) {
            i += node.offsetLeft;
            node = node.offsetParent;
        }
        return i;
    };

    /**
     * @param  {Object} e
     * @return {Number}
     */
    Rangeslider.prototype.getRelativePosition = function(e) {
        // Get the offset DIRECTION relative to the viewport
        var ucCoordinate = ucfirst(this.COORDINATE),
            rangePos = this.dom.range.getBoundingClientRect()[this.DIRECTION],
            pageCoordinate = 0;

        if ('pointers' in e) {
            pageCoordinate = e.pointers[0]['client' + ucCoordinate];
        } else if ('touches' in e) {
            pageCoordinate = e.touches[0]['client' + ucCoordinate];
        } else {
            pageCoordinate = e['client' + ucCoordinate];
        }

        return pageCoordinate - rangePos;
    };

    /**
     * @param  {Number} value
     * @return {Number} pos
     */
    Rangeslider.prototype.getPositionFromValue = function(value) {
        var percentage, pos;
        percentage = (value - this.min)/(this.max - this.min);
        pos = (!Number.isNaN(percentage)) ? percentage * this.maxHandlePos : 0;
        return pos;
    };

    /**
     * @param  {Number} pos
     * @return {Number} value
     */
    Rangeslider.prototype.getValueFromPosition = function(pos) {
        var percentage, value;
        percentage = ((pos) / (this.maxHandlePos || 1));
        value = this.step * Math.round(percentage * (this.max - this.min) / this.step) + this.min;
        return Number((value).toFixed(this.toFixed));
    };

    /**
     * Set a slider value
     *
     * @param  {Number} value
     * @return {void}
     */
    Rangeslider.prototype.setValue = function(value) {
        if (value === this.value && this.dom.el.value !== '') {
            return;
        }

        // Set the new value and fire the `input` event
        this.dom.el.value = value;

        triggerEvent(this.dom.el, 'input');
    };

    /**
     * Destroy `Rangeslider` instance
     *
     * @return {void}
     */
    Rangeslider.prototype.destroy = function() {
        var i;

        for (i = 0; i < this.options.startEvent.length; i++) {
            this.dom.range.removeEventListener(
                this.options.startEvent[i], this.bind.start
            );
        }

        for (i = 0; i < this.options.moveEvent.length; i++) {
            document.documentElement.removeEventListener(
                this.options.moveEvent[i], this.bind.move
            );
        }

        for (i = 0; i < this.options.endEvent.length; i++) {
            document.documentElement.removeEventListener(
                this.options.endEvent[i], this.bind.end
            );
        }

        window.removeEventListener('resize', this.bind.resize);

        this.dom.el.removeAttribute('style');

        // Remove the generated markup
        if (this.dom.range) {
            this.dom.range.parentNode.removeChild(this.dom.range);
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    if (window.jQuery) {
        jQuery.fn.rangeslider = function(options) {
            var args = Array.prototype.slice.call(arguments, 1);

            return this.each(function() {
                var $this = jQuery(this),
                    data  = $this.data('rangeslider');

                $this.data('rangeslider', new Rangeslider(this, options));

                // Make it possible to access methods from public,
                // e.g `$element.Rangeslider('method');`
                if (typeof options === 'string') {
                    data[options].apply(data, args);
                }
            });
        };
    }

    return Rangeslider;
}));
