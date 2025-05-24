import { test, expect } from '@playwright/test';

export async function login(page) {
  // Navigate to the FoundryVTT login page
  await page.goto('http://localhost:30000/join');  // Replace with your actual FoundryVTT URL
    
  expect(page.getByText('prowlers-playwright')).toBeVisible(); // don't run tests if the wrong world is loaded
  // Additional steps for selecting role and joining session
  await page.getByRole('combobox').selectOption('Gamemaster');  // Adjust selector if the label differs
  await page.getByRole('button', { name: 'Join Game Session' }).click();  
} 