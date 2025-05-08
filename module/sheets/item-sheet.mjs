import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ProwlersParagonsItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['prowlers-and-paragons', 'sheet', 'item'],
      width: 520,
      height: 480,
      dragDrop: [{ dropSelector: null, dragSelector: null }],
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'description',
        },
      ],
    });
  }

  /** @override */
  get template() {
    const path = 'systems/prowlers-and-paragons/templates/item';
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.hbs`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.hbs`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    const itemData = this.document;

    // Enrich description info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedDescription = await TextEditor.enrichHTML(
      this.item.system.description,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.item.getRollData(),
        // Relative UUID resolution
        relativeTo: this.item,
      }
    );

    // Add the item's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Adding a pointer to CONFIG.PROWLERS_AND_PARAGONS
    context.config = CONFIG.PROWLERS_AND_PARAGONS;

    // Prepare active effects for easier access
    context.effects = prepareActiveEffectCategories(this.item.effects);

    context.abilities = CONFIG.PROWLERS_AND_PARAGONS.abilities
    context.power_rank_types = CONFIG.PROWLERS_AND_PARAGONS.power_rank_types
    context.power_sources = CONFIG.PROWLERS_AND_PARAGONS.power_sources
    context.power_ranges = CONFIG.PROWLERS_AND_PARAGONS.power_ranges
    context.pro_con_choices = {
      pro: 'Pro',
      con: 'Con'
    }
    context.featureFor = {
      vehicle: 'Vehicle',
      hq: 'HQ'
    }
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.

    // Active Effect management
    html.on('click', '.effect-control', (ev) =>
      onManageActiveEffect(ev, this.item)
    );
  }

  getDataFromDropEvent(event) {
    try {
      return JSON.parse(event.dataTransfer?.getData('text/plain'));
    } catch (err) {
      const pdfRef = event.dataTransfer?.getData('text/html');
      if (pdfRef) {
        return getHTMLLink(pdfRef);
      } else {
        const uriRef = event.dataTransfer?.getData('text/uri-list');
        if (uriRef) {
          return ({
            type: "html",
            href: uriRef,
            label: "Weblink"
          });
        }
        throw new Error(game.i18n.localize("Errors.DropFailedWith").replace("_ERROR_MSG_", err));
      }
    }
  }

  async getItemDataFromDropData(dropData) {
    let item;

    item = await fromUuid(dropData.uuid);  //NOTE THIS MAY NEED TO BE CHANGED TO fromUuidSync  ****

    if (!item) {
      throw new Error(game.i18n.localize("Errors.CouldNotFindItem").replace("_ITEM_ID_", dropData.uuid));
    }
    //handle drop from compendium
    if (item.pack) {
      const pack = game.packs.get(item.pack);
      item = await pack?.getDocument(item._id);
    }
    const itemCopy = foundry.utils.duplicate(item);
    return itemCopy;
  }

  /** @override */
  _canDragDrop() {
    //console.log("got to drop check", selector);
    return this.isEditable && this.item.isOwner;
  }

  /** @override */
  async _onDrop(event) {
    event.preventDefault();
    const dropdata = this.getDataFromDropEvent(event)
    const draggedItem = await this.getItemDataFromDropData(dropdata)

    if (this.item.type === 'power' && draggedItem.type === 'procon') { // add effect mirroring the dropped procon
      this.item.createEmbeddedDocuments('ActiveEffect', [
        {
          name: draggedItem.name,
          description: draggedItem.system.description,
          transfer: false,
          changes: [
            {
              key: 'cost_flat',
              value: draggedItem.system.cost_flat,
              mode: 0
            },
            {
              key: 'cost_per_rank',
              value: draggedItem.system.cost_per_rank,
              mode: 0
            },
            {
              key: 'kind',
              value: draggedItem.system.kind,
              mode: 0
            }
          ]
        }])
    }

  }
}