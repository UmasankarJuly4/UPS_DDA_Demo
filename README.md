# Digital Analyzer — UI

## v6 — the Analyzer Workspace

v5 fixed defects and moved the palette. It did not change the experience: the
same 35 tabs, the same shape. v6 rebuilds the packet screen around what the
analyst actually does, without changing what the product is for.

### The problem with the old structure

The TCS "Day in Life" research describes one loop: look at the data, modify
incentives, verify the impact, repeat, export the outcome.

v4/v5 expressed that loop as a filing cabinet. **Pricing Terms** (where you
change something) and **Analyzer** (where you see what it did) were sibling
top-level tabs, so cause and effect could never be on screen together. Below
them sat seven sub-tabs named after the table the data lived in — *Cost
Details*, *Zones*, *Weight & Cube* — so answering a question meant first
knowing which grid held it. Up to 35 flat destinations, and the product's
central capability was split across two of them.

### What v6 does

| | v4 / v5 | v6 |
| --- | --- | --- |
| Destinations on the packet screen | up to **35** flat tabs | **3** modes + a 6-way breakdown switcher |
| Navigation to see a lever's impact | 4 clicks, across two top-level tabs | **0** — the dock is always on screen |
| Which scenarios are being compared | hidden behind a dropdown | a persistent rail, always visible |
| Where you are in the packet's life | never shown | a 5-stage rail in the context bar |
| Landing screen | 15 near-identical rows, 9 columns | grouped by what each packet waits for |

**Three modes, named for what the analyst is doing** — not for where the data
sits:

- **Impact** — the verdict in a sentence, four driver tiles ranked by share of
  movement, then the interleaved comparison matrix.
- **Levers** — the pricing terms. What you change.
- **Evidence** — one grid with a *Break down by* switcher. The seven old
  sub-tabs were never seven subjects; they are the same lanes sliced seven
  ways, so they collapse into one surface. Every original view is still there,
  with its own columns, its own rows and its own expansion.

**The dock** is the structural centrepiece: impact became *chrome*. It is
pinned below every mode, so adjusting a lever and reading the consequence costs
no navigation. It is also the only dark surface in the product — exactly the
licence the colour system grants, dark where an action commits.

### What it does not do

The demo has recorded figures per scenario, not a pricing engine. So the dock
reports two things and never confuses them: **recorded** figures and deltas
between scenarios, which are real; and **pending lever edits**, listed as an
unpriced change set. It never invents a recomputed number for an edit.

Filters remain unwired (see F5 in the proposal). Approval rules do not exist,
so *Submit for approval* names the handover rather than performing it.

### Cost basis and Revenue basis are selects again

These were dropdowns on the v4 screen. When the mode bar was built they became
**static text** — *"Cost basis: Fully Allocated · Revenue basis: All"* — so the
options were not reachable anywhere in v6. That was a regression, not a
decision.

They are selects again, carrying the option lists the data already held:

- **Cost basis** — Fully Allocated Cost, Marginal Cost, Direct Cost
- **Revenue basis** — All, Freight Only, Accessorial Only, Net Revenue

with a **Reset** beside them, as the v4 filter row had.

**What they do, honestly.** On v4 these selects had no change handler at all —
they were decorative. Here the choice is real and carried into the views, but
every recorded figure in this data set was sourced at *Fully Allocated Cost*
over *All* revenue, and no other basis has been sourced. Restating the same
numbers under a different basis label would be the most convincing lie in the
product, so instead the screen says which basis the figures belong to:

> Figures on this packet were sourced at Fully Allocated Cost over All revenue.
> Marginal Cost over Freight Only revenue has not been sourced, so the figures
> below are unchanged.

The notice appears only when the selection differs from the sourced basis, and
Reset clears it. When the rating service can return figures per basis, the
notice is the only thing that has to go.

A basis change invalidates **every** pane, unlike a change of comparison which
only Impact depends on — every figure on the canvas is quoted under a basis.

### Mode bar at pill height, a commit button, and Rate Charts set apart

**The two persistent controls now match.** Impact / Levers / Evidence were
36px buttons against 27px scenario pills, because each carried a second line
("the answer", "what I change"). That subtitle set the bar's height on its
own, so it reads as a tooltip instead: modes are **28px** against the pills'
**27px**, and the bar goes **58px to 42px**.

**Adding a scenario moved to where the scenarios are.** A `+` at the end of
the pill list, sized to match them, rather than a full button across the bar
from the list it extends.

**Update Analyzer Packet took its place at the right.** It is the only control
on that bar that changes the packet rather than what is being looked at, so it
stays **disabled until there is something to commit** — a live-looking button
with nothing behind it is a worse promise than a plainly inert one. Its tooltip
says which it is: *"No lever changes to apply"* or *"Apply 1 lever change to
this packet"*.

What it commits is the pending state, not the figures. The edits are already
written into the packet — that is what made them visible on the grids — so
this clears the count, Discard, and the *unpriced* claim, and says plainly
that repricing runs on the rating service and the scenario figures still show
the last sourced values until it returns. It does not invent repriced numbers.

**Rate Charts sits apart.** It is reference material — the rates as they
stand, to read against while setting the three groups before it — so grouping
it with three editable tabs implied a fourth thing to change. It is pushed to
the right corner as an outlined pill and drops the underline marker that means
"you are editing here". It is still the same tab in every other respect: same
tablist, `role="tab"`, arrow keys cycle through it and wrap back to Pricing
Terms.

### The bottom bar is the scenario switcher, and nothing else

Once Impact grew a card per scenario carrying Profit, Op ratio, Total discount
and Revenue, the bar underneath was showing the same four metrics a few hundred
pixels below them. A second copy of the answer directly under the first is not
reinforcement, it is noise.

The bar is one row now: **Scenarios**, the pills, and **Create scenario**.
**134px to 54px**, and the canvas takes the difference.

Removed with it: *Export outcome* and *Submit for approval*. Those were the
only commit path in the product, so the packet currently has no way to be
submitted — see below.

**What stayed, and why.** The lever change set. Nothing else counts an edit or
offers a way back, so losing it would mean editing a tier band with no
indication anything had changed and no undo. It appears only when there is
something to undo — one chip and *Discard*, which takes the bar to 56px — so
the resting state is the scenarios and nothing else.

Collapsed reads *"Scenarios · Scenario 1 vs Current"* at 38px; the metrics that
used to sit there belong to Impact.

### The scenario rail became pills in the dock

The scenarios were a 248px rail down the left of the workspace — a permanent
column of the window for a short list of short names. They are pills across the
dock now, with **Create scenario** at the right of the strip.

The canvas takes the width back: **1192px to 1440px** at a 1440px window, which
is where it matters, since these grids are wide rather than tall (Cost Details
is 2,640px of table). It also puts the scenarios next to the figures they
drive, rather than at the opposite edge of the screen from them.

Each pill keeps both of the rail's controls:

- **the body** sets the reference — the pill takes gold with brown ink, the
  pairing the colour system uses for a committed selection
- **the tick** adds the scenario to what is measured against it — a lighter
  outlined state, gold check

A pill also carries the scenario's profit and, where it is not the reference,
its delta, so choosing is an informed choice rather than picking a name and
then going to look.

Also new: the service hierarchy now has **International** beside Domestic, with
Air and Ground under both. Its service list is not in the reference data, so
Air and Ground stand as the leaves there and open the plan directly — the drill
path renders only as deep as a branch goes, so Domestic runs three levels and
International two without any code change.

The trade is height for width: the dock goes 65px to 134px expanded, and
collapsing it returns 95px. Verified at 1440, 900 and 700px — pills hold one
row, Create scenario stays 20px from the right edge, and nothing overflows.

### Sub-tabs as one unit, and the plan tree as a drill path

**Two selection styles on one tab.** The sub-tab pill was landing on top of
the base component's underline marker, so a selected sub-tab carried both at
once. The underline is off in the sub scope; the pill is the only selected
treatment. The bar also sits *on* the panel it controls now -- one bordered
unit with the tabs on their own sand strip, zero gap -- rather than floating
above it.

**Nested accordions became a drill path.** Reaching a service plan meant
opening three collapsible cards, each adding panel padding and a guide rail:
roughly **32px of left inset per level, ~96px before the leaf**, under a tree
451px tall. Worse, each level's siblings were hidden until you expanded their
parent, so choosing between six services meant opening one to see the other
five.

One chip row per level instead:

| | Before | After |
| --- | --- | --- |
| Left inset to leaf content | ~96px | **9px** |
| Navigation height | 451px | **82px** |
| Siblings visible | one branch at a time | **all, at every level** |

Rows go only as deep as the chosen path, which matters because these trees are
ragged. Accessorials has *Fuel Surcharge* as a leaf at level one beside
*Transportation Charges* three deep: picking the first shows one row and its
plan, picking the second grows to three. Services is ragged the same way now
that **International** sits beside **Domestic** — both carry Air and Ground,
but Domestic runs three levels to its named services while International's
Air and Ground are the leaves. That is a data addition only; the drill path
absorbed it with no code change. Choosing a branch walks down to its
first leaf rather than landing on an empty panel.

Tables untouched: the weight-break grid is still 5 rows x 13 columns, frozen
with two key columns and 50 editable cells. Editing still reaches the dock and
Discard still restores.

### Levers — structure, not just palette

Levers had only ever been re-skinned: v4's markup under v6's colours. Three
things were wrong with it as design. None of them were in the tables, which
are untouched.

**Three identical tab bars.** The lever groups, their sub-views and the freight
type were all the same `.tabs__list`, rendered identically and stacked — 92px
of navigation before content, with nothing saying which level you were on.
Level one keeps the underline bar at 46px/14px; level two drops to a quieter
gold-wash pill at 31px/12px; the freight type stops being navigation at all and
becomes a captioned control. **92px to 77px**, and the two levels no longer
look like peers.

