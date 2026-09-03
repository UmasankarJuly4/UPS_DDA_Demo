/**
 * DataTable — the product's one tabular pattern.
 *
 * Renders a real <table> with a sticky header inside a scrollable viewport:
 * wide data scrolls horizontally rather than collapsing into cards, so column
 * alignment and row comparison survive on every screen size.
 *
 * columns: [{ key, label, width, align, className, render(row) -> Node|string }]
 *
 * `tableClassName` puts a class on the <table> itself, for a look that must
 * not reach tables nested inside this one's detail panels.
 *
 * Rows expand when `getChildren(row)` returns rows: the cell named by
 * `expandKey` grows a disclosure toggle, and the children appear beneath their
 * parent, indented, until it is closed again.
 *
 * `renderDetail(row)` expands a row onto a panel instead of onto child rows --
 * for a detail whose shape is not this table's columns. The scenario list uses
 * it: a scenario's bids are a table of their own, so they cannot be child rows
 * of the scenario grid. A row with a detail gets the same disclosure toggle,
 * and the panel is one full-width cell under it. `getChildren` and
 * `renderDetail` can both be given; children render first, then the panel.
 *
 * `onColumnHover(index, info)` opts a table into column-wise highlighting:
 * hovering any cell lights that whole column (header + body) instead of the
 * row, and the callback fires with `{ column, headerCell }` so the caller can
 * float column-level detail beside it (see the scenario comparison band).
 * `index` and `info` are null once the pointer leaves the table.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  DA.components = DA.components || {};

  DA.components.DataTable = function DataTable(options) {
    var columns = options.columns || [];
    var rows = options.rows || [];

    // How many leading columns freeze together (Movement + Mode + Core
    // Service, say), not just the first. Needs each of those columns to
    // carry an explicit pixel width (profileKeyColumns and friends already
    // do), since a sticky column's offset is the sum of the ones before it.
    var freezeColumns = Math.min(options.freezeColumns || 1, columns.length);
    var frozenLefts = [];
    (function computeOffsets() {
      var left = 0;
      for (var i = 0; i < freezeColumns; i++) {
        frozenLefts.push(left);
        left += parseFloat(columns[i].width) || 0;
      }
    })();

    /** Sticky styling for a column at `index`, or null if it isn't frozen. */
    function frozenStyle(index) {
      if (index >= freezeColumns) return null;
      return {
        position: 'sticky',
        left: frozenLefts[index] + 'px',
        className: 'is-frozen-col' + (index === freezeColumns - 1 ? ' is-frozen-edge' : '')
      };
    }

    var colgroup = el(
      'colgroup',
      {},
      columns.map(function (column) {
        return el('col', { style: column.width ? { width: column.width } : {} });
      })
    );

    var head = el('thead', {}, [
      el(
        'tr',
        {},
        columns.map(function (column, index) {
          var custom = column.renderHeader ? column.renderHeader() : null;
          var frozen = frozenStyle(index);
          return el('th', {
            text: custom ? null : column.label,
            attrs: { scope: 'col', 'aria-label': column.ariaLabel || false },
            className: (column.headerClassName || '') + (frozen ? ' ' + frozen.className : ''),
            style: frozen ? { position: frozen.position, left: frozen.left } : {}
          }, custom ? [custom] : null);
        })
      )
    ]);

    var body = el('tbody');
    // Rows flagged `expanded` start open, as the reference screens show them.
    var open = [];
    (function seed(list) {
      (list || []).forEach(function (row) {
        if (row && row.expanded) open.push(row);
        if (row && row.children) seed(row.children);
      });
    })(rows);

    function childrenOf(row) {
      var children = options.getChildren ? options.getChildren(row) : null;
      return children && children.length ? children : null;
    }

    /** True when this row has anything to expand onto -- rows, a panel, or both. */
    function expandable(row) {
      return Boolean(childrenOf(row) || options.renderDetail);
    }

    /*
     * Panels are built once per row and kept. Rebuilding on every toggle
     * would throw away whatever state the panel holds -- a scenario's bid
     * selection, a scroll position -- each time it was closed and reopened.
     */
    var details = [];
    var detailRows = [];

    function detailFor(row) {
      var at = detailRows.indexOf(row);
      if (at !== -1) return details[at];
      var node = options.renderDetail(row);
      detailRows.push(row);
      details.push(node);
      return node;
    }

    /**
     * `spanRepeats` columns (a shared label like Accessorial Type left
     * blank on every row after the one that names it) read as one merged
     * field spanning the whole run rather than a real rowspan: this cell's
     * own bottom border is dropped whenever the row right after it is
     * still part of the same run, i.e. that column is blank there too.
     * The border only reappears on the run's last row, where the value
     * changes again.
     */
    function spansIntoNext(column, nextRow) {
      return Boolean(column.spanRepeats && nextRow && !nextRow[column.key]);
    }

    function cell(column, row, depth, index, nextRow) {
      var content = column.render ? column.render(row) : row[column.key];
      var isNode = content instanceof Node;
      var children = column.key === options.expandKey ? childrenOf(row) : null;
      var frozen = frozenStyle(index);
      var spanContinues = spansIntoNext(column, nextRow);

      if (column.key === options.expandKey) {
        var label = isNode ? content : el('span', { text: content == null ? '' : String(content) });
        var expanded = open.indexOf(row) !== -1;
        var inner = [];

        if (children || (options.renderDetail && depth === 0)) {
          inner.push(el('button', {
            className: 'row-toggle u-tap-target',
            attrs: {
              type: 'button',
              'aria-expanded': expanded ? 'true' : 'false',
              'aria-label': (expanded ? 'Collapse ' : 'Expand ') +
                (isNode ? (row[column.key] || 'row') : String(content))
            },
            on: {
              click: function () {
                var at = open.indexOf(row);
                if (at === -1) open.push(row); else open.splice(at, 1);
                render();
              }
            }
          }, [expanded ? DA.icons.chevronDown(14) : DA.icons.chevronRight(14, '')]));
        }
        inner.push(label);

        return el('td', {
          className: (column.className || '') + ' has-expander' +
            (depth ? ' is-child-cell' : '') + (frozen ? ' ' + frozen.className : ''),
          style: Object.assign(
            depth ? { 'padding-left': (depth * 20 + 12) + 'px' } : {},
            frozen ? { position: frozen.position, left: frozen.left } : {}
          )
        }, [el('span', { className: 'expand-cell' }, inner)]);
      }

      var plain = content == null ? '' : String(content);
      return el('td', {
        className: (column.className || '') + (frozen ? ' ' + frozen.className : '') +
          (spanContinues ? ' is-span-continuation' : ''),
        text: isNode ? null : content,
        // Only a cell that actually holds text carries a tooltip; an empty
        // one was producing an empty tooltip on hover.
        attrs: { title: !isNode && plain ? plain : false },
        style: frozen ? { position: frozen.position, left: frozen.left } : {}
      }, isNode ? [content] : null);
    }

    function addRow(row, depth, nextRow) {
      body.appendChild(el('tr', {
        className: (options.rowClassName ? options.rowClassName(row) : '') +
          (depth ? ' is-child-row' : '')
      }, columns.map(function (column, index) { return cell(column, row, depth, index, nextRow); })));
    }

    /**
     * Rows in final render order, each paired with the depth it renders at
     * -- collected up front (rather than appended as each is visited) so a
     * spanRepeats column can look at the row right after it before that
     * row's own <tr> exists yet.
     */
    function flatten() {
      var flat = [];
      function visit(row, depth) {
        flat.push({ row: row, depth: depth });
        if (open.indexOf(row) !== -1) {
          (childrenOf(row) || []).forEach(function (child) { visit(child, depth + 1); });
          if (options.renderDetail && depth === 0) flat.push({ row: row, detail: true });
        }
      }
      rows.forEach(function (row) { visit(row, 0); });
      return flat;
    }

    /**
     * The panel row: one cell spanning every column. It carries the parent's
     * accessible name so a screen reader arriving in the panel is told which
     * row opened it, which the visual nesting says on its own.
     */
    function addDetail(row) {
      body.appendChild(el('tr', { className: 'is-detail-row' }, [
        el('td', {
          className: 'detail-cell',
          attrs: { colspan: columns.length },
          style: { 'white-space': 'normal' }
        }, [detailFor(row)])
      ]));
    }

    function render() {
      DA.dom.clear(body);
      if (rows.length === 0) {
        // Fixed column widths would hold the table at its full scrolling
        // width with nothing in it, pushing the empty state off to the side.
        table.classList.add('data-table--empty');
        if (colgroup.parentNode) table.removeChild(colgroup);
        body.appendChild(
          el('tr', { className: 'is-empty-row' }, [
            el('td', { attrs: { colspan: columns.length }, style: { 'white-space': 'normal' } }, [
              options.emptyState || DA.components.EmptyState({ title: 'No records found' })
            ])
          ])
        );
        return;
      }
      table.classList.remove('data-table--empty');
      if (!colgroup.parentNode) table.insertBefore(colgroup, head);
      var flat = flatten();
      flat.forEach(function (entry, index) {
        if (entry.detail) { addDetail(entry.row); return; }
        var next = flat[index + 1];
        addRow(entry.row, entry.depth, next && !next.detail ? next.row : null);
      });
    }


    var table = el('table', {
      className: 'data-table' +
        (options.embedded ? ' data-table--auto' : '') +
        (options.headerTone ? ' data-table--' + options.headerTone : '') +
        (options.tinted ? ' data-table--tinted' : '') +
        // A look that belongs to *this* table, not to everything under its
        // container. The row-card treatment used to be selected by descent
        // from a wrapper class, which meant a table nested in a detail panel
        // inherited it -- scenario bids came out as row cards inside a row
        // card. Naming the table itself is what stops that.
        (options.tableClassName ? ' ' + options.tableClassName : '')
    }, [
      options.caption
        ? el('caption', { className: 'u-visually-hidden', text: options.caption })
        : null,
      colgroup,
      head,
      body
    ]);

    render();

    var viewport = el(
      'div',
      {
        className: 'data-table__viewport scroll-area' +
          (options.embedded ? ' data-table__viewport--auto' : ''),
        attrs: {
          tabindex: '0',
          role: 'region',
          'aria-label': options.caption || 'Data table'
        }
      },
      [table]
    );

    // The row-header column freezes alongside the already-always-sticky
    // header row -- unconditionally, no toggle. Freezing a single-column
    // stand-in (the empty-state placeholder tables use exactly one) would
    // have nothing to freeze against, so it's skipped there.
    if (columns.length > 1) table.classList.add('data-table--frozen');

    if (typeof options.onColumnHover === 'function') {
      setupColumnHover(table, viewport, columns, options.onColumnHover);
    }

    // F1 C -- an embedded report table takes a bounded frame, so the sticky
    // header and the frozen columns have something to hold position against.
    // `framed: false` opts a table out (the comparison band is three rows and
    // has nothing to scroll).
    if (DA.ux && DA.ux.frameTables && options.embedded && options.framed !== false) {
      return frameTable(viewport, table, rows.length > 0);
    }

    return viewport;
  };

  /**
   * F1 C -- wraps a table viewport in a frame that bounds its height and
   * docks a second horizontal scrollbar above the grid.
   *
   * The defect this answers is not only that the header scrolled away. It is
   * that on a 2,640px-wide table the only way to move sideways was a
   * scrollbar at the table's *bottom* edge, below the fold -- so reaching the
   * far columns meant scrolling the page down, scrolling the table across,
   * then scrolling the page back up to read the header that had by then also
   * gone. Bounding the height fixes the header; the top rail fixes the reach.
   */
  function frameTable(viewport, table, hasRows) {
    viewport.classList.add('is-framed');
    if (DA.ux.frameMaxHeight) {
      viewport.style.setProperty('--frame-max-height', DA.ux.frameMaxHeight);
    }

    // The rail is a real scroll container over a spacer as wide as the table,
    // rather than a custom-drawn control: it inherits the platform's own
    // scrollbar, its keyboard behaviour and its momentum for free.
    var spacer = el('div');
    var scroller = el('div', {
      className: 'table-frame__scroller',
      attrs: { 'aria-hidden': 'true' }
    }, [spacer]);

    /*
     * Two-way, and self-limiting: assigning scrollLeft fires a scroll event on
     * the other element asynchronously, so a re-entrancy flag set and cleared
     * synchronously would already be false by the time the echo arrives. The
     * equality check ends the exchange instead -- writing a value that is
     * already set fires nothing, so the pair settles after one hop.
     */
    function mirror(from, to) {
      if (to.scrollLeft !== from.scrollLeft) to.scrollLeft = from.scrollLeft;
    }
    scroller.addEventListener('scroll', function () { mirror(scroller, viewport); });
    viewport.addEventListener('scroll', function () { mirror(viewport, scroller); });

    /**
     * Match the rail to the table, and decide whether it is needed at all.
     *
     * The top rail exists for *reach*: on a tall grid the table's own
     * horizontal scrollbar sits at its bottom edge, out of view while you are
     * reading the top rows, so moving sideways meant scrolling down to find
     * the control and back up to use it.
     *
     * When the table is short enough to fit its frame without scrolling, that
     * problem does not exist -- the bottom scrollbar is already on screen, and
     * showing the rail as well just puts two horizontal scrollbars on one
     * table. So the rail appears only when it earns its place: the table
     * overflows horizontally AND is tall enough to scroll vertically.
     */
    function measure() {
      var width = table.scrollWidth;
      // A table inside a hidden pane measures zero. Keep the last real
      // measurement rather than collapsing the rail, so returning to a tab
      // does not arrive with a dead scrollbar.
      if (!width) return;
      spacer.style.width = width + 'px';

      var scrollsSideways = width > viewport.clientWidth + 1;
      var bottomEdgeOutOfView = viewport.scrollHeight > viewport.clientHeight + 1;
      scroller.hidden = !hasRows || !scrollsSideways || !bottomEdgeOutOfView;
    }

    /*
     * Column widths settle after layout, so the first measurement has to wait
     * for it -- but not on requestAnimationFrame. Since panels are now built
     * once and kept alive (F4 A), a table is frequently constructed inside a
     * pane that is still hidden, where rAF is throttled or never fires and
     * the element measures zero either way. A timeout runs regardless of
     * frame production, and re-measuring when the table is next interacted
     * with covers the case where it was genuinely offscreen at build time.
     */
    window.setTimeout(measure, 0);
    window.addEventListener('resize', measure);
    viewport.addEventListener('pointerenter', measure);
    viewport.addEventListener('scroll', measure);
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(measure).observe(table);
    }

    return el('div', { className: 'table-frame' }, [scroller, viewport]);
  }

  /**
   * Column-wise hover: light the whole column under the pointer and tell the
   * caller which one it is. Moving between cells in the same column is a
   * no-op; leaving the scroll viewport clears it.
   */
  function setupColumnHover(table, viewport, columns, notify) {
    var active = -1;

    function cellsInColumn(index) {
      var out = [];
      var rows = table.rows; // thead row(s) then every tbody row, in order
      for (var r = 0; r < rows.length; r++) {
        var c = rows[r].cells[index];
        if (c && !c.hasAttribute('colspan')) out.push(c);
      }
      return out;
    }

    function clear() {
      if (active === -1) return;
      cellsInColumn(active).forEach(function (c) { c.classList.remove('is-col-highlight'); });
      table.classList.remove('has-col-highlight');
      active = -1;
    }

    function paint(index) {
      if (index === active) return;
      clear();
      if (index < 0 || index >= columns.length) { notify(null, null); return; }
      active = index;
      cellsInColumn(index).forEach(function (c) { c.classList.add('is-col-highlight'); });
      table.classList.add('has-col-highlight');
      var headRow = table.tHead && table.tHead.rows[0];
      notify(index, { column: columns[index], headerCell: headRow && headRow.cells[index] });
    }

    table.addEventListener('mouseover', function (event) {
      var cell = event.target.closest && event.target.closest('th, td');
      if (!cell || cell.hasAttribute('colspan')) return;
      paint(cell.cellIndex);
    });

    viewport.addEventListener('mouseleave', function () {
      clear();
      notify(null, null);
    });
  }

  /**
   * Record link cell: identifier + chevron affordance, one hit target.
   * `onClick` navigates in place (event.preventDefault() first) instead of
   * following `href`, for records opened without a real route behind them.
   */
  DA.components.RecordLink = function RecordLink(options) {
    return el(
      'a',
      {
        className: 'record-link',
        attrs: {
          href: options.href || '#',
          'aria-label': options.ariaLabel || false
        },
        on: options.onClick
          ? { click: function (event) { event.preventDefault(); options.onClick(event); } }
          : {}
      },
      [
        el('span', { className: 'record-link__label', text: options.label }),
        DA.icons.chevronRight(14)
      ]
    );
  };
})(window.DA);
