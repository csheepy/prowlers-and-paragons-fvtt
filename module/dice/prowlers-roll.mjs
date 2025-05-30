import { ProwlersDie } from "./prowlers-die.mjs";

export class ProwlersRoll extends Roll {
  static CHAT_TEMPLATE = "systems/prowlers-and-paragons/templates/prowlers-dice-result.hbs";
  static TOOLTIP_TEMPLATE = "systems/prowlers-and-paragons/templates/prowlers-tooltip.hbs"
  static DIALOG_TEMPLATE = "systems/prowlers-and-paragons/templates/prowlers-roll-trait.hbs"

  static register() {
    CONFIG.Dice.rolls.push(this);
  }

  constructor(formula, data = {}, options = {}) {
    if (!formula) {
      const total_dice_number = ProwlersRoll.initialNumberOfDice(options) + options.modifier
      formula = `(${total_dice_number})dp`
    }
    super(formula, data, options);
  }

  async render({ flavor, template = this.constructor.CHAT_TEMPLATE, isPrivate = false } = {}) {
    if (!this._evaluated) await this.evaluate({ allowInteractive: !isPrivate });
    const chatData = await this._prepareContext({ flavor, isPrivate });
    return renderTemplate(template, chatData);
  }

  /**
   * Helper function to generate render context in use with `static CHAT_TEMPLATE`
   * @param {object} options
   * @param {string} [options.flavor]     Flavor text to include
   * @param {boolean} [options.isPrivate] Is the Roll displayed privately?
   * @returns An object to be used in `renderTemplate`
   */
  async _prepareContext({ flavor, isPrivate }) {
    const total = Math.round(this.total * 100) / 100

    this.netSuccess = total - this.options.difficultyNumber
    let narrativeControl = 'Oops, Narrative Control is broken'

    const resultsObject = game.settings.get('prowlers-and-paragons', 'traditionalResults') ?
      CONFIG.PROWLERS_AND_PARAGONS.traditional_results : CONFIG.PROWLERS_AND_PARAGONS.narrative_control
    
    if (this.netSuccess <= -2) {
      narrativeControl = game.i18n.localize(resultsObject.complete_failure)
    } else if (this.netSuccess < 1) {
      narrativeControl = game.i18n.localize(resultsObject.partial_failure)
    } else if (this.netSuccess <= 2) {
      narrativeControl = game.i18n.localize(resultsObject.partial_success)
    } else {
      narrativeControl = game.i18n.localize(resultsObject.complete_success)
    }

    return {
      formula: isPrivate ? "???" : this._formula,
      // flavor: isPrivate ? null : flavor ?? this.options.flavor,
      type: isPrivate ? null : this.options.type,
      user: game.user.id,
      tooltip: isPrivate ? "" : await this.getTooltip(),
      total: isPrivate ? "?" : total,
      netSuccess: isPrivate ? "" : this.netSuccess,
      narrativeControl: isPrivate ? "" : narrativeControl,
      difficulty: game.i18n.format(CONFIG.PROWLERS_AND_PARAGONS.roll_difficulties_leveled[this.options.difficulty], { level: this.options.difficultyNumber }),
      hideSuccesses: this.options.hideSuccesses
    };
  }



  static initialNumberOfDice(options) {
    if (options.halveToughness) {
      return Math.round(options.num_dice / 2);
    }
    if (options.offense) { // minion group bonus
      return options.num_dice + 2 + (options.count >= 3) * 2 + (options.count >= 6) * 2 + (options.count >= 9) * 2;
    }
    return options.num_dice;
  }


  static addOptionsFromHtml(options, buttonHtml) {
    options.modifier = parseInt(buttonHtml.find('[name="modifier"]').val(), 10)
    if (!options.difficulty) {
      options.difficulty = buttonHtml.find('[name="difficulty"]').val()
      options.difficultyNumber = parseInt(buttonHtml.find('[name="difficulty-number"]').val(), 10)
    }

    options.halveToughness = buttonHtml.find('[name="halveToughness"]').is(":checked")
    options.offense = buttonHtml.find('[name="offense"]').is(":checked")

    return options
  }

  static insertSelfIntoOpposedRolls(options, message) {
    if (options.difficulty === 'opposed' && options.originatingMessageId) {
      const originalMessage = game.messages.get(options.originatingMessageId);
      const oppposedRolls = originalMessage.getFlag('prowlers-and-paragons', 'opposedRolls') ?? [];
      if (originalMessage) {
        console.log(originalMessage, message)
        originalMessage.setFlag('prowlers-and-paragons', 'opposedRolls', [...oppposedRolls, message.id]);
      }
    }
  }

  static async resolveRollCallback(resolve, options) {
    const roll = new this(undefined, undefined, options);
    await roll.evaluate();
    const message = await roll.toMessage({
      speaker: options.speaker,
      rollMode: options.rollMode
    });
    this.insertSelfIntoOpposedRolls(options, message);
    resolve({roll, message})
  }

