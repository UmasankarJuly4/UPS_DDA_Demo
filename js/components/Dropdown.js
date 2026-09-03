/**
 * Dropdown — a trigger that opens a panel beneath it.
 *
 * Closes on Escape or a click outside, and returns focus to the trigger. The
 * caller owns the panel's contents, so this handles only the popover mechanics.
 *
 * `label` is a static field name shown small above the trigger's current
 * value, the same convention `SelectField` uses (gold micro-label, dark
 * value text), so a dropdown trigger reads consistently with every other
 * field on the page rather than showing only one line of text; `hideLabel`
 * keeps it in the accessibility tree but visually hidden, same as Field and
 * SelectField. `value` is the initial value text; call the returned node's
 * `setValue(text)` to update it after a selection changes (this dropdown's
 * own selection is often applied, not committed live, so the caller
 * controls when it updates). `popupRole` overrides `aria-haspopup` (default
 * `"true"`) -- SelectField passes `"listbox"`. `onOpen` fires after the
 * panel opens, for a caller that needs to move focus into it.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  DA.components = DA.components || {};

  var uid = 0;

  DA.components.Dropdown = function Dropdown(options) {
    options = options || {};
    uid += 1;
    var panelId = 'dropdown-panel-' + uid;
    var open = false;

    var panel = el('div', {
      className: 'dropdown__panel',
      attrs: { id: panelId, hidden: true }
    }, options.content || []);

    var valueNode = el('span', { className: 'dropdown__value', text: options.value || '' });

    var trigger = el('button', {
      className: 'dropdown__trigger' + (options.triggerClassName ? ' ' + options.triggerClassName : ''),
      attrs: {
        type: 'button',
        'aria-haspopup': options.popupRole || 'true',
        'aria-expanded': 'false',
        'aria-controls': panelId
      },
      on: { click: function () { toggle(!open); } }
    }, [
      el('span', { className: 'dropdown__text' }, [
        options.label
          ? el('span', {
              className: options.hideLabel ? 'u-visually-hidden' : 'dropdown__label',
              text: options.label
            })
          : null,
        valueNode
      ]),
      DA.icons.chevronDown(18, 'dropdown__chevron')
    ]);

    var root = el('div', {
      className: 'dropdown',
      on: {
        keydown: function (event) {
          if (event.key === 'Escape' && open) {
            event.stopPropagation();
            toggle(false);
            trigger.focus();
          }
        }
      }
    }, [trigger, panel]);

    function onDocumentClick(event) {
      if (!root.contains(event.target)) toggle(false);
    }

    function toggle(next) {
      open = next;
      panel.hidden = !open;
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      root.classList.toggle('dropdown--open', open);
      if (open) {
        document.addEventListener('click', onDocumentClick, true);
        if (options.onOpen) options.onOpen();
      } else {
        document.removeEventListener('click', onDocumentClick, true);
      }
    }

    root.close = function () {
      toggle(false);
      trigger.focus();
    };
    root.setValue = function (text) {
      valueNode.textContent = text;
    };
    return root;
  };
})(window.DA);
