/**
 * The lever views outside Pricing Terms: Other Terms, Adjustments and Rate
 * Charts.
 *
 * These three were top-level tabs in v4/v5 and had no home when the packet
 * screen was rebuilt around Impact / Levers / Evidence -- an omission, not a
 * decision. They belong in Levers, because the product's division is not by
 * subject but by whether the analyst is *changing* something:
 *
 *   ANALYZER  -> Impact and Evidence. Read-only: figures to look at.
 *   EVERYTHING ELSE -> Levers. The contract terms the analyst sets.
 *
 * So Levers now carries the four editable tabs v4 had -- Pricing Terms, Other
 * Terms, Adjustments, Rate Charts -- and their editable cells go through
 * EditableValue into the dock's change set, the same as the pricing levers.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  var C = DA.components;
  DA.workspace = DA.workspace || {};

  /** Scenario and bid pickers shared by Adjustments and Other Terms. */
  function scenarioBidFilters(ctx) {
    var scenarios = ctx.scenarios;
    var customer = (ctx.packet && ctx.packet.customerName) || '-';
    return el('div', { className: 'card' }, [
      el('div', { className: 'view-filters' }, [
        el('div', { className: 'view-filters__field' }, [
          C.SelectField({
            label: 'Choose Scenario',
            value: ctx.reference().name,
            options: scenarios.map(function (s) { return { value: s.name, label: s.name }; })
          })
        ]),
        el('div', { className: 'view-filters__field' }, [
          C.SelectField({
            label: 'Choose Bid',
            value: customer + ' MAIN',
            options: DA.data.filterOptions.accountSuffix.map(function (suffix) {
              return { value: customer + ' ' + suffix, label: customer + ' ' + suffix };
            })
          })
        ]),
        C.Button({
          label: 'Reset', variant: 'ghost',
          icon: DA.icons.refresh(15), iconPosition: 'end'
        })
      ])
    ]);
  }

  function flatLabelColumn(key, label, width) {
    return { key: key, label: label, width: width || '150px', className: 'is-rowhead' };
  }

  function emptyView(label) {
    return el('div', { className: 'card' }, [
      C.DataTable({
        caption: label, embedded: true, headerTone: 'warm',
        columns: [{ key: 'name', label: label }], rows: [],
        emptyState: el('p', { className: 'table-empty', text: 'No data available.' })
      })
    ]);
  }

  /** A cell the analyst can change, reporting into the dock's change set. */
  function editable(ctx, value, record) {
    var cell = C.EditableValue({
      value: value,
      label: record.label,
      onCommit: function (next, previous) {
        if (record.set) record.set(next);
        if (ctx.recordChange) {
          ctx.recordChange({
            id: record.id,
            label: record.label + ' ' + previous + ' → ' + next,
            before: previous,
            after: next,
            /*
             * Discard has to undo both halves: the write to the data, and the
             * cell the analyst is looking at. Writing only the data left the
             * dock cleared while every edited figure still read its new value,
             * because these panes are kept alive and never re-render.
             */
            revert: function () {
              if (record.set) record.set(previous);
              if (cell.setValue) cell.setValue(previous);
            }
          });
        }
      }
    });

    return cell;
  }

  DA.workspace.leverEditable = editable;

  /* ---- Adjustments ------------------------------------------------------- */

  /**
   * A single, packet-wide dollar adjustment. One row, one editable figure --
   * which in v4 carried a pencil that did nothing.
   */
  function adjustmentsView(ctx) {
    ctx.adjustment = ctx.adjustment || { amount: '$0' };
    var row = ctx.adjustment;

    return el('div', {}, [
      scenarioBidFilters(ctx),
      el('div', { className: 'card' }, [
        C.DataTable({
          caption: 'Adjustments',
          embedded: true,
          headerTone: 'warm',
          framed: false,
          columns: [{
            key: 'amount', label: 'Dollar Amount', width: '330px',
            render: function (r) {
              return editable(ctx, r.amount, {
                id: 'adjustment:amount',
                label: 'Packet adjustment',
                set: function (next) { r.amount = next; }
              });
            }
          }],
          rows: [row]
        })
      ])
    ]);
  }

  /* ---- Other Terms > Dim Divisor ----------------------------------------- */

  function dimDivisorView(ctx) {
    return el('div', {}, [
      scenarioBidFilters(ctx),
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
            {
              key: 'incentiveType', label: 'Incentive Type', width: '160px',
              render: function (row) {
                return editable(ctx, row.incentiveType, {
                  id: 'dim:' + row.serviceGroup + ':type',
                  label: row.serviceGroup + ' incentive type',
                  set: function (next) { row.incentiveType = next; }
                });
              }
            },
            {
              key: 'incentiveAmount', label: 'Incentive Amount', width: '175px',
              // The threshold bands behind the divisor code live in the
              // Details dialog, not as a flat figure on this row.
              render: function (row) {
                return el('a', {
                  className: 'link-with-icon',
                  attrs: { href: '#structure-details-' + row.serviceGroup },
                  on: {
                    click: function (event) {
                      event.preventDefault();
                      DA.dialogs.DimDivisorDetailsDialog(row, ctx).open();
                    }
                  }
                }, [el('span', { text: 'Structure Details' }), DA.icons.chevronRight(14, '')]);
              }
            },
            {
              key: 'remove', label: '', width: '56px',
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

  function otherTermsView(ctx) {
    return el('div', { className: 'tabs--boxed tabs--sub' }, [
      C.Tabs({
        ariaLabel: 'Other term views',
        value: 'dim-divisor',
        items: [
          { id: 'dim-divisor', label: 'Dim Divisor', render: function () { return dimDivisorView(ctx); } },
          {
            id: 'published-fuel-surcharge', label: 'Published Fuel Surcharge',
            render: function () { return emptyView('Published Fuel Surcharge'); }
          }
        ]
      })
    ]);
  }

  /* ---- Rate Charts -------------------------------------------------------- */

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
            label: 'Choose Service Group', value: serviceGroup,
            options: [{ value: serviceGroup, label: serviceGroup }]
          })
        ]),
        C.Button({ label: 'Export', variant: 'ghost', icon: DA.icons.download(16) })
      ])
    ]);
  }

  /**
   * One scenario's rate grid: zones across, weight tiers down.
   *
   * The rate cells are editable -- this is a contract term the analyst sets,
   * not a figure to read. Net is the only basis the data set records; Gross
   * and Volume show the table's own empty state rather than invented figures.
   */
  function rateChartGrid(ctx, scenario, basis) {
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

    var body = el('tbody', {}, data.rows.map(function (row, rowIndex) {
      return el('tr', {}, [
        el('th', { className: 'matrix__rowhead', attrs: { scope: 'row' } }),
        el('td', { className: 'matrix__rowhead', text: row.weight })
      ].concat(row.net.map(function (rate, zoneIndex) {
        return el('td', { className: 'matrix__cell' }, [
          editable(ctx, rate, {
            id: 'rate:' + scenario.name + ':' + rowIndex + ':' + zones[zoneIndex],
            label: scenario.name + ' rate, weight ' + row.weight + ' zone ' + zones[zoneIndex],
            set: function (next) { row.net[zoneIndex] = next; }
          })
        ]);
      })));
    }));

    var table = el('table', { className: 'matrix' }, [
      el('caption', { className: 'u-visually-hidden', text: scenario.name + ' rate chart' }),
      head,
      body
    ]);

    var host = el('div', { className: 'grid-scroll scroll-area' }, [table]);
    if (DA.workspace.pinMatrixKeys) DA.workspace.pinMatrixKeys(host, table);
    return host;
  }

  function rateChartPanel(ctx, scenario) {
    var basis = 'net';
    var gridMount = el('div', {});

    function renderGrid() {
      DA.dom.clear(gridMount).appendChild(rateChartGrid(ctx, scenario, basis));
    }
    renderGrid();

    return el('div', {}, [
      el('div', { className: 'card' }, [
        el('div', { className: 'card__body' }, [
          el('p', { className: 'section-title', style: { margin: 0 }, text: scenario.name }),
          C.RadioGroup({
            ariaLabel: 'Rate basis for ' + scenario.name,
            name: 'rate-basis-' + (scenario.number == null ? scenario.name : scenario.number),
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

  /** One panel per scenario in the comparison, side by side. */
  function rateChartsView(ctx) {
    return el('div', {}, [
      rateChartPanelFilters(),
      el('div', { className: 'comparison-grid' },
        ctx.compared().map(function (scenario) { return rateChartPanel(ctx, scenario); })
      )
    ]);
  }

  DA.workspace.leverViews = {
    adjustments: adjustmentsView,
    otherTerms: otherTermsView,
    rateCharts: rateChartsView
  };
})(window.DA);