  static rollDialogData(options) {
    let label = 'Roll';
    if (options.originatingActorName) {
      label = `Roll against ${options.originatingActorName}`
    }
    if (!options.originatingActorName && options.difficulty === 'opposed') {
      const targetToken = [...game.user.targets][0];
      const targetActor = targetToken.actor;
      label = `Roll against ${targetActor.name}`
    }


    return {
      modifier: 0,
      preselectedDifficulty: options.difficulty ? true : false,
      difficulty: options.difficulty ?? 'easy',
      difficultyNumber: options.difficultyNumber ?? 0,
      rollDifficulties: CONFIG.PROWLERS_AND_PARAGONS.roll_difficulties,
      rollDifficultiesLeveled: CONFIG.PROWLERS_AND_PARAGONS.roll_difficulties_leveled,
      type: options.type,
      label: label
    }
  }

  static async rollDialog(options = {}) {
    const template = this.DIALOG_TEMPLATE;
    const data = this.rollDialogData(options);

    // show an option to halve toughness
    if (options.type === game.i18n.localize(CONFIG.PROWLERS_AND_PARAGONS.abilities.toughness)) {
      data.toughness = true
      data.halveToughness = true
    }

    // show an option to apply the minion group attack bonus
    if (options.offense !== undefined) {
      data.showMinionOffense = true;
      data.offense = options.offense
    }

    const html = await renderTemplate(template, data);

    return new Promise((resolve) => {
      new Dialog({
        title: `Rolling ${options.type}`,
        content: html,
        buttons: {
          one: {
            icon: '<i class="fas fa-dice"></i>',
            label: data.label,
            callback: async (buttonHtml) => {
              options = this.addOptionsFromHtml(options, buttonHtml);
              return this.resolveRollCallback(resolve, options);
            }
          },
          two: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
          }
        },
        default: "two",
      }).render(true);
    });
  }

  async explode() {
    for (let i = 0; i < this.terms.length; i++) {
      const term = this.terms[i];

      if (term instanceof ProwlersDie) {

        const clonedDie = new ProwlersDie({
          faces: term.faces,
          number: term.number,
          modifiers: term.modifiers,
          options: term.options,
        });

        clonedDie.results = structuredClone(term.results);

        await clonedDie.explode('x')
        await clonedDie.evaluate()
        this.terms[i] = clonedDie;
      }
    };

    // Reevaluate the roll's total based on updated terms
    this._total = this._evaluateTotal();

    return this.toMessage();
  }
}

export class WeaponRoll extends ProwlersRoll {
  static DIALOG_TEMPLATE = 'systems/prowlers-and-paragons/templates/prowlers-roll-weapon.hbs';

  constructor(formula, data = {}, options = {}) {
    const total_dice_number = WeaponRoll.initialNumberOfDice(options)
    formula = `(${total_dice_number})dp`
    super(formula, data, options);
  }
  static initialNumberOfDice(options) {
    const gearLimit = game.settings.get('prowlers-and-paragons', 'gearLimit');
    return Math.min(gearLimit, options.trait_rank) + options.weapon_bonus + options.modifier
  }

  static rollDialogData(options) {
    return {
      ...super.rollDialogData(options), ...{
        chosen_action_type: 'attacking',
        ranged: options.ranged,
        attackingMeleeTraits: { ma: `Martial Arts (${options.weapon_traits.ma})`, might: `Might (${options.weapon_traits.might})` },
        defendingMeleeTraits: { ma: `Martial Arts (${options.weapon_traits.ma})`, agility: `Agility (${options.weapon_traits.agility})` },
        rangedTraits: { agility: `Agility (${options.weapon_traits.agility})` },
        trait: '',
        action_choices: { attacking: 'Attacking', defending: 'Defending' }
      }
    }
  }

  static addOptionsFromHtml(options, buttonHtml) {
    options = super.addOptionsFromHtml(options, buttonHtml);
    options.trait_rank = options.weapon_traits[buttonHtml.find('[name="trait"]').val()];
    return options;
  }
}

export class ArmorRoll extends ProwlersRoll {
  static DIALOG_TEMPLATE = 'systems/prowlers-and-paragons/templates/prowlers-roll-armor.hbs';

  constructor(formula, data = {}, options = {}) {
    const total_dice_number = ArmorRoll.initialNumberOfDice(options)
    formula = `(${total_dice_number})dp`
    super(formula, data, options);
  }
  static initialNumberOfDice(options) {
    const gearLimit = game.settings.get('prowlers-and-paragons', 'gearLimit');
    return Math.min(gearLimit, options.trait_rank) + options.armor_bonus
  }

  static rollDialogData(options) {
    return {
      ...super.rollDialogData(options), ...{
        chosen_action_type: 'attacking',
        ranged: options.ranged,
        armorTraits: { toughness: `Toughness (${options.armor_traits.toughness})`, armor: `Armor (${options.armor_traits.armor})` },
        trait: (options.armor_traits.toughness > options.armor_traits.armor) ? 'toughness' : 'armor',
        action_choices: { attacking: 'Attacking', defending: 'Defending' }
        }
    }
  }

  static addOptionsFromHtml(options, buttonHtml) {
    options = super.addOptionsFromHtml(options, buttonHtml);
    options.trait_rank = options.armor_traits[buttonHtml.find('[name="trait"]').val()];
    return options;
  }
}

Hooks.once("init", () => {
  ProwlersRoll.register();
  WeaponRoll.register();
  ArmorRoll.register();
});