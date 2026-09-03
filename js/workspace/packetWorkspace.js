/**
 * Analyzer Workspace — the packet screen, rebuilt around the analyst's loop.
 *
 * Composition:
 *
 *   ┌──────────────────────────────────────────────────┐
 *   │  [Impact] [Levers] [Evidence]                    │
 *   │  canvas — full width                             │
 *   ├──────────────────────────────────────────────────┤
 *   │ DOCK — scenario pills + Create scenario          │
 *   │        figures, change set, commit               │
 *   └──────────────────────────────────────────────────┘
 *
 * The scenarios began as a "Comparison View" dropdown that hid which ones were
 * in play behind a click, then became a 248px rail down the left. The rail
 * held a column of the window for a short list of short names, so they are
 * pills in the dock now -- next to the figures they drive, with the width
 * handed back to the grids. The dock replaces the split between where a change
 * is made and where its effect is read. Canvas modes replace 35 flat tabs.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  var C = DA.components;

  DA.workspace = DA.workspace || {};
  DA.pages = DA.pages || {};

  /* ---- The interleaved comparison matrix -------------------------------- */

  /**
   * Merges per-scenario summary trees into one tree keyed by row label.
   *
   * v4 rendered a detached table per scenario. Because one scenario carries a
   * row the other does not, the panels came out 422px and 454px tall and every
   * row below the difference sat one row out of register with its counterpart
   * -- while an opt-in toggle, off by default, was the only thing that lined
   * them up. Merging on label means there is only ever one row to align.
   */
  function mergeTrees(lists) {
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
        entry.children = mergeTrees(childLists);
      }
      return entry;
    });
  }

  var MATRIX_METRICS = [
    { key: 'adv', label: 'ADV', width: '100px', favourable: true },
    { key: 'baseFrt', label: 'Base Frt', width: '100px', favourable: false },
    { key: 'totalDisc', label: 'Total Disc', width: '105px', favourable: false },
    { key: 'rpp', label: 'RPP', width: '105px', favourable: true },
    { key: 'annRev', label: 'Ann Rev', width: '140px', favourable: true }
  ];

  DA.workspace.comparisonMatrix = function comparisonMatrix(ctx) {
    var trees = DA.data.packetSummaryTrees;
    /*
     * A scenario with no tree of its own reads the tree of the scenario it was
     * copied from -- its real state until a lever moves. It does NOT fall back
     * to Current, which is what v6 did first: that showed an unrelated
     * scenario's figures under a name that had never been sourced.
     */
    function treeFor(scenario) {
      var seen = {};
      var at = scenario.name;
      while (at && !seen[at]) {
        if (trees[at]) return trees[at];
        seen[at] = true;
        var match = ctx.scenarios.filter(function (s) { return s.name === at; })[0];
        at = match && match.copiedFrom;
      }
      return [];
    }

    var picked = ctx.compared().map(function (scenario) {
      return { name: scenario.name, rows: treeFor(scenario) };
    });

    var columns = [{
      key: 'label',
      label: 'Line item',
      width: '190px',
      className: 'is-rowhead',
      render: function (row) { return ctx.withCustomer(row.label); }
    }];

    MATRIX_METRICS.forEach(function (metric) {
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

        // A delta column per scenario measured against the reference, so a
        // three-way comparison reads across without arithmetic. Index 0 is
        // the reference itself and has nothing to be measured from.
        if (index === 0) return;
        columns.push({
          key: metric.key + ':delta:' + index,
          label: 'Change',
          width: '105px',
          className: 'is-numeric is-end compare-delta',
          headerClassName: 'is-end',
          renderHeader: function () {
            return el('span', {}, [
              el('span', { text: 'Δ' }),
              el('span', {
                className: 'compare-matrix__scen',
                text: picked.length > 2
                  ? DA.workspace.shortName(scenario) + ' vs ' + DA.workspace.shortName(picked[0])
                  : 'Change'
              })
            ]);
          },
          render: function (row) {
            var base = row.per && row.per[0];
            var against = row.per && row.per[index];
            if (!base || !against) return el('span', { className: 'compare-delta--flat', text: '-' });
            var value = DA.figures.difference(base[metric.key], against[metric.key]);
            return el('span', {
              className: 'compare-delta--' + DA.workspace.tone(value, metric.favourable),
              text: value
            });
          }
        });
      });
    });

    return el('div', { className: 'card' }, [
      C.DataTable({
        caption: 'Scenario comparison by line item',
        embedded: true,
        headerTone: 'warm',
        tinted: true,
        freezeColumns: 1,
        expandKey: 'label',
        getChildren: function (row) { return row.children; },
        columns: columns,
        rows: mergeTrees(picked.map(function (entry) { return entry.rows; }))
      })
    ]);
  };

  /* ---- The workspace ----------------------------------------------------- */

  DA.pages.PacketWorkspace = function PacketWorkspace(options) {
    options = options || {};
    var packet = options.packet || {};
    var scenarios = packet.scenarios || [];
    var customer = packet.customerName || '-';

    /**
     * Everything the workspace remembers. Held in one place so switching mode
     * or scenario never rebuilds what the analyst had already set up -- the
     * v4/v5 tab component threw its panel away on every activation.
     */
    /*
     * The comparison is two independent choices, not one.
     *
     * v6 first anchored every comparison on the baseline: whichever scenario
     * you selected was shown against Scenario 0 and nothing else. That answers
     * "is this better than today" and cannot answer "is S2 better than S1",
     * which is the question an analyst asks once they have more than one
     * candidate on the table.
     *
     *   REFERENCE   the anchor every delta is measured from. Exactly one.
     *               Clicking a scenario pill in the dock sets it.
     *   COMPARANDS  the scenarios measured against it. Any number.
     *               The tick on a pill adds and removes.
     *
     * Base vs S1, S1 vs S2 and Base vs S1 vs S2 are all just positions of
     * those two controls.
     */
    var ctx = {
      packet: packet,
      scenarios: scenarios,
      mode: 'impact',
      breakdown: 'service',
      referenceIndex: 0,
      compareWith: scenarios.length > 1 ? [1] : [],
      changes: [],

      /*
       * The basis the packet's figures were sourced at, and the basis the
       * analyst is asking for. They start equal. Every recorded figure in this
       * data set was sourced at Fully Allocated Cost over All revenue, so
       * choosing another basis cannot honestly restate them -- the UI says
       * which basis the figures on screen belong to instead of relabelling
       * them.
       */
      sourcedCostBasis: 'Fully Allocated Cost',
      sourcedRevenueBasis: 'All',
      costBasis: 'Fully Allocated Cost',
      revenueBasis: 'All',
      basisMatchesSource: function () {
        return ctx.costBasis === ctx.sourcedCostBasis &&
               ctx.revenueBasis === ctx.sourcedRevenueBasis;
      },
      reference: function () {
        return scenarios[ctx.referenceIndex] || scenarios[0] || { name: 'Current' };
      },
      comparands: function () {
        return ctx.compareWith
          .slice()
          .sort(function (a, b) { return a - b; })
          .map(function (i) { return scenarios[i]; })
          .filter(Boolean);
      },
      /** Reference first, then everything measured against it. */
      compared: function () { return [ctx.reference()].concat(ctx.comparands()); },
      /** A stable key for the current comparison, so caches can invalidate. */
      signature: function () {
        return ctx.referenceIndex + '>' + ctx.compareWith.slice().sort().join(',');
      },
      withCustomer: function (text) { return String(text).replace('{customer}', customer); },

      /*
       * One entry per edited cell, keyed by the cell's id: editing the same
       * lever twice updates its entry rather than stacking two, and editing it
       * back to where it started removes it, so the count always reflects what
       * actually differs from the sourced figures.
       */
      recordChange: function (change) {
        var at = -1;
        ctx.changes.forEach(function (entry, index) {
          if (entry.id === change.id) at = index;
        });

        if (at !== -1) {
          var original = ctx.changes[at].before;
          if (change.after === original) {
            ctx.changes.splice(at, 1);
          } else {
            ctx.changes[at] = {
              id: change.id,
              label: change.label.replace(change.before, original),
              before: original,
              after: change.after,
              revert: change.revert
            };
          }
        } else {
          ctx.changes.push(change);
        }

        dock.render();
      }
    };

    /**
     * Impact is the only mode whose content depends on the comparison, so it
     * is the only cache dropped -- Evidence keeps its breakdown, expansion and
     * scroll position across a change of reference.
     */
    function comparisonChanged() {
      Object.keys(panes).forEach(function (key) {
        if (key.indexOf('impact') === 0) {
          if (panes[key].parentNode) panes[key].parentNode.removeChild(panes[key]);
          delete panes[key];
        }
      });
      renderCanvas();
      dock.render();
    }

    /* ---- Canvas ----------------------------------------------------------- */

    var canvas = el('div', { className: 'canvas' });

    /*
     * `fill` marks a mode whose subject is a single grid. Those panes take the
     * canvas height rather than sizing to their content, so the grid shows as
     * many rows as the window allows and owns the only scrollbar. Levers is
     * genuinely long-form -- a tier matrix over three trees -- so it scrolls
     * the canvas the normal way.
     */
    var MODES = [
      { id: 'impact', label: 'Impact', sub: 'the answer', fill: true, render: function () { return DA.workspace.impactMode(ctx); } },
      { id: 'levers', label: 'Levers', sub: 'what I change', render: function () { return DA.workspace.leversMode(ctx); } },
      { id: 'evidence', label: 'Evidence', sub: 'where it comes from', fill: true, render: function () { return DA.workspace.evidenceMode(ctx); } }
    ];

    /*
     * Panes are built once and kept alive, so expansion, scroll position and
     * the chosen breakdown survive switching mode -- in v4/v5 a tab round-trip
     * discarded all of it (measured: 13 rows at scrollLeft 800 came back as 9
     * rows at 0).
     *
     * Keyed by mode *and* active scenario, because a pane's content genuinely
     * differs per scenario; returning to a scenario returns to its own pane.
     */
    var panes = {};

    /*
     * Impact is keyed by the comparison it draws; Evidence and Levers are not
     * comparison-dependent, so they keep one pane each and hold their state.
     */
    function paneKey() {
      return ctx.mode === 'impact' ? 'impact::' + ctx.signature() : ctx.mode;
    }

    function renderCanvas() {
      var key = paneKey();
      var mode = MODES.filter(function (m) { return m.id === ctx.mode; })[0] || MODES[0];
      if (!panes[key]) {
        panes[key] = el('div', {
          className: 'canvas__pane' + (mode.fill ? ' canvas__pane--fill' : '')
        }, [mode.render()]);
        canvas.appendChild(panes[key]);
      }
      Object.keys(panes).forEach(function (k) { panes[k].hidden = k !== key; });
      // A filling pane sizes itself to the canvas, so the canvas must not
      // also scroll; a long-form pane needs it to.
      canvas.classList.toggle('canvas--fill', Boolean(mode.fill));
      // Anything that measures itself was measuring zero while hidden.
      window.dispatchEvent(new Event('resize'));
    }

    /**
     * A basis picker. These were real dropdowns on the v4 screen and became
     * static text when the mode bar was built -- so the options were not
     * reachable at all. They are selects again, and now they do something:
     * the choice is carried into the views and stated wherever figures are
     * shown under it.
     */
    function basisField(label, key, values) {
      return el('div', { className: 'mode-bar__field' }, [
        C.SelectField({
          label: label,
          value: ctx[key],
          options: values.map(function (value) { return { value: value, label: value }; }),
          onChange: function (value) {
            ctx[key] = value;
            basisChanged();
          }
        })
      ]);
    }

    /**
     * Every figure on the canvas is quoted under a basis, so a change of
     * basis invalidates all of them -- unlike a change of comparison, which
     * only Impact cares about.
     */
    function basisChanged() {
      Object.keys(panes).forEach(function (key) {
        if (panes[key].parentNode) panes[key].parentNode.removeChild(panes[key]);
        delete panes[key];
      });
      renderCanvas();
      renderBasisNotice();
    }

    var basisNotice = el('div', { className: 'basis-notice', attrs: { hidden: true } });

    function renderBasisNotice() {
      var matches = ctx.basisMatchesSource();
      basisNotice.hidden = matches;
      if (matches) return;
      DA.dom.clear(basisNotice).appendChild(el('p', {
        className: 'basis-notice__text',
        text: 'Figures on this packet were sourced at ' + ctx.sourcedCostBasis +
              ' over ' + ctx.sourcedRevenueBasis + ' revenue. ' + ctx.costBasis +
              ' over ' + ctx.revenueBasis +
              ' revenue has not been sourced, so the figures below are unchanged.'
      }));
    }

    function buildModeBar() {
      return el('div', { className: 'mode-bar' }, [
      el('div', {
        className: 'modes',
        attrs: { role: 'tablist', 'aria-label': 'Workspace mode' }
      }, MODES.map(function (mode) {
        return el('button', {
          className: 'mode',
          attrs: {
            type: 'button',
            role: 'tab',
            'aria-selected': mode.id === ctx.mode ? 'true' : 'false',
            // The subtitle was a second line inside every mode button and set
            // the bar's height on its own. It reads as a tooltip instead, so
            // the modes sit at the same height as the scenario pills below.
            title: mode.label + ' — ' + mode.sub
          },
          dataset: { mode: mode.id },
          on: {
            click: function () {
              ctx.mode = mode.id;
              Array.prototype.forEach.call(modeBar.querySelectorAll('.mode'), function (node) {
                node.setAttribute('aria-selected', node.dataset.mode === ctx.mode ? 'true' : 'false');
              });
              renderCanvas();
            }
          }
        }, [el('span', { text: mode.label })]);
      })),
      el('div', { className: 'mode-bar__aside' }, [
        basisField('Cost basis', 'costBasis', DA.data.filterOptions.costBasis),
        basisField('Revenue basis', 'revenueBasis', DA.data.filterOptions.revenueBasis),
        C.Button({
          label: 'Reset',
          variant: 'ghost',
          icon: DA.icons.refresh(14),
          onClick: function () {
            ctx.costBasis = ctx.sourcedCostBasis;
            ctx.revenueBasis = ctx.sourcedRevenueBasis;
            rebuildModeBar();
            basisChanged();
          }
        })
        ])
      ]);
    }

    var modeBar = buildModeBar();

    /* ---- Dock ------------------------------------------------------------- */

    var dock = DA.workspace.Dock({
      ctx: ctx,
      onSetReference: function (index) {
        if (ctx.referenceIndex === index) return;
        ctx.referenceIndex = index;
        // The reference cannot also be one of the things compared to it.
        ctx.compareWith = ctx.compareWith.filter(function (i) { return i !== index; });
        comparisonChanged();
      },
      onToggleCompare: function (index) {
        var at = ctx.compareWith.indexOf(index);
        if (at === -1) ctx.compareWith.push(index);
        else ctx.compareWith.splice(at, 1);
        comparisonChanged();
      },
      onNewScenario: function () {
        if (options.onNewScenario) options.onNewScenario();
      },
      /**
       * Commits the lever edits to the packet.
       *
       * The edits are already written into the packet's data -- that is what
       * made them visible on the grids. What this clears is the *pending*
       * state: the count, Discard, and the claim that they are unpriced. It
       * does not invent repriced figures, because nothing here can price
       * them; that is the endpoint this waits on.
       */
      onUpdatePacket: function () {
        var count = ctx.changes.length;
        if (!count) return;
        ctx.changes.length = 0;
        dock.render();
        C.Modal({
          accent: true,
          title: 'Analyzer packet updated',
          body: count + ' lever ' + (count === 1 ? 'change is' : 'changes are') +
                ' applied to ' + ctx.reference().name + '. Repricing runs on the ' +
                'rating service, so the scenario figures above still show the ' +
                'last sourced values until it returns.'
        }).open();
      },
      onDiscard: function () {
        // Newest first, so a cell edited more than once lands back on the
        // value it actually started from.
        ctx.changes.slice().reverse().forEach(function (change) {
          if (change.revert) change.revert();
        });
        ctx.changes.length = 0;
        dock.render();
      },
      onExport: function () {
        C.Modal({
          title: 'Export analysis outcome',
          body: 'The outcome packet — scenario figures, the change set and the ' +
                'comparison against ' + ctx.reference().name + ' — is what an approver ' +
                'receives. Wiring this to the export endpoint is outstanding.'
        }).open();
      },
      onSubmit: function () {
        C.Modal({
          accent: true,
          title: 'Submit for approval',
          body: 'Submits ' + ctx.reference().name + ' to the approval queue. ' +
                'The approval rules are not defined yet, so this is the point ' +
                'the workflow hands over.'
        }).open();
      }
    });

    /** Reset changes the selects' own values, so the bar is rebuilt. */
    function rebuildModeBar() {
      var fresh = buildModeBar();
      if (modeBar.parentNode) modeBar.parentNode.replaceChild(fresh, modeBar);
      modeBar = fresh;
    }

    renderCanvas();
    renderBasisNotice();

    return el('div', { className: 'ws' }, [
      el('div', { className: 'ws__canvas' }, [modeBar, basisNotice, canvas]),
      dock.node
    ]);
  };
})(window.DA);
