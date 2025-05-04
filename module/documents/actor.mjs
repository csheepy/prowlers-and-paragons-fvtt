/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */

import { ProwlersRoll } from "../dice/prowlers-roll.mjs";
import { socket } from "../prowlers-and-paragons.mjs";
import { getActorsFromTargetedTokens } from '../helpers/tokens.mjs'

export class ProwlersParagonsActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  getVehicleTraits() {
    const vehicleTraits = Object.fromEntries(Object.entries({
      body: this.system.body,
      weapons: this.system.weapons,
      'speed.land': this.system.speed.land,
      'speed.air': this.system.speed.air,
      'speed.sea': this.system.speed.sea,
      'control.land': this.system.control.land,
      'control.air': this.system.control.air,
      'control.sea': this.system.control.sea,
    }).map(([key, value]) => {
      return [`vehicle:${key}`, game.i18n.localize(`PROWLERS_AND_PARAGONS.Vehicle.${key}`)]
    }))

    return { vehicle: vehicleTraits };
  }

  traitsForSelection() {
    if (this.system.threat) {
      return {threat: {'threat:threat': 'Threat'}} // threat
    }

    if (this.type === 'vehicle') {
      return this.getVehicleTraits();
    }
    const abilities = Object.fromEntries(
      Object.entries(CONFIG.PROWLERS_AND_PARAGONS.abilities).map(([key, value]) => [`ability:${key}`, value])
    );
    const talents = Object.fromEntries(
      Object.entries(CONFIG.PROWLERS_AND_PARAGONS.talents).map(([key, value]) => [`talent:${key}`, value])
    );


    const powers = Object.fromEntries(this.items.contents.filter((p) => p.type === 'power').map(p => {return [`item:${p.id}`, p.name]}))
    const weapons = Object.fromEntries(this.items.contents.filter((p) => p.type === 'weapon').map(p => {return [`item:${p.id}`, p.name]}))
    const armor = Object.fromEntries(this.items.contents.filter((p) => p.type === 'armor').map(p => {return [`item:${p.id}`, p.name]}))
    
    return {abilities, talents, powers, gear: {weapons, armor}}
  }

  derivePowerRanks() {
    const actorData = this;

    const derived_power_ranks = {}
    actorData.items.contents.filter(i => i.type === 'power').forEach(power => {
      let rr = power.system.rank

      if (power.system.rank_type === 'default') {
        rr = actorData.system.abilities[power.system.connected_ability].value
      }
      if (power.system.rank_type === 'baseline') {
        if (power.system.baseline_scaling_options.half_rank) {
          rr += Math.round((actorData.system.abilities[power.system.connected_ability].value)/2)
        } else if (power.system.baseline_scaling_options.special) {
          rr += power.system.baseline_scaling_options.special_value
        } else {
          rr += actorData.system.abilities[power.system.connected_ability].value
        }
      }

      derived_power_ranks[power.id] = rr
    });

    return derived_power_ranks
  }

  calculateSpentPoints() {
    const actorData = this;
    if (actorData.type !== 'character') {
      return;
    }

    let pointsSpent = 0;

    const calculateTrait = (trait, adjustment) => {
      for (const [key, {value}] of Object.entries(actorData.system._source[trait])) { // use _source to get values unmodified by effects
        const adjustedValue = value - adjustment
        if (adjustedValue > 0) {
          pointsSpent += adjustedValue
        }
      }
    }

    if (actorData.system.package_applied === 'superhero') {
      pointsSpent += 50
      
      calculateTrait('abilities', 3)
      calculateTrait('talents', 3)
    } else if (actorData.system.package_applied === 'hero') {
      pointsSpent += 40

      calculateTrait('abilities', 3)
      calculateTrait('talents', 2)
    } else if (actorData.system.package_applied === 'civilian') {
      pointsSpent += 35

      calculateTrait('abilities', 2)
      calculateTrait('talents', 2)
    } else {
      calculateTrait('abilities', 0)
      calculateTrait('talents', 0)
    }

    actorData.items.contents.filter(i => i.type === 'perk').forEach(perk => {
      pointsSpent += perk.system.cost;
    })


    // add powers cost
    actorData.items.contents.filter(i => i.type === 'power').forEach(power => {
      pointsSpent += (power.system.rank * power.system.cost)

      // pros and cons
      power.effects.contents.forEach(effect => {
        pointsSpent += parseInt(effect.changes.find((e) => e.key === 'cost_flat')?.value ?? 0)
        pointsSpent += parseInt(effect.changes.find((e) => e.key === 'cost_per_rank')?.value ?? 0) * power.system.rank
      })
    })
      
    return pointsSpent
  }
  /**
   * @override
   * Augment the actor source data with additional dynamic data that isn't 
   * handled by the actor's DataModel. Data calculated in this step should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;

    actorData.derived_power_ranks = this.derivePowerRanks();
    actorData.spentHeroPoints = this.calculateSpentPoints();
    const flags = actorData.flags.prowlersandparagons || {};
  }

  /**
   * 
   * @override
   * Augment the actor's default getRollData() method by appending the data object
   * generated by the its DataModel's getRollData(), or null. This polymorphic 
   * approach is useful when you have actors & items that share a parent Document, 
   * but have slightly different data preparation needs.
   */
  getRollData() {
    return { ...super.getRollData(), ...this.system.getRollData?.() ?? null };
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
    const result = {...this};

    // Simplify system data.
    result.system = this.system.toPlainObject();

    // Add items.
    result.items = this.items?.size > 0 ? this.items.contents : [];

    // Add effects.
    result.effects = this.effects?.size > 0 ? this.effects.contents : [];

    return result;
  }

  increaseAllAbilities(n) {
    for (const key in this.system.abilities) {
      const newValue = this.system.abilities[key].value + n
      this.update({ [`system.abilities.${key}.value`]: newValue})
    }
  }

  increaseAllTalents(n) {
    for (const key in this.system.talents) {
      const newValue = this.system.talents[key].value + n
      this.update({ [`system.talents.${key}.value`]: newValue})
    }
  }

  async clearPackage() {
    if (this.system.package_applied === 'hero') {
      this.increaseAllAbilities(-3)
      this.increaseAllTalents(-2)
    }
    if (this.system.package_applied === 'superhero') {
      this.increaseAllAbilities(-3)
      this.increaseAllTalents(-3)
    }
    if (this.system.package_applied === 'civilian') {
      this.increaseAllAbilities(-2)
      this.increaseAllTalents(-2)
    }
    return this.update({'system.package_applied': ''})
  }
  async applyPackage(pp) {
    if (this.system.package_applied.length > 0 && pp === 'clear') {
      await this.clearPackage();
      return true;
    }

    await this.clearPackage();
    if (pp === 'hero') {
      this.increaseAllAbilities(3)
      this.increaseAllTalents(2)
      this.update({'system.package_applied': 'hero'})
    }
    if (pp === 'superhero') {
      this.increaseAllAbilities(3)
      this.increaseAllTalents(3)
      this.update({'system.package_applied': 'superhero'})
    }
    if (pp === 'civilian') {
      this.increaseAllAbilities(2)
      this.increaseAllTalents(2)
      this.update({'system.package_applied': 'civilian'})
    }

    return true
  }

  // Alice calls roll() with target Bob. Alice calls targetRoll(). Alice sees a 'please hold' dialog
  // Bob chooses a trait in the opposed roll dialog and rolls it.
  // Alice's 'please hold' dialog closes. Alice's roll resolves.
  async targetRoll(flavor) { // make the targeted actor roll something and return the result
    const targetToken = [...game.user.targets][0];
    const targetActor = targetToken.actor;

    if (!targetActor) return;
    if (targetActor.id === this.id) {
      ui.notifications.warn("You cannot target yourself!");
      return undefined
    }


    let controllingUser;
    // first, look for a user who controls the character
    controllingUser = game.users.filter((user) => 
      user.active && user.character?.id === targetActor.id
    )[0];

    // try to find a non-GM owner
    if (!controllingUser) {
      controllingUser = game.users.filter((user) => 
      user.active && !user.isGM && targetActor.testUserPermission(user, "OWNER")
      )[0];
    }

    // settle for the gm
    if (!controllingUser) {
      controllingUser = game.users.filter((user) => user.isGM)[0];
    }

    // if (!controllingUsers.length) return;

    // Send the dialog creation request to the first controlling player
    const targetPlayerId = controllingUser?.id
    if (!targetPlayerId) return;

    const template = 'systems/prowlers-and-paragons/templates/please-hold.hbs'

    const html = await renderTemplate(template, {});

    const holdPlease =  new foundry.applications.api.DialogV2({
      window: {title:'Please Hold'},
      content: html,
      buttons:[
        {
          action: 'ok',
          label: 'Ok',
          default: true
        }
      ]
    });

    holdPlease.render({force: true});
    const difficulty = await socket.executeAsUser("opposeRoll", targetPlayerId, targetActor.id, flavor, this.name)
    holdPlease.close();

    return difficulty
  }

  async roll(trait, options) {
    const pathArray = trait.split('.');
    const val = pathArray.reduce((acc, key) => acc && acc[key], this);


    options.num_dice = val;
    options.rollMode = game.settings.get('core', 'rollMode');
    options.speaker = ChatMessage.getSpeaker({ actor: this })

    if (options?.doOpposedRoll && getActorsFromTargetedTokens().length === 1) {
      const d = await this.targetRoll(options.flavor)
      if(d !== undefined) {
        options.difficulty = 'opposed'
        options.difficultyNumber = d
      } else {
        return;
      }
    }
    return await ProwlersRoll.rollDialog(options);
  }

  async threatRoll(options) {
    if (!this.system.threat) { return };

    options.num_dice = this.system.threat;
    options.count = this.system.count
    options.speaker = ChatMessage.getSpeaker({ actor: this });
    options.type = `Threat ${this.system.threat} (group of ${this.system.count})`;
    options.rollMode = game.settings.get('core', 'rollMode');
    options.flavor = game.i18n.localize('PROWLERS_AND_PARAGONS.Threat');
    options.offense = options.offense ?? false;

    if (options?.doOpposedRoll && getActorsFromTargetedTokens().length === 1) {
      const d = await this.targetRoll(options.flavor)
      if(d !== undefined) {
        options.difficulty = 'opposed'
        options.difficultyNumber = d
      } else {
        return;
      }
    }

    return ProwlersRoll.rollDialog(options);
  }
}
