/**
 * TreeSelectField — single-select dropdown over a label/children tree.
 *
 * Built on the same Dropdown popover and .dropdown__option row Field's
 * SelectField uses, so it reads and behaves like every other field, but its
 * options are organized into collapsible groups (Domestic > Air > 2nd Day
 * Air) instead of one flat list. Only a leaf (a node with no `children`) is
 * selectable; a group node exists purely to expand or collapse the leaves
 * under it -- there is no "select the whole group" affordance, and no
 * multi-select, unlike Comparison View's checkbox dropdown. A search box
 * filters leaves by label and auto-expands any group holding a match.
 *
 * `tree` is `[{ label, children: [...] } | { label, value }]`; a leaf's
 * `value` defaults to its `label` when omitted. `onChange(value, leaf)`
 * fires with the chosen leaf's value and its node (carrying `path`, the
 * leaf's ancestor labels plus its own, for a caller that wants the full
 * breadcrumb rather than just the leaf's own label).
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  DA.components = DA.components || {};

  DA.components.TreeSelectField = function TreeSelectField(options) {
    options = options || {};
    var tree = options.tree || [];
    var current = options.value;
    var leafRows = []; // { row, leaf } across every leaf, for selection styling

    function choose(leaf) {
      current = leaf.value;
      dropdown.setValue(leaf.label);
      leafRows.forEach(function (entry) {
        var selected = entry.leaf === leaf;
        entry.row.classList.toggle('is-selected', selected);
        entry.row.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      if (options.onChange) options.onChange(leaf.value, leaf);
      dropdown.close();
    }

    function buildLeaf(node, ancestors, depth) {
      var value = node.value == null ? node.label : node.value;
      var leaf = { label: node.label, value: value, path: ancestors.concat(node.label) };
      var selected = value === current;

      var row = el('li', {
        className: 'dropdown__option dropdown__option--select dropdown__tree-leaf' +
          (selected ? ' is-selected' : ''),
        attrs: {
          role: 'treeitem',
          tabindex: '0',
          'aria-selected': selected ? 'true' : 'false'
        },
        style: { '--tree-depth': String(depth) },
        on: {
          click: function () { choose(leaf); },
          keydown: function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              choose(leaf);
            }
          }
        }
      }, [
        DA.icons.check(16, 'dropdown__option-check'),
        el('span', { className: 'dropdown__option-label', text: node.label })
      ]);

      leafRows.push({ row: row, leaf: leaf });

      return {
        li: row,
        applyFilter: function (query) {
          var visible = !query || node.label.toLowerCase().indexOf(query) !== -1;
          row.hidden = !visible;
          return visible;
        }
      };
    }

    function buildGroup(node, ancestors, depth) {
      var children = node.children.map(function (child) {
        return child.children
          ? buildGroup(child, ancestors.concat(node.label), depth + 1)
          : buildLeaf(child, ancestors.concat(node.label), depth + 1);
      });

      var childList = el('ul', {
        className: 'dropdown__tree-group',
        attrs: { role: 'group' }
      }, children.map(function (c) { return c.li; }));

      var toggle = el('button', {
        className: 'dropdown__tree-toggle',
        attrs: { type: 'button', 'aria-expanded': 'true' },
        style: { '--tree-depth': String(depth) },
        on: {
          click: function () {
            var open = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
            childList.hidden = open;
          }
        }
      }, [
        DA.icons.chevronDown(14, 'dropdown__tree-chevron'),
        el('span', { className: 'dropdown__tree-label', text: node.label })
      ]);

      var li = el('li', { className: 'dropdown__tree-node', attrs: { role: 'treeitem' } }, [toggle, childList]);

      return {
        li: li,
        applyFilter: function (query) {
          var anyVisible = children.reduce(function (found, c) { return c.applyFilter(query) || found; }, false);
          li.hidden = !anyVisible;
          if (query && anyVisible) {
            childList.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
          }
          return anyVisible;
        }
      };
    }

    var roots = tree.map(function (node) {
      return node.children ? buildGroup(node, [], 0) : buildLeaf(node, [], 0);
    });

    var currentLeaf = leafRows.filter(function (entry) { return entry.leaf.value === current; })[0];

    var search = DA.components.SearchField({
      label: 'Search ' + (options.label || 'options'),
      placeholder: 'Search',
      onSearch: function (text) {
        var query = text.trim().toLowerCase();
        roots.forEach(function (r) { r.applyFilter(query); });
      }
    });

    var treeList = el('ul', {
      className: 'dropdown__tree',
      attrs: { role: 'tree', 'aria-label': options.label || 'Options' }
    }, roots.map(function (r) { return r.li; }));

    var dropdown = DA.components.Dropdown({
      label: options.label,
      hideLabel: options.hideLabel,
      value: currentLeaf ? currentLeaf.leaf.label : '',
      triggerClassName: 'select-field__trigger',
      content: [
        el('div', { className: 'dropdown__tree-search' }, [search]),
        treeList
      ]
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
