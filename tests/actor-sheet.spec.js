import { test as base, expect } from '@playwright/test';
import { login } from './login-helper';
import localizations from '../lang/en.json';

const navigateToActorTab = async (page) => {
    await login(page);
    await page.getByRole('tab', { name: 'Actors' }).click();
};

const navigateToActorSheet = async (page, actorName) => {
    await page.locator(`section#actors a:has-text("${actorName}")`).click();
};

const test = base.extend({
    actor: async ({ page }, use) => {
        // First, navigate to the Actors tab and then the actor sheet
        await navigateToActorTab(page);

        // Create the actor with logging
        await page.evaluate(() => {
            if (window.Actor) {
                window.Actor.create({
                    name: 'Tester',
                    type: 'character',
                });
            } else {
                console.error('window.Actor is not defined even after waiting');
            }
        });

        await page.waitForFunction(() => window.game && window.game.actors.getName('Tester') != null);
        await navigateToActorSheet(page, 'Tester');  // Assuming 'Tester' as a placeholder; adjust if needed

        await use();  // Signal that the fixture is ready
        
        // Teardown: Delete the actor
        await page.evaluate(() => {
            if (window.game && window.game.actors.getName('Tester')) {
                window.game.actors.getName('Tester').delete();
                console.log('Actor Tester deleted successfully');
            } else {
                console.error('Actor Tester not found for deletion');
            }
        });
    },
    characterSheet: async ({ page, actor }, use) => {
        // Now that navigation and actor creation are done, use the sheet
        await use(await page.locator('div.sheet'));  // Assuming this is the sheet locator
    }
});

test.describe('Character Sheet Functionality', () => {
    test('should load the character sheet and verify key elements', async ({ characterSheet }) => {
        await expect(characterSheet).toBeVisible();
        await expect(characterSheet.getByText('Abilities')).toBeVisible();
        await expect(characterSheet.getByText('Talents')).toBeVisible();

        for (const key in localizations['PROWLERS_AND_PARAGONS']['Ability']) {
            const abilityName = localizations['PROWLERS_AND_PARAGONS']['Ability'][key]['long'];
            await expect(characterSheet.getByText(abilityName)).toBeVisible();
        }

        for (const key in localizations['PROWLERS_AND_PARAGONS']['Talent']) {
            const talentName = localizations['PROWLERS_AND_PARAGONS']['Talent'][key];
            await expect(characterSheet.getByText(talentName)).toBeVisible();
        }
    });

    // test.describe('applying a package  ', () => {

    //     test('should update selected package label', async ({ page }) => {
    //     });

    //     test('should update abilities and talents', async ({ page }) => {
    //     });

    //     test('should update spent hero points', async ({ page }) => {
    //     });
    // });
}); 