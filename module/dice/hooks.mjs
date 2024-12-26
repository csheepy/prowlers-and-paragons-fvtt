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
                console.log(roll)
              const exploded = await roll.explode();
            }
          },
        });
      });
}
