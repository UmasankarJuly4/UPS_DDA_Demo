/**
 * Tabs — one visible panel at a time.
 * Follows the tablist pattern: arrow keys move between tabs, Home/End jump to
 * the ends, and each panel is labelled by the tab that controls it.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  DA.components = DA.components || {};

  var uid = 0;

  DA.components.Tabs = function Tabs(options) {
    options = options || {};
    var items = options.items || [];
    uid += 1;
    var value = options.value || (items[0] && items[0].id);
    var tabs = [];

    var panel = el('div', { className: 'tabs__panel' });
    var list = el('div', {
      className: 'tabs__list',
      attrs: { role: 'tablist', 'aria-label': options.ariaLabel || 'Sections' }
    });

    /*
     * F4 A -- panels are built once and kept alive.
     *
     * Previously every activation called item.render() and threw the old node
     * away, so a tab round-trip discarded whatever the analyst had set up:
     * measured on Cost Details, a lane expanded to 13 rows at scrollLeft 800
     * came back as 9 rows at scrollLeft 0. Since the seven Analyzer sub-tabs
     * are cross-referenced constantly, that rebuild was being paid dozens of
     * times an hour. Hiding rather than destroying keeps expansion, scroll
     * position, radio state and selection intact, and makes the return
     * instant. Panels are still built lazily -- a tab never opened costs
     * nothing.
     */
    var built = {};

    function panelFor(id) {
      if (!built[id]) {
        var item = items.filter(function (entry) { return entry.id === id; })[0];
        var host = el('div', { className: 'tabs__pane' }, [item ? item.render() : el('div')]);
        built[id] = host;
        panel.appendChild(host);
      }
      return built[id];
    }

    function select(next, moveFocus) {
      value = next;
      tabs.forEach(function (tab) {
        var active = tab.dataset.tab === value;
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
        if (active && moveFocus) tab.focus();
      });
      panel.setAttribute('aria-labelledby', 'tab-' + uid + '-' + value);

      if (DA.ux && DA.ux.keepTabPanels) {
        panelFor(value);
        Object.keys(built).forEach(function (id) { built[id].hidden = id !== value; });
        // Anything inside a pane that measures itself was measuring zero
        // while that pane was hidden. Now that it has dimensions, let it
        // measure again -- this is what sizes the framed tables' top
        // scrollbar (F1 C) on a tab that was built but never shown.
        window.dispatchEvent(new Event('resize'));
      } else {
        var item = items.filter(function (entry) { return entry.id === value; })[0];
        DA.dom.clear(panel).appendChild(item ? item.render() : el('div'));
      }

      if (options.onChange) options.onChange(value);
    }

    function onKeydown(event) {
      var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      var index = items.findIndex(function (item) { return item.id === value; });

      if (step) {
        event.preventDefault();
        return select(items[(index + step + items.length) % items.length].id, true);
      }
      if (event.key === 'Home') {
        event.preventDefault();
        return select(items[0].id, true);
      }
      if (event.key === 'End') {
        event.preventDefault();
        return select(items[items.length - 1].id, true);
      }
    }

    items.forEach(function (item) {
      var tab = el('button', {
        /*
         * `aside: true` sets a tab apart at the end of the bar. It is still a
         * tab in every respect -- same tablist, same arrow-key order, same
         * panel -- but it is marked so a view that only reads can sit away
         * from the ones that edit.
         */
        className: 'tabs__tab' + (item.aside ? ' tabs__tab--aside' : ''),
        text: item.label,
        dataset: { tab: item.id },
        attrs: {
          type: 'button',
          role: 'tab',
          id: 'tab-' + uid + '-' + item.id,
          'aria-selected': 'false',
          'aria-controls': 'tabpanel-' + uid,
          tabindex: -1
        },
        on: {
          click: function () { select(item.id, false); },
          keydown: onKeydown
        }
      });
      tabs.push(tab);
      list.appendChild(tab);
    });

    panel.setAttribute('id', 'tabpanel-' + uid);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('tabindex', '0');

    select(value, false);
    return el('div', { className: 'tabs' }, [list, panel]);
  };
})(window.DA);
