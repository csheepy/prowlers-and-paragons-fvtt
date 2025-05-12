import { getActorsFromTargetedTokens } from './tokens.mjs';

/**
 * Sets up an opposed roll by having the targeted actor roll first.
 * @param {Actor} actor - The actor initiating the opposed roll
 * @param {string} flavor - The name/description of what's being rolled
 * @returns {Promise<number|undefined>} The difficulty number for the opposed roll, or undefined if cancelled
 */
export async function setupOpposedRoll(actor, flavor) {
  if (!getActorsFromTargetedTokens().length === 1) return undefined;
  
  const difficulty = await actor.initiateOpposedRoll(flavor);
  if (difficulty === undefined) return undefined;
  
  return {
    difficulty: 'opposed',
    difficultyNumber: difficulty
  };
} 