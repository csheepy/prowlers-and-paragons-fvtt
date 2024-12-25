/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    'systems/prowlers-and-paragons/templates/actor/parts/actor-features.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-perks.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-flaws.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-gear.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-weapons.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-armor.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-powers.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-effects.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-powers-play.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-gear-play.hbs',
    // Item partials
    'systems/prowlers-and-paragons/templates/item/parts/item-effects.hbs',
    // globalish
    'systems/prowlers-and-paragons/templates/prowlers-roll-trait.hbs'
  ]);
};
