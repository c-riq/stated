/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';

test('backend running', async ({ page }) => {
  await page.goto('http://localhost:7766/api/health');
  await expect(page.locator('pre')).toContainText('{"apiVersion":"1","application":"stated"}');
});

test('create organisation verification statement', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByTestId('create-statement').click();
  await page.getByTestId('statement-type').click();
  await page.getByTestId('poll').click();
  await page.getByTestId('poll-content').click();
  await page.keyboard.type('Why?');
  await page.getByTestId('option1').click()
  await page.keyboard.type('A');
  await page.getByTestId('option2').click()
  await page.keyboard.type('B');

  await page.getByTestId('domain').click()
  await page.keyboard.type('localhost');
  await page.getByTestId('author').click()
  await page.keyboard.type('localhost');

  await page.getByTestId('show-additional-options').click()
  await page.getByTestId('publish-using-api-key').click()
  await page.getByTestId('api-key').click()
  await page.keyboard.type('XXX');
  await page.getByTestId('submit-statement').click()

  await expect(page.locator('#root')).toContainText('Why?');
});

test('create vote statement', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByTestId('vote-on-poll').click();
  await page.getByTestId('option-2').click()

  await page.getByTestId('domain').click()
  await page.keyboard.type('localhost');
  await page.getByTestId('author').click()
  await page.keyboard.type('localhost');

  await page.getByTestId('show-additional-options').click()
  await page.getByTestId('publish-using-api-key').click()
  await page.getByTestId('api-key').click()
  await page.keyboard.type('XXX');
  await page.getByTestId('submit-statement').click()

  await page.waitForTimeout(500);
  await page.goto('http://localhost:3000/');
  await expect(page.locator('#root')).toContainText('Option: B');
});
