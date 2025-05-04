import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

import { ProwlersRoll } from '../dice/prowlers-roll.mjs';
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ProwlersParagonsActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['prowlers-and-paragons', 'sheet', 'actor'],
      width: 600,
      height: 600,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'features',
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/prowlers-and-paragons/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toPlainObject();

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;
    context.rollDifficulties = CONFIG.PROWLERS_AND_PARAGONS.roll_difficulties
    context.startingHeroPoints = game.settings.get("prowlers-and-paragons", "heroPointBudget")

    Handlebars.registerHelper('getDerivedPowerRank', function (power) {
      return actorData.derived_power_ranks[power];
    });

    Handlebars.registerHelper('isDefaultPower', function (power) {
      return power.system.rank_type === 'default';
    });
    // Adding a pointer to CONFIG.PROWLERS_AND_PARAGONS
    context.config = CONFIG.PROWLERS_AND_PARAGONS;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    if (actorData.type == 'vehicle' || actorData.type == 'hq') {
      this._prepareItems(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedBiography = await TextEditor.enrichHTML(
      this.actor.system.biography,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.actor.getRollData(),
        // Relative UUID resolution
        relativeTo: this.actor,
      }
    );

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /**
   * Character-specific context modifications
   *
   * @param {object} context The context object to mutate
   */
  _prepareCharacterData(context) {
    // This is where you can enrich character-specific editor fields
    // or setup anything else that's specific to this type
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const perks = [];
    const flaws = [];
    const powers = [];
    const armor = []
    const weapons = []
    const features = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'perk') {
        perks.push(i);
      }
      // Append to features.
      else if (i.type === 'flaw') {
        flaws.push(i);
      }
      // Append to spells.
      else if (i.type === 'power') {
        if (i.system.shortDescription && i.system.shortDescription.length > 0) {
          i.displayName = `${i.name} (${i.system.shortDescription})`
        } else {
          i.displayName = i.name
        }
        powers.push(i);
      }
      // Append to weapons.
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      // Append to armor.
      if (i.type === 'armor') {
        armor.push(i);
      }
      // Append to features.
      if (i.type === 'feature') {
        features.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.perks = perks;
    context.flaws = flaws;
    context.powers = powers;
    context.weapons = weapons;
    context.armor = armor;
    context.features = features;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    html.on('click', '.reset-resolve', () => {
      this.actor.update({ 'system.resolve.value': this.actor.system.resolve.starting })
    });

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));

      new Dialog({
        title: 'Confirm',
        content: 'Are you sure?',
        buttons: {
          del: {
            label: `Delete ${item.name}`,
            icon: '<i class="fas fa-trash"></i>',
            callback: () => {
              item.delete()
              li.slideUp(200, () => this.render(false));
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel'
          }
        }
      }).render(true)

    });

    // Active Effect management
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Rollable abilities.
    html.on('click', '.rollable', this._onRoll.bind(this));

    // Apply Package
    html.on('click', '.apply-package', this._applyPackage.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }

    // Handle power toggle changes
    html.on('change', '.power-toggle', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      const isChecked = ev.currentTarget.checked;

      item.update({ "system.toggleActive": isChecked });
    });

    // Handle charge value changes
    html.on('change', '.currentCharges', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      const newValue = parseInt(ev.currentTarget.value);

      item.update({ "system.charges.value": newValue });
    });

    // Handle reset charges button
    html.on('click', '.reset-charges', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      
      if (item.system.charges.max !== null) {
        item.update({ "system.charges.value": item.system.charges.max });
      }
    });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }


  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      const itemId = element.closest('.item').dataset.itemId;
      const item = this.actor.items.get(itemId);
      if (item) return item.roll({doOpposedRoll: true});
    }

    // Handle nested ability / talent / etc rolls
    if (dataset.key) {
      let label = dataset.label ? `${dataset.label}` : '';
      const options = {
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
        doOpposedRoll: true,
        type: dataset.label
      }
      return this.actor.roll(dataset.key, options)
    }

    // NPC Threat rolls
    if (dataset.threat) {
      return this.actor.threatRoll({offense: true, doOpposedRoll: true})
    }
  }

  async _applyPackage(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset
    this.actor.applyPackage(dataset.package);
  }
}

