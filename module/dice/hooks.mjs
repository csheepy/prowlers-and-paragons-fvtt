import { getControlledCharacter } from "../helpers/tokens.mjs";

const hasGear = (traits) => {
  if (traits.gear?.weapons) {
    return Object.keys(traits.gear.weapons).length > 0;
  }
  if (traits.gear?.armor) {
    return Object.keys(traits.gear.armor).length > 0;
  }
  return false;
};

const showTraitSelectionDialog = async (traits, rollingAgainst) => {
  const template = 'systems/prowlers-and-paragons/templates/opposed-roll-trait-select.hbs';
  const data = {
    abilities: traits.abilities,
    talents: traits.talents,
    powers: traits.powers,
    threat: traits.threat,
    vehicle: traits.vehicle,
    gear: traits.gear,
    rollingAgainst,
    showGear: hasGear(traits),
    chosen: ''
  };

  const html = await renderTemplate(template, data);

  try {
    return await foundry.applications.api.DialogV2.prompt({
      window: { title: "Choose an option" },
      content: html,
      ok: {
        label: "Make Choice",
        callback: (event, button, dialog) => button.form.elements.trait.value
      }
    });
  } catch {
    return null;
  }
};

// Helper function to execute a trait roll
const executeTraitRoll = async (actor, selectedTrait, traits, options) => {
  const [type, id] = selectedTrait.split(':');
  if (!id) return;

  switch (type) {
    case 'ability':
      options.type = game.i18n.localize(traits.abilities[selectedTrait]);
      return await actor.roll(`system.abilities.${id}.value`, options);
    case 'talent':
      options.type = game.i18n.localize(traits.talents[selectedTrait]);
      return await actor.roll(`system.talents.${id}.value`, options);
    case 'item':
      const item = actor.items.get(id);
      return await item.roll(options);
    case 'threat':
      options.offense = options.offense ?? true;
      return await actor.threatRoll(options);
    case 'vehicle':
      options.type = game.i18n.localize(traits.vehicle[selectedTrait]);
      return await actor.roll(`system.${id}`, options);
  }
};

export const runDiceHooks = () => {
  // Add a custom "Reroll" button to the context menu
  Hooks.on("getChatLogEntryContext", (html, options) => {
    options.push({
      name: "Reroll",
      icon: '<i class="fas fa-dice"></i>',
      condition: (li) => {
        const message = game.messages.get(li.data("messageId"));
        return message?.rolls?.length > 0;
      },
      callback: async (li) => {
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
        const message = game.messages.get(li.data("messageId"));
        return message?.rolls?.length > 0;
      },
      callback: async (li) => {
        const message = game.messages.get(li.data("messageId"));
        const roll = message.rolls[0];
        if (roll) {
          await roll.explode();
        }
      },
    });
  });

  // chat message button to oppose something that was already rolled
  const chatOpposedRoll = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const chatMessageId = $(event.currentTarget).closest(".message").data("messageId");
    const chatMessage = game.messages.get(chatMessageId);
    if (!chatMessage) return ui.notifications.warn("Chat message not found!");

    const roll = chatMessage.rolls?.[0];
    if (!roll) return ui.notifications.warn("No roll found in this message!");

    const controlledCharacter = getControlledCharacter();
    if (!controlledCharacter) {
      return ui.notifications.warn("You must select or control a character!");
    }

    const traits = controlledCharacter.traitsForSelection();
    const selectedTrait = await showTraitSelectionDialog(traits, roll.options.type);
    if (!selectedTrait) return;

    const options = {
      rollMode: game.settings.get('core', 'rollMode'),
      difficulty: 'opposed',
      difficultyNumber: roll.total - roll.options.difficultyNumber,
      doOpposedRoll: false,
      originatingActorName: chatMessage.speaker.alias
    };

    return await executeTraitRoll(controlledCharacter, selectedTrait, traits, options);
  };

  Hooks.on("renderChatLog", (_app, html, _data) => {
    html.on("click", ".opposed-roll", chatOpposedRoll);
  });
  Hooks.on("renderChatPopout", (_app, html, _data) => {
    html.on("click", ".opposed-roll", chatOpposedRoll);
  });
};

// called when a roll is made with a target selected. this function is called for the target before the original roll is resolved
export const opposeRoll = async (targetActorId, originatingTraitName, originatingActorName) => {
  const targetActor = game.actors.get(targetActorId);
  const traits = targetActor.traitsForSelection();
  
  const selectedTrait = await showTraitSelectionDialog(traits, originatingTraitName);
  if (!selectedTrait) return;

  const options = {
    rollMode: game.settings.get('core', 'rollMode'),
    difficulty: 'opposed',
    difficultyNumber: 0,
    doOpposedRoll: false,
    originatingActorName,
    hideSuccesses: true,
  };

  return await executeTraitRoll(targetActor, selectedTrait, traits, options);
};
