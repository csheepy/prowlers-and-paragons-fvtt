import { test as base, expect } from '@playwright/test';
import { login } from './login-helper';
import localizations from '../lang/en.json';

const navigateToActorTab = async (page) => {
    await login(page);
    await page.getByRole('tab', { name: 'Actors' }).click();
};

const navigateToActorSheet = async (page, actorName) => {
    const locator = page.getByText(actorName);
    await locator.click();
};

const test = base.extend({
    actor: async ({ page }, use) => {
        let actorName;
        try {
            actorName = crypto.randomUUID();
            await navigateToActorTab(page);
            await page.evaluate((name) => {
                if (window.Actor) {
                    window.Actor.create({ name: name, type: 'character' });
                } else {
                    Actor.create({ name: name, type: 'character' });
                }
            }, actorName);
            await navigateToActorSheet(page, actorName);
            await use();  // End of setup
        } finally {
            if (actorName) {
                await page.evaluate((name) => {
                    if (window.game && window.game.actors.getName(name)) {
                        window.game.actors.getName(name).delete();
                        console.log('Actor ' + name + ' deleted successfully');
                    } else {
                        console.error('Actor ' + name + ' not found for deletion');
                    }
                }, actorName);
            }
        }
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

    [
        { heroPackage: 'Superhero', heroPoints: 50, abilityValue: "3", talentValue: "3" },
        { heroPackage: 'Hero', heroPoints: 40, abilityValue: "3", talentValue: "2" },
        { heroPackage: 'Civilian', heroPoints: 35, abilityValue: "2", talentValue: "2" },
    ].forEach(({ heroPackage, heroPoints, abilityValue, talentValue }) => {
        test.describe(`applying a package ${heroPackage}`, () => {
            test.beforeEach(async ({ characterSheet }) => {
                await characterSheet.getByTestId('package-tab').click();
                const buttonLocator = characterSheet.getByRole('button', { name: heroPackage, exact: true });
                await buttonLocator.click();
             });

            test('should update selected package label', async ({ characterSheet }) => {
                await expect(characterSheet.getByText(`Currently selected package: ${heroPackage}`)).toBeVisible();
            });

            test('should update abilities and talents', async ({ characterSheet }) => {
                await characterSheet.getByRole('tab', { name: 'Play' }).click();
                await expect(characterSheet.locator('input[name="system.abilities.agility.value"]').inputValue()).resolves.toBe(abilityValue);
                await expect(characterSheet.locator('input[name="system.talents.academics.value"]').inputValue()).resolves.toBe(talentValue);
            });

            test('should update spent hero points', async ({ characterSheet }) => {
                await expect(characterSheet.getByText(`Spent Hero Points: ${heroPoints}`)).toBeVisible();
            });
        });
    });
}); 