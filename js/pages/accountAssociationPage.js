/**
 * Account Association — the accounts attached to one bid in a scenario.
 *
 * Rebuilt for v6. What it replaced, and why:
 *
 *   FOUR STAT TILES, 97px each, for four single digits -- roughly 400px of
 *   viewport before the tree the analyst came for. Now one inline count
 *   strip, with the count that needs action carrying the emphasis.
 *
 *   THREE NESTED ACCORDIONS, each with its own chevron row and select-all,
 *   wrapping a separate DataTable at the leaf. Every level was a different
 *   kind of object, so a hierarchy three deep cost three kinds of chrome and
 *   two header rows. Now it is ONE expandable grid: parent, subparent and
 *   account are rows in the same table, indented, under one set of columns.
 *   The figures line up across levels, which they could not before.
 *
 *   A DISABLED "Review Changes" with nothing to review. Attaching accounts
 *   now builds a change set, the dock counts it, and the button turns on when
 *   there is something in it.
 *
 * The grid inherits everything the report grids already have: sand header,
 * row-header column, alternating rows, frozen identity columns, pinned
 * header, and the bounded frame that shows as many rows as the window allows.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  var C = DA.components;

  DA.pages = DA.pages || {};

  DA.pages.AccountAssociationPage = function AccountAssociationPage(options) {
    options = options || {};
    var bid = options.bid || {};
    var scenario = options.scenario || {};
    var tree = DA.data.accountTree;

    var query = '';
    /** Accounts attached during this visit -- what Review Changes reviews. */
    var attached = [];

    /* ---- Model ------------------------------------------------------------ */

    function accountsUnder(node) {
      if (node.kind === 'account') return [node.account];
      if (node.kind === 'group') return node.source.accounts || [];
      return DA.data.accountsIn([node.source]);
    }

    function matches(account) {
      if (!query) return true;
      return String(account.account).toLowerCase().indexOf(query.toLowerCase()) !== -1;
    }

    /**
     * Parent > subparent > account as one row set. A branch with no matching
     * account is dropped entirely rather than left as an empty heading, so
     * searching narrows the hierarchy instead of hollowing it out.
     */
    function rows() {
      return tree.map(function (parent) {
        var groups = (parent.groups || []).map(function (group) {
          var accounts = (group.accounts || []).filter(matches);
          if (!accounts.length) return null;
          return {
            kind: 'group',
            label: group.label,
            source: group,
            // Branches open by default. A hierarchy this shallow -- often one
            // parent over one subparent over one account -- would otherwise
            // show a single row and ask for two clicks to reveal the thing
            // the screen is about.
            expanded: true,
            children: accounts.map(function (account) {
              return { kind: 'account', label: account.account, account: account };
            })
          };
        }).filter(Boolean);

        if (!groups.length) return null;
        return {
          kind: 'parent', label: parent.label, source: parent,
          expanded: true, children: groups
        };
      }).filter(Boolean);
    }

    /* ---- Selection -------------------------------------------------------- */

    function selectionState(node) {
      var all = accountsUnder(node);
      if (!all.length) return 'none';
      var picked = all.filter(function (a) { return a.selected; }).length;
      if (picked === 0) return 'none';
      return picked === all.length ? 'all' : 'some';
    }

    function setSelection(node, checked) {
      accountsUnder(node).forEach(function (account) { account.selected = checked; });
      render();
    }

    function selectedCount() {
      return DA.data.accountsIn(tree).filter(function (a) { return a.selected; }).length;
    }

    /* ---- Columns ----------------------------------------------------------- */

    function typeBadge(account) {
      var isTemp = account.type === 'temporary';
      return el('span', {
        className: 'assoc-badge ' + (isTemp ? 'assoc-badge--temp' : 'assoc-badge--ups'),
        text: isTemp ? 'Temporary' : 'UPS'
      });
    }

    var COLUMNS = [
      {
        key: 'select', label: '', width: '46px',
        className: 'is-select', headerClassName: 'is-select',
        ariaLabel: 'Select',
        render: function (row) {
          var state = selectionState(row);
          return C.Checkbox({
            checked: state === 'all',
            indeterminate: state === 'some',
            ariaLabel: (row.kind === 'account' ? 'Select ' : 'Select all accounts under ') + row.label,
            onChange: function (checked) { setSelection(row, checked); }
          });
        }
      },
      {
        key: 'label', label: 'Account hierarchy', width: '340px', className: 'is-rowhead',
        render: function (row) {
          if (row.kind === 'account') {
            return el('a', {
              className: 'assoc-account',
              text: row.label,
              attrs: { href: '#account-' + row.label }
            });
          }
          var count = accountsUnder(row).length;
          return el('span', { className: 'assoc-branch' }, [
            el('span', { className: 'assoc-branch__label', text: row.label }),
            el('span', {
              className: 'assoc-branch__count',
              text: count + (count === 1 ? ' account' : ' accounts')
            })
          ]);
        }
      },
      {
        key: 'type', label: 'Type', width: '110px',
        render: function (row) { return row.kind === 'account' ? typeBadge(row.account) : ''; }
      },
      {
        key: 'adv', label: 'ADV', width: '100px',
        className: 'is-numeric is-end', headerClassName: 'is-end',
        render: function (row) {
          if (row.kind !== 'account') return '';
          return row.account.adv || '—';
        }
      },
      {
        key: 'commodityTier', label: 'Commodity Tier', width: '140px',
        className: 'is-numeric is-end', headerClassName: 'is-end',
        render: function (row) { return row.kind === 'account' ? (row.account.commodityTier || '—') : ''; }
      },
      {
        key: 'associatedBids', label: 'Associated Bids', width: '140px',
        className: 'is-numeric is-end', headerClassName: 'is-end',
        render: function (row) {
          if (row.kind !== 'account') return '';
          return el('a', {
            text: String(row.account.associatedBids),
            attrs: {
              href: '#bids',
              'aria-label': row.account.associatedBids + ' bids associated with ' + row.label
            }
          });
        }
      },
      {
        key: 'status', label: 'Status', width: '150px',
        render: function (row) {
          if (row.kind !== 'account') return '';
          var isNew = attached.indexOf(row.account) !== -1;
          if (isNew) return el('span', { className: 'assoc-badge assoc-badge--new', text: 'Newly attached' });
          return row.account.associated
            ? el('span', { className: 'assoc-status', text: 'Associated' })
            : el('span', { className: 'assoc-status assoc-status--off', text: 'Not associated' });
        }
      }
    ];

    /* ---- Grid --------------------------------------------------------------- */

    var gridMount = el('div', { className: 'assoc__grid' });

    function renderGrid() {
      var data = rows();
      DA.dom.clear(gridMount);

      if (!data.length) {
        gridMount.appendChild(C.EmptyState({
          title: 'No accounts match that search',
          description: 'Try an account number, or clear the search to see the whole hierarchy.'
        }));
        return;
      }

      gridMount.appendChild(el('div', { className: 'card' }, [
        C.DataTable({
          caption: 'Account hierarchy for ' + (bid.bidName || 'this bid'),
          embedded: true,
          headerTone: 'warm',
          tinted: true,
          // Select and the hierarchy label together identify a row, so they
          // freeze as a group -- the same treatment the report grids give
          // their identity columns.
          freezeColumns: 2,
          expandKey: 'label',
          getChildren: function (row) { return row.children; },
          rowClassName: function (row) { return 'assoc-row assoc-row--' + row.kind; },
          columns: COLUMNS,
          rows: data
        })
      ]));
    }

    /* ---- Counts ------------------------------------------------------------- */

    var countsMount = el('div', { className: 'assoc-counts' });

    function renderCounts() {
      var accounts = DA.data.accountsIn(tree);
      function count(predicate) { return accounts.filter(predicate).length; }
      var unassociated = count(function (a) { return !a.associated; });

      DA.dom.clear(countsMount);
      [
        { value: accounts.length, label: accounts.length === 1 ? 'account' : 'accounts', lead: true },
        { value: count(function (a) { return a.type === 'ups'; }), label: 'UPS' },
        { value: count(function (a) { return a.type === 'temporary'; }), label: 'temporary' },
        { value: unassociated, label: 'unassociated', warn: unassociated > 0 }
      ].forEach(function (item, index) {
        if (index) countsMount.appendChild(el('span', { className: 'assoc-counts__dot', text: '·' }));
        countsMount.appendChild(el('span', {
          className: 'assoc-counts__item' +
            (item.lead ? ' is-lead' : '') + (item.warn ? ' is-warn' : '')
        }, [
          el('b', { text: String(item.value) }),
          el('span', { text: ' ' + item.label })
        ]));
      });
    }

    /* ---- Dock --------------------------------------------------------------- */

    var dockMount = el('div', { className: 'dock assoc-dock' });

    function renderDock() {
      var picked = selectedCount();
      DA.dom.clear(dockMount);

      dockMount.appendChild(el('div', { className: 'dock__scope' }, [
        el('span', { className: 'dock__scope-k', text: 'Bid' }),
        el('span', { className: 'dock__scope-v', text: bid.bidName || '—' })
      ]));

      dockMount.appendChild(el('div', { className: 'dock__compact' }, [
        el('span', { className: 'dock__compact-metric' }, [
          el('span', { className: 'dock__k', text: 'Selected' }),
          el('span', { text: picked + ' of ' + DA.data.accountsIn(tree).length })
        ]),
        attached.length
          ? el('span', {
              className: 'dock__chip',
              text: attached.length + (attached.length === 1 ? ' account attached' : ' accounts attached')
            })
          : el('span', { className: 'dock__compact-metric' }, [
              el('span', { className: 'dock__k', text: 'Pending' }),
              el('span', { className: 'delta-flat', text: 'no changes' })
            ])
      ]));

      dockMount.appendChild(el('div', { className: 'dock__spacer' }));

      var actions = el('div', { className: 'dock__actions' });
      if (attached.length) {
        actions.appendChild(el('button', {
          className: 'dock__btn dock__btn--ghost',
          attrs: { type: 'button' },
          text: 'Discard attachments',
          on: { click: discardAttachments }
        }));
      }
      actions.appendChild(el('button', {
        className: 'dock__btn',
        attrs: { type: 'button', disabled: attached.length ? false : true },
        text: 'Review changes',
        on: { click: reviewChanges }
      }));
      dockMount.appendChild(actions);
    }

    function reviewChanges() {
      C.Modal({
        title: 'Review changes',
        body: el('div', {}, [
          el('p', {
            className: 'prose-note',
            text: attached.length + (attached.length === 1 ? ' account' : ' accounts') +
                  ' will be attached to ' + (bid.bidName || 'this bid') + ':'
          }),
          el('ul', { className: 'assoc-review' }, attached.map(function (account) {
            return el('li', { text: account.account });
          }))
        ])
      }).open();
    }

    function discardAttachments() {
      attached.slice().forEach(function (account) {
        tree.forEach(function (parent) {
          (parent.groups || []).forEach(function (group) {
            var at = group.accounts.indexOf(account);
            if (at !== -1) group.accounts.splice(at, 1);
          });
        });
      });
      // Parents and subparents created only to hold an attachment go with it.
      for (var i = tree.length - 1; i >= 0; i--) {
        tree[i].groups = (tree[i].groups || []).filter(function (g) { return g.accounts.length; });
        if (!tree[i].groups.length) tree.splice(i, 1);
      }
      attached = [];
      render();
    }

    /* ---- Attach drawer ------------------------------------------------------ */

    var attachMount = el('div', { className: 'assoc-attach' });

    function renderAttachList() {
      DA.dom.clear(attachMount);

      var candidates = DA.data.attachableAccounts.map(function (parent) {
        return {
          kind: 'parent', label: parent.label, source: parent, expanded: true,
          children: (parent.groups || []).map(function (group) {
            return {
              kind: 'group', label: group.label, source: group, expanded: true,
              children: (group.accounts || []).map(function (account) {
                return { kind: 'account', label: account.account, account: account };
              })
            };
          })
        };
      });

      attachMount.appendChild(el('div', { className: 'card' }, [
        C.DataTable({
          caption: 'Accounts available to attach',
          embedded: true,
          headerTone: 'warm',
          tinted: true,
          framed: false,
          expandKey: 'label',
          getChildren: function (row) { return row.children; },
          rowClassName: function (row) { return 'assoc-row assoc-row--' + row.kind; },
          columns: [
            {
              key: 'select', label: '', width: '46px',
              className: 'is-select', headerClassName: 'is-select', ariaLabel: 'Select',
              render: function (row) {
                var state = selectionState(row);
                return C.Checkbox({
                  checked: state === 'all',
                  indeterminate: state === 'some',
                  ariaLabel: 'Select ' + row.label,
                  onChange: function (checked) {
                    accountsUnder(row).forEach(function (a) { a.selected = checked; });
                    renderAttachList();
                  }
                });
              }
            },
            {
              key: 'label', label: 'Available accounts', className: 'is-rowhead',
              render: function (row) {
                if (row.kind === 'account') return row.label;
                var n = accountsUnder(row).length;
                return el('span', { className: 'assoc-branch' }, [
                  el('span', { className: 'assoc-branch__label', text: row.label }),
                  el('span', { className: 'assoc-branch__count', text: n + (n === 1 ? ' account' : ' accounts') })
                ]);
              }
            }
          ],
          rows: candidates
        })
      ]));
    }

    /** Moves every checked candidate into the real tree, creating its
        parent/subparent there if this is the first account under them. */
    function applyAttach() {
      DA.data.attachableAccounts.forEach(function (parent) {
        (parent.groups || []).forEach(function (group) {
          var picked = (group.accounts || []).filter(function (a) { return a.selected; });
          if (!picked.length) return;

          var targetParent = tree.filter(function (p) { return p.label === parent.label; })[0];
          if (!targetParent) {
            targetParent = { label: parent.label, groups: [] };
            tree.push(targetParent);
          }
          var targetGroup = targetParent.groups.filter(function (g) { return g.label === group.label; })[0];
          if (!targetGroup) {
            targetGroup = { label: group.label, accounts: [] };
            targetParent.groups.push(targetGroup);
          }

          picked.forEach(function (candidate) {
            var record = {
              account: candidate.account,
              adv: '',
              commodityTier: '—',
              associatedBids: 0,
              type: 'ups',
              associated: true
            };
            targetGroup.accounts.push(record);
            attached.push(record);
            candidate.selected = false;
          });
        });
      });
    }

    function openAttach(trigger) {
      renderAttachList();
      var drawer = C.Modal({
        variant: 'drawer',
        title: 'Attach accounts',
        returnFocusTo: trigger,
        body: el('div', { className: 'drawer-form' }, [
          C.Alert({ plain: true, message: 'Pick the accounts to attach to this bid. Nothing is committed until you review the changes.' }),
          attachMount,
          el('div', { className: 'drawer-form__actions' }, [
            C.Button({
              label: 'Attach selected', variant: 'primary', shape: 'pill',
              onClick: function () { applyAttach(); drawer.close(); render(); }
            }),
            C.Button({
              label: 'Clear', variant: 'link',
              onClick: function () {
                DA.data.attachableAccounts.forEach(function (p) {
                  DA.data.accountsIn([p]).forEach(function (a) { a.selected = false; });
                });
                renderAttachList();
              }
            })
          ])
        ])
      });
      drawer.open();
    }

    /* ---- Composition --------------------------------------------------------- */

    function render() {
      renderGrid();
      renderCounts();
      renderDock();
    }

    var search = C.SearchField({
      id: 'account-search',
      label: 'Search accounts',
      placeholder: 'Account number',
      clearable: true,
      onSearch: function (value) { query = value; renderGrid(); }
    });

    var attachLink = C.Button({
      label: 'Attach accounts',
      variant: 'primary',
      shape: 'pill',
      icon: DA.icons.plusCircle(16),
      onClick: function () { openAttach(attachLink); }
    });

    render();

    return el('main', { className: 'assoc', attrs: { id: 'main-content' } }, [
      el('div', { className: 'assoc__head' }, [
        el('div', { className: 'assoc__identity' }, [
          el('h2', { className: 'assoc__title', text: 'Account association' }),
          el('p', { className: 'assoc__sub' }, [
            el('span', { text: (bid.bidNumber || '') + (bid.bidNumber ? ' · ' : '') }),
            el('b', { text: bid.bidName || 'Bid' }),
            el('span', { text: '  in  ' }),
            el('b', { text: scenario.title || scenario.name || 'scenario' })
          ]),
          countsMount
        ]),
        el('div', { className: 'assoc__actions' }, [
          search,
          attachLink,
          C.Button({
            label: 'Back to scenarios',
            variant: 'ghost',
            icon: DA.icons.chevronLeft(14),
            onClick: function () { if (options.onBack) options.onBack(); }
          })
        ])
      ]),
      gridMount,
      dockMount
    ]);
  };
})(window.DA);
