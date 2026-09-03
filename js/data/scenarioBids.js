/**
 * Bids sourced for a scenario — demo data transcribed from the reference
 * screen. Non-incented revenue is always included, so it carries no checkbox.
 */
(function (DA) {
  'use strict';

  DA.data = DA.data || {};

  /**
   * The service-level source data behind a bid's shipping profile -- the
   * table the Shipping Profile dialog's Services tab shows. One shared set,
   * transcribed from the reference screen, reused across every bid rather
   * than invented per bid.
   */
  var serviceSource = [
    { name: '1DM', adv: '0.2', actualWt: '3.5', billableWt: '4.8', zone: '107.8', dlDens: '0.9', cubeFactor: '0.7' },
    { name: '1DA', adv: '4.9', actualWt: '1.6', billableWt: '1.8', zone: '106.6', dlDens: '2.7', cubeFactor: '0.7' },
    { name: '1DP', adv: '0.5', actualWt: '0.8', billableWt: '1.2', zone: '135.2', dlDens: '4.3', cubeFactor: '0.5' },
    { name: '2DA', adv: '3.2', actualWt: '2.7', billableWt: '3.0', zone: '206.8', dlDens: '1.6', cubeFactor: '1.3' },
    { name: '3DS', adv: '0.1', actualWt: '5.8', billableWt: '5.9', zone: '305.6', dlDens: '2.9', cubeFactor: '1.1' },
    { name: 'EXW', adv: '0.1', actualWt: '0.0', billableWt: '0.0', zone: '94.0', dlDens: '1.3', cubeFactor: '0.1' },
    { name: 'WXS', adv: '0.0', actualWt: '5.2', billableWt: '5.0', zone: '425.8', dlDens: '1.0', cubeFactor: '0.5' },
    { name: 'XPR', adv: '0.0', actualWt: '1.0', billableWt: '1.0', zone: '901.0', dlDens: '2.0', cubeFactor: '0.3' },
    { name: 'XPD', adv: '0.0', actualWt: '8.0', billableWt: '8.0', zone: '358.5', dlDens: '2.0', cubeFactor: '0.8' }
  ];

  DA.data.scenarioBids = [
    {
      bidNumber: 'P200040799',
      bidName: 'Hormel 2024',
      shippingProfile: 'S0-UPS-PLD-1',
      construct: 'Daily',
      selectable: true,
      serviceSource: serviceSource
    },
    {
      bidNumber: 'P200040911',
      bidName: 'Hormel Foods Corporation Def',
      shippingProfile: 'S0-UPS-PLD-2',
      construct: 'Daily',
      selectable: true,
      serviceSource: serviceSource
    },
    {
      bidNumber: 'P580040974',
      bidName: 'UPSC|FLEX|.90|2.70||AJG 2',
      shippingProfile: 'S0-UPS-PLD-3',
      construct: 'Daily',
      selectable: true,
      serviceSource: serviceSource
    },
    {
      bidNumber: '9999999999',
      bidName: 'Non-incented Revenue',
      shippingProfile: 'UPS-PLD',
      construct: 'Daily',
      selectable: false,
      serviceSource: serviceSource
    }
  ];
})(window.DA);
