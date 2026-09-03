/**
 * EditableValue — a figure that can be edited in place.
 *
 * Every cell in the Levers views carried a pencil, and none of them did
 * anything: the affordance promised an edit the product could not perform.
 * This makes the promise good.
 *
 * Read mode is a single button holding the value and its pencil, so the whole
 * cell is one target rather than a 13px icon. Activating it swaps in an input;
 * Enter or blur commits, Escape restores what was there.
 *
 * Formatting is preserved rather than re-typed. A value that reads as a number
 * is parsed, then written back in the shape it arrived in -- 46 typed into
 * "46.00%" commits as "48.00%", and 260000 into "$ 250,000.00" commits as
 * "$ 260,000.00". A value that is not numeric (an incentive type, say) is kept
 * as free text.
 */
(function (DA) {
  'use strict';

  var el = DA.dom.el;
  DA.components = DA.components || {};

  /**
   * options:
   *   value      current display string
   *   label      what this cell is, for the accessible name and change log
   *   editable   false renders the value with no affordance at all
   *   onCommit(next, previous) -> called only when the value actually changes
   */
  DA.components.EditableValue = function EditableValue(options) {
    options = options || {};
    var value = options.value == null ? '' : String(options.value);
    var label = options.label || 'value';

    var host = el('span', { className: 'cell-value' });

    if (options.editable === false) {
      host.appendChild(el('span', { text: value }));
      return host;
    }

    /** The formatting the value arrived in, so a commit keeps its shape. */
    function reformat(raw) {
      var typed = String(raw).trim();
      if (!typed) return null;
      var originalNumber = DA.figures.toNumber(value);
      if (originalNumber == null) return typed; // free text, kept as typed
      var next = DA.figures.toNumber(typed);
      if (next == null) return null;            // numeric cell, unusable input
      var formatted = DA.figures.format(next, DA.figures.shapeOf(value));
      // DA.figures.format always writes "$ 1,234"; the tier bands are recorded
      // as "$250,000.00". Match whichever spacing this cell arrived with, or
      // an edit silently restyles the column around it.
      if (/\$\s*\d/.test(value) && !/\$\s\d/.test(value)) {
        formatted = formatted.replace('$ ', '$');
      }
      return formatted;
    }

    function readMode() {
      DA.dom.clear(host);
      host.appendChild(el('button', {
        className: 'cell-value__edit u-tap-target',
        attrs: { type: 'button', 'aria-label': 'Edit ' + label + ', currently ' + value },
        on: { click: editMode }
      }, [
        el('span', { className: 'cell-value__text', text: value }),
        DA.icons.pencil(13)
      ]));
    }

    function editMode() {
      DA.dom.clear(host);

      var input = el('input', {
        className: 'cell-value__input',
        attrs: {
          type: 'text',
          value: value,
          'aria-label': 'Edit ' + label,
          autocomplete: 'off',
          spellcheck: 'false'
        }
      });
      input.value = value;

      var settled = false;

      function cancel() {
        if (settled) return;
        settled = true;
        readMode();
      }

      function commit() {
        if (settled) return;
        var next = reformat(input.value);
        if (next == null) {
          // Unusable input keeps the field open and says so, rather than
          // silently discarding what was typed.
          input.classList.add('is-invalid');
          input.setAttribute('aria-invalid', 'true');
          input.focus();
          input.select();
          return;
        }
        settled = true;
        var previous = value;
        value = next;
        readMode();
        if (next !== previous && options.onCommit) options.onCommit(next, previous);
      }

      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') { event.preventDefault(); commit(); }
        if (event.key === 'Escape') { event.preventDefault(); cancel(); }
      });
      input.addEventListener('input', function () {
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
      });
      // Blur commits, which is what a spreadsheet does and what tabbing
      // through a grid of figures needs.
      input.addEventListener('blur', commit);

      host.appendChild(input);
      input.focus();
      input.select();
    }

    readMode();

    /** Lets a caller (Discard changes) put the cell back without an event. */
    host.setValue = function (next) {
      value = next == null ? '' : String(next);
      readMode();
    };

    return host;
  };
})(window.DA);
