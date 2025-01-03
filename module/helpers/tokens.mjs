function getActorsFromTargetedTokens(actor) {
    const targets = game.user.targets;
    if (!targets?.size) {
      return false;
    }
  
    return Array.from(targets).map((target) => target.actor);
  }
  
  export function getControlledCharacter() {
    if (game.user?.isGM !== true) {
      if (game.user?.character) {
        return game.user.character;
      } else {
        const playerId = game.userId;
        if (playerId !== null) {
          const character = game.actors?.find(a => (a.permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER ) && (a.type === "character") && !!a.getActiveTokens()[0]);
          if (character != null) {
            return game.actors?.get(character.id);
          }
        }
      }
    } else {
      // For GM, select actor as the selected character token
      if (canvas.tokens?.controlled !== undefined) {
        const selectedToken = canvas.tokens?.controlled.find(ct => (ct.actor?.type === "character" || ct.actor?.type === "minion"));//<Actor>(canvas.tokens?.controlled[0].actor);
        if (selectedToken) {
          return (selectedToken.actor);
        }
      }
    }
  }
  export { getActorsFromTargetedTokens };