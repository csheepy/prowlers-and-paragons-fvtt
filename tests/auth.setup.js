import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { login } from './login-helper';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
    // await login(page);

      // Navigate to the FoundryVTT login page
  await page.goto('http://localhost:30000/join');  // Replace with your actual FoundryVTT URL
    
  expect(page.getByText('prowlers-playwright')).toBeVisible(); // don't run tests if the wrong world is loaded
  // Additional steps for selecting role and joining session
  await page.getByRole('combobox').selectOption('Gamemaster');  // Adjust selector if the label differs
  await page.getByRole('button', { name: 'Join Game Session' }).click();  

    await expect(page.locator('body')).toContainClass('system-prowlers-and-paragons');
    await page.context().storageState({ path: authFile });
}); 