/**
 * Create Scenarios and Analyzer Packet — step two of the workflow.
 *
 * Reached from "Source Data" on the Customer Details form, which arrives with
 * the sourcing-in-progress dialog open. Shows the packet that was created, its
 * scenarios, and the route onward to the analyzer packet.
 *
 * ---------------------------------------------------------------------------
 * v6 rebuild. Three things were wrong with the screen, all of them structural:
 *
 * 1. The summary panel repeated the context bar. Customer name, reference
 *    number, packet ID and the shipping window were printed twice, about two
 *    inches apart, in 248px of panel. The bar above is permanent chrome, so
 *    the panel's copies were the redundant ones.
 *
 * 2. Every scenario was a section with its own header row, a summary row, and
 *    a third row that existed only to say "Expand To Find Bid Details" -- 158px
 *    of chrome around one line of facts. The analyzer list had already solved
 *    exactly this: one row card per record, expandable.
 *
 * 3. The page's actions sat at the bottom of the content, below the fold at a
 *    900px window, while a *second* copy of the primary action ("Open
 *    workspace") sat in the context bar running the same handler.
 *
 * The workspace's brown bar is the answer to the third: a persistent band that
 * holds the state of the thing and the action that commits it. It is the same
 * band here.
 * ---------------------------------------------------------------------------
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;

  DA.pages = DA.pages || {};

  DA.pages.CreateScenariosPage = function CreateScenariosPage(options) {
    options = options || {};
    var C = DA.components;
    var packet = options.packet || {};
    var scenarios = packet.scenarios || [];
    var owner = packet.owner || '';

    /* =====================================================================
       1. Packet header
       =====================================================================
       Everything the context bar already says is dropped -- customer name,
       reference number, packet ID, shipping window. What is left is the seven
       facts that appear nowhere else, on one strip of caption-over-value
       pairs, plus the description.

       Owner and Last Modified By hold the same value on a packet this new,
       and so do the two dates. They are not deduplicated: they diverge the
       moment somebody else touches the packet, and a field that vanishes when
       two values happen to agree is worse than one that repeats.
       ===================================================================== */

    function fact(label, value) {
      return el('div', { className: 'packet-fact' }, [
        el('span', { className: 'packet-fact__k', text: label }),
        el('span', {
          className: 'packet-fact__v' + (value ? '' : ' is-empty'),
          text: value || '—',
          attrs: { title: value || null }
        })
      ]);
    }

    /** Two sparse, optional linked-record IDs, paired rather than each taking
        a slot for what is usually just a dash. */
    function linkedRecords() {
      var pqr = packet.pqr || '—';
      var opps = packet.opps || '—';
      return 'PQR ' + pqr + ' · OPPs ' + opps;
    }

    var packetHeader = el('section', {
      className: 'packet-head',
      attrs: { 'aria-label': 'Analyzer packet details' }
    }, [
      el('div', { className: 'packet-head__facts' }, [
        fact('Hierarchy', packet.hierarchy),
        fact('Industry', packet.industry),
        fact('Linked records', linkedRecords()),
        fact('Owner', owner),
        fact('Created', packet.createdAt),
        fact('Last modified by', packet.lastModifiedBy || owner),
        fact('Last modified', packet.lastModifiedAt)
      ]),
      packet.description
        ? el('p', { className: 'packet-head__desc' }, [
            el('span', { className: 'packet-fact__k', text: 'Description' }),
            el('span', { text: packet.description })
          ])
        : null
    ]);

    /* =====================================================================
       2. Scenarios, as the analyzer list's row cards
       =====================================================================
       One card per scenario, expanding onto its bid table. The chrome that
       used to wrap each scenario -- a header bar for the title and two links,
       and a row whose whole job was to advertise the expander -- is gone: the
       title is the first column, the expander is the chevron every row card
       in the product already carries, and the two links moved into the panel
       they belong to.
       ===================================================================== */

    /*
     * Only `scen-table`. The row-card look travels on the table itself now
     * (`tableClassName: 'is-rowcards'`), so the queue's wrapper classes are
     * not needed -- and carrying them would push the queue's own 44px row
     * height onto the bid grid nested inside a scenario's panel.
     */
    var scenarioMount = el('div', { className: 'scen-table' });

    /** The bid grid for one scenario, plus the actions scoped to that scenario. */
    function bidColumns(scenario) {
      var columns = [
        {
          key: 'select',
          label: 'Select',
          width: '48px',
          className: 'is-select',
          headerClassName: 'is-select',
          renderHeader: function () {
            var all = scenario.bids.every(function (bid) {
              return !bid.selectable || bid.selected;
            });
            return C.Checkbox({
              checked: all,
              ariaLabel: 'Select all bids in ' + scenario.title,
              onChange: function (checked) {
                scenario.bids.forEach(function (bid) {
                  if (bid.selectable) bid.selected = checked;
                });
                renderScenarios();
              }
            });
          },
          render: function (bid) {
            if (!bid.selectable) return el('span');
            return C.Checkbox({
              checked: bid.selected,
              ariaLabel: 'Include bid ' + bid.bidNumber,
              onChange: function (checked) {
                bid.selected = checked;
                renderBar();
              }
            });
          }
        },
        { key: 'bidNumber', label: 'Bid Number', width: '125px' },
        // Bid Name is left unsized so it absorbs the remaining width.
        { key: 'bidName', label: 'Bid Name' },
        {
          key: 'shippingProfile',
          label: 'Shipping Profile',
          width: '175px',
          className: scenario.editable ? '' : 'is-muted',
          render: scenario.editable
            ? function (bid) {
                return el('a', {
                  text: bid.shippingProfile,
                  attrs: { href: '#profile-' + bid.shippingProfile },
                  on: {
                    click: function (event) {
                      event.preventDefault();
                      DA.dialogs.ShippingProfileDialog(bid, scenario, packet).open();
                    }
                  }
                });
              }
            : null
        },
        { key: 'construct', label: 'Construct', width: '110px' }
      ];

      if (scenario.editable) {
        columns.push({
          key: 'accountAssociation',
          label: 'Account Association',
          width: '190px',
          render: function (bid) {
            if (!bid.selectable) return el('span');
            return el('a', {
              className: 'link-with-icon',
              attrs: {
                href: '#accounts-' + bid.bidNumber,
                'aria-label': 'Accounts associated with bid ' + bid.bidNumber
              },
              on: {
                click: function (event) {
                  event.preventDefault();
                  if (options.onOpenAccounts) options.onOpenAccounts(bid, scenario);
                }
              }
            }, [el('span', { text: 'Accounts' }), DA.icons.settings(14)]);
          }
        });
      }

      return columns;
    }

    /** Drawer: simulate a new bid into a scenario's table. */
    function openSimulateBid(scenario, trigger) {
      function updateContinueState() {
        var ready = Boolean(bidNumberField.input.value.trim()) &&
                    Boolean(bidNameField.input.value.trim());
        continueButton.disabled = !ready;
      }

      var bidNumberField = C.Field({ label: 'Enter Bid Number *', onInput: updateContinueState });
      var bidNameField = C.Field({ label: 'Bid Name *', onInput: updateContinueState });

      var continueButton = C.Button({
        label: 'Continue',
        variant: 'primary',
        shape: 'pill',
        icon: DA.icons.chevronRight(14, ''),
        iconPosition: 'end',
        disabled: true,
        onClick: function () {
          // Every bid's Structure Details reads from the same shared source
          // set (see scenarioBids.js) -- a simulated one is no different.
          var sharedSource = DA.data.scenarioBids[0] && DA.data.scenarioBids[0].serviceSource;
          scenario.bids.push({
            bidNumber: bidNumberField.input.value,
            bidName: bidNameField.input.value,
            shippingProfile: 'S' + scenario.number + '-UPS-PLD-' + (scenario.bids.length + 1),
            construct: 'Daily',
            selectable: true,
            selected: true,
            serviceSource: sharedSource
          });
          drawer.close();
          renderScenarios();
        }
      });

      var drawer = C.Modal({
        variant: 'drawer',
        title: 'Copy a Bid to Scenario',
        returnFocusTo: trigger,
        body: el('div', { className: 'drawer-form' }, [
          el('p', { className: 'drawer-form__legend', text: '* Indicates required field.' }),
          bidNumberField,
          bidNameField,
          el('div', { className: 'drawer-form__actions' }, [
            continueButton,
            C.Button({ label: 'Cancel', variant: 'link', onClick: function () { drawer.close(); } })
          ])
        ])
      });

      drawer.open();
    }

    /**
     * A scenario's panel: its bid grid, and the actions that belong to this
     * scenario and no other.
     *
     * This is where the row-scoped actions live, and the reason they are not
     * in the bar at the bottom: "Save" in a bar under a list of scenarios
     * cannot say which one it saves.
     */
    function scenarioDetail(scenario) {
      var simulateLink = el('a', {
        className: 'link-with-icon',
        attrs: { href: '#simulate-' + scenario.title }
      }, [DA.icons.plusCircle(18), el('span', { text: 'Simulate New Bid' })]);
      simulateLink.addEventListener('click', function (event) {
        event.preventDefault();
        openSimulateBid(scenario, simulateLink);
      });

      return el('div', { className: 'scen-detail' }, [
        C.DataTable({
          caption: 'Bids sourced for ' + scenario.title,
          embedded: true,
          headerTone: 'warm',
          columns: bidColumns(scenario),
          rows: scenario.bids
        }),
        el('div', { className: 'scen-detail__actions' }, [
          scenario.editable ? simulateLink : null,
          el('div', { className: 'scen-detail__spacer' }),
          C.Button({
            label: 'Download Scenario Summary',
            variant: 'quiet-link',
            icon: DA.icons.download(18)
          }),
          scenario.editable
            ? C.Button({ label: 'Update Description', variant: 'link' })
            : null,
          scenario.editable
            ? C.Button({ label: 'Save', variant: 'outline', shape: 'pill' })
            : null
        ])
      ]);
    }

    function scenarioColumns() {
      return [
        {
          key: 'include',
          label: 'Include',
          width: '52px',
          className: 'scen-col-include',
          renderHeader: function () {
            return el('span', { className: 'u-visually-hidden', text: 'Include in the packet' });
          },
          render: function (scenario) {
            return C.Checkbox({
              checked: scenario.included !== false,
              ariaLabel: 'Include ' + scenario.title + ' in this packet',
              onChange: function (checked) {
                scenario.included = checked;
                renderBar();
              }
            });
          }
        },
        {
          key: 'title',
          label: 'Scenario',
          render: function (scenario) {
            return el('div', { className: 'cell-stack' }, [
              el('span', { className: 'cell-stack__lead', text: scenario.title }),
              scenario.description
                ? el('span', {
                    className: 'cell-stack__sub',
                    text: scenario.description,
                    attrs: { title: scenario.description }
                  })
                : null
            ]);
          }
        },
        {
          key: 'bids',
          label: 'Bids',
          width: '110px',
          render: function (scenario) {
            var included = scenario.bids.filter(function (bid) {
              return !bid.selectable || bid.selected;
            }).length;
            return el('span', { className: 'cell-count' }, [
              el('b', { text: String(included) }),
              el('span', { text: ' of ' + scenario.bids.length })
            ]);
          }
        },
        { key: 'createdDate', label: 'Created', width: '120px' },
        { key: 'lastModified', label: 'Last modified', width: '130px' },
        {
          key: 'status',
          label: 'Status',
          width: '175px',
          render: function (scenario) {
            return C.StatusBadge(scenario.status, { pill: true });
          }
        }
      ];
    }

    function renderScenarios() {
      DA.dom.clear(scenarioMount).appendChild(C.DataTable({
        caption: 'Scenarios in this analyzer packet',
        embedded: true,
        // The row-card look is this table's, and stops here: the bid grid
        // inside a scenario's panel is an ordinary grid.
        tableClassName: 'is-rowcards',
        /*
         * No frame. A framed table caps itself at 58vh and scrolls inside
         * that, which is right for a report grid of fixed height and wrong
         * here: expanding a scenario should make the page longer, not open a
         * second scrollbar inside a page that already has one. The list grows
         * and `.page--docked__scroll` carries it.
         */
        framed: false,
        columns: scenarioColumns(),
        rows: scenarios,
        expandKey: 'title',
        renderDetail: scenarioDetail
      }));
      renderBar();
    }

    /** Drawer: copy an existing scenario into a new one. */
    function openCreateScenario(trigger) {
      var nextIndex = scenarios.length;

      var copyFrom = C.SelectField({
        label: 'Choose Scenario to Copy',
        value: scenarios[0].title,
        options: scenarios.map(function (scenario) {
          return { value: scenario.title, label: scenario.title };
        })
      });

      var nameField = C.Field({ label: 'Scenario Name', value: 'Scenario ' + nextIndex });
      var descriptionField = C.Field({ label: 'Scenario Description', multiline: true });

      var drawer = C.Modal({
        variant: 'drawer',
        title: 'Create New Scenario',
        returnFocusTo: trigger,
        body: el('div', { className: 'drawer-form' }, [
          C.Alert({
            plain: true,
            message: 'Choose an existing Scenario to copy to create a new scenario.'
          }),
          copyFrom,
          nameField,
          descriptionField,
          el('div', { className: 'drawer-form__actions' }, [
            C.Button({
              label: 'Save',
              variant: 'primary',
              shape: 'pill',
              onClick: function () {
                var source = scenarios.filter(function (scenario) {
                  return scenario.title === copyFrom.getValue();
                })[0] || scenarios[0];

                // The new scenario opens; the others fold away behind it.
                scenarios.forEach(function (scenario) { scenario.expanded = false; });
                scenarios.push(DA.data.copyScenario(
                  source,
                  nextIndex,
                  nameField.input.value || 'Scenario ' + nextIndex,
                  descriptionField.input.value
                ));

                drawer.close();
                renderScenarios();
              }
            })
          ])
        ])
      });

      drawer.open();
    }

    /* =====================================================================
       3. The action bar
       =====================================================================
       The workspace's brown band, on this screen. What earned a place on it
       is one rule:

         The bar carries actions whose scope is the whole page. Anything
         scoped to a single row stays on that row.

       So Back, Create New Scenario and Proceed are here, and Save, Download
       Scenario Summary, Update Description and Simulate New Bid are not --
       each of those acts on one scenario, and a bar under a list of scenarios
       cannot say which one it means.

       The bar also states what it is about to carry forward, the way the
       workspace dock states what is being compared. Without that, "Proceed"
       is a button with no subject.
       ===================================================================== */

    var barState = el('div', { className: 'page-dock__state' });

    var createScenarioButton = el('button', {
      className: 'dock__btn dock__btn--ghost',
      attrs: { type: 'button' },
      text: 'Create New Scenario',
      on: { click: function () { openCreateScenario(createScenarioButton); } }
    });

    var proceedButton = el('button', {
      className: 'dock__btn dock__btn--commit',
      attrs: { type: 'button' },
      on: { click: function () { if (options.onProceed) options.onProceed(); } }
    }, [el('span', { text: 'Proceed to Analyzer Packet' })]);

    function renderBar() {
      var included = scenarios.filter(function (s) { return s.included !== false; });
      var bids = included.reduce(function (total, s) {
        return total + s.bids.filter(function (b) { return !b.selectable || b.selected; }).length;
      }, 0);

      DA.dom.clear(barState).appendChild(el('span', {
        className: 'dock__scope-k',
        text: 'Carrying forward'
      }));
      barState.appendChild(el('span', {
        className: 'dock__scope-v',
        text: included.length + (included.length === 1 ? ' scenario' : ' scenarios') +
              ' · ' + bids + (bids === 1 ? ' bid' : ' bids')
      }));

      /*
       * A packet with nothing in it cannot proceed. Same rule as the
       * workspace's commit: plainly inert rather than live-looking and
       * unresponsive, and the tooltip says which it is.
       */
      var ready = included.length > 0 && bids > 0;
      proceedButton.disabled = !ready;
      proceedButton.setAttribute('title', ready
        ? 'Open the analyzer packet with ' + included.length +
          (included.length === 1 ? ' scenario' : ' scenarios')
        : 'Include at least one scenario with a selected bid');
    }

    var actionBar = el('div', {
      className: 'page-dock',
      attrs: { role: 'region', 'aria-label': 'Packet actions' }
    }, [
      el('button', {
        className: 'page-dock__back',
        attrs: { type: 'button' },
        on: { click: function () { if (options.onBack) options.onBack(); } }
      }, [DA.icons.chevronLeft(14), el('span', { text: 'Back' })]),
      barState,
      el('div', { className: 'dock__spacer' }),
      createScenarioButton,
      proceedButton
    ]);

    /* ---- Composition ------------------------------------------------------ */

    renderScenarios();

    var page = el('main', {
      className: 'page page--docked',
      attrs: { id: 'main-content' }
    }, [
      el('div', { className: 'page--docked__scroll' }, [
        packetHeader,
        C.Alert({ message: 'Active Bids sourced for existing customers' }),
        scenarioMount
      ]),
      actionBar
    ]);

    /*
     * Arrived from the workspace dock's `+`. Opening on the next tick rather
     * than inline: the page is still being composed here, and the drawer
     * returns focus to the button it was opened from when it closes -- which
     * has to be in the document by then.
     */
    if (options.openCreateScenario) {
      window.setTimeout(function () { openCreateScenario(createScenarioButton); }, 0);
    }

    if (options.showSourcingDialog) {
      window.setTimeout(function () {
        C.Modal({
          accent: true,
          title: 'Sourcing Data is in progress',
          body:
            'Sourcing Data is in progress. The links will be enabled after the ' +
            'process is complete. Thank you for your patience.'
        }).open();
      }, 0);
    }

    return page;
  };
})(window.DA);
