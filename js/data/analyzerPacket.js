/**
 * Analyzer packet report data — demo figures transcribed from the reference
 * screens. `{customer}` is replaced with the packet's customer at render, so
 * the report reads as one record end to end.
 */
(function (DA) {
  'use strict';

  DA.data = DA.data || {};

  /** Figures behind the comparison band, one set per scenario. */
  DA.data.scenarioFigures = {
    Current: {
      adv: '17313.0',
      baseFrtDisc: '51.3%',
      totalDisc: '55.9%',
      rpp: '$ 12.41',
      revenue: '$ 1,074,292',
      or: '0.98',
      profit: '$ 26,111'
    },
    'Scenario 1': {
      adv: '17340.2',
      baseFrtDisc: '50.9%',
      totalDisc: '55.5%',
      rpp: '$ 12.57',
      revenue: '$ 1,095,226',
      or: '0.97',
      profit: '$ 37,273'
    }
  };

  DA.data.comparisonKeys = ['adv', 'baseFrtDisc', 'totalDisc', 'rpp', 'revenue', 'or', 'profit'];

  /** Sample choices for the report filters. */
  DA.data.filterOptions = {
    revenueBasis: ['All', 'Freight Only', 'Accessorial Only', 'Net Revenue'],
    costBasis: ['Fully Allocated Cost', 'Marginal Cost', 'Direct Cost'],
    incentiveMethod: ['Weight Break', 'Flat Incentive', 'Zone Based', 'Minimum Charge'],
    service: ['All', 'Next Day Air', 'Next Day Air Saver', '2nd Day Air', 'Ground', 'Ground Saver'],
    accessorial: ['All', 'Fuel Surcharge', 'Delivery Area', 'Additional Handling', 'Return Labels'],
    accountSuffix: ['MAIN', 'EAST', 'WEST']
  };

  /**
   * Differences between two scenarios, keyed "from|to". These come from the
   * source rather than being recomputed here: the figures above are rounded for
   * display, so subtracting them lands a unit off on Total Disc and Profit.
   */
  DA.data.scenarioDifferences = {
    'Current|Scenario 1': {
      adv: '27.2',
      baseFrtDisc: '-0.4%',
      totalDisc: '-0.5%',
      rpp: '$ 0.16',
      revenue: '$ 20,934',
      or: '-0.01',
      profit: '$ 11,161'
    }
  };

  /* ---- Summary tab -------------------------------------------------------- */

  var SERVICE_ROWS = [
    { label: '1DA', adv: '130.4', baseFrt: '49.1%', totalDisc: '52.2%', rpp: '$ 99.76', annRev: '$ 65,024' },
    { label: '1DM', adv: '3.0', baseFrt: '0.0%', totalDisc: '0.8%', rpp: '$ 326.80', annRev: '$ 4,902' },
    { label: '1DP', adv: '13.6', baseFrt: '61.7%', totalDisc: '63.8%', rpp: '$ 72.58', annRev: '$ 4,933' },
    { label: '2DA', adv: '43.6', baseFrt: '56.7%', totalDisc: '58.8%', rpp: '$ 28.21', annRev: '$ 6,148' },
    { label: '2DM', adv: '1.8', baseFrt: '18.9%', totalDisc: '24.9%', rpp: '$ 68.63', annRev: '$ 617' },
    { label: '3DS', adv: '71.4', baseFrt: '59.4%', totalDisc: '60.9%', rpp: '$ 31.36', annRev: '$ 11,193' },
    { label: 'GND', adv: '4190.6', baseFrt: '58.0%', totalDisc: '61.9%', rpp: '$ 13.33', annRev: '$ 279,251' },
    { label: 'USG', adv: '12559.2', baseFrt: '48.9%', totalDisc: '53.6%', rpp: '$ 10.92', annRev: '$ 685,610' },
    { label: 'USL', adv: '299.4', baseFrt: '37.8%', totalDisc: '44.8%', rpp: '$ 11.06', annRev: '$ 16,614' }
  ];

  function accountBlock() {
    return [{
      label: '{customer} MAIN',
      expanded: true,
      adv: '17313.0',
      baseFrt: '51.3%',
      totalDisc: '56.0%',
      rpp: '$ 12.41',
      annRev: '$ 1,074,292',
      children: [
        { label: 'Sub total', adv: '-', baseFrt: '-', totalDisc: '-', rpp: '$ 12.41', annRev: '$ 1,074,292' }
      ].concat(SERVICE_ROWS)
    }];
  }

  DA.data.packetSummaryTrees = {
    Current: [
      { label: 'Total', total: true, adv: '17313.0', baseFrt: '51.3%', totalDisc: '56.0%', rpp: '$ 12.41', annRev: '$ 1,074,292' }
    ].concat(accountBlock()),

    'Scenario 1': [
      { label: 'Total', total: true, adv: '17340.2', baseFrt: '50.9%', totalDisc: '55.5%', rpp: '$ 12.57', annRev: '$ 1,094,443' },
      {
        label: 'Unincented PLD',
        adv: '27.2', baseFrt: '0.0%', totalDisc: '0.0%', rpp: '$ 38.48', annRev: '$ 20,151',
        children: [
          { label: 'Sub total', adv: '-', baseFrt: '-', totalDisc: '-', rpp: '$ 38.48', annRev: '$ 20,151' },
          { label: 'GND', adv: '19.6', baseFrt: '0.0%', totalDisc: '0.0%', rpp: '$ 36.12', annRev: '$ 14,509' },
          { label: 'USG', adv: '7.6', baseFrt: '0.0%', totalDisc: '0.0%', rpp: '$ 44.57', annRev: '$ 5,642' }
        ]
      }
    ].concat(accountBlock())
  };

  /* ---- Shipping Profiles tab ---------------------------------------------- */

  /**
   * Every shipping profile view lists the same lanes in the same order, so the
   * keys live once and each view supplies only its own figures.
   */
  var PROFILE_KEYS = [
    { movement: 'N', mode: 'AIR', service: '1DA', zone: '-', lane: '-' },
    { movement: 'N', mode: 'AIR', service: '1DM', zone: '-', lane: '-' },
    { movement: 'N', mode: 'AIR', service: '1DP', zone: '-', lane: '-' },
    { movement: 'N', mode: 'AIR', service: '2DA', zone: '-', lane: '-' },
    { movement: 'N', mode: 'AIR', service: '2DM', zone: '-', lane: '-' },
    { movement: 'N', mode: 'AIR', service: '3DS', zone: '-', lane: '-' },
    { movement: 'N', mode: 'GROUND', service: 'GND', zone: '-', lane: '-' },
    { movement: 'N', mode: 'GROUND SAV', service: 'USG', zone: '-', lane: '-' },
    { movement: 'N', mode: 'GROUND SAV', service: 'USL', zone: '-', lane: '-' }
  ];

  function withKeys(figures) {
    return PROFILE_KEYS.map(function (keys, index) {
      return Object.assign({}, keys, figures[index]);
    });
  }

  DA.data.shippingProfileCost = withKeys([
    { volume: '652.0', adv: '130.4', pps: '1.0', weightPiece: '11.91', avgCube: '1.24', avgCubeFactor: '1.08', puDens: '8.64', dlDens: '1.65', pu: '$ 2.42', ls: '$ 0.47', cs: '$ 2.15', ar: '$ 3.62', jf: '$ 12.31', gf: '$ 2.12', br: '$ 0.0', pd: '$ 1.83', dl: '$ 5.59', no: '$ 3.06', oth: '$ 0.0', totalFreightCost: '$ 33.57', costAdj: '-', newCost: '$ 33.57' },
    { volume: '15.0', adv: '3.0', pps: '1.0', weightPiece: '14.87', avgCube: '1.51', avgCubeFactor: '1.07', puDens: '4.54', dlDens: '1.61', pu: '$ 4.9', ls: '$ 0.39', cs: '$ 2.17', ar: '$ 3.72', jf: '$ 18.69', gf: '$ 2.83', br: '$ 0.0', pd: '$ 2.07', dl: '$ 8.43', no: '$ 5.17', oth: '$ 0.0', totalFreightCost: '$ 48.39', costAdj: '-', newCost: '$ 48.39' },
    { volume: '68.0', adv: '13.6', pps: '1.0', weightPiece: '11.09', avgCube: '1.17', avgCubeFactor: '0.97', puDens: '4.92', dlDens: '4.04', pu: '$ 3.92', ls: '$ 0.17', cs: '$ 2.64', ar: '$ 3.95', jf: '$ 10.26', gf: '$ 1.87', br: '$ 0.0', pd: '$ 1.92', dl: '$ 2.14', no: '$ 2.5', oth: '$ 0.0', totalFreightCost: '$ 29.37', costAdj: '-', newCost: '$ 29.37' },
    { volume: '218.0', adv: '43.6', pps: '1.0', weightPiece: '5.45', avgCube: '0.55', avgCubeFactor: '1.02', puDens: '3.9', dlDens: '2.68', pu: '$ 4.77', ls: '$ 0.49', cs: '$ 1.81', ar: '$ 0.43', jf: '$ 1.48', gf: '$ 0.9', br: '$ 0.0', pd: '$ 1.25', dl: '$ 2.85', no: '$ 1.8', oth: '$ 0.01', totalFreightCost: '$ 15.78', costAdj: '-', newCost: '$ 15.78' },
    { volume: '9.0', adv: '1.8', pps: '1.0', weightPiece: '13.89', avgCube: '0.99', avgCubeFactor: '0.91', puDens: '2.78', dlDens: '5.78', pu: '$ 5.9', ls: '$ 0.51', cs: '$ 2.71', ar: '$ 0.56', jf: '$ 2.3', gf: '$ 1.75', br: '$ 0.0', pd: '$ 1.67', dl: '$ 4.14', no: '$ 2.5', oth: '$ 0.0', totalFreightCost: '$ 22.05', costAdj: '-', newCost: '$ 22.05' },
    { volume: '357.0', adv: '71.4', pps: '1.0', weightPiece: '12.38', avgCube: '1.15', avgCubeFactor: '1.05', puDens: '13.39', dlDens: '1.84', pu: '$ 1.53', ls: '$ 0.47', cs: '$ 2.09', ar: '$ 0.25', jf: '$ 1.08', gf: '$ 1.62', br: '$ 0.0', pd: '$ 1.51', dl: '$ 3.14', no: '$ 1.93', oth: '$ 0.01', totalFreightCost: '$ 13.62', costAdj: '-', newCost: '$ 13.62' },
    { volume: '20953.0', adv: '4190.6', pps: '1.0', weightPiece: '13.01', avgCube: '1.36', avgCubeFactor: '1.15', puDens: '117.72', dlDens: '1.3', pu: '$ 0.23', ls: '$ 0.51', cs: '$ 1.85', ar: '$ 0.0', jf: '$ 0.0', gf: '$ 2.78', br: '$ 0.0', pd: '$ 1.2', dl: '$ 4.0', no: '$ 1.37', oth: '$ 0.02', totalFreightCost: '$ 11.91', costAdj: '-', newCost: '$ 11.91' },
    { volume: '62796.0', adv: '12559.2', pps: '1.0', weightPiece: '3.59', avgCube: '0.52', avgCubeFactor: '1.09', puDens: '3031.44', dlDens: '1.16', pu: '$ 0.07', ls: '$ 0.41', cs: '$ 1.24', ar: '$ 0.0', jf: '$ 0.0', gf: '$ 0.94', br: '$ 0.0', pd: '$ 0.96', dl: '$ 5.53', no: '$ 1.04', oth: '$ 0.0', totalFreightCost: '$ 10.19', costAdj: '-', newCost: '$ 10.19' },
    { volume: '1497.0', adv: '299.4', pps: '1.0', weightPiece: '12.12', avgCube: '0.29', avgCubeFactor: '1.11', puDens: '3335.35', dlDens: '1.21', pu: '$ 0.07', ls: '$ 0.25', cs: '$ 0.88', ar: '$ 0.0', jf: '$ 0.0', gf: '$ 0.57', br: '$ 0.0', pd: '$ 0.8', dl: '$ 5.25', no: '$ 0.89', oth: '$ 0.0', totalFreightCost: '$ 8.69', costAdj: '-', newCost: '$ 8.69' }
  ]);

  DA.data.shippingProfileZone = withKeys([
    { volume: '652', adv: '130.4', pps: '1', weightPiece: '11.91', freightGrossSpent: '$ 110,827.85', freightDiscount: '49.11%', freightRpp: '$ 86.50', freightNetSpent: '$ 56,396.79', freightProfit: '$ 34,511.69', freightOr: '0.39' },
    { volume: '15', adv: '3', pps: '1', weightPiece: '14.87', freightGrossSpent: '$ 3,590.93', freightDiscount: '0.00%', freightRpp: '$ 239.40', freightNetSpent: '$ 3,590.93', freightProfit: '$ 2,865.14', freightOr: '0.20' },
    { volume: '68', adv: '13.6', pps: '1', weightPiece: '11.09', freightGrossSpent: '$ 11,512.40', freightDiscount: '61.69%', freightRpp: '$ 64.86', freightNetSpent: '$ 4,410.17', freightProfit: '$ 2,413.15', freightOr: '0.45' },
    { volume: '218', adv: '43.6', pps: '1', weightPiece: '5.45', freightGrossSpent: '$ 11,927.36', freightDiscount: '56.70%', freightRpp: '$ 23.69', freightNetSpent: '$ 5,163.96', freightProfit: '$ 1,724.03', freightOr: '0.67' },
    { volume: '9', adv: '1.8', pps: '1', weightPiece: '13.89', freightGrossSpent: '$ 677.18', freightDiscount: '18.86%', freightRpp: '$ 61.05', freightNetSpent: '$ 549.49', freightProfit: '$ 351.08', freightOr: '0.36' },
    { volume: '357', adv: '71.4', pps: '1', weightPiece: '12.38', freightGrossSpent: '$ 21,476.77', freightDiscount: '59.35%', freightRpp: '$ 24.46', freightNetSpent: '$ 8,730.82', freightProfit: '$ 3,870.04', freightOr: '0.56' },
    { volume: '20953', adv: '4190.6', pps: '1', weightPiece: '13.01', freightGrossSpent: '$ 444,324.98', freightDiscount: '58.02%', freightRpp: '$ 8.90', freightNetSpent: '$ 186,522.07', freightProfit: '$ -63,128.55', freightOr: '1.34' },
    { volume: '62796', adv: '12559.2', pps: '1', weightPiece: '3.59', freightGrossSpent: '$ 1,077,840.91', freightDiscount: '48.86%', freightRpp: '$ 8.78', freightNetSpent: '$ 551,247.59', freightProfit: '$ -88,456.19', freightOr: '1.16' },
    { volume: '1497', adv: '299.4', pps: '1', weightPiece: '12.12', freightGrossSpent: '$ 21,525.93', freightDiscount: '37.83%', freightRpp: '$ 8.94', freightNetSpent: '$ 13,382.90', freightProfit: '$ 380.12', freightOr: '0.97' }
  ]);

  /** Accessorial charges: a parent total over the services that incurred it. */
  DA.data.shippingProfileAccessorial = [
    {
      type: 'Fuel Surcharge',
      group: 'Fuel Surcharge',
      detail: 'Fuel Surcharge',
      expanded: true,
      totalUnits: '86546.0', pctTotalVolume: '100.8%', adu: '17309.2',
      grossRevenue: '$ 427,712.00', netRevenue: '$ 121,670.00', discount: '71.6%',
      children: [
        { type: '', group: '', detail: '3 Day Select', totalUnits: '357.0', pctTotalVolume: '0.4%', adu: '71.4', grossRevenue: '$ 4,906.00', netRevenue: '$ 1,226.00', discount: '75.0%' },
        { type: '', group: '', detail: 'Next Day Air', totalUnits: '652.0', pctTotalVolume: '0.8%', adu: '130.4', grossRevenue: '$ 23,572.00', netRevenue: '$ 7,175.00', discount: '69.6%' },
        { type: '', group: '', detail: '2nd Day Air A.M.', totalUnits: '9.0', pctTotalVolume: '0.0%', adu: '1.8', grossRevenue: '$ 139.00', netRevenue: '$ 68.00', discount: '51.3%' },
        { type: '', group: '', detail: 'Ground Saver > 1 lbs', totalUnits: '62796.0', pctTotalVolume: '73.1%', adu: '12559.2', grossRevenue: '$ 258,502.00', netRevenue: '$ 77,395.00', discount: '70.1%' },
        { type: '', group: '', detail: 'Next Day Air Saver', totalUnits: '68.0', pctTotalVolume: '0.1%', adu: '13.6', grossRevenue: '$ 2,377.00', netRevenue: '$ 547.00', discount: '77.0%' }
      ]
    }
  ];

  /* ---- Pricing terms tab -------------------------------------------------- */

  /** Region > mode > service, as the service incentive plans are grouped. */
  /**
   * The plan hierarchy: movement, then mode, then the services priced under
   * it.
   *
   * International carries the same Air/Ground split as Domestic. Its service
   * list is not in the reference data, so Air and Ground stand as the leaves
   * there and open the incentive plan directly -- rather than inventing UPS
   * international service names to fill a level. The drill path renders only
   * as deep as a branch actually goes, so the two sides coexist: Domestic is
   * three levels, International two, until the real list lands.
   */
  DA.data.pricingServiceTree = [
    {
      label: 'Domestic',
      children: [
        {
          label: 'Air',
          children: [
            { label: '2nd Day Air' },
            { label: '2nd Day Air A.M.' },
            { label: '3 Day Select' },
            { label: 'Next Day Air' },
            { label: 'Next Day Air Early' },
            { label: 'Next Day Air Saver' }
          ]
        },
        { label: 'Ground', children: [{ label: 'Ground - Package' }] }
      ]
    },
    {
      label: 'International',
      children: [
        { label: 'Air' },
        { label: 'Ground' }
      ]
    }
  ];

  /** Zone columns and weight bands behind a service's incentive grid. */
  DA.data.rateZones = ['2', '3', '4', '5', '6', '7', '8', '44', '45', '46'];

  DA.data.weightBreaks = [
    { from: '1', to: '5', rate: '46.00%' },
    { from: '6', to: '10', rate: '47.00%' },
    { from: '11', to: '20', rate: '50.00%' },
    { from: '21', to: '30', rate: '52.00%' },
    { from: '31+', to: '', rate: '54.00%' }
  ];

  DA.data.flowThroughOptions = [
    'P/P Pre-Paid',
    'F/C Freight Collect',
    'T/P Third Party',
    'Return Service'
  ];

  DA.data.tierIncentive = {
    tier: 'Tier 1',
    meta: [
      { label: 'Basis', value: 'Gross Revenue' },
      { label: 'Rolling Avg', value: '52 Weeks' },
      { label: 'Modeled', value: '$481,401' }
    ],
    bands: [
      { modeled: '0.0%', low: '$0.01', high: '$249,999.99', locked: true },
      { modeled: '51.9%', low: '$250,000.00', high: '$289,999.99' },
      { modeled: '60.2%', low: '$290,000.00', high: '$329,999.99' },
      // The two bands nearest the target, and the target itself, are still
      // open for negotiation -- their service group rates stay editable.
      { modeled: '68.6%', low: '$330,000.00', high: '$359,999.99', ratesEditable: true },
      { modeled: '74.8%', low: '$360,000.00', high: '$444,999.99', ratesEditable: true },
      { modeled: '92.4%', low: '$445,000.00', high: '$9,999,999,999.99', target: true, ratesEditable: true }
    ],
    serviceGroups: [
      { name: 'UPS N-Next Day Air', sublabel: '-LTR FC PP TP', rates: ['0.0%', '72.1%', '76.3%', '76.7%', '78.7%', '79.0%'] },
      { name: 'UPS N-Next Day Air', sublabel: '-PKG-Hundredweight FC PP TP', rates: ['0.0%', '38.0%', '43.0%', '44.0%', '46.3%', '46.6%'] },
      { name: 'UPS N-Next Day Air', sublabel: '-PKG FC PP RS TP', rates: ['0.0%', '72.8%', '76.8%', '77.3%', '81.7%', '82.2%'] },
      { name: 'UPS N-Next Day Air Saver', sublabel: '-LTR FC PP TP', rates: ['0.0%', '72.9%', '77.0%', '77.4%', '79.4%', '79.6%'] },
      { name: 'UPS N-Next Day Air Saver', sublabel: '-PKG-Hundredweight FC PP TP', rates: ['0.0%', '38.0%', '43.0%', '44.0%', '46.3%', '46.6%'] }
    ]
  };

  /**
   * Accessorial incentive plans under pricing terms, grouped by charge
   * family the same way the service incentive plans are grouped by region
   * -- Fuel Surcharge and Other Charges have nothing to open onto further,
   * so they're leaves themselves; Transportation Charges opens onto its
   * charge groups the way Domestic opens onto its modes.
   */
  DA.data.pricingAccessorialTree = [
    { label: 'Fuel Surcharge' },
    {
      label: 'Transportation Charges',
      children: [
        { label: 'Delivery Area', children: [{ label: 'Delivery Area Commercial' }] }
      ]
    },
    { label: 'Other Charges' }
  ];

  /**
   * The incentive plan every accessorial leaf opens onto -- one shared
   * table, same as servicePlan()'s weight-break grid is shared across every
   * service leaf regardless of which one opened it.
   */
  DA.data.pricingAccessorialIncentives = [
    { movement: 'Domestic', mode: 'Air', serviceGroup: 'Next Day', service: 'Next Day Air Early', adu: '0.00', nrpp: '$0.00', incentiveType: '% Off', incentiveAmount: '60.00%' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: 'Next Day', service: 'Next Day Air', adu: '0.42', nrpp: '$1.80', incentiveType: '% Off', incentiveAmount: '60.00%' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: 'Next Day', service: 'Next Day Air Saver', adu: '0.00', nrpp: '$0.00', incentiveType: '% Off', incentiveAmount: '60.00%' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: '2nd Day', service: '2nd Day Air A.M.', adu: '0.00', nrpp: '$0.00', incentiveType: '% Off', incentiveAmount: '60.00%' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: '2nd Day', service: '2nd Day Air', adu: '0.40', nrpp: '$1.80', incentiveType: '% Off', incentiveAmount: '60.00%' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: '3rd Day', service: '3 Day Select', adu: '0.03', nrpp: '$1.80', incentiveType: '% Off', incentiveAmount: '60.00%' },
    { movement: 'Domestic', mode: 'Ground', serviceGroup: 'Ground', service: 'Ground', adu: '1.68', nrpp: '$1.82', incentiveType: '% Off', incentiveAmount: '60.00%' }
  ];

  /**
   * Rows behind Analyzer > Accounts: the customer's parent account, grouped
   * by subparent, over the individual UPS account numbers billing under it.
   * Volume/ADV/Zone on the parent are the group's totals, not independent
   * figures, so they're written down directly rather than summed from
   * children the way an additive breakdown would -- there's no shared
   * "share of the whole" to derive per account here, each is its own record.
   */
  DA.data.packetAccounts = [
    {
      parent: '{customer}',
      subParent: 'No Sub Parent',
      accountNumber: '-',
      expanded: true,
      volume: '172658.0', adv: '2656.3', zone: '19.4',
      children: [
        { parent: '', subParent: '', accountNumber: '0000AW0689', volume: '19307.0', adv: '297.0', zone: '65.8' },
        { parent: '', subParent: '', accountNumber: '000082W208', volume: '153317.0', adv: '2358.7', zone: '13.6' },
        { parent: '', subParent: '', accountNumber: '000083E306', volume: '34.0', adv: '0.5', zone: '3.6' }
      ]
    }
  ];

  /**
   * Rows behind Analyzer > Weight & Cube: the same core services Services
   * lists, opening onto the billable weight tiers behind each (derived via
   * weightBreakdown, so a tier's figures always add back up to its
   * service's).
   */
  DA.data.packetWeightCube = [
    {
      service: 'N-Next Day Air', billable: '-',
      volume: '890', adv: '13.7', pps: '1.0', weightPiece: '8.8',
      baseGrossRev: '$164,299', baseNetRev: '$29,249', baseDisc: '82.2%',
      baseRpp: '$32.85', baseProfit: '$5,037', baseOr: '0.50'
    },
    {
      service: 'N-Next Day Air Saver', billable: '-',
      volume: '1', adv: '0', pps: '1.0', weightPiece: '-',
      baseGrossRev: '$59', baseNetRev: '$12', baseDisc: '79.6%',
      baseRpp: '$11.98', baseProfit: '$0', baseOr: '0.99'
    },
    {
      service: 'N-2nd Day Air', billable: '-', expanded: true,
      volume: '4203', adv: '64.7', pps: '1.0', weightPiece: '8.5',
      baseGrossRev: '$407,142', baseNetRev: '$82,709', baseDisc: '79.7%',
      baseRpp: '$19.68', baseProfit: '$ -341', baseOr: '0.52'
    }
  ];

  /** Rows behind Shipping Profiles > Service. */
  DA.data.packetServices = [
    { service: 'N-2nd Day Air', volume: '128', adv: '1.1', avgZone: '204.9', billableWt: '3.1', pps: '1.0', baseGrossRev: '$5,975', baseNetRev: '$5,975', disc: '0.0%', baseRpp: '$46.68', baseProfit: '$3,836', baseOr: '0.36' },
    { service: 'N-2nd Day Air A.M.', volume: '24', adv: '0.2', avgZone: '245.0', billableWt: '21.2', pps: '1.0', baseGrossRev: '$3,588', baseNetRev: '$3,588', disc: '0.0%', baseRpp: '$149.51', baseProfit: '$2,750', baseOr: '0.23' },
    { service: 'N-Ground', volume: '300', adv: '2.5', avgZone: '4.3', billableWt: '8.6', pps: '1.0', baseGrossRev: '$5,802', baseNetRev: '$4,678', disc: '19.4%', baseRpp: '$15.59', baseProfit: '$485', baseOr: '0.90' },
    { service: 'N-Next Day Air', volume: '168', adv: '1.4', avgZone: '105.2', billableWt: '11.2', pps: '1.0', baseGrossRev: '$26,597', baseNetRev: '$26,597', disc: '0.0%', baseRpp: '$158.31', baseProfit: '$19,592', baseOr: '0.26' },
    { service: 'N-Next Day Air Early', volume: '4', adv: '0.0', avgZone: '105.0', billableWt: '0.0', pps: '1.0', baseGrossRev: '$362', baseNetRev: '$362', disc: '0.0%', baseRpp: '$90.46', baseProfit: '$299', baseOr: '0.17' },
    { service: 'N-Next Day Air Saver', volume: '44', adv: '0.4', avgZone: '134.4', billableWt: '10.8', pps: '1.0', baseGrossRev: '$6,853', baseNetRev: '$6,853', disc: '0.0%', baseRpp: '$155.74', baseProfit: '$5,145', baseOr: '0.25' },
    { service: 'E-Worldwide Expedited', volume: '4', adv: '0.0', avgZone: '71.0', billableWt: '7.0', pps: '1.0', baseGrossRev: '$697', baseNetRev: '$334', disc: '52.1%', baseRpp: '$83.44', baseProfit: '$233', baseOr: '0.30' },
    { service: 'E-Worldwide Express Saver', volume: '4', adv: '0.0', avgZone: '481.0', billableWt: '10.0', pps: '1.0', baseGrossRev: '$787', baseNetRev: '$326', disc: '58.5%', baseRpp: '$81.61', baseProfit: '$213', baseOr: '0.35' }
  ];

  /**
   * Rate Charts' Net-basis grid: a $ rate per zone/weight-tier cell, the same
   * for every scenario in this demo (the reference screen shows Current and
   * Scenario 1 landing on identical figures). Gross and Volume bases have no
   * reference data yet -- the view's own empty state covers them.
   */
  DA.data.rateChartGrid = {
    zones: ['051', '052', '053', '054'],
    rows: [
      { weight: '1', net: ['$15.14', '$15.21', '$15.28', '$20.20'] },
      { weight: '2', net: ['$15.14', '$15.21', '$15.28', '$20.20'] },
      { weight: '3', net: ['$15.14', '$15.21', '$15.28', '$20.20'] },
      { weight: '4', net: ['$15.14', '$15.21', '$15.28', '$20.20'] },
      { weight: '5', net: ['$15.14', '$15.21', '$15.28', '$20.20'] },
      { weight: '6', net: ['$15.29', '$15.43', '$15.54', '$20.20'] },
      { weight: '7', net: ['$15.99', '$16.14', '$16.25', '$20.20'] },
      { weight: '8', net: ['$16.72', '$16.87', '$17.00', '$20.20'] },
      { weight: '9', net: ['$17.41', '$17.57', '$17.70', '$20.23'] }
    ]
  };

  /**
   * Rows behind Other Terms > Dim Divisor. Published Fuel Surcharge has no
   * reference screen yet. Each row's threshold band data (divisorCode,
   * cubicVolumeFrom, divisor) feeds the Structure Details dialog rather
   * than a flat column -- the outer table only ever shows the drill-down.
   */
  DA.data.packetDimDivisor = [
    { movement: 'Domestic', mode: 'Air', serviceGroup: 'Next Day Air Early', incentiveType: 'DIM Divisor', divisorCode: '01 - Dim Weight Divisor', cubicVolumeFrom: '0.0', divisor: '194.0' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: 'Next Day Air Early', incentiveType: 'DIM Divisor', divisorCode: '01 - Dim Weight Divisor', cubicVolumeFrom: '0.0', divisor: '194.0' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: 'Next Day Air Early', incentiveType: 'DIM Divisor', divisorCode: '01 - Dim Weight Divisor', cubicVolumeFrom: '0.0', divisor: '194.0' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: 'Next Day Air Early', incentiveType: 'DIM Divisor', divisorCode: '01 - Dim Weight Divisor', cubicVolumeFrom: '0.0', divisor: '194.0' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: 'Next Day Air Early', incentiveType: 'DIM Divisor', divisorCode: '01 - Dim Weight Divisor', cubicVolumeFrom: '0.0', divisor: '194.0' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: 'Next Day Air Early', incentiveType: 'DIM Divisor', divisorCode: '01 - Dim Weight Divisor', cubicVolumeFrom: '0.0', divisor: '194.0' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: 'Next Day Air', incentiveType: 'DIM Divisor', divisorCode: '01 - Dim Weight Divisor', cubicVolumeFrom: '0.0', divisor: '194.0' },
    { movement: 'Domestic', mode: 'Air', serviceGroup: 'Next Day Air', incentiveType: 'DIM Divisor', divisorCode: '01 - Dim Weight Divisor', cubicVolumeFrom: '0.0', divisor: '194.0' }
  ];
})(window.DA);
