import { getControlledCharacter } from "../helpers/tokens.mjs";
import { addEventListener } from "../helpers/html-events.mjs";
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

// helper function to get the chat message closest to an element
const getChatMessage = (element) => {
  const closestElement = element.closest('.message');
  const chatMessageId = closestElement ? closestElement.dataset.messageId : null;
  const chatMessage = game.messages.get(chatMessageId);

  if (!chatMessage) return ui.notifications.warn('Chat message not found!');

  return chatMessage;
}

// Helper function to execute a trait roll
const executeTraitRoll = async (actor, selectedTrait, traits, options) => {
  const [type, id] = selectedTrait.split(':');
  if (!id) return;

  let roll;
  let message;
  options.conditionsAffectingRoll = actor.conditionsAffectingRoll;
  switch (type) {
    case 'ability':
      options.type = game.i18n.localize(traits.abilities[selectedTrait]);
      ({roll, message} = await actor.roll(`system.abilities.${id}.value`, options));
      break;
    case 'talent':
      options.type = game.i18n.localize(traits.talents[selectedTrait]);
      ({roll, message} = await actor.roll(`system.talents.${id}.value`, options));
      break;
    case 'item':
      const item = actor.items.get(id);
      ({roll, message} = await item.roll(options));
      break;
    case 'threat':
      options.offense = options.offense ?? true;
      ({roll, message} = await actor.threatRoll(options));
      break;
    case 'vehicle':
      options.type = game.i18n.localize(traits.vehicle[selectedTrait]);
      ({roll, message} = await actor.roll(`system.${id}`, options));
      break;
  }

  return {roll, message};
};

