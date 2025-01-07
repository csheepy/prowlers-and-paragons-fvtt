/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */

import { ArmorRoll, ProwlersRoll, WeaponRoll } from "../dice/prowlers-roll.mjs";
import { getActorsFromTargetedTokens } from '../helpers/tokens.mjs'

export class ProwlersParagonsItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const rollData = { ...this.system };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Convert the actor document to a plain object.
   *
   * The built in `toObject()` method will ignore derived data when using Data Models.
   * This additional method will instead use the spread operator to return a simplified
   * version of the data.
   *
   * @returns {object} Plain object either via deepClone or the spread operator.
   */
  toPlainObject() {
    const result = { ...this };

    // Simplify system data.
    result.system = this.system.toPlainObject();

    // Add effects.
    result.effects = this.effects?.size > 0 ? this.effects.contents : [];

    return result;
  }

  async rollPower({speaker, rollMode, label, options}) {
    const powerOptions = {
      flavor: label,
      speaker,
      rollMode,
      type: this.name,
      num_dice: this.actor.derived_power_ranks[this.name],
      ...options
    }
    return ProwlersRoll.rollDialog(powerOptions);
  }

  async rollWeapon({speaker, rollMode, label, options}) {
    const maVal = this.actor.derived_power_ranks['Martial Arts'] ?? 0

    const weaponOptions = {
      flavor: label,
      speaker,
      rollMode,
      type: this.name,
      weapon_traits: {ma: maVal, might: this.actor.system.abilities.might.value, agility: this.actor.system.abilities.agility.value},
      ranged: this.system.ranged,
      weapon_bonus: this.system.weapon_bonus,
      ...options
    }
    return WeaponRoll.rollDialog(weaponOptions);
  }

  rollArmor({speaker, rollMode, label, options}) {
    const armVal = this.actor.derived_power_ranks['Armor'] ?? 0

    const armorOptions = {
      flavor: label,
      speaker,
      rollMode,
      type: this.name,
      armor_traits: {toughness: this.actor.system.abilities.toughness.value, armor: armVal },
      ranged: this.system.ranged,
      armor_bonus: this.system.armor_bonus,
      ...options
    }
    return ArmorRoll.rollDialog(armorOptions);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll(options) {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;


    if (options?.doOpposedRoll && getActorsFromTargetedTokens().length === 1) {
      const d = await this.actor.targetRoll(this.name)
      if(d !== undefined) {
        options = {...options, ...{ difficulty: 'opposed', difficultyNumber: d}}
      }
    }
    // power/ability/talent rolls
    if(this.system.rank) {
      return this.rollPower({speaker, rollMode, label, options})
    }
    // weapon roll
    if(this.system.weapon_bonus) {
      return this.rollWeapon({speaker, rollMode, label, options})
    }

    if(this.system.armor_bonus) {
      return this.rollArmor({speaker, rollMode, label, options})
    }
    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? '',
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();
      const options = {
        flavor: label,
        speaker,
        rollMode,
        foo: 'bar',
        type: this.name,
        num_dice: rollData.formula
      }
      return ProwlersRoll.rollDialog(options);
    }
  }
}

Hooks.on("updateItem", (item, changes, options, userId) => {
  // Check if a toggleable power has been toggled
  if (changes?.system?.toggleActive !== undefined) {
    const newValue = changes.system.toggleActive;
    const activeEffects = item.effects.filter(effect => effect.transfer === true);  // effects from the power that affect the sheet

    activeEffects.forEach(effect => {
        effect.update({disabled: !newValue})
    });
  }
});