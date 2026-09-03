/**
 * Work queue — the landing screen, in two views.
 *
 * v4/v5 opened on a 15-row, 9-column table sorted by nothing in particular,
 * in which every row looked identical: same customer, same number, same dates.
 * Finding the packet you were working on meant reading ID digits.
 *
 * The two views answer genuinely different questions, which is why this is a
 * switch and not a preference:
 *
 *   CARDS  "what needs me" — grouped by what each packet is waiting for, so
 *          triage is the layout. Order is editorial, not sortable.
 *   TABLE  "let me scan and compare" — one flat, sortable grid. This is what
 *          a table is actually good at, and what the old landing screen was
 *          trying and failing to be, because it grouped nothing and sorted
 *          nothing.
 *
 * The choice is remembered per browser, since it reflects how a person works
 * rather than what they are looking at right now.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  var C = DA.components;
  DA.pages = DA.pages || {};

  var VIEW_KEY = 'da.queue.view';

  /* Groups are ordered by what the analyst can act on soonest. */
  var GROUPS = [
    {
      id: 'error', title: 'Needs attention', why: 'Sourcing failed — these cannot proceed',
      statuses: ['Error Occurred'], className: 'status--error'
    },
    {
      id: 'setup', title: 'Ready to work', why: 'Data is sourced; scenarios can be built',
      statuses: ['Scenario Setup'], className: 'status--setup'
    },
    {
      id: 'sourcing', title: 'Sourcing data', why: 'Waiting on the pipeline — nothing to do yet',
      statuses: ['Sourcing Data'], className: 'status--sourcing'
    }
  ];

  function initials(name) {
    return String(name || '')
      .replace(/^CW\d+\s*-\s*/, '')
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0); })
      .join('')
      .toUpperCase();
  }

  function ownerName(name) {
    return String(name || '').replace(/^CW\d+\s*-\s*/, '');
  }

  function groupFor(row) {
    var match = GROUPS.filter(function (group) {
      return group.statuses.indexOf(row.status) !== -1;
    })[0];
    return match || GROUPS[GROUPS.length - 1];
  }

  /** Stored view choice, tolerating a browser that refuses storage entirely. */
  function readView() {
    try {
      var saved = window.localStorage.getItem(VIEW_KEY);
      return saved === 'table' || saved === 'cards' ? saved : 'cards';
    } catch (error) {
      return 'cards';
    }
  }

  function writeView(value) {
    try {
      window.localStorage.setItem(VIEW_KEY, value);
    } catch (error) {
      /* Private windows and blocked site data; the session default still works. */
    }
  }

  /** MM/DD/YYYY as a sortable number, without pulling in a date library. */
  function dateKey(text) {
    var parts = String(text || '').split(/[\/\-]/);
    if (parts.length !== 3) return 0;
    return Number(parts[2]) * 10000 + Number(parts[0]) * 100 + Number(parts[1]);
  }

  DA.pages.WorkQueue = function WorkQueue(options) {
    options = options || {};
    var rows = options.rows || [];
    var currentUser = options.currentUser || {};
    var scope = 'all';
    var query = '';
    var view = readView();
    var sort = { key: 'packetId', direction: 'desc' };

    var body = el('div', { className: 'queue__body' });
    var liveCount = el('p', {
      className: 'u-visually-hidden',
      attrs: { role: 'status', 'aria-live': 'polite' }
    });
    var subtitle = el('p', { className: 'queue__sub' });

    function visibleRows() {
      return rows.filter(function (row) {
        if (scope === 'mine' && row.owner !== currentUser.name) return false;
        if (!query) return true;
        var haystack = [row.packetId, row.customerName, row.customerNumber, row.owner]
          .join(' ').toLowerCase();
        return haystack.indexOf(query.toLowerCase()) !== -1;
      });
    }

    /* ---- Card view -------------------------------------------------------- */

    function card(row) {
      var group = groupFor(row);
      return el('button', {
        className: 'packet-card',
        attrs: { type: 'button', 'aria-label': 'Open analyzer packet ' + row.packetId },
        on: { click: function () { if (options.onOpenPacket) options.onOpenPacket(row); } }
      }, [
        el('div', { className: 'packet-card__top' }, [
          el('span', { className: 'packet-card__id', text: row.packetId }),
          el('span', { className: 'packet-card__status ' + group.className, text: row.status })
        ]),
        el('div', { className: 'packet-card__customer', text: row.customerName }),
        el('div', { className: 'packet-card__meta' }, [
          el('span', {}, [el('b', { text: row.customerNumber })]),
          el('span', {}, [
            el('b', { text: String(row.scenarios) }),
            el('span', { text: row.scenarios === 1 ? ' scenario' : ' scenarios' })
          ]),
          el('span', { text: row.customerHierarchy })
        ]),
        el('div', { className: 'packet-card__foot' }, [
          el('span', { className: 'packet-card__owner' }, [
            el('span', { className: 'owner-dot', text: initials(row.owner) }),
            el('span', { text: ownerName(row.owner) })
          ]),
          el('span', { className: 'packet-card__go', text: 'Open →' })
        ])
      ]);
    }

    function renderCards(visible) {
      var groups = el('div', { className: 'queue__groups' });

      GROUPS.forEach(function (group) {
        var inGroup = visible.filter(function (row) { return groupFor(row) === group; });
        if (!inGroup.length) return;

        groups.appendChild(el('section', { className: 'queue-group' }, [
          el('div', { className: 'queue-group__head' }, [
            el('h3', { className: 'queue-group__title', text: group.title }),
            el('span', { className: 'queue-group__count', text: String(inGroup.length) }),
            el('span', { className: 'queue-group__why', text: group.why })
          ]),
          el('div', { className: 'queue__cards' }, inGroup.map(card))
        ]));
      });

      return groups;
    }

    /* ---- Table view ------------------------------------------------------- */

    /**
     * Sortable column header. A sortable-but-unsorted column carries the
     * neutral glyph, so the affordance is visible before the first click
     * rather than appearing only once you have already guessed.
     */
    function sortableHeader(key, label, align) {
      var active = sort.key === key;
      return function () {
        return el('button', {
          className: 'th-sort' + (active ? ' is-active' : '') + (align === 'end' ? ' is-end' : ''),
          attrs: {
            type: 'button',
            'aria-label': 'Sort by ' + label +
              (active ? (sort.direction === 'asc' ? ', currently ascending' : ', currently descending') : '')
          },
          on: {
            click: function () {
              if (sort.key === key) {
                sort.direction = sort.direction === 'asc' ? 'desc' : 'asc';
              } else {
                sort = { key: key, direction: 'asc' };
              }
              render();
            }
          }
        }, [
          el('span', { text: label }),
          DA.icons.sort(active ? sort.direction : null)
        ]);
      };
    }

    var SORT_VALUES = {
      packetId: function (row) { return Number(row.packetId) || 0; },
      customerName: function (row) { return String(row.customerName || '').toLowerCase(); },
      status: function (row) { return String(row.status || '').toLowerCase(); },
      scenarios: function (row) { return Number(row.scenarios) || 0; },
      owner: function (row) { return ownerName(row.owner).toLowerCase(); },
      lastModifiedDate: function (row) { return dateKey(row.lastModifiedDate); }
    };

    function sorted(list) {
      var read = SORT_VALUES[sort.key];
      if (!read) return list;
      var factor = sort.direction === 'asc' ? 1 : -1;
      // slice() first: the caller's array is the live packet list.
      return list.slice().sort(function (a, b) {
        var left = read(a);
        var right = read(b);
        if (left < right) return -1 * factor;
        if (left > right) return 1 * factor;
        return 0;
      });
    }

    /**
     * Column set for the row-card look: a leading owner avatar, the packet's
     * identity over its owner, the customer over its account number, then the
     * facts that separate one packet from another, and a trailing control.
     *
     * It carries exactly what the card view carries -- packet, status,
     * customer, number, scenario count, hierarchy, owner, and the way in --
     * laid on one line instead of four.
     */
    function rowCardColumns() {
      return [
        {
          key: 'avatar', label: '', width: '60px', className: 'rowcard-avatar',
          ariaLabel: 'Owner',
          render: function (row) {
            return el('span', { className: 'row-avatar', text: initials(row.owner) });
          }
        },
        {
          key: 'packetId', label: 'Packet', width: '180px',
          renderHeader: sortableHeader('packetId', 'Packet'),
          render: function (row) {
            return el('span', { className: 'cell-stack' }, [
              C.RecordLink({
                label: row.packetId,
                href: '#packet-' + row.packetId,
                ariaLabel: 'Open analyzer packet ' + row.packetId,
                onClick: function () { if (options.onOpenPacket) options.onOpenPacket(row); }
              }),
              el('span', { className: 'cell-stack__sub', text: ownerName(row.owner) })
            ]);
          }
        },
        {
          key: 'customerName', label: 'Customer', width: '205px',
          renderHeader: sortableHeader('customerName', 'Customer'),
          render: function (row) {
            return el('span', { className: 'cell-stack' }, [
              el('span', { className: 'cell-stack__lead', text: row.customerName }),
              el('span', { className: 'cell-stack__sub', text: row.customerNumber })
            ]);
          }
        },
        {
          key: 'status', label: 'Status', width: '160px',
          renderHeader: sortableHeader('status', 'Status'),
          render: function (row) {
            return el('span', {
              className: 'packet-card__status ' + groupFor(row).className,
              text: row.status
            });
          }
        },
        {
          key: 'scenarios', label: 'Scenarios', width: '105px',
          className: 'is-numeric is-end', headerClassName: 'is-end',
          renderHeader: sortableHeader('scenarios', 'Scenarios', 'end'),
          render: function (row) {
            return el('span', { className: 'cell-count' }, [
              el('b', { text: String(row.scenarios) })
            ]);
          }
        },
        { key: 'customerHierarchy', label: 'Hierarchy', width: '100px' },
        {
          key: 'lastModifiedDate', label: 'Modified', width: '115px',
          renderHeader: sortableHeader('lastModifiedDate', 'Modified')
        },
        {
          key: 'controls', label: '', width: '76px', className: 'rowcard-controls',
          ariaLabel: 'Controls',
          render: function (row) {
            return el('button', {
              className: 'row-open',
              attrs: { type: 'button', 'aria-label': 'Open analyzer packet ' + row.packetId },
              on: { click: function () { if (options.onOpenPacket) options.onOpenPacket(row); } }
            }, [DA.icons.chevronRight(15, '')]);
          }
        }
      ];
    }

    /** The bordered grid, kept behind DA.ux.queueRowCards for an easy revert. */
    function griddedColumns() {
      return [
        {
          key: 'packetId', label: 'Packet', width: '130px',
          className: 'is-rowhead',
          renderHeader: sortableHeader('packetId', 'Packet'),
          render: function (row) {
            return C.RecordLink({
              label: row.packetId,
              href: '#packet-' + row.packetId,
              ariaLabel: 'Open analyzer packet ' + row.packetId,
              onClick: function () { if (options.onOpenPacket) options.onOpenPacket(row); }
            });
          }
        },
        {
          key: 'customerName', label: 'Customer', width: '240px',
          renderHeader: sortableHeader('customerName', 'Customer'),
          render: function (row) {
            return el('span', { className: 'cell-stack' }, [
              el('span', { className: 'cell-stack__lead', text: row.customerName }),
              el('span', { className: 'cell-stack__sub', text: row.customerNumber })
            ]);
          }
        },
        {
          key: 'status', label: 'Status', width: '170px',
          renderHeader: sortableHeader('status', 'Status'),
          render: function (row) {
            return el('span', {
              className: 'packet-card__status ' + groupFor(row).className,
              text: row.status
            });
          }
        },
        {
          key: 'scenarios', label: 'Scenarios', width: '110px',
          className: 'is-numeric is-end', headerClassName: 'is-end',
          renderHeader: sortableHeader('scenarios', 'Scenarios', 'end')
        },
        { key: 'customerHierarchy', label: 'Hierarchy', width: '110px' },
        {
          key: 'owner', label: 'Owner', width: '220px',
          renderHeader: sortableHeader('owner', 'Owner'),
          render: function (row) {
            return el('span', { className: 'cell-owner' }, [
              el('span', { className: 'owner-dot', text: initials(row.owner) }),
              el('span', { text: ownerName(row.owner) })
            ]);
          }
        },
        {
          key: 'lastModifiedDate', label: 'Modified', width: '130px',
          renderHeader: sortableHeader('lastModifiedDate', 'Modified')
        }
      ];
    }

    function renderTable(visible) {
      var asRowCards = Boolean(DA.ux && DA.ux.queueRowCards);

      return el('div', {
        className: 'queue-table' + (asRowCards ? ' queue-table--rows' : '')
      }, [
        C.DataTable({
          caption: 'Analyzer packets',
          embedded: true,
          headerTone: 'warm',
          rows: sorted(visible),
          rowClassName: function () { return 'is-openable'; },
          tableClassName: asRowCards ? 'is-rowcards' : '',
          columns: asRowCards ? rowCardColumns() : griddedColumns()
        })
      ]);
    }

    /* ---- Render ----------------------------------------------------------- */

    function render() {
      var visible = visibleRows();
      DA.dom.clear(body);

      subtitle.textContent = view === 'cards'
        ? 'Grouped by what each packet is waiting for.'
        : 'Every packet, sortable on any column.';

      if (!visible.length) {
        body.appendChild(C.EmptyState({
          title: scope === 'mine' ? 'No packets owned by you' : 'No packets match that search',
          description: scope === 'mine'
            ? 'Switch to All analyzers, or start a new packet.'
            : 'Try a packet ID, customer name or owner.'
        }));
      } else {
        body.appendChild(view === 'cards' ? renderCards(visible) : renderTable(visible));
      }

      liveCount.textContent = visible.length + ' analyzer packets shown, ' + view + ' view.';

      // Table view claims the height the page has left, so the grid shows as
      // many rows as fit instead of stopping at a fixed cap with the rest of
      // the page empty beneath it. Cards flow and scroll as normal.
      page.classList.toggle('queue--fill', view === 'table');
    }

    /**
     * The view switch. Icon-only, because it changes how the same records are
     * drawn rather than which records they are -- the scope control beside it
     * is the one that changes the data, and the two should not read as
     * equivalent choices.
     */
    function viewSwitch() {
      var buttons = [
        { id: 'cards', label: 'Card view', icon: DA.icons.cards },
        { id: 'table', label: 'Table view', icon: DA.icons.rows }
      ].map(function (item) {
        var button = el('button', {
          className: 'viewswitch__option',
          dataset: { view: item.id },
          attrs: {
            type: 'button',
            'aria-pressed': item.id === view ? 'true' : 'false',
            'aria-label': item.label,
            title: item.label
          },
          on: {
            click: function () {
              if (view === item.id) return;
              view = item.id;
              writeView(view);
              Array.prototype.forEach.call(group.children, function (node) {
                node.setAttribute('aria-pressed', node.dataset.view === view ? 'true' : 'false');
              });
              render();
            }
          }
        }, [item.icon(16)]);
        return button;
      });

      var group = el('div', {
        className: 'viewswitch',
        attrs: { role: 'group', 'aria-label': 'Result layout' }
      }, buttons);
      return group;
    }

    var search = C.SearchField({
      label: 'Search analyzer packets',
      placeholder: 'Packet ID, customer or owner',
      clearable: true,
      onSearch: function (value) { query = value; render(); }
    });

    var scopeSwitch = C.SegmentedControl({
      ariaLabel: 'Packet scope',
      value: 'all',
      items: [
        { value: 'mine', label: 'My analyzers' },
        { value: 'all', label: 'All analyzers' }
      ],
      onChange: function (value) { scope = value; render(); }
    });

    var page = el('main', { className: 'queue', attrs: { id: 'main-content' } }, [
      el('div', { className: 'queue__head' }, [
        el('div', { className: 'queue__heading' }, [
          el('h2', { className: 'queue__title', text: 'Analyzer packets' }),
          subtitle
        ]),
        el('div', { className: 'queue__actions' }, [
          scopeSwitch,
          search,
          viewSwitch(),
          C.Button({
            label: 'New analyzer packet',
            variant: 'primary',
            shape: 'pill',
            icon: DA.icons.plusCircle(16),
            onClick: function () { if (options.onNewPacket) options.onNewPacket(); }
          })
        ])
      ]),
      liveCount,
      body
    ]);

    render();

    return page;
  };
})(window.DA);
