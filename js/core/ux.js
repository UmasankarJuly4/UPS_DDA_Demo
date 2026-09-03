/**
 * UX v5 feature flags.
 *
 * Every behavioural change from the "Rebuilding the Analyzer" proposal is
 * gated here so any single one can be switched off without touching the code
 * that implements it. Set a flag to false and the app falls back to the v4
 * behaviour for that finding alone.
 *
 * The palette migration is not flagged here -- it lives entirely in
 * styles/dda-v2.css, so reverting it is removing one <link> from index.html.
 */
(function (DA) {
  'use strict';

  DA.ux = {
    /* F1 C -- report frame: embedded tables own a bounded scroll box, so the
       sticky header and the frozen identity columns actually engage, and the
       horizontal scrollbar is docked at the top of the grid where it can be
       reached without scrolling the page first. */
    frameTables: true,

    /* F1 C -- how tall a framed report table may grow before it scrolls
       internally. Expressed against the viewport so it adapts to the window. */
    frameMaxHeight: 'min(58vh, 620px)',

    /* F2 B -- the Comparisons tab renders one interleaved matrix (a row per
       line item, scenarios grouped under each metric) instead of one detached
       table per scenario. false restores the side-by-side panels. */
    interleavedComparison: true,

    /* F3 B -- guide rails and a real 20px step on the nested plan tree and the
       account tree, with tighter rows now that structure no longer depends on
       padding. Pure CSS; the flag adds the hook class. */
    treeGuideRails: true,

    /* F2 -- the comparison opens with one live (baseline plus the next
       scenario) instead of the baseline alone, which rendered a Change row of
       dashes on a screen whose whole purpose is comparison. Also makes the
       Comparisons tab read the same selection the band does, which in v4 it
       did not. false restores the baseline-only default. */
    compareByDefault: true,

    /* F4 A -- tab panels are built once and kept alive, so expansion, scroll
       position and selection survive a tab round-trip. */
    keepTabPanels: true,

    /* F6 A -- a verdict strip above the comparison band, stating the call and
       the drivers behind it at rest rather than on hover. Derived entirely
       from figures already recorded; nothing is invented. */
    verdictStrip: true,

    /* The analyzer list's TABLE view draws each record as its own detached
       row card -- column labels floating above on the page ground, a leading
       owner avatar, a two-line identity cell and a trailing control -- rather
       than as a bordered grid. Card view is untouched either way.
       false restores the bordered grid with its sand row-header column and
       alternating rows. */
    queueRowCards: true
  };
})(window.DA = window.DA || {});
