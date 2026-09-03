/**
 * Customer Details — step one of the New Analyzer Packet workflow.
 *
 * Reached from "New Analyzer Packet" on the packet list. Captures the customer
 * the packet is built for, the shipping profile window, and an optional
 * customer PLD file.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  var C = DA.components;
  var format = DA.format;

  var HIERARCHY_OPTIONS = [
    { value: 'Parent', label: 'Parent' },
    { value: 'Child', label: 'Child' }
  ];

  DA.pages = DA.pages || {};

  DA.pages.CustomerDetailsPage = function CustomerDetailsPage(options) {
    options = options || {};

    var state = {
      hierarchy: 'Parent',
      from: '05/23/2026',
      to: '08/15/2026',
      pldFile: null
    };

    /* ---- Customer ------------------------------------------------------- */

    var hierarchyField = C.SelectField({
      label: 'Customer Hierarchy*',
      value: state.hierarchy,
      options: HIERARCHY_OPTIONS,
      onChange: function (value) {
        state.hierarchy = value;
        renderCustomerLookup();
      }
    });

    var customerLookupSlot = el('div', { className: 'form-field' });
    var customerLookup;

    function renderCustomerLookup() {
      customerLookup = C.ChipInput({
        label: 'Enter ' + state.hierarchy + '*',
        multiple: false
      });
      DA.dom.clear(customerLookupSlot).appendChild(customerLookup);
    }

    /* ---- Shipping profile ----------------------------------------------- */

    /*
     * The window's length, shown on the action bar rather than as a line under
     * the date fields. It is the one derived fact about what "Source Data" is
     * about to fetch, which is exactly what the bar is for -- and it stays in
     * view while the rest of the form scrolls.
     */
    var duration = el('span', { className: 'dock__scope-v' });

    function renderDuration() {
      var weeks = format.weeksBetween(state.from, state.to);
      /*
       * The length only. The dates themselves are two fields away and the
       * native date inputs render them in the browser's locale order, so
       * repeating them here in the state's own MM/DD/YYYY would put the same
       * window on screen twice in two different formats.
       */
      duration.textContent = weeks == null
        ? '—'
        : weeks + ' week' + (weeks === 1 ? '' : 's');
    }

    /*
     * Native date input: gives the calendar icon and its click-to-open
     * picker for free, rather than a hand-built widget. Its own value is
     * always ISO (YYYY-MM-DD), so it's converted at the boundary -- state
     * stays MM/DD/YYYY, the format weeksBetween and the built packet record
     * already expect.
     */
    var fromField = C.Field({
      label: 'Shipping Profile From*',
      type: 'date',
      value: format.toIsoDate(state.from),
      onInput: function (event) { state.from = format.fromIsoDate(event.target.value); renderDuration(); }
    });

    var toField = C.Field({
      label: 'Shipping Profile To*',
      type: 'date',
      value: format.toIsoDate(state.to),
      onInput: function (event) { state.to = format.fromIsoDate(event.target.value); renderDuration(); }
    });

    renderDuration();

    /* ---- Optional customer PLD ------------------------------------------ */

    var attachmentSlot = el('div');

    function renderAttachment() {
      DA.dom.clear(attachmentSlot);
      if (!state.pldFile) return;

      attachmentSlot.appendChild(
        el('div', { className: 'attachment' }, [
          el('p', { className: 'attachment__title', text: 'Attached File' }),
          C.FileItem({
            name: state.pldFile,
            onRemove: function () { state.pldFile = null; renderAttachment(); }
          }),
          C.Field({ label: 'Add Duration* (In Weeks)', value: '13', type: 'text' }),
          C.Toggle({ label: 'Annualize :', valueLabel: 'Yes', checked: true })
        ])
      );
    }

    var pldSection = C.Accordion({
      title: 'Upload Optional Customer PLD',
      content: [
        C.FileDropzone({
          accept: '.csv,text/csv',
          fileType: 'CSV',
          onFile: function (selected) {
            state.pldFile = selected.name;
            renderAttachment();
          }
        }),
        attachmentSlot
      ]
    });

    /* ---- Remaining fields ------------------------------------------------ */

    var pqrField = C.Field({
      label: 'Enter PQR to link to packet (optional)',
      help: 'A PQR links an existing pricing quote request to this packet.'
    });

    var oppField = C.ChipInput({
      label: 'Enter OPP(s) to link to packet (optional)',
      multiline: true,
      help: 'Link one or more opportunity records to this packet.',
      hint: 'Use space bar or enter key to save each entry. Otherwise, paste multiple.',
      hintAlign: 'end'
    });

    /*
     * Annualize belongs with the window it annualizes. It used to sit below a
     * divider on its own, several rows down, where nothing said which fields
     * it applied to.
     */
    var annualizeToggle = C.Toggle({ label: 'Annualize :', valueLabel: 'Yes', checked: true });

    var referenceField = C.Field({ label: 'Customer Reference Number*' });
    var customerNameField = C.Field({
      label: 'Customer Name*',
      help: 'The customer name is taken from the selected account.'
    });
    var descriptionField = C.Field({ label: 'Analyzer Packet Description*' });

    /** What the user captured, ready for the next step. */
    function collect() {
      return {
        hierarchy: state.hierarchy,
        customerLookup: customerLookup.getValues()[0] || '',
        pqr: pqrField.input.value,
        opps: oppField.getValues(),
        referenceNumber: referenceField.input.value,
        customerName: customerNameField.input.value,
        description: descriptionField.input.value,
        from: state.from,
        to: state.to,
        pldFile: state.pldFile
      };
    }

    /* ---- Composition ----------------------------------------------------- */

    renderCustomerLookup();

    var card = el('section', { className: 'form-card', attrs: { 'aria-labelledby': 'customer-details-title' } }, [
      el('h2', {
        className: 'form-card__title title-rule',
        text: 'Customer Details',
        attrs: { id: 'customer-details-title' }
      }),
      el('div', { className: 'form-grid' }, [
        hierarchyField,
        customerLookupSlot,
        pqrField,
        oppField,
        // Reference number and customer name are one short field each and
        // were taking a full row apiece, the way the PQR/OPP pair above them
        // does not.
        referenceField,
        customerNameField,
        el('div', { className: 'form-grid__full' }, [descriptionField]),
        // The window and what is done with it, on one line.
        el('div', { className: 'form-grid__full form-row-3' }, [
          fromField,
          toField,
          annualizeToggle
        ])
      ]),
      el('hr', { className: 'form-divider' }),
      pldSection
    ]);

    /*
     * The same band the workspace and Create Scenarios carry: pinned to the
     * window's bottom edge, holding the way out, what the step is about to do,
     * and the action that does it. It used to be a row at the end of the form,
     * which on a form this long meant scrolling to find out how to continue.
     */
    var actionBar = el('div', {
      className: 'page-dock',
      attrs: { role: 'region', 'aria-label': 'Packet actions' }
    }, [
      el('button', {
        className: 'page-dock__back',
        attrs: { type: 'button' },
        on: { click: function () { if (options.onBack) options.onBack(); } }
      }, [DA.icons.chevronLeft(14), el('span', { text: 'Back' })]),
      el('div', { className: 'page-dock__state' }, [
        el('span', { className: 'dock__scope-k', text: 'Shipping profile' }),
        duration
      ]),
      el('div', { className: 'dock__spacer' }),
      el('button', {
        className: 'dock__btn dock__btn--commit',
        attrs: { type: 'button', title: 'Source shipping data for this window' },
        on: { click: function () { if (options.onSourceData) options.onSourceData(collect()); } }
      }, [el('span', { text: 'Source Data' })])
    ]);

    return el('main', {
      className: 'page page--docked',
      attrs: { id: 'main-content' }
    }, [
      el('div', { className: 'page--docked__scroll' }, [
        // A wrapper, so the scroll region's page-width rule lands here and the
        // form card keeps its own narrower measure.
        el('div', {}, [card])
      ]),
      actionBar
    ]);
  };
})(window.DA);
