window.theme = window.theme || {};

/* ================ SLATE ================ */
window.theme = window.theme || {};

theme.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];

  $(document)
    .on('shopify:section:load', this._onSectionLoad.bind(this))
    .on('shopify:section:unload', this._onSectionUnload.bind(this))
    .on('shopify:section:select', this._onSelect.bind(this))
    .on('shopify:section:deselect', this._onDeselect.bind(this))
    .on('shopify:block:select', this._onBlockSelect.bind(this))
    .on('shopify:block:deselect', this._onBlockDeselect.bind(this));

  // Global sections event listeners
  // Section select
  $(document).on('shopify:section:select', function(evt) {
    if (evt.detail.sectionId !== 'sidebar-menu') {
      theme.LeftDrawer.close();
    }
  });
};

theme.Sections.prototype = _.assignIn({}, theme.Sections.prototype, {
  _createInstance: function(container, constructor) {
    var $container = $(container);
    var id = $container.attr('data-section-id');
    var type = $container.attr('data-section-type');

    constructor = constructor || this.constructors[type];

    if (_.isUndefined(constructor)) return;

    var instance = _.assignIn(new constructor(container), {
      id: id,
      type: type,
      container: container
    });

    this.instances.push(instance);
  },

  _onSectionLoad: function(evt) {
    var container = $('[data-section-id]', evt.target)[0];
    if (container) {
      this._createInstance(container);
    }
  },

  _onSectionUnload: function(evt) {
    this.instances = _.filter(this.instances, function(instance) {
      var isEventInstance = instance.id === evt.detail.sectionId;

      if (isEventInstance) {
        if (_.isFunction(instance.onUnload)) {
          instance.onUnload(evt);
        }
      }

      return !isEventInstance;
    });
  },

  _onSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onSelect)) {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onDeselect)) {
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockSelect)) {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockDeselect)) {
      instance.onBlockDeselect(evt);
    }
  },

  register: function(type, constructor) {
    this.constructors[type] = constructor;

    $('[data-section-type=' + type + ']').each(
      function(index, container) {
        this._createInstance(container, constructor);
      }.bind(this)
    );
  }
});


/* ================ MODULES ================ */
window.a11y = window.a11y || {};

a11y.trapFocus = function($container, eventNamespace) {
  var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

  $container.attr('tabindex', '-1').focus();

  $(document).on(eventName, function(evt) {
    if ($container[0] !== evt.target && !$container.has(evt.target).length) {
      $container.focus();
    }
  });
};

a11y.removeTrapFocus = function($container, eventNamespace) {
  var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

  $container.removeAttr('tabindex');
  $(document).off(eventName);
};

window.Modals = (function() {
  var Modal = function(id, name, options) {
    var defaults = {
      close: '.js-modal-close',
      open: '.js-modal-open-' + name,
      openClass: 'modal--is-active'
    };

    this.$modal = $('#' + id);

    if (!this.$modal.length) {
      return false;
    }

    this.nodes = {
      $parent: $('body, html')
    };
    this.config = $.extend(defaults, options);
    this.modalIsOpen = false;
    this.$focusOnOpen = this.config.$focusOnOpen
      ? $(this.config.$focusOnOpen)
      : this.$modal;
    this.init();
  };

  Modal.prototype.init = function() {
    var $openBtn = $(this.config.open);

    // Add aria controls
    $openBtn.attr('aria-expanded', 'false');

    $(this.config.open).on('click', $.proxy(this.open, this));
    this.$modal.find(this.config.close).on('click', $.proxy(this.close, this));
  };

  Modal.prototype.open = function(evt) {
    // Keep track if modal was opened from a click, or called by another function
    var externalCall = false;

    // don't open an opened modal
    if (this.modalIsOpen) return;

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the modal opens, the click event bubbles up to $nodes.page
    // which closes the modal.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.modalIsOpen && !externalCall) {
      return this.close();
    }

    this.$modal.prepareTransition().addClass(this.config.openClass);
    this.nodes.$parent.addClass(this.config.openClass);

    this.modalIsOpen = true;

    // Set focus on modal
    a11y.trapFocus(this.$focusOnOpen, 'modal_focus');

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    this.bindEvents();
  };

  Modal.prototype.close = function() {
    // don't close a closed modal
    if (!this.modalIsOpen) return;

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    this.$modal.prepareTransition().removeClass(this.config.openClass);
    this.nodes.$parent.removeClass(this.config.openClass);

    this.modalIsOpen = false;

    // Remove focus on modal
    a11y.removeTrapFocus(this.$focusOnOpen, 'modal_focus');

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'false');
    }

    this.unbindEvents();
  };

  Modal.prototype.bindEvents = function() {
    // Pressing escape closes modal
    this.nodes.$parent.on(
      'keyup.modal',
      $.proxy(function(evt) {
        if (evt.keyCode === 27) {
          this.close();
        }
      }, this)
    );
  };

  Modal.prototype.unbindEvents = function() {
    this.nodes.$parent.off('.modal');
  };

  return Modal;
})();

/**
 *  Vendor
 *
 *  Small minified vendor scripts can be placed at the top of this file to
 *  reduce network requests.
 *
 */

/**
 *
 *  ShopifyCanvas JS
 *  - Base Canvas functions and utilities.
 *
 */

window.ShopifyCanvas = window.ShopifyCanvas || {};

/**
 *
 *  Initialize function for all ShopifyCanvas JS.
 *  - call any functions required on page load here.
 *
 */
ShopifyCanvas.init = function() {
  ShopifyCanvas.cacheSelectors();
  ShopifyCanvas.checkUrlHash();
  ShopifyCanvas.initEventListeners();
  ShopifyCanvas.resetPasswordSuccess();
  ShopifyCanvas.customerAddressForm();
};

/**
 *
 *  Cache any jQuery objects.
 *
 */
ShopifyCanvas.cacheSelectors = function() {
  ShopifyCanvas.cache = {
    $html: $('html'),
    $body: $('body')
  };
};

ShopifyCanvas.initEventListeners = function() {
  //Show reset password form
  $('#RecoverPassword').on('click', function(evt) {
    evt.preventDefault();
    ShopifyCanvas.toggleRecoverPasswordForm();
  });

  //Hide reset password form
  $('#HideRecoverPasswordLink').on('click', function(evt) {
    evt.preventDefault();
    ShopifyCanvas.toggleRecoverPasswordForm();
  });
};

/**
 *
 *  Show/Hide recover password form
 *
 */
ShopifyCanvas.toggleRecoverPasswordForm = function() {
  $('#RecoverPasswordForm').toggleClass('hide');
  $('#CustomerLoginForm').toggleClass('hide');
};

/**
 *
 *  Show reset password success message
 *
 */
ShopifyCanvas.resetPasswordSuccess = function() {
  var $formState = $('.reset-password-success');

  //check if reset password form was successfully submited.
  if (!$formState.length) return;

  // show success message
  $('#ResetSuccess').removeClass('hide');
};

/**
 *
 *  Show/hide customer address forms
 *
 */
ShopifyCanvas.customerAddressForm = function() {
  var $newAddressForm = $('#AddressNewForm');

  if (!$newAddressForm.length) return;

  // Initialize observers on address selectors, defined in shopify_common.js
  new Shopify.CountryProvinceSelector(
    'AddressCountryNew',
    'AddressProvinceNew',
    {
      hideElement: 'AddressProvinceContainerNew'
    }
  );

  // Initialize each edit form's country/province selector
  $('.address-country-option').each(function() {
    var formId = $(this).data('form-id');
    var countrySelector = 'AddressCountry_' + formId;
    var provinceSelector = 'AddressProvince_' + formId;
    var containerSelector = 'AddressProvinceContainer_' + formId;

    new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
      hideElement: containerSelector
    });
  });

  // Toggle new/edit address forms
  $('.address-new-toggle').on('click', function() {
    $newAddressForm.toggleClass('hide');
  });

  $('.address-edit-toggle').on('click', function() {
    var formId = $(this).data('form-id');
    $('#EditAddress_' + formId).toggleClass('hide');
  });

  $('.address-delete').on('click', function() {
    var $el = $(this);
    var formId = $el.data('form-id');
    var confirmMessage = $el.data('confirm-message');
    if (
      confirm(confirmMessage || 'Are you sure you wish to delete this address?')
    ) {
      Shopify.postLink('/account/addresses/' + formId, {
        parameters: { _method: 'delete' }
      });
    }
  });
};

/**
 *
 *  Check URL for reset password hash
 *
 */
ShopifyCanvas.checkUrlHash = function() {
  var hash = ShopifyCanvas.getHash();

  // Allow deep linking to recover password form
  if (hash === '#recover') {
    ShopifyCanvas.toggleRecoverPasswordForm();
  }
};

/**
 *
 *  Get the hash from the URL
 *
 */
ShopifyCanvas.getHash = function() {
  return window.location.hash;
};

// Initialize ShopifyCanvas's JS on docready
$(ShopifyCanvas.init);

/*
 * Returns a function which adds a vendor prefix to any CSS property name
 * Source https://github.com/markdalgleish/stellar.js/blob/master/src/jquery.stellar.js
 */

var vendorPrefix = (function() {
  var prefixes = /^(Moz|Webkit|O|ms)(?=[A-Z])/,
    style = $('script')[0].style,
    prefix = '',
    prop;

  for (prop in style) {
    if (prefixes.test(prop)) {
      prefix = prop.match(prefixes)[0];
      break;
    }
  }

  if ('WebkitOpacity' in style) {
    prefix = 'Webkit';
  }
  if ('KhtmlOpacity' in style) {
    prefix = 'Khtml';
  }

  return function(property) {
    return (
      prefix +
      (prefix.length > 0
        ? property.charAt(0).toUpperCase() + property.slice(1)
        : property)
    );
  };
})();

/*
 * Shopify JS for customizing Slick.js
 *   http://kenwheeler.github.io/slick/
 *   Untouched JS in src/javascripts/slick.min.js (dev)
 *   Added to the top of this file in production

 * Requires $.debounce function from theme.js
 */

var slickTheme = (function(module, $) {
  'use strict';

  // Public functions
  var init, onInit, beforeChange, afterChange;

  // Private variables
  var settings,
    $slider,
    $allSlides,
    $activeSlide,
    $slickDots,
    $paginations,
    $mobileDotsContainer,
    windowHeight,
    scrolled,
    prefixedTransform;
  var currentActiveSlide = 0;

  // Private functions
  var cacheObjects,
    setFullScreen,
    setPaginationAttributes,
    adaptHeight,
    showActiveContent,
    keyboardNavigation,
    togglePause,
    sizeFullScreen,
    setParallax,
    calculateParallax,
    slideshowA11ySetup;

  /*============================================================================
  Initialise the plugin and define global options
  ==============================================================================*/
  cacheObjects = function() {
    slickTheme.cache = {
      $html: $('html'),
      $window: $(window),
      $hero: $('#Hero'),
      $heroImage: $('.hero__image'),
      $pauseButton: $('.hero__pause'),
      $heroDotsWrapper: $('.hero__dots-wrapper'),
      $heroDotsWrapperDesktop: $('.hero__dots-wrapper-desktop'),
      $heroContentWrapperMobile: $('.hero__content-wrapper-mobile'),
      $heroHeader: $('.hero__header')
    };

    slickTheme.vars = {
      slideClass: 'slick-slide',
      activeClass: 'slick-active',
      slickList: '.slick-list',
      slickDots: '.slick-dots',
      slickActiveMobile: 'slick-active-mobile',
      hiddenClass: 'hero__slide--hidden',
      pausedClass: 'is-paused',
      activeContentClass: 'is-active',
      pagination: '[data-slide-pagination]',
      adapt: slickTheme.cache.$hero.data('adapt'),
      loadSlideA11yString: slickTheme.cache.$hero.data('slide-nav-a11y'),
      activeSlideA11yString: slickTheme.cache.$hero.data(
        'slide-nav-active-a11y'
      )
    };
  };

  init = function(options) {
    cacheObjects();

    // Default settings
    settings = {
      // User options
      $element: null,

      // Private settings
      isTouch: slickTheme.cache.$html.hasClass('supports-touch') ? true : false,

      // Slick options
      arrows: false,
      dots: true,
      adaptiveHeight: false
    };

    // Override defaults with arguments
    $.extend(settings, options);

    /*
    * Init slick slider
    *   - Add any additional option changes here
    *   - https://github.com/kenwheeler/slick/#options
    */
    settings.$element.slick({
      arrows: settings.arrows,
      dots: settings.dots,
      draggable: false,
      fade: true,
      slide: '.hero__slide',
      /*eslint-disable shopify/jquery-dollar-sign-reference */
      prevArrow: $('.slick-prev'),
      nextArrow: $('.slick-next'),
      appendDots: $('.hero__dots-wrapper'),
      /*eslint-enable shopify/jquery-dollar-sign-reference */
      autoplay: slickTheme.cache.$hero.data('autoplay'),
      autoplaySpeed: slickTheme.cache.$hero.data('autoplayspeed'),
      speed: settings.speed,
      pauseOnHover: false,
      onInit: this.onInit,
      onBeforeChange: this.beforeChange,
      onAfterChange: this.afterChange,
      customPaging: function(slick, index) {
        var labelString =
          index === 0
            ? slickTheme.vars.activeSlideA11yString
            : slickTheme.vars.loadSlideA11yString;
        return (
          '<a href="#Hero" class="hero__dots" aria-label="' +
          labelString.replace('[slide_number]', index + 1) +
          '" data-slide-number="' +
          index +
          '" data-slide-pagination aria-controls="SlickSlide' +
          (index + 1) +
          '"></a>'
        );
      }
    });
  };

  onInit = function(obj) {
    $slider = obj.$slider;
    $allSlides = $slider.find('.' + slickTheme.vars.slideClass);
    $activeSlide = $slider.find('.' + slickTheme.vars.activeClass);
    $slickDots = $(slickTheme.vars.slickDots);
    $paginations = slickTheme.cache.$heroDotsWrapper.find(
      slickTheme.vars.pagination
    );
    $mobileDotsContainer = slickTheme.cache.$heroContentWrapperMobile.find(
      slickTheme.vars.slickDots
    );

    if (!settings.isTouch) {
      $allSlides.addClass(slickTheme.vars.hiddenClass);
      $activeSlide.removeClass(slickTheme.vars.hiddenClass);
    }

    if (slickTheme.vars.adapt) {
      adaptHeight();
      showActiveContent(0);
    } else {
      setFullScreen();
    }

    if (slickTheme.cache.$html.hasClass('supports-csstransforms3d')) {
      setParallax();
    }

    //trigger event that slick has initialized
    slickTheme.cache.$window.trigger('slick-initialized');

    if (settings.autoplay) {
      slickTheme.cache.$pauseButton.on('click', togglePause);
    }

    slideshowA11ySetup();
  };

  beforeChange = function(evt, currentSlide, nextSlide) {
    if (!settings.isTouch) {
      $allSlides.removeClass(slickTheme.vars.hiddenClass);
    }

    // Set upcoming slide as index
    currentActiveSlide = nextSlide;

    // Set new active slide to proper parallax position
    if (slickTheme.cache.$html.hasClass('supports-csstransforms3d')) {
      calculateParallax(currentActiveSlide);
    }

    var $desktopPagination = slickTheme.cache.$heroDotsWrapperDesktop.find(
      slickTheme.vars.pagination
    );

    var $mobilePagination = slickTheme.cache.$heroContentWrapperMobile.find(
      slickTheme.vars.pagination
    );

    // initialize both $desktopPagination and $mobilePagination
    // at the same time
    $desktopPagination.each(function(index) {
      var currentElem = this;
      setPaginationAttributes(currentElem, index, nextSlide);
    });

    $mobilePagination.each(function(index) {
      var currentElem = this;
      setPaginationAttributes(currentElem, index, nextSlide);
    });

    $paginations
      .removeAttr('aria-current', 'true')
      .eq(nextSlide)
      .attr('aria-current', 'true');

    if (!slickTheme.vars.adapt || !$mobileDotsContainer.length) {
      return;
    }

    var $mobileDotsList = $mobileDotsContainer.find('li');

    showActiveContent(nextSlide);

    // toggle active class on mobile dots
    $mobileDotsList
      .removeAttr('aria-hidden')
      .removeClass(slickTheme.vars.slickActiveMobile)
      .eq(nextSlide)
      .addClass(slickTheme.vars.slickActiveMobile)
      .attr('aria-hidden', false);
  };

  afterChange = function() {
    var $dotsList = $slickDots.find('li');
    var $activeDot = $slickDots.find('.' + slickTheme.vars.activeClass);

    $dotsList.removeAttr('aria-hidden');
    $activeDot.attr('aria-hidden', false);

    if (settings.isTouch) return;

    $activeSlide = $slider.find('.' + slickTheme.vars.activeClass);
    $allSlides.addClass(slickTheme.vars.hiddenClass).attr('aria-hidden', true);
    $activeSlide
      .removeClass(slickTheme.vars.hiddenClass)
      .attr('aria-hidden', false);
  };

  setPaginationAttributes = function(currentElem, index, nextSlide) {
    var labelString =
      index === nextSlide
        ? slickTheme.vars.activeSlideA11yString
        : slickTheme.vars.loadSlideA11yString;

    labelString = labelString.replace('[slide_number]', index + 1);
    $(currentElem).attr('aria-label', labelString);
  };

  adaptHeight = function() {
    // Set class on action bar
    slickTheme.cache.$heroHeader.addClass('hero__header--adapt');

    // set custom dot class for adapt height on mobile
    if (!$mobileDotsContainer.length) {
      return;
    }

    var $initialActiveDot = $mobileDotsContainer.find('li:first-of-type');
    $initialActiveDot.addClass(slickTheme.vars.slickActiveMobile);
  };

  setFullScreen = function() {
    sizeFullScreen();

    // Resize hero after screen resize
    slickTheme.cache.$window.on('resize', $.debounce(250, sizeFullScreen));
  };

  showActiveContent = function(slideIndex) {
    if ($allSlides.length <= 1) return;

    var $contentMobile = $('.hero__content-mobile');

    if (!$contentMobile.length) {
      return;
    }

    var $currentContentMobile = $contentMobile.filter(
      '[data-index="' + (slideIndex + 1) + '"]'
    );

    $contentMobile.removeClass(slickTheme.vars.activeContentClass);
    $currentContentMobile.addClass(slickTheme.vars.activeContentClass);
  };

  keyboardNavigation = function(evt) {
    if (evt.keyCode === 37) {
      settings.$element.slickPrev();
    }
    if (evt.keyCode === 39) {
      settings.$element.slickNext();
    }
  };

  togglePause = function() {
    var $pauseButton = $(this);
    var isPaused = $pauseButton.hasClass(slickTheme.vars.pausedClass);

    $pauseButton
      .toggleClass(slickTheme.vars.pausedClass, !isPaused)
      .attr(
        'aria-label',
        isPaused
          ? $pauseButton.data('label-pause')
          : $pauseButton.data('label-play')
      );

    if (settings.autoplay) {
      if (isPaused) {
        settings.$element.slickPlay();
      } else {
        settings.$element.slickPause();
      }
    }
  };

  sizeFullScreen = function() {
    if (theme.cache.$announcementBar.length) {
      windowHeight =
        slickTheme.cache.$window.height() -
        theme.cache.$announcementBar.height();
    } else {
      windowHeight = slickTheme.cache.$window.height();
    }

    settings.$element.css('height', windowHeight);
  };

  setParallax = function() {
    prefixedTransform = vendorPrefix ? vendorPrefix('transform') : 'transform';

    slickTheme.cache.$window.on('scroll', function() {
      calculateParallax(currentActiveSlide);
    });
  };

  calculateParallax = function(currentSlide) {
    scrolled = slickTheme.cache.$window.scrollTop();

    if (slickTheme.cache.$heroImage[currentSlide]) {
      slickTheme.cache.$heroImage[currentSlide].style[prefixedTransform] =
        'translate3d(0, ' + scrolled / 4.5 + 'px, 0)';
    }

    if (theme.cache.$announcementBar.length) {
      $(theme.cache.$announcementBar).css({
        transform: 'translate3d(0, ' + scrolled / 4.5 + 'px, 0)'
      });
    }
  };

  slideshowA11ySetup = function() {
    var $list = slickTheme.cache.$hero.find(slickTheme.vars.slickList);
    var $dotsList = $slickDots.find('li');
    var $activeDot = $slickDots.find('.' + slickTheme.vars.activeClass);
    var $mobileActiveDot = $slickDots.find(
      '.' + slickTheme.vars.slickActiveMobile
    );
    // When an element in the slider is focused
    // pause slideshow and set active slide aria-live.
    slickTheme.cache.$hero
      .on('focusin', function(evt) {
        if (
          !slickTheme.cache.$hero.has(evt.target).length ||
          $list.attr('aria-live') === 'polite'
        ) {
          return;
        }

        $list.attr('aria-live', 'polite');
        if (settings.autoplay) {
          settings.$element.slickPause();
        }
      })
      .on('focusout', function(evt) {
        if (slickTheme.cache.$hero.has(evt.relatedTarget).length) {
          return;
        }

        $list.removeAttr('aria-live');
        if (settings.autoplay) {
          // Only resume playing if the user hasn't paused using the pause
          // button
          if (
            !slickTheme.cache.$pauseButton.hasClass(slickTheme.vars.pausedClass)
          ) {
            settings.$element.slickPlay();
          }
        }
      })
      .on('keyup', keyboardNavigation.bind(this));

    $list.removeAttr('tabindex');
    $dotsList.removeAttr('aria-hidden');
    $activeDot.attr('aria-hidden', false);
    $mobileActiveDot.attr('aria-hidden', false);

    if ($allSlides.length > 1) {
      $paginations
        .each(function() {
          $(this).on('click keyup', function(evt) {
            if (evt.type === 'keyup' && evt.which !== 13) return;

            evt.preventDefault();

            slickTheme.cache.$hero.attr('tabindex', -1);

            if (evt.type === 'keyup') {
              slickTheme.cache.$hero.focus();
            }
          });
        })
        .eq(0)
        .attr('aria-current', 'true');
    }
  };

  module = {
    init: init,
    onInit: onInit,
    beforeChange: beforeChange,
    afterChange: afterChange
  };

  return module;
})(slickTheme || {}, jQuery);