**A settings pile.** Four unrelated controls stacked with no grouping, and two
with no label at all — the segmented control deciding the whole *incentive
basis* said nothing about itself. They are one captioned band now: Freight
type, Incentive basis and Incentive method across the top, Flow through options
full-width beneath, each with its own label.

**Two competing saves.** Panel-local *Save Changes* links on the weight-break
and accessorial panels promised the same thing the dock does — and the dock is
where the change set actually lives, counted, with *Price & submit*. The links
are gone. *Add weight break* is a real action and stays.

Also: the tier header treated `MODELED` and `$481,401` as equals. The tier is
the heading now, each fact is a small label over its value, and the modelled
revenue — the figure that decides the band — is the one that carries weight.

Tables verified unchanged: weight-break grid 5 rows x 13 columns with both key
columns frozen and 50 editable cells; tier grid 9 rows, 20 editable cells; the
accessorial grid 8 columns, 7 rows, 4 frozen, 14 editable cells. Editing still
reaches the dock and Discard still restores.

### Impact summary — scenario cards, combined, or one line

Impact opens with the scenarios themselves rather than a verdict block beside
four driver tiles. Three states, then the comparison table underneath.

**Cards.** One compact card per scenario in the comparison, laid across and
equal width -- 368px each with three scenarios. Each carries the four dock
metrics; a compared scenario shows its delta beside every figure. The
reference takes the system's selected state (brown on gold wash) because it is
what everything else is measured from, not merely the first card. A scenario
reading inherited figures says so on the card.

**Combined.** One switch folds the cards into a single grid -- metrics down,
scenarios across, deltas in place. Same data turned ninety degrees, which is
why it is a view switch rather than another screen. The cards answer "what is
this scenario"; the grid answers "how do they differ".

**Collapsed.** The bar alone: *VERDICT · Scenario 1 improves profit without
widening discount · Profit ▲ $ 11,161*. **223px to 44px**, and all **179px**
reach the comparison table -- its viewport goes 382 to 561, six more rows.

The collapsed line is the dock's shape in the **light** palette, not the dark
one: espresso is reserved for the surface that commits, and this summary reads
rather than executes. So it takes Sand Subtle with brown ink under the same
gold rule.

Both the collapse and the combine choice are remembered per browser. Switching
the reference redraws the cards, and below 1100px they stack rather than
squeeze.

### Account Association, rebuilt

This screen was still the v4 original. Three things were wrong with it.

**Four stat tiles, 97px each, for four single digits** — roughly 400px of
viewport before the tree the analyst came for, and three of the four counts
read `0`. Now one inline strip: *7 accounts · 7 UPS · 0 temporary · 0
unassociated*, with the only count that ever needs acting on — unassociated —
carrying the only colour. Header block: **400px to 107px**.

**Three nested accordions wrapping a separate table at the leaf.** Every level
was a different kind of object, so a hierarchy three deep cost three kinds of
chrome and two header rows, and no figure lined up with any other. It is one
expandable grid now: parent, subparent and account are rows in the same table
under one set of columns, indented 20px per level. It inherits everything the
report grids have — sand header, row-header column, alternating rows, frozen
identity columns (select + hierarchy), pinned header, and the bounded frame
that shows as many rows as the window allows. 17 rows at 1440x900.

**A disabled "Review Changes" with nothing to review.** Attaching accounts now
builds a change set: the dock counts it, newly attached rows carry a badge,
*Review changes* turns on and lists exactly what will be attached, and *Discard
attachments* removes them — along with any parent or subparent that existed
only to hold one.

Also new: select cascades with a real indeterminate state on partly-selected
branches, and search prunes whole branches rather than leaving empty headings.

Verified at 1440x900 and 900x760: attaching six accounts takes the tree from 3
rows to 11 and the counts from 1 to 7; discard puts both back. Indentation
steps 125 / 145 / 165px. At 900px the grid scrolls sideways with both identity
columns holding at offset 0 and the header pinned.

One detail worth recording: a leaf has no disclosure chevron, so its label
started where the chevron would have been — measured 139px against its own
parent's label at 145px, which read as the account sitting *outside* the group
it belongs to. The chevron's width is reserved on childless rows.

### The comparison band collapses

A pull tab rides the band's gold rule at the right, the way a drawer handle
sits on the drawer it opens. It takes the rule's own gold with the brown ink
that always pairs with it, so it reads as part of the rule rather than a
control dropped on the dark surface.

Collapsing is in tension with why the dock exists -- impact as permanent
chrome -- so the collapsed state is not empty. It keeps the scope line and the
headline movement in a strip: *"Current vs Scenario 1 &nbsp; PROFIT &nbsp;
▲ $ 11,161"*, plus the unpriced-change count when there is one. That is the
difference between reclaiming space and turning a gold bar into dead weight.

Measured with two scenarios at 1440x900: the band goes **86px to 38px**, and
all **47px** reach the grid -- the canvas moves 651 to 698 and the report
viewport 367 to 414. With one scenario it is 65px to 38px.

The choice is remembered per browser (`localStorage`, in a try/catch so a
private window just starts expanded). The band still tracks the comparison
while collapsed, so changing the reference or the compared set updates the
strip.

### Read-only vs editable, and the three tabs I had dropped

The product's division is not by subject. It is by whether the analyst is
**changing** something:

| | Mode | Editable |
| --- | --- | --- |
| Analyzer &rsaquo; Comparisons | **Impact** | no |
| Analyzer &rsaquo; the six breakdowns | **Evidence** | no |
| Pricing Terms, Other Terms, Adjustments, Rate Charts | **Levers** | **yes** |

Everything under Analyzer is figures to read. Everything else is a contract
term the analyst sets.

v6 got that division right for Impact, Evidence and Pricing Terms, and then
dropped three whole tabs on the floor: **Other Terms** (Dim Divisor, Published
Fuel Surcharge), **Adjustments** and **Rate Charts** had no home when the packet
screen was rebuilt, and two of them hold genuinely editable cells. That was an
omission, not a decision. Levers now carries all four groups v4 had, so the
packet screen covers **15 of 15** leaf views again.

Newly editable, all reporting into the dock's change set:

- **Adjustments** — the packet-wide dollar amount, which carried a pencil that
  did nothing.
- **Other Terms &rsaquo; Dim Divisor** — the incentive type per service, plus
  the cubic-volume threshold and dim weight divisor inside the Structure
  Details dialog. The static "or more" label stays read-only, because it is a
  word rather than a value.
- **Rate Charts** — the net rate per weight tier and zone. v4 drew these as
  drill-down links; they are a rate the analyst sets, so they are cells now.

Verified: Impact and Evidence report **0** editable cells and **0** form
inputs, across all six Evidence breakdowns. Edits in all three new groups reach
the dock, and Discard restores every one.

One bug this turned up. Discard was clearing the change set but leaving the
edited figures on screen: the revert wrote back to the data and never put the
*cell* back, and since panes are kept alive they never re-render. It restores
both halves now.

### The list header is pinned

The row-card look had deliberately un-pinned its header, since the design is
labels floating on the page ground rather than a filled bar. It is sticky now,
and still reads that way: the ground behind it is exactly the page's own warm
sand, so at rest nothing looks different, and once the list scrolls the cards
pass cleanly underneath instead of showing through the labels. A transparent
sticky header would have let every row slide visibly behind them, which is why
this needed a real colour rather than none.

Two details it turned up:

- `border-spacing` lays its vertical gap **above** the header row too, so the
  header rested 8px down and snapped to 0 the moment the list scrolled. The
  table is pulled up by that same 8px, so it starts where it pins.
- The rule switching off the frozen-column treatment was a bare
  `.is-frozen-col`, which outranked the sticky-header rule on class count and
  quietly un-pinned the *first* header cell. Scoped to `tbody`.

Verified at 1440x900 and at 940x760 where both axes scroll: the header holds at
offset 0 vertically while tracking its columns horizontally, sorting still
works while scrolled, and the gridded fallback and the workspace grids are
unaffected.

### The list table fills the page

The analyzer list's grid was inheriting the workspace canvas's frame cap --
`min(58vh, 620px)` -- on a page that has no canvas to share with. Measured at
1440x900: a 522px table showing 7 of 15 rows, with **233px of empty page**
beneath it.

In table view the grid now claims what the page has left. Card view is
unchanged, because a card grid has no reason to be pinned -- it flows and
scrolls.

| Window height | Viewport | Rows visible | Space below |
| --- | --- | --- | --- |
| 500 | 336 | 5 | 20px |
| 700 | 535 | 7 | 20px |
| 900 | 735 | 10 | 20px |
| 1200 | 1035 | 14 | 20px |

The 20px is the page's own bottom padding. Only the grid scrolls; the page
does not.

`overflow-y` on `.queue` stays `auto`, never `hidden` -- the same trap as the
canvas. A filling body normally measures the page exactly and shows no
scrollbar, but on a short window it cannot, and hiding the overflow would put
content out of reach. The floor is four row cards plus the header.

Both table looks fill, so this holds whether `queueRowCards` is on or off.

### Table view as detached row cards

The analyzer list's **table view** draws each record as its own card on the
page ground, with the column labels floating above rather than sitting in a
filled header bar. Card view is untouched.

It is still a real `<table>`: sortable headers, column semantics and the
row/column relationships a screen reader relies on all survive. The cards come
from `border-collapse: separate` with vertical `border-spacing` only, so rows
separate while columns stay flush.

Content is the card view's, laid on one line: a leading owner avatar, the
packet ID over its owner's name, the customer over its account number, status
pill, scenario count, hierarchy, modified date, and a trailing open control.
The palette is the product's own -- white cards on warm sand, brown ink, gold
on hover and focus.

Column widths total 1001px so the set fits a 1100px window without a
horizontal scrollbar; at 1440 the columns stretch to fill. Rows are 66px with
an 8px gap.

