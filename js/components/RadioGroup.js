/**
 * RadioGroup — mutually exclusive choice rendered as native radio inputs
 * (round, with a visible label), for choices read as a real form field
 * rather than a view-scope switch (that's SegmentedControl's job).
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  DA.components = DA.components || {};

  var uid = 0;

  DA.components.RadioGroup = function RadioGroup(options) {
    options = options || {};
    uid += 1;
    var name = options.name || 'radio-group-' + uid;
    var items = options.items || [];
    var value = options.value != null ? options.value : (items[0] && items[0].value);

    var group = el('div', {
      className: 'radio-group',
      attrs: { role: 'radiogroup', 'aria-label': options.ariaLabel || 'Choose one' }
    });

    DA.dom.append(group, items.map(function (item, index) {
      var id = name + '-' + index;
      var input = el('input', {
        className: 'radio-group__input',
        attrs: {
          id: id,
          type: 'radio',
          name: name,
          checked: String(item.value) === String(value)
        },
        on: {
          change: function () {
            if (options.onChange) options.onChange(item.value);
          }
        }
      });
      return el('span', { className: 'radio-group__option' }, [
        input,
        el('span', { className: 'radio-group__dot', attrs: { 'aria-hidden': 'true' } }),
        el('label', { className: 'radio-group__label', text: item.label, attrs: { for: id } })
      ]);
    }));

    return group;
  };
})(window.DA);
