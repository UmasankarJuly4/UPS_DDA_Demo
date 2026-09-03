/**
 * Analyzer Packet — the report built from the packet's scenarios.
 *
 * Reached from "Proceed to Analyzer Packet". The comparison selector chooses
 * which scenarios the report covers; the tabs below split it into Analyzer,
 * Pricing Terms, Other Terms, Adjustments and Rate Charts. Analyzer holds its
 * own sub-tabs: Comparisons, Services, Charges, Accounts, Cost Details,
 * Zones and Weight & Cube.
 *
 * Comparisons, Services, Charges, Cost Details and Zones are documented by
 * reference screens. Accounts and Weight & Cube are built from the same
 * conventions (is-rowhead label columns, a breakdown that always sums back
 * to its parent) rather than a reference screenshot of this exact packet's
 * data. Rate Charts, Adjustments and Other Terms > Dim Divisor are now built
 * from their own reference screens too, transcribed as flat (non-expanding)
 * tables since none of them open onto a breakdown. Other Terms > Minimums
 * still renders the product's empty table state -- not built yet.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  var C = DA.components;

  DA.pages = DA.pages || {};

  /** Right-aligned numeric column; `link` makes the figure a drill-down. */
  function numeric(key, label, options) {
    options = options || {};
    return {
      key: key,
      label: label,
      width: options.width || '110px',
      className: 'is-numeric is-end',
      headerClassName: 'is-end',
      render: options.link
        ? function (row) {
            return el('a', {
              text: row[key] == null ? '-' : row[key],
              attrs: { href: '#detail', 'aria-label': label + ' ' + row[key] }
            });
          }
        : function (row) { return row[key] == null ? '-' : row[key]; }
    };
  }

  /** A figure with an inline edit affordance -- the Adjustments dollar cell. */
  function editableCell(value) {
    return el('span', { className: 'cell-value' }, [
      el('span', { text: value }),
      el('button', {
        className: 'icon-action u-tap-target',
        attrs: { type: 'button', 'aria-label': 'Edit ' + value }
      }, [DA.icons.pencil(13)])
    ]);
  }

  function emptyView(label) {
    return function () {
      return el('div', { className: 'card' }, [
        C.DataTable({
          caption: label,
          embedded: true,
          headerTone: 'warm',
          columns: [{ key: 'name', label: label }],
          rows: [],
          emptyState: el('p', { className: 'table-empty', text: 'No data available.' })
        })
      ]);
    };
  }

  DA.pages.AnalyzerPacketPage = function AnalyzerPacketPage(options) {
    options = options || {};
    var packet = options.packet || {};
    var customer = packet.customerName || '-';
    var scenarios = packet.scenarios || [];

    function withCustomer(text) {
      return String(text).replace('{customer}', customer);
    }

    function asOptions(values) {
      return values.map(function (value) { return { value: value, label: value }; });
    }

    /** The customer's accounts, as the bid and account pickers list them. */
    function accountOptions() {
      return DA.data.filterOptions.accountSuffix.map(function (suffix) {
        return { value: customer + ' ' + suffix, label: customer + ' ' + suffix };
      });
    }

    /* ---- Comparison selector --------------------------------------------- */

    /*
     * The baseline is always part of a comparison. v4 then left every other
     * scenario opt-in, so a two-scenario packet opened onto "Current / - /
     * Change" -- a comparison screen with nothing being compared, and a
     * Change row of dashes. The comparison is the reason the screen exists,
     * so it now opens with one live: baseline plus the next scenario, which
     * is also what the panels below were already showing.
     */
    var chosen = scenarios
      .slice(0, DA.ux && DA.ux.compareByDefault ? 2 : 1)
      .map(function (scenario) { return scenario.name; });
    var pending = chosen.slice();
    var comparisonBand = el('section', { className: 'panel panel--auto' });

    var comparisonSelector = C.Dropdown({
      label: 'Comparison View',
      value: chosen.join(', '),
      content: [
        el('div', {}, scenarios.map(function (scenario) {
          return el('div', { className: 'dropdown__option' }, [
            C.Checkbox({
              checked: pending.indexOf(scenario.name) !== -1,
              label: scenario.name,
              onChange: function (checked) {
                var at = pending.indexOf(scenario.name);
                if (checked && at === -1) pending.push(scenario.name);
                if (!checked && at !== -1) pending.splice(at, 1);
              }
            })
          ]);
        })),
        el('div', { className: 'dropdown__footer' }, [
          C.Button({
            label: 'Apply',
            variant: 'outline',
            shape: 'pill',
            onClick: function () {
              chosen = pending.slice();
              renderComparisonBand();
              comparisonSelector.setValue(chosen.join(', '));
              comparisonSelector.close();
            }
          })
        ])
      ]
    });

    /**
     * One row per chosen scenario, padded to two, then their difference.
     * A recorded difference is used when there is one; otherwise it is derived
     * from the figures shown, which can land a unit off where those are
     * rounded for display.
     */
    function comparisonRows() {
      var figures = DA.data.scenarioFigures;
      var keys = DA.data.comparisonKeys;
      var picked = scenarios.filter(function (scenario) {
        return chosen.indexOf(scenario.name) !== -1;
      });

      var rows = picked.map(function (scenario) {
        var values = figures[scenario.name] || {};
        var row = { scenario: scenario.name };
        keys.forEach(function (key) { row[key] = values[key]; });
        return row;
      });

      while (rows.length < 2) rows.push({ scenario: '-' });

      var difference = { scenario: 'Change', difference: true };
      if (picked.length === 2) {
        var a = figures[picked[0].name] || {};
        var b = figures[picked[1].name] || {};
        var recorded = DA.data.scenarioDifferences[picked[0].name + '|' + picked[1].name];
        keys.forEach(function (key) {
          difference[key] = recorded ? recorded[key] : DA.figures.difference(a[key], b[key]);
        });
      }
      rows.push(difference);
      return rows;
    }

    // The rows behind the band as last rendered -- the driver card reads its
    // figures straight from here rather than recomputing them.
    var bandRows = null;

    /** Up / down / flat, from a figure that may carry $, %, commas or a sign. */
    function deltaDirection(value) {
      var n = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      if (isNaN(n) || n === 0) return 'flat';
      return n > 0 ? 'up' : 'down';
    }

    /**
     * Fills the hovered column's driver card: the baseline figure, the figure
     * it's being compared against, and the recorded change as the "scenario
     * impact" -- the same story the Key Scenario Drivers card tells, scoped to
     * one metric.
     */
    function fillDriverCard(card, key, label) {
      var rows = bandRows || [];
      var base = rows[0] || {};
      var against = rows[1] || {};
      var change = rows[rows.length - 1] || {};
      var hasAgainst = against.scenario && against.scenario !== '-';
      var delta = change[key];

      DA.dom.clear(card);
      card.appendChild(el('p', { className: 'col-driver-card__title', text: label }));

      var flow = el('div', { className: 'col-driver-card__flow' }, [
        el('div', { className: 'col-driver-card__step' }, [
          el('span', { className: 'col-driver-card__scen', text: base.scenario || 'Current' }),
          el('span', { className: 'col-driver-card__val', text: base[key] == null ? '-' : String(base[key]) })
        ])
      ]);
      if (hasAgainst) {
        flow.appendChild(el('span', { className: 'col-driver-card__arrow', text: '→' }));
        flow.appendChild(el('div', { className: 'col-driver-card__step' }, [
          el('span', { className: 'col-driver-card__scen', text: against.scenario }),
          el('span', { className: 'col-driver-card__val', text: against[key] == null ? '-' : String(against[key]) })
        ]));
      }
      card.appendChild(flow);

      if (hasAgainst && delta != null && delta !== '-') {
        var dir = deltaDirection(delta);
        var mark = dir === 'up' ? '▲ ' : dir === 'down' ? '▼ ' : '';
        card.appendChild(el('div', { className: 'col-driver-card__impact' }, [
          el('span', {
            className: 'col-driver-card__delta col-driver-card__delta--' + dir,
            text: mark + String(delta)
          }),
          el('span', { className: 'col-driver-card__impact-label', text: 'Scenario impact' })
        ]));
      } else {
        card.appendChild(el('p', {
          className: 'col-driver-card__hint',
          text: 'Add a scenario to the comparison to see its impact.'
        }));
      }
    }

    /** Sits the card just under the hovered header, clamped inside the band. */
    function positionDriverCard(card, wrap, viewportEl, headerCell) {
      if (!headerCell) { card.hidden = true; return; }
      card.hidden = false;
      var gap = 6;
      var left = headerCell.offsetLeft - viewportEl.scrollLeft;
      var maxLeft = wrap.clientWidth - card.offsetWidth - 8;
      card.style.left = Math.max(8, Math.min(left, Math.max(8, maxLeft))) + 'px';
      card.style.top = (viewportEl.offsetTop + headerCell.offsetHeight + gap) + 'px';
    }

    function renderComparisonBand() {
      bandRows = comparisonRows();

      var wrap = el('div', { className: 'col-compare' });
      var card = el('div', {
        className: 'col-driver-card',
        attrs: { hidden: true, role: 'status', 'aria-live': 'polite' }
      });

      var viewportEl = C.DataTable({
        caption: 'Scenario comparison',
        embedded: true,
        // The band is three rows with nothing to scroll, and the driver card
        // positions itself against this element's own scrollLeft/offsetTop --
        // a frame wrapper would put a different node in its hands.
        framed: false,
        headerTone: 'plain',
        rowClassName: function (row) { return row.difference ? 'is-difference' : ''; },
        columns: [
          { key: 'scenario', label: 'Scenario', width: '150px' },
          numeric('adv', 'ADV'),
          numeric('baseFrtDisc', 'Base Frt Disc'),
          numeric('totalDisc', 'Total Disc'),
          numeric('rpp', 'RPP'),
          numeric('revenue', 'Revenue', { width: '150px' }),
          numeric('or', 'OR'),
          numeric('profit', 'Profit', { width: '130px' })
        ],
        rows: bandRows,
        onColumnHover: function (index, info) {
          if (index == null || !info || !info.column || info.column.key === 'scenario') {
            card.hidden = true;
            return;
          }
          fillDriverCard(card, info.column.key, info.column.label);
          positionDriverCard(card, wrap, viewportEl, info.headerCell);
        }
      });

      wrap.appendChild(card);
      wrap.appendChild(viewportEl);
      DA.dom.clear(comparisonBand).appendChild(wrap);
    }

    /* ---- F6 A: verdict strip ---------------------------------------------- */

    /**
     * States the call, and names the drivers behind it, at rest.
     *
     * The defect this answers: the comparison band presents eight figures and
     * a Change row, and nothing on the screen says whether the scenario is
     * better. The driver detail did exist, but only on hover -- so it could
     * not be read while thinking, printed, or handed to an approver, which is
     * exactly where the analyst's journey ends.
     *
     * Every figure here is read from `bandRows`, the same recorded data the
     * band itself draws. Nothing is recomputed and nothing is invented; the
     * strip only says out loud what the Change row already contains.
     */
    var verdictStrip = el('section', {
      className: 'verdict',
      attrs: { role: 'status', 'aria-live': 'polite', 'aria-label': 'Scenario verdict' }
    });

    // Direction of good, declared per metric rather than taken from the sign.
    var VERDICT_DRIVERS = [
      { key: 'profit', label: 'Profit', favourable: true },
      { key: 'or', label: 'Operating ratio', favourable: false },
      { key: 'totalDisc', label: 'Total discount', favourable: false },
      { key: 'revenue', label: 'Revenue', favourable: true }
    ];

    function tone(value, favourable) {
      var n = DA.figures.toNumber(value);
      if (n == null || n === 0) return 'flat';
      return (favourable ? n > 0 : n < 0) ? 'up' : 'down';
    }

    /** The sentence, from the two movements that decide it. */
    function verdictHeadline(name, change) {
      var profit = tone(change.profit, true);
      var discount = tone(change.totalDisc, false);

      if (profit === 'up') {
        return discount === 'down'
          ? name + ' improves profit, but widens discount'
          : name + ' improves profit without widening discount';
      }
      if (profit === 'down') return name + ' reduces profit against the baseline';
      return name + ' leaves profit materially unchanged';
    }

    function renderVerdict() {
      var rows = bandRows || [];
      var base = rows[0] || {};
      var against = rows[1] || {};
      var change = rows[rows.length - 1] || {};
      var hasAgainst = Boolean(against.scenario && against.scenario !== '-');

      DA.dom.clear(verdictStrip);

      verdictStrip.appendChild(el('div', { className: 'verdict__call' }, [
        el('span', { className: 'verdict__key', text: hasAgainst ? 'Verdict' : 'Baseline' }),
        el('span', {
          className: 'verdict__headline',
          text: hasAgainst
            ? verdictHeadline(against.scenario, change)
            : (base.scenario || 'Current') + ' — no scenario selected to compare against'
        })
      ]));

      VERDICT_DRIVERS.forEach(function (driver) {
        var delta = change[driver.key];
        var moved = hasAgainst && delta != null && delta !== '-';
        var direction = moved ? tone(delta, driver.favourable) : 'flat';
        var mark = moved && direction !== 'flat' ? (DA.figures.toNumber(delta) > 0 ? '▲ ' : '▼ ') : '';

        verdictStrip.appendChild(el('div', { className: 'verdict__driver' }, [
          el('span', { className: 'verdict__key', text: driver.label }),
          el('span', {
            className: 'verdict__value verdict__value--' + direction,
            text: moved ? mark + String(delta) : (base[driver.key] == null ? '-' : String(base[driver.key]))
          }),
          el('span', {
            className: 'verdict__sub',
            text: moved
              ? 'from ' + base[driver.key] + ' · ' + (direction === 'up' ? 'favourable' : direction === 'down' ? 'adverse' : 'no change')
              : 'baseline'
          })
        ]));
      });
    }

    // The band already re-renders on Apply; the verdict follows it, so the
    // sentence can never disagree with the figures underneath it.
    var renderBand = renderComparisonBand;
    renderComparisonBand = function () {
      renderBand();
      if (DA.ux && DA.ux.verdictStrip) renderVerdict();
      // Only once the tab has been opened -- before that there is no matrix
      // to redraw, and building one nobody has looked at costs rows for
      // nothing. The mount is declared further down, so on the very first
      // call (which happens during composition) it is not yet assigned.
      if (DA.ux && DA.ux.interleavedComparison &&
          comparisonMatrixMount && comparisonMatrixMount.firstChild) {
        renderComparisonMatrix();
      }
    };

    renderComparisonBand();

    /* ---- Summary tab ------------------------------------------------------ */

    function summaryColumns() {
      return [
        {
          key: 'label',
          label: 'Cost Basis: FA',
          width: '150px',
          className: 'is-rowhead',
          render: function (row) { return withCustomer(row.label); }
        },
        numeric('adv', 'ADV', { link: true, width: '110px' }),
        numeric('baseFrt', 'Base Frt', { link: true, width: '105px' }),
        numeric('totalDisc', 'Total Disc', { link: true, width: '110px' }),
        numeric('rpp', 'RPP', { link: true, width: '110px' }),
        numeric('annRev', 'Ann Rev', { link: true, width: '140px' })
      ];
    }

    /**
     * Side-by-side scenario summaries share the same column layout, but not
     * necessarily the same rows -- a scenario carrying non-incented revenue
     * (Unincented PLD) adds a top-level row the others don't have, which
     * shifted every row below it out of alignment when this matched by
     * position. Matches by the row-header cell's own label text instead, so
     * "1DA" finds "1DA" in every other panel regardless of what rows come
     * before it or how deep the tree is expanded there. Assumes a label is
     * unique within its own table, true for this single-account demo data;
     * a second account sharing a service code's label would need a richer
     * key than text.
     */
    function summaryComparisonSync() {
      var panels = []; // { viewport, table }
      var enabled = false;
      var suppressScroll = false;

      function clearHighlights(exceptTable) {
        panels.forEach(function (p) {
          if (p.table === exceptTable) return;
          Array.prototype.forEach.call(
            p.table.querySelectorAll('.is-sync-highlight'),
            function (cell) { cell.classList.remove('is-sync-highlight'); }
          );
        });
      }

      function register(viewport) {
        var table = viewport.querySelector('table');
        if (!table) return;
        var entry = { viewport: viewport, table: table };
        panels.push(entry);

        viewport.addEventListener('scroll', function () {
          if (!enabled || suppressScroll) return;
          suppressScroll = true;
          panels.forEach(function (p) {
            if (p !== entry) p.viewport.scrollLeft = viewport.scrollLeft;
          });
          suppressScroll = false;
        });

        table.addEventListener('mouseover', function (event) {
          if (!enabled) return;
          var cell = event.target.closest('td');
          if (!cell || !table.tBodies[0]) return;
          var row = cell.parentElement;
          var cellIndex = Array.prototype.indexOf.call(row.cells, cell);
          var rowHead = row.querySelector('.is-rowhead');
          var rowKey = rowHead && rowHead.textContent.trim();
          if (!rowKey) return;
          panels.forEach(function (p) {
            if (p === entry || !p.table.tBodies[0]) return;
            var otherRow = Array.prototype.find.call(p.table.tBodies[0].rows, function (candidate) {
              var candidateHead = candidate.querySelector('.is-rowhead');
              return candidateHead && candidateHead.textContent.trim() === rowKey;
            });
            var otherCell = otherRow && otherRow.cells[cellIndex];
            if (otherCell) otherCell.classList.add('is-sync-highlight');
          });
        });

        table.addEventListener('mouseout', function (event) {
          if (!enabled || !event.target.closest('td')) return;
          clearHighlights(table);
        });
      }

      var toggle = C.Toggle({
        checked: enabled,
        label: 'Sync scroll & highlight across scenarios',
        onChange: function (checked) {
          enabled = checked;
          if (!checked) clearHighlights(null);
        }
      });

      return { register: register, toggle: toggle };
    }

    /* ---- F2 B: interleaved comparison matrix ------------------------------ */

    /**
     * Merges the per-scenario summary trees into one tree keyed by row label.
     *
     * The defect this replaces: two scenarios rendered as detached tables,
     * 604px wide holding 725px of columns, at 422px and 454px tall -- because
     * one scenario carries a row (Unincented PLD) the other does not, every
     * row below it sat one row out of register with its counterpart. Matching
     * by position cannot work when the row sets differ; matching by label
     * can, and merging on label means there is only ever one row to align.
     *
     * A label absent from a scenario yields no cell for it rather than a
     * shifted one, so the gap stays visible instead of corrupting everything
     * beneath it. Labels are unique within a table in this data set, which is
     * the same assumption the v4 hover-sync already made.
     */
    function mergeSummaryTrees(lists) {
      var order = [];
      var byLabel = {};

      lists.forEach(function (rows, index) {
        (rows || []).forEach(function (row) {
          if (!byLabel[row.label]) {
            byLabel[row.label] = { label: row.label, total: row.total, per: [] };
            order.push(row.label);
          }
          byLabel[row.label].per[index] = row;
        });
      });

      return order.map(function (label) {
        var entry = byLabel[label];
        var childLists = lists.map(function (rows) {
          var match = (rows || []).filter(function (row) { return row.label === label; })[0];
          return match && match.children;
        });
        if (childLists.some(function (kids) { return kids && kids.length; })) {
          entry.children = mergeSummaryTrees(childLists);
        }
        return entry;
      });
    }

    /** Up / down / flat for a delta string, for the semantic colour. */
    function deltaTone(value, favourable) {
      var n = DA.figures.toNumber(value);
      if (n == null || n === 0) return 'flat';
      // Direction of good is declared per metric, not taken from the sign:
      // a rising discount is adverse, a rising revenue is favourable.
      var good = favourable === false ? n < 0 : n > 0;
      return good ? 'up' : 'down';
    }

    /**
     * One column group per metric, holding a column per scenario and -- for a
     * two-scenario comparison -- the delta between them. Rows align by
     * construction, because there is only one row.
     */
    function comparisonMatrixColumns(picked) {
      var metrics = [
        { key: 'adv', label: 'ADV', width: '100px', favourable: true },
        { key: 'baseFrt', label: 'Base Frt', width: '100px', favourable: false },
        { key: 'totalDisc', label: 'Total Disc', width: '105px', favourable: false },
        { key: 'rpp', label: 'RPP', width: '105px', favourable: true },
        { key: 'annRev', label: 'Ann Rev', width: '140px', favourable: true }
      ];

      var columns = [{
        key: 'label',
        label: 'Cost Basis: FA',
        width: '190px',
        className: 'is-rowhead',
        render: function (row) { return withCustomer(row.label); }
      }];

      metrics.forEach(function (metric) {
        picked.forEach(function (scenario, index) {
          columns.push({
            key: metric.key + ':' + index,
            label: metric.label,
            width: metric.width,
            className: 'is-numeric is-end' + (index === 0 ? ' compare-matrix__group' : ''),
            headerClassName: 'is-end' + (index === 0 ? ' compare-matrix__group' : ''),
            renderHeader: function () {
              return el('span', {}, [
                el('span', { text: metric.label }),
                el('span', { className: 'compare-matrix__scen', text: scenario.name })
              ]);
            },
            render: function (row) {
              var source = row.per && row.per[index];
              return source && source[metric.key] != null ? source[metric.key] : '-';
            }
          });
        });

        if (picked.length === 2) {
          columns.push({
            key: metric.key + ':delta',
            label: 'Change',
            width: '105px',
            className: 'is-numeric is-end compare-delta',
            headerClassName: 'is-end',
            renderHeader: function () {
              return el('span', {}, [
                el('span', { text: 'Δ' }),
                el('span', { className: 'compare-matrix__scen', text: 'Change' })
              ]);
            },
            render: function (row) {
              var a = row.per && row.per[0];
              var b = row.per && row.per[1];
              if (!a || !b) return el('span', { className: 'compare-delta--flat', text: '-' });
              var value = DA.figures.difference(a[metric.key], b[metric.key]);
              return el('span', {
                className: 'compare-delta--' + deltaTone(value, metric.favourable),
                text: value
              });
            }
          });
        }
      });

      return columns;
    }

    /*
     * The matrix reads the same selection the comparison band does.
     *
     * In v4 the Comparison View dropdown drove the band while the panels
     * below mapped over *all* scenarios, so deselecting a scenario changed
     * the top of the screen and nothing else -- the page contradicted itself.
     * Applying a selection now redraws both from one source of truth.
     */
    var comparisonMatrixMount = el('div');

    function pickedScenarios() {
      var trees = DA.data.packetSummaryTrees;
      var picked = scenarios.filter(function (scenario) {
        return chosen.indexOf(scenario.name) !== -1;
      });
      if (!picked.length) picked = scenarios.slice(0, 1);
      return picked.map(function (scenario) {
        return { name: scenario.name, rows: trees[scenario.name] || trees.Current };
      });
    }

    function renderComparisonMatrix() {
      DA.dom.clear(comparisonMatrixMount).appendChild(comparisonMatrixView(pickedScenarios()));
    }

    function comparisonMatrixView(picked) {
      var rows = mergeSummaryTrees(picked.map(function (entry) { return entry.rows; }));

      return el('div', { className: 'card' }, [
        C.DataTable({
          caption: 'Scenario comparison by line item',
          embedded: true,
          headerTone: 'warm',
          tinted: true,
          // Parent, then the label column, are what identify a row across a
          // wide set of metric groups -- frozen so they never leave.
          freezeColumns: 1,
          expandKey: 'label',
          getChildren: function (row) { return row.children; },
          columns: comparisonMatrixColumns(picked),
          rows: rows
        })
      ]);
    }

    function summaryView() {
      if (DA.ux && DA.ux.interleavedComparison) {
        renderComparisonMatrix();
        return comparisonMatrixMount;
      }

      var trees = DA.data.packetSummaryTrees;
      var sync = summaryComparisonSync();

      var grid = el('div', { className: 'comparison-grid' },
        scenarios.map(function (scenario) {
          var rows = trees[scenario.name] || trees.Current;
          var table = C.DataTable({
            caption: scenario.name + ' summary',
            embedded: true,
            headerTone: 'warm',
            expandKey: 'label',
            getChildren: function (row) { return row.children; },
            columns: summaryColumns(),
            rows: rows
          });
          sync.register(table);
          return C.Accordion({
            title: scenario.name,
            expanded: true,
            className: 'accordion--filled',
            content: [table]
          });
        })
      );

      return el('div', {}, [
        el('div', { className: 'comparison-sync-toggle' }, [sync.toggle]),
        grid
      ]);
    }

    /* ---- Shipping Profiles tab -------------------------------------------- */

    function profileFilters() {
      return el('div', { className: 'card' }, [
        el('div', { className: 'view-filters' }, [
          el('div', { className: 'view-filters__field' }, [
            C.SelectField({
              label: 'Choose Scenario',
              value: scenarios[0] && scenarios[0].name,
              options: scenarios.map(function (scenario) {
                return { value: scenario.name, label: scenario.name };
              })
            })
          ]),
          el('span', { className: 'view-filters__divider' }),
          el('div', { className: 'view-filters__field' }, [
            C.SelectField({
              label: 'Account',
              value: customer + ' MAIN',
              options: accountOptions()
            })
          ]),
          C.Button({ label: 'Filters', variant: 'ghost', icon: DA.icons.filter(16) })
        ])
      ]);
    }

    /** The lane key every shipping profile view opens with: Movement, Mode and
     * (the raw) Core Service joined into one Core Service label column. */
    function profileKeyColumns() {
      return [
        {
          key: 'coreService',
          label: 'Core Service',
          width: '220px',
          className: 'is-rowhead',
          render: function (row) { return [row.movement, row.mode, row.service].join('-'); }
        },
        numeric('zone', 'Zone', { width: '85px' }),
        numeric('lane', 'Lane', { width: '85px' })
      ];
    }

    function profileTable(options) {
      return el('div', {}, [
        profileFilters(),
        el('div', { className: 'card' }, [
          C.DataTable({
            caption: options.caption,
            embedded: true,
            headerTone: 'warm',
            tinted: true,
            expandKey: 'coreService',
            // Core Service, Zone and Lane together identify the row -- frozen
            // as a group, so a 2,640px-wide grid never loses which lane it is
            // showing. Each carries an explicit width, which is what a sticky
            // column's left offset is summed from.
            freezeColumns: 3,
            // A lane opens onto the zones it shipped in.
            getChildren: function (row) {
              if (row.zone !== '-') return null;
              return DA.data.zoneBreakdown(row, 'service', DA.data.additive[options.additive]);
            },
            columns: profileKeyColumns().concat(options.columns),
            rows: options.rows
          })
        ])
      ]);
    }

    /** Filter row for the pricing term views. */
    function pricingFilters() {
      return el('div', { className: 'card' }, [
        el('div', { className: 'view-filters' }, [
          el('div', { className: 'view-filters__field' }, [
            C.SelectField({
              label: 'Choose Scenario',
              value: scenarios[scenarios.length - 1] && scenarios[scenarios.length - 1].name,
              options: scenarios.map(function (scenario) {
                return { value: scenario.name, label: scenario.name };
              })
            })
          ]),
          el('div', { className: 'view-filters__field' }, [
            C.SelectField({
              label: 'Choose Bid',
              value: customer + ' MAIN',
              options: accountOptions()
            })
          ]),
          C.Button({
            label: 'Reset',
            variant: 'ghost',
            icon: DA.icons.refresh(15),
            iconPosition: 'end'
          }),
          el('span', { className: 'view-filters__divider' }),
          C.Button({
            label: 'Define Bid Structure',
            variant: 'ghost',
            icon: DA.icons.chevronRight(14, ''),
            iconPosition: 'end'
          })
        ])
      ]);
    }

    function costView() {
      return profileTable({
        caption: 'Shipping profile cost',
        additive: 'cost',
        rows: DA.data.shippingProfileCost,
        columns: [
          numeric('volume', 'Volume', { link: true, width: '110px' }),
          numeric('adv', 'ADV', { link: true, width: '100px' }),
          numeric('pps', 'PPS', { link: true, width: '80px' }),
          numeric('weightPiece', 'Weight/ Piece', { link: true, width: '120px' }),
          numeric('avgCube', 'Avg Cube', { link: true, width: '105px' }),
          numeric('avgCubeFactor', 'Avg Cube Factor', { link: true, width: '145px' }),
          numeric('puDens', 'PU Dens', { link: true, width: '105px' }),
          numeric('dlDens', 'DL Dens', { link: true, width: '105px' }),
          numeric('pu', 'PU', { link: true, width: '90px' }),
          numeric('ls', 'LS', { link: true, width: '90px' }),
          numeric('cs', 'CS', { link: true, width: '90px' }),
          numeric('ar', 'AR', { link: true, width: '90px' }),
          numeric('jf', 'JF', { link: true, width: '95px' }),
          numeric('gf', 'GF', { link: true, width: '90px' }),
          numeric('br', 'BR', { link: true, width: '90px' }),
          numeric('pd', 'PD', { link: true, width: '90px' }),
          numeric('dl', 'DL', { link: true, width: '90px' }),
          numeric('no', 'NO', { link: true, width: '90px' }),
          numeric('oth', 'OTH', { link: true, width: '95px' }),
          numeric('totalFreightCost', 'Total Freight Cost', { link: true, width: '160px' }),
          numeric('costAdj', 'Cost Adj', { width: '105px' }),
          numeric('newCost', 'New Cost', { link: true, width: '115px' })
        ]
      });
    }

    function zoneView() {
      return profileTable({
        caption: 'Shipping profile zones',
        additive: 'zone',
        rows: DA.data.shippingProfileZone,
        columns: [
          numeric('volume', 'Volume', { link: true, width: '110px' }),
          numeric('adv', 'ADV', { link: true, width: '100px' }),
          numeric('pps', 'PPS', { link: true, width: '80px' }),
          numeric('weightPiece', 'Weight/Piece', { link: true, width: '125px' }),
          numeric('freightGrossSpent', 'Freight Gross Spent', { link: true, width: '175px' }),
          numeric('freightDiscount', 'Freight Discount (%)', { link: true, width: '175px' }),
          numeric('freightRpp', 'Freight RPP', { link: true, width: '125px' }),
          numeric('freightNetSpent', 'Freight Net Spent', { link: true, width: '165px' }),
          numeric('freightProfit', 'Freight Profit ($)', { link: true, width: '160px' }),
          numeric('freightOr', 'Freight OR', { link: true, width: '120px' })
        ]
      });
    }

    function accessorialView() {
      function labelColumn(key, label, width, spanRepeats) {
        return {
          key: key,
          label: label,
          width: width || '135px',
          className: 'is-rowhead',
          spanRepeats: spanRepeats
        };
      }

      return el('div', {}, [
        profileFilters(),
        el('div', { className: 'card' }, [
          C.DataTable({
            caption: 'Accessorial charges',
            embedded: true,
            headerTone: 'warm',
            tinted: true,
            expandKey: 'detail',
            getChildren: function (row) { return row.children; },
            columns: [
              // Accessorial Type and Group repeat the same value down every
              // row a charge breaks into -- the children carry it blank
              // rather than restate it, so it reads as one merged field.
              labelColumn('type', 'Accessorial Type', null, true),
              labelColumn('group', 'Group', null, true),
              labelColumn('detail', 'Detail', '235px'),
              numeric('totalUnits', 'Total Units', { link: true, width: '120px' }),
              numeric('pctTotalVolume', '% Total Volume', { link: true, width: '150px' }),
              numeric('adu', 'ADU', { link: true, width: '110px' }),
              numeric('grossRevenue', 'Gross Revenue', { link: true, width: '150px' }),
              numeric('netRevenue', 'Net Revenue', { link: true, width: '145px' }),
              numeric('discount', 'Discount', { link: true, width: '110px' })
            ],
            rows: DA.data.shippingProfileAccessorial
          })
        ])
      ]);
    }

    function serviceView() {
      return el('div', {}, [
        profileFilters(),
        el('div', { className: 'card' }, [
          C.DataTable({
            caption: 'Shipping profile services',
            embedded: true,
            headerTone: 'warm',
            tinted: true,
            expandKey: 'service',
            getChildren: function (row) {
              return DA.data.zoneBreakdown(row, 'service', DA.data.additive.service);
            },
            columns: [
              { key: 'service', label: 'Core Service', width: '250px', className: 'is-rowhead' },
              numeric('volume', 'Volume', { link: true, width: '95px' }),
              numeric('adv', 'ADV', { link: true, width: '80px' }),
              numeric('avgZone', 'Avg Zone', { link: true, width: '100px' }),
              numeric('billableWt', 'Billable Wt', { link: true, width: '105px' }),
              numeric('pps', 'PPS', { link: true, width: '80px' }),
              numeric('baseGrossRev', 'Base Gross Rev', { link: true, width: '135px' }),
              numeric('baseNetRev', 'Base Net Rev', { link: true, width: '125px' }),
              numeric('disc', 'Disc', { width: '85px' }),
              numeric('baseRpp', 'Base RPP', { link: true, width: '105px' }),
              numeric('baseProfit', 'Base Profit', { link: true, width: '110px' }),
              numeric('baseOr', 'Base OR', { width: '95px' })
            ],
            rows: DA.data.packetServices
          })
        ])
      ]);
    }

    function accountsView() {
      function labelColumn(key, label, width, render, spanRepeats) {
        return {
          key: key,
          label: label,
          width: width || '160px',
          className: 'is-rowhead',
          render: render,
          spanRepeats: spanRepeats
        };
      }

      return el('div', {}, [
        profileFilters(),
        el('div', { className: 'card' }, [
          C.DataTable({
            caption: 'Accounts',
            embedded: true,
            headerTone: 'warm',
            tinted: true,
            expandKey: 'accountNumber',
            // Parent, Sub Parent and Account Number together identify the
            // record -- frozen as a group, the same treatment Movement/
            // Mode/Core Service gets.
            freezeColumns: 3,
            getChildren: function (row) { return row.children; },
            columns: [
              // Parent and Sub Parent repeat down every account under
              // them, left blank on the children the same way Accessorial
              // Type/Group are -- one merged field, not a fresh blank cell.
              labelColumn('parent', 'Parent', '170px', function (row) {
                return row.parent ? withCustomer(row.parent) : '';
              }, true),
              labelColumn('subParent', 'Sub Parent', '150px', null, true),
              labelColumn('accountNumber', 'Account Number', '170px'),
              numeric('volume', 'Volume', { link: true, width: '110px' }),
              numeric('adv', 'ADV', { link: true, width: '100px' }),
              numeric('zone', 'Zone', { link: true, width: '90px' })
            ],
            rows: DA.data.packetAccounts
          })
        ])
      ]);
    }

    function weightCubeView() {
      return el('div', {}, [
        profileFilters(),
        el('div', { className: 'card' }, [
          C.DataTable({
            caption: 'Weight and cube',
            embedded: true,
            headerTone: 'warm',
            tinted: true,
            expandKey: 'service',
            // A service opens onto the billable weight tiers behind it.
            getChildren: function (row) {
              return DA.data.weightBreakdown(row, 'service', DA.data.additive.service);
            },
            columns: [
              { key: 'service', label: 'Core Service', width: '220px', className: 'is-rowhead' },
              { key: 'billable', label: 'Billable', width: '85px', className: 'is-numeric is-end' },
              numeric('volume', 'Volume', { link: true, width: '95px' }),
              numeric('adv', 'ADV', { link: true, width: '80px' }),
              numeric('pps', 'PPS', { link: true, width: '80px' }),
              numeric('weightPiece', 'Weight/Piece', { link: true, width: '120px' }),
              numeric('baseGrossRev', 'Base Gross Rev', { link: true, width: '135px' }),
              numeric('baseNetRev', 'Base Net Rev', { link: true, width: '125px' }),
              numeric('baseDisc', 'Base Disc', { width: '100px' }),
              numeric('baseRpp', 'Base RPP', { link: true, width: '105px' }),
              numeric('baseProfit', 'Base Profit', { link: true, width: '110px' }),
              numeric('baseOr', 'Base OR', { width: '95px' })
            ],
            rows: DA.data.packetWeightCube
          })
        ])
      ]);
    }

    /** Filter row shared by Adjustments and Other Terms: scenario and bid pickers plus Reset. */
    function scenarioBidFilters() {
      return el('div', { className: 'card' }, [
        el('div', { className: 'view-filters' }, [
          el('div', { className: 'view-filters__field' }, [
            C.SelectField({
              label: 'Choose Scenario',
              value: scenarios[0] && scenarios[0].name,
              options: scenarios.map(function (scenario) {
                return { value: scenario.name, label: scenario.name };
              })
            })
          ]),
          el('div', { className: 'view-filters__field' }, [
            C.SelectField({
              label: 'Choose Bid',
              value: customer + ' MAIN',
              options: accountOptions()
            })
          ]),
          C.Button({
            label: 'Reset',
            variant: 'ghost',
            icon: DA.icons.refresh(15),
            iconPosition: 'end'
          })
        ])
      ]);
    }

    /** Label column shared by the flat (non-expanding) rate/adjustment tables. */
    function flatLabelColumn(key, label, width) {
      return { key: key, label: label, width: width || '150px', className: 'is-rowhead' };
    }

    /** Filter row above a Rate Charts panel: bid and service group pickers, Export. */
    function rateChartPanelFilters() {
      var bid = 'P310041099 (SP- Stampin Up)';
      var serviceGroup = 'UPS E-Standard to Canada';
      return el('div', { className: 'card' }, [
        el('div', { className: 'view-filters' }, [
          el('div', { className: 'view-filters__field' }, [
            C.SelectField({ label: 'Choose Bid', value: bid, options: [{ value: bid, label: bid }] })
          ]),
          el('div', { className: 'view-filters__field' }, [
            C.SelectField({
              label: 'Choose Service Group',
              value: serviceGroup,
              options: [{ value: serviceGroup, label: serviceGroup }]
            })
          ]),
          C.Button({ label: 'Export', variant: 'ghost', icon: DA.icons.download(16) })
        ])
      ]);
    }

    /**
     * One scenario's rate grid: zones across, weight tiers down, a $ figure
     * per cell -- the same 2-row-header shape servicePlan()'s own weight
     * break grid uses (a merged corner label over two matrix__rowhead
     * columns, zone/weight-break headers spanning both header rows).
     * Net is the only basis with reference data; Gross and Volume show the
     * table's own empty state rather than invented figures.
     */
    function rateChartGrid(scenario, basis) {
      var data = DA.data.rateChartGrid;
      var zones = data.zones;

      if (basis !== 'net') {
        return el('p', { className: 'table-empty', text: 'No data available.' });
      }

      var head = el('thead', {}, [
        el('tr', {}, [
          el('th', { className: 'matrix__rowhead', attrs: { scope: 'col', colspan: 2 }, text: 'Zones' })
        ].concat(zones.map(function (zone) {
          return el('th', { attrs: { scope: 'col', rowspan: 2 }, text: zone });
        }))),
        el('tr', {}, [
          el('th', { className: 'matrix__rowhead', attrs: { scope: 'col', colspan: 2 }, text: 'Weight' })
        ])
      ]);

      var body = el('tbody', {}, data.rows.map(function (row) {
        return el('tr', {}, [
          el('th', { className: 'matrix__rowhead', attrs: { scope: 'row' } }),
          el('td', { className: 'matrix__rowhead', text: row.weight })
        ].concat(row.net.map(function (rate) {
          // A plain <a> here, same as every other report table's linked
          // figure -- it's what makes the value read as link-blue and
          // pick up the hover highlight, both for free from the base `a`
          // rule rather than a one-off color/hover rule just for this cell.
          return el('td', { className: 'matrix__cell' }, [
            el('a', { text: rate, attrs: { href: '#rate-detail', 'aria-label': 'Rate ' + rate } })
          ]);
        })));
      }));

      return el('div', { className: 'grid-scroll scroll-area' }, [
        el('table', { className: 'matrix' }, [
          el('caption', { className: 'u-visually-hidden', text: scenario.name + ' rate chart' }),
          head,
          body
        ])
      ]);
    }

    function rateChartPanel(scenario) {
      var basis = 'net';
      var gridMount = el('div', {});

      function renderGrid() {
        DA.dom.clear(gridMount).appendChild(rateChartGrid(scenario, basis));
      }
      renderGrid();

      return el('div', {}, [
        rateChartPanelFilters(),
        el('div', { className: 'card' }, [
          el('div', { className: 'card__body' }, [
            el('p', { className: 'section-title', style: { margin: 0 }, text: scenario.name })
          ])
        ]),
        el('div', { className: 'card' }, [
          el('div', { className: 'card__body' }, [
            C.RadioGroup({
              ariaLabel: 'Rate basis for ' + scenario.name,
              name: 'rate-basis-' + scenario.number,
              value: basis,
              items: [
                { value: 'net', label: 'Net' },
                { value: 'gross', label: 'Gross' },
                { value: 'volume', label: 'Volume' }
              ],
              onChange: function (value) { basis = value; renderGrid(); }
            }),
            el('div', { style: { 'margin-top': 'var(--space-4)' } }, [gridMount])
          ])
        ])
      ]);
    }

    /** Rate Charts: one panel per scenario, side by side. */
    function rateChartsView() {
      return el('div', { className: 'comparison-grid' },
        scenarios.map(function (scenario) { return rateChartPanel(scenario); })
      );
    }

    /**
     * A single, packet-wide dollar adjustment -- not one per lane the way
     * the reference screen this replaced first suggested. One row, one
     * editable figure.
     */
    function adjustmentsView() {
      return el('div', {}, [
        scenarioBidFilters(),
        el('div', { className: 'card' }, [
          C.DataTable({
            caption: 'Adjustments',
            embedded: true,
            headerTone: 'warm',
            columns: [
              {
                key: 'amount',
                label: 'Dollar Amount',
                width: '330px',
                render: function (row) { return editableCell(row.amount); }
              }
            ],
            rows: [{ amount: '$0' }]
          }),
          el('div', { className: 'grid-footer' }, [
            el('a', { className: 'link-with-icon', attrs: { href: '#save-changes' } }, [
              DA.icons.save(15),
              el('span', { text: 'Save Changes' })
            ])
          ])
        ]),
        el('div', { className: 'page-actions page-actions--wide' }, [
          C.Button({
            label: 'Update Analyzer Packet',
            variant: 'primary',
            shape: 'pill',
            icon: DA.icons.chevronRight(14, ''),
            iconPosition: 'end',
            disabled: true
          })
        ])
      ]);
    }

    /** Other Terms > Dim Divisor: the DIM weight divisor set per service. */
    function dimDivisorView() {
      return el('div', {}, [
        scenarioBidFilters(),
        el('div', { className: 'card' }, [
          el('div', { style: { padding: 'var(--space-4)' } }, [
            C.Button({ label: 'Add Service', variant: 'secondary', icon: DA.icons.plusCircle(16) })
          ]),
          C.DataTable({
            caption: 'Dim divisor',
            embedded: true,
            headerTone: 'warm',
            tinted: true,
            freezeColumns: 3,
            columns: [
              flatLabelColumn('movement', 'Movement', '120px'),
              flatLabelColumn('mode', 'Mode', '110px'),
              flatLabelColumn('serviceGroup', 'Service Group', '190px'),
              { key: 'incentiveType', label: 'Incentive Type', width: '150px' },
              {
                key: 'incentiveAmount',
                label: 'Incentive Amount',
                width: '160px',
                // The threshold bands behind the divisor code live in the
                // Details dialog, not as a flat figure on this row.
                render: function (row) {
                  return el('a', {
                    className: 'link-with-icon',
                    attrs: { href: '#structure-details-' + row.serviceGroup },
                    on: {
                      click: function (event) {
                        event.preventDefault();
                        DA.dialogs.DimDivisorDetailsDialog(row).open();
                      }
                    }
                  }, [el('span', { text: 'Structure Details' }), DA.icons.chevronRight(14, '')]);
                }
              },
              {
                key: 'remove',
                label: '',
                width: '56px',
                render: function () {
                  return el('button', {
                    className: 'icon-action icon-action--danger u-tap-target',
                    attrs: { type: 'button', 'aria-label': 'Remove service' }
                  }, [DA.icons.trash(14)]);
                }
              }
            ],
            rows: DA.data.packetDimDivisor
          })
        ])
      ]);
    }

    /**
     * Other Terms: Dim Divisor is built; Published Fuel Surcharge has no
     * reference screen yet.
     */
    function otherTermsView() {
      return el('div', { className: 'tabs--boxed' }, [
        C.Tabs({
          ariaLabel: 'Other term views',
          value: 'dim-divisor',
          items: [
            { id: 'dim-divisor', label: 'Dim Divisor', render: dimDivisorView },
            {
              id: 'published-fuel-surcharge',
              label: 'Published Fuel Surcharge',
              render: emptyView('Published Fuel Surcharge')
            }
          ]
        })
      ]);
    }

    /**
     * The merged "Analyzer" tab: Comparisons (the former standalone Summary
     * tab's content, unchanged) alongside the shipping-profile views, all as
     * one set of sub-tabs rather than two separate top-level tabs. Every
     * sub-tab's underlying content and data is exactly what it was before --
     * only the menu structure and labels moved, matching the reference menu.
     */
    function analyzerView() {
      return el('div', { className: 'tabs--boxed' }, [
        C.Tabs({
          ariaLabel: 'Analyzer views',
          value: 'comparisons',
          items: [
            { id: 'comparisons', label: 'Comparisons', render: summaryView },
            { id: 'services', label: 'Services', render: serviceView },
            { id: 'charges', label: 'Charges', render: accessorialView },
            { id: 'accounts', label: 'Accounts', render: accountsView },
            { id: 'cost-details', label: 'Cost Details', render: costView },
            { id: 'zones', label: 'Zones', render: zoneView },
            { id: 'weight-cube', label: 'Weight & Cube', render: weightCubeView }
          ]
        })
      ]);
    }

    /* ---- Composition ------------------------------------------------------ */

    var page = el('main', { className: 'page', attrs: { id: 'main-content' } }, [
      C.Breadcrumb({
        separator: '/',
        items: [
          { label: 'My Analyzers', onClick: options.onExit },
          { label: 'Packet' }
        ]
      }),
      el('div', { className: 'record-header' }, [
        el('h2', {
          className: 'record-header__title title-rule title-rule--full',
          text: customer
        }),
        el('div', { className: 'record-header__meta' }, [
          el('span', { className: 'badge badge--success', text: packet.industry || '-' }),
          el('span', { text: 'Sub Industry : ' + (packet.subIndustry || '-') }),
          el('span', { className: 'meta-divider' }),
          el('span', { text: packet.referenceNumber || '-' }),
          el('span', { className: 'meta-divider' }),
          el('span', { text: 'Analyzer Packet: ' + (packet.packetId || '-') })
        ])
      ]),
      el('div', { className: 'page-back' }, [
        C.Button({
          label: 'Back to Scenarios',
          variant: 'link',
          icon: DA.icons.chevronLeft(14),
          onClick: function () { if (options.onBack) options.onBack(); }
        })
      ]),
      el('div', { className: 'report-filters' }, [
        el('div', { className: 'report-filters__field' }, [comparisonSelector]),
        el('div', { className: 'report-filters__field' }, [
          C.SelectField({ label: 'Revenue Basis', value: 'All', options: asOptions(DA.data.filterOptions.revenueBasis) })
        ]),
        el('div', { className: 'report-filters__field' }, [
          C.SelectField({
            label: 'Cost Basis',
            value: 'Fully Allocated Cost',
            options: asOptions(DA.data.filterOptions.costBasis)
          })
        ]),
        el('div', { className: 'report-filters__actions' }, [
          C.Button({
            label: 'Reset',
            variant: 'outline',
            shape: 'pill',
            icon: DA.icons.refresh(15),
            iconPosition: 'end'
          })
        ])
      ]),
      DA.ux && DA.ux.verdictStrip ? verdictStrip : null,
      comparisonBand,
      el('div', { className: 'tabs--page' }, [
        C.Tabs({
          ariaLabel: 'Report sections',
          value: 'analyzer',
          items: [
            { id: 'analyzer', label: 'Analyzer', render: function () {
              return el('section', { className: 'panel panel--auto' }, [
                el('div', { className: 'panel__content' }, [analyzerView()])
              ]);
            } },
            { id: 'pricing-terms', label: 'Pricing Terms', render: function () {
              return el('section', { className: 'panel panel--auto' }, [
                el('div', { className: 'panel__content' }, [
                  DA.views.PricingTerms({
                    packet: packet,
                    numeric: numeric,
                    filters: pricingFilters,
                    emptyView: emptyView
                  })
                ])
              ]);
            } },
            { id: 'other-terms', label: 'Other Terms', render: otherTermsView },
            { id: 'adjustments', label: 'Adjustments', render: adjustmentsView },
            { id: 'rate-charts', label: 'Rate Charts', render: rateChartsView }
          ]
        })
      ])
    ]);

    return page;
  };
})(window.DA);