Two things needed fixing along the way. A `button` carries
`text-transform: none` from the UA stylesheet, so the sortable headers were
breaking the inheritance chain -- "Hierarchy" (a plain `th`) rendered uppercase
while "Packet" and the rest did not. And the row-card rules have to outrank the
alternating-row and row-header rules from `ux-v5.css`, which are the grid look
this view opts out of; they match on class count and win on source order.

**REVERT:** set `queueRowCards: false` in `js/core/ux.js`. That restores the
bordered grid -- sand header, sand row-header column, alternating rows, the
Owner column back, no avatar or open control. Verified by flipping the flag at
runtime in both directions.

### One table treatment

The `.matrix` grids (Levers > Tier Incentives) and the `.data-table` grids had
drifted into two looks. The matrix had three things the data tables did not:

1. a first column with its own ground,
2. alternating row tints,
3. a body that stayed white so those tints could read.

The data tables had a **white** row-header column -- an earlier decision of
mine that removed the very thing that held the label column apart -- and, on
the `tinted` variant, a body filled edge to edge with sand, which left no
contrast for striping and swallowed the row-header column entirely.

The matrix treatment now applies to both:

| | Value |
| --- | --- |
| Header ground / ink / rule | `#F2EDE4` / `#351C15` / 2px `#FFB500` |
| Row-header column (all rows) | `#F2EDE4`, brown ink |
| Odd rows | white |
| Even rows | `#FDFBF7` |
| Row hover | `#F7F2EA`, row-header `#E5E0D8` |

