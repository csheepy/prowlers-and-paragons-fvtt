import { ProwlersDie } from "./prowlers-die.mjs";

export class ProwlersRoll extends Roll {
    static CHAT_TEMPLATE = "systems/prowlers-and-paragons/templates/prowlers-dice-result.hbs";
    static TOOLTIP_TEMPLATE = "systems/prowlers-and-paragons/templates/prowlers-tooltip.hbs"

    static register() {
        CONFIG.Dice.rolls.push(this);
    }

    constructor(formula = "1dp", data = {}, options = {}) {
        super(formula, data, options);
      }

    async render({flavor, template = this.constructor.CHAT_TEMPLATE, isPrivate = false} = {}) {
        if (!this._evaluated) await this.evaluate({allowInteractive: !isPrivate});
        const chatData = await this._prepareContext({flavor, isPrivate});
        return renderTemplate(template, chatData);
    }

    /**
     * Helper function to generate render context in use with `static CHAT_TEMPLATE`
     * @param {object} options
     * @param {string} [options.flavor]     Flavor text to include
     * @param {boolean} [options.isPrivate] Is the Roll displayed privately?
     * @returns An object to be used in `renderTemplate`
     */
    async _prepareContext({flavor, isPrivate}) {
        const total = Math.round(this.total * 100) / 100
        return {
        formula: isPrivate ? "???" : this._formula,
        // flavor: isPrivate ? null : flavor ?? this.options.flavor,
        type: isPrivate ? null : this.options.type,
        user: game.user.id,
        tooltip: isPrivate ? "" : await this.getTooltip(),
        total: isPrivate ? "?" : total,
        netSuccess: isPrivate ? "" : (total - this.options.difficulty_number),
        difficulty: game.i18n.format(CONFIG.PROWLERS_AND_PARAGONS.roll_difficulties_leveled[this.options.difficulty], {level: this.options.difficulty_number}) 
        };
    }

    

    static initialNumberOfDice(options) {
        return options.num_dice
    }

    static async rollDialog(options = {}) {
        const template = 'systems/prowlers-and-paragons/templates/prowlers-roll-trait.hbs'
        const data = {
          modifier: 0,
          difficulty: 'easy',
          rollDifficulties: CONFIG.PROWLERS_AND_PARAGONS.roll_difficulties,
          type: options.type,
        }
    
        const html = await renderTemplate(template, data);
        let d = new Dialog({
          title: `Rolling ${options.type}`,
          content: html,
          buttons: {
           one: {
            icon: '<i class="fas fa-dice"></i>',
            label: "Roll",
            callback: (buttonHtml) => {
              const modifier =  parseInt(buttonHtml.find('[name="modifier"]').val(), 10)
              options.difficulty = buttonHtml.find('[name="difficulty"]').val()
              options.difficulty_number = parseInt(buttonHtml.find('[name="difficulty-number"]').val() ,10)
              const total_dice_number = this.initialNumberOfDice(options) + modifier
                    const roll = new this(`(${total_dice_number})dp`, {}, options );
                    roll.toMessage({
                        speaker: options.speaker,
                        // flavor: options.flavor,
                        rollMode: options.rollMode
                    });
            }
           },
           two: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
           }
          },
          default: "two",
         });
         return(new Promise(resolve => {
          d.render(true)
        })); 
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
    static initialNumberOfDice(options) {
        const gearLimit = game.settings.get('prowlers-and-paragons', 'gearLimit');
        return Math.min(gearLimit, options.trait_rank) + options.weapon_bonus
    }
    