export const runDiceHooks = () => {
  let hook = "getChatMessageContextOptions";
  if (parseInt(game.version.split('.')[0]) < 13) {
    hook = "getChatLogEntryContext";
  }
  // Add a custom "Reroll" button to the context menu
  Hooks.on(hook, (html, options) => {
    options.push({
      name: "Reroll",
      icon: '<i class="fas fa-dice"></i>',
      condition: (li) => {
        const message = game.messages.get(li?.dataset?.messageId || li.data('messageId'));
        return message?.rolls?.length > 0;
      },
      callback: async (li) => {
        const message = game.messages.get(li?.dataset?.messageId || li.data('messageId'));
        const roll = message.rolls[0];
        if (roll) {
          const reroll = await roll.reroll();
          const newMessage = await reroll.toMessage({speaker: roll.options.speaker, rollMode: roll.options.rollMode});
          if (message.getFlag('prowlers-and-paragons', 'opposedRolls')) {
            // make sure the new message gets the opposed rolls flags from the original
            await newMessage.setFlag('prowlers-and-paragons', 'opposedRolls', message.getFlag('prowlers-and-paragons', 'opposedRolls'));
            // modify rolls that opposed this one to update their difficulty/ recompute total
            for (const opposedId of message.getFlag('prowlers-and-paragons', 'opposedRolls')) {
              const opposedMessage = game.messages.get(opposedId);
              if (opposedMessage && opposedMessage.rolls[0]) {
                const opposedRoll = opposedMessage.rolls[0];
                opposedRoll.options.difficultyNumber = reroll.total - reroll.options.difficultyNumber;
                const updatedContent = await opposedRoll.render();  // Render the new roll to a string
      
                // Update the existing message with the new content
                await opposedMessage.update({
                  content: updatedContent,
                  rolls: [opposedRoll]
                });
              }
            }
          }
        }
      },
    });
  });

  Hooks.on(hook, (html, options) => {
    options.push({
      name: "Explode 6s",
      icon: '<i class="fas fa-dice"></i>',
      condition: (li) => {
        const message = game.messages.get(li?.dataset?.messageId || li.data('messageId'));
        return message?.rolls?.length > 0;
      },
      callback: async (li) => {
        const message = game.messages.get(li?.dataset?.messageId || li.data('messageId'));
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

    const chatMessage = getChatMessage(event.target);
    const controlledCharacter = getControlledCharacter();
    if (!controlledCharacter) {
      return ui.notifications.warn('You must select or control a character!');
    }
    const traits = controlledCharacter.traitsForSelection();
    const selectedTrait = await showTraitSelectionDialog(traits, chatMessage.rolls?.[0]?.options.type, chatMessage.speaker.alias);
    if (!selectedTrait) {
      return ui.notifications.warn('No trait selected!');
    };
    const options = {
      rollMode: game.settings.get('core', 'rollMode'),
      difficulty: 'opposed',
      difficultyNumber: chatMessage.rolls?.[0]?.total - chatMessage.rolls?.[0]?.options.difficultyNumber,
      doOpposedRoll: false,
      originatingActorName: chatMessage.speaker.alias,
      originatingMessageId: chatMessage.id,
      speaker: ChatMessage.getSpeaker({ actor: controlledCharacter.id })
    };
    return await executeTraitRoll(controlledCharacter, selectedTrait, traits, options);
  };

  const _registerChatEventListeners = (html) => {
    addEventListener(html, 'click', chatOpposedRoll, '.opposed-roll');
    addEventListener(html, 'click', toggleApplyDamageMenu, '.apply-damage-btn');
    addEventListener(html, 'click', toggleApplyConditionMenu, '.apply-condition-btn');
    addEventListener(html, 'click', chatApplyDamage, '.apply-damage-option');
    addEventListener(html, 'click', chatApplyCondition, '.apply-condition-option');

    const mousedownHandler = (ev) => {
      if (!ev.target.closest('.apply-damage-menu-container')) {
        const damageDropdowns = document.querySelectorAll('.apply-damage-dropdown');
        damageDropdowns.forEach(dropdown => dropdown.style.display = 'none');
        const conditionDropdowns = document.querySelectorAll('.apply-condition-dropdown');
        conditionDropdowns.forEach(dropdown => dropdown.style.display = 'none');
      }

    };
    
    document.removeEventListener('mousedown', mousedownHandler);
    document.addEventListener('mousedown', mousedownHandler);
  }
  Hooks.on('renderChatLog', (_app, html, _data) => {
    _registerChatEventListeners(html);
  });

  Hooks.on('renderChatPopout', (_app, html, _data) => {
    _registerChatEventListeners(html);
  });

  // Add the new functions below the existing ones
  const toggleApplyDamageMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.target;
    const dropdown = button.nextElementSibling;
    if (dropdown && dropdown.classList.contains('apply-damage-dropdown')) {
      const selectedActor = getControlledCharacter();
      const targetedTokens = Array.from(game.user.targets);
      const selectedName = selectedActor ? selectedActor.name : 'None';
      const targetName = targetedTokens.length > 0 ? targetedTokens[0].name : 'None';
      dropdown.innerHTML = `
        <ul>
          <li class="apply-damage-option" data-option="selected">Apply to Selected Token (${selectedName})</li>
          <li class="apply-damage-option" data-option="target">Apply to Target (${targetName})</li>
        </ul>
      `;
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
  };

  const toggleApplyConditionMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.target;
    const dropdown = button.nextElementSibling;
    if (dropdown && dropdown.classList.contains('apply-condition-dropdown')) {
      const chatMessage = getChatMessage(button);
      const roll = chatMessage.rolls?.[0];
      if (!roll || !roll.options.conditionsToApply || roll.options.conditionsToApply.length === 0) {
        dropdown.innerHTML = `<ul><li>${game.i18n.localize('PROWLERS_AND_PARAGONS.Chat.NoConditionsToApply')}</li></ul>`;
        dropdown.style.display = 'block';
        return;
      }

      const selectedActor = getControlledCharacter();
      const targetedTokens = Array.from(game.user.targets);
      const selectedName = selectedActor ? selectedActor.name : 'None';
      const targetName = targetedTokens.length > 0 ? targetedTokens[0].name : 'None';

      let conditionsHtml = '<ul>';
      for (const condition of roll.options.conditionsToApply) {
        const conditionLabel = condition.label || condition.name;
        conditionsHtml += `
          <li class="apply-condition-item" data-condition-name="${condition.name}">
            <span class="condition-label">${conditionLabel}</span>
            <ul class="apply-condition-target-dropdown" style="display: none;">
              <li class="apply-condition-option" data-option="selected" data-condition-id="${condition._id}">Apply to Selected Token (${selectedName})</li>
              <li class="apply-condition-option" data-option="target" data-condition-id="${condition._id}">Apply to Target (${targetName})</li>
            </ul>
          </li>
        `;
      }
      conditionsHtml += '</ul>';
      dropdown.innerHTML = conditionsHtml;
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';

      // Add mouseover/mouseout listeners for nested dropdowns
      const conditionItems = dropdown.querySelectorAll('.apply-condition-item');
      conditionItems.forEach(item => {
        item.addEventListener('mouseover', () => {
          const targetDropdown = item.querySelector('.apply-condition-target-dropdown');
          if (targetDropdown) targetDropdown.style.display = 'block';
        });
        item.addEventListener('mouseout', (event) => {
            // Check if the mouse is still within the parent li or its children
            if (!item.contains(event.relatedTarget)) {
                const targetDropdown = item.querySelector('.apply-condition-target-dropdown');
                if (targetDropdown) targetDropdown.style.display = 'none';
            }
        });
      });
    }
  };

  // helper function to get the actor according to the option selected
  const getActorFromOption = (option) => {
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
    return damagedActor;
  }

  const chatApplyCondition = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    let optionElement = event.target;
    if (parseInt(game.version.split('.')[0]) < 13 && typeof jQuery !== 'undefined' && optionElement instanceof jQuery) {
        optionElement = optionElement[0];  // Convert jQuery object to plain DOM element
    }
    const option = optionElement.dataset.option;
    const conditionId = optionElement.dataset.conditionId;
    if (!option || !conditionId) return;

    const dropdown = optionElement.closest('.apply-condition-dropdown');
    if (dropdown) dropdown.style.display = 'none';

    const chatMessage = getChatMessage(optionElement);

    const roll = chatMessage.rolls?.[0];
    if (!roll || !roll.options.conditionsToApply) return ui.notifications.warn('No conditions found on roll!');

    const conditionToApply = roll.options.conditionsToApply.find(c => c._id === conditionId);
    if (!conditionToApply) return ui.notifications.warn(`Condition '${conditionId}' not found on roll.`);

    const damagedActor = getActorFromOption(option);

    if (!damagedActor) return;

    const durationRounds = Math.ceil(roll.netSuccess / 2);
    const updatedCondition = foundry.utils.mergeObject(conditionToApply, { duration: { rounds: durationRounds } });
    const existingCondition = damagedActor.conditions.find(c => c.name === updatedCondition.name);
    if (existingCondition) {
      await existingCondition.update({ 'duration.rounds': durationRounds + existingCondition.duration.rounds });
    } else {
      updatedCondition.changes.forEach(change => {
        if (change.key === 'opposedTrait') {
          const opposedMessage = game.messages.find(m => m.getFlag('prowlers-and-paragons', 'opposedRolls')?.includes(chatMessage.id));
          if (opposedMessage) {
            change.key = opposedMessage.rolls?.[0]?.options.trait;
          }
        }
      });
      await damagedActor.createEmbeddedDocuments('ActiveEffect', [updatedCondition]);
    }
  }

  const chatApplyDamage = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    let optionElement = event.target;
    if (parseInt(game.version.split('.')[0]) < 13 && typeof jQuery !== 'undefined' && optionElement instanceof jQuery) {
        optionElement = optionElement[0];  // Convert jQuery object to plain DOM element
    }
    const option = optionElement.dataset.option;
    if (!option) return;
    const dropdown = optionElement.closest('.apply-damage-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    const chatMessage = getChatMessage(optionElement);
    
    const roll = chatMessage.rolls?.[0];
    if (!roll || roll.netSuccess <= 0) return ui.notifications.warn('No valid roll to apply damage!');

    const damagedActor = getActorFromOption(option);
    if (damagedActor && damagedActor.system.health) {
      const currentHealth = damagedActor.system.health.value || 0;
      const newHealth = Math.max(currentHealth - roll.netSuccess, 0);
      await damagedActor.update({ 'system.health.value': newHealth });
      ui.notifications.info(`Applied ${roll.netSuccess} damage to ${damagedActor.name}'s Health.`);
    } else if (damagedActor && damagedActor.system.count) {
      const currentCount = damagedActor.system.count || 0;
      const newCount = Math.max(currentCount - roll.netSuccess, 0);
      await damagedActor.update({ 'system.count': newCount });
      ui.notifications.info(`Applied ${roll.netSuccess} damage to ${damagedActor.name}'s Count.`);
    }
  };
};

// called when a roll is made with a target selected. this function is called for the target before the original roll is resolved
export const opposeRoll = async (tokenID, originatingTraitName, originatingActorName) => {
  const targetToken = canvas.tokens.get(tokenID);
  const targetActor = targetToken.actor;
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