Two smaller fixes went with it. The matrix header's column divider was a
30%-white rule drawn for the dark header this palette retired, so it was
invisible on sand; it now takes the same border the data tables use. And
`.matrix__label` (the tier grid's row names) and `.matrix__rowhead` (the
weight-break grid's range columns) were a shade apart -- `#F2EDE4` against
`#E5E0D8` -- so the same kind of column looked different between two grids one
tab from each other. Both take the label's ground now.

Frozen columns keep their row's ground rather than going transparent over the
stripes: the row-header column holds sand on every row, and a frozen numeric
column follows the stripe. Verified across all six Evidence breakdowns, the
Levers accessorial and weight-break grids, and the queue table -- whose Packet
column became a row-header column for the same reason.

### Levers are editable, and the dock finally has something to hold

Every pencil in Levers was decorative: the affordance promised an edit the
product could not perform. `js/components/EditableValue.js` makes it good, and
the edits land in the dock's change set -- which until now was a feature with
nothing to populate it.

**The cell.** Read mode is one button holding the value and its pencil, so the
whole cell is the target rather than a 13px icon. The pencil stays invisible
until hover or focus, so a grid of figures is not a grid of icons. Enter or
blur commits, Escape restores.

**Formatting is preserved, not re-typed.** Type `260000` into `$250,000.00` and
it commits as `$260,000.00`; type `52` into `46.00%` and it commits as
`52.00%`. The currency spacing follows whatever the cell arrived with --
`DA.figures.format` always writes `$ 1,234` but the tier bands are recorded as
`$250,000.00`, and an edit that restyled the column around it would be worse
than no edit. A cell that is not numeric (`% Off`) is kept as free text.
Unusable input in a numeric cell keeps the field open and marks it, rather than
silently discarding what was typed.

**Editable cells:** tier `Low` bands and service-group rates (only where the
band is open for negotiation -- locked bands render with no affordance at all),
every zone rate on the weight-break grid, and the accessorial Incentive Type
and Incentive Amount. Each weight-break zone now holds its own rate once
edited, so the grid stops being one figure repeated across the row.

**The change set.** One entry per cell, keyed by cell id: editing the same
lever twice updates its entry rather than stacking two, and editing it back to
where it started removes it -- so the count always reflects what actually
differs from the sourced figures. *Discard changes* reverts newest-first, so a
cell edited more than once lands back on the value it truly started from.

Edits write through to the demo data, so they survive the view being rebuilt
and a mode switch. They are still **unpriced**: the dock says so, and no
recomputed scenario figure is invented from a lever move.

### Comparing any scenarios, not just against the baseline

v6 first anchored every comparison on the baseline: whichever scenario you
picked was shown against Scenario 0 and nothing else. That answers *"is this
better than today"* and cannot answer *"is S2 better than S1"* -- which is the
question an analyst asks as soon as they have two candidates on the table.

The comparison is now two independent choices, both on the rail card:

| | Control | How many |
| --- | --- | --- |
| **Reference** | click the card body | exactly one -- every delta is measured from it |
| **Comparands** | the tick on the right | any number -- the scenarios measured against it |

Every case falls out of those two positions:

- **Base vs S1** -- reference Current, tick S1
- **S1 vs S2** -- click S1 to make it the reference, tick S2
- **Base vs S1 vs S2** -- reference Current, tick both

The reference card shows a `vs` anchor where the tick would be, since a
scenario cannot be compared against itself.

**What follows the selection.** The matrix grows a delta column per comparand,
labelled `S2 vs Current` rather than just `Change` once there are three or more
so nothing is ambiguous (26 columns for a three-way across five metrics). The
dock names the whole comparison and tags each delta with its scenario. The
Impact headline ranks them: *"Scenario 1 leads on profit of the 2 compared"*.
With nothing ticked it says so and explains how to start one.

**Recorded differences work in both directions.** `scenarioDifferences` holds
`Current|Scenario 1`; asking for S1 to Current now finds that pair and negates
it rather than falling through to arithmetic on rounded display figures.

**A copy inherits its source's figures, and says so.** `copyScenario` records
`copiedFrom`, and a scenario with no sourced figures of its own reads its
source's -- which is a copy's real state until a lever moves, not a stand-in.
The rail labels it: *"Figures inherited from Current until re-sourced"*. The
first cut fell back to `Current` for any unknown scenario, which showed an
unrelated scenario's numbers under a name that had never been sourced.

**State survives a change of comparison.** Only Impact depends on it, so only
its pane is rebuilt. Verified: with Cost Details expanded to 21 rows at
scrollLeft 600 / scrollTop 90, switching the reference from Current to
Scenario 1 leaves all of it intact, same DOM node.

### Create Scenarios, rebuilt

Three things were structurally wrong with this screen.

**1. The summary panel reprinted the context bar.** Customer name, reference
number, packet ID and the shipping window were on screen twice, about two
inches apart — once in the permanent context bar, once in a 248px panel below
it. The bar is chrome that never leaves, so the panel's copies were the
redundant set. What is left is the seven facts that appear nowhere else, as a
strip of caption-over-value pairs, plus the description clamped to three lines.
**248px → 147px.**

Owner and Last Modified By hold the same value on a packet this new, and so do
the two dates. They are *not* deduplicated: they diverge the moment somebody
else touches the packet, and a field that disappears when two values happen to
agree is worse than one that repeats.

**2. Each scenario was 158px of chrome around one line of facts** — a section
header for the title and two links, a summary row, and a third row whose whole
job was to say *"Expand To Find Bid Details"*. The analyzer list had already
solved this shape: one row card per record, expandable. Scenarios take that
treatment (`.queue-table--rows`, the same class), at **60px** a card, with the
chevron every row card already carries in place of the advertisement row.

A scenario's bids are a table of their own, so they cannot be child rows of the
scenario grid. `DataTable` gained `renderDetail(row)`: the row expands onto one
full-width panel instead of onto child rows. Panels are built once per row and
kept, so closing and reopening a scenario does not discard its bid selection.

**3. The actions were below the fold, and the primary one existed twice.**
"Proceed to Analyzer Packet" sat at the end of the page content — off screen at
a 900px window — while the context bar carried an "Open workspace" button
running *the same handler*. One screen, two primary buttons, two names, one
outcome. The duplicate is gone; the survivor keeps the name that matches the
stage rail beside it (Scenarios → Analysis).

### A row's hover stopped reaching into nested tables

Reported on the bid grid: hovering one row tinted **every** row, and each row's
first cell took the 3px gold leading-edge bar — the scenario card's own hover
mark, appearing inside the card.

Neither was my row-card rule. Both were product-wide rules written with
descendant combinators:

```css
.data-table tbody tr:hover td { background-color: var(--color-surface-hover); }
.data-table tbody tr:not(.is-empty-row):hover td:first-child {
  box-shadow: inset 3px 0 0 var(--color-primary);
}
```

A bid grid lives inside a scenario row's detail cell, so hovering any bid row
hovers the **outer** row too — and `tr:hover td` then matches every cell of the
nested grid, while `td:first-child` matches every nested row's first cell. One
gesture, the whole panel repainted.

`tbody`, `tr` and `td` are always in that parent-child order in a real table,
so child combinators cost nothing and confine each rule to its own rows. Six
rules in `components.css` and two in `ux-v5.css` now read `> tbody > tr:hover >
td`. Specificity is unchanged, so nothing else in the cascade moved.

**Verified by simulating hover deterministically** — this pane's pointer does
not reliably set `:hover`, so every `:hover` rule was cloned as a `.__h` rule
inserted immediately after its original in the same sheet (same order, same
specificity), then the class was applied to a row *and all its ancestors*,
which is what a real hover does.

| Gesture | Before | After |
|---|---|---|
| Hover bid row 0 | all 4 rows tinted, all 4 first cells gold-barred | row 0 only; rows 1–3 keep their resting ground and frozen-edge shadow |
| Hover scenario card | — | card only; bid rows untouched |
| Hover analyzer-list row card | gold bar on first cell | unchanged |

### Workspace cards hug their rows

The comparison card stretched to the bottom of the pane, so a two-row
comparison sat at the top of a field of empty white. Three rules were doing it:
the section and the card both took `flex: 1 1 auto`, and the frame carried
`height: 100%` with a **floor of ten rows**.

The floor was the real culprit. It came from an earlier request — *"by default
I should be able to see minimum 10 rows"* — but a floor is a promise about a
table that has rows to show. On a two-row comparison it was reserving space for
eight rows that do not exist.

The ceiling is the half that was earning its keep: twenty rows, past which the
frame scrolls rather than turning a tall monitor into a wall of figures. It
stays. The floor is gone, and the section and card are `flex: none`, so the
card is sized by its rows.

**Measured**, at 1280×900:

| | Card | Table | Slack |
|---|---|---|---|
| 2 rows | 103px | 102px | 1px (the border) |
| after expanding a row → 12 rows | 423px | 422px | 1px |
| Evidence, Service breakdown, 12 rows | 439px | — | 1px |

The empty space is now *outside* the card — canvas ground below it — which is
what hugging means.

**The ceiling still works.** No table in this data set reaches twenty rows, so
rather than claim it untested I capped a frame to 200px directly: the card
followed to 201px, the viewport scrolled, and its bottom was reachable.
Restoring the cap returned it to 439px.

**A short window still reaches everything.** At 1280×640 a 439px card exceeds
the 438px pane, and `.canvas--fill` scrolls (100px of it) — scrolling to the
bottom puts the card's bottom edge exactly on the canvas's. That is the defect
`overflow-y: auto` was added for, and removing the floor did not reintroduce it.

**The analyzer list is untouched.** It fills deliberately, through
`.queue--fill`, not these rules: 15 rows, viewport 735px against a 735px body,
still scrolling internally.

### The scenario bar no longer collapses

The pull tab on the dock's gold rule is gone, with the collapsed strip, the
`da.dock.collapsed` preference and the `position: relative` that existed only
to anchor the tab.

It was always in tension with the reason the bar exists -- impact as permanent
chrome. A control whose whole purpose is to hide the thing the design is built
around is a control worth removing, and the bar is 42px expanded; it earns
them.

Two things deliberately stayed:

- **`.dock__compact` and `.dock__compact-metric`.** The dock no longer collapses
  onto that strip, but the Account Association page builds the same one-line
  summary from those classes. Verified still rendering: *"SELECTED 0 of 1 ·
  PENDING no changes"*, `display: flex` on both.
- **The Impact summary's own collapse.** Different feature, asked for
  separately, untouched.

**Verified:** no `.dock__tab` in the document; the dock renders at 54px with
its pills, `+` and commit intact, and `position: static`. A stale
`da.dock.collapsed = 1` left in localStorage from before no longer hides
anything — nothing reads it. No console errors.

### The dock's `+` arrives with the drawer open

The workspace dock's `+` already came back to Create Scenarios, but it landed
on the list and left the reader to find "Create New Scenario" for themselves --
the same button they had just pressed, one screen back. The intent travels with
the navigation now: `navigate('create-scenarios', { openCreateScenario: true })`,
and the drawer is open on arrival.

The link was broken in a third place, which is why the first attempt did
nothing: the route's `render(params)` forwarded only `showSourcingDialog`, so a
new flag reached `navigate` and stopped there. Passing it through was the
actual fix.

The drawer opens on the next tick rather than inline -- the page is still being
composed at that point, and the drawer returns focus to the button it was
opened from when it closes, which has to be in the document by then.

**Verified end to end:** `+` on the workspace dock lands on Create Scenarios
with "Create New Scenario" open and focus inside it; Save adds the scenario,
closes the drawer, moves the bar from *1 scenario · 4 bids* to *2 scenarios · 8
bids*, and returns focus to the bar's own Create New Scenario button. Reaching
the same screen any other way -- Back from the workspace, Source Data from
Customer Details -- opens no drawer. No console errors.

### Customer Details takes the same bar

Three changes, all asked for:

**Reference number and customer name share a line.** Each is one short field
and each was taking a full row, which the PQR/OPP pair directly above them
does not. They are one column apiece now.

**Annualize moved next to the shipping window** as a third column, in a
three-up row inside the two-column grid. It had been sitting below a divider
several rows down, where nothing said which fields it applied to — and it
annualizes that window. Bottom-aligned rather than centred, so it sits on the
date inputs' own edge instead of floating against the middle of two taller
controls.

**Back and Source Data moved into the brown bar** — the same band, pinned to
the window's bottom edge, that the workspace and Create Scenarios carry. On a
form this long the actions were previously found by scrolling to the end.

The bar states its subject the way the others do: **Shipping profile — 13
weeks**, which follows the date fields live (changing the end date to 15-06
took it to 4 weeks). That readout replaces the `Duration : 13 Weeks` line that
used to sit under the dates, so it is a move rather than a copy. It carries the
length only, not the dates: the native date inputs render in the browser's
locale order (`23-05-2026` here) while the page's state is `MM/DD/YYYY`, so
repeating them would have put one window on screen twice in two formats.

Source Data stays enabled. The form has no validation today and inventing a
required-field gate would have changed behaviour rather than layout.

**Measured**: the bar is pinned (`bottom === innerHeight`), full-bleed, 54px;
the form card keeps its own 700px measure inside an 851px scroll region — the
scroll region's page-width rule lands on a wrapper, not on the card. The dates
row is three equal columns (206.2 / 206.2 / 206.2px) all bottom-aligned. Back
and Source Data both route correctly, and Source Data still opens the sourcing
dialog on arrival. No console errors.

### The scenario list grows the page instead of scrolling itself

The list was a framed table: capped at `min(58vh, 620px)` with its own
scrollbar. That is right for a report grid of fixed height and wrong for a list
that expands — opening a scenario opened a second scrollbar inside a page that
already had one. `framed: false`, and the list grows.

Two things had to follow:

**The viewport stops being a scroll container.** Unframed it has no max-height
and would never scroll vertically anyway, but while it was still
`overflow: auto` it remained the nearest scrolling ancestor — so the sticky
header would have pinned to a box that never moves. Set to `visible`, the
header pins to the page's scroll region, which is the one actually scrolling.

**The scroll region stops squeezing its children.** It is a column flex
container, so its children default to `flex-shrink: 1` and compress to fit
rather than overflowing. Expanding a scenario added 225px to the table and
**4px** to the region's `scrollHeight` — the table was being squeezed straight
back down. `flex: none` on the children fixes it.

Measured with three scenarios: opening them takes the table 478 → 703 → 929px
and the page's `scrollHeight` 753 → 979 → 1204px, with no inner scrollbar at
any point, the bottom reachable, and the action bar still pinned to the window
edge.

### The seam, and a gold bar that was not a hover

**The gap.** The panel met the card exactly (0.00px), but the panel's own 16px
of top padding put a band of empty white between the card and the bid grid that
read as a seam. The panel has no padding now — the grid starts on the card's
bottom edge, and the actions row below it carries its own. The pair reads as
one card opened rather than a card with a tray under it.

**The gold bar.** A 3px gold bar appeared down the left of the whole panel
whenever the pointer was anywhere inside it, which looked exactly like the
card's hover leaking into the bid grid. It was not my row-card rule — it was
the product-wide one in `components.css`:

```css
.data-table tbody tr:not(.is-empty-row):hover td:first-child {
  box-shadow: inset 3px 0 0 var(--color-primary);
}
```

The detail cell is the **only** child of its row, so `:first-child` matches it,
and hovering any bid row hovers the detail row containing it. A panel is not a
row and takes none of a row's states, so it now refuses hover's background and
box-shadow alike.

**And the bid rows' own bar.** A bid row still lights up on hover — that is how
a wide row stays readable across to its right-hand columns — but with ground
alone. The 3px gold bar is the same mark the scenario card above uses for the
same gesture; two of them, one nested in the other, say the two levels are
equivalent. The outer one keeps it.

Verified by walking the cascade rather than by eye, since this pane produces no
hover state: for the panel cell, the base rule sits at document order 90 with
specificity (0,4,3) and the override at 953 with (0,5,3); for a bid row's first
cell, base at 90 (0,4,3) against the override at 958 (0,5,3). Both overrides
win on specificity and on order. The scenario card's *own* gold hover bar
survives — it is (0,5,3) at order 905, above the frozen-column reset at 906
which is only (0,3,2).

One knock-on worth naming: on hover the bid grid's frozen first column loses
its right-edge shadow. That was already true everywhere in the product — the
base gold-bar rule replaced that shadow rather than adding to it — so this is
not a regression, just the same behaviour with nothing drawn in its place.

### The row-card look stops at its own table

Cards are for the scenario rows. Inside an expanded scenario the bids are an
ordinary grid — bordered columns, gold header rule, striped rows — because a
row card nested inside a row card says the two levels are the same kind of
thing, and they are not.

Getting there took two goes, and the first one is worth recording because it
looked right and wasn't.

**Attempt 1: name the table.** The look was selected by descent from a wrapper
class — `.queue-table--rows .data-table tbody tr > td` — so a table nested in a
detail panel inherited it. I added a `tableClassName` option to `DataTable` and
moved the rules onto `.data-table.is-rowcards`, which the bid grid does not
carry. The bid grid still came out as cards.

**Why.** `.data-table.is-rowcards tbody tr > td` does not mean "cells of a
row-card table". It means "a `td` in a `tr` in a `tbody` *anywhere beneath* an
element that is a row-card table". The bid grid sits inside the scenario
table's own `tbody > tr > td`, so the outer table satisfied `.is-rowcards` and
the inner one supplied the `tbody tr td`. Every cell matched. Naming the table
was necessary and did nothing on its own.

**Attempt 2: walk the structure.** Every step is a child combinator now —
`.data-table.is-rowcards > tbody > tr:not(...) > td` — so the rules reach their
own table's rows and stop. Combinators contribute no specificity, so the
cascade against `ux-v5.css` and `components.css` is exactly what it was; the
comment about "three classes to their three" still holds.

The same descendant leak was in `.queue-table .data-table tbody td { height:
44px }`, which was setting the bid grid's row height from the analyzer list's
rule. Scoped the same way. And the scenario mount stopped carrying the queue's
wrapper classes entirely — with the look on the table itself they bought
nothing and cost that height override.

**Measured**, the two now differ in every property that defines the look:

| | Scenario cards | Bid grid |
|---|---|---|
| Row gap | `0 8px` | `0` |
| Row height | 60px | 32px |
| Column borders | none | 0.67px |
| Header rule | none | 2px gold |
| Header ground | page sand `#f7f2ea` | muted sand `#f2ede4` |
| Striping | none (cards) | `#fdfbf7` on even rows |

The bid grid's fingerprint matches an ordinary embedded grid measured
elsewhere in the product (Levers → Accessorials) on every one of those rows.
The analyzer list's own row cards are unchanged: 66px cards, 8px gaps, sticky
header on the page ground, uppercase sortable headers, 15 rows. No console
errors.

### Which actions belong in the brown bar

The bar is the workspace's, on a page that is not the workspace — same classes
(`.dock__btn`, `.dock__scope-k`), not lookalikes. One rule decides what goes on
it:

> **The bar carries actions whose scope is the whole page. Anything scoped to
> one row stays on that row.**

| Action | Where | Why |
|---|---|---|
| Back | bar, far left | Leaves the page. Quietest thing on it — a way out, not an action on the packet |
| Create New Scenario | bar, secondary | Adds to the page's list |
| Proceed to Analyzer Packet | bar, right, primary | Commits the packet and moves the stage on |
| Save | row panel | Saves *one* scenario |
| Update Description | row panel | Edits *one* scenario |
| Download Scenario Summary | row panel | Exports *one* scenario |
| Simulate New Bid | row panel | Adds a bid to *one* scenario |

The four in the panel are the ones that would confuse. A "Save" on a bar
underneath a list of scenarios cannot say which scenario it saves — and the
guess a reader makes ("all of them?") is a worse outcome than the extra click
of opening the row. Scope is the whole test: if the label needs a "for which
one?" answer, it is not a page action.

Two supporting rules keep the bar readable:

- **One primary.** Proceed is gold; Create New Scenario is the ghost variant;
  Back is barely a button at all. Three equal-weight buttons on a dark band
  read as a choice between three things, which this is not.
- **The bar says what it is about to do**, the way the workspace dock says what
  is being compared: *"Carrying forward 2 scenarios · 8 bids"*. Without a
  subject, "Proceed" is a button pointing at nothing. It also means Proceed can
  go inert honestly — with nothing included it is disabled and its tooltip
  reads *"Include at least one scenario with a selected bid"*.

**Measured**, at 1280×900: packet header **147px** (was 248px); scenario card
**60px** (was 158px); the bar is **56px**, pinned to the window's bottom edge
(`bottom === innerHeight`), full-bleed left to right, and stays put while the
content scrolls under it. The page itself no longer scrolls — a scroll region
inside it does, which is what lets the bar sit on the edge. At 1000×700 the bar
still holds one row with Proceed on the right edge.

**Driven and verified:** expanding a scenario opens a panel that meets its card
exactly (seam gap 0.00px, left and right edges aligned to the pixel, the card's
bottom corners squared to meet it, gold border continuous around the pair);
Create New Scenario adds a row and the bar count follows (1 scenario · 4 bids →
2 · 8); unticking every Include takes it to 0 · 0 and disables Proceed;
re-ticking restores it. A read-only scenario's panel offers only Download; an
editable one offers Simulate, Download, Update Description and Save. Back and
Proceed both route correctly. No console errors.

One loose end: `js/components/ScenarioBlock.js` no longer has a caller. It is
left in place and still script-tagged — it is the revert path for this change —
but it is dead code until then.

### The settings band stopped overlapping, and the selects wear the pill

**The overlap.** The band was a grid of `minmax(210px, 1fr)` tracks. `1fr` is
`minmax(auto, 1fr)` — a ceiling, not a floor — and Incentive basis is three
options wide with *"Cell by Cell/Customs"* among them. It measured past its
track, and a grid item that overflows is not allowed to push its neighbour, so
it ran underneath the Incentive method select: the two controls sat on top of
each other.

It is flex with wrap now, and nothing is allowed to shrink. Each setting takes
the width its control actually needs and moves to the next line when the row is
full — which is what the grid was approximating. Same wrapping model as the
scope bar above it.

**The selects.** Service group (scope bar) and Incentive method (settings band)
are both a choice among named options standing next to segmented controls
making the same kind of choice — but they were drawn as form fields: 42px
against the pills' 35px, square-cornered, and a size larger in type. That put
two captions on one line onto two different baselines, and made the row read as
a pill group plus an unrelated input.

They take the pill's own box: same border colour, same 999px radius, same
ground, same 13px type, chevron kept because it is what says this one opens.
The height is **not** hard-coded — it is the segmented control's build
restated (1px border + 3px pad + option + 3px pad + 1px border), so moving
`--control-height-sm` still moves both together.

**Measured**, at 1280px: every control in both bands is **35.33px**, identical
to the sub-pixel — the two pill groups and the two selects. Captions share one
baseline per band. Incentive basis ends at x=692 and Incentive method starts at
x=712: a 20px gap where there had been an overlap. The open panel still lands
4px under its trigger, left-aligned, and picking an option still writes back.

At **900px** the band wraps to three rows with no overlap and nothing spilling
its edge — the case the grid used to fail. The scope bar still holds one line.

### The plan hierarchy is a captioned scope bar

The drill path had already replaced the nested accordions, but it left three
stacked rows of **unlabelled** pills — Domestic / International over Air /
Ground over six service names. Nothing said that each row decided a different
thing, so they read as one long list of pills rather than as three questions,
and the six-item bottom row took a line to itself.

The levels are captioned controls on one line now, the same treatment as the
settings band the reader meets immediately below:

| Level | Caption | Control |
|---|---|---|
| 1 | Movement | pills — Domestic / International |
| 2 | Mode | pills — Air / Ground |
| 3 | Service group | select — six services |

The naming is the app's own: the accessorial incentive rows carry
`movement` / `mode` / `serviceGroup` / `service` fields, and the grid on that
tab heads its columns Movement, Mode, Service Group, Core Service.

**Pills up to three options, a select beyond.** Two or three fit on the line
and show their siblings without being asked. Six do not — that is what pushed
the old third row onto a line of its own. The threshold is one constant
(`PILL_LIMIT`), not a per-level setting, so the ragged trees sort themselves
out: Domestic > Ground has a single service and renders one pill; Accessorials
shows three pills at level one.

**Add Service Incentive Plan moved to the right of the bar.** It is the only
control there that is not a scope choice, and it had been heading the card
above levels it has nothing to do with. `margin-left: auto` rather than a
spacer, so it still sits beside the last level when the bar wraps on a narrow
window.

**Measured**, at 1280px:

- The bar is **83px** for all three levels plus the action, replacing three
  stacked chip rows and a separate action block above them.
- Captions share one baseline (all at y=298) and controls share another (all
  at y=321, all 35px). The select trigger stands 42px by default, which had put
  its caption 7px above the other two — it is held to the pills' height here.
- The action clears the bar's right edge by 16px, matching the card's inset.

**Behaviour, verified by driving it:** International drops the Service group
level entirely (no service list is sourced under it); Domestic > Ground shows
its single service as one pill; picking from the select swaps the leaf and
hands focus back to the trigger rather than dropping it on the body — the level
that gets moved most is the one a keyboard reader would otherwise lose. On
Accessorials, Fuel Surcharge and Other Charges render one level, Transportation
Charges renders three. No console errors on any path.

### The wheel no longer dies over a table

Reported: *"While my mouse over any table, the page scroll is not working, I have
to move the mouse out of table to scroll the page."*

The report frame carried `overscroll-behavior: contain`. I added it to stop the
page lurching onward when a grid ran out of rows. What it actually does is
switch off **scroll chaining** — the wheel is not allowed to reach the page from
inside that box, ever.

That is worst on the grids that need it most. Most report grids scroll
**sideways only**: pinned header, pinned key columns, all rows visible, nothing
to move vertically. Under `contain` a vertical wheel over one of those had
nothing of its own to scroll *and* was forbidden from passing the scroll on, so
it did nothing at all. The table had become a dead zone the pointer had to be
steered around. Measured on Evidence: a viewport with `vOver: false,
hOver: true` — no vertical overflow, sideways overflow, chaining blocked.

The vertical axis chains again. The horizontal one keeps `contain`, which is
the case the property is actually good for: it stops a sideways flick on a wide
grid from firing the browser's back-navigation gesture and throwing away the
screen.

```css
overscroll-behavior-x: contain;   /* no accidental back-navigation */
overscroll-behavior-y: auto;      /* the page scrolls from inside a table */
```

Verified by measurement: this is the only `overscroll` declaration left in the
build, so no element in the app can block a vertical scroll — a static
guarantee rather than a page-by-page sample. Swept all 11 workspace tabs and
the packet list for computed `overscroll-behavior-y` other than `auto`: none.
Internal scrolling is intact — framed viewports with sideways overflow still
scroll sideways (set `scrollLeft`, read back non-zero), and the `.grid-scroll`
boxes on the plan tabs were already chaining.

**Not verified here:** the wheel itself. The preview pane delivers no wheel or
scroll events, so chaining is confirmed from the computed styles that govern
it, not from a scroll gesture. Worth one pass in a real browser.

### Grid sizing — one scrollbar, 10 to 20 rows

The nested-scrollbar problem had one cause: the grid had a *fixed* height
(`max-height: 58vh`) inside a canvas that also scrolled. Collapsed, Cost Details
measured a 326px table in a 664px canvas — 338px of empty space below it, with
9 rows showing where 18 would have fitted. Expanded, both containers scrolled.

On the modes whose subject is a single grid (Impact, Evidence), the grid now
claims the canvas height instead of sizing to its content: it fills what is
there and owns the only scrollbar. Levers is genuinely long-form — a tier
matrix over three trees — so it still scrolls the canvas normally.

Row counts, measured on Cost Details:

| Window height | Rows visible | Scrollbars |
| --- | --- | --- |
| 640 | 10 (floor) | 2 — canvas scrolls, see below |
| 768 | 11 | 1 |
| 900 | 15 | 1 |
| 1200 | 20 (ceiling) | 1 |

The floor is 10 rows and the ceiling 20. Both sums include ~20px for the
horizontal scrollbar's gutter: without it a 10-row floor rendered 9, because
`clientHeight` excludes the gutter (measured 358px of box giving 343px of rows).
Below ~800px of window height the floor wins and the canvas scrolls again —
one nested scrollbar in the extreme, none at a taller window.

The canvas keeps `overflow-y: auto` for exactly that case. An earlier revision
set it to `hidden`, on the reasoning that a filling pane measures the canvas
height so no scrollbar is needed. That is true until the floor makes the pane
taller than the space available, and then `hidden` clipped the overflow and
left it unreachable: measured at 700px of window height, Impact wanted 604px
inside 472px, so **132px of the grid could not be got to at all**, and at
768px — the most common laptop height — 64px was lost the same way. With
`auto` the scrollbar appears only when it is genuinely needed.

Impact was the worst offender and needed a layout change, not just sizing: its
verdict block measured 169px because the explanation wrapped, and stacked with
the driver tiles it cost 264px before the grid began. Verdict and drivers now
sit side by side (tiles 2×2), which costs ~100px less and reads better — the
call and the reasons for it together. Impact now has **zero** scrollbars.

### Frozen key columns on the incentive grids

The incentive grids put zones across the top and the thing being priced down
the side. That side is not always one column: on the weight-break grid
(**Cell by Cell/Customs** > *Zone Reference: Daily*) it is two — `from` and
`to`, which together read as a range: 1-5, 6-10, 11-20, 21-30, 31+. Freezing
only the first left the upper bound scrolling away with the figures, so a row
said "1" and you had to remember what it was 1 *to*.

Plain CSS cannot do this. A second sticky column must be offset by the exact
width of the one before it, and these grids carry no colgroup: the key columns
size to their content, and the header spans both with "Billable Weight (lbs)",
which is wider than the two figures beneath it. So `js/workspace/matrixFreeze.js`
measures the leading key columns and applies the offsets inline, the same way
`DataTable` computes its own frozen-column offsets. CSS keeps `left: 0` as the
fallback, which is correct for a single-column key and is what the inline value
overrides.

Verified on the weight-break grid at 1280px: after scrolling the grid 239px,
`from` holds at x=0 and `to` at x=76 (the measured width of `from`), while the
first zone column moves to x=-98. The "Billable Weight (lbs)" header spanning
both stays at x=0. The edge shadow sits on the `to` column only — drawing one
between `from` and `to` would split a range that reads as one field.

### The `% Modeled` column is frozen

The tier and service incentive grids put revenue bands or zones across the top
and the thing being priced down the side, so the first column is what
identifies every row: `% Modeled`, `Low`, `High`, then each service group. It
scrolled away with the figures, leaving a grid of numbers with no way to tell
which line any of them belonged to — the same defect the report tables had
before their identity columns were frozen.

`.matrix__label` and `.matrix__rowhead` are now `position: sticky; left: 0`
with an edge shadow matching the data tables. The zebra rule sets a background
at higher specificity, which would have made the frozen cell translucent on
every other row, so it is restated for the sticky column. Verified: after
scrolling the grid right, the label column holds at offset 0.

### Card view / table view

The landing page now carries both, on an icon switch beside the scope control.
They answer different questions, which is why it is a switch and not a
preference:

- **Cards** — *"what needs me"*. Grouped by what each packet is waiting for, so
  triage is the layout itself. Order is editorial, not sortable.
- **Table** — *"let me scan and compare"*. One flat grid, sortable on Packet,
  Customer, Status, Scenarios, Owner and Modified. This is what a table is
  actually good at, and what the old v4/v5 landing screen was trying and
  failing to be, because it grouped nothing and sorted nothing.

Nine columns became seven: customer name and account number are one identity,
so they share a cell; Created Date went, because on a work list the date that
matters is the last one. Status keeps the card's pill, owners keep their
initial dot, and the packet ID is the record link.

Sortable columns carry the neutral sort glyph before they are sorted, so the
affordance is visible ahead of the first click rather than only after it. The
switch is icon-only and lighter than the scope control beside it: scope changes
*which records* you see, this changes only how the same records are drawn, and
giving them equal weight would read as two equivalent choices.

The choice is remembered per browser (`localStorage`, wrapped in try/catch so a
private window or blocked site data falls back to cards rather than throwing).

### Scrollbars and the second rail

**Scrollbars are compact at rest and grow under the pointer.** The gutter stays
a constant 12px and only the thumb changes size — 6px resting, 10px on hover —
drawn inside a transparent border with `background-clip: padding-box`.
Animating the scrollbar's own width would reflow the content beside it on every
hover; this way nothing moves.

The two scrollbar APIs cannot both be set: from Chrome 121 the standard
`scrollbar-width` wins outright and every `::-webkit-scrollbar` rule is ignored
(measured as a fixed gutter with no hover response). So `scrollbar-width` is
scoped to engines with no WebKit pseudo-elements via
`@supports not selector(::-webkit-scrollbar)`, and Chrome/Safari get the
pseudo-elements. Firefox has no equivalent of the hover growth — it offers
auto/thin/none and nothing else — so it gets the thin resting state, which is
the more important half.

**The top rail now appears only when it earns its place.** It exists for
*reach*: on a tall grid the table's own horizontal scrollbar sits at its bottom
edge, out of view while you read the top rows. When the table is short enough
to fit its frame, that problem does not exist and the rail was simply a second
horizontal scrollbar on the same table. It now shows only when the table
overflows horizontally **and** scrolls vertically. Verified across all six
breakdowns: the rail is present exactly when both are true and never otherwise.

### Kept from v5

The palette migration, the report frame (bounded scroll, pinned header, frozen
identity columns, top-docked horizontal scrollbar), the guide-rail trees and
the interleaved matrix all carry over unchanged. Flags still live in
`js/core/ux.js`.

### Reverting

v6 is a separate build. `UPS-Demo-v5` and `UPS-Demo-v4-main` are untouched and
still run. Within v6, the old packet screen (`js/pages/analyzerPacketPage.js`)
and the old table landing (`js/pages/analyzerPacketsPage.js`) are still loaded
and intact — point `js/main.js` back at `AnalyzerPacketPage` and
`AnalyzerPacketsPage` to restore the v5 structure with the v6 shell.

### Verified

Measured at 1440x900 and 820x760, no console errors across the full flow:

- Work queue groups 15 packets into Needs attention (2) / Ready to work (7) /
  Sourcing data (6); scope and search filter live.
- Rail shows profit and total discount per scenario with the delta against
  baseline; selecting a scenario redraws canvas and dock together.
- Impact reads "Scenario 1 improves profit without widening discount" from
  recorded figures, with direction-of-good per metric.
- Evidence exposes all six breakdowns with row counts.
- Mode round-trip retains everything: 25 expanded rows, scrollLeft 800,
  scrollTop 100 and the chosen breakdown, same DOM node.
- Dock stays pinned to the viewport bottom; the page never scrolls sideways;
  at 820px the rail folds to a strip and the dock holds.

---


## UX v5 — what changed, and how to undo it

This build applies the recommended option from each finding in *Rebuilding the
Analyzer*. Everything is additive: no v4 file was rewritten, so each change
switches off on its own.

**Revert the look** — remove two lines from `index.html`:

```html
<link rel="stylesheet" href="styles/dda-v2.css" />
<link rel="stylesheet" href="styles/ux-v5.css" />
```

**Revert a behaviour** — set its flag to `false` in `js/core/ux.js`. Each flag
is independent.

| Finding | Built | Flag | Evidence it works |
| --- | --- | --- | --- |
| **F4 palette** | Table headers move from charcoal `#5F5652` + white type to Sand Subtle `#F2EDE4` + UPS Brown under a gold rule. Blue removed everywhere — record links, info states, focus ring, field borders, hover tints. Teal (not in v2 either) becomes the gold accent; selected states become brown-on-gold-wash. | *(stylesheet)* | Header `rgb(242,237,228)` on brown, 13.9:1 |
| **F1 C** | Report frame. Embedded tables take a bounded scroll box (`min(58vh, 620px)`), so the sticky header and frozen columns engage. A second horizontal scrollbar is docked **above** the grid. Lane identity freezes as a group of 3 (Core Service / Zone / Lane) instead of 1 of 25. | `frameTables` | 45 rows scrolling in 507px; header and identity column both hold offset 0 while scrolled to 180/900 |
| **F2 B** | Interleaved comparison matrix — one row per line item, scenarios grouped under each metric with a Δ column. Rows merge by label, so a scenario carrying an extra row no longer shifts everything beneath it. The matrix now reads the same selection the band does, and the comparison opens live rather than baseline-only. | `interleavedComparison`, `compareByDefault` | 16 columns; band reads Current / Scenario 1 / Change on arrival |
| **F3 B** | Guide rails. Indent goes from 9px to 34px per level with a hairline rail down each open level, a sand ground on level-one headers, and gold-wash on the active leaf. Rows got **denser** (34→28px plan tree, 38→30px account tree) because structure no longer depends on padding. | `treeGuideRails` | Steps 63 → 97 → 131; active leaf `#FFF6E0` + 3px gold rule |
| **F4 C→A** | Tab panels are built once and kept alive. Expansion, scroll position and selection survive a tab round-trip. *(Option A, not the recommended C — see below.)* | `keepTabPanels` | 45 rows / scrollLeft 900 / scrollTop 180 survive both a sub-tab and a top-level round-trip, same DOM node |
| **F6 A** | Verdict strip above the comparison band: the call in words plus four drivers, readable at rest instead of on hover. Direction of good is declared per metric — a rising discount reads adverse, a falling operating ratio reads favourable. | `verdictStrip` | "Scenario 1 improves profit without widening discount" |

### Deliberately not built here

- **F4 C (addressable analysis)** needs a real router and is the largest
  structural change in the proposal. F4 **A** is shipped instead: it fixes the
  same felt problem — losing your place — without inventing a URL scheme that
  the eventual routing work would have to unpick. C remains the recommendation.
- **F5 (filters)** is untouched. The ten select fields still carry no change
  handler, because wiring them is functionality rather than UX, and an applied-
  chip row that filters nothing would be a worse lie than a dropdown that
  filters nothing.
- **F6 C (commit dock)** waits on approval rules that do not exist yet.

### One correction to the colour system

Success Green `#1F8A4C` measures **4.38:1 on white** and **4.07:1 on Gold
Wash** — under AA for the 12–13px figures it is used on, and weakest on
exactly the selected row where a favourable delta matters most. Risk Red passes
at 5.62. `dda-v2.css` keeps `#1F8A4C` as the fill token and adds
`--color-success-text: #1B7B44` — same hue, 5.30 / 4.92 on those two grounds.
Worth folding back into the system doc.

### Known limits of the verification

Scroll events do not fire in the preview pane used to test this, so the
**two-way sync between the top scrollbar and the table could not be exercised
here** — only its measurement (the rail sizes correctly to 2,640px and shows
and hides as it should). Confirm the drag behaviour in a real browser.

---


Front-end recreation of the Digital Analyzer product screens, built from the
reference screenshots. The goal each time is the same:

> **Same structure, same content hierarchy, same interaction intent — better
> visual execution.**

Open `index.html` directly in a browser; there is no build step.

## Screens

| Screen | File | Notes |
| --- | --- | --- |
| Analyzer Packets (landing after sign-in) | `js/pages/analyzerPacketsPage.js` | Scope switch, search, primary action, 9-column table |
| Customer Details (New Analyzer Packet, step 1) | `js/pages/customerDetailsPage.js` | Reached from **New Analyzer Packet**; customer lookup, shipping profile, optional PLD upload |
| Create Scenarios and Analyzer Packet (step 2) | `js/pages/createScenariosPage.js` | Reached from **Source Data**, arriving with the sourcing-in-progress dialog open; the scenario row expands to its sourced bids |
| Account Association | `js/pages/accountAssociationPage.js` | Reached from **Accounts** on a bid in an editable scenario; parent > subparent > account tree |
| Analyzer Packet | `js/pages/analyzerPacketPage.js` | Reached from **Proceed to Analyzer Packet**; scenario comparison band over two levels of report tabs |

Screens swap below the header via `navigate()` in `js/main.js` — the single
seam to replace when real routing arrives. The header re-renders per screen, so
a view can add its own return path; Account Association uses that for
**Back to My Analyzers**. The packet under construction is held across
navigation, so leaving a screen and returning keeps its state.

## Structure

```
.
  index.html                  page shell + script/style manifest
  styles/
    tokens.css                design tokens — the single source of truth
    base.css                  reset, document defaults, utilities
    components.css            component library
    layout.css                page shell + responsive rules
  js/
    core/dom.js               tiny element factory used by every component
    core/icons.js             inline SVG icon set
    components/               reusable UI components (one file each)
    data/                     demo data — replace with API responses
    pages/                    screen composition
    main.js                   entry point
```

Components are plain factory functions returning real DOM nodes, so the output
stays semantic HTML (`<table>`, `<th scope="col">`, real `<button>`s) with no
build tooling. Each is framework-agnostic and can be ported to React/Angular
later without changing the design system.

### Component library

`AppHeader` · `Panel` · `Button` / `IconButton` · `Avatar` ·
`SegmentedControl` · `SearchField` · `StatusBadge` · `DataTable` /
`RecordLink` · `EmptyState` · `Field` / `SelectField` / `HelpButton` ·
`ChipInput` · `Toggle` · `Accordion` · `FileDropzone` / `FileItem` ·
`Modal` (dialog, wide dialog, or right-anchored drawer) · `Alert` ·
`SummaryPanel` / `Detail` · `Checkbox` · `ScenarioBlock` · `Tabs` ·
`StatRow` · `Breadcrumb` · `Dropdown` · `FilterChips`

Composed dialogs live in `js/dialogs/`.

### Fields

`Field` uses the placeholder to carry the label while empty and floats the
label to the border once the field holds a value, so a filled field is never
left unlabelled. `ChipInput` commits entries on space or enter (and splits a
pasted list); with `multiple: false` it holds a single value, which is how the
parent/child customer lookup behaves.

## Design system

All colour, type, spacing, radius, elevation and component dimensions live as
tokens in `styles/tokens.css`. Screens and components consume tokens only — no
repeated hard-coded values.

- **Type scale**: 11 / 12 / 13 / 14 / 16 / 18 / 22 px, weights 400–700.
- **Spacing**: 4 px base scale (`--space-1` … `--space-8`).
- **Radius**: the 2 / 4 / 6 / 8 / pill scale, consumed through three *role*
  tokens rather than picked per component — `--radius-surface` (outermost
  surfaces: panel, form card, dialog), `--radius-container` (anything nested
  inside one: card, accordion, tree, alert, search bar) and `--radius-control`
  (inputs, buttons, badges, checkboxes). Pills opt out explicitly. Components
  reference the role, so a radius decision is made once.
- **Colour**: semantic tokens (`--color-text-primary`, `--color-info`,
  `--color-error`, …) over the product's existing character — UPS gold for the
  primary action, teal for the selected scope, charcoal table header,
  blue record links. Teal reaches only 4.1:1 as *type* on the grey page, so
  text uses `--color-primary-text` — the palette's own darker teal, not a new
  hue. Fills, borders and states still use `--color-primary` itself.

## UX/UI refinement pass

A polish pass over the built screens: alignment, typography hierarchy, spacing,
component consistency, interaction states and accessibility. **No layout, no
information architecture and no brand colour changed** — the DOM structure of
every screen was fingerprinted before and after and is identical, apart from
two deliberate semantic changes noted below.

**Alignment**

- Every field in `.form-grid` reserves the help-button gutter, with or without
  a `?` in it. Previously a field with help was 28px narrower than one without,
  so the full-width stack had two different right edges and the icons never
  shared an axis. All inputs now share one right edge; all `?` icons share one
  vertical axis.
- The help button's vertical offset was a hard-coded `11px` tied to a 42px
  control; it is now derived from `--field-height`.
- The Reset action in `.report-filters` was 34px in a row of 42px fields. It
  matches the fields it sits beside, so the row has one top and one bottom edge.
- `.record-header` aligns its title and metadata on a shared **baseline**. The
  title's brand rule was dragging the metadata 11px below the title's own text.
- A scenario row's cells shifted 4px sideways on every expand, because the
  collapsed row reserved `--space-3` where the expanded row's gap is
  `--space-4`.
- The leading `Back` link is pulled flush by its own horizontal padding, so it
  sits on the same left edge as the breadcrumb and content beneath it.
- `--key` and `--date` scenario cells have a width floor, so the fixed-shape
  columns line up between stacked scenario cards.

**Typography**

- `.page-title` was 13px bold — smaller than the section headings beneath it,
  and a different size from the identical-level titles on the other two
  screens. All three page titles now share one treatment.
- `.page-heading__subtitle` was bold and outweighed the `.section-title` below
  it. Supporting text now reads as supporting text; the section heading carries
  the weight of its level.
- `.detail__value` was lighter than its own bold label, so a record summary
  read its labels first. Values are primary text, labels secondary.
- Table column headers are semibold, holding them apart from the figures below.

**Interaction and states**

- Every button variant has a pressed state; only `--primary` had one.
- Disabled controls are legible (`#757575` on `#f0f0f0`, up from `#9e9e9e`) and
  keep their treatment on hover, and carry a visible border.
- Table rows grow a leading marker on hover, so a hovered row stays findable
  while reading the far right of a table that scrolls horizontally.
- Tree rows and matrix rows gained hover feedback; the `is-rowhead` label
  column now responds to its row's hover instead of sitting it out.
- The whole `.chip-input` box is a click target; the entry line inside it is
  21px of a 42px control.

**Accessibility**

- **Keyboard focus was invisible on every text input and select.** The global
  focus rule lived in `:where()` at zero specificity and lost to each
  component's own `outline: none`, leaving a 15–18% opacity glow as the only
  indicator. The global rule is declared at real specificity and each affected
  control has an explicit `:focus-visible` ring.
- Every **enabled** control and every piece of body text clears WCAG AA (4.5:1)
  on the surface it actually sits on. `--color-text-muted`,
  `--color-field-label` and teal type each failed against the grey page
  background; each was darkened within its own hue. The one text colour that
  does not reach 4.5:1 is the **disabled** label, at 4.04:1 — WCAG 1.4.3
  exempts inactive controls, and darkening it further would stop a disabled
  button reading as disabled. That is a deliberate limit, not an oversight.
- `Expand To Find Bid Details` was a `<span>` with a click handler — the only
  way into a collapsed scenario, and unreachable by keyboard. It is a real
  button, and focus now follows the disclosure to whichever control replaces it.
- Icon-only controls under 24px extend to the WCAG 2.2 minimum target through
  `.u-tap-target`, which puts the extra hit area on a pseudo-element so nothing
  around it moves. It covers the help button, the table row expander, the
  scenario disclosure and status menu, the account tree expander, the chip
  remove `x` (12px), the pricing-terms row actions (13px) and the
  `Expand To Find Bid Details` disclosure (20px tall). The checkbox reaches the
  same minimum a different way: its input is the hit target and is absolutely
  positioned over an 18px box, so it cannot take a utility that sets
  `position: relative` — it is centred and grown to 24px on its own, leaving
  the visible box at 18px.
- A field whose label ends in `*` carries `aria-required`. The rule lives on
  `DA.components.isRequiredLabel` and is applied by `Field`, `SelectField` and
  `ChipInput` alike, so a required chip field (`Enter Parent*`) announces
  itself like every other required field.
- Empty cells no longer carry an empty `title` tooltip.

**Responsive**

- Below 720px `.form-grid` and the summary panel stack to one column; two 42px
  fields sharing that width left ~150px each and clipped their labels. Desktop
  is untouched.
- An empty table drops its fixed column widths, so the empty state centres in
  what the reader can see rather than in 1180px of empty grid. It was
  previously pushed off to the right and clipped.

**Deliberately not changed**

- The description column between stacked scenario cards still sizes to its
  content, so its dividers do not line up card to card. Forcing it would mean
  truncating `13 WEEKS UPS SHIPPING PROFILE` on the baseline scenario, and
  hiding content to win an alignment is the wrong trade.
- The breadcrumb separator is `/` on the analyzer packet screen and `>` on
  account association. Both come from their own reference screens, so unifying
  them is a call for the design owner, not a defect to fix silently.

## Tables stay tables

`DataTable` renders a real table with a sticky header inside a scrollable
viewport. On narrow screens the table scrolls **horizontally** — it is never
converted into cards, tiles or stacked lists — so column alignment and row
comparison survive at every size.

## Accessibility

- Semantic landmarks (`banner`, `main`), one `<h1>` for the product name, a
  visually hidden `<h2>` naming the screen, and a skip link.
- Table uses `<th scope="col">` plus a visually hidden `<caption>`; the scroll
  container is a keyboard-focusable labelled region.
- Segmented control is a real `radiogroup` with arrow-key navigation.
- Search input has a real (visually hidden) `<label>`.
- Row-count changes are announced through an `aria-live="polite"` region rather
  than adding visible chrome.
- Visible focus ring on every interactive element; `prefers-reduced-motion`
  disables transitions.

## Deliberate deviations from the reference screenshot

Everything else is a faithful recreation. These three changes were made on
purpose and are each a one-line revert:

1. **`ERROR OCCURRED` badges are red** (`--color-error`). In the reference every
   status shares one light-blue treatment, so a failed packet reads exactly like
   a healthy one. Revert by mapping `'Error Occurred'` to `'info'` in
   `js/components/StatusBadge.js`.
2. **Row height 36 px** (reference ≈ 26 px) for a comfortable click target and
   legible vertical rhythm. Revert via `--table-row-height`.
3. **Search field is slightly wider** so the full placeholder is visible instead
   of being clipped mid-word. Revert via `.search-field { max-width }`.
4. **`Add Duration* (In Weeks)` and the drawer's `Scenario Name` are white**,
   like every other filled field. The reference tints them, which reads as a
   different kind of control than the identical fields around them.
5. **The OPP hint wraps to two lines.** The reference fits it on one at roughly
   8.5px, which is below a legible size; it is set at 10px here.
6. **The scenario name truncates on one line** rather than wrapping to two
   before truncating, as the reference does.
7. **The source dialog's filters use the product's own field style** — label
   inside the box — rather than the notched outline the reference draws there,
   so every select in the app looks the same.

8. **The count tiles use line icons** from the product's own icon set rather
   than the reference's 3D isometric illustrations.
9. **Numeric column headers are right-aligned** over their right-aligned
   figures; the reference centres them.
10. **Drill-down figures are not underlined**, so number columns stay quiet.
    Record links — shipping profiles, accounts — still are.

Only the Accessorial view is documented by a screenshot. The Services view
mirrors it, naming its first column `Service` and dropping the accessorial
filter; both show `No data available.` until source data is wired up.

The bid table's header is a warmer dark than the packet list's, matching the
reference. Point `--color-surface-inverse-warm` at `--color-surface-inverse`
to make every table header identical.

## Flow

```
Analyzer Packets ──New Analyzer Packet──▶ Customer Details ──Source Data──▶ Create Scenarios
       ◀───────────────Back───────────────       ◀──────────Back───────────
```

`Source Data` builds the packet record through `js/data/newPacket.js` — a demo
stand-in for the create-packet endpoint. It continues the packet ID sequence
from the existing list (so the first new packet is 112002, as in the
reference), stamps the clock for created/modified, and names the signed-in user
as owner. Any field left blank on the form falls back to the reference customer
so the walkthrough still reads correctly.

## Derived values

`Duration : N Weeks` is computed from the shipping profile window as whole
weeks covering both end dates — `ceil((days between + 1) / 7)`. This reproduces
both reference examples: 05/23/2026–08/15/2026 is 13 weeks and
05/17/2025–04/04/2026 is 47 weeks. It is the only calculation in the UI; no
other business logic is assumed.

## Account association

The counts above the tree are derived from the accounts in it, using each
account's `type` and `associated` flags — the tiles cannot drift from the rows.
Checkboxes cascade: the parent and subparent rows select every account beneath
them.

## Analyzer packet

**Comparison View** is a multi-select dropdown, not a plain select: it lists the
packet's scenarios as checkboxes with an Apply action, so the report can cover
one scenario or several. Applying redraws the comparison band — one row per
chosen scenario, padded to two, then their difference. The charge chips beneath
the filter row are each removable.

Differences come from `scenarioDifferences` rather than being recomputed in the
UI. The figures above them are rounded for display, so subtracting those lands a
unit off on Total Disc and Profit; `DA.figures.difference` derives one only for
a scenario pair with nothing recorded.

Tabs: **Summary**, Rate Charts, **Shipping Profiles**, **Pricing terms**, Other
terms. Shipping Profiles splits again into Cost, Zone, Weight, Account,
Accessorial and Service — built so far: **Cost** (27 columns), **Zone** (15),
**Accessorial** and **Service**. Weight, Account, Rate Charts, Pricing terms
and Other terms render the product's own `No data available.` state rather
than invented content.

Every shipping profile view opens with the same five lane keys (Movement, Mode,
Core Service, Zone, Lane), so those live once in `PROFILE_KEYS` and each view
supplies only its own figures. Accessorial instead groups a parent charge over
its detail lines, with the label columns held on the header's dark bar.

**Pricing terms** (`js/views/pricingTerms.js`) splits into Tier Incentives,
Services, Accessorials and Modifiers. Tier Incentives and the service incentive
plan are matrices rather than record lists — rows are labels, columns are
revenue bands or zones — so they use a `.matrix` table with editable cells
instead of `DataTable`. Services is a three-level tree (region > mode >
service); each branch and plan is built the first time it opens, so a collapsed
tree costs nothing. Modifiers has no reference screen yet.

Summary shows one panel per scenario side by side, each a collapsible
hierarchical table — total, account, sub-total, then service codes. Row labels
carry the packet's customer, so `{customer} MAIN` resolves to the record you
are actually looking at.

`DataTable` grew four variants for this screen: a `plain` header for the
comparison band (weight instead of a dark bar), `dividers` for its column
rules, `tinted` for report table bodies, and an `is-rowhead` column class that
holds label columns visually apart from the figures beside them.

## Expandable rows

`DataTable` owns row expansion: give it `expandKey` (the column whose cell
carries the toggle) and `getChildren(row)`, and children appear beneath their
parent, indented, until it is closed. A row flagged `expanded` starts open.

Where the references break a row out, those children are recorded. Everywhere
else they are derived in `js/data/breakdowns.js` — additive figures split by
share, rates carried down unchanged — so a breakdown always adds back up to the
row above it. Expanding a lane shows the zones it shipped in; expanding an
accessorial shows the services that incurred it.

## Not yet wired

On the account screen, `Search`, `Attach Account` and `Review Changes` are
inert, and `Review Changes` renders disabled as in the reference.

The form does no validation, and on the scenarios screen `Download Scenario
Summary`, `Create New Scenario`, `Update Description` and `Proceed to Analyzer
Packet` do nothing yet — all wait on the workflow rules. `Proceed to Analyzer
Packet` renders disabled, as in the reference. The help (`?`) buttons carry
placeholder text.

Bid selection is live: each bid's checkbox and the header select-all toggle
real state on the scenario record. Non-incented revenue has no checkbox — it is
always included.

## Scenarios

`Create New Scenario` opens a drawer that copies an existing scenario. On save
the new scenario is appended, opens, and folds the others away.

The two kinds of scenario differ, following the reference:

| | Baseline (`Scenario 0`, named *Current*) | User-created |
| --- | --- | --- |
| Status | `Current` | `Analysis In Progress` |
| Bid table | 5 columns | adds **Account Association** |
| Shipping profile | plain text, `S0-` | links, `S1-` and up |
| Extras | — | Simulate New Bid, Save |

A shipping profile link in an editable scenario opens the **source data
dialog** (`js/dialogs/shippingProfileDialog.js`): the bid's reference source and
report window over Services and Accessorial views, each with account and
service filters. Reference Source is the bid number, and the report window is
the packet's shipping profile in `YYYY-MM-DD`.

Copying rewrites the shipping-profile prefix to the new scenario's index
(`S0-UPS-PLD-1` becomes `S1-UPS-PLD-1`); profiles without an index prefix, like
non-incented revenue's `UPS-PLD`, are left alone. The summary row shows the
scenario's **name** then its **description** — the drawer captures both.

## Demo data

`js/data/analyzerPackets.js` transcribes the 15 rows from the reference screen
in the same order. `js/data/session.js` holds the signed-in user (initials
`AA`); **My Analyzers** scopes the list to packets that user owns, which is why
it shows the empty state against this demo data — none of the visible packets
belong to `AA`. Swap both files for API responses when the endpoints land.

## Known placeholder

`js/core/icons.js` draws a **simplified UPS shield** in code. Replace it with the
official brand asset before any external release.