    static async rollDialog(options = {}) {
        const template = 'systems/prowlers-and-paragons/templates/prowlers-roll-weapon.hbs'
        const data = {
          modifier: 0,
          difficulty: 'easy',
          rollDifficulties: CONFIG.PROWLERS_AND_PARAGONS.roll_difficulties,
          type: options.type,
          chosen_action_type: 'attacking',
          ranged: options.ranged,
          attackingMeleeTraits: {ma: `Martial Arts (${options.weapon_traits.ma})`, might: `Might (${options.weapon_traits.might})`}, //options.weapon_traits.offMelee,
          defendingMeleeTraits: {ma: `Martial Arts (${options.weapon_traits.ma})`, agility: `Agility (${options.weapon_traits.agility})`},
          rangedTraits: {agility:  `Agility (${options.weapon_traits.agility})`},
          trait: '',
          action_choices: {attacking: 'Attacking', defending: 'Defending'}   
        }

        const html = await renderTemplate(template, data);

        let d = new Dialog({
          title: `Rolling ${options.type}`,
          content: html,
          buttons: {
           one: {
            icon: '<i class="fas fa-dice"></i>',
            label: "Roll",
            callback: (buttonHtml) => {
                const modifier =  parseInt(buttonHtml.find('[name="modifier"]').val(), 10)
                options.difficulty = buttonHtml.find('[name="difficulty"]').val()
                options.difficulty_number = parseInt(buttonHtml.find('[name="difficulty-number"]').val() ,10)
                options.trait_rank = options.weapon_traits[buttonHtml.find('[name="trait"]').val()]
                const total_dice_number = this.initialNumberOfDice(options) + modifier
                const roll = new this(`(${total_dice_number})dp`, {}, options );
                roll.toMessage({
                    speaker: options.speaker,
                    // flavor: options.flavor,
                    rollMode: options.rollMode
                });
            }
           },
           two: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
           }
          },
          default: "two",
         });
         return(new Promise(resolve => {
          d.render(true)
        })); 
      }
}

export class ArmorRoll extends ProwlersRoll {
  static initialNumberOfDice(options) {
      const gearLimit = game.settings.get('prowlers-and-paragons', 'gearLimit');
      return Math.min(gearLimit, options.trait_rank) + options.armor_bonus
  }
  
  static async rollDialog(options = {}) {
      const template = 'systems/prowlers-and-paragons/templates/prowlers-roll-armor.hbs'
      const data = {
        modifier: 0,
        difficulty: 'easy',
        rollDifficulties: CONFIG.PROWLERS_AND_PARAGONS.roll_difficulties,
        type: options.type,
        chosen_action_type: 'attacking',
        ranged: options.ranged,
        armorTraits: {toughness: `Toughness (${options.armor_traits.toughness})`, armor: `Armor (${options.armor_traits.armor})`},
        trait: (options.armor_traits.toughness > options.armor_traits.armor) ? 'toughness' : 'armor',
        action_choices: {attacking: 'Attacking', defending: 'Defending'}   
      }

      const html = await renderTemplate(template, data);

      let d = new Dialog({
        title: `Rolling ${options.type}`,
        content: html,
        buttons: {
         one: {
          icon: '<i class="fas fa-dice"></i>',
          label: "Roll",
          callback: (buttonHtml) => {
              const modifier =  parseInt(buttonHtml.find('[name="modifier"]').val(), 10)
              options.difficulty = buttonHtml.find('[name="difficulty"]').val()
              options.difficulty_number = parseInt(buttonHtml.find('[name="difficulty-number"]').val() ,10)
              options.trait_rank = options.armor_traits[buttonHtml.find('[name="trait"]').val()]
              const total_dice_number = this.initialNumberOfDice(options) + modifier
              const roll = new this(`(${total_dice_number})dp`, {}, options );
              roll.toMessage({
                  speaker: options.speaker,
                  // flavor: options.flavor,
                  rollMode: options.rollMode
              });
          }
         },
         two: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
         }
        },
        default: "two",
       });
       return(new Promise(resolve => {
        d.render(true)
      })); 
    }
}

Hooks.once("init", () => {
    ProwlersRoll.register();
    WeaponRoll.register();
    ArmorRoll.register();
  });