/*============================================================================
  Drawer modules
==============================================================================*/
theme.Drawers = (function() {
  var Drawer = function(id, position, options) {
    var defaults = {
      close: '.js-drawer-close',
      open: '.js-drawer-open-' + position,
      openClass: 'js-drawer-open',
      dirOpenClass: 'js-drawer-open-' + position
    };

    this.nodes = {
      $parent: $('body, html'),
      $page: $('#PageContainer')
    };

    this.config = $.extend(defaults, options);
    this.position = position;

    this.$drawer = $('#' + id);

    if (!this.$drawer.length) {
      return false;
    }

    this.drawerIsOpen = false;
    this.init();
  };

  Drawer.prototype.init = function() {
    $(this.config.open).on('click', $.proxy(this.open, this));
    this.$drawer.on('click', this.config.close, $.proxy(this.close, this));
  };

  Drawer.prototype.open = function(evt) {
    // Keep track if drawer was opened from a click, or called by another function
    var externalCall = false;

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the drawer opens, the click event bubbles up to $nodes.page
    // which closes the drawer.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.drawerIsOpen && !externalCall) {
      return this.close();
    }

    // Add is-transitioning class to moved elements on open so drawer can have
    // transition for close animation
    this.$drawer.prepareTransition();

    this.nodes.$parent.addClass(
      this.config.openClass + ' ' + this.config.dirOpenClass
    );
    this.drawerIsOpen = true;

    // Set focus on drawer
    this.trapFocus({
      $container: this.$drawer,
      $elementToFocus: this.$drawer.find('.drawer__close-button'),
      namespace: 'drawer_focus'
    });

    // Run function when draw opens if set
    if (
      this.config.onDrawerOpen &&
      typeof this.config.onDrawerOpen === 'function'
    ) {
      if (!externalCall) {
        this.config.onDrawerOpen();
      }
    }

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    this.nodes.$parent.on(
      'keyup.drawer',
      $.proxy(function(evt) {
        // close on 'esc' keypress
        if (evt.keyCode !== 27) return;

        this.close();
      }, this)
    );

    // Lock scrolling on mobile
    this.nodes.$page.on('touchmove.drawer', function() {
      return false;
    });

    this.nodes.$page.on(
      'click.drawer',
      $.proxy(function() {
        this.close();
        return false;
      }, this)
    );
  };

  Drawer.prototype.close = function() {
    if (!this.drawerIsOpen) return;

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    // Ensure closing transition is applied to moved elements, like the nav
    this.$drawer.prepareTransition();

    this.nodes.$parent.removeClass(
      this.config.dirOpenClass + ' ' + this.config.openClass
    );

    this.drawerIsOpen = false;

    // Remove focus on drawer
    this.removeTrapFocus({
      $container: this.$drawer,
      namespace: 'drawer_focus'
    });

    this.nodes.$page.off('.drawer');
    this.nodes.$parent.off('.drawer');
  };

  /**
  * Traps the focus in a particular container
  *
  * @param {object} options - Options to be used
  * @param {jQuery} options.$container - Container to trap focus within
  * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
  * @param {string} options.namespace - Namespace used for new focus event handler
  */
  Drawer.prototype.trapFocus = function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (!options.$elementToFocus) {
      options.$elementToFocus = options.$container;
    }

    options.$container.attr('tabindex', '-1');
    options.$elementToFocus.focus();

    $(document).on(eventName, function(evt) {
      if (
        options.$container[0] !== evt.target &&
        !options.$container.has(evt.target).length
      ) {
        options.$container.focus();
      }
    });
  };

  /**
   * Removes the trap of focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  Drawer.prototype.removeTrapFocus = function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (options.$container && options.$container.length) {
      options.$container.removeAttr('tabindex');
    }

    $(document).off(eventName);
  };

  return Drawer;
})();

theme.ActionBar = (function() {
  function init() {
    cacheSelectors();
    initStickyActionBar();
    initActionBar();

    theme.cache.$window.on('resize', $.debounce(250, resizeEvents));
  }

  function cacheSelectors() {
    var cache = {
      $actionBar: $('.action-bar'),
      $actionArea: $('.action-area'),
      $actionBarWrapper: $('.action-bar-wrapper'),
      $actionBarMenus: $('.action-bar__menu'),
      $actionBarMenuHasDropdown: $('.action-bar--has-dropdown'),
      $activeActionBarHasSubMenu: $(
        '.action-bar--has-dropdown.action-bar--active'
      ),
      $actionBarMainMenu: $('.action-bar__menu--main'),
      $actionBarSubMenus: $('.action-bar__menu--sub'),
      $actionBarBack: $('.action-bar__back'),
      $actionBarMainMenuFirst: $(
        '.action-bar__menu--main .action-bar__link'
      ).eq(0)
    };

    $.extend(theme.cache, cache);

    var variables = {
      previousScrollPosition: 0,
      hasActionBar: theme.cache.$actionBar.length,
      actionBarOffsetTop: 0,
      actionBarOffsetBottom: 0,
      stickyClass: 'js-sticky-action-bar',
      actionBarOpenTransitionClass: 'js-sticky-action-bar--open'
    };

    $.extend(theme.variables, variables);
  }

  function initActionBar() {
    actionBarScroll();

    if (theme.cache.$actionBarMenuHasDropdown.length) {
      actionBarDropdowns();
    }

    theme.cache.$window.on('resize', $.debounce(500, actionBarScroll));
  }

  function actionBarDropdowns() {
    var $activeSubNavItem = theme.cache.$actionBarSubMenus.find(
      '.action-bar--active'
    );
    var activeSubNavTarget = theme.cache.$activeActionBarHasSubMenu.attr(
      'data-child-list-handle'
    );
    var showClass = 'action-bar--show';

    theme.cache.$actionBarBack.on('click', closeSubNav);

    // Prevent Click Event on action bar links which have submenus if they
    // are active
    theme.cache.$actionBarMainMenu.on(
      'click',
      '.action-bar--disabled',
      function(evt) {
        evt.preventDefault();

        openSubNavFromNavItem();
      }
    );

    if ($activeSubNavItem.length) {
      openSubNavFromSubNavItem();
    }

    /*
      Open SubNav if there is an active Parent with a dropdown in the action bar
     */
    function openSubNavFromNavItem() {
      theme.cache.$actionBarMainMenu.removeClass(showClass);

      // loop through any dropdowns that exist
      theme.cache.$actionBarSubMenus.each(function() {
        var $el = $(this);

        if (activeSubNavTarget === $el.attr('data-child-list-handle')) {
          $el.prepareTransition().addClass(showClass);
          theme.setFocus($el.find('.action-bar__link').eq(0), 'action-bar');
        }
      });

      actionBarScroll();
    }

    /*
      Open SubNav if one of the action bar subnav links is active
     */
    function openSubNavFromSubNavItem() {
      //select the first active subnav item (uses .last() because jQuery)
      var $activeSubNav = $activeSubNavItem
        .parents('.action-bar__menu--sub')
        .last();

      theme.cache.$actionBarMainMenu.removeClass(showClass);
      $activeSubNav.addClass(showClass);

      // find parent menu item and mark it active
      theme.cache.$actionBarMenuHasDropdown.each(function() {
        var $el = $(this);
        var menuHandle = $el.attr('data-child-list-handle');

        if (menuHandle === $activeSubNav.attr('data-child-list-handle')) {
          $el.addClass('action-bar--disabled');

          //update the active parent childListHandle
          activeSubNavTarget = menuHandle;
        }
      });

      actionBarScroll();
    }

    function closeSubNav() {
      theme.cache.$actionBarSubMenus.removeClass(showClass);
      theme.cache.$actionBarMainMenu.prepareTransition().addClass(showClass);
      theme.setFocus(theme.cache.$actionBarMainMenuFirst, 'action-bar');
      actionBarScroll();
    }
  }

  function actionBarScroll() {
    // set dynamic variables which might have changed since the last time
    // actionBarScroll() was called
    var $activeActionBar = $('.action-bar--show');
    var activeActionBarWidth = $activeActionBar.width();
    //set action bar to be scrollable

    if (activeActionBarWidth > theme.variables.windowWidth) {
      var $activeLink = $activeActionBar.find('.action-bar--active');

      theme.cache.$actionBarWrapper.addClass('scrollable-js');

      //only scroll if a link is marked active
      if ($activeLink.length) {
        var activeOffset = $activeLink.offset().left;
        var scrollToLink = 0;

        if (activeOffset > theme.variables.windowWidth / 2) {
          scrollToLink = activeOffset - theme.variables.windowWidth / 3;

          theme.cache.$actionBar.animate({
            scrollLeft: scrollToLink
          });
        }
      }
    } else {
      theme.cache.$actionBarWrapper.removeClass('scrollable-js');
      theme.cache.$actionBar.animate({
        scrollLeft: 0
      });
    }

    theme.cache.$actionBar.on('scroll', $.throttle(100, scrollPosition));

    function scrollPosition() {
      var leftEdge = $activeActionBar.offset().left;

      // Make sure we've scrolled passed a buffer of 100px
      if (leftEdge < -100) {
        theme.cache.$actionBarWrapper.addClass('scrolled');
      } else {
        theme.cache.$actionBarWrapper.removeClass('scrolled');
      }
    }
  }

  function resizeEvents() {
    var windowWidth = theme.cache.$window.width();

    if (windowWidth === theme.variables.windowWidth) return;

    theme.variables.windowWidth = windowWidth;
    setStickyActionBarVariables();
  }

  function initStickyActionBar() {
    if (!theme.cache.$actionBar.length) {
      resizeHeader();
      return;
    }

    // if there is a slideshow we need to reset the 'top' of the page
    // to the bottom of the slideshow
    if (theme.cache.$hero.length) {
      theme.cache.$window.on('slick-initialized', function() {
        theme.cache.$heroContentWrapper.addClass('hero-initialized');
        setStickyActionBarVariables();
        stickyActionBar();
        theme.cache.$window.on('scroll', stickyActionBar);
      });
    } else {
      setStickyActionBarVariables();
      stickyActionBar();
      theme.cache.$window.on('scroll', stickyActionBar);
    }
  }

  function setStickyActionBarVariables() {
    if (!theme.cache.$actionBar.length) return;

    theme.variables.actionBarOffsetTop = theme.cache.$actionBar.offset().top;
    theme.variables.actionBarOffsetBottom =
      theme.cache.$actionBar.height() + theme.cache.$actionBar.offset().top;

    resizeHeader();
  }

  function resizeHeader() {
    var siteHeaderHeight = theme.cache.$siteHeader.height();

    // prevent content from jumping when we show/hide the header on non-index pages
    if (!theme.variables.isIndexTemplate) {
      theme.cache.$siteHeaderWrapper.css('height', siteHeaderHeight);
    }
  }

  function stickyActionBar() {
    var currentScrollTop = theme.cache.$window.scrollTop();

    // scroll down && we're below the header
    if (
      currentScrollTop > theme.variables.previousScrollPosition &&
      currentScrollTop > theme.variables.actionBarOffsetBottom
    ) {
      theme.cache.$body.addClass(theme.variables.stickyClass);

      var scrollTimeout = setTimeout(function() {
        theme.cache.$body.addClass(
          theme.variables.actionBarOpenTransitionClass
        );
      }, 50);
      theme.variables.previousScrollPosition = currentScrollTop;
    }

    // scroll Up
    if (currentScrollTop < theme.variables.previousScrollPosition) {
      clearTimeout(scrollTimeout);

      // show the regular ol' site header at the top of the page
      if (currentScrollTop <= theme.variables.actionBarOffsetTop) {
        theme.cache.$body
          .removeClass(theme.variables.stickyClass)
          .removeClass(theme.variables.actionBarOpenTransitionClass);
        theme.variables.previousScrollPosition = currentScrollTop;
      }
    }
  }

  return {
    init: init
  };
})();

