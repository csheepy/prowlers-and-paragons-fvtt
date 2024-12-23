/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
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

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // power rolls
    if(this.system.rank) {
      const roll = new Roll(`(${this.actor.derived_power_ranks[item.name]})dp`, this.actor.getRollData());

      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;

      return roll
    }
    // weapon roll
    if(this.system.weapon_bonus) {
      const ma = this.actor.derived_power_ranks['Martial Arts'] ?? 0

      const ts = [
      {trait: 'Martial Arts', val: ma},
      {trait: 'Might', val: this.actor.system.abilities.might.value},
      {trait: 'Agility', val: this.actor.system.abilities.agility.value}
    ]
      const highest = ts.reduce((max, obj) => {
        return obj.val > max.val ? obj : max; // Compare 'val' property
      }, ts[0]);


      const gear_limited_bonus = Math.min(6, highest.val) + this.system.weapon_bonus

      const roll = new Roll(`(${gear_limited_bonus})dp`, this.actor.getRollData());

      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: `[${item.type}] ${item.name} (${highest.trait})`,
      });
      return roll;

      return roll
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

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.formula, rollData.actor);
      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }
}
