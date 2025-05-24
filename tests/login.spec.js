import { test, expect } from '@playwright/test';
import { login } from './login-helper';

test('should log into FoundryVTT', async ({ page }) => {
  await login(page);
  await expect(page.locator('body')).toContainClass('system-prowlers-and-paragons');
});
