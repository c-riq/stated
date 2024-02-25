/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test("backend running", async ({ page }) => {
  await page.goto("http://localhost:7766/api/health");
  await expect(page.locator("pre")).toContainText(
    '{"apiVersion":"1","application":"stated"}',
  );
});

test("create organisation verification statement", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByTestId("create-statement").click();
  await page.getByTestId("statement-type").click();
  await page.getByTestId("organisation-verification").click();
  await page.getByTestId("domain-to-be-verified").click();
  await page.keyboard.type("example.com");
  await page.getByTestId("organisation-name").click();
  await page.keyboard.type("test example inc.");
  await page.getByTestId("country").click();
  await page.keyboard.type("Germany");
  await page.getByTestId("city").click();
  await page.keyboard.type("Citiy 3");
  await page.getByTestId("confidence").click();
  await page.keyboard.type("0.3");

  await page.getByTestId("domain").click();
  await page.keyboard.type("localhost");
  await page.getByTestId("author").click();
  await page.keyboard.type("localhost");

  await page.getByTestId("show-additional-options").click();
  await page.getByTestId("publish-using-api-key").click();
  await page.getByTestId("api-key").click();
  await page.keyboard.type("XXX");
  await page.getByTestId("submit-statement").click();

  await expect(page.locator("#root")).toContainText("Name: test example inc.");
});
