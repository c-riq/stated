/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';

test('backend running', async ({ page }) => {
  await page.goto('http://localhost:7766/api/health');
  await expect(page.locator('pre')).toContainText('{"apiVersion":"1","application":"stated"}');
});

test('has title', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveTitle(/Stated/);
});

test('create simple statement', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Create Statement' }).click();
  await expect(page.getByRole('heading', { name: 'Create Statement' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Statement' }).fill('test basic statement');
  await page.locator('#domain').fill('localhost');
  await page.getByPlaceholder('Example Inc.').fill('localhost');
  await page.getByRole('button', { name: 'Show additional options' }).click();
  await page.getByRole('button', { name: 'Publish using an API key for localhost' }).click();
  await page.getByPlaceholder('3CVAaK2c4WvcoYoYtKAoaoRGRrFrE3Sp').fill('XXX');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByPlaceholder('search').fill('test basic statement');
  await page.getByPlaceholder('search').press('Enter');
  await expect(page.getByRole('heading', { name: 'Statements (1)' })).toBeVisible();
});