theme.Collection = (function() {
  var selectors = {
    collectionGrid: '.collection-grid',
    collectionSort: '#SortBy',
    tagSort: '#SortTags',
    showMoreButton: '.js-show-more'
  };

  function init() {
    cacheSelectors();
    collectionSorting();
    tagSorting();
    initPagination();
  }

  function cacheSelectors() {
    var cache = {
      $collectionGrid: $(selectors.collectionGrid),
      $collectionSort: $(selectors.collectionSort),
      $tagSort: $(selectors.tagSort),
      $showMoreButton: $(selectors.showMoreButton)
    };

    $.extend(theme.cache, cache);
  }

  function collectionSorting() {
    theme.queryParams = {};
    var $sort = theme.cache.$collectionSort;

    if (!$sort.length) return;

    if (location.search.length) {
      for (
        var aKeyValue, i = 0, aCouples = location.search.substr(1).split('&');
        i < aCouples.length;
        i++
      ) {
        aKeyValue = aCouples[i].split('=');
        if (aKeyValue.length > 1) {
          theme.queryParams[
            decodeURIComponent(aKeyValue[0])
          ] = decodeURIComponent(aKeyValue[1]);
        }
      }
    }

    // Enable sorting with current sort order as value
    $sort.val($sort.attr('data-value')).on('change', function() {
      theme.queryParams.sort_by = $(this).val();
      if (theme.queryParams.page) {
        delete theme.queryParams.page;
      }
      location.search = decodeURIComponent($.param(theme.queryParams));
    });
  }

  function tagSorting() {
    theme.cache.$tagSort.on('change', function() {
      var val = $(this).val();
      if (val) {
        window.location.href = $(this).val();
      }
    });
  }

  function initPagination() {
    if (!theme.cache.$showMoreButton.length) return;

    theme.cache.$showMoreButton.on('click', paginate);
  }

  function paginate(evt) {
    evt.preventDefault();

    // only send on ajax request at a time
    if (
      theme.cache.$showMoreButton.hasClass('btn--ajax-disabled') ||
      theme.cache.$showMoreButton.hasClass('btn--disabled')
    )
      return;

    theme.cache.$showMoreButton.addClass('btn--ajax-disabled');

    $.ajax({
      url: theme.cache.$showMoreButton.attr('href'),
      type: 'GET',
      dataType: 'html'
    })
      .done(function(data) {
        var $data = $(data);
        var $newItems = $data.find('.product-item');
        var showMoreUrl = $data.find('.js-show-more').attr('href');

        theme.cache.$collectionGrid.append($newItems);

        //update grid items selector so that the imagesLoaded plugin knows about them
        theme.cache.$productGridItem = $('.product-item');

        if (showMoreUrl.length) {
          theme.cache.$showMoreButton.attr('href', showMoreUrl);
        } else {
          theme.cache.$showMoreButton.addClass('btn--disabled');
        }
      })
      .always(function() {
        theme.cache.$showMoreButton.removeClass('btn--ajax-disabled');
      });
  }

  return {
    init: init
  };
})();



