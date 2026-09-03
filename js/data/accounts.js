/**
 * Accounts associated with a bid — demo data transcribed from the reference
 * screen, grouped parent > subparent > account.
 *
 * `type` and `associated` drive the counts above the tree, so the tiles stay
 * true to the rows rather than being written down twice.
 */
(function (DA) {
  'use strict';

  DA.data = DA.data || {};

  DA.data.accountTree = [
    {
      label: '0007756010-HORMEL',
      groups: [
        {
          label: 'No Subparent',
          accounts: [
            {
              account: '0000067577-APPLEGATE FARMS',
              adv: '',
              commodityTier: '03',
              associatedBids: 3,
              type: 'ups',
              associated: true
            }
          ]
        }
      ]
    }
  ];

  /**
   * Candidate accounts the Attach Account drawer offers -- not yet under any
   * bid, so they carry no adv/commodityTier/associatedBids figures the way a
   * real attached account does. Same parent > subparent > account shape as
   * accountTree, so attaching one is just moving it across into that tree.
   */
  DA.data.attachableAccounts = [
    {
      label: '0003197010-STAMPIN UP',
      groups: [
        {
          label: 'No Subparent',
          accounts: [
            { account: '00002645V7-EVENTS STAMPIN UP', selected: true },
            { account: '00002670V7-AWARDS STAMPIN UP INC' },
            { account: '000083E306-STAMPINUP' },
            { account: '0000AW0689-STAMPIN UP INC' },
            { account: '0000RW6482-STAMPINUP' },
            { account: '0000V56H17-STAMPINUP' }
          ]
        }
      ]
    }
  ];

  /** Flattens the tree to the accounts it contains. */
  DA.data.accountsIn = function accountsIn(tree) {
    return (tree || []).reduce(function (accounts, parent) {
      return accounts.concat((parent.groups || []).reduce(function (inner, group) {
        return inner.concat(group.accounts || []);
      }, []));
    }, []);
  };
})(window.DA);
