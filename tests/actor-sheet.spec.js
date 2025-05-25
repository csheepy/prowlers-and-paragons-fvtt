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
            await page.evaluate(async (name) => {
                if (window.Actor) {
                    const actor = await window.Actor.create({ name: name, type: 'character' });
                    actor.createEmbeddedDocuments('Item', [{
                        name: 'Test Power',
                        type: 'power',
                        rank: 1,  // Initial value based on schema
                        rank_type: 'default',  // Example from schema choices
                        source: 'default',  // Example from schema
                        range: 'melee',  // Example from schema
                        cost: 5,  // Example initial value
                        // Add other fields as needed, e.g., connected_ability: 'agility'
                    }]);
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
                await characterSheet.getByTestId('play-tab').click();
                await expect(characterSheet.locator('input[name="system.abilities.agility.value"]').inputValue()).resolves.toBe(abilityValue);
                await expect(characterSheet.locator('input[name="system.talents.academics.value"]').inputValue()).resolves.toBe(talentValue);
            });

            test('should update spent hero points', async ({ characterSheet }) => {
                await expect(characterSheet.getByText(`Spent Hero Points: ${heroPoints}`)).toBeVisible();
            });

            test('clear package shoud reset spent points', async ({ characterSheet }) => {
                await characterSheet.getByTestId('package-tab').click();
                await characterSheet.getByRole('button', { name: 'Clear Package' }).click();
                await expect(characterSheet.getByText('Spent Hero Points: 0')).toBeVisible();

                await characterSheet.getByTestId('play-tab').click();
                await expect(characterSheet.locator('input[name="system.abilities.agility.value"]').inputValue()).resolves.toBe("0");
                await expect(characterSheet.locator('input[name="system.talents.academics.value"]').inputValue()).resolves.toBe("0");
            });
        });
    });


    // test the spend resolve button
    test.describe('spend resolve button', () => {
        test('should open the spend resolve menu', async ({ characterSheet }) => {
            await characterSheet.getByTestId('spend-resolve-btn').click();
            await expect(characterSheet.locator('.spend-resolve-dropdown')).toBeVisible();
        });

        test('hovering combat spend should show the combat spend options', async ({ characterSheet }) => {
            await characterSheet.getByTestId('spend-resolve-btn').click();

            await characterSheet.locator('.spend-resolve-dropdown').hover();
            await expect(characterSheet.locator('.spend-resolve-submenu')).toBeVisible();
        });

        test('should spend resolve', async ({ characterSheet }) => {
            await characterSheet.locator('input[name="system.resolve.value"]').fill('10');
            await characterSheet.locator('input[name="system.resolve.starting"]').fill('10');

            await characterSheet.getByTestId('spend-resolve-btn').click();
            const initialResolveValue = await characterSheet.locator('input[name="system.resolve.value"]').inputValue();
            const submenuOption = characterSheet.locator('.spend-resolve-submenu a.spend-resolve-option').first();
            await submenuOption.click();
            const updatedResolveValue = await characterSheet.locator('input[name="system.resolve.value"]').inputValue();
            await expect(Number(updatedResolveValue)).toBeLessThan(Number(initialResolveValue));  // Assuming spending resolve decreases the value
        });

        test('spending resolve with no resolve left should display an error', async ({ page, characterSheet }) => {
            await characterSheet.locator('input[name="system.resolve.value"]').fill('0');
            await characterSheet.locator('input[name="system.resolve.starting"]').fill('0');

            await characterSheet.getByTestId('spend-resolve-btn').click();
            await characterSheet.locator('.spend-resolve-option').first().click();
            await expect(page.getByText('No Resolve points remaining!')).toBeVisible();
        });

        test('reset button should reset resolve to starting value', async ({ characterSheet }) => {
            await characterSheet.locator('input[name="system.resolve.value"]').fill('10');
            await characterSheet.locator('input[name="system.resolve.starting"]').fill('10');

            // First, spend some resolve to change the value
            await characterSheet.getByTestId('spend-resolve-btn').click();

            const submenuOption = characterSheet.locator('.spend-resolve-submenu a.spend-resolve-option').first();
            await submenuOption.click();  // This should decrease resolve
            const startingResolveValue = await characterSheet.locator('input[name="system.resolve.starting"]').inputValue();

            await characterSheet.locator('.reset-resolve').click();  // Click the reset button
            const updatedResolveValue = await characterSheet.locator('input[name="system.resolve.value"]').inputValue();

            await expect(updatedResolveValue).toBe(startingResolveValue);  // Verify it matches the starting value
        });
    });

    // temporary buffs mode tests
    test.describe('temporary buffs mode', () => {
        test('entering temporary buffs mode should change the button text', async ({ characterSheet }) => {
            await characterSheet.locator('.temporary-buffs-btn').click();

            await expect(characterSheet.locator('.temporary-buffs-btn')).toHaveText('Return to Normal');
        });

        test('exiting temporary buffs mode should change the button text', async ({ characterSheet }) => {
            await characterSheet.locator('.temporary-buffs-btn').click();
            await characterSheet.locator('.temporary-buffs-btn').click();
            await expect(characterSheet.locator('.temporary-buffs-btn')).toHaveText('Enter Temporary Buffs Mode');
        });
        
        test('temporary buffs mode should show a notification upon entering', async ({ page,characterSheet }) => {
            await characterSheet.locator('.temporary-buffs-btn').click();
            await expect(page.getByText('Changes to abilities and talents will be temporary until you return to normal mode.')).toBeVisible();
        });

        test('changes to abilities and talents should be temporary', async ({ characterSheet }) => {
            await characterSheet.locator('.temporary-buffs-btn').click();
            await characterSheet.locator('input[name="system.abilities.agility.value"]').fill('10');
            await characterSheet.locator('input[name="system.abilities.agility.value"]').blur();
            await characterSheet.locator('.temporary-buffs-btn').click();
            await expect(characterSheet.locator('input[name="system.abilities.agility.value"]').inputValue()).resolves.toBe("0");
            await expect(characterSheet.locator('input[name="system.abilities.agility.value"]')).not.toHaveClass('highlighted-border');
        });

        test('temporary changes should gain the highlighted-border class', async ({ characterSheet }) => {
            await characterSheet.locator('.temporary-buffs-btn').click();

            const agilityInput = characterSheet.locator('input[name="system.abilities.agility.value"]');
            await agilityInput.fill('10');
            await agilityInput.blur();
            await expect(agilityInput).toHaveClass('highlighted-border');
        });
        
    });

    test.describe('rolling', () => {
         test('clicking an ability should open the roll modal', async ({ page, characterSheet }) => {
            await characterSheet.getByText('Agility').click();
            await expect(page.locator('.dialog-button.one')).toBeVisible();
         });

         test('clicking a talent should open the roll modal', async ({ page, characterSheet }) => {
            await characterSheet.getByText('Academics').click();
            await expect(page.locator('[data-button="one"]')).toBeVisible();
         });

         test('clicking a power should open the roll modal', async ({ page, characterSheet }) => {
            const actorName = await characterSheet.locator('input[name="name"]').inputValue();

            await characterSheet.getByText('Test Power').first().click();
            await expect(page.locator('[data-button="one"]')).toBeVisible();
         });
    });
}); 