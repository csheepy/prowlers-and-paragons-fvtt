import { socket } from "../prowlers-and-paragons.mjs";
import { setupSpendResourceMenuListeners } from '../helpers/spend-resource-menu.mjs';

export class ProwlersParagonsGMSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["prowlers-and-paragons", "sheet", "gm-sheet"],
      template: "systems/prowlers-and-paragons/templates/actor/actor-gm-sheet.hbs",
      width: 700,
      height: 600
    });
  }

  async getData() {

        // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toPlainObject();

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.config = CONFIG.PROWLERS_AND_PARAGONS
    context.characters = (context.system.character_ids || [])
      .map(id => game.actors.get(id))
      .filter(Boolean);
    return context;
  }

  canDragDrop(selector) {
    // Allow drag-and-drop anywhere on the sheet
    return true;
  }

  async _onDrop(event) {
    event.preventDefault();
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      ui.notifications.warn(`${err}`);
      return false;
    }
    // Only accept actors of type character
    if (data.type === "Actor" && data.uuid) {
      const actorId = foundry.utils.parseUuid(data.uuid).id;

      const actor = game.actors.get(actorId);
      console.log(actor)
      if (actor && actor.type === "character") {
        const ids = this.actor.system.character_ids || [];
        if (!ids.includes(actor.id)) {
          ids.push(actor.id);
          await this.actor.update({ "system.character_ids": ids });
          ui.notifications.info(`${actor.name} added to GM Sheet.`);
        } else {
          ui.notifications.warn(`${actor.name} is already on the GM Sheet.`);
        }
      }
    }
    return false;
  }

  activateListeners(html) {
    super.activateListeners(html);

    const actor = this.actor;

    // Award resolve
    html.on("click", ".award-resolve", async ev => {
      const charId = ev.currentTarget.dataset.charId;
      const actor = game.actors.get(charId);
      if (actor) {
        const current = actor.system.resolve.value || 0;
        await actor.update({ "system.resolve.value": current + 1 });
        this.render();
        if (game.modules.get("socketlib")?.active && socket) {
          socket.executeForEveryone("notifyAwardResolve", { actorName: actor.name });
        }
      }
    });

    // Remove character
    html.on("click", ".remove-character", async ev => {
      const charId = ev.currentTarget.dataset.charId;
      const ids = actor.system.character_ids.filter(id => id !== charId);
      await actor.update({ "system.character_ids": ids });
    });

    // Spend Adversity Menu Logic
    setupSpendResourceMenuListeners({
      html,
      actor,
      resourceField: 'adversity',
      resourceLabelKey: 'PROWLERS_AND_PARAGONS.GM.Adversity',
      noResourceKey: 'PROWLERS_AND_PARAGONS.GM.SpendAdversityMenu.NoAdversity',
      getActorName: (html) => html.find('h1').text() || 'The GM',
      onSpend: (option, actor, html) => {
        if (game.modules.get("socketlib")?.active && socket) {
          socket.executeForEveryone("notifySpendAdversity", { optionText: option });
        }
      }
    });
  }
} 