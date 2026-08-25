import { expect, test } from "@playwright/test";

test("renders the application entry point", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Órdenes de servicio" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
});

test("admin creates an order and its technician completes it with traceability", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("nadmin");
  await page.getByLabel("Contraseña o PIN").fill("Admin!123456789");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/dashboard/);
  const customerResponse = await page.request.post("/api/customers", {
    data: {
      customerType: "PERSON",
      firstName: "Juan",
      lastName: "Pérez",
      primaryPhone: "099123456",
      subscriber: true,
    },
  });
  expect(customerResponse.ok()).toBeTruthy();
  const customer = (await customerResponse.json()).item;
  const installationResponse = await page.request.post("/api/installations", {
    data: {
      customerId: customer._id,
      name: "Casa",
      address: "Av. Italia 1234, Montevideo",
    },
  });
  const installation = (await installationResponse.json()).item;
  const systemResponse = await page.request.post("/api/systems", {
    data: {
      installationId: installation._id,
      type: "ALARM",
      brand: "DSC",
      model: "585",
      imei: "001234567890123",
    },
  });
  const system = (await systemResponse.json()).item;
  const users = (await (await page.request.get("/api/users")).json()).items;
  const technician = users.find((user) => user.username === "atecnico");
  const orderResponse = await page.request.post("/api/orders", {
    data: {
      externalOrderNumber: "EXIMIA-1001",
      customerId: customer._id,
      installationId: installation._id,
      responsibleTechnicianId: technician._id,
      scheduledDate: new Date().toISOString(),
      scheduledTime: "09:00",
      workDescription: "Mantenimiento alarma",
      technicianNote: "Verificar comunicación",
    },
  });
  expect(orderResponse.ok()).toBeTruthy();
  const order = (await orderResponse.json()).item;
  await page.request.post("/api/auth/logout");
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("atecnico");
  await page.getByLabel("Contraseña o PIN").fill("Tech!123456789");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/technician\/orders/);
  await page.getByText("Juan Pérez").click();
  await expect(
    page.getByRole("link", { name: "Abrir en Maps" }),
  ).toHaveAttribute("href", /google\.com\/maps/);
  await page.getByRole("button", { name: "INICIAR" }).click();
  await expect(page.getByText("Sincronizado")).toBeVisible();
  await page.getByText(/ALARM: DSC 585/).click();
  const brand = page.getByLabel("brand", { exact: true });
  await brand.fill("Hikvision");
  await page.getByRole("button", { name: "Guardar datos técnicos" }).click();
  await expect(page.getByText("Sincronizado")).toBeVisible();
  await page.getByRole("button", { name: "Realizada", exact: true }).click();
  await page
    .getByLabel("Observación")
    .fill("Se realizaron pruebas. Sistema operativo.");
  await page.getByRole("button", { name: "Confirmar resultado" }).click();
  await page.request.post("/api/auth/login", {
    data: { username: "nadmin", password: "Admin!123456789" },
  });
  const finalOrder = (
    await (await page.request.get(`/api/orders/${order._id}`)).json()
  ).item;
  expect(finalOrder.status).toBe("COMPLETED");
  expect(finalOrder.timeline.map((entry) => entry.action)).toEqual(
    expect.arrayContaining([
      "ORDER_CREATED",
      "ORDER_ASSIGNED",
      "ORDER_STARTED",
      "ORDER_COMPLETED",
    ]),
  );
  const updatedSystem = finalOrder.systems.find(
    (item) => item._id === system._id,
  );
  expect(updatedSystem.brand).toBe("Hikvision");
});
