/**
 * Pricing terms — the incentive structure behind a scenario's bid.
 *
 * Four views: Tier Incentives (revenue bands and the rates they unlock),
 * Services (an incentive plan per service), Accessorials, and Modifiers.
 * Modifiers has no reference screen yet.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;

  DA.views = DA.views || {};

  /*
   * Where a lever edit is reported. PricingTerms is rendered by the workspace,
   * which hands in a sink; the change lands in the dock's change set so the
   * analyst can see -- and undo -- everything they have altered.
   */
  var reportChange = null;

  /**
   * A cell the analyst can change.
   *
   * `record` identifies the value: { id, label, get, set }. The setter writes
   * back to the demo data, so the edit survives the view being rebuilt, and
   * lets Discard changes put the original back.
   */
  function editableCell(value, options) {
    options = options || {};
    var record = options.record;

    var cell = DA.components.EditableValue({
      value: value,
      label: (record && record.label) || String(value),
      editable: options.editable !== false,
      onCommit: function (next, previous) {
        if (record && record.set) record.set(next);
        if (reportChange && record) {
          reportChange({
            id: record.id,
            label: record.label + ' ' + previous + ' \u2192 ' + next,
            before: previous,
            after: next,
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

  /* ---- Tier Incentives ---------------------------------------------------- */

  function tierIncentivesView() {
    var C = DA.components;
    var tier = DA.data.tierIncentive;

    function bandCells(pick, options) {
      options = options || {};
      return tier.bands.map(function (band, index) {
        return el('td', {
          className: 'matrix__cell' + (band.target ? ' is-target' : '')
        }, [
          options.plain
            ? el('span', { text: band[pick] })
            : editableCell(band[pick], {
                editable: !band.locked,
                record: {
                  id: 'tier:' + pick + ':' + index,
                  label: tier.tier + ' ' + pick + ' band ' + (index + 1),
                  set: function (next) { band[pick] = next; }
                }
              })
        ]);
      });
    }

    var head = el('thead', {}, [
      el('tr', {}, [el('th', { attrs: { scope: 'col' }, text: '' })].concat(
        tier.bands.map(function (band) {
          return el('th', {
            attrs: { scope: 'col' },
            className: band.target ? 'is-target' : ''
          }, [
            band.target
              ? el('span', { className: 'matrix__target-flag', text: 'Target' })
              : el('span')
          ]);
        })
      ))
    ]);

    var body = el('tbody', {}, [
      el('tr', {}, [el('th', { className: 'matrix__label', attrs: { scope: 'row' }, text: '% Modeled' })]
        .concat(bandCells('modeled', { plain: true }))),
      el('tr', {}, [el('th', { className: 'matrix__label', attrs: { scope: 'row' }, text: 'Low' })]
        .concat(bandCells('low'))),
      el('tr', {}, [el('th', { className: 'matrix__label', attrs: { scope: 'row' }, text: 'High' })]
        .concat(bandCells('high', { plain: true }))),
      el('tr', { className: 'matrix__section' }, [
        el('td', { attrs: { colspan: tier.bands.length + 1 }, text: 'Service Group' })
      ])
    ].concat(tier.serviceGroups.map(function (group) {
      return el('tr', {}, [
        el('th', { className: 'matrix__label', attrs: { scope: 'row' } }, [
          el('span', { text: group.name }),
          el('span', { className: 'matrix__label-sub', text: group.sublabel })
        ])
      ].concat(group.rates.map(function (rate, index) {
        var band = tier.bands[index];
        return el('td', { className: 'matrix__cell' + (band && band.target ? ' is-target' : '') }, [
          // Only the bands nearest the target stay open for negotiation --
          // the ones already past are read-only, same as Low's own locked band.
          editableCell(rate, {
            editable: Boolean(band && band.ratesEditable),
            record: {
              id: 'tier:rate:' + group.name + ':' + index,
              label: group.name + ' band ' + (index + 1),
              set: function (next) { group.rates[index] = next; }
            }
          })
        ]);
      })));
    })));

    var tierTable = el('table', { className: 'matrix' }, [
      el('caption', { className: 'u-visually-hidden', text: tier.tier + ' incentives' }),
      head,
      body
    ]);
    var grid = el('div', {
      className: 'data-table__viewport scroll-area data-table__viewport--auto'
    }, [tierTable]);
    if (DA.workspace && DA.workspace.pinMatrixKeys) {
      DA.workspace.pinMatrixKeys(grid, tierTable);
    }

    var open = true;
    var toggle = el('button', {
      className: 'tier-header__toggle u-tap-target',
      attrs: { type: 'button', 'aria-expanded': 'true', 'aria-label': 'Collapse ' + tier.tier }
    }, [DA.icons.chevronDown(16)]);
    toggle.addEventListener('click', function () {
      open = !open;
      grid.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', (open ? 'Collapse ' : 'Expand ') + tier.tier);
      DA.dom.clear(toggle).appendChild(open ? DA.icons.chevronDown(16) : DA.icons.chevronRight(16, ''));
    });

    /*
     * The tier and its modelled revenue are the anchor facts of this screen,
     * and every part of the old strip carried the same weight -- the label
     * "MODELED" was as loud as the $481,401 beneath it. The tier becomes the
     * heading, each fact becomes a small label over its own value, and the
     * modelled figure is marked as the one that decides the band.
     */
    return el('div', { className: 'card' }, [
      el('div', { className: 'tier-header' }, [
        toggle,
        el('h4', { className: 'tier-header__title', text: tier.tier }),
        el('div', { className: 'tier-header__meta' }, tier.meta.map(function (item) {
          var isLead = /model/i.test(item.label);
          return el('div', {
            className: 'tier-header__item' + (isLead ? ' is-lead' : '')
          }, [
            el('span', { className: 'tier-header__label', text: item.label }),
            el('span', { className: 'tier-header__value', text: item.value })
          ]);
        })),
        el('div', { className: 'tier-header__actions' }, [
          C.Button({
            label: 'Tier Options',
            variant: 'link',
            icon: DA.icons.chevronRight(14, ''),
            iconPosition: 'end'
          })
        ])
      ]),
      grid
    ]);
  }

  /* ---- Services ----------------------------------------------------------- */

  /** The incentive settings for one service: options, method and rate grid. */
  function servicePlan() {
    var C = DA.components;
    var zones = DA.data.rateZones;

    var grid = el('table', { className: 'matrix' }, [
      el('caption', { className: 'u-visually-hidden', text: 'Weight break incentives by zone' }),
      el('thead', {}, [
        el('tr', {}, [
          el('th', {
            className: 'matrix__rowhead',
            attrs: { scope: 'col', colspan: 2, rowspan: 2 },
            text: 'Billable Weight (lbs)'
          }),
          el('th', { attrs: { scope: 'colgroup', colspan: zones.length }, text: 'Domestic' }),
          el('th', { attrs: { scope: 'col', rowspan: 2 }, text: '' })
        ]),
        el('tr', {}, zones.map(function (zone) {
          return el('th', { attrs: { scope: 'col' }, text: zone });
        }))
      ]),
      el('tbody', {}, DA.data.weightBreaks.map(function (band) {
        function rateFor(zone) {
          return (band.rates && band.rates[zone]) || band.rate;
        }
        return el('tr', {}, [
          el('th', { className: 'matrix__rowhead', attrs: { scope: 'row' }, text: band.from }),
          el('td', { className: 'matrix__rowhead', text: band.to })
        ].concat(zones.map(function (zone) {
          return el('td', { className: 'matrix__cell' }, [
            editableCell(rateFor(zone), {
              record: {
                id: 'weight:' + band.from + ':' + zone,
                label: 'Weight ' + band.from + (band.to ? '-' + band.to : '') + ' zone ' + zone,
                // Each zone holds its own rate once edited, so the grid stops
                // being one figure repeated across the row.
                set: function (next) {
                  band.rates = band.rates || {};
                  band.rates[zone] = next;
                }
              }
            })
          ]);
        })).concat([
          el('td', {}, [
            el('button', {
              className: 'icon-action icon-action--danger u-tap-target',
              attrs: { type: 'button', 'aria-label': 'Remove weight break ' + band.from }
            }, [DA.icons.trash(14)])
          ])
        ]));
      }))
    ]);

    var weightGridScroll = el('div', { className: 'grid-scroll scroll-area' }, [grid]);
    if (DA.workspace && DA.workspace.pinMatrixKeys) {
      DA.workspace.pinMatrixKeys(weightGridScroll, grid);
    }

    /**
     * One labelled setting: a small caption over its control, so every
     * control on this panel says what it decides.
     */
    function setting(label, control, wide) {
      return el('div', { className: 'plan-setting' + (wide ? ' plan-setting--wide' : '') }, [
        el('span', { className: 'plan-setting__label', text: label }),
        control
      ]);
    }

    /*
     * These four controls arrived as a stack with no grouping and, in two
     * cases, no label at all -- the Base/Zone segmented control decided the
     * whole incentive basis and said nothing about itself, and the freight
     * type was a third tab bar identical to the two above it. They are one
     * settings band now: each control captioned, the freight type reduced to
     * chips so it stops competing with real navigation.
     */
    return el('div', { className: 'plan-detail' }, [
      el('div', { className: 'plan-settings' }, [
        setting('Freight type', C.SegmentedControl({
          ariaLabel: 'Freight type',
          value: 'commercial',
          items: [
            { value: 'commercial', label: 'Commercial' },
            { value: 'residence', label: 'Residence' }
          ]
        })),
        setting('Incentive basis', C.SegmentedControl({
          ariaLabel: 'Incentive basis',
          value: 'cell',
          items: [
            { value: 'base', label: 'Base/Zone' },
            { value: 'cell', label: 'Cell by Cell/Customs' },
            { value: 'minimum', label: 'Minimum' }
          ]
        })),
        setting('Incentive method *', C.SelectField({
          label: 'Incentive Method',
          hideLabel: true,
          value: 'Weight Break',
          options: DA.data.filterOptions.incentiveMethod.map(function (value) {
            return { value: value, label: value };
          })
        })),
        setting('Flow through options', el('div', { className: 'checkbox-row' },
          DA.data.flowThroughOptions.map(function (option) {
            return C.Checkbox({ checked: true, label: option });
          })
        ), true)
      ]),
      el('div', { className: 'card' }, [
        el('p', { className: 'rate-grid__caption', text: 'Zone Reference: Daily' }),
        // Billable Weight is a range across two columns (from | to); both
        // freeze, and only the zone figures scroll.
        weightGridScroll,
        /*
         * "Save Changes" used to sit here and on the accessorial panel. The
         * dock owns the change set now -- it counts every lever edit and
         * carries Price & submit -- so a second, panel-local save was a
         * competing promise about the same changes. Adding a weight break is
         * a real action and stays.
         */
        el('div', { className: 'grid-footer' }, [
          el('a', { className: 'link-with-icon', attrs: { href: '#add-weight-break' } }, [
            DA.icons.plusCircle(18),
            el('span', { text: 'Add weight break' })
          ])
        ])
      ])
    ]);
  }

  /**
   * One collapsible level of the plan tree. The last level -- the one
   * actually holding the table, not another branch to open -- gets its own
   * class so only it, not every expanded level above it, picks up the
   * "you're here" highlight (see accordion--plan-leaf in components.css).
   */
  /**
   * A scope bar: every level of the hierarchy on one line, then the leaf.
   *
   * This replaced nested accordions. Reaching a service plan meant opening
   * three collapsible cards, each adding its own panel padding and guide rail
   * -- roughly 32px of left inset per level, ~96px before the leaf, and 451px
   * of tree above content that was itself only a few hundred pixels tall.
   *
   * The first fix was a chip row per level: no indent, every sibling visible.
   * It still stacked, though, and the rows were anonymous -- three bands of
   * unlabelled pills reading as one long list rather than as Movement, then
   * Mode, then Service group. So the levels take the same labelled-control
   * treatment as the settings band below them, side by side on one line: a
   * caption saying what the level decides, over the control that decides it.
   *
   * Levels appear only as deep as the chosen path goes, which matters because
   * these trees are ragged: Accessorials has leaves at level one (Fuel
   * Surcharge) beside a branch three deep, and International carries no
   * service list under its modes.
   *
   * @param {Array}    roots       Top-level nodes.
   * @param {Function} leafRender  Builds the panel for the chosen leaf.
   * @param {Object}  [config]     { levelLabels: string[], action: Node }
   */
  function planPath(roots, leafRender, config) {
    config = config || {};
    var C = DA.components;
    var levelLabels = config.levelLabels || [];

    /*
     * Two or three options fit on the line as pills and show their siblings
     * without being asked. Beyond that they stop fitting -- Domestic Air has
     * six services, which is what pushed the old chip row onto a line of its
     * own -- so the level collapses to a select. Same labelled slot either way.
     */
    var PILL_LIMIT = 3;

    // Index chosen at each level. Truncated whenever a shallower level moves.
    var path = [0];
    var mount = el('div', { className: 'plan-path' });
    var built = {};

    /** The nodes offered at each level, given the current path. */
    function levels() {
      var out = [];
      var options = roots;
      for (var i = 0; i < path.length && options && options.length; i++) {
        var index = Math.min(path[i], options.length - 1);
        out.push({ options: options, index: index });
        var chosen = options[index];
        options = chosen && chosen.children;
      }
      return out;
    }

    /** The deepest chosen node -- the one whose plan is shown. */
    function leaf() {
      var rows = levels();
      var last = rows[rows.length - 1];
      return last ? last.options[last.index] : null;
    }

    // The level the reader last moved, so focus can be handed back to it after
    // the rebuild rather than dropped on the body.
    var focusLevel = null;

    function choose(level, index) {
      focusLevel = level;
      path = path.slice(0, level);
      path.push(index);
      // Walk down the first child of each level until a leaf is reached, so a
      // branch never lands the reader on an empty panel.
      var node = leaf();
      while (node && node.children && node.children.length) {
        path.push(0);
        node = leaf();
      }
      render();
    }

    /** One level: its caption over pills, or over a select once it outgrows them. */
    function levelControl(row, level, label) {
      var items = row.options.map(function (node, index) {
        return { value: String(index), label: node.label };
      });

      function pick(value) {
        var index = Number(value);
        if (index !== row.index) choose(level, index);
      }

      if (row.options.length > PILL_LIMIT) {
        return C.SelectField({
          label: label,
          hideLabel: true,
          value: String(row.index),
          options: items,
          onChange: pick
        });
      }

      return C.SegmentedControl({
        ariaLabel: label,
        value: String(row.index),
        items: items,
        onChange: pick
      });
    }

    function render() {
      DA.dom.clear(mount);
      var rows = levels();

      var scope = el('div', { className: 'plan-scope' });
      var slots = [];

      rows.forEach(function (row, level) {
        var label = levelLabels[level] || ('Level ' + (level + 1));
        var slot = el('div', { className: 'plan-scope__level' }, [
          el('span', { className: 'plan-setting__label', text: label }),
          levelControl(row, level, label)
        ]);
        slots.push(slot);
        scope.appendChild(slot);
      });

      /*
       * Adding a plan is the one control here that is not a scope choice, so
       * it sits apart at the right rather than heading the card above levels
       * it has nothing to do with.
       */
      if (config.action) {
        scope.appendChild(el('div', { className: 'plan-scope__action' }, [config.action]));
      }

      mount.appendChild(scope);

      var node = leaf();
      if (node) {
        var key = path.join('/');
        if (!built[key]) {
          built[key] = el('div', { className: 'plan-path__leaf' }, [leafRender()]);
        }
        mount.appendChild(built[key]);
      }

      // Hand focus back to the control that was just used. Without it a
      // keyboard reader is returned to the top of the document on every
      // change -- worst on the select, which is the level moved most.
      if (focusLevel != null && slots[focusLevel]) {
        var target = slots[focusLevel].querySelector(
          '[aria-checked="true"], .dropdown__trigger, button'
        );
        if (target) target.focus();
        focusLevel = null;
      }
    }

    // Open on the first complete path rather than a branch with nothing under it.
    var start = roots[0];
    while (start && start.children && start.children.length) {
      path.push(0);
      start = start.children[0];
    }

    render();
    return mount;
  }


  /**
   * Services tab: the always-expanded nested-accordion plan hierarchy,
   * one branch per region, drilling down to a leaf's incentive table.
   */
  function servicesTreeView() {
    return planPath(DA.data.pricingServiceTree, servicePlan, {
      levelLabels: ['Movement', 'Mode', 'Service group'],
      action: el('a', { className: 'link-with-icon', attrs: { href: '#add-plan' } }, [
        DA.icons.plusCircle(18),
        el('span', { text: 'Add Service Incentive Plan' })
      ])
    });
  }

  /* ---- Accessorials -------------------------------------------------------- */

  /**
   * An accessorial's incentive plan: the same generic table for every leaf,
   * mirroring servicePlan() -- what's edited is the incentive itself, not
   * which leaf you opened it from.
   */
  function accessorialPlan() {
    var C = DA.components;

    function labelColumn(key, label, width) {
      return { key: key, label: label, width: width || '140px', className: 'is-rowhead' };
    }

    function editableColumn(key, label, width) {
      return {
        key: key,
        label: label,
        width: width,
        className: 'is-numeric is-end',
        headerClassName: 'is-end',
        render: function (row) {
          return editableCell(row[key], {
            record: {
              id: 'accessorial:' + row.service + ':' + key,
              label: row.service + ' ' + label,
              set: function (next) { row[key] = next; }
            }
          });
        }
      };
    }

    return el('div', { className: 'card' }, [
      C.DataTable({
        caption: 'Accessorial incentive plan',
        embedded: true,
        headerTone: 'warm',
        tinted: true,
        // Movement, Mode, Service Group and Core Service together identify
        // the line -- frozen as a group, same as Adjustments.
        freezeColumns: 4,
        columns: [
          labelColumn('movement', 'Movement', '110px'),
          labelColumn('mode', 'Mode', '90px'),
          labelColumn('serviceGroup', 'Service Group', '130px'),
          labelColumn('service', 'Core Service', '170px'),
          {
            key: 'adu', label: 'ADU', width: '90px',
            className: 'is-numeric is-end', headerClassName: 'is-end'
          },
          {
            key: 'nrpp', label: 'NRPP', width: '100px',
            className: 'is-numeric is-end', headerClassName: 'is-end'
          },
          editableColumn('incentiveType', 'Incentive Type', '150px'),
          editableColumn('incentiveAmount', 'Incentive Amount', '165px')
        ],
        rows: DA.data.pricingAccessorialIncentives
      }),
      null
    ]);
  }

  /**
   * Accessorials tab: the same always-expanded nested-accordion plan
   * hierarchy as Services, over the accessorial tree.
   */
  function accessorialsTreeView() {
    return planPath(DA.data.pricingAccessorialTree, accessorialPlan, {
      levelLabels: ['Charge type', 'Charge group', 'Charge'],
      action: el('a', { className: 'link-with-icon', attrs: { href: '#add-accessorial-plan' } }, [
        DA.icons.plusCircle(18),
        el('span', { text: 'Add Accessorial Incentive Plan' })
      ])
    });
  }

  /**
   * @param {Object} context  { packet, numeric, filters, emptyView }
   */
  DA.views.PricingTerms = function PricingTerms(context) {
    reportChange = context.onLeverChange || null;
    var C = DA.components;

    return el('div', { className: 'tabs--boxed tabs--sub' }, [
      C.Tabs({
        ariaLabel: 'Pricing term views',
        value: 'tier-incentives',
        items: [
          { id: 'tier-incentives', label: 'Tier Incentives', render: function () {
            return el('div', {}, [context.filters(), tierIncentivesView()]);
          } },
          { id: 'services', label: 'Services', render: function () {
            return el('div', {}, [context.filters(), el('div', { className: 'card' }, [servicesTreeView()])]);
          } },
          { id: 'accessorials', label: 'Accessorials', render: function () {
            return el('div', {}, [context.filters(), el('div', { className: 'card' }, [accessorialsTreeView()])]);
          } },
          { id: 'modifiers', label: 'Modifiers', render: function () {
            return el('div', {}, [context.filters(), context.emptyView('Modifier')()]);
          } }
        ]
      })
    ]);
  };
})(window.DA);
