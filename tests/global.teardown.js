import { test as teardown, expect } from '@playwright/test';
import { login } from './login-helper';

teardown('delete actors, tokens, and items', async ({ page }) => {
  // Navigate to the FoundryVTT login page
  await page.goto('http://localhost:30000/join');  // Replace with your actual FoundryVTT URL
    
  await expect(page.getByText('prowlers-playwright')).toBeVisible();
  // Additional steps for selecting role and joining session
  await page.getByRole('combobox').selectOption('Gamemaster');  // Adjust selector if the label differs
  await page.getByRole('button', { name: 'Join Game Session' }).click();  


    await page.getByRole('tab', { name: 'Actors' }).click();
    await page.evaluate(async () => {
        if (window.game && window.game.actors) {
            for (const actor of window.game.actors) {
                await actor.delete();
            }
        } else {
            console.error('window.game or window.game.actors is undefined; skipping actor deletion.');
        }

        const scene = game.scenes.getName('Foundry Virtual Tabletop');
        for (const token of scene.tokens) {
            await token.delete();
        }

        for (const item of game.items) {
            await item.delete();
        }

    });
});