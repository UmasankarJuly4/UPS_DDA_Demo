/**
 * Sample breakdowns behind expandable rows.
 *
 * A parent row's children are derived from it rather than written out, so the
 * parts always add up to the whole they sit under: additive figures are split
 * by share, and rates carry down unchanged.
 */
(function (DA) {
  'use strict';

  /** A copy of `row` with additive figures scaled to `share`. */
  function scaleRow(row, share, additive, overrides) {
    var child = {};
    Object.keys(row).forEach(function (key) {
      if (key === 'children') return;
      var value = row[key];
      if (additive.indexOf(key) === -1) {
        child[key] = value;
        return;
      }
      var amount = DA.figures.toNumber(value);
      child[key] = amount == null
        ? value
        : DA.figures.format(amount * share, DA.figures.shapeOf(value));
    });
    return Object.assign(child, overrides || {});
  }

  /**
   * Split a lane across the zones it shipped in.
   * @param {Object} row        the parent lane
   * @param {string} labelKey   column carrying the row label
   * @param {Array}  additive   keys that sum back to the parent
   */
  DA.data.zoneBreakdown = function zoneBreakdown(row, labelKey, additive) {
    var shares = [
      { zone: '2', share: 0.42 },
      { zone: '3', share: 0.28 },
      { zone: '4', share: 0.19 },
      { zone: '5', share: 0.11 }
    ];
    return shares.map(function (entry) {
      var overrides = { zone: entry.zone };
      overrides[labelKey] = 'Zone ' + entry.zone;
      return scaleRow(row, entry.share, additive, overrides);
    });
  };

  /**
   * Split a service's volume across the billable weight tiers it shipped
   * in -- the numbered rows a Weight & Cube service opens onto. `labelKey`
   * is blanked (like accessorial's children), since the tier number in
   * `billable` is what identifies the row once it's under its service.
   */
  DA.data.weightBreakdown = function weightBreakdown(row, labelKey, additive) {
    var shares = [0.32, 0.24, 0.18, 0.14, 0.12];
    return shares.map(function (share, index) {
      var overrides = { billable: String(index + 1) };
      overrides[labelKey] = '';
      return scaleRow(row, share, additive, overrides);
    });
  };

  DA.data.additive = {
    cost: ['volume', 'adv'],
    zone: ['volume', 'adv', 'freightGrossSpent', 'freightNetSpent', 'freightProfit'],
    service: ['volume', 'adv', 'baseGrossRev', 'baseNetRev', 'baseProfit'],
    summary: ['adv', 'annRev']
  };
})(window.DA);
