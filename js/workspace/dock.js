/**
 * The scenario bar — the workspace's persistent bottom bar.
 *
 * This is the single most important structural change in v6. In v4/v5 the
 * consequence of a change lived in the "Analyzer" tab and the change itself
 * lived in "Pricing Terms" -- siblings, so the analyst could never see cause
 * and effect at the same time. The dock makes impact *chrome*: it is pinned
 * under every mode, so moving a lever and reading its effect costs zero
 * navigation.
 *
 * It is also the only dark surface in the product, which is precisely the
 * licence the colour system grants -- dark where an action commits.
 *
 * It carried the comparison figures and the commit actions until Impact grew
 * a card per scenario showing the same metrics -- a second copy directly under
 * them was restating the answer, so the bar is the scenario switcher now.
 *
 * What stayed is the lever change set, because nothing else counts it or
 * offers a way back. It appears only when there is something to undo.
 *
 * It does not collapse. It carried a pull tab on its gold rule and a slim
 * collapsed strip, which was always in tension with the reason the bar exists
 * -- impact as permanent chrome. A control whose whole purpose is to hide the
 * thing the design is built around is a control worth removing; the bar is
 * 42px and earns them.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  DA.workspace = DA.workspace || {};

  /** Direction of good is declared per metric, never taken from the sign. */
  var METRICS = [
    { key: 'profit', label: 'Profit', favourable: true },
    { key: 'or', label: 'Op ratio', favourable: false },
    { key: 'totalDisc', label: 'Total disc', favourable: false },
    { key: 'revenue', label: 'Revenue', favourable: true }
  ];

  function tone(value, favourable) {
    var n = DA.figures.toNumber(value);
    if (n == null || n === 0) return 'flat';
    return (favourable ? n > 0 : n < 0) ? 'up' : 'down';
  }

  DA.workspace.tone = tone;
  DA.workspace.dockMetrics = METRICS;

  /**
   * The figures for a scenario, following the copy chain.
   *
   * A scenario created by copying another is identical to it until a lever
   * moves, so where it has no sourced figures of its own it reads its
   * source's. `inheritedFrom` names that source so the UI can say so rather
   * than passing the numbers off as this scenario's own.
   */
  DA.workspace.figuresFor = function figuresFor(scenarios, name) {
    var seen = {};
    var at = name;
    while (at && !seen[at]) {
      if (DA.data.scenarioFigures[at]) {
        return {
          figures: DA.data.scenarioFigures[at],
          inheritedFrom: at === name ? null : at
        };
      }
      seen[at] = true;
      var match = (scenarios || []).filter(function (s) { return s.name === at; })[0];
      at = match && match.copiedFrom;
    }
    return { figures: {}, inheritedFrom: null, missing: true };
  };

  /**
   * The change in one metric between any two scenarios.
   *
   * A recorded difference is preferred wherever the data set has one -- the
   * displayed figures are rounded, so subtracting them lands a unit off on
   * Total Disc and Profit. Only where nothing is recorded is the difference
   * derived, which is the same rule the v4 comparison band followed. Since a
   * comparison can now be anchored on any scenario, not only the baseline,
   * the recorded pair is looked up in both directions and negated if it is
   * held the other way round.
   */
  DA.workspace.figureDelta = function figureDelta(scenarios, fromName, toName, key) {
    if (!fromName || !toName || fromName === toName) return null;

    var recorded = DA.data.scenarioDifferences[fromName + '|' + toName];
    if (recorded && recorded[key] != null) return recorded[key];

    var reversed = DA.data.scenarioDifferences[toName + '|' + fromName];
    if (reversed && reversed[key] != null) {
      var n = DA.figures.toNumber(reversed[key]);
      if (n != null) return DA.figures.format(-n, DA.figures.shapeOf(reversed[key]));
    }

    var a = DA.workspace.figuresFor(scenarios, fromName).figures;
    var b = DA.workspace.figuresFor(scenarios, toName).figures;
    if (a[key] == null || b[key] == null) return null;
    return DA.figures.difference(a[key], b[key]);
  };

  /** "S1" where a scenario carries an index, otherwise its name. */
  DA.workspace.shortName = function shortName(scenario) {
    if (!scenario) return '—';
    if (typeof scenario.number === 'number') return 'S' + scenario.number;
    return scenario.name;
  };

  /**
   * options: { ctx, onSetReference, onToggleCompare, onNewScenario, onDiscard }
   *
   * The dock is the scenario switcher: pills for the packet's scenarios and
   * Create scenario, in one row. It used to carry the comparison figures and
   * the commit actions too, but Impact now shows those figures per scenario
   * on its own cards, so a second copy under them was restating the answer.
   */
  DA.workspace.Dock = function Dock(options) {
    var ctx = options.ctx;

    var node = el('div', {
      className: 'dock',
      attrs: { role: 'region', 'aria-label': 'Scenarios' }
    });

    /**
     * The scenarios, as pills across the dock.
     *
     * They used to be a 248px rail down the left of the workspace, permanently
     * holding a column of vertical space for what is a short list of short
     * names. Putting them in the dock hands that width back to the grids and
     * sits the scenarios next to the figures they drive.
     *
     * Each pill keeps the rail's two controls: the body sets the reference,
     * the tick adds the scenario to what is measured against it.
     */
    function scenarioStrip() {
      var scenarios = ctx.scenarios;
      var row = el('div', { className: 'dock__scenarios' }, [
        el('span', { className: 'dock__scope-k', text: 'Scenarios' })
      ]);

      var list = el('div', {
        className: 'scen-pills',
        attrs: { role: 'group', 'aria-label': 'Scenarios in this packet' }
      });

      scenarios.forEach(function (scenario, index) {
        var isReference = index === ctx.referenceIndex;
        var isCompared = ctx.compareWith.indexOf(index) !== -1;
        var figures = DA.workspace.figuresFor(scenarios, scenario.name).figures;
        var delta = isReference
          ? null
          : DA.workspace.figureDelta(scenarios, ctx.reference().name, scenario.name, 'profit');
        var direction = delta ? tone(delta, true) : 'flat';

        var pill = el('div', {
          className: 'scen-pill' +
            (isReference ? ' is-reference' : '') +
            (isCompared ? ' is-compared' : '')
        });

        pill.appendChild(el('button', {
          className: 'scen-pill__main',
          attrs: {
            type: 'button',
            'aria-pressed': isReference ? 'true' : 'false',
            'aria-label': 'Use ' + scenario.name + ' as the comparison reference'
          },
          on: { click: function () { if (options.onSetReference) options.onSetReference(index); } }
        }, [
          el('span', { className: 'scen-pill__name', text: scenario.name }),
          el('span', {
            className: 'scen-pill__figure',
            text: figures.profit == null ? '—' : String(figures.profit)
          }),
          delta && delta !== '-'
            ? el('span', {
                className: 'scen-pill__delta delta-' + direction,
                text: (direction === 'flat' ? '' : (DA.figures.toNumber(delta) > 0 ? '▲ ' : '▼ ')) + delta
              })
            : null
        ]));

        pill.appendChild(isReference
          ? el('span', {
              className: 'scen-pill__anchor',
              attrs: { title: 'Every delta is measured from here' },
              text: 'vs'
            })
          : el('button', {
              className: 'scen-pill__pick',
              attrs: {
                type: 'button',
                role: 'checkbox',
                'aria-checked': isCompared ? 'true' : 'false',
                'aria-label': 'Compare ' + scenario.name + ' against ' + ctx.reference().name
              },
              on: { click: function () { if (options.onToggleCompare) options.onToggleCompare(index); } }
            }, [DA.icons.check(12)]));

        list.appendChild(pill);
      });

      /*
       * Adding a scenario belongs beside the scenarios, not across the bar
       * from them -- it extends the list it sits at the end of.
       */
      list.appendChild(el('button', {
        className: 'scen-add',
        attrs: { type: 'button', 'aria-label': 'Create a new scenario', title: 'Create scenario' },
        on: { click: function () { if (options.onNewScenario) options.onNewScenario(); } }
      }, [DA.icons.plus(14)]));

      row.appendChild(list);
      row.appendChild(el('div', { className: 'dock__spacer' }));

      /*
       * The comparison figures and the commit actions moved out of here --
       * Impact already carries the figures per scenario. What has no other
       * home is the lever change set: without it an edit gives no count and
       * no way back. It shows only when there is something to show, so the
       * resting dock is the scenarios and nothing else.
       */
      var changes = ctx.changes || [];
      if (changes.length) {
        row.appendChild(el('span', {
          className: 'dock__chip',
          text: changes.length + ' unpriced ' + (changes.length === 1 ? 'change' : 'changes')
        }));
        row.appendChild(el('button', {
          className: 'dock__btn dock__btn--ghost',
          attrs: { type: 'button' },
          text: 'Discard',
          on: { click: function () { if (options.onDiscard) options.onDiscard(); } }
        }));
      }

      /*
       * The commit. It is the only thing on this bar that changes the packet
       * rather than what is being looked at, so it stays disabled until there
       * is something to commit -- a live button with nothing behind it is a
       * worse promise than a dead one.
       */
      row.appendChild(el('button', {
        className: 'dock__btn dock__btn--commit',
        attrs: {
          type: 'button',
          disabled: changes.length ? false : true,
          title: changes.length
            ? 'Apply ' + changes.length + ' lever ' + (changes.length === 1 ? 'change' : 'changes') +
              ' to this packet'
            : 'No lever changes to apply'
        },
        on: { click: function () { if (options.onUpdatePacket) options.onUpdatePacket(); } }
      }, [el('span', { text: 'Update Analyzer Packet' })]));

      return row;
    }

    function render() {
      DA.dom.clear(node);
      node.appendChild(scenarioStrip());
    }

    render();
    return { node: node, render: render };
  };
})(window.DA);
