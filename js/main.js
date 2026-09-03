/**
 * Application entry point — the v6 shell.
 *
 * The shell is now three fixed bands: product header, a context bar carrying
 * the packet's identity and where it sits in its lifecycle, and the screen
 * itself filling what is left. v4/v5 re-rendered a tall header per screen and
 * let each page own its own scroll, so the analyst could scroll the customer
 * name off the top of a screen full of that customer's figures.
 *
 * The context bar is white, and the stage rail beside it is the first place
 * the product has ever said out loud where a packet is in its life.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;

  var headerSlot = el('div', { className: 'app-shell__header' });
  var contextSlot = el('div');
  var viewport = el('div', { className: 'shell__body' });

  // The packet under construction, so a screen can be revisited with its state.
  var current = { packet: null };

  /*
   * A packet's lifecycle. It always had one -- the status column named it --
   * but no screen ever showed the analyst where they were in it or what came
   * next.
   */
  var STAGES = ['Customer', 'Sourced', 'Scenarios', 'Analysis', 'Approval'];

  function stageRail(activeStage) {
    var index = STAGES.indexOf(activeStage);
    return el('ol', { className: 'stages' }, STAGES.map(function (label, i) {
      return el('li', {
        className: 'stage' + (i < index ? ' is-done' : '') + (i === index ? ' is-current' : ''),
        // The label is clipped rather than removed when the bar runs out of
        // room, so a narrow window loses the visual label but never the
        // accessible name. `title` gives it back on hover.
        attrs: { 'aria-current': i === index ? 'step' : false, title: label }
      }, [
        el('span', { className: 'stage__dot' }),
        el('span', { className: 'stage__label', text: label })
      ]);
    }));
  }

  /** The context bar: who this is, and where it is. */
  function contextBar(config) {
    if (!config) return null;
    var packet = config.packet || {};

    return el('div', { className: 'context-bar' }, [
      el('div', { className: 'context-bar__identity' }, [
        el('h2', { className: 'context-bar__name', text: packet.customerName || 'New packet' }),
        el('div', { className: 'context-bar__meta' }, [
          packet.referenceNumber ? el('span', {}, [el('b', { text: packet.referenceNumber })]) : null,
          packet.packetId
            ? el('span', {}, [
                el('span', { text: 'Packet ' }),
                el('b', { text: packet.packetId })
              ])
            : null,
          packet.from ? el('span', { text: packet.from + ' – ' + packet.to }) : null
        ])
      ]),
      stageRail(config.stage),
      el('div', { className: 'context-bar__actions' }, config.actions || [])
    ]);
  }

  var views = {
    packets: {
      render: function () {
        return DA.pages.WorkQueue({
          rows: DA.data.analyzerPackets,
          currentUser: DA.session.currentUser,
          onNewPacket: function () { navigate('customer-details'); },
          onOpenPacket: function (row) {
            current.packet = DA.data.packetFromRow(row, DA.session.currentUser);
            navigate('workspace');
          }
        });
      }
    },

    'customer-details': {
      context: function () {
        return { packet: current.packet || {}, stage: 'Customer' };
      },
      render: function () {
        return DA.pages.CustomerDetailsPage({
          onBack: function () { navigate('packets'); },
          onSourceData: function (input) {
            current.packet = DA.data.buildPacket(input, DA.session.currentUser);
            navigate('create-scenarios', { showSourcingDialog: true });
          }
        });
      }
    },

    'create-scenarios': {
      /*
       * No action here. This bar carried an "Open workspace" button running
       * exactly the handler behind the page's own "Proceed to Analyzer
       * Packet" -- one screen, two primary buttons, two names, one outcome.
       * The page's action bar is where this screen's actions live, so the
       * duplicate is gone and the surviving one keeps the name that matches
       * the stage rail beside it (Scenarios -> Analysis).
       */
      context: function () {
        return {
          packet: current.packet,
          stage: 'Scenarios'
        };
      },
      render: function (params) {
        return DA.pages.CreateScenariosPage({
          packet: current.packet,
          showSourcingDialog: params.showSourcingDialog,
          // Arrived from the workspace dock's `+`.
          openCreateScenario: params.openCreateScenario,
          onBack: function () { navigate('customer-details'); },
          onOpenAccounts: function (bid, scenario) {
            navigate('account-association', { bid: bid, scenario: scenario });
          },
          onProceed: function () { listPacket(); navigate('workspace'); }
        });
      }
    },

    workspace: {
      context: function () {
        return {
          packet: current.packet,
          stage: 'Analysis',
          actions: [
            DA.components.Button({
              label: 'Scenarios',
              variant: 'ghost',
              icon: DA.icons.chevronLeft(14),
              onClick: function () { navigate('create-scenarios'); }
            }),
            DA.components.Button({
              label: 'All packets',
              variant: 'ghost',
              onClick: function () { navigate('packets'); }
            })
          ]
        };
      },
      render: function () {
        return DA.pages.PacketWorkspace({
          packet: current.packet,
          /*
           * The dock's `+` already came back to this screen, but it landed on
           * the list and left the reader to find "Create New Scenario" for
           * themselves -- the button they had just pressed, one screen back.
           * The intent travels with the navigation now, and the drawer is
           * open on arrival.
           */
          onNewScenario: function () {
            navigate('create-scenarios', { openCreateScenario: true });
          },
          onExit: function () { navigate('packets'); }
        });
      }
    },

    'account-association': {
      context: function () {
        return { packet: current.packet, stage: 'Scenarios' };
      },
      render: function (params) {
        return DA.pages.AccountAssociationPage({
          bid: params.bid,
          scenario: params.scenario,
          packet: current.packet,
          onBack: function () { navigate('create-scenarios'); }
        });
      }
    }
  };

  /**
   * Reaching the workspace is what makes a packet real enough to list -- added
   * once, so it shows under My analyzers from here on without duplicating on a
   * repeat visit.
   */
  function listPacket() {
    if (!current.packet) return;
    var listed = DA.data.analyzerPackets.some(function (row) {
      return row.packetId === current.packet.packetId;
    });
    if (!listed) {
      DA.data.analyzerPackets.unshift(
        DA.data.summarizePacket(current.packet, DA.session.currentUser)
      );
    }
  }

  function navigate(name, params) {
    var view = views[name] || views.packets;

    DA.dom.clear(headerSlot).appendChild(
      DA.components.AppHeader({
        productName: 'Digital Analyzer',
        user: DA.session.currentUser
      })
    );

    DA.dom.clear(contextSlot);
    var context = view.context ? contextBar(view.context()) : null;
    if (context) contextSlot.appendChild(context);

    DA.dom.clear(viewport).appendChild(view.render(params || {}));
    viewport.scrollTop = 0;
  }

  function mount() {
    var root = document.getElementById('app');
    if (!root) return;

    if (DA.ux && DA.ux.treeGuideRails) {
      document.documentElement.classList.add('has-tree-rails');
    }

    DA.dom.clear(root).appendChild(
      el('div', { className: 'shell' }, [headerSlot, contextSlot, viewport])
    );
    navigate('packets');
  }

  DA.app = { navigate: navigate };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})(window.DA);
