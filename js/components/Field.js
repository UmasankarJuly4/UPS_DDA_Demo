/**
 * Field — outlined text input with a floating label.
 *
 * The placeholder carries the label text while the field is empty, and the
 * label rises to the border once it holds a value, so a filled field is never
 * left unlabelled. `help` adds the circled question mark beside the control;
 * `hint` adds guidance text underneath.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  DA.components = DA.components || {};

  var uid = 0;
  function nextId(prefix) {
    uid += 1;
    return prefix + '-' + uid;
  }

  DA.components.HelpButton = function HelpButton(text) {
    return el('button', {
      className: 'help-button u-tap-target',
      attrs: { type: 'button', 'aria-label': text, title: text }
    }, [DA.icons.help()]);
  };

  /**
   * A trailing asterisk in the label is the product's required marker. Shared
   * on `DA.components` so every control that takes a label applies one rule —
   * ChipInput carries required fields too.
   */
  function isRequired(label) {
    return typeof label === 'string' && /\*\s*$/.test(label.replace(/\(.*\)\s*$/, ''));
  }

  DA.components.isRequiredLabel = isRequired;

  DA.components.Field = function Field(options) {
    options = options || {};
    var id = options.id || nextId('field');
    var hintId = options.hint ? id + '-hint' : null;

    var input = el(options.multiline ? 'textarea' : 'input', {
      className: 'field__input' + (options.multiline ? ' field__input--multiline' : ''),
      attrs: {
        id: id,
        type: options.multiline ? false : (options.type || 'text'),
        rows: options.multiline ? (options.rows || 2) : false,
        placeholder: options.label,
        readonly: options.readOnly || false,
        'aria-required': isRequired(options.label) ? 'true' : false,
        'aria-describedby': hintId || false
      },
      on: options.onInput ? { input: options.onInput } : {}
    });
    input.value = options.value || '';

    var wrapper = el('div', { className: 'form-field' }, [
      el('div', { className: 'field' }, [
        el('div', { className: 'field__control' }, [
          input,
          el('label', {
            className: options.hideLabel ? 'u-visually-hidden' : 'field__label',
            text: options.label,
            attrs: { for: id }
          })
        ]),
        options.help ? DA.components.HelpButton(options.help) : null
      ]),
      options.hint
        ? el('p', {
            className: 'field__hint' + (options.hintAlign === 'end' ? ' field__hint--end' : ''),
            text: options.hint,
            attrs: { id: hintId }
          })
        : null
    ]);

    wrapper.input = input;
    return wrapper;
  };

  /**
   * SelectField — a Dropdown built as a single-select listbox, so every
   * choice field in the product opens the same panel (padding, hover,
   * Escape/click-outside) that Comparison View's multi-select already uses,
   * rather than the browser's own unstyled native-select popup. Same
   * `label` / `value` / `options` / `onChange` / `hideLabel` / `help` shape
   * a native <select>-backed field would take, so no caller needs to change
   * beyond `onChange` now receiving the chosen value directly (every other
   * component in this app already does this: Toggle, Checkbox, Dropdown's
   * own Apply flow) rather than a change Event.
   *
   * Built as a listbox, not a bare click-to-close menu, because it replaces
   * a native <select>: Up/Down/Home/End move the active option,
   * Enter/Space commits it, typing jumps to a matching label, and the
   * active option is tracked via aria-activedescendant on the listbox
   * itself rather than moving real focus between options -- the standard
   * pattern for a listbox popup, and the only one of these that doesn't
   * regress the keyboard support a native select gave for free.
   */
  DA.components.SelectField = function SelectField(options) {
    options = options || {};
    var opts = options.options || [];
    var current = options.value;
    var listId = nextId('listbox');
    var optionEls = [];
    var activeIndex = Math.max(0, indexOfValue(current));

    function indexOfValue(value) {
      for (var i = 0; i < opts.length; i++) {
        if (String(opts[i].value) === String(value)) return i;
      }
      return -1;
    }

    function labelFor(value) {
      var at = indexOfValue(value);
      return at === -1 ? '' : opts[at].label;
    }

    function setActive(index) {
      if (index < 0 || index >= opts.length) return;
      activeIndex = index;
      list.setAttribute('aria-activedescendant', listId + '-' + activeIndex);
      optionEls.forEach(function (node, i) { node.classList.toggle('is-active', i === activeIndex); });
      if (optionEls[activeIndex].scrollIntoView) optionEls[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    function choose(index) {
      var opt = opts[index];
      if (!opt) return;
      current = opt.value;
      activeIndex = index;
      dropdown.setValue(opt.label);
      optionEls.forEach(function (node, i) {
        var selected = i === index;
        node.classList.toggle('is-selected', selected);
        node.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      if (options.onChange) options.onChange(opt.value);
      dropdown.close();
    }

    /** Jumps to the next option whose label starts with the typed letter. */
    function typeahead(letter) {
      var lower = letter.toLowerCase();
      var count = opts.length;
      for (var step = 1; step <= count; step++) {
        var at = (activeIndex + step) % count;
        if (String(opts[at].label).toLowerCase().indexOf(lower) === 0) { setActive(at); return; }
      }
    }

    function onListKeydown(event) {
      switch (event.key) {
        case 'ArrowDown': event.preventDefault(); setActive(Math.min(activeIndex + 1, opts.length - 1)); break;
        case 'ArrowUp': event.preventDefault(); setActive(Math.max(activeIndex - 1, 0)); break;
        case 'Home': event.preventDefault(); setActive(0); break;
        case 'End': event.preventDefault(); setActive(opts.length - 1); break;
        case 'Enter':
        case ' ': event.preventDefault(); choose(activeIndex); break;
        default:
          if (event.key.length === 1) typeahead(event.key);
      }
    }

    optionEls = opts.map(function (opt, index) {
      var selected = index === activeIndex;
      var node = el('li', {
        className: 'dropdown__option dropdown__option--select' + (selected ? ' is-selected' : ''),
        attrs: {
          role: 'option',
          id: listId + '-' + index,
          'aria-selected': selected ? 'true' : 'false'
        },
        on: {
          click: function () { choose(index); },
          mouseenter: function () { setActive(index); }
        }
      }, [
        DA.icons.check(16, 'dropdown__option-check'),
        el('span', { className: 'dropdown__option-label', text: opt.label })
      ]);
      return node;
    });

    var list = el('ul', {
      className: 'dropdown__listbox',
      attrs: {
        role: 'listbox',
        tabindex: '-1',
        id: listId,
        'aria-activedescendant': opts.length ? listId + '-' + activeIndex : false
      },
      on: { keydown: onListKeydown }
    }, optionEls);

    var dropdown = DA.components.Dropdown({
      label: options.label,
      hideLabel: options.hideLabel,
      value: labelFor(current),
      popupRole: 'listbox',
      triggerClassName: 'select-field__trigger',
      content: [list],
      onOpen: function () {
        setActive(activeIndex);
        list.focus();
      }
    });

    var wrapper = el('div', { className: 'form-field' }, [
      el('div', { className: 'field' }, [
        dropdown,
        options.help ? DA.components.HelpButton(options.help) : null
      ])
    ]);

    wrapper.getValue = function () { return current; };
    return wrapper;
  };
})(window.DA);
