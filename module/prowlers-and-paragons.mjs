// Import document classes.
import { ProwlersParagonsActor } from './documents/actor.mjs';
import { ProwlersParagonsItem } from './documents/item.mjs';
// Import sheet classes.
import { ProwlersParagonsActorSheet } from './sheets/actor-sheet.mjs';
import { ProwlersParagonsItemSheet } from './sheets/item-sheet.mjs';
import { ProwlersParagonsGMSheet } from './sheets/gm-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { PROWLERS_AND_PARAGONS } from './helpers/config.mjs';
// Import DataModel classes
import * as models from './data/_module.mjs';
import { ProwlersDie } from './dice/prowlers-die.mjs';
import { runDiceHooks, opposeRoll } from './dice/hooks.mjs';
/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */
export let socket

Hooks.once("socketlib.ready", () => {
	socket = socketlib.registerSystem("prowlers-and-paragons");
  socket.register("opposeRoll", opposeRoll);
  socket.register("notifyAwardResolve", ({ actorName }) => {
    ui.notifications.info(`${actorName} awarded 1 Resolve!`);
  });
  socket.register("notifySpendAdversity", ({optionText}) => {
    ui.notifications.info(`Adversity spent on ${optionText}!`);
  });
});

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.prowlersandparagons = {
    ProwlersParagonsActor,
    ProwlersParagonsItem,
    rollItemMacro,
  };

  runDiceHooks();
  game.settings.register('prowlers-and-paragons', 'gearLimit', {
    name: 'Gear Limit',
    hint: 'Set the gear limit for your world',
    scope: 'world',
    config: true,
    type: Number,
    default: 6,
  })
  game.settings.register('prowlers-and-paragons', 'heroPointBudget', {
    name: 'Starting Hero Points',
    hint: 'How many Hero Points are allowed for character creation',
    scope: 'world',
    config: true,
    type: Number,
    default: 125,
  })
  game.settings.register('prowlers-and-paragons', 'traditionalResults', {
    name: 'Traditional Results',
    hint: 'Enable traditional results instead of the default narrative control results',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  })
  game.settings.register('prowlers-and-paragons', 'randomInitiative', {
    name: 'Rolled Initiative',
    hint: 'Enable rolled initiative instead of the default fixed initiative (requires reload)',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  })
  game.settings.register('prowlers-and-paragons', 'reducedSwinginess', {
    name: 'Reduced Swinginess',
    hint: 'If enabled, 6s will no longer count as two successes',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  })
  // Add custom constants for configuration.
  CONFIG.PROWLERS_AND_PARAGONS = PROWLERS_AND_PARAGONS;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  if (game.settings.get('prowlers-and-paragons', 'randomInitiative')) {
    CONFIG.Combat.initiative = {
      formula: '(@edge.value)dp',
      decimals: 2,
    };
  } else {
    CONFIG.Combat.initiative = {
      formula: '@edge.value',
      decimals: 2,
    };
  }

  // Define custom Document and DataModel classes
  CONFIG.Actor.documentClass = ProwlersParagonsActor;

  // Note that you don't need to declare a DataModel
  // for the base actor/item classes - they are included
  // with the Character/NPC as part of super.defineSchema()
  CONFIG.Actor.dataModels = {
    character: models.ProwlersParagonsCharacter,
    minion: models.ProwlersParagonsMinion,
    vehicle: models.ProwlersParagonsVehicle,
    hq: models.ProwlersParagonsHQ,
    'gm-sheet': models.ProwlersParagonsGMSheet
  }
  CONFIG.Item.documentClass = ProwlersParagonsItem;
  CONFIG.Item.dataModels = {
    item: models.ProwlersParagonsItem,
    feature: models.ProwlersParagonsFeature,
    power: models.ProwlersParagonsPower,
    procon: models.ProwlersParagonsProCon,
    perk: models.ProwlersParagonsPerk,
    flaw: models.ProwlersParagonsFlaw,
    weapon: models.ProwlersParagonsWeapon,
    armor: models.ProwlersParagonsArmor
  }

  CONFIG.Dice.terms[ProwlersDie.DENOMINATION] = ProwlersDie;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('prowlers-and-paragons', ProwlersParagonsActorSheet, {
    makeDefault: true,
    label: 'PROWLERS_AND_PARAGONS.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('prowlers-and-paragons', ProwlersParagonsItemSheet, {
    makeDefault: true,
    label: 'PROWLERS_AND_PARAGONS.SheetLabels.Item',
  });
  Actors.registerSheet('prowlers-and-paragons', ProwlersParagonsGMSheet, {
    types: ['gm-sheet'],
    makeDefault: true,
    label: 'PROWLERS_AND_PARAGONS.Actor.gm-sheet',
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('needsConnectedAbility', function (power) {
  return (power.rank_type === 'default' || power.rank_type === 'baseline');
});

Handlebars.registerHelper('needsBaselineOptions', function (power) {
  return (power.rank_type === 'baseline');
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.prowlersandparagons.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'prowlers-and-paragons.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}
