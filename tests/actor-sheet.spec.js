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
                const actor = await Actor.create({ name: name, type: 'character' });
                actor.createEmbeddedDocuments('Item', [{
                    name: 'Test Power',
                    type: 'power',
                    rank: 1,
                    rank_type: 'default',
                }]);
            }
        }, actorName);
        await navigateToActorSheet(page, actorName);
        await use();  // End of setup
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
        { heroPackage: 'Superhero', heroPoints: 50, abilityValue: '3', talentValue: '3' },
        { heroPackage: 'Hero', heroPoints: 40, abilityValue: '3', talentValue: '2' },
        { heroPackage: 'Civilian', heroPoints: 35, abilityValue: '2', talentValue: '2' },
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
                await expect(characterSheet.locator('input[name="system.abilities.agility.value"]')).toHaveValue(abilityValue);
                await expect(characterSheet.locator('input[name="system.talents.academics.value"]')).toHaveValue(talentValue);
            });

            test('should update spent hero points', async ({ characterSheet }) => {
                await expect(characterSheet.getByText(`Spent Hero Points: ${heroPoints}`)).toBeVisible();
            });

            test('clear package should reset spent points', async ({ characterSheet }) => {
                await characterSheet.getByTestId('package-tab').click();
                await characterSheet.getByRole('button', { name: 'Clear Package' }).click();
                await expect(characterSheet.getByText('Spent Hero Points: 0')).toBeVisible();

                await characterSheet.getByTestId('play-tab').click();
                await expect(characterSheet.locator('input[name="system.abilities.agility.value"]')).toHaveValue('0');
                await expect(characterSheet.locator('input[name="system.talents.academics.value"]')).toHaveValue('0');
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

        test('should spend resolve', async ({ page, characterSheet }) => {
            const actorName = await characterSheet.locator('input[name="name"]').inputValue();
            await characterSheet.locator('input[name="system.resolve.value"]').fill('10');
            await characterSheet.locator('input[name="system.resolve.starting"]').fill('10');

            await characterSheet.getByTestId('spend-resolve-btn').click();
            const initialResolveValue = await characterSheet.locator('input[name="system.resolve.value"]').inputValue();
            const menuOption = characterSheet.locator('.spend-resolve-option').first();
            await menuOption.click();

            await page.getByRole('tab', { name: 'Chat Messages' }).click();
            await expect(page.getByText(`${actorName} spends Resolve`)).toBeVisible();

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
            const resolveValueSelector = characterSheet.locator('input[name="system.resolve.value"]');
            const resolveStartingSelector = characterSheet.locator('input[name="system.resolve.starting"]');
            await resolveValueSelector.fill('10')
            await resolveValueSelector.blur();
            await resolveStartingSelector.fill('10')
            await resolveStartingSelector.blur();


            // First, spend some resolve to change the value
            await characterSheet.getByTestId('spend-resolve-btn').click();

            const submenuOption = characterSheet.locator('.spend-resolve-submenu a.spend-resolve-option').first();
            await submenuOption.click();  // This should decrease resolve
            const startingResolveValue = await resolveStartingSelector.inputValue();

            await characterSheet.locator('.reset-resolve').click();  // Click the reset button
            const updatedResolveValue = await resolveValueSelector.inputValue();

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
            await expect(characterSheet.locator('input[name="system.abilities.agility.value"]')).toHaveValue('0');
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

    [{
        textSelector: 'Agility',
    },
    {
         textSelector: 'Academics',
    },
    {
        textSelector: 'Test Power',
    },]
    .forEach(({ textSelector }) => {
        test.describe(`rolling ${textSelector}`, () => {
            test(`should be able to roll ${textSelector} and then roll against it`, async ({ page, characterSheet }) => {
                const actorName = await characterSheet.locator('input[name="name"]').inputValue();
                await characterSheet.getByText(textSelector).first().click();
                await expect(page.locator('.dialog-button.one')).toBeVisible();

                await page.getByRole('combobox').selectOption('Average (1)');
                await page.locator('.dialog-button.one').click();

                await await page.getByRole('tab', { name: 'Chat Messages' }).click();

                const chatMessage = page.locator(`.chat-message:has-text("${actorName}")`);
                await expect(chatMessage).toContainText('Difficulty: Average (1)');
                await expect(chatMessage).toContainText(textSelector);
                await expect(chatMessage).toContainText('Opposed roll');

                // create a token for the actor
                await page.evaluate(async (actorName) => {
                    const scene = await game.scenes.getName('Foundry Virtual Tabletop');
                    await scene.update({active: true, navigation: true});
                    const actor = game.actors.getName(actorName);
                    if (actor && scene) {
                        await scene.createEmbeddedDocuments('Token', [{
                            actorId: actor.id,
                            x: 0,
                            y: 0,
                            name: actorName
                        }]);
                        const token = scene.tokens.getName(actorName);
                        await token.object.control({"releaseOthers": true});
                    }
                }, actorName);

                await chatMessage.getByText('Opposed roll').click();

                const opposedRollDialog = page.locator('.application.dialog');
                await expect(opposedRollDialog).toBeVisible();
                await expect(opposedRollDialog.locator('button:has-text("Make Choice")')).toBeVisible();

                for (const key in localizations['PROWLERS_AND_PARAGONS']['Ability']) {
                    const abilityName = localizations['PROWLERS_AND_PARAGONS']['Ability'][key]['long'];
                    await expect(opposedRollDialog.getByText(abilityName)).toBeVisible();
                }
        
                for (const key in localizations['PROWLERS_AND_PARAGONS']['Talent']) {
                    const talentName = localizations['PROWLERS_AND_PARAGONS']['Talent'][key];
                    await expect(opposedRollDialog.getByText(talentName)).toBeVisible();
                }
                await opposedRollDialog.getByText('Toughness').click();
                await opposedRollDialog.getByText('Make Choice').click();

                const secondRoll = page.locator('div:has-text("Rolling Toughness")');
                await expect(secondRoll).toContainText(`Roll against ${actorName}`);
                await expect(secondRoll).toContainText(`Opposed`);

                await secondRoll.getByText(`Roll against ${actorName}`).click();

                await expect(page.locator(`.chat-message:has-text("${actorName}"):has-text("Difficulty: Opposed")`)).toBeVisible();

                // token cleanup
                await page.evaluate(async (actorName) => { 
                    const scene = await game.scenes.getName('Foundry Virtual Tabletop');
                    await scene.tokens.getName(actorName).delete();
                }, actorName);
             });
        });
    });

    test.describe('sheet options', () => {
        test('should not update edge when disabled', async ({ characterSheet }) => {    
            await characterSheet.locator('input[name="system.abilities.agility.value"]').fill('10');
            await characterSheet.locator('input[name="system.abilities.agility.value"]').blur();
            await expect(characterSheet.locator('input[name="system.edge.value"]')).toHaveValue('10');

            await characterSheet.getByTestId('options-tab').click();
            await characterSheet.locator('input[name="system.edgeOverride"]').click();
            await characterSheet.locator('input[name="system.edgeOverride"]').blur();
            await characterSheet.locator('input[name="system.edge.value"]').fill('20');
            await characterSheet.locator('input[name="system.edge.value"]').blur();
            await expect(characterSheet.locator('input[name="system.edge.value"]')).toHaveValue('20');
        });

        test('max health should not update when health overrride is enabled', async ({ characterSheet }) => {    
            await characterSheet.locator('input[name="system.abilities.might.value"]').fill('10');
            await characterSheet.locator('input[name="system.abilities.might.value"]').blur();
            await expect(characterSheet.locator('input[name="system.health.max"]')).toHaveValue('5');

            await characterSheet.getByTestId('options-tab').click();
            await characterSheet.locator('input[name="system.healthOverride"]').click();
            await characterSheet.locator('input[name="system.healthOverride"]').blur();
            await characterSheet.locator('input[name="system.health.max"]').fill('20');
            await characterSheet.locator('input[name="system.health.max"]').blur();
            await expect(characterSheet.locator('input[name="system.health.max"]')).toHaveValue('20');
        });

        test('halve health should halve health', async ({ characterSheet }) => {
            await characterSheet.locator('input[name="system.abilities.might.value"]').fill('10');
            await characterSheet.locator('input[name="system.abilities.might.value"]').blur();
            await expect(characterSheet.locator('input[name="system.health.max"]')).toHaveValue('5');

            await characterSheet.getByTestId('options-tab').click();
            await characterSheet.locator('input[name="system.halveHealth"]').click();
            await characterSheet.locator('input[name="system.halveHealth"]').blur();
            await expect(characterSheet.locator('input[name="system.health.max"]')).toHaveValue('3');
            
        });
    });
})