/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    'systems/prowlers-and-paragons/templates/actor/parts/actor-features.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-items.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-spells.hbs',
    'systems/prowlers-and-paragons/templates/actor/parts/actor-effects.hbs',
    // Item partials
    'systems/prowlers-and-paragons/templates/item/parts/item-effects.hbs',
  ]);
};
