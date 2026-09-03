/**
 * The three canvas modes.
 *
 * v4/v5 offered five top tabs over seven sub-tabs -- up to 35 flat
 * destinations, every one named after the table its data sits in: "Cost
 * Details", "Zones", "Weight & Cube". To answer a question the analyst first
 * had to know which grid held it.
 *
 * v6 names three modes after what the analyst is doing:
 *
 *   IMPACT    what is the answer, and what drove it
 *   LEVERS    what I change
 *   EVIDENCE  where the numbers came from
 *
 * Nothing was removed. The seven old sub-tabs were never seven subjects --
 * they are the same lanes sliced seven ways, so they collapse into one grid
 * with a breakdown switcher above it. That is 35 destinations down to 3 modes
 * plus a switcher, with every original view still reachable.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  var C = DA.components;
  DA.workspace = DA.workspace || {};

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

  /**
   * `fill` makes the section claim the canvas height it is given rather than
   * sizing to its content, so the grid inside it shows as many rows as the
   * window allows instead of leaving the space below it empty.
   */
  function section(title, note, body, aside, fill) {
    return el('section', { className: 'ws-section' + (fill ? ' ws-section--fill' : '') }, [
      el('div', { className: 'ws-section__head' }, [
        el('h3', { className: 'ws-section__title', text: title }),
        note ? el('span', { className: 'ws-section__note', text: note }) : null,
        aside ? el('div', { className: 'ws-section__aside' }, [aside]) : null
      ]),
      body
    ]);
  }

  DA.workspace.section = section;
  DA.workspace.numeric = numeric;

  /* ======================================================================
     IMPACT — the answer, stated before the evidence
     ====================================================================== */

  /**
   * The sentence, from the two movements that decide it. v4 showed eight raw
   * figures and a Change row and left the judgement entirely to the reader;
   * the hover card that held the reasoning could not be read at rest.
   */
  function headlineFor(ctx) {
    var scenarios = ctx.scenarios;
    var reference = ctx.reference();
    var others = ctx.comparands();

    if (!others.length) {
      return {
        key: 'No comparison',
        call: reference.name + ' on its own',
        because: 'Tick another scenario in the rail to measure it against ' +
                 reference.name + '. Any scenario can be the reference \u2014 click ' +
                 'its card to anchor the comparison there instead.'
      };
    }

    function profitOf(other) {
      return DA.workspace.figureDelta(scenarios, reference.name, other.name, 'profit');
    }

    if (others.length === 1) {
      var other = others[0];
      var profit = profitOf(other);
      var discount = DA.workspace.figureDelta(scenarios, reference.name, other.name, 'totalDisc');
      var revenue = DA.workspace.figureDelta(scenarios, reference.name, other.name, 'revenue');
      var profitTone = DA.workspace.tone(profit, true);
      var discountTone = DA.workspace.tone(discount, false);

      var call;
      if (profit == null) {
        call = other.name + ' has no sourced figures to compare yet';
      } else if (profitTone === 'up') {
        call = discountTone === 'down'
          ? other.name + ' improves profit, but widens discount'
          : other.name + ' improves profit without widening discount';
      } else if (profitTone === 'down') {
        call = other.name + ' reduces profit against ' + reference.name;
      } else {
        call = other.name + ' leaves profit materially unchanged';
      }

      return {
        key: 'Verdict',
        call: call,
        because: profit == null
          ? 'Source data for ' + other.name + ' to see its impact.'
          : 'Against ' + reference.name + ': profit ' + profit + ', revenue ' +
            revenue + ', total discount ' + discount + '.'
      };
    }

    // Three or more: name the strongest on profit rather than describing each.
    var ranked = others
      .map(function (o) {
        var delta = profitOf(o);
        return { scenario: o, delta: delta, n: DA.figures.toNumber(delta) };
      })
      .filter(function (r) { return r.n != null; })
      .sort(function (a, b) { return b.n - a.n; });

    return {
      key: 'Verdict',
      call: ranked.length
        ? ranked[0].scenario.name + ' leads on profit of the ' + others.length + ' compared'
        : 'No sourced figures among the scenarios compared',
      because: ranked.length
        ? 'Against ' + reference.name + ', profit moves ' +
          ranked.map(function (r) { return r.scenario.name + ' ' + r.delta; }).join(', ') + '.'
        : 'Source data for these scenarios to compare them.'
    };
  }

  var IMPACT_COLLAPSE_KEY = 'da.impact.collapsed';
  var IMPACT_COMBINE_KEY = 'da.impact.combined';

  function readFlag(key) {
    try { return window.localStorage.getItem(key) === '1'; }
    catch (error) { return false; }
  }

  function writeFlag(key, value) {
    try { window.localStorage.setItem(key, value ? '1' : '0'); }
    catch (error) { /* private window; the session default still works */ }
  }

  /** ▲ / ▼ prefix for a delta, or nothing when it has not moved. */
  function mark(delta, direction) {
    if (direction === 'flat') return '';
    return DA.figures.toNumber(delta) > 0 ? '▲ ' : '▼ ';
  }

  DA.workspace.impactMode = function impactMode(ctx) {
    var scenarios = ctx.scenarios;
    var collapsed = readFlag(IMPACT_COLLAPSE_KEY);
    var combined = readFlag(IMPACT_COMBINE_KEY);

    var uid = 'impact-summary-' + Math.random().toString(36).slice(2, 8);
    var summary = el('section', { className: 'impact-summary' });

    function reference() { return ctx.reference(); }
    function comparands() { return ctx.comparands(); }

    function deltaFor(scenario, key) {
      return DA.workspace.figureDelta(scenarios, reference().name, scenario.name, key);
    }

    /* ---- One card per scenario, laid horizontally ----------------------- */

    /**
     * A scenario's own figures at a glance. The reference carries the
     * system's selected state -- brown on gold wash -- because it is the
     * thing everything else is measured from, not merely the first card.
     */
    function scenarioCard(scenario, isReference) {
      var resolved = DA.workspace.figuresFor(scenarios, scenario.name);
      var figures = resolved.figures;

      var card = el('article', {
        className: 'scen-card' + (isReference ? ' scen-card--reference' : '')
      }, [
        el('header', { className: 'scen-card__head' }, [
          el('span', { className: 'scen-card__name', text: scenario.name }),
          el('span', {
            className: 'scen-card__role',
            text: isReference ? 'Reference' : 'Compared'
          })
        ])
      ]);

      var list = el('dl', { className: 'scen-card__figures' });
      DA.workspace.dockMetrics.forEach(function (metric) {
        var value = figures[metric.key];
        var delta = isReference ? null : deltaFor(scenario, metric.key);
        var direction = delta ? DA.workspace.tone(delta, metric.favourable) : 'flat';

        list.appendChild(el('div', { className: 'scen-card__row' }, [
          el('dt', { className: 'scen-card__k', text: metric.label }),
          el('dd', { className: 'scen-card__v' }, [
            el('span', { text: value == null ? '—' : String(value) }),
            delta && delta !== '-'
              ? el('span', {
                  className: 'scen-card__d delta-' + direction,
                  text: mark(delta, direction) + delta
                })
              : null
          ])
        ]));
      });
      card.appendChild(list);

      if (resolved.inheritedFrom) {
        card.appendChild(el('p', {
          className: 'scen-card__note',
          text: 'Figures inherited from ' + resolved.inheritedFrom
        }));
      }

      return card;
    }

    /* ---- The same thing as one card ------------------------------------- */

    /**
     * Metrics down, scenarios across. The split cards answer "what is this
     * scenario"; this answers "how do they differ", which is the same data
     * turned ninety degrees -- so it is a view switch, not another screen.
     */
    function combinedCard() {
      var picked = ctx.compared();

      var head = el('tr', {}, [el('th', { attrs: { scope: 'col' }, text: '' })]
        .concat(picked.map(function (scenario, index) {
          return el('th', {
            className: 'is-end' + (index === 0 ? ' scen-grid__ref' : ''),
            attrs: { scope: 'col' }
          }, [
            el('span', { className: 'scen-grid__name', text: scenario.name }),
            el('span', {
              className: 'scen-grid__role',
              text: index === 0 ? 'Reference' : 'Compared'
            })
          ]);
        })));

      var body = el('tbody', {}, DA.workspace.dockMetrics.map(function (metric) {
        return el('tr', {}, [
          el('th', { className: 'scen-grid__k', attrs: { scope: 'row' }, text: metric.label })
        ].concat(picked.map(function (scenario, index) {
          var figures = DA.workspace.figuresFor(scenarios, scenario.name).figures;
          var value = figures[metric.key];
          var delta = index === 0 ? null : deltaFor(scenario, metric.key);
          var direction = delta ? DA.workspace.tone(delta, metric.favourable) : 'flat';

          return el('td', { className: 'is-end' + (index === 0 ? ' scen-grid__ref' : '') }, [
            el('span', { className: 'scen-grid__v', text: value == null ? '—' : String(value) }),
            delta && delta !== '-'
              ? el('span', {
                  className: 'scen-grid__d delta-' + direction,
                  text: mark(delta, direction) + delta
                })
              : null
          ]);
        })));
      }));

      return el('div', { className: 'scen-grid' }, [
        el('table', {}, [
          el('caption', { className: 'u-visually-hidden', text: 'Scenario figures side by side' }),
          el('thead', {}, [head]),
          body
        ])
      ]);
    }

    /* ---- The bar: verdict, controls, and the collapsed one-liner --------- */

    /** The headline movement, for the collapsed line. */
    function leadDelta() {
      var others = comparands();
      if (!others.length) return null;
      var delta = deltaFor(others[0], 'profit');
      if (delta == null || delta === '-') return null;
      var direction = DA.workspace.tone(delta, true);
      return el('span', { className: 'impact-summary__lead delta-' + direction,
        text: 'Profit ' + mark(delta, direction) + delta });
    }

    function bar() {
      var headline = headlineFor(ctx);
      var node = el('div', { className: 'impact-summary__bar' }, [
        el('span', { className: 'impact-summary__k', text: headline.key })
      ]);

      node.appendChild(el('span', {
        className: 'impact-summary__call',
        text: collapsed ? headline.call : headline.call
      }));

      if (collapsed) {
        var lead = leadDelta();
        if (lead) node.appendChild(lead);
      }

      node.appendChild(el('span', { className: 'impact-summary__spacer' }));

      if (!collapsed && ctx.compared().length > 1) {
        node.appendChild(el('button', {
          className: 'impact-summary__switch',
          attrs: {
            type: 'button',
            'aria-pressed': combined ? 'true' : 'false',
            title: combined ? 'Show one card per scenario' : 'Combine into one card'
          },
          on: {
            click: function () {
              combined = !combined;
              writeFlag(IMPACT_COMBINE_KEY, combined);
              render();
            }
          }
        }, [
          combined ? DA.icons.cards(15) : DA.icons.rows(15),
          el('span', { text: combined ? 'Separate cards' : 'Combine' })
        ]));
      }

      node.appendChild(el('button', {
        className: 'impact-summary__tab',
        attrs: {
          type: 'button',
          'aria-expanded': collapsed ? 'false' : 'true',
          'aria-controls': uid,
          'aria-label': (collapsed ? 'Expand' : 'Collapse') + ' the scenario summary'
        },
        on: {
          click: function () {
            collapsed = !collapsed;
            writeFlag(IMPACT_COLLAPSE_KEY, collapsed);
            render();
          }
        }
      }, [collapsed ? DA.icons.chevronDown(14) : DA.icons.chevronUp(14)]));

      return node;
    }

    function render() {
      summary.className = 'impact-summary' + (collapsed ? ' is-collapsed' : '');
      DA.dom.clear(summary);
      summary.appendChild(bar());
      if (collapsed) return;

      var body = el('div', { className: 'impact-summary__body', attrs: { id: uid } });
      if (combined && ctx.compared().length > 1) {
        body.appendChild(combinedCard());
      } else {
        var strip = el('div', { className: 'scen-strip' });
        ctx.compared().forEach(function (scenario, index) {
          strip.appendChild(scenarioCard(scenario, index === 0));
        });
        body.appendChild(strip);
      }
      summary.appendChild(body);
    }

    render();

    return el('div', { className: 'pane-fill' }, [
      summary,
      section(
        'Where the movement is',
        comparands().length
          ? 'One row per line item, each scenario against ' + reference().name
          : 'One row per line item',
        DA.workspace.comparisonMatrix(ctx),
        null,
        true
      )
    ]);
  };

  /* ======================================================================
     EVIDENCE — one grid, a breakdown switcher, no tab hunting
     ====================================================================== */

  /** The lane key every shipping-profile view opens with. */
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

  /**
   * The seven old sub-tabs, as breakdowns of one grid. Each still supplies its
   * own columns and its own rows -- nothing was merged or invented -- but they
   * are now one destination with a switcher rather than seven siblings.
   */
  var BREAKDOWNS = [
    {
      id: 'service', label: 'Service', rows: function () { return DA.data.packetServices; },
      table: function () {
        return {
          expandKey: 'service', freezeColumns: 1,
          getChildren: function (row) { return DA.data.zoneBreakdown(row, 'service', DA.data.additive.service); },
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
          ]
        };
      }
    },
    {
      id: 'zone', label: 'Zone', rows: function () { return DA.data.shippingProfileZone; },
      table: function () {
        return {
          expandKey: 'coreService', freezeColumns: 3,
          getChildren: function (row) {
            if (row.zone !== '-') return null;
            return DA.data.zoneBreakdown(row, 'service', DA.data.additive.zone);
          },
          columns: profileKeyColumns().concat([
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
          ])
        };
      }
    },
    {
      id: 'cost', label: 'Cost detail', rows: function () { return DA.data.shippingProfileCost; },
      table: function () {
        return {
          expandKey: 'coreService', freezeColumns: 3,
          getChildren: function (row) {
            if (row.zone !== '-') return null;
            return DA.data.zoneBreakdown(row, 'service', DA.data.additive.cost);
          },
          columns: profileKeyColumns().concat([
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
          ])
        };
      }
    },
    {
      id: 'charges', label: 'Charges', rows: function () { return DA.data.shippingProfileAccessorial; },
      table: function () {
        function labelColumn(key, label, width, spanRepeats) {
          return { key: key, label: label, width: width || '135px', className: 'is-rowhead', spanRepeats: spanRepeats };
        }
        return {
          expandKey: 'detail', freezeColumns: 3,
          getChildren: function (row) { return row.children; },
          columns: [
            labelColumn('type', 'Accessorial Type', null, true),
            labelColumn('group', 'Group', null, true),
            labelColumn('detail', 'Detail', '235px'),
            numeric('totalUnits', 'Total Units', { link: true, width: '120px' }),
            numeric('pctTotalVolume', '% Total Volume', { link: true, width: '150px' }),
            numeric('adu', 'ADU', { link: true, width: '110px' }),
            numeric('grossRevenue', 'Gross Revenue', { link: true, width: '150px' }),
            numeric('netRevenue', 'Net Revenue', { link: true, width: '145px' }),
            numeric('discount', 'Discount', { link: true, width: '110px' })
          ]
        };
      }
    },
    {
      id: 'account', label: 'Account', rows: function () { return DA.data.packetAccounts; },
      table: function (ctx) {
        function labelColumn(key, label, width, render, spanRepeats) {
          return { key: key, label: label, width: width || '160px', className: 'is-rowhead', render: render, spanRepeats: spanRepeats };
        }
        return {
          expandKey: 'accountNumber', freezeColumns: 3,
          getChildren: function (row) { return row.children; },
          columns: [
            labelColumn('parent', 'Parent', '170px', function (row) {
              return row.parent ? ctx.withCustomer(row.parent) : '';
            }, true),
            labelColumn('subParent', 'Sub Parent', '150px', null, true),
            labelColumn('accountNumber', 'Account Number', '170px'),
            numeric('volume', 'Volume', { link: true, width: '110px' }),
            numeric('adv', 'ADV', { link: true, width: '100px' }),
            numeric('zone', 'Zone', { link: true, width: '90px' })
          ]
        };
      }
    },
    {
      id: 'weight', label: 'Weight & cube', rows: function () { return DA.data.packetWeightCube; },
      table: function () {
        return {
          expandKey: 'service', freezeColumns: 1,
          getChildren: function (row) { return DA.data.weightBreakdown(row, 'service', DA.data.additive.service); },
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
          ]
        };
      }
    }
  ];

  DA.workspace.evidenceMode = function evidenceMode(ctx) {
    // The chosen breakdown lives on the context, so switching mode and coming
    // back returns to the breakdown the analyst was reading.
    var mount = el('div', { className: 'pane-fill__body' });

    function draw() {
      var chosen = BREAKDOWNS.filter(function (b) { return b.id === ctx.breakdown; })[0] || BREAKDOWNS[0];
      var spec = chosen.table(ctx);
      DA.dom.clear(mount).appendChild(
        el('div', { className: 'card' }, [
          C.DataTable(Object.assign({
            caption: chosen.label + ' breakdown',
            embedded: true,
            headerTone: 'warm',
            tinted: true,
            rows: chosen.rows()
          }, spec))
        ])
      );
    }

    var switcher = el('div', { className: 'breakdown' }, [
      el('span', { className: 'breakdown__label', text: 'Break down by' })
    ].concat(BREAKDOWNS.map(function (b) {
      var chip = el('button', {
        className: 'chip',
        attrs: { type: 'button', 'aria-pressed': b.id === ctx.breakdown ? 'true' : 'false' },
        text: b.label,
        on: {
          click: function () {
            ctx.breakdown = b.id;
            Array.prototype.forEach.call(switcher.querySelectorAll('.chip'), function (node) {
              node.setAttribute('aria-pressed', node === chip ? 'true' : 'false');
            });
            draw();
          }
        }
      });
      chip.appendChild(el('span', { className: 'chip__count', text: String(b.rows().length) }));
      return chip;
    })));

    draw();

    return el('div', { className: 'pane-fill' }, [
      switcher,
      el('p', {
        className: 'ws-section__note',
        style: { margin: '0 0 var(--space-3)' },
        text: 'The same lanes, sliced six ways. Previously six separate tabs; ' +
              'expanding a row still opens onto the breakdown beneath it.'
      }),
      mount
    ]);
  };

  /* ======================================================================
     LEVERS — what the analyst changes, with impact one glance away
     ====================================================================== */

  /**
   * LEVERS — everything the analyst sets, which is everything outside Analyzer.
   *
   * v4/v5 split these across four top-level tabs: Pricing Terms, Other Terms,
   * Adjustments and Rate Charts. The split was never by subject -- it was by
   * whether you are *changing* something. Analyzer's views are read-only
   * figures (now Impact and Evidence); these four are the contract terms, so
   * they sit together here under the same heading, with the dock showing what
   * has been changed across all of them.
   */
  DA.workspace.leversMode = function leversMode(ctx) {
    var views = DA.workspace.leverViews;

    return el('div', { className: 'lever-layout' }, [
      C.Tabs({
        ariaLabel: 'Lever groups',
        value: 'pricing-terms',
        items: [
          {
            id: 'pricing-terms', label: 'Pricing Terms',
            render: function () {
              return DA.views.PricingTerms({
                packet: ctx.packet,
                numeric: numeric,
                // Every lever edit lands in the dock's change set, which is
                // what makes "N unpriced changes" and Discard changes mean
                // something.
                onLeverChange: ctx.recordChange,
                filters: function () { return el('div'); },
                emptyView: function (label) {
                  return function () {
                    return el('div', { className: 'card' }, [
                      C.DataTable({
                        caption: label, embedded: true, headerTone: 'warm',
                        columns: [{ key: 'name', label: label }], rows: [],
                        emptyState: el('p', { className: 'table-empty', text: 'No data available.' })
                      })
                    ]);
                  };
                }
              });
            }
          },
          {
            id: 'other-terms', label: 'Other Terms',
            render: function () { return views.otherTerms(ctx); }
          },
          {
            id: 'adjustments', label: 'Adjustments',
            render: function () { return views.adjustments(ctx); }
          },
          {
            /*
             * Rate Charts is reference material -- the rates as they stand, to
             * read against while setting the three groups before it. It is
             * still one of the four tabs and behaves like one; it just sits
             * apart at the right, because grouping a read-only view with three
             * editable ones implied it was a fourth thing to change.
             */
            id: 'rate-charts', label: 'Rate Charts', aside: true,
            render: function () { return views.rateCharts(ctx); }
          }
        ]
      })
    ]);
  };
})(window.DA);
