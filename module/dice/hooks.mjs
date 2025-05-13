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

const showTraitSelectionDialog = async (traits, rollingAgainst, rollingAgainstName) => {
  const template = 'systems/prowlers-and-paragons/templates/opposed-roll-trait-select.hbs';
  const data = {
    abilities: traits.abilities,
    talents: traits.talents,
    powers: traits.powers,
    threat: traits.threat,
    vehicle: traits.vehicle,
    gear: traits.gear,
    rollingAgainstTrait: rollingAgainst,
    rollingAgainstName: rollingAgainstName,
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
    const selectedTrait = await showTraitSelectionDialog(traits, roll.options.type, roll.options.originatingActorName);
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
    html.on("click", ".apply-damage-btn", toggleApplyDamageMenu);
    html.on("click", ".apply-damage-option", chatApplyDamage);
    
    // Add mousedown listener to close dropdown on outside click
    $(document).off('mousedown.applyDamageMenu').on('mousedown.applyDamageMenu', function (ev) {
      if (!$(ev.target).closest('.apply-damage-menu-container').length) {
        $('.apply-damage-dropdown').hide();
      }
    });
  });
  Hooks.on("renderChatPopout", (_app, html, _data) => {
    html.on("click", ".opposed-roll", chatOpposedRoll);
    html.on("click", ".apply-damage-btn", toggleApplyDamageMenu);
    html.on("click", ".apply-damage-option", chatApplyDamage);
    
    // Add mousedown listener to close dropdown on outside click
    $(document).off('mousedown.applyDamageMenu').on('mousedown.applyDamageMenu', function (ev) {
      if (!$(ev.target).closest('.apply-damage-menu-container').length) {
        $('.apply-damage-dropdown').hide();
      }
    });
  });

  // Add the new functions below the existing ones
  const toggleApplyDamageMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const button = $(event.currentTarget);
    const dropdown = button.siblings('.apply-damage-dropdown');
    
    // Dynamically get current selected and targeted tokens
    const selectedActor = getControlledCharacter();
    const targetedTokens = Array.from(game.user.targets);
    const selectedName = selectedActor ? selectedActor.name : 'None';
    const targetName = targetedTokens.length > 0 ? targetedTokens[0].name : 'None';
    
    // Update the dropdown content with current values
    dropdown.html(`
      <ul>
        <li class="apply-damage-option" data-option="selected">Apply to Selected Token (${selectedName})</li>
        <li class="apply-damage-option" data-option="target">Apply to Target (${targetName})</li>
      </ul>
    `);
    
    dropdown.toggle();
  };

  const chatApplyDamage = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const option = $(event.currentTarget).data('option');
    if (!option) return;
    $(event.currentTarget).closest('.apply-damage-dropdown').hide();

    const chatMessageId = $(event.currentTarget).closest('.message').data('messageId');
    const chatMessage = game.messages.get(chatMessageId);
    if (!chatMessage) return ui.notifications.warn('Chat message not found!');

    const roll = chatMessage.rolls?.[0];
    if (!roll || roll.netSuccess <= 0) return ui.notifications.warn('No valid roll to apply damage!');

    // const controlledCharacter = getControlledCharacter();
    // if (!controlledCharacter) return ui.notifications.warn('You must select or control a character!');

    let damagedActor;
    if (option === 'selected') {
      damagedActor = getControlledCharacter();
      if (!damagedActor) return ui.notifications.warn('You must select or control a character!');
    } else if (option === 'target') {
      const targetedTokens = Array.from(game.user.targets);
      if (targetedTokens.length > 0) {
        damagedActor = targetedTokens[0].actor;
      } else {
        return ui.notifications.warn('No target selected!');
      }
    }

    if (damagedActor) {
      const currentHealth = damagedActor.system.health.value || 0;
      const newHealth = Math.max(currentHealth - roll.netSuccess, 0);
      await damagedActor.update({ 'system.health.value': newHealth });
      ui.notifications.info(`Applied ${roll.netSuccess} damage to ${damagedActor.name}'s Health.`);
    }
  };
};

// called when a roll is made with a target selected. this function is called for the target before the original roll is resolved
export const opposeRoll = async (targetActorId, originatingTraitName, originatingActorName) => {
  const targetActor = game.actors.get(targetActorId);
  const traits = targetActor.traitsForSelection();
  
  const selectedTrait = await showTraitSelectionDialog(traits, originatingTraitName, originatingActorName);
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
