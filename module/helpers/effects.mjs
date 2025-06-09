/**
 * Manage Active Effect instances through an Actor or Item Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
export function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest('li');
  const effect = li.dataset.effectId
    ? owner.effects.get(li.dataset.effectId)
    : null;
  switch (a.dataset.action) {
    case 'create':
      return owner.createEmbeddedDocuments('ActiveEffect', [
        {
          name: game.i18n.format('DOCUMENT.New', {
            type: game.i18n.localize('DOCUMENT.ActiveEffect'),
          }),
          icon: 'icons/svg/aura.svg',
          origin: owner.uuid,
          'duration.rounds':
            (li.dataset.effectType === 'temporary') ? 1 : undefined,
          transfer: li.dataset.effectType === 'conditions' ? false : undefined,
          disabled: li.dataset.effectType === 'inactive',
          changes: li.dataset.effectType === 'conditions' ? [{ mode: 0, key: 'kind', value: 'condition' }] : undefined,
        },
      ]);
    case 'edit':
      return effect.sheet.render(true);
    case 'delete':
      return effect.delete();
    case 'toggle':
      return effect.update({ disabled: !effect.disabled });
  }
}

/**
 * Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
 * @param {ActiveEffect[]} effects    A collection or generator of Active Effect documents to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects, isItem = false) {
  // Define effect header categories
  const categories = {
    temporary: {
      type: 'temporary',
      label: game.i18n.localize('PROWLERS_AND_PARAGONS.Effect.Temporary'),
      effects: [],
    },
    passive: {
      type: 'passive',
      label: game.i18n.localize('PROWLERS_AND_PARAGONS.Effect.Passive'),
      effects: [],
    },
    inactive: {
      type: 'inactive',
      label: game.i18n.localize('PROWLERS_AND_PARAGONS.Effect.Inactive'),
      effects: [],
    },

  };

  if (isItem) {
    categories.procon = {
      type: 'procon',
      label: game.i18n.localize('PROWLERS_AND_PARAGONS.Effect.Procon'),
      effects: [],
    };

    categories.conditions = {
      type: 'conditions',
      label: game.i18n.localize('PROWLERS_AND_PARAGONS.Effect.Conditions'),
      effects: [],
    };
  }
  // Iterate over active effects, classifying them into categories
  for (let e of effects) {
    if (e.disabled) categories.inactive.effects.push(e);
    else if (isItem && e.isProCon()) categories.procon.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else if (isItem && e.isCondition()) categories.conditions.effects.push(e);
    else categories.passive.effects.push(e);
  }
  return categories;
}

Hooks.once('init', () => {
    ActiveEffect.prototype.isProCon = function() {
        return this.changes.some(change => change.key === 'kind' && ['pro', 'con'].includes(change.value));
    };

    ActiveEffect.prototype.isCondition = function() {
      return this.changes.some(change => change.key === 'kind' && change.value === 'condition');
  };
});


Hooks.on('updateCombat', (combat, update, options, user) => {
  for (let combatant of combat.turns) {
    if (combatant.actor) {
      let actor = combatant.actor;
      for (let effect of actor.effects) {
        if (effect.duration.type === 'turns' && effect.duration.remaining <= 0) {
          ui.notifications.info(`${actor.name}'s condition ${effect.name} has expired.`);
          effect.delete();
        }
      }
    }
  }
});
