/**
 * Builds the packet record the Create Scenarios screen displays from what the
 * Customer Details form captured.
 *
 * Demo stand-in for the create-packet endpoint: the ID continues the existing
 * list, timestamps are taken from the clock, and any field left blank falls
 * back to the reference customer so the walkthrough still reads correctly.
 */
(function (DA) {
  'use strict';

  var FALLBACK = {
    customerName: 'APPLEGATE FARMS',
    referenceNumber: '0000067577'
  };

  function nextPacketId(rows) {
    var highest = (rows || []).reduce(function (max, row) {
      return Math.max(max, Number(row.packetId) || 0);
    }, 0);
    return String(highest + 1);
  }

  /**
   * The baseline "Current" scenario every packet opens with, sourced from
   * the same shared bid list every scenario ultimately reads from. `weeks`
   * is only known when the caller has real from/to dates (buildPacket);
   * packetFromRow has none, so it passes null and gets the same "no week
   * count" description buildPacket itself falls back to.
   */
  function buildCurrentScenario(now, weeks) {
    var format = DA.format;
    return {
      title: 'Scenario 0',
      number: 0,
      name: 'Current',
      description: (weeks == null ? '' : weeks + ' WEEKS ') + 'UPS SHIPPING PROFILE',
      status: 'Current',
      editable: false,
      expanded: false,
      included: true,
      createdDate: format.formatDate(now),
      lastModified: format.formatDate(now),
      bids: DA.data.scenarioBids.map(function (bid) {
        return {
          bidNumber: bid.bidNumber,
          bidName: bid.bidName,
          shippingProfile: bid.shippingProfile,
          construct: bid.construct,
          selectable: bid.selectable,
          selected: bid.selectable,
          serviceSource: bid.serviceSource
        };
      })
    };
  }

  DA.data = DA.data || {};

  /**
   * A new scenario copied from an existing one. Shipping profiles carry the
   * scenario index, so a copy into Scenario 1 rewrites S0- profiles as S1-.
   */
  DA.data.copyScenario = function copyScenario(source, index, name, description) {
    var format = DA.format;
    var now = new Date();

    return {
      title: 'Scenario ' + index,
      number: index,
      name: name,
      description: description,
      /*
       * Where this scenario came from. A copy is identical to its source until
       * a lever moves, so a scenario with no sourced figures of its own reads
       * its source's -- which is the copy's real state, not a stand-in. The
       * UI labels a figure reached this way as inherited.
       */
      copiedFrom: source.name,
      status: 'Analysis In Progress',
      editable: true,
      expanded: true,
      included: true,
      createdDate: format.formatDate(now),
      lastModified: format.formatDate(now),
      bids: source.bids.map(function (bid) {
        return {
          bidNumber: bid.bidNumber,
          bidName: bid.bidName,
          shippingProfile: bid.shippingProfile.replace(/^S\d+-/, 'S' + index + '-'),
          construct: bid.construct,
          selectable: bid.selectable,
          selected: bid.selected,
          serviceSource: bid.serviceSource
        };
      })
    };
  };

  DA.data.buildPacket = function buildPacket(input, currentUser) {
    var format = DA.format;
    var now = new Date();
    var timestamp = format.formatTimestamp(now);
    var owner = (currentUser.id ? currentUser.id + ' - ' : '') + currentUser.name;
    var customerName = input.customerName || FALLBACK.customerName;
    var weeks = format.weeksBetween(input.from, input.to);

    return {
      packetId: nextPacketId(DA.data.analyzerPackets),
      customerName: customerName,
      referenceNumber: input.referenceNumber || FALLBACK.referenceNumber,
      description: input.description ||
        customerName + ' Analyzer - ' + format.formatDate(now).replace(/-/g, '/'),
      hierarchy: input.hierarchy,
      industry: '',
      pqr: input.pqr,
      opps: (input.opps || []).join(', '),
      owner: owner,
      lastModifiedBy: owner,
      createdAt: timestamp,
      lastModifiedAt: timestamp,
      from: format.toDashDate(input.from),
      to: format.toDashDate(input.to),
      scenarios: [buildCurrentScenario(now, weeks)]
    };
  };

  /**
   * The full packet record behind a row on the Analyzer Packets list --
   * built on demand when that row's Packet ID is opened. The list only
   * ever stores the summary columns (packetId, customerName, ...), not a
   * full packet, so this reconstructs one from what the row has plus the
   * same shared "Current" scenario every packet starts with.
   */
  DA.data.packetFromRow = function packetFromRow(row, currentUser) {
    var owner = (currentUser.id ? currentUser.id + ' - ' : '') + currentUser.name;
    return {
      packetId: row.packetId,
      customerName: row.customerName,
      referenceNumber: row.customerNumber,
      description: row.customerName + ' Analyzer',
      hierarchy: row.customerHierarchy,
      industry: '',
      owner: row.owner || owner,
      lastModifiedBy: owner,
      createdAt: row.createdDate,
      lastModifiedAt: row.lastModifiedDate,
      from: '',
      to: '',
      scenarios: [buildCurrentScenario(new Date(), null)]
    };
  };

  /**
   * The Analyzer Packets list's own row shape for a freshly built packet --
   * added to DA.data.analyzerPackets once the user reaches the Analyzer
   * Packet page, so it shows up under My Analyzers from then on.
   */
  DA.data.summarizePacket = function summarizePacket(packet, currentUser) {
    var today = DA.format.formatDate(new Date()).replace(/-/g, '/');
    return {
      packetId: packet.packetId,
      customerName: packet.customerName,
      customerNumber: packet.referenceNumber,
      owner: currentUser.name,
      status: 'Scenario Setup',
      createdDate: today,
      lastModifiedDate: today,
      scenarios: packet.scenarios.length,
      customerHierarchy: packet.hierarchy || 'Child'
    };
  };
})(window.DA);