/*!
handlebars v1.3.0

Copyright (C) 2011 by Yehuda Katz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

@license
*/
var Handlebars=function(){var e=function(){"use strict";function t(e){this.string=e}var e;t.prototype.toString=function(){return""+this.string};e=t;return e}();var t=function(e){"use strict";function o(e){return r[e]||"&"}function u(e,t){for(var n in t){if(Object.prototype.hasOwnProperty.call(t,n)){e[n]=t[n]}}}function c(e){if(e instanceof n){return e.toString()}else if(!e&&e!==0){return""}e=""+e;if(!s.test(e)){return e}return e.replace(i,o)}function h(e){if(!e&&e!==0){return true}else if(l(e)&&e.length===0){return true}else{return false}}var t={};var n=e;var r={"&":"&","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"};var i=/[&<>"'`]/g;var s=/[&<>"'`]/;t.extend=u;var a=Object.prototype.toString;t.toString=a;var f=function(e){return typeof e==="function"};if(f(/x/)){f=function(e){return typeof e==="function"&&a.call(e)==="[object Function]"}}var f;t.isFunction=f;var l=Array.isArray||function(e){return e&&typeof e==="object"?a.call(e)==="[object Array]":false};t.isArray=l;t.escapeExpression=c;t.isEmpty=h;return t}(e);var n=function(){"use strict";function n(e,n){var r;if(n&&n.firstLine){r=n.firstLine;e+=" - "+r+":"+n.firstColumn}var i=Error.prototype.constructor.call(this,e);for(var s=0;s<t.length;s++){this[t[s]]=i[t[s]]}if(r){this.lineNumber=r;this.column=n.firstColumn}}var e;var t=["description","fileName","lineNumber","message","name","number","stack"];n.prototype=new Error;e=n;return e}();var r=function(e,t){"use strict";function h(e,t){this.helpers=e||{};this.partials=t||{};p(this)}function p(e){e.registerHelper("helperMissing",function(e){if(arguments.length===2){return undefined}else{throw new i("Missing helper: '"+e+"'")}});e.registerHelper("blockHelperMissing",function(t,n){var r=n.inverse||function(){},i=n.fn;if(f(t)){t=t.call(this)}if(t===true){return i(this)}else if(t===false||t==null){return r(this)}else if(a(t)){if(t.length>0){return e.helpers.each(t,n)}else{return r(this)}}else{return i(t)}});e.registerHelper("each",function(e,t){var n=t.fn,r=t.inverse;var i=0,s="",o;if(f(e)){e=e.call(this)}if(t.data){o=m(t.data)}if(e&&typeof e==="object"){if(a(e)){for(var u=e.length;i<u;i++){if(o){o.index=i;o.first=i===0;o.last=i===e.length-1}s=s+n(e[i],{data:o})}}else{for(var l in e){if(e.hasOwnProperty(l)){if(o){o.key=l;o.index=i;o.first=i===0}s=s+n(e[l],{data:o});i++}}}}if(i===0){s=r(this)}return s});e.registerHelper("if",function(e,t){if(f(e)){e=e.call(this)}if(!t.hash.includeZero&&!e||r.isEmpty(e)){return t.inverse(this)}else{return t.fn(this)}});e.registerHelper("unless",function(t,n){return e.helpers["if"].call(this,t,{fn:n.inverse,inverse:n.fn,hash:n.hash})});e.registerHelper("with",function(e,t){if(f(e)){e=e.call(this)}if(!r.isEmpty(e))return t.fn(e)});e.registerHelper("log",function(t,n){var r=n.data&&n.data.level!=null?parseInt(n.data.level,10):1;e.log(r,t)})}function v(e,t){d.log(e,t)}var n={};var r=e;var i=t;var s="1.3.0";n.VERSION=s;var o=4;n.COMPILER_REVISION=o;var u={1:"<= 1.0.rc.2",2:"== 1.0.0-rc.3",3:"== 1.0.0-rc.4",4:">= 1.0.0"};n.REVISION_CHANGES=u;var a=r.isArray,f=r.isFunction,l=r.toString,c="[object Object]";n.HandlebarsEnvironment=h;h.prototype={constructor:h,logger:d,log:v,registerHelper:function(e,t,n){if(l.call(e)===c){if(n||t){throw new i("Arg not supported with multiple helpers")}r.extend(this.helpers,e)}else{if(n){t.not=n}this.helpers[e]=t}},registerPartial:function(e,t){if(l.call(e)===c){r.extend(this.partials,e)}else{this.partials[e]=t}}};var d={methodMap:{0:"debug",1:"info",2:"warn",3:"error"},DEBUG:0,INFO:1,WARN:2,ERROR:3,level:3,log:function(e,t){if(d.level<=e){var n=d.methodMap[e];if(typeof console!=="undefined"&&console[n]){console[n].call(console,t)}}}};n.logger=d;n.log=v;var m=function(e){var t={};r.extend(t,e);return t};n.createFrame=m;return n}(t,n);var i=function(e,t,n){"use strict";function a(e){var t=e&&e[0]||1,n=o;if(t!==n){if(t<n){var r=u[n],i=u[t];throw new s("Template was precompiled with an older version of Handlebars than the current runtime. "+"Please update your precompiler to a newer version ("+r+") or downgrade your runtime to an older version ("+i+").")}else{throw new s("Template was precompiled with a newer version of Handlebars than the current runtime. "+"Please update your runtime to a newer version ("+e[1]+").")}}}function f(e,t){if(!t){throw new s("No environment passed to template")}var n=function(e,n,r,i,o,u){var a=t.VM.invokePartial.apply(this,arguments);if(a!=null){return a}if(t.compile){var f={helpers:i,partials:o,data:u};o[n]=t.compile(e,{data:u!==undefined},t);return o[n](r,f)}else{throw new s("The partial "+n+" could not be compiled when running in runtime-only mode")}};var r={escapeExpression:i.escapeExpression,invokePartial:n,programs:[],program:function(e,t,n){var r=this.programs[e];if(n){r=c(e,t,n)}else if(!r){r=this.programs[e]=c(e,t)}return r},merge:function(e,t){var n=e||t;if(e&&t&&e!==t){n={};i.extend(n,t);i.extend(n,e)}return n},programWithDepth:t.VM.programWithDepth,noop:t.VM.noop,compilerInfo:null};return function(n,i){i=i||{};var s=i.partial?i:t,o,u;if(!i.partial){o=i.helpers;u=i.partials}var a=e.call(r,s,n,o,u,i.data);if(!i.partial){t.VM.checkRevision(r.compilerInfo)}return a}}function l(e,t,n){var r=Array.prototype.slice.call(arguments,3);var i=function(e,i){i=i||{};return t.apply(this,[e,i.data||n].concat(r))};i.program=e;i.depth=r.length;return i}function c(e,t,n){var r=function(e,r){r=r||{};return t(e,r.data||n)};r.program=e;r.depth=0;return r}function h(e,t,n,r,i,o){var u={partial:true,helpers:r,partials:i,data:o};if(e===undefined){throw new s("The partial "+t+" could not be found")}else if(e instanceof Function){return e(n,u)}}function p(){return""}var r={};var i=e;var s=t;var o=n.COMPILER_REVISION;var u=n.REVISION_CHANGES;r.checkRevision=a;r.template=f;r.programWithDepth=l;r.program=c;r.invokePartial=h;r.noop=p;return r}(t,n,r);var s=function(e,t,n,r,i){"use strict";var s;var o=e;var u=t;var a=n;var f=r;var l=i;var c=function(){var e=new o.HandlebarsEnvironment;f.extend(e,o);e.SafeString=u;e.Exception=a;e.Utils=f;e.VM=l;e.template=function(t){return l.template(t,e)};return e};var h=c();h.create=c;s=h;return s}(r,e,n,t,i);var o=function(e){"use strict";function r(e){e=e||{};this.firstLine=e.first_line;this.firstColumn=e.first_column;this.lastColumn=e.last_column;this.lastLine=e.last_line}var t;var n=e;var i={ProgramNode:function(e,t,n,s){var o,u;if(arguments.length===3){s=n;n=null}else if(arguments.length===2){s=t;t=null}r.call(this,s);this.type="program";this.statements=e;this.strip={};if(n){u=n[0];if(u){o={first_line:u.firstLine,last_line:u.lastLine,last_column:u.lastColumn,first_column:u.firstColumn};this.inverse=new i.ProgramNode(n,t,o)}else{this.inverse=new i.ProgramNode(n,t)}this.strip.right=t.left}else if(t){this.strip.left=t.right}},MustacheNode:function(e,t,n,s,o){r.call(this,o);this.type="mustache";this.strip=s;if(n!=null&&n.charAt){var u=n.charAt(3)||n.charAt(2);this.escaped=u!=="{"&&u!=="&"}else{this.escaped=!!n}if(e instanceof i.SexprNode){this.sexpr=e}else{this.sexpr=new i.SexprNode(e,t)}this.sexpr.isRoot=true;this.id=this.sexpr.id;this.params=this.sexpr.params;this.hash=this.sexpr.hash;this.eligibleHelper=this.sexpr.eligibleHelper;this.isHelper=this.sexpr.isHelper},SexprNode:function(e,t,n){r.call(this,n);this.type="sexpr";this.hash=t;var i=this.id=e[0];var s=this.params=e.slice(1);var o=this.eligibleHelper=i.isSimple;this.isHelper=o&&(s.length||t)},PartialNode:function(e,t,n,i){r.call(this,i);this.type="partial";this.partialName=e;this.context=t;this.strip=n},BlockNode:function(e,t,i,s,o){r.call(this,o);if(e.sexpr.id.original!==s.path.original){throw new n(e.sexpr.id.original+" doesn't match "+s.path.original,this)}this.type="block";this.mustache=e;this.program=t;this.inverse=i;this.strip={left:e.strip.left,right:s.strip.right};(t||i).strip.left=e.strip.right;(i||t).strip.right=s.strip.left;if(i&&!t){this.isInverse=true}},ContentNode:function(e,t){r.call(this,t);this.type="content";this.string=e},HashNode:function(e,t){r.call(this,t);this.type="hash";this.pairs=e},IdNode:function(e,t){r.call(this,t);this.type="ID";var i="",s=[],o=0;for(var u=0,a=e.length;u<a;u++){var f=e[u].part;i+=(e[u].separator||"")+f;if(f===".."||f==="."||f==="this"){if(s.length>0){throw new n("Invalid path: "+i,this)}else if(f===".."){o++}else{this.isScoped=true}}else{s.push(f)}}this.original=i;this.parts=s;this.string=s.join(".");this.depth=o;this.isSimple=e.length===1&&!this.isScoped&&o===0;this.stringModeValue=this.string},PartialNameNode:function(e,t){r.call(this,t);this.type="PARTIAL_NAME";this.name=e.original},DataNode:function(e,t){r.call(this,t);this.type="DATA";this.id=e},StringNode:function(e,t){r.call(this,t);this.type="STRING";this.original=this.string=this.stringModeValue=e},IntegerNode:function(e,t){r.call(this,t);this.type="INTEGER";this.original=this.integer=e;this.stringModeValue=Number(e)},BooleanNode:function(e,t){r.call(this,t);this.type="BOOLEAN";this.bool=e;this.stringModeValue=e==="true"},CommentNode:function(e,t){r.call(this,t);this.type="comment";this.comment=e}};t=i;return t}(n);var u=function(){"use strict";var e;var t=function(){function t(e,t){return{left:e.charAt(2)==="~",right:t.charAt(0)==="~"||t.charAt(1)==="~"}}function r(){this.yy={}}var e={trace:function(){},yy:{},symbols_:{error:2,root:3,statements:4,EOF:5,program:6,simpleInverse:7,statement:8,openInverse:9,closeBlock:10,openBlock:11,mustache:12,partial:13,CONTENT:14,COMMENT:15,OPEN_BLOCK:16,sexpr:17,CLOSE:18,OPEN_INVERSE:19,OPEN_ENDBLOCK:20,path:21,OPEN:22,OPEN_UNESCAPED:23,CLOSE_UNESCAPED:24,OPEN_PARTIAL:25,partialName:26,partial_option0:27,sexpr_repetition0:28,sexpr_option0:29,dataName:30,param:31,STRING:32,INTEGER:33,BOOLEAN:34,OPEN_SEXPR:35,CLOSE_SEXPR:36,hash:37,hash_repetition_plus0:38,hashSegment:39,ID:40,EQUALS:41,DATA:42,pathSegments:43,SEP:44,$accept:0,$end:1},terminals_:{2:"error",5:"EOF",14:"CONTENT",15:"COMMENT",16:"OPEN_BLOCK",18:"CLOSE",19:"OPEN_INVERSE",20:"OPEN_ENDBLOCK",22:"OPEN",23:"OPEN_UNESCAPED",24:"CLOSE_UNESCAPED",25:"OPEN_PARTIAL",32:"STRING",33:"INTEGER",34:"BOOLEAN",35:"OPEN_SEXPR",36:"CLOSE_SEXPR",40:"ID",41:"EQUALS",42:"DATA",44:"SEP"},productions_:[0,[3,2],[3,1],[6,2],[6,3],[6,2],[6,1],[6,1],[6,0],[4,1],[4,2],[8,3],[8,3],[8,1],[8,1],[8,1],[8,1],[11,3],[9,3],[10,3],[12,3],[12,3],[13,4],[7,2],[17,3],[17,1],[31,1],[31,1],[31,1],[31,1],[31,1],[31,3],[37,1],[39,3],[26,1],[26,1],[26,1],[30,2],[21,1],[43,3],[43,1],[27,0],[27,1],[28,0],[28,2],[29,0],[29,1],[38,1],[38,2]],performAction:function(n,r,i,s,o,u,a){var f=u.length-1;switch(o){case 1:return new s.ProgramNode(u[f-1],this._$);break;case 2:return new s.ProgramNode([],this._$);break;case 3:this.$=new s.ProgramNode([],u[f-1],u[f],this._$);break;case 4:this.$=new s.ProgramNode(u[f-2],u[f-1],u[f],this._$);break;case 5:this.$=new s.ProgramNode(u[f-1],u[f],[],this._$);break;case 6:this.$=new s.ProgramNode(u[f],this._$);break;case 7:this.$=new s.ProgramNode([],this._$);break;case 8:this.$=new s.ProgramNode([],this._$);break;case 9:this.$=[u[f]];break;case 10:u[f-1].push(u[f]);this.$=u[f-1];break;case 11:this.$=new s.BlockNode(u[f-2],u[f-1].inverse,u[f-1],u[f],this._$);break;case 12:this.$=new s.BlockNode(u[f-2],u[f-1],u[f-1].inverse,u[f],this._$);break;case 13:this.$=u[f];break;case 14:this.$=u[f];break;case 15:this.$=new s.ContentNode(u[f],this._$);break;case 16:this.$=new s.CommentNode(u[f],this._$);break;case 17:this.$=new s.MustacheNode(u[f-1],null,u[f-2],t(u[f-2],u[f]),this._$);break;case 18:this.$=new s.MustacheNode(u[f-1],null,u[f-2],t(u[f-2],u[f]),this._$);break;case 19:this.$={path:u[f-1],strip:t(u[f-2],u[f])};break;case 20:this.$=new s.MustacheNode(u[f-1],null,u[f-2],t(u[f-2],u[f]),this._$);break;case 21:this.$=new s.MustacheNode(u[f-1],null,u[f-2],t(u[f-2],u[f]),this._$);break;case 22:this.$=new s.PartialNode(u[f-2],u[f-1],t(u[f-3],u[f]),this._$);break;case 23:this.$=t(u[f-1],u[f]);break;case 24:this.$=new s.SexprNode([u[f-2]].concat(u[f-1]),u[f],this._$);break;case 25:this.$=new s.SexprNode([u[f]],null,this._$);break;case 26:this.$=u[f];break;case 27:this.$=new s.StringNode(u[f],this._$);break;case 28:this.$=new s.IntegerNode(u[f],this._$);break;case 29:this.$=new s.BooleanNode(u[f],this._$);break;case 30:this.$=u[f];break;case 31:u[f-1].isHelper=true;this.$=u[f-1];break;case 32:this.$=new s.HashNode(u[f],this._$);break;case 33:this.$=[u[f-2],u[f]];break;case 34:this.$=new s.PartialNameNode(u[f],this._$);break;case 35:this.$=new s.PartialNameNode(new s.StringNode(u[f],this._$),this._$);break;case 36:this.$=new s.PartialNameNode(new s.IntegerNode(u[f],this._$));break;case 37:this.$=new s.DataNode(u[f],this._$);break;case 38:this.$=new s.IdNode(u[f],this._$);break;case 39:u[f-2].push({part:u[f],separator:u[f-1]});this.$=u[f-2];break;case 40:this.$=[{part:u[f]}];break;case 43:this.$=[];break;case 44:u[f-1].push(u[f]);break;case 47:this.$=[u[f]];break;case 48:u[f-1].push(u[f]);break}},table:[{3:1,4:2,5:[1,3],8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],25:[1,15]},{1:[3]},{5:[1,16],8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],25:[1,15]},{1:[2,2]},{5:[2,9],14:[2,9],15:[2,9],16:[2,9],19:[2,9],20:[2,9],22:[2,9],23:[2,9],25:[2,9]},{4:20,6:18,7:19,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,8],22:[1,13],23:[1,14],25:[1,15]},{4:20,6:22,7:19,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,8],22:[1,13],23:[1,14],25:[1,15]},{5:[2,13],14:[2,13],15:[2,13],16:[2,13],19:[2,13],20:[2,13],22:[2,13],23:[2,13],25:[2,13]},{5:[2,14],14:[2,14],15:[2,14],16:[2,14],19:[2,14],20:[2,14],22:[2,14],23:[2,14],25:[2,14]},{5:[2,15],14:[2,15],15:[2,15],16:[2,15],19:[2,15],20:[2,15],22:[2,15],23:[2,15],25:[2,15]},{5:[2,16],14:[2,16],15:[2,16],16:[2,16],19:[2,16],20:[2,16],22:[2,16],23:[2,16],25:[2,16]},{17:23,21:24,30:25,40:[1,28],42:[1,27],43:26},{17:29,21:24,30:25,40:[1,28],42:[1,27],43:26},{17:30,21:24,30:25,40:[1,28],42:[1,27],43:26},{17:31,21:24,30:25,40:[1,28],42:[1,27],43:26},{21:33,26:32,32:[1,34],33:[1,35],40:[1,28],43:26},{1:[2,1]},{5:[2,10],14:[2,10],15:[2,10],16:[2,10],19:[2,10],20:[2,10],22:[2,10],23:[2,10],25:[2,10]},{10:36,20:[1,37]},{4:38,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,7],22:[1,13],23:[1,14],25:[1,15]},{7:39,8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,6],22:[1,13],23:[1,14],25:[1,15]},{17:23,18:[1,40],21:24,30:25,40:[1,28],42:[1,27],43:26},{10:41,20:[1,37]},{18:[1,42]},{18:[2,43],24:[2,43],28:43,32:[2,43],33:[2,43],34:[2,43],35:[2,43],36:[2,43],40:[2,43],42:[2,43]},{18:[2,25],24:[2,25],36:[2,25]},{18:[2,38],24:[2,38],32:[2,38],33:[2,38],34:[2,38],35:[2,38],36:[2,38],40:[2,38],42:[2,38],44:[1,44]},{21:45,40:[1,28],43:26},{18:[2,40],24:[2,40],32:[2,40],33:[2,40],34:[2,40],35:[2,40],36:[2,40],40:[2,40],42:[2,40],44:[2,40]},{18:[1,46]},{18:[1,47]},{24:[1,48]},{18:[2,41],21:50,27:49,40:[1,28],43:26},{18:[2,34],40:[2,34]},{18:[2,35],40:[2,35]},{18:[2,36],40:[2,36]},{5:[2,11],14:[2,11],15:[2,11],16:[2,11],19:[2,11],20:[2,11],22:[2,11],23:[2,11],25:[2,11]},{21:51,40:[1,28],43:26},{8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,3],22:[1,13],23:[1,14],25:[1,15]},{4:52,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,5],22:[1,13],23:[1,14],25:[1,15]},{14:[2,23],15:[2,23],16:[2,23],19:[2,23],20:[2,23],22:[2,23],23:[2,23],25:[2,23]},{5:[2,12],14:[2,12],15:[2,12],16:[2,12],19:[2,12],20:[2,12],22:[2,12],23:[2,12],25:[2,12]},{14:[2,18],15:[2,18],16:[2,18],19:[2,18],20:[2,18],22:[2,18],23:[2,18],25:[2,18]},{18:[2,45],21:56,24:[2,45],29:53,30:60,31:54,32:[1,57],33:[1,58],34:[1,59],35:[1,61],36:[2,45],37:55,38:62,39:63,40:[1,64],42:[1,27],43:26},{40:[1,65]},{18:[2,37],24:[2,37],32:[2,37],33:[2,37],34:[2,37],35:[2,37],36:[2,37],40:[2,37],42:[2,37]},{14:[2,17],15:[2,17],16:[2,17],19:[2,17],20:[2,17],22:[2,17],23:[2,17],25:[2,17]},{5:[2,20],14:[2,20],15:[2,20],16:[2,20],19:[2,20],20:[2,20],22:[2,20],23:[2,20],25:[2,20]},{5:[2,21],14:[2,21],15:[2,21],16:[2,21],19:[2,21],20:[2,21],22:[2,21],23:[2,21],25:[2,21]},{18:[1,66]},{18:[2,42]},{18:[1,67]},{8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,4],22:[1,13],23:[1,14],25:[1,15]},{18:[2,24],24:[2,24],36:[2,24]},{18:[2,44],24:[2,44],32:[2,44],33:[2,44],34:[2,44],35:[2,44],36:[2,44],40:[2,44],42:[2,44]},{18:[2,46],24:[2,46],36:[2,46]},{18:[2,26],24:[2,26],32:[2,26],33:[2,26],34:[2,26],35:[2,26],36:[2,26],40:[2,26],42:[2,26]},{18:[2,27],24:[2,27],32:[2,27],33:[2,27],34:[2,27],35:[2,27],36:[2,27],40:[2,27],42:[2,27]},{18:[2,28],24:[2,28],32:[2,28],33:[2,28],34:[2,28],35:[2,28],36:[2,28],40:[2,28],42:[2,28]},{18:[2,29],24:[2,29],32:[2,29],33:[2,29],34:[2,29],35:[2,29],36:[2,29],40:[2,29],42:[2,29]},{18:[2,30],24:[2,30],32:[2,30],33:[2,30],34:[2,30],35:[2,30],36:[2,30],40:[2,30],42:[2,30]},{17:68,21:24,30:25,40:[1,28],42:[1,27],43:26},{18:[2,32],24:[2,32],36:[2,32],39:69,40:[1,70]},{18:[2,47],24:[2,47],36:[2,47],40:[2,47]},{18:[2,40],24:[2,40],32:[2,40],33:[2,40],34:[2,40],35:[2,40],36:[2,40],40:[2,40],41:[1,71],42:[2,40],44:[2,40]},{18:[2,39],24:[2,39],32:[2,39],33:[2,39],34:[2,39],35:[2,39],36:[2,39],40:[2,39],42:[2,39],44:[2,39]},{5:[2,22],14:[2,22],15:[2,22],16:[2,22],19:[2,22],20:[2,22],22:[2,22],23:[2,22],25:[2,22]},{5:[2,19],14:[2,19],15:[2,19],16:[2,19],19:[2,19],20:[2,19],22:[2,19],23:[2,19],25:[2,19]},{36:[1,72]},{18:[2,48],24:[2,48],36:[2,48],40:[2,48]},{41:[1,71]},{21:56,30:60,31:73,32:[1,57],33:[1,58],34:[1,59],35:[1,61],40:[1,28],42:[1,27],43:26},{18:[2,31],24:[2,31],32:[2,31],33:[2,31],34:[2,31],35:[2,31],36:[2,31],40:[2,31],42:[2,31]},{18:[2,33],24:[2,33],36:[2,33],40:[2,33]}],defaultActions:{3:[2,2],16:[2,1],50:[2,42]},parseError:function(t,n){throw new Error(t)},parse:function(t){function v(e){r.length=r.length-2*e;i.length=i.length-e;s.length=s.length-e}function m(){var e;e=n.lexer.lex()||1;if(typeof e!=="number"){e=n.symbols_[e]||e}return e}var n=this,r=[0],i=[null],s=[],o=this.table,u="",a=0,f=0,l=0,c=2,h=1;this.lexer.setInput(t);this.lexer.yy=this.yy;this.yy.lexer=this.lexer;this.yy.parser=this;if(typeof this.lexer.yylloc=="undefined")this.lexer.yylloc={};var p=this.lexer.yylloc;s.push(p);var d=this.lexer.options&&this.lexer.options.ranges;if(typeof this.yy.parseError==="function")this.parseError=this.yy.parseError;var g,y,b,w,E,S,x={},T,N,C,k;while(true){b=r[r.length-1];if(this.defaultActions[b]){w=this.defaultActions[b]}else{if(g===null||typeof g=="undefined"){g=m()}w=o[b]&&o[b][g]}if(typeof w==="undefined"||!w.length||!w[0]){var L="";if(!l){k=[];for(T in o[b])if(this.terminals_[T]&&T>2){k.push("'"+this.terminals_[T]+"'")}if(this.lexer.showPosition){L="Parse error on line "+(a+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+k.join(", ")+", got '"+(this.terminals_[g]||g)+"'"}else{L="Parse error on line "+(a+1)+": Unexpected "+(g==1?"end of input":"'"+(this.terminals_[g]||g)+"'")}this.parseError(L,{text:this.lexer.match,token:this.terminals_[g]||g,line:this.lexer.yylineno,loc:p,expected:k})}}if(w[0]instanceof Array&&w.length>1){throw new Error("Parse Error: multiple actions possible at state: "+b+", token: "+g)}switch(w[0]){case 1:r.push(g);i.push(this.lexer.yytext);s.push(this.lexer.yylloc);r.push(w[1]);g=null;if(!y){f=this.lexer.yyleng;u=this.lexer.yytext;a=this.lexer.yylineno;p=this.lexer.yylloc;if(l>0)l--}else{g=y;y=null}break;case 2:N=this.productions_[w[1]][1];x.$=i[i.length-N];x._$={first_line:s[s.length-(N||1)].first_line,last_line:s[s.length-1].last_line,first_column:s[s.length-(N||1)].first_column,last_column:s[s.length-1].last_column};if(d){x._$.range=[s[s.length-(N||1)].range[0],s[s.length-1].range[1]]}S=this.performAction.call(x,u,f,a,this.yy,w[1],i,s);if(typeof S!=="undefined"){return S}if(N){r=r.slice(0,-1*N*2);i=i.slice(0,-1*N);s=s.slice(0,-1*N)}r.push(this.productions_[w[1]][0]);i.push(x.$);s.push(x._$);C=o[r[r.length-2]][r[r.length-1]];r.push(C);break;case 3:return true}}return true}};var n=function(){var e={EOF:1,parseError:function(t,n){if(this.yy.parser){this.yy.parser.parseError(t,n)}else{throw new Error(t)}},setInput:function(e){this._input=e;this._more=this._less=this.done=false;this.yylineno=this.yyleng=0;this.yytext=this.matched=this.match="";this.conditionStack=["INITIAL"];this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0};if(this.options.ranges)this.yylloc.range=[0,0];this.offset=0;return this},input:function(){var e=this._input[0];this.yytext+=e;this.yyleng++;this.offset++;this.match+=e;this.matched+=e;var t=e.match(/(?:\r\n?|\n).*/g);if(t){this.yylineno++;this.yylloc.last_line++}else{this.yylloc.last_column++}if(this.options.ranges)this.yylloc.range[1]++;this._input=this._input.slice(1);return e},unput:function(e){var t=e.length;var n=e.split(/(?:\r\n?|\n)/g);this._input=e+this._input;this.yytext=this.yytext.substr(0,this.yytext.length-t-1);this.offset-=t;var r=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1);this.matched=this.matched.substr(0,this.matched.length-1);if(n.length-1)this.yylineno-=n.length-1;var i=this.yylloc.range;this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:n?(n.length===r.length?this.yylloc.first_column:0)+r[r.length-n.length].length-n[0].length:this.yylloc.first_column-t};if(this.options.ranges){this.yylloc.range=[i[0],i[0]+this.yyleng-t]}return this},more:function(){this._more=true;return this},less:function(e){this.unput(this.match.slice(e))},pastInput:function(){var e=this.matched.substr(0,this.matched.length-this.match.length);return(e.length>20?"...":"")+e.substr(-20).replace(/\n/g,"")},upcomingInput:function(){var e=this.match;if(e.length<20){e+=this._input.substr(0,20-e.length)}return(e.substr(0,20)+(e.length>20?"...":"")).replace(/\n/g,"")},showPosition:function(){var e=this.pastInput();var t=(new Array(e.length+1)).join("-");return e+this.upcomingInput()+"\n"+t+"^"},next:function(){if(this.done){return this.EOF}if(!this._input)this.done=true;var e,t,n,r,i,s;if(!this._more){this.yytext="";this.match=""}var o=this._currentRules();for(var u=0;u<o.length;u++){n=this._input.match(this.rules[o[u]]);if(n&&(!t||n[0].length>t[0].length)){t=n;r=u;if(!this.options.flex)break}}if(t){s=t[0].match(/(?:\r\n?|\n).*/g);if(s)this.yylineno+=s.length;this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:s?s[s.length-1].length-s[s.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+t[0].length};this.yytext+=t[0];this.match+=t[0];this.matches=t;this.yyleng=this.yytext.length;if(this.options.ranges){this.yylloc.range=[this.offset,this.offset+=this.yyleng]}this._more=false;this._input=this._input.slice(t[0].length);this.matched+=t[0];e=this.performAction.call(this,this.yy,this,o[r],this.conditionStack[this.conditionStack.length-1]);if(this.done&&this._input)this.done=false;if(e)return e;else return}if(this._input===""){return this.EOF}else{return this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})}},lex:function(){var t=this.next();if(typeof t!=="undefined"){return t}else{return this.lex()}},begin:function(t){this.conditionStack.push(t)},popState:function(){return this.conditionStack.pop()},_currentRules:function(){return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules},topState:function(){return this.conditionStack[this.conditionStack.length-2]},pushState:function(t){this.begin(t)}};e.options={};e.performAction=function(t,n,r,i){function s(e,t){return n.yytext=n.yytext.substr(e,n.yyleng-t)}var o=i;switch(r){case 0:if(n.yytext.slice(-2)==="\\\\"){s(0,1);this.begin("mu")}else if(n.yytext.slice(-1)==="\\"){s(0,1);this.begin("emu")}else{this.begin("mu")}if(n.yytext)return 14;break;case 1:return 14;break;case 2:this.popState();return 14;break;case 3:s(0,4);this.popState();return 15;break;case 4:return 35;break;case 5:return 36;break;case 6:return 25;break;case 7:return 16;break;case 8:return 20;break;case 9:return 19;break;case 10:return 19;break;case 11:return 23;break;case 12:return 22;break;case 13:this.popState();this.begin("com");break;case 14:s(3,5);this.popState();return 15;break;case 15:return 22;break;case 16:return 41;break;case 17:return 40;break;case 18:return 40;break;case 19:return 44;break;case 20:break;case 21:this.popState();return 24;break;case 22:this.popState();return 18;break;case 23:n.yytext=s(1,2).replace(/\\"/g,'"');return 32;break;case 24:n.yytext=s(1,2).replace(/\\'/g,"'");return 32;break;case 25:return 42;break;case 26:return 34;break;case 27:return 34;break;case 28:return 33;break;case 29:return 40;break;case 30:n.yytext=s(1,2);return 40;break;case 31:return"INVALID";break;case 32:return 5;break}};e.rules=[/^(?:[^\x00]*?(?=(\{\{)))/,/^(?:[^\x00]+)/,/^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/,/^(?:[\s\S]*?--\}\})/,/^(?:\()/,/^(?:\))/,/^(?:\{\{(~)?>)/,/^(?:\{\{(~)?#)/,/^(?:\{\{(~)?\/)/,/^(?:\{\{(~)?\^)/,/^(?:\{\{(~)?\s*else\b)/,/^(?:\{\{(~)?\{)/,/^(?:\{\{(~)?&)/,/^(?:\{\{!--)/,/^(?:\{\{![\s\S]*?\}\})/,/^(?:\{\{(~)?)/,/^(?:=)/,/^(?:\.\.)/,/^(?:\.(?=([=~}\s\/.)])))/,/^(?:[\/.])/,/^(?:\s+)/,/^(?:\}(~)?\}\})/,/^(?:(~)?\}\})/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:@)/,/^(?:true(?=([~}\s)])))/,/^(?:false(?=([~}\s)])))/,/^(?:-?[0-9]+(?=([~}\s)])))/,/^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)]))))/,/^(?:\[[^\]]*\])/,/^(?:.)/,/^(?:$)/];e.conditions={mu:{rules:[4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],inclusive:false},emu:{rules:[2],inclusive:false},com:{rules:[3],inclusive:false},INITIAL:{rules:[0,1,32],inclusive:true}};return e}();e.lexer=n;r.prototype=e;e.Parser=r;return new r}();e=t;return e}();var a=function(e,t){"use strict";function s(e){if(e.constructor===i.ProgramNode){return e}r.yy=i;return r.parse(e)}var n={};var r=e;var i=t;n.parser=r;n.parse=s;return n}(u,o);var f=function(e){"use strict";function r(){}function i(e,t,r){if(e==null||typeof e!=="string"&&e.constructor!==r.AST.ProgramNode){throw new n("You must pass a string or Handlebars AST to Handlebars.precompile. You passed "+e)}t=t||{};if(!("data"in t)){t.data=true}var i=r.parse(e);var s=(new r.Compiler).compile(i,t);return(new r.JavaScriptCompiler).compile(s,t)}function s(e,t,r){function s(){var n=r.parse(e);var i=(new r.Compiler).compile(n,t);var s=(new r.JavaScriptCompiler).compile(i,t,undefined,true);return r.template(s)}if(e==null||typeof e!=="string"&&e.constructor!==r.AST.ProgramNode){throw new n("You must pass a string or Handlebars AST to Handlebars.compile. You passed "+e)}t=t||{};if(!("data"in t)){t.data=true}var i;return function(e,t){if(!i){i=s()}return i.call(this,e,t)}}var t={};var n=e;t.Compiler=r;r.prototype={compiler:r,disassemble:function(){var e=this.opcodes,t,n=[],r,i;for(var s=0,o=e.length;s<o;s++){t=e[s];if(t.opcode==="DECLARE"){n.push("DECLARE "+t.name+"="+t.value)}else{r=[];for(var u=0;u<t.args.length;u++){i=t.args[u];if(typeof i==="string"){i='"'+i.replace("\n","\\n")+'"'}r.push(i)}n.push(t.opcode+" "+r.join(" "))}}return n.join("\n")},equals:function(e){var t=this.opcodes.length;if(e.opcodes.length!==t){return false}for(var n=0;n<t;n++){var r=this.opcodes[n],i=e.opcodes[n];if(r.opcode!==i.opcode||r.args.length!==i.args.length){return false}for(var s=0;s<r.args.length;s++){if(r.args[s]!==i.args[s]){return false}}}t=this.children.length;if(e.children.length!==t){return false}for(n=0;n<t;n++){if(!this.children[n].equals(e.children[n])){return false}}return true},guid:0,compile:function(e,t){this.opcodes=[];this.children=[];this.depths={list:[]};this.options=t;var n=this.options.knownHelpers;this.options.knownHelpers={helperMissing:true,blockHelperMissing:true,each:true,"if":true,unless:true,"with":true,log:true};if(n){for(var r in n){this.options.knownHelpers[r]=n[r]}}return this.accept(e)},accept:function(e){var t=e.strip||{},n;if(t.left){this.opcode("strip")}n=this[e.type](e);if(t.right){this.opcode("strip")}return n},program:function(e){var t=e.statements;for(var n=0,r=t.length;n<r;n++){this.accept(t[n])}this.isSimple=r===1;this.depths.list=this.depths.list.sort(function(e,t){return e-t});return this},compileProgram:function(e){var t=(new this.compiler).compile(e,this.options);var n=this.guid++,r;this.usePartial=this.usePartial||t.usePartial;this.children[n]=t;for(var i=0,s=t.depths.list.length;i<s;i++){r=t.depths.list[i];if(r<2){continue}else{this.addDepth(r-1)}}return n},block:function(e){var t=e.mustache,n=e.program,r=e.inverse;if(n){n=this.compileProgram(n)}if(r){r=this.compileProgram(r)}var i=t.sexpr;var s=this.classifySexpr(i);if(s==="helper"){this.helperSexpr(i,n,r)}else if(s==="simple"){this.simpleSexpr(i);this.opcode("pushProgram",n);this.opcode("pushProgram",r);this.opcode("emptyHash");this.opcode("blockValue")}else{this.ambiguousSexpr(i,n,r);this.opcode("pushProgram",n);this.opcode("pushProgram",r);this.opcode("emptyHash");this.opcode("ambiguousBlockValue")}this.opcode("append")},hash:function(e){var t=e.pairs,n,r;this.opcode("pushHash");for(var i=0,s=t.length;i<s;i++){n=t[i];r=n[1];if(this.options.stringParams){if(r.depth){this.addDepth(r.depth)}this.opcode("getContext",r.depth||0);this.opcode("pushStringParam",r.stringModeValue,r.type);if(r.type==="sexpr"){this.sexpr(r)}}else{this.accept(r)}this.opcode("assignToHash",n[0])}this.opcode("popHash")},partial:function(e){var t=e.partialName;this.usePartial=true;if(e.context){this.ID(e.context)}else{this.opcode("push","depth0")}this.opcode("invokePartial",t.name);this.opcode("append")},content:function(e){this.opcode("appendContent",e.string)},mustache:function(e){this.sexpr(e.sexpr);if(e.escaped&&!this.options.noEscape){this.opcode("appendEscaped")}else{this.opcode("append")}},ambiguousSexpr:function(e,t,n){var r=e.id,i=r.parts[0],s=t!=null||n!=null;this.opcode("getContext",r.depth);this.opcode("pushProgram",t);this.opcode("pushProgram",n);this.opcode("invokeAmbiguous",i,s)},simpleSexpr:function(e){var t=e.id;if(t.type==="DATA"){this.DATA(t)}else if(t.parts.length){this.ID(t)}else{this.addDepth(t.depth);this.opcode("getContext",t.depth);this.opcode("pushContext")}this.opcode("resolvePossibleLambda")},helperSexpr:function(e,t,r){var i=this.setupFullMustacheParams(e,t,r),s=e.id.parts[0];if(this.options.knownHelpers[s]){this.opcode("invokeKnownHelper",i.length,s)}else if(this.options.knownHelpersOnly){throw new n("You specified knownHelpersOnly, but used the unknown helper "+s,e)}else{this.opcode("invokeHelper",i.length,s,e.isRoot)}},sexpr:function(e){var t=this.classifySexpr(e);if(t==="simple"){this.simpleSexpr(e)}else if(t==="helper"){this.helperSexpr(e)}else{this.ambiguousSexpr(e)}},ID:function(e){this.addDepth(e.depth);this.opcode("getContext",e.depth);var t=e.parts[0];if(!t){this.opcode("pushContext")}else{this.opcode("lookupOnContext",e.parts[0])}for(var n=1,r=e.parts.length;n<r;n++){this.opcode("lookup",e.parts[n])}},DATA:function(e){this.options.data=true;if(e.id.isScoped||e.id.depth){throw new n("Scoped data references are not supported: "+e.original,e)}this.opcode("lookupData");var t=e.id.parts;for(var r=0,i=t.length;r<i;r++){this.opcode("lookup",t[r])}},STRING:function(e){this.opcode("pushString",e.string)},INTEGER:function(e){this.opcode("pushLiteral",e.integer)},BOOLEAN:function(e){this.opcode("pushLiteral",e.bool)},comment:function(){},opcode:function(e){this.opcodes.push({opcode:e,args:[].slice.call(arguments,1)})},declare:function(e,t){this.opcodes.push({opcode:"DECLARE",name:e,value:t})},addDepth:function(e){if(e===0){return}if(!this.depths[e]){this.depths[e]=true;this.depths.list.push(e)}},classifySexpr:function(e){var t=e.isHelper;var n=e.eligibleHelper;var r=this.options;if(n&&!t){var i=e.id.parts[0];if(r.knownHelpers[i]){t=true}else if(r.knownHelpersOnly){n=false}}if(t){return"helper"}else if(n){return"ambiguous"}else{return"simple"}},pushParams:function(e){var t=e.length,n;while(t--){n=e[t];if(this.options.stringParams){if(n.depth){this.addDepth(n.depth)}this.opcode("getContext",n.depth||0);this.opcode("pushStringParam",n.stringModeValue,n.type);if(n.type==="sexpr"){this.sexpr(n)}}else{this[n.type](n)}}},setupFullMustacheParams:function(e,t,n){var r=e.params;this.pushParams(r);this.opcode("pushProgram",t);this.opcode("pushProgram",n);if(e.hash){this.hash(e.hash)}else{this.opcode("emptyHash")}return r}};t.precompile=i;t.compile=s;return t}(n);var l=function(e,t){"use strict";function u(e){this.value=e}function a(){}var n;var r=e.COMPILER_REVISION;var i=e.REVISION_CHANGES;var s=e.log;var o=t;a.prototype={nameLookup:function(e,t){var n,r;if(e.indexOf("depth")===0){n=true}if(/^[0-9]+$/.test(t)){r=e+"["+t+"]"}else if(a.isValidJavaScriptVariableName(t)){r=e+"."+t}else{r=e+"['"+t+"']"}if(n){return"("+e+" && "+r+")"}else{return r}},compilerInfo:function(){var e=r,t=i[e];return"this.compilerInfo = ["+e+",'"+t+"'];\n"},appendToBuffer:function(e){if(this.environment.isSimple){return"return "+e+";"}else{return{appendToBuffer:true,content:e,toString:function(){return"buffer += "+e+";"}}}},initializeBuffer:function(){return this.quotedString("")},namespace:"Handlebars",compile:function(e,t,n,r){this.environment=e;this.options=t||{};s("debug",this.environment.disassemble()+"\n\n");this.name=this.environment.name;this.isChild=!!n;this.context=n||{programs:[],environments:[],aliases:{}};this.preamble();this.stackSlot=0;this.stackVars=[];this.registers={list:[]};this.hashes=[];this.compileStack=[];this.inlineStack=[];this.compileChildren(e,t);var i=e.opcodes,u;this.i=0;for(var a=i.length;this.i<a;this.i++){u=i[this.i];if(u.opcode==="DECLARE"){this[u.name]=u.value}else{this[u.opcode].apply(this,u.args)}if(u.opcode!==this.stripNext){this.stripNext=false}}this.pushSource("");if(this.stackSlot||this.inlineStack.length||this.compileStack.length){throw new o("Compile completed with content left on stack")}return this.createFunctionContext(r)},preamble:function(){var e=[];if(!this.isChild){var t=this.namespace;var n="helpers = this.merge(helpers, "+t+".helpers);";if(this.environment.usePartial){n=n+" partials = this.merge(partials, "+t+".partials);"}if(this.options.data){n=n+" data = data || {};"}e.push(n)}else{e.push("")}if(!this.environment.isSimple){e.push(", buffer = "+this.initializeBuffer())}else{e.push("")}this.lastContext=0;this.source=e},createFunctionContext:function(e){var t=this.stackVars.concat(this.registers.list);if(t.length>0){this.source[1]=this.source[1]+", "+t.join(", ")}if(!this.isChild){for(var n in this.context.aliases){if(this.context.aliases.hasOwnProperty(n)){this.source[1]=this.source[1]+", "+n+"="+this.context.aliases[n]}}}if(this.source[1]){this.source[1]="var "+this.source[1].substring(2)+";"}if(!this.isChild){this.source[1]+="\n"+this.context.programs.join("\n")+"\n"}if(!this.environment.isSimple){this.pushSource("return buffer;")}var r=this.isChild?["depth0","data"]:["Handlebars","depth0","helpers","partials","data"];for(var i=0,o=this.environment.depths.list.length;i<o;i++){r.push("depth"+this.environment.depths.list[i])}var u=this.mergeSource();if(!this.isChild){u=this.compilerInfo()+u}if(e){r.push(u);return Function.apply(this,r)}else{var a="function "+(this.name||"")+"("+r.join(",")+") {\n  "+u+"}";s("debug",a+"\n\n");return a}},mergeSource:function(){var e="",t;for(var n=0,r=this.source.length;n<r;n++){var i=this.source[n];if(i.appendToBuffer){if(t){t=t+"\n    + "+i.content}else{t=i.content}}else{if(t){e+="buffer += "+t+";\n  ";t=undefined}e+=i+"\n  "}}return e},blockValue:function(){this.context.aliases.blockHelperMissing="helpers.blockHelperMissing";var e=["depth0"];this.setupParams(0,e);this.replaceStack(function(t){e.splice(1,0,t);return"blockHelperMissing.call("+e.join(", ")+")"})},ambiguousBlockValue:function(){this.context.aliases.blockHelperMissing="helpers.blockHelperMissing";var e=["depth0"];this.setupParams(0,e);var t=this.topStack();e.splice(1,0,t);this.pushSource("if (!"+this.lastHelper+") { "+t+" = blockHelperMissing.call("+e.join(", ")+"); }")},appendContent:function(e){if(this.pendingContent){e=this.pendingContent+e}if(this.stripNext){e=e.replace(/^\s+/,"")}this.pendingContent=e},strip:function(){if(this.pendingContent){this.pendingContent=this.pendingContent.replace(/\s+$/,"")}this.stripNext="strip"},append:function(){this.flushInline();var e=this.popStack();this.pushSource("if("+e+" || "+e+" === 0) { "+this.appendToBuffer(e)+" }");if(this.environment.isSimple){this.pushSource("else { "+this.appendToBuffer("''")+" }")}},appendEscaped:function(){this.context.aliases.escapeExpression="this.escapeExpression";this.pushSource(this.appendToBuffer("escapeExpression("+this.popStack()+")"))},getContext:function(e){if(this.lastContext!==e){this.lastContext=e}},lookupOnContext:function(e){this.push(this.nameLookup("depth"+this.lastContext,e,"context"))},pushContext:function(){this.pushStackLiteral("depth"+this.lastContext)},resolvePossibleLambda:function(){this.context.aliases.functionType='"function"';this.replaceStack(function(e){return"typeof "+e+" === functionType ? "+e+".apply(depth0) : "+e})},lookup:function(e){this.replaceStack(function(t){return t+" == null || "+t+" === false ? "+t+" : "+this.nameLookup(t,e,"context")})},lookupData:function(){this.pushStackLiteral("data")},pushStringParam:function(e,t){this.pushStackLiteral("depth"+this.lastContext);this.pushString(t);if(t!=="sexpr"){if(typeof e==="string"){this.pushString(e)}else{this.pushStackLiteral(e)}}},emptyHash:function(){this.pushStackLiteral("{}");if(this.options.stringParams){this.push("{}");this.push("{}")}},pushHash:function(){if(this.hash){this.hashes.push(this.hash)}this.hash={values:[],types:[],contexts:[]}},popHash:function(){var e=this.hash;this.hash=this.hashes.pop();if(this.options.stringParams){this.push("{"+e.contexts.join(",")+"}");this.push("{"+e.types.join(",")+"}")}this.push("{\n    "+e.values.join(",\n    ")+"\n  }")},pushString:function(e){this.pushStackLiteral(this.quotedString(e))},push:function(e){this.inlineStack.push(e);return e},pushLiteral:function(e){this.pushStackLiteral(e)},pushProgram:function(e){if(e!=null){this.pushStackLiteral(this.programExpression(e))}else{this.pushStackLiteral(null)}},invokeHelper:function(e,t,n){this.context.aliases.helperMissing="helpers.helperMissing";this.useRegister("helper");var r=this.lastHelper=this.setupHelper(e,t,true);var i=this.nameLookup("depth"+this.lastContext,t,"context");var s="helper = "+r.name+" || "+i;if(r.paramsInit){s+=","+r.paramsInit}this.push("("+s+",helper "+"? helper.call("+r.callParams+") "+": helperMissing.call("+r.helperMissingParams+"))");if(!n){this.flushInline()}},invokeKnownHelper:function(e,t){var n=this.setupHelper(e,t);this.push(n.name+".call("+n.callParams+")")},invokeAmbiguous:function(e,t){this.context.aliases.functionType='"function"';this.useRegister("helper");this.emptyHash();var n=this.setupHelper(0,e,t);var r=this.lastHelper=this.nameLookup("helpers",e,"helper");var i=this.nameLookup("depth"+this.lastContext,e,"context");var s=this.nextStack();if(n.paramsInit){this.pushSource(n.paramsInit)}this.pushSource("if (helper = "+r+") { "+s+" = helper.call("+n.callParams+"); }");this.pushSource("else { helper = "+i+"; "+s+" = typeof helper === functionType ? helper.call("+n.callParams+") : helper; }")},invokePartial:function(e){var t=[this.nameLookup("partials",e,"partial"),"'"+e+"'",this.popStack(),"helpers","partials"];if(this.options.data){t.push("data")}this.context.aliases.self="this";this.push("self.invokePartial("+t.join(", ")+")")},assignToHash:function(e){var t=this.popStack(),n,r;if(this.options.stringParams){r=this.popStack();n=this.popStack()}var i=this.hash;if(n){i.contexts.push("'"+e+"': "+n)}if(r){i.types.push("'"+e+"': "+r)}i.values.push("'"+e+"': ("+t+")")},compiler:a,compileChildren:function(e,t){var n=e.children,r,i;for(var s=0,o=n.length;s<o;s++){r=n[s];i=new this.compiler;var u=this.matchExistingProgram(r);if(u==null){this.context.programs.push("");u=this.context.programs.length;r.index=u;r.name="program"+u;this.context.programs[u]=i.compile(r,t,this.context);this.context.environments[u]=r}else{r.index=u;r.name="program"+u}}},matchExistingProgram:function(e){for(var t=0,n=this.context.environments.length;t<n;t++){var r=this.context.environments[t];if(r&&r.equals(e)){return t}}},programExpression:function(e){this.context.aliases.self="this";if(e==null){return"self.noop"}var t=this.environment.children[e],n=t.depths.list,r;var i=[t.index,t.name,"data"];for(var s=0,o=n.length;s<o;s++){r=n[s];if(r===1){i.push("depth0")}else{i.push("depth"+(r-1))}}return(n.length===0?"self.program(":"self.programWithDepth(")+i.join(", ")+")"},register:function(e,t){this.useRegister(e);this.pushSource(e+" = "+t+";")},useRegister:function(e){if(!this.registers[e]){this.registers[e]=true;this.registers.list.push(e)}},pushStackLiteral:function(e){return this.push(new u(e))},pushSource:function(e){if(this.pendingContent){this.source.push(this.appendToBuffer(this.quotedString(this.pendingContent)));this.pendingContent=undefined}if(e){this.source.push(e)}},pushStack:function(e){this.flushInline();var t=this.incrStack();if(e){this.pushSource(t+" = "+e+";")}this.compileStack.push(t);return t},replaceStack:function(e){var t="",n=this.isInline(),r,i,s;if(n){var o=this.popStack(true);if(o instanceof u){r=o.value;s=true}else{i=!this.stackSlot;var a=!i?this.topStackName():this.incrStack();t="("+this.push(a)+" = "+o+"),";r=this.topStack()}}else{r=this.topStack()}var f=e.call(this,r);if(n){if(!s){this.popStack()}if(i){this.stackSlot--}this.push("("+t+f+")")}else{if(!/^stack/.test(r)){r=this.nextStack()}this.pushSource(r+" = ("+t+f+");")}return r},nextStack:function(){return this.pushStack()},incrStack:function(){this.stackSlot++;if(this.stackSlot>this.stackVars.length){this.stackVars.push("stack"+this.stackSlot)}return this.topStackName()},topStackName:function(){return"stack"+this.stackSlot},flushInline:function(){var e=this.inlineStack;if(e.length){this.inlineStack=[];for(var t=0,n=e.length;t<n;t++){var r=e[t];if(r instanceof u){this.compileStack.push(r)}else{this.pushStack(r)}}}},isInline:function(){return this.inlineStack.length},popStack:function(e){var t=this.isInline(),n=(t?this.inlineStack:this.compileStack).pop();if(!e&&n instanceof u){return n.value}else{if(!t){if(!this.stackSlot){throw new o("Invalid stack pop")}this.stackSlot--}return n}},topStack:function(e){var t=this.isInline()?this.inlineStack:this.compileStack,n=t[t.length-1];if(!e&&n instanceof u){return n.value}else{return n}},quotedString:function(e){return'"'+e.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029")+'"'},setupHelper:function(e,t,n){var r=[],i=this.setupParams(e,r,n);var s=this.nameLookup("helpers",t,"helper");return{params:r,paramsInit:i,name:s,callParams:["depth0"].concat(r).join(", "),helperMissingParams:n&&["depth0",this.quotedString(t)].concat(r).join(", ")}},setupOptions:function(e,t){var n=[],r=[],i=[],s,o,u;n.push("hash:"+this.popStack());if(this.options.stringParams){n.push("hashTypes:"+this.popStack());n.push("hashContexts:"+this.popStack())}o=this.popStack();u=this.popStack();if(u||o){if(!u){this.context.aliases.self="this";u="self.noop"}if(!o){this.context.aliases.self="this";o="self.noop"}n.push("inverse:"+o);n.push("fn:"+u)}for(var a=0;a<e;a++){s=this.popStack();t.push(s);if(this.options.stringParams){i.push(this.popStack());r.push(this.popStack())}}if(this.options.stringParams){n.push("contexts:["+r.join(",")+"]");n.push("types:["+i.join(",")+"]")}if(this.options.data){n.push("data:data")}return n},setupParams:function(e,t,n){var r="{"+this.setupOptions(e,t).join(",")+"}";if(n){this.useRegister("options");t.push("options");return"options="+r}else{t.push(r);return""}}};var f=("break else new var"+" case finally return void"+" catch for switch while"+" continue function this with"+" default if throw"+" delete in try"+" do instanceof typeof"+" abstract enum int short"+" boolean export interface static"+" byte extends long super"+" char final native synchronized"+" class float package throws"+" const goto private transient"+" debugger implements protected volatile"+" double import public let yield").split(" ");var l=a.RESERVED_WORDS={};for(var c=0,h=f.length;c<h;c++){l[f[c]]=true}a.isValidJavaScriptVariableName=function(e){if(!a.RESERVED_WORDS[e]&&/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(e)){return true}return false};n=a;return n}(r,n);var c=function(e,t,n,r,i){"use strict";var s;var o=e;var u=t;var a=n.parser;var f=n.parse;var l=r.Compiler;var c=r.compile;var h=r.precompile;var p=i;var d=o.create;var v=function(){var e=d();e.compile=function(t,n){return c(t,n,e)};e.precompile=function(t,n){return h(t,n,e)};e.AST=u;e.Compiler=l;e.JavaScriptCompiler=p;e.Parser=a;e.parse=f;return e};o=v();o.create=v;s=o;return s}(s,o,a,f,l);return c}();
/*============================================================================
  Ajax the add to cart experience by revealing it in a side drawer
  (c) Copyright 2015 Shopify Inc. All Rights Reserved.

  This requires:
    - jQuery 1.11+
    - handlebars.min.js (for cart template)
    - modernizer.min.js
    - snippet/ajax-cart-template.liquid
==============================================================================*/

/*============================================================================
  Override POST to cart/add.js. Returns cart JSON.
    - Allow use of form element instead of just id
    - Allow custom error callback
==============================================================================*/
Shopify.addItemFromForm = function(form, callback, errorCallback) {
  var params = {
    type: 'POST',
    url: '/cart/add.js',
    data: jQuery(form).serialize(),
    dataType: 'json',
    success: function(line_item) {
      if ((typeof callback) === 'function') {
        callback(line_item, form);
      }
      else {
        Shopify.onItemAdded(line_item, form);
      }
    },
    error: function(XMLHttpRequest, textStatus) {
      if ((typeof errorCallback) === 'function') {
        errorCallback(XMLHttpRequest, textStatus);
      }
      else {
        Shopify.onError(XMLHttpRequest, textStatus);
      }
    }
  };
  jQuery.ajax(params);
};

/*============================================================================
  Override POST to cart/change.js. Returns cart JSON.
    - Use product's line in the cart instead of ID so custom
      product properties are supported.
==============================================================================*/
Shopify.changeItem = function(line, quantity, callback) {
  var params = {
    type: 'POST',
    url: '/cart/change.js',
    data: 'quantity=' + quantity + '&line=' + line,
    dataType: 'json',
    success: function(cart) {
      if ((typeof callback) === 'function') {
        callback(cart);
      }
      else {
        Shopify.onCartUpdate(cart);
      }
    },
    error: function(XMLHttpRequest, textStatus) {
      Shopify.onError(XMLHttpRequest, textStatus);
    }
  };
  jQuery.ajax(params);
};

/*============================================================================
  GET cart.js returns the cart in JSON.
==============================================================================*/
Shopify.getCart = function(callback) {
  jQuery.getJSON('/cart.js', function (cart, textStatus) {
    if ((typeof callback) === 'function') {
      callback(cart);
    }
    else {
      Shopify.onCartUpdate(cart);
    }
  });
};

/*============================================================================
  Ajax Shopify Add To Cart
==============================================================================*/
var ajaxCart = (function(module, $) {

  'use strict';

  // Public functions
  var init, loadCart;

  // Private general variables
  var settings, isUpdating, $body;

  // Private plugin variables
  var $formContainer, $errorsContainer, $addToCart, $cartCountSelector, $cartCostSelector, $cartContainer, $drawerContainer;

  // Private functions
  var updateCountPrice, formOverride, itemAddedCallback, itemErrorCallback, cartUpdateCallback, buildCart, cartCallback, adjustCart, adjustCartCallback, qtySelectors, validateQty;

  /*============================================================================
    Initialise the plugin and define global options
  ==============================================================================*/
  init = function (options) {

    // Default settings
    settings = {
      formSelector       : '[data-cart-form]',
      errorSelector      : '.product-single__errors',
      cartContainer      : '#CartContainer',
      addToCartSelector  : 'input[type="submit"]',
      cartCountSelector  : null,
      cartCostSelector   : null,
      moneyFormat        : '$',
      disableAjaxCart    : false,
      enableQtySelectors : true
    };

    // Override defaults with arguments
    $.extend(settings, options);

    // Select DOM elements
    $formContainer     = $(settings.formSelector);
    $errorsContainer   = $(settings.errorSelector);
    $cartContainer     = $(settings.cartContainer);
    $addToCart         = $formContainer.find(settings.addToCartSelector);
    $cartCountSelector = $(settings.cartCountSelector);
    $cartCostSelector  = $(settings.cartCostSelector);

    // General Selectors
    $body = $('body');

    // Track cart activity status
    isUpdating = false;

    // Setup ajax quantity selectors on the any template if enableQtySelectors is true
    if (settings.enableQtySelectors) {
      qtySelectors();
    }

    // Take over the add to cart form submit action if ajax enabled
    if (!settings.disableAjaxCart && $addToCart.length) {
      formOverride();
    }

    // Run this function in case we're using the quantity selector outside of the cart
    adjustCart();
  };

  loadCart = function () {
    $body.addClass('drawer--is-loading');
    Shopify.getCart(cartUpdateCallback);
  };

  updateCountPrice = function (cart) {
    if ($cartCountSelector) {
      $cartCountSelector.html(cart.item_count).removeClass('hidden-count');

      if (cart.item_count === 0) {
        $cartCountSelector.addClass('hidden-count');
      }
    }

    if ($cartCostSelector) {
      $cartCostSelector.html(Shopify.formatMoney(cart.total_price, settings.moneyFormat));
    }
  };

  formOverride = function () {
    $formContainer.on('submit', function(evt) {
      evt.preventDefault();

      // Add class to be styled if desired
      $addToCart.removeClass('is-added').addClass('is-adding');

      // Remove any previous quantity errors
      $('.qty-error').remove();

      Shopify.addItemFromForm(evt.target, itemAddedCallback, itemErrorCallback);
    });
  };

  itemAddedCallback = function (product) {
    $addToCart.removeClass('is-adding').addClass('is-added');

    Shopify.getCart(cartUpdateCallback);
  };

  itemErrorCallback = function (XMLHttpRequest, textStatus) {
    var data = eval('(' + XMLHttpRequest.responseText + ')');
    $addToCart.removeClass('is-adding is-added');

    $cartContainer.trigger('ajaxCart.updatedQty');

    if (!!data.message) {
      if (data.status == 422) {
        $errorsContainer.html('<div class="errors qty-error">'+ data.description +'</div>')
      }
    }
  };

  cartUpdateCallback = function (cart) {
    // Update quantity and price
    updateCountPrice(cart);
    buildCart(cart);
  };

  buildCart = function (cart) {
    // Start with a fresh cart div
    $cartContainer.empty();

    // Show empty cart
    if (cart.item_count === 0) {
      $cartContainer
        .append('<p class="cart--empty-message">' + "Your cart is currently empty." + '</p>\n'
        + '<p class="cart--cookie-message">' + "Enable cookies to use the shopping cart" + '</p>');
      cartCallback(cart);
      return;
    }

    // Handlebars.js cart layout
    var items = [],
        item = {},
        data = {},
        source = $("#CartTemplate").html(),
        template = Handlebars.compile(source);

    // Add each item to our handlebars.js data
    $.each(cart.items, function(index, cartItem) {

      /* Hack to get product image thumbnail
       *   - If image is not null
       *     - Remove file extension, add _small, and re-add extension
       *     - Create server relative link
       *   - A hard-coded url of no-image
      */
      if (cartItem.image != null){
        var prodImg = cartItem.image.replace(/(\.[^.]*)$/, "_small$1").replace('http:', '');
      } else {
        var prodImg = "//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif";
      }

      if (cartItem.properties !== null) {
        $.each(cartItem.properties, function(key, value) {
          if (key.charAt(0) === '_' || !value) {
            delete cartItem.properties[key];
          }
        });
      }

      if (cartItem.line_level_discount_allocations.length !== 0 ) {
        for (var discount in cartItem.line_level_discount_allocations) {
          var amount = cartItem.line_level_discount_allocations[discount].amount;
          cartItem.line_level_discount_allocations[discount].formattedAmount = Shopify.formatMoney(amount, settings.moneyFormat)
        }
      }

      if (cart.cart_level_discount_applications.length !== 0) {
        for (var discount in cart.cart_level_discount_applications) {
          var amount = cart.cart_level_discount_applications[discount].total_allocated_amount;
          cart.cart_level_discount_applications[discount].formattedAmount = Shopify.formatMoney(amount, settings.moneyFormat)
        }
      }

      var unitPrice = null;
      if (cartItem.unit_price_measurement) {
        unitPrice = {
          addRefererenceValue:
            cartItem.unit_price_measurement.reference_value !== 1,
          price: Shopify.formatMoney(
            cartItem.unit_price,
            settings.moneyFormat
          ),
          reference_value: cartItem.unit_price_measurement.reference_value,
          reference_unit: cartItem.unit_price_measurement.reference_unit
        };
      }

      // Create item's data object and add to 'items' array
      item = {
        key: cartItem.key,
        line: index + 1, // Shopify uses a 1+ index in the API
        url: cartItem.url,
        img: prodImg,
        name: cartItem.product_title,
        variation: cartItem.variant_title,
        properties: cartItem.properties,
        itemAdd: cartItem.quantity + 1,
        itemMinus: cartItem.quantity - 1,
        itemQty: cartItem.quantity,
        price: Shopify.formatMoney(cartItem.price, settings.moneyFormat),
        vendor: cartItem.vendor,
        unitPrice: unitPrice,
        linePrice: Shopify.formatMoney(cartItem.final_line_price, settings.moneyFormat),
        originalLinePrice: Shopify.formatMoney(cartItem.original_line_price, settings.moneyFormat),
        discounts: cartItem.line_level_discount_allocations,
        discountsApplied: cartItem.line_level_discount_allocations.length === 0 ? false : true
      };

      items.push(item);
    });

    // Gather all cart data and add to DOM
    data = {
      items: items,
      note: cart.note,
      totalPrice: Shopify.formatMoney(cart.total_price, settings.moneyFormat),
      cartDiscounts: cart.cart_level_discount_applications,
      cartDiscountsApplied: cart.cart_level_discount_applications.length === 0 ? false : true
    }

    $cartContainer.append(template(data));

    cartCallback(cart);
  };

  cartCallback = function(cart) {
    $body.removeClass('drawer--is-loading');
    $cartContainer.trigger('ajaxCart.afterCartLoad', cart);

    theme.styleTextLinks();

    if (window.Shopify && Shopify.StorefrontExpressButtons) {
      Shopify.StorefrontExpressButtons.initialize();
    }
  };

  adjustCart = function () {
    // Delegate all events because elements reload with the cart

    // Add or remove from the quantity
    $cartContainer.on('click', '.ajaxcart__qty-adjust', function() {
      if (isUpdating) return;


      var $el = $(this),
          line = $el.data('line'),
          $qtySelector = $el.siblings('.ajaxcart__qty-num'),
          qty = parseInt($qtySelector.val().replace(/\D/g, ''));

      var qty = validateQty(qty);

      // Add or subtract from the current quantity
      if ($el.hasClass('ajaxcart__qty--plus')) {
        qty += 1;
      } else {
        qty -= 1;
        if (qty <= 0) qty = 0;
      }

      // If it has a data-line, update the cart.
      // Otherwise, just update the input's number
      if (line) {
        updateQuantity(line, qty);
      } else {
        $qtySelector.val(qty);
      }
    });

    // Update quantity based on input on change
    $cartContainer.on('change', '.ajaxcart__qty-num', function() {
      if (isUpdating) return;

      var $el = $(this),
          line = $el.data('line'),
          qty = parseInt($el.val().replace(/\D/g, ''));

      var qty = validateQty(qty);

      // If it has a data-line, update the cart
      if (line) {
        updateQuantity(line, qty);
      }
    });

    $cartContainer.on('focus', '.ajaxcart__qty-num', function(evt) {
      var $el = $(evt.target);
      $el[0].setSelectionRange(0, $el[0].value.length);
    });

    // Prevent cart from being submitted while quantities are changing
    $cartContainer.on('submit', 'form.ajaxcart', function(evt) {
      if (isUpdating) {
        evt.preventDefault();
      }
    });

    // Highlight the text when focused
    $cartContainer.on('focus', '.ajaxcart__qty-adjust', function() {
      var $el = $(this);
      setTimeout(function() {
        $el.select();
      }, 50);
    });

    function updateQuantity(line, qty) {
      isUpdating = true;

      // Add activity classes when changing cart quantities
      var $product = $('.ajaxcart__product[data-line="' + line + '"]').addClass('is-loading');

      if (qty === 0) {
        $product.parent().addClass('is-removed');
      }

      // Slight delay to make sure removed animation is done
      setTimeout(function() {
        Shopify.changeItem(line, qty, adjustCartCallback);
      }, 250);

      $cartContainer.trigger('ajaxCart.updatingQty');
    }

    // Save note anytime it's changed
    $cartContainer.on('change', 'textarea[name="note"]', function() {
      var newNote = $(this).val();

      // Update the cart note in case they don't click update/checkout
      Shopify.updateCartNote(newNote, function(cart) {});
    });
  };

  adjustCartCallback = function (cart) {
    // Update quantity and price
    updateCountPrice(cart);

    // Reprint cart on short timeout so you don't see the content being removed
    setTimeout(function() {
      isUpdating = false;
      Shopify.getCart(buildCart);
    }, 150)
  };

  qtySelectors = function() {
    // Change number inputs to JS ones, similar to ajax cart but without API integration.
    // Make sure to add the existing name and id to the new input element
    var numInputs = $('input[type="number"][data-ajax-qty]');

    // Qty selector has a minimum of 1 on the product page
    // and 0 in the cart (determined on qty click)
    var qtyMin = 0;

    if (numInputs.length) {
      numInputs.each(function() {
        var $el = $(this),
            currentQty = $el.val(),
            inputName = $el.attr('name'),
            inputId = $el.attr('id');

        var itemAdd = currentQty + 1,
            itemMinus = currentQty - 1,
            itemQty = currentQty;

        var source   = $("#JsQty").html(),
            template = Handlebars.compile(source),
            data = {
              key: $el.data('id'),
              itemQty: itemQty,
              itemAdd: itemAdd,
              itemMinus: itemMinus,
              inputName: inputName,
              inputId: inputId
            };

        // Append new quantity selector then remove original
        $el.after(template(data)).remove();
      });

      // Setup listeners to add/subtract from the input
      $('.js-qty__adjust').on('click', function() {
        var $el = $(this),
            id = $el.data('id'),
            $qtySelector = $el.siblings('.js-qty__num'),
            qty = parseInt($qtySelector.val().replace(/\D/g, ''));

        var qty = validateQty(qty);
        qtyMin = $body.hasClass('template-product') ? 1 : qtyMin;

        // Add or subtract from the current quantity
        if ($el.hasClass('js-qty__adjust--plus')) {
          qty += 1;
        } else {
          qty -= 1;
          if (qty <= qtyMin) qty = qtyMin;
        }

        // Update the input's number
        $qtySelector.val(qty);
      });
    }
  };

  validateQty = function (qty) {
    if((parseFloat(qty) == parseInt(qty)) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      // Not a number. Default to 1.
      qty = 1;
    }
    return qty;
  };

  module = {
    init: init,
    load: loadCart
  };

  return module;

}(ajaxCart || {}, jQuery));



/*================ SECTIONS ================*/
theme.SlideshowSection = (function() {
  function SlideshowSection(container) {
    var $container = (this.$container = $(container));
    var slideshow = (this.slideshow = '#Hero');
    var $slideshowImages = $container.find('.hero__image');
    //eslint-disable-next-line no-unused-vars
    var autoplay = (this.autoplay = $(this.slideshow).data('autoplay'));

    slickTheme.init({
      $element: $(slideshow),
      autoplay: $(slideshow).data('autoplay'),
      autoplaySpeed: $(slideshow).data('autoplayspeed'),
      arrows: true
    });

    if ($('html').hasClass('is-ios') && Shopify.designMode) {
      $(slideshow).addClass('is-ios-editor');
    }

    $slideshowImages.imagesLoaded({ background: true }).progress(function() {
      $('.hero__image').addClass('image-loaded');
    });

    theme.drawersInit();
  }

  return SlideshowSection;
})();

theme.SlideshowSection.prototype = _.assignIn(
  {},
  theme.SlideshowSection.prototype,
  {
    onUnload: function() {
      $(this.slideshow).unslick();
    },

    onSelect: function() {
      if ($(this.slideshow).length) {
        var $heroContentWrapper = $(this.slideshow).find(
          '.hero__content-wrapper'
        );
        var adapt = $(this.slideshow).data('adapt');
        var $actionBar = $('.main-content').find('.hero__header');

        $heroContentWrapper.addClass('hero-initialized');
        $actionBar.toggleClass('hero__header--adapt', adapt);
      }
      theme.LeftDrawer.close();
    },

    onBlockSelect: function(evt) {
      var $slide = $('.hero__slide--' + evt.detail.blockId);
      var slideIndex = $slide.attr('index');

      $(this.slideshow).slickGoTo(slideIndex);
      if (this.autoplay) {
        $(this.slideshow).slickPause();
      }
    },

    onBlockDeselect: function() {
      if (
        this.autoplay &&
        !slickTheme.cache.$pauseButton.hasClass(slickTheme.vars.pausedClass)
      ) {
        $(this.slideshow).slickPlay();
      }
    }
  }
);

theme.SidebarMenuSection = (function() {
  function SidebarMenuSection() {
    $('.drawer-nav__toggle').on('click', function() {
      $(this)
        .parent()
        .toggleClass('drawer-nav--expanded');

      if (
        $(this)
          .parent()
          .hasClass('drawer-nav--expanded')
      ) {
        $(this)
          .children('.drawer-nav__toggle-button')
          .attr('aria-expanded', true);
        $(this)
          .find('.icon-plus')
          .removeClass('icon-plus')
          .addClass('icon-minus');
      } else {
        $(this)
          .children('.drawer-nav__toggle-button')
          .attr('aria-expanded', false);
        $(this)
          .find('.icon-minus')
          .removeClass('icon-minus')
          .addClass('icon-plus');
      }
    });
  }

  return SidebarMenuSection;
})();

theme.SidebarMenuSection.prototype = _.assignIn(
  {},
  theme.SidebarMenuSection.prototype,
  {
    onSelect: function() {
      theme.RightDrawer.close();
      theme.SearchDrawer.close();
      theme.LeftDrawer.open();
    },

    onDeselect: function() {
      theme.LeftDrawer.close();
    }
  }
);

theme.HeaderSection = (function() {
  function HeaderSection() {
    theme.drawersInit();
  }

  return HeaderSection;
})();

theme.HeaderSection.prototype = _.assignIn({}, theme.HeaderSection.prototype, {
  onSelect: function() {
    theme.LeftDrawer.close();
  }
});

theme.ActionBarSection = (function() {
  function ActionBarSection() {
    theme.ActionBar.init();
  }

  return ActionBarSection;
})();

theme.ActionBarSection.prototype = _.assignIn(
  {},
  theme.ActionBarSection.prototype,
  {
    onSelect: function() {
      theme.LeftDrawer.close();
    }
  }
);

theme.CollectionTemplate = (function() {
  function CollectionTemplate(container) {
    theme.Collection.container = container;
    theme.Collection.init();
  }

  return CollectionTemplate;
})();

/* eslint-disable no-new */
theme.Product = (function() {
  var settings = {
    imageSize: null
  };

  var selectors = {
    addToCart: '.btn--add-to-cart',
    btnText: '.btn__text',
    cartContainer: '#CartContainer',
    originalSelectorId: 'ProductSelect',
    productForm: '.product__form--add-to-cart',
    productPrice: '.product__price--reg',
    salePrice: '.product__price .js-price',
    salePriceWrapper: '.product__price--sale',
    unitPrice: '[data-unit-price]',
    unitPriceBaseUnit: '[data-unit-price-base-unit]',
    unitPriceContainer: '[data-unit-price-container]',
    variantImage: '.product__photo--variant',
    variantImageWrapper: '.product__photo--variant-wrapper',
    SKU: '.variant-sku',
    pageLink: '[data-page-link]',
    historyState: '[data-history-state]',
    shopifyPaymentButton: '.shopify-payment-button'
  };

  function Product(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');
    // If section has data-history-state, Shopify.OptionSelectors will enableHistoryState
    var historyState = $container.is(selectors.historyState) ? true : false;
    var image_size = 0;

    this.$addToCartButton = $(selectors.addToCart, $container);
    this.$addToCartText = this.$addToCartButton.find(selectors.btnText);

    if (
      typeof $(selectors.variantImage, this.$container).attr('src') !==
      'undefined'
    ) {
      image_size = Shopify.Image.imageSize(
        $(selectors.variantImage, this.$container).attr('src')
      );
    }

    this.settings = $.extend({}, settings, {
      sectionId: sectionId,
      originalSelectorId: selectors.originalSelectorId + '-' + sectionId,
      historyState: historyState,
      imageSize: image_size,
      addToCartFormId: '#AddToCartForm' + '-' + sectionId,
      addToCartBtnId: '#AddToCart' + '-' + sectionId
    });

    theme.styleTextLinks();

    // Stop parsing if we don't have the product json script tag when loading
    // section in the Theme Editor
    if (!$('#ProductJson-' + sectionId).html()) return;

    this.productSingleObject = JSON.parse(
      document.getElementById('ProductJson-' + sectionId).innerHTML
    );

    this.init();

    // Pre-loading product images to avoid a lag when a thumbnail is clicked, or
    // when a variant is selected that has a variant image
    Shopify.Image.preload(
      this.productSingleObject.images,
      this.settings.imageSize
    );
  }

  Product.prototype = _.assignIn({}, Product.prototype, {
    init: function() {
      this.initVariantSelectors(this.settings.originalSelectorId);

      if (theme.settings.cartType === 'drawer') {
        ajaxCart.init({
          formSelector: this.settings.addToCartFormId,
          cartContainer: selectors.cartContainer,
          addToCartSelector: this.settings.addToCartBtnId,
          moneyFormat: theme.settings.moneyFormat
        });
      }
    },

    initVariantSelectors: function(selectorId) {
      this.optionSelector = new Shopify.OptionSelectors(selectorId, {
        product: this.productSingleObject,
        onVariantSelected: this.productVariantCallback.bind(this),
        enableHistoryState: this.settings.historyState
      });

      var firstSelector = this.optionSelector.selectors[0];

      // Add label if there is only one option and no existing label
      if (
        this.productSingleObject.options.length === 1 &&
        $(firstSelector.element).siblings('label').length === 0
      ) {
        var optionLabel = document.createElement('label');
        optionLabel.htmlFor = firstSelector.element.id;
        optionLabel.innerHTML = firstSelector.name;
        $(optionLabel).insertBefore($(firstSelector.element));
      }

      // Clean up variant labels if the Shopify-defined
      // defaults are the only ones left
      this.simplifyVariantLabels(this.productSingleObject, this.$container);

      // Uncomment this to add class so we can easily hide any
      // <select> with only one option
      // $optionSelectors.each(function () {
      //   var $el = $(this);
      //   var $select = $el.find('.single-option-selector');
      //
      //   if ($select[0].length < 2) {
      //     $el.addClass('selector-wrapper--single-option');
      //   }
      // });
    },

    simplifyVariantLabels: function(productObject, container) {
      // Hide variant dropdown if only one exists and title contains 'Default'
      if (
        productObject.variants.length === 1 &&
        productObject.options.length === 1 &&
        productObject.options[0].toLowerCase().indexOf('title') >= 0 &&
        productObject.variants[0].title
          .toLowerCase()
          .indexOf('default title') >= 0
      ) {
        $('.selector-wrapper', container).hide();
      }
    },

    productVariantCallback: function(variant) {
      var $pageLink = $(selectors.pageLink, this.$container);

      if (variant) {
        if (variant.featured_image) {
          var imageId = variant.featured_image.id;
          var $newImage = $(
            selectors.variantImageWrapper + "[data-image-id='" + imageId + "']",
            this.$container
          );
          var $otherImages = $(
            selectors.variantImageWrapper +
              ":not([data-image-id='" +
              imageId +
              "'])",
            this.$container
          );

          $newImage.removeClass('hide fade-in');
          $otherImages.addClass('hide');
        } else {
          $(selectors.variantImageWrapper, this.$container).removeClass(
            'fade-in'
          );
        }

        // Select a valid variant if available
        if (variant.available) {
          // Available, enable the submit button, change text, show quantity elements
          $(selectors.addToCart, this.$container)
            .removeClass('disabled')
            .prop('disabled', false);
          this.$addToCartText.html(theme.strings.addToCart);
          $(selectors.shopifyPaymentButton, this.$container).show();
        } else {
          // Sold out, disable the submit button, change text, hide quantity elements
          $(selectors.addToCart, this.$container)
            .addClass('disabled')
            .prop('disabled', true);
          this.$addToCartText.html(theme.strings.soldOut);
          $(selectors.shopifyPaymentButton, this.$container).hide();
        }

        $(selectors.productPrice, this.$container).html(
          Shopify.formatMoney(
            variant.price,
            theme.settings.moneyFormat
          ).replace(/((,00)|(\.00))$/g, '')
        );

        // Show SKU
        $(selectors.SKU, this.$container).html(variant.sku);

        // Also update and show the product's compare price if necessary
        if (variant.compare_at_price > variant.price) {
          $(selectors.salePriceWrapper, this.$container).removeClass('hide');
          $(selectors.productPrice, this.$container).html(
            Shopify.formatMoney(
              variant.compare_at_price,
              theme.settings.moneyFormat
            ).replace(/((,00)|(\.00))$/g, '')
          );
          $(selectors.salePrice, this.$container).html(
            Shopify.formatMoney(
              variant.price,
              theme.settings.moneyFormat
            ).replace(/((,00)|(\.00))$/g, '')
          );
          $(selectors.productPrice, this.$container).addClass('on-sale');
        } else {
          $(selectors.productPrice, this.$container).html(
            Shopify.formatMoney(
              variant.price,
              theme.settings.moneyFormat
            ).replace(/((,00)|(\.00))$/g, '')
          );
          $(selectors.salePriceWrapper, this.$container).addClass('hide');
          $(selectors.productPrice, this.$container).removeClass('on-sale');
        }

        $(selectors.unitPriceContainer, this.$container).addClass(
          'product-price-unit--unavailable'
        );
        if (variant.unit_price_measurement) {
          $(selectors.unitPrice, this.$container).html(
            Shopify.formatMoney(variant.unit_price, theme.settings.moneyFormat)
          );
          $(selectors.unitPriceBaseUnit, this.$container).html(
            this.getBaseUnit(variant)
          );
          $(selectors.unitPriceContainer, this.$container).removeClass(
            'product-price-unit--unavailable'
          );
        }

        // Update the product page link, if it exists
        if ($pageLink.length > 0) {
          var variantUrl = this._updateUrlParameter(
            $pageLink.attr('href'),
            'variant',
            variant.id
          );
          $pageLink.attr('href', variantUrl);
        }
      } else {
        // The variant doesn't exist, disable submit button.
        // This may be an error or notice that a specific variant is not available.
        // To only show available variants, implement linked product options:
        //   - http://docs.shopify.com/manual/configuration/store-customization/advanced-navigation/linked-product-options
        $(selectors.addToCart, this.$container)
          .addClass('disabled')
          .prop('disabled', true);
        this.$addToCartText.html(theme.strings.unavailable);
        $(selectors.shopifyPaymentButton, this.$container).hide();
      }
    },

    _updateUrlParameter: function(url, key, value) {
      var re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
      var separator = url.indexOf('?') === -1 ? '?' : '&';

      if (url.match(re)) {
        return url.replace(re, '$1' + key + '=' + value + '$2');
      } else {
        return url + separator + key + '=' + value;
      }
    },

    getBaseUnit: function(variant) {
      return variant.unit_price_measurement.reference_value === 1
        ? variant.unit_price_measurement.reference_unit
        : variant.unit_price_measurement.reference_value +
            variant.unit_price_measurement.reference_unit;
    }
  });

  return Product;
})();

theme.RichTextSection = (function() {
  function RichTextSection() {}

  return RichTextSection;
})();

theme.RichTextSection.prototype = _.assignIn(
  {},
  theme.RichTextSection.prototype,
  {
    onSelect: function() {
      theme.styleTextLinks();
    }
  }
);

theme.NewsletterSection = (function() {
  function NewsletterSection() {
    theme.styleTextLinks();
  }

  return NewsletterSection;
})();

theme.Maps = (function() {
  var config = {
    zoom: 14
  };
  var apiStatus = null;
  var mapsToLoad = [];

  function Map(container) {
    theme.$currentMapContainer = this.$container = $(container);
    var key = this.$container.data('api-key');

    if (typeof key !== 'string' || key === '') return;

    if (apiStatus === 'loaded') {
      var self = this;

      // Check if the script has previously been loaded with this key
      var $script = $('script[src*="' + key + '&"]');
      if ($script.length === 0) {
        $.getScript(
          'https://maps.googleapis.com/maps/api/js?key=' + key
        ).then(function() {
          apiStatus = 'loaded';
          self.createMap();
        });
      } else {
        this.createMap();
      }
    } else {
      mapsToLoad.push(this);

      if (apiStatus !== 'loading') {
        apiStatus = 'loading';
        if (typeof window.google === 'undefined') {
          $.getScript(
            'https://maps.googleapis.com/maps/api/js?key=' + key
          ).then(function() {
            apiStatus = 'loaded';
            initAllMaps();
          });
        }
      }
    }
  }

  function initAllMaps() {
    // API has loaded, load all Map instances in queue
    $.each(mapsToLoad, function(index, instance) {
      instance.createMap();
    });
  }

  function geolocate($map) {
    var deferred = $.Deferred();
    var geocoder = new google.maps.Geocoder();
    var address = $map.data('address-setting');

    geocoder.geocode({ address: address }, function(results, status) {
      if (status !== google.maps.GeocoderStatus.OK) {
        deferred.reject(status);
      }

      deferred.resolve(results);
    });

    return deferred;
  }

  Map.prototype = _.assignIn({}, Map.prototype, {
    createMap: function() {
      var $map = this.$container.find('.map-section__container');

      return geolocate($map)
        .then(
          function(results) {
            var mapOptions = {
              zoom: config.zoom,
              styles: config.styles,
              center: results[0].geometry.location,
              draggable: false,
              clickableIcons: false,
              scrollwheel: false,
              disableDoubleClickZoom: true,
              disableDefaultUI: true
            };

            var map = (this.map = new google.maps.Map($map[0], mapOptions));
            var center = (this.center = map.getCenter());

            //eslint-disable-next-line no-unused-vars
            var marker = new google.maps.Marker({
              map: map,
              position: center
            });

            google.maps.event.addDomListener(
              window,
              'resize',
              $.debounce(250, function() {
                google.maps.event.trigger(map, 'resize');
                map.setCenter(center);
              })
            );
          }.bind(this)
        )
        .fail(function() {
          var errorMessage;

          switch (status) {
            case 'ZERO_RESULTS':
              errorMessage = theme.strings.addressNoResults;
              break;
            case 'OVER_QUERY_LIMIT':
              errorMessage = theme.strings.addressQueryLimit;
              break;
            default:
              errorMessage = theme.strings.addressError;
              break;
          }

          var $mapContainer = $map.parents('.map-section');

          // Only show error in the theme editor
          if (Shopify.designMode) {
            $mapContainer.addClass('page-width map-section--load-error');
            $mapContainer.find('.map-section__content-wrapper').remove();
            $mapContainer
              .find('.map-section__wrapper')
              .html(
                '<div class="errors text-center" style="width: 100%;">' +
                  errorMessage +
                  '</div>'
              );
          } else {
            $mapContainer.removeClass('map-section--display-map');
          }
        });
    },

    onUnload: function() {
      if (typeof window.google !== 'undefined') {
        google.maps.event.clearListeners(this.map, 'resize');
      }
    }
  });

  return Map;
})();

// Global function called by Google on auth errors.
// Show an auto error message on all map instances.
// eslint-disable-next-line camelcase, no-unused-vars
function gm_authFailure() {
  if (Shopify.designMode) {
    theme.$currentMapContainer.addClass('page-width map-section--load-error');
    theme.$currentMapContainer.find('.map-section__content-wrapper').remove();
    theme.$currentMapContainer
      .find('.map-section__wrapper')
      .html(
        '<div class="errors text-center" style="width: 100%;">' +
          theme.strings.authError +
          '</div>'
      );
  } else {
    theme.$currentMapContainer.removeClass('map-section--display-map');
  }
}

theme.FeaturedVideoSection = (function() {
  function FeaturedVideoSection() {
    theme.responsiveVideos();
  }

  return FeaturedVideoSection;
})();

theme.FeaturedVideoSection.prototype = _.assignIn(
  {},
  theme.FeaturedVideoSection.prototype,
  {
    onSelect: function() {
      theme.responsiveVideos();
    }
  }
);

theme.PasswordContentSection = (function() {
  function PasswordContentSection() {
    theme.styleTextLinks();
  }

  return PasswordContentSection;
})();

theme.ProductRecommendations = (function() {
  function ProductRecommendations(container) {
    this.$container = $(container);

    var baseUrl = this.$container.data('baseUrl');
    var productId = this.$container.data('productId');
    var recommendationsSectionUrl =
      baseUrl +
      '?section_id=product-recommendations&product_id=' +
      productId +
      '&limit=4';

    $.get(recommendationsSectionUrl).then(
      function(section) {
        var recommendationsMarkup = $(section).html();
        if (recommendationsMarkup.trim() !== '') {
          this.$container.html(recommendationsMarkup);
        }
      }.bind(this)
    );
  }

  return ProductRecommendations;
})();


/**
 *
 *  Boundless Theme JS
 *
 *
 */
theme.init = function () {
  theme.cacheSelectors();
  theme.stringOverrides();
  theme.drawersInit();
  theme.initCart();
  theme.afterCartLoad();
  theme.rteImages();
  theme.styleTextLinks();
  theme.searchSubmit();
  theme.socialSharing();
  theme.passwordTemplate();
  theme.responsiveVideos();
  theme.checkIfIOS();
  theme.productCardImageLoadingAnimation();
};

/**
 *
 *  Cache any jQuery objects.
 *
 */
theme.cacheSelectors = function () {
  theme.cache = {
    $window: $(window),
    $html: $('html'),
    $body: $('body'),
    $indexTemplate: $('.template-index'),
    $cartSectionTemplate: $('.cart-template-section'),

    // Drawer elements
    $drawerRight: $('.drawer--right'),
    $drawerProduct: $('.drawer--product'),
    $cartContainer: $('#CartContainer'),

    // Product grid
    $productGridItem: $('.product-item'),

    // Share buttons
    $shareButtons: $('.social-sharing'),

    // Article images
    $indentedRteImages: $('.rte--indented-images'),

    // Password Page
    $loginModal: $('#LoginModal'),

    // Announcement Bar
    $announcementBar: $('.announcement-bar'),

    // Site Header
    $siteHeaderWrapper: $('.site-header-wrapper'),
    $siteHeader: $('.site-header-container'),
    $siteHeaderCart: $('.site-header__cart'),
    $searchInput: $('.search-bar__input'),
    $searchSubmit: $('.search-bar__submit'),

    // Hero
    $heroContentWrapper: $('.hero__content-wrapper'),
    $hero: $('#Hero'),
    $heroImages: $('.hero__image'),

    // Cart classes
    cartNoCookies: 'cart--no-cookies'

  }

  theme.variables = {
    isIndexTemplate: theme.cache.$indexTemplate.length,

    // Footer
    footerTop: 0,

    // track window width to solve iOS scroll triggering resize event
    windowWidth: theme.cache.$window.width()
  };
};

theme.stringOverrides = function () {
  // Override defaults in theme.strings with potential
  // template overrides
  window.productStrings = window.productStrings || {};
  $.extend(theme.strings, window.productStrings);
};

theme.initCart = function() {
  
    ajaxCart.init({
      moneyFormat: theme.settings.moneyFormat
    });
  

  if (!theme.cookiesEnabled()) {
    theme.cache.$cartContainer.addClass(theme.cache.cartNoCookies);
    theme.cache.$cartSectionTemplate.addClass(theme.cache.cartNoCookies);
  }
};

theme.cookiesEnabled = function() {
  var cookieEnabled = navigator.cookieEnabled;

  if (!cookieEnabled){
    document.cookie = 'testcookie';
    cookieEnabled = (document.cookie.indexOf('testcookie') !== -1);
  }
  return cookieEnabled;
};

theme.drawersInit = function () {
  // Add required classes to HTML
  $('#PageContainer').addClass('drawer-page-content');
  $('.js-drawer-open-right').attr('aria-controls', 'CartDrawer').attr('aria-expanded', 'false');
  $('.js-drawer-open-left').attr('aria-controls', 'NavDrawer').attr('aria-expanded', 'false');
  $('.js-drawer-open-top').attr('aria-controls', 'SearchDrawer').attr('aria-expanded', 'false');

  theme.LeftDrawer = new theme.Drawers('NavDrawer', 'left');
  theme.RightDrawer = new theme.Drawers('CartDrawer', 'right', {
    'onDrawerOpen': ajaxCart.load
  });
  theme.SearchDrawer = new theme.Drawers('SearchDrawer', 'top', {'onDrawerOpen': theme.searchFocus});
};

theme.searchFocus = function () {
  theme.cache.$searchInput.focus();
  // set selection range hack for iOS
  theme.cache.$searchInput[0].setSelectionRange(0, theme.cache.$searchInput[0].value.length);
};

theme.searchSubmit = function () {
  theme.cache.$searchSubmit.on('click', function(evt) {
    if (theme.cache.$searchInput.val().length == 0) {
      evt.preventDefault();
      theme.cache.$searchInput.focus();
    }
  });
};

theme.socialSharing = function () {
  // Stop initializing if settings are disabled
  
    return;
  

  // General selectors
  var $buttons = theme.cache.$shareButtons;
  var $shareLinks = $buttons.find('a');
  var permalink = $buttons.attr('data-permalink');

  // Share popups
  $shareLinks.on('click', function(e) {
    e.preventDefault();
    var $el = $(this);
    var popup = $el.attr('class').replace('-','_');
    var link = $el.attr('href');
    var w = 700;
    var h = 400;

    // Set popup sizes
    switch (popup) {
      case 'share-twitter':
        h = 300;
        break;
      case 'share-fancy':
        w = 480;
        h = 720;
        break;
      case 'share-google':
        w = 500;
        break;
    }

    window.open(link, popup, 'width=' + w + ', height=' + h);
  });
}

theme.sizeCartDrawerFooter = function () {
  // Stop if our drawer doesn't have a fixed footer
  if (!theme.cache.$drawerRight.hasClass('drawer--has-fixed-footer')) return;


  // Elements are reprinted regularly so selectors are not cached
  var $cartFooter = $('.ajaxcart__footer').removeAttr('style');
  var $cartInner = $('.ajaxcart__inner').removeAttr('style');
  var cartFooterHeight = $cartFooter.outerHeight();

  $cartInner.css('bottom', cartFooterHeight);
  $cartFooter.css('height', cartFooterHeight);
};

theme.afterCartLoad = function () {
  theme.cache.$cartContainer.on('ajaxCart.afterCartLoad', function(evt, cart) {
    theme.RightDrawer.open();

    // set cart bubble after ajax cart update
    if (cart.item_count > 0) {
      theme.cache.$siteHeaderCart.addClass('cart-bubble--visible');
    } else {
      theme.cache.$siteHeaderCart.removeClass('cart-bubble--visible');
    }

    // Size the cart's fixed footer
    theme.sizeCartDrawerFooter();
  });

  theme.cache.$cartContainer.on('ajaxCart.updatingQty', function() {
    $('.cart__checkout').addClass('btn--ajax-disabled');
  });
};

theme.rteImages = function () {
  if (!theme.cache.$indentedRteImages.length) return;


  var $images = theme.cache.$indentedRteImages.find('img');
  var $rteImages = imagesLoaded($images);

  $rteImages.on('always', function (instance, image) {
    $images.each(function() {
      var $el = $(this);
      var imageWidth = $el.width();
      var attr = $el.attr('style');

      // Check if undefined or float: none
      if (!attr || attr == 'float: none;') {
        // Remove grid-breaking styles if image isn't wider than parent + 20%
        // negative margins set in CSS
        if (imageWidth < theme.cache.$indentedRteImages.width() * 1.4) {
          $el.addClass('rte__no-indent');
        }
      }
    });
  });
};

theme.styleTextLinks = function () {
  $('.rte').find('a:not(:has(img))').addClass('text-link');
}

theme.setFocus = function ($container, eventNamespace) {
  var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

  $container.attr('tabindex', '-1');

  $container.focus();

  $(document).on(eventName, function (evt) {
    if ($container[0] !== evt.target && !$container.has(evt.target).length) {
      $container.focus();

      //only set focus once
      $(document).off(eventName)
      $container.removeAttr('tabindex');
    }
  });
};

theme.passwordTemplate = function () {
  if (!theme.cache.$loginModal.length) return;

  // Initialize modal
  theme.PasswordModal = new window.Modals('LoginModal', 'login-modal', {
    $focusOnOpen: '#Password'
  });

  // Open modal if errors exist
  if (theme.cache.$loginModal.find('.errors').length) {
    theme.PasswordModal.open();
  }
};

theme.responsiveVideos = function () {
  var $iframeVideo = $('iframe[src*="youtube.com/embed"], iframe[src*="player.vimeo"]');
  var $iframeReset = $iframeVideo.add('iframe#admin_bar_iframe');

  $iframeVideo.each(function () {
    // Add wrapper to make video responsive
    if(!$(this).parent().hasClass('video-wrapper')){
      $(this).wrap('<div class="video-wrapper"></div>');
    }
  });

  $iframeReset.each(function () {
    // Re-set the src attribute on each iframe after page load
    // for Chrome's "incorrect iFrame content on 'back'" bug.
    // https://code.google.com/p/chromium/issues/detail?id=395791
    // Need to specifically target video and admin bar
    this.src = this.src;
  });
};

theme.checkIfIOS = function() {
  var ua = navigator.userAgent.toLowerCase();
  var isIOS = /ipad|iphone|ipod/.test(ua) && !window.MSStream;

  if (isIOS) {
    $('html')
      .addClass('is-ios');
  }
};

theme.productCardImageLoadingAnimation = function() {
  var selectors = {
    image: '[data-image]',
    imageWithPlaceholder: '[data-image-placeholder]',
    imageWithPlaceholderWrapper: '[data-image-with-placeholder-wrapper]'
  };

  var classes = {
    loadingAnimation: 'product-item__image-container--loading',
    lazyloaded: '.lazyloaded'
  };

  $(document).on('lazyloaded', function(e) {
    var $target = $(e.target);

    if (!$target.is(selectors.image)) {
      return;
    }

    $target
      .closest(selectors.imageWithPlaceholderWrapper)
      .removeClass(classes.loadingAnimation)
      .find(selectors.imageWithPlaceholder)
      .hide();
  });

  // When the theme loads, lazysizes might load images before the "lazyloaded"
  // event listener has been attached. When this happens, the following function
  // hides the loading placeholders.
  $(selectors.image + classes.lazyloaded)
    .closest(selectors.imageWithPlaceholderWrapper)
    .removeClass(classes.loadingAnimation)
    .find(selectors.imageWithPlaceholder)
    .hide();
};

$(document).ready(function() {
  theme.init();

  var sections = new theme.Sections();


  sections.register('action-bar-section', theme.ActionBarSection);
  sections.register('slideshow-section', theme.SlideshowSection);
  sections.register('sidebar-menu-section', theme.SidebarMenuSection);
  sections.register('header-section', theme.HeaderSection);
  sections.register('collection-template-section', theme.CollectionTemplate);
  sections.register('product', theme.Product);
  sections.register('rich-text-section', theme.RichTextSection);
  sections.register('newsletter-signup-section', theme.NewsletterSection);
  sections.register('featured-video-section', theme.FeaturedVideoSection);
  sections.register('map-section', theme.Maps);
  sections.register('password-content-section', theme.PasswordContentSection);
  sections.register('product-recommendations', theme.ProductRecommendations);
});
