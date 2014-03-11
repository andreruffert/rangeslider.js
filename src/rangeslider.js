(function (module) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], module);
    } else {
        // Browser globals
        module(jQuery);
    }
})(function($, undefined) {

    'use strict';

    /**
     * Range feature detection
     * @return {Boolean}
     */
    function supportsRange() {
        var input = document.createElement('input');
        input.setAttribute('type', 'range');
        return input.type !== 'text';
    }

    /**
     * Touchscreen detection
     * @return {Boolean}
     */
    function isTouchScreen() {
        var bool = false,
            DocumentTouch = DocumentTouch || {};
        if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
            bool = true;
        }
        return bool;
    }

    var pluginName = 'rangeslider',
        touchevents = isTouchScreen(),
        inputrange = supportsRange(),
        defaults = {
            polyfill: true,
            baseClass: 'rangeslider',
            rangeClass: 'rangeslider__range',
            fillClass: 'rangeslider__fill',
            handleClass: 'rangeslider__handle',
            startEvent: ((!touchevents) ? 'mousedown' : 'touchstart') + '.' + pluginName,
            moveEvent: ((!touchevents) ? 'mousemove' : 'touchmove') + '.' + pluginName,
            endEvent: ((!touchevents) ? 'mouseup' : 'touchend') + '.' + pluginName
        };

    /**
     * Delays a function for the given number of milliseconds, and then calls
     * it with the arguments supplied.
     *
     * @param  {Function} fn   [description]
     * @param  {Number}   wait [description]
     * @return {Function}
     */
    function delay(fn, wait) {
        var args = Array.prototype.slice.call(arguments, 2);
        return setTimeout(function(){ return fn.apply(null, args); }, wait);
    }

    /**
     * Returns a debounced function that will make sure the given
     * function is not triggered too much.
     *
     * @param  {Function} fn Function to debounce.
     * @param  {Number}   debounceDuration OPTIONAL. The amount of time in milliseconds for which we will debounce the function. (defaults to 100ms)
     * @return {Function}
     */
    function debounce(fn, debounceDuration) {
        debounceDuration = debounceDuration || 100;
        return function() {
            if (!fn.debouncing) {
                var args = Array.prototype.slice.apply(arguments);
                fn.lastReturnVal = fn.apply(window, args);
                fn.debouncing = true;
            }
            clearTimeout(fn.debounceTimeout);
            fn.debounceTimeout = setTimeout(function(){
                fn.debouncing = false;
            }, debounceDuration);
            return fn.lastReturnVal;
        };
    }

    /**
     * Plugin
     * @param {String} element
     * @param {Object} options
     */
    function Plugin(element, options) {
        this.$window    = $(window);
        this.$document  = $(document);
        this.$element   = $(element);
        this.options    = $.extend( {}, defaults, options );
        this._defaults  = defaults;
        this._name      = pluginName;
        this.polyfill   = this.options.polyfill;
        this.onInit     = this.options.onInit;
        this.onSlide    = this.options.onSlide;
        this.onSlideEnd = this.options.onSlideEnd;

        // Plugin should only be used as a polyfill
        if (this.polyfill) {
            // Input range support?
            if (inputrange) { return false; }
        }

        this.identifier = 'js-' + pluginName + '-' + +new Date();
        this.value      = parseFloat(this.$element[0].value) || 0;
        this.min        = parseFloat(this.$element[0].getAttribute('min')) || 0;
        this.max        = parseFloat(this.$element[0].getAttribute('max')) || 0;
        this.step       = parseFloat(this.$element[0].getAttribute('step')) || 1;
        this.$range     = $('<div class="' + this.options.rangeClass + '" />');
        this.$fill      = $('<div class="' + this.options.fillClass + '" />');
        this.$handle    = $('<div class="' + this.options.handleClass + '" />');
        this.$base      = $('<div class="' + this.options.baseClass + '" id="' + this.identifier + '" />').insertBefore(this.$element).prepend(this.$range, this.$fill, this.$handle, this.$element);

        // visually hide the input
        this.$element.css({
            'position': 'absolute',
            'width': '1px',
            'height': '1px',
            'overflow': 'hidden',
            'visibility': 'hidden'
        });

        // Store context
        this.handleDown = $.proxy(this.handleDown, this);
        this.handleMove = $.proxy(this.handleMove, this);
        this.handleEnd  = $.proxy(this.handleEnd, this);

        this.init();

        // Attach Events
        var _this = this;
        this.$window.on('resize' + '.' + pluginName, debounce(function() {
            // Simulate resizeEnd event.
            delay(function() { _this.update(); }, 300);
        }, 20));
        this.$document.on(this.options.startEvent, '#' + this.identifier, this.handleDown);
    }

    Plugin.prototype.init = function() {
        this.update();

        if (this.onInit && typeof this.onInit === 'function') {
            this.onInit();
        }
    };

    Plugin.prototype.update = function() {
        this.handleWidth    = this.$handle.width();
        this.rangeWidth     = this.$range[0].offsetWidth;
        this.maxHandleX     = this.rangeWidth - this.handleWidth;
        this.grabX          = this.handleWidth / 2;
        this.position       = this.getPositionFromValue(this.value);

        this.setPosition(this.position);
    };

    Plugin.prototype.handleDown = function(e) {
        e.preventDefault();
        this.$document.on(this.options.moveEvent, this.handleMove);
        this.$document.on(this.options.endEvent, this.handleEnd);

        var posX = this.getRelativePosition(this.$base[0], e),
            handleX = this.getPositionFromNode(this.$handle[0]) - this.getPositionFromNode(this.$base[0]);

        this.setPosition(posX - this.grabX);

        if (posX >= handleX && posX < handleX + this.handleWidth) {
            this.grabX = posX - handleX;
        }
    };

    Plugin.prototype.handleMove = function(e) {
        e.preventDefault();
        var posX = this.getRelativePosition(this.$base[0], e);
        this.setPosition(posX - this.grabX);
    };

    Plugin.prototype.handleEnd = function(e) {
        e.preventDefault();
        this.$document.off(this.options.moveEvent, this.handleMove);
        this.$document.off(this.options.endEvent, this.handleEnd);

        var posX = this.getRelativePosition(this.$base[0], e);
        if (this.onSlideEnd && typeof this.onSlideEnd === 'function') {
            this.onSlideEnd(posX - this.grabX, this.value);
        }
    };

    Plugin.prototype.cap = function(pos, min, max) {
        if (pos < min) { return min; }
        if (pos > max) { return max; }

        return pos;
    };

    Plugin.prototype.setPosition = function(pos) {
        var left, value;
        left = this.cap(pos, 0, this.maxHandleX);
        value = this.getValueFromPosition(left);

        // Snap steps
        if (this.step !== 1) {
            value = Math.ceil((value) / this.step ) * this.step;
            left = this.getPositionFromValue(value);
        }

        left = Math.ceil(left);

        this.$fill[0].style.width = (left + this.handleWidth)  + 'px';
        this.$handle[0].style.left = left + 'px';
        this.setValue(value);

        // Update globals
        this.position = left;
        this.value = value;

        if (this.onSlide && typeof this.onSlide === 'function') {
            this.onSlide(left, value);
        }
    };

    Plugin.prototype.getPositionFromNode = function(node) {
        var i = 0;
        while (node !== null) {
            i += node.offsetLeft;
            node = node.offsetParent;
        }
        return i;
    };

    Plugin.prototype.getRelativePosition = function(node, e) {
        return (e.pageX || e.originalEvent.changedTouches[0].pageX || 0) - this.getPositionFromNode(node);
    };

    Plugin.prototype.getPositionFromValue = function(value) {
        var percentage, pos;
        percentage = ((value - this.min) / (this.max - this.min)) * 100;
        pos = (percentage/100) * this.maxHandleX;

        return pos;
    };

    Plugin.prototype.getValueFromPosition = function(pos) {
        var percentage, value;
        percentage = ((pos) / (this.maxHandleX)) * 100;
        value = this.step * Math.ceil((((percentage/100) * (this.max - this.min)) + this.min) / this.step);

        return value;
    };

    Plugin.prototype.setValue = function(value) {
        this.$element.val(value).trigger('change');
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
        });
    };

});
