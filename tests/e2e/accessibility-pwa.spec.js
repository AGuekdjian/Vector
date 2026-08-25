import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const expectAccessible = async (page) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    results.violations
      .map((violation) => `${violation.id}: ${violation.help}`)
      .join("\n"),
  ).toEqual([]);
};

test("public and authenticated screens have no automated accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await expectAccessible(page);
  await page.goto("/login");
  await expectAccessible(page);
  await page.getByLabel("Usuario").fill("nadmin");
  await page.getByLabel("Contraseña o PIN").fill("Admin!123456789");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expectAccessible(page);
});

test("PWA manifest, icons and service worker form an installable public shell", async ({
  request,
}) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest).toEqual(
    expect.objectContaining({
      name: "Vector — Órdenes de servicio",
      start_url: "/",
      display: "standalone",
    }),
  );
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok()).toBeTruthy();
  }
  const workerResponse = await request.get("/sw.js");
  expect(workerResponse.ok()).toBeTruthy();
  const worker = await workerResponse.text();
  expect(worker).toContain("/api/sync");
  expect(worker).toContain("/_next/static/");
  expect(worker).not.toMatch(/caches\.put\([^)]*\/api\//);
});
