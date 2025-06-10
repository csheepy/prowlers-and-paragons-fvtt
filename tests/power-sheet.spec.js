import { test as base, expect } from '@playwright/test';
import { login } from './login-helper';

const navigateToItemTab = async (page) => {
    await login(page);
    await page.getByRole('tab', { name: 'Items' }).click();
};

// Helper to navigate to the item sheet from the Items directory
const navigateToItem = async (page, itemName) => {
    const directory = page.locator('.directory-list');
    await directory.getByText(itemName).click();
};

const test = base.extend({
    powerTest: async ({ page }, use) => {
        await navigateToItemTab(page);
        const powerName = `Test Power ${crypto.randomUUID()}`;
        
        // Create the item directly in the world
        await page.evaluate(async (powerName) => {
            await window.Item.create({
                name: powerName,
                type: 'power',
                system: {
                    rank: 5,
                    rank_type: 'power',
                    source: 'psychic',
                    range: 'ranged',
                    cost: 1
                }
            });
        }, powerName);

        // Navigate to the item's sheet
        await navigateToItem(page, powerName);
        
        await use({
            sheet: page.locator('.prowlers-and-paragons.sheet.item'),
            powerName
        });
    }
});

test.describe('Power Sheet Functionality', () => {
    test('should load the power sheet and verify key elements', async ({ powerTest }) => {
        const { sheet } = powerTest;
        await expect(sheet).toBeVisible();
        await expect(sheet.getByRole('tab', { name: 'Description' })).toBeVisible();
        await expect(sheet.getByRole('tab', { name: 'Attributes' })).toBeVisible();
        await expect(sheet.getByRole('tab', { name: 'Effects/Pros and Cons' })).toBeVisible();

        await sheet.getByRole('tab', { name: 'Attributes' }).click();
        const attributesTab = sheet.locator('.tab.attributes');
        await expect(attributesTab.getByText('Rank', {exact: true})).toBeVisible();
        await expect(attributesTab.getByText('Source', {exact: true})).toBeVisible();
        await expect(attributesTab.getByText('Range', {exact: true})).toBeVisible();
        await expect(attributesTab.getByText('Cost Per Rank', {exact: true})).toBeVisible();
        await expect(attributesTab.getByText('Toggleable', {exact: true})).toBeVisible();
    });

    test('should update text and number fields', async ({ page, powerTest }) => {
        const { sheet } = powerTest;
    
        const newPowerName = `Updated Power ${crypto.randomUUID()}`;
        const newShortDesc = 'A new description';
        const newRank = '10';
    
        await sheet.getByRole('textbox', { name: 'Name', exact: true }).fill(newPowerName);
        await sheet.getByRole('tab', { name: 'Attributes', exact: true }).click();
        await sheet.locator('input[name="system.shortDescription"]').fill(newShortDesc);
        await sheet.locator('input[name="system.rank"]').clear();
        await sheet.locator('input[name="system.rank"]').fill(newRank);
        await sheet.locator('input[name="system.rank"]').blur();
        
        // Close the sheet
        await sheet.locator('a.header-button.close').click();
        
        // Re-open it from the Items directory
        await navigateToItem(page, newPowerName);
    
        // Re-get the sheet locator since the element was recreated
        const updatedSheet = page.locator('.prowlers-and-paragons.sheet.item');

        await expect(updatedSheet.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(newPowerName);
        await updatedSheet.getByRole('tab', { name: 'Attributes', exact: true }).click();
        await expect(updatedSheet.locator('input[name="system.shortDescription"]')).toHaveValue(newShortDesc);
        await expect(updatedSheet.locator('input[name="system.rank"]')).toHaveValue(newRank);
    });

    test.describe('Rank Type Logic', () => {
        test.beforeEach(async ({ powerTest }) => {
            await powerTest.sheet.getByRole('tab', { name: 'Attributes' }).click();
        });

        test('should hide rank when type is default', async ({ powerTest }) => {
            const { sheet } = powerTest;
            await sheet.locator('select[name="system.rank_type"]').selectOption('default');
            await expect(sheet.locator('input[name="system.rank"]')).toBeHidden();
            await expect(sheet.getByText('Cost', { exact: true })).toBeVisible();
        });
    
        test('should show conditional fields for baseline type', async ({ powerTest }) => {
            const { sheet } = powerTest;
            await sheet.locator('select[name="system.rank_type"]').selectOption('baseline');
            await expect(sheet.locator('select[name="system.connected_ability"]')).toBeVisible();
            await expect(sheet.getByText('Half Scaling')).toBeVisible();
            await expect(sheet.getByText('Special Base Value')).toBeVisible();
        });
    });

    test.describe('Charges Logic', () => {
        test.beforeEach(async ({ powerTest }) => {
            const { sheet } = powerTest;
            await sheet.getByRole('tab', { name: 'Attributes' }).click();
            await sheet.locator('input[name="system.hasCharges"]').check();
        });
    
        test('should show charge inputs when enabled', async ({ powerTest }) => {
            const { sheet } = powerTest;
            await expect(sheet.getByText('Current', {exact: true})).toBeVisible();
            await expect(sheet.getByText('Max', {exact: true})).toBeVisible();
        });
    
        test('should enforce max charges', async ({ powerTest }) => {
            const { sheet } = powerTest;
            const maxInput = sheet.locator('input[name="system.charges.max"]');
            const valueInput = sheet.locator('input[name="system.charges.value"]');
    
            await maxInput.fill('5');
            await maxInput.blur();
            await valueInput.fill('10');
            await valueInput.blur(); 
    
            await expect(valueInput).toHaveValue('5');
        });
    
        test('should enforce min charges (0)', async ({ powerTest }) => {
            const { sheet } = powerTest;
            const valueInput = sheet.locator('input[name="system.charges.value"]');
            await valueInput.fill('-5');
            await valueInput.blur();
            await expect(valueInput).toHaveValue('0');
        });
    });

    test.describe('Drop Functionality', () => {
        test('dropping a pro/con should add an effect', async ({ page, powerTest }) => {
            const { sheet } = powerTest;
            const proconName = `Test ProCon ${crypto.randomUUID()}`;
    
            await page.evaluate(async (name) => {
                await Item.create({
                    name,
                    type: 'procon',
                    system: { kind: 'pro', cost_flat: -1 }
                });
            }, proconName);
    
            const proconItem = page.locator('.directory-list').getByText(proconName);
            const dropTarget = sheet.locator('.sheet-body');
    
            await proconItem.dragTo(dropTarget);
    
            await sheet.getByRole('tab', { name: 'Effects/Pros and Cons' }).click();
            const effect = sheet.locator('.effect', { hasText: proconName });
            await expect(effect).toBeVisible();
        });
    
        test('dropping a condition should add its effects', async ({ page, powerTest }) => {
            const { sheet } = powerTest;
            const conditionName = `Test Condition ${crypto.randomUUID()}`;
            const effectName = 'Dazed';
    
            await page.evaluate(async ({ conditionName, effectName }) => {
                const condition = await Item.create({
                    name: conditionName,
                    type: 'condition'
                });
                await condition.createEmbeddedDocuments('ActiveEffect', [{
                    name: effectName,
                    changes: [{ key: 'kind', value: 'condition', mode: 0 }]
                }]);
            }, { conditionName, effectName });
    
            const conditionItem = page.locator('.directory-list').getByText(conditionName);
            const dropTarget = sheet.locator('.sheet-body');
    
            await conditionItem.dragTo(dropTarget);
    
            await sheet.getByRole('tab', { name: 'Effects/Pros and Cons' }).click();
            const effect = sheet.locator('.effect', { hasText: effectName });
            await expect(effect).toBeVisible();
        });
    });
});
