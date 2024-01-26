/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';

test('backend running', async ({ page }) => {
  await page.goto('http://localhost:7766/api/health');
  await expect(page.locator('pre')).toContainText('{"apiVersion":"1","application":"stated"}');
});

test('create signature statement', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Create Statement' }).click();
  await page.getByLabel('Type', { exact: true }).click();
  await page.getByRole('option', { name: 'Sign PDF' }).click();
  await page.getByPlaceholder('imdba856CQZlcZVhxFt4RP/').fill('jkl');
  await page.getByPlaceholder('example.com').fill('localhost');
  await page.getByPlaceholder('Example Inc.').fill('localhost');
  await page.getByRole('button', { name: 'Show additional options' }).click();
  await page.getByRole('button', { name: 'Publish using an API key for' }).click();
  await page.getByPlaceholder('3CVAaK2c4WvcoYoYtKAoaoRGRrFrE3Sp').fill('XXX');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('#root')).toContainText('PDF file hash: jkl');
});
