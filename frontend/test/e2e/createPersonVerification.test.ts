/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';

test('backend running', async ({ page }) => {
  await page.goto('http://localhost:7766/api/health');
  await expect(page.locator('pre')).toContainText('{"apiVersion":"1","application":"stated"}');
});

test('create person verification', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Create Statement' }).click();
  await page.getByLabel('Type', { exact: true }).click();
  await page.getByRole('option', { name: 'Verify a person' }).click();
  await page.getByPlaceholder('Barack Hussein Obama II').fill('play wright');
  await page.getByLabel('Owns a website domain').uncheck();
  await page.getByPlaceholder('walmart.com').fill('localhost');
  await page.getByPlaceholder('mm/dd/yyyy').fill('01/01/1991');
  await page.getByLabel('Country of birth').click();
  await page.getByRole('option', { name: 'Albania' }).click();
  await page.getByLabel('City of birth').click();
  await page.getByRole('option', { name: 'Tirana' }).click();
  await page.getByPlaceholder('example.com').fill('localhost');
  await page.locator('.MuiBox-root > div > div').click();
  await page.getByPlaceholder('Example Inc.').fill('localhost');
  await page.getByRole('button', { name: 'Show additional options' }).click();
  await page.getByRole('button', { name: 'Publish using an API key for' }).click();
  await page.getByPlaceholder('3CVAaK2c4WvcoYoYtKAoaoRGRrFrE3Sp').fill('XXX');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByPlaceholder('search').fill('play wright');
  await page.getByPlaceholder('search').press('Enter');
  await expect(page.getByRole('heading', { name: 'Statements (1)' })).toBeVisible();
});