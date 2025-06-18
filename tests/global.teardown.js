import { test as teardown } from '@playwright/test';
import { login } from './login-helper';

teardown('delete actors, tokens, and items', async ({ page }) => {
    await login(page);
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