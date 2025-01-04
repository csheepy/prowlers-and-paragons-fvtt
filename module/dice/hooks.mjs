import { getControlledCharacter } from "../helpers/tokens.mjs";
export const runDiceHooks = () => {
  // Add a custom "Reroll" button to the context menu
  Hooks.on("getChatLogEntryContext", (html, options) => {
    options.push({
      name: "Reroll",
      icon: '<i class="fas fa-dice"></i>',
      condition: (li) => {
        // Check if the message contains a roll
        const message = game.messages.get(li.data("messageId"));
        return message?.rolls?.length > 0;
      },
      callback: async (li) => {
        // Get the roll from the chat message
        const message = game.messages.get(li.data("messageId"));
        const roll = message.rolls[0];

        if (roll) {
          const reroll = await roll.reroll();
          await reroll.toMessage();
        }
      },
    });
  });

  Hooks.on("getChatLogEntryContext", (html, options) => {
    options.push({
      name: "Explode 6s",
      icon: '<i class="fas fa-dice"></i>',
      condition: (li) => {
        // Check if the message contains a roll
        const message = game.messages.get(li.data("messageId"));
        return message?.rolls?.length > 0;
      },
      callback: async (li) => {
        // Get the roll from the chat message
        const message = game.messages.get(li.data("messageId"));
        const roll = message.rolls[0];

        if (roll) {
          await roll.explode();
        }
      },
    });
  });

  const opposedRoll = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Find the parent message
    const chatMessageId = $(event.currentTarget).closest(".message").data("messageId");
    const chatMessage = game.messages.get(chatMessageId);
    if (!chatMessage) return ui.notifications.warn("Chat message not found!");

    // Retrieve the roll from the chat message
    const roll = chatMessage.rolls?.[0];
    if (!roll) return ui.notifications.warn("No roll found in this message!");

    const controlledCharacter = getControlledCharacter();
    if (!controlledCharacter) {
      return ui.notifications.warn("You must select or control a character!");
    }
    const traits = controlledCharacter.traitsForSelection()


    const template = 'systems/prowlers-and-paragons/templates/opposed-roll-trait-select.hbs'
    const showGear = () => {
      if (traits.gear?.weapons) {
        return Object.keys(traits.gear.weapons).length > 0
      }
      if (traits.gear?.armor) {
        return Object.keys(traits.gear.armor).length > 0
      }
    }
    const data = {
      abilities: traits.abilities,
      talents: traits.talents,
      powers: traits.powers,
      threat: traits.threat,
      gear: traits.gear,
      showGear: showGear(),
      chosen: ''
    }

    const html = await renderTemplate(template, data);

    let selectedTrait = '';
    try {
      selectedTrait = await foundry.applications.api.DialogV2.prompt({
        window: { title: "Choose an option" },
        content: html,
        ok: {
          label: "Make Choice",
          callback: (event, button, dialog) => button.form.elements.trait.value
        }
      })
    } catch {
      return;
    }

    const options = {
      rollMode: game.settings.get('core', 'rollMode'),
      difficulty: 'opposed',
      difficultyNumber: roll.total - roll.options.difficultyNumber
    }

    const [type, id] = selectedTrait.split(':')
    if (!!id) {
      if (type === 'ability') {
        options.type = game.i18n.localize(traits.abilities[selectedTrait])
        controlledCharacter.roll(`system.abilities.${id}.value`, options)
      } else if (type === 'talent') {
        options.type = game.i18n.localize(traits.talents[selectedTrait])
        controlledCharacter.roll(`system.talents.${id}.value`, options)
      } else if (type === 'item') {
        const item = controlledCharacter.items.get(id)
        item.roll(options)
      }  else if (type === 'threat') {
        options.offense = true
        controlledCharacter.threatRoll(options)
      }
    }
  }
  Hooks.on("renderChatLog", (_app, html, _data) => {
    html.on("click", ".opposed-roll", opposedRoll);
  });
  Hooks.on("renderChatPopout", (_app, html, _data) => {
    html.on("click", ".opposed-roll", opposedRoll);
  });
}
