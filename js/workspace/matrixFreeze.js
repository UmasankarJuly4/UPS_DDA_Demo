/**
 * Freezes the leading key columns of a `.matrix` grid.
 *
 * The incentive grids put zones across the top and the thing being priced down
 * the side. On the weight-break grid ("Cell by Cell/Customs" > Zone Reference:
 * Daily) that side is *two* columns, not one -- `from` and `to`, which together
 * read as a range: 1-5, 6-10, 11-20, 21-30, 31+. Freezing only the first left
 * the upper bound scrolling away with the figures, so the row said "1" and you
 * had to remember what it was 1 to.
 *
 * The plain CSS rule cannot do this. A second sticky column has to be offset by
 * the exact width of the one before it, and these grids carry no colgroup: the
 * key columns size to their content, and the header spans both with "Billable
 * Weight (lbs)", which is wider than the two figures beneath it. So the offset
 * is measured, the same way DataTable computes its own frozen-column offsets.
 *
 * Header cells that span the whole key block stay at left: 0 and are handled in
 * CSS; only the body's per-column offsets need measuring.
 */
(function (DA) {
  'use strict';

  DA.workspace = DA.workspace || {};

  function isKeyCell(cell) {
    return cell.classList.contains('matrix__rowhead') ||
           cell.classList.contains('matrix__label');
  }

  /**
   * `host` is the scroll container; `table` the .matrix inside it.
   * Safe to call before the table is in the document -- it re-measures on
   * layout, on resize, and when the pointer arrives.
   */
  DA.workspace.pinMatrixKeys = function pinMatrixKeys(host, table) {
    function pin() {
      var body = table.tBodies && table.tBodies[0];
      if (!body || !body.rows.length) return;

      // A row that is a full-width section band (the tier grid's "Service
      // Group" divider) has one colspan cell and would report a single key
      // column, so the widest row wins the count.
      var template = null;
      var keyCount = 0;
      Array.prototype.forEach.call(body.rows, function (row) {
        var count = 0;
        while (count < row.cells.length && isKeyCell(row.cells[count])) count += 1;
        if (count > keyCount) { keyCount = count; template = row; }
      });
      if (!template || !keyCount) return;

      var offsets = [];
      var left = 0;
      for (var i = 0; i < keyCount; i++) {
        var width = template.cells[i].getBoundingClientRect().width;
        // Detached or hidden: keep whatever was measured last rather than
        // collapsing every key column onto zero.
        if (!width) return;
        offsets.push(left);
        left += width;
      }

      Array.prototype.forEach.call(body.rows, function (row) {
        for (var i = 0; i < keyCount; i++) {
          var cell = row.cells[i];
          if (!cell || !isKeyCell(cell)) break;
          cell.style.position = 'sticky';
          cell.style.left = offsets[i] + 'px';
          cell.classList.add('is-matrix-key');
          // Only the last column of the frozen block carries the edge.
          cell.classList.toggle('is-matrix-key-edge', i === keyCount - 1);
        }
      });

      table.classList.add('matrix--frozen');
    }

    // Widths settle after layout. Not requestAnimationFrame: these grids are
    // built inside collapsed accordion panels, where it does not fire.
    window.setTimeout(pin, 0);
    window.addEventListener('resize', pin);
    if (host) host.addEventListener('pointerenter', pin);
    if (typeof ResizeObserver === 'function') new ResizeObserver(pin).observe(table);

    return pin;
  };
})(window.DA);